import { formatNumber, formatPercentage } from 'common/format';
import SPELLS from 'common/SPELLS';
import { TALENTS_MONK } from 'common/TALENTS';
import { SpellLink } from 'interface';
import { PerformanceMark } from 'interface/guide';
import CooldownExpandable, {
  CooldownExpandableItem,
} from 'interface/guide/components/CooldownExpandable';
import { explanationAndDataSubsection } from 'interface/guide/components/ExplanationRow';
import { Options, SELECTED_PLAYER, SELECTED_PLAYER_PET } from 'parser/core/Analyzer';
import Events, {
  CastEvent,
  DamageEvent,
  EndChannelEvent,
  GlobalCooldownEvent,
  HealEvent,
  RefreshBuffEvent,
} from 'parser/core/Events';
import BoringValueText from 'parser/ui/BoringValueText';
import ItemHealingDone from 'parser/ui/ItemHealingDone';
import { getLowestPerf, QualitativePerformance } from 'parser/ui/QualitativePerformance';
import Statistic from 'parser/ui/Statistic';
import StatisticListBoxItem from 'parser/ui/StatisticListBoxItem';
import STATISTIC_CATEGORY from 'parser/ui/STATISTIC_CATEGORY';
import STATISTIC_ORDER from 'parser/ui/STATISTIC_ORDER';
import { MAX_CHIJI_STACKS } from '../../constants';
import BaseCelestialAnalyzer, { BaseCelestialTracker } from './BaseCelestialAnalyzer';
import EssenceFont from './EssenceFont';

/**
 * Blackout Kick, Totm BoKs, Rising Sun Kick and Spinning Crane Kick generate stacks of Invoke Chi-Ji, the Red Crane, which reduce the cast time and mana
 * cost of Enveloping Mist by 33% per stack, up to 3 stacks.
 * These abilities also heal 2 nearby allies for a Gust of Mist heal.
 * Casting Enveloping Mist while Chiji is active applies Enveloping Breath on up to 6 nearby allies within 10 yards.
 */

interface ChijiCastTracker extends BaseCelestialTracker {
  recastEf: boolean; // true if player recast ef during chiji
  overcappedTotmStacks: number;
  overcappedChijiStacks: number;
}

class InvokeChiJi extends BaseCelestialAnalyzer {
  protected ef!: EssenceFont;
  castTrackers: ChijiCastTracker[] = [];
  //healing breakdown vars
  gustHealing: number = 0;
  envelopHealing: number = 0;
  //stack breakdown vars
  chijiStackCount: number = 0;
  castsBelowMaxStacks: number = 0;
  wastedStacks: number = 0;
  freeCasts: number = 0;
  //missed GCDs vars
  missedGlobals: number = 0;
  chijiStart: number = 0;
  chijiGlobals: number = 0;
  chijiUses: number = 0;
  lastGlobal: number = 0;
  efGcd: number = 0;
  checkForSckDamage: number = -1;
  castBokInWindow: boolean = false;

  get totalHealing() {
    return this.gustHealing + this.envelopHealing;
  }

  constructor(options: Options) {
    super(options);
    this.active = this.selectedCombatant.hasTalent(TALENTS_MONK.INVOKE_CHI_JI_THE_RED_CRANE_TALENT);
    if (!this.active) {
      return;
    }
    this.addEventListener(
      Events.heal.by(SELECTED_PLAYER).spell(SPELLS.GUST_OF_MISTS_CHIJI),
      this.handleGust,
    );
    this.addEventListener(
      Events.heal.by(SELECTED_PLAYER).spell(SPELLS.ENVELOPING_BREATH_HEAL),
      this.handleEnvelopingBreath,
    );
    this.addEventListener(
      Events.cast.by(SELECTED_PLAYER).spell(TALENTS_MONK.ENVELOPING_MIST_TALENT),
      this.handleEnvelopCast,
    );
    this.addEventListener(
      Events.cast.by(SELECTED_PLAYER).spell(TALENTS_MONK.INVOKE_CHI_JI_THE_RED_CRANE_TALENT),
      this.handleChijiStart,
    );
    this.addEventListener(
      Events.damage
        .by(SELECTED_PLAYER)
        .spell([
          SPELLS.BLACKOUT_KICK,
          SPELLS.RISING_SUN_KICK_DAMAGE,
          SPELLS.BLACKOUT_KICK_TOTM,
          SPELLS.SPINNING_CRANE_KICK_DAMAGE,
        ]),
      this.handleStackGenerator,
    );
    //need a different eventlistener beacause chiji currently only applies 1 stack per cast of sck, not on each dmg event
    this.addEventListener(
      Events.GlobalCooldown.by(SELECTED_PLAYER).spell(SPELLS.SPINNING_CRANE_KICK),
      this.handleSpinningCraneKick,
    );
    this.addEventListener(Events.GlobalCooldown.by(SELECTED_PLAYER), this.handleGlobal);
    this.addEventListener(
      Events.EndChannel.by(SELECTED_PLAYER).spell(TALENTS_MONK.ESSENCE_FONT_TALENT),
      this.handleEssenceFontEnd,
    );
    this.addEventListener(
      Events.cast.by(SELECTED_PLAYER).spell(TALENTS_MONK.RISING_SUN_KICK_TALENT),
      this.onRSK,
    );
    this.addEventListener(
      Events.cast.by(SELECTED_PLAYER).spell(SPELLS.SPINNING_CRANE_KICK),
      this.onRSK,
    );
    this.addEventListener(Events.cast.by(SELECTED_PLAYER).spell(SPELLS.BLACKOUT_KICK), this.onBOK);
    this.addEventListener(
      Events.refreshbuff.by(SELECTED_PLAYER).spell(SPELLS.TEACHINGS_OF_THE_MONASTERY),
      this.onTotmRefresh,
    );
    this.addEventListener(Events.death.to(SELECTED_PLAYER_PET), this.removeSi);
  }

  //missed gcd mangement
  handleChijiStart(event: CastEvent) {
    this.celestialActive = true;
    this.chijiStart = this.lastGlobal = event.timestamp;
    this.chijiGlobals += 1;
    this.chijiUses += 1;
    this.castBokInWindow = false;
    this.castTrackers.push({
      timestamp: event.timestamp,
      totmStacks: this.selectedCombatant.getBuffStacks(SPELLS.TEACHINGS_OF_THE_MONASTERY.id),
      numEfHots: this.ef.curBuffs,
      overcappedChijiStacks: 0,
      overcappedTotmStacks: 0,
      lessonsDuration: 0,
      infusionDuration: 0,
      recastEf: false,
      totalEnvB: 0,
      totalEnvM: 0,
      averageHaste: 0,
      deathTimestamp: 0,
    });
  }

  onRSK(event: CastEvent) {
    if (!this.celestialActive) {
      return;
    }
    if (
      this.selectedCombatant.getBuffStacks(SPELLS.INVOKE_CHIJI_THE_RED_CRANE_BUFF.id) ===
      MAX_CHIJI_STACKS
    ) {
      console.log('wasted chiji stack at ', this.owner.formatTimestamp(event.timestamp));
      this.castTrackers.at(-1)!.overcappedChijiStacks += 1;
    }
  }

  onBOK(event: CastEvent) {
    if (!this.celestialActive) {
      return;
    }
    if (!this.castBokInWindow) {
      this.castBokInWindow = true;
      return;
    }
    const stacksGained =
      1 + this.selectedCombatant.getBuffStacks(SPELLS.TEACHINGS_OF_THE_MONASTERY.id);
    if (
      this.selectedCombatant.getBuffStacks(SPELLS.INVOKE_CHIJI_THE_RED_CRANE_BUFF.id) +
        stacksGained >
      MAX_CHIJI_STACKS
    ) {
      console.log('wasted chiji stack at ', this.owner.formatTimestamp(event.timestamp));
      this.castTrackers.at(-1)!.overcappedChijiStacks +=
        this.selectedCombatant.getBuffStacks(SPELLS.INVOKE_CHIJI_THE_RED_CRANE_BUFF.id) +
        stacksGained -
        MAX_CHIJI_STACKS;
    }
  }

  onSCK(event: CastEvent) {
    if (!this.celestialActive) {
      return;
    }
    if (this.selectedCombatant.getBuffStacks(SPELLS.INVOKE_CHIJI_THE_RED_CRANE_BUFF.id) === 3) {
      this.castTrackers.at(-1)!.overcappedChijiStacks += 1;
      console.log('wasted chiji stack at ', this.owner.formatTimestamp(event.timestamp));
    }
  }

  onTotmRefresh(event: RefreshBuffEvent) {
    if (this.celestialActive) {
      console.log('wasted stack at ', this.owner.formatTimestamp(event.timestamp));
      this.castTrackers.at(-1)!.overcappedTotmStacks += 1;
    }
  }

  handleGlobal(event: GlobalCooldownEvent) {
    if (this.celestialActive) {
      this.chijiGlobals += 1;
      //if timebetween globals is longer than the gcd add the difference to the missed gcd tally
      //we only care about accounting casts of essence font or fls, other than that it should be the gcd during chiji
      if (
        event.ability.guid === TALENTS_MONK.ESSENCE_FONT_TALENT.id ||
        event.ability.guid === TALENTS_MONK.FAELINE_STOMP_TALENT.id
      ) {
        this.efGcd = event.duration;
      } else if (event.timestamp - this.lastGlobal > event.duration) {
        this.missedGlobals += (event.timestamp - this.lastGlobal - event.duration) / event.duration;
      }
      this.lastGlobal = event.timestamp;
    }
  }

  handleEssenceFontEnd(event: EndChannelEvent) {
    if (this.celestialActive) {
      if (event.duration > this.efGcd) {
        this.lastGlobal = event.timestamp - this.efGcd;
      } else {
        this.lastGlobal = event.start + this.efGcd;
      }
    }
  }

  //healing management
  handleGust(event: HealEvent) {
    this.gustHealing += (event.amount || 0) + (event.absorbed || 0);
  }

  handleEnvelopingBreath(event: HealEvent) {
    this.envelopHealing += (event.amount || 0) + (event.absorbed || 0);
  }

  //stackbreakown management
  handleStackGenerator(event: DamageEvent) {
    if (this.celestialActive) {
      if (event.ability.guid === SPELLS.SPINNING_CRANE_KICK_DAMAGE.id) {
        if (this.checkForSckDamage > event.timestamp) {
          this.stackCount();
          this.checkForSckDamage = -1;
        }
      } else {
        this.stackCount();
      }
    }
  }

  handleSpinningCraneKick(event: GlobalCooldownEvent) {
    if (this.celestialActive) {
      this.checkForSckDamage = event.duration + this.lastGlobal;
    }
  }

  handleEnvelopCast(event: CastEvent) {
    //in some cases the last envelop is cast after chiji has expired but the buff can still be consumed
    if (
      this.celestialActive ||
      this.selectedCombatant.hasBuff(SPELLS.INVOKE_CHIJI_THE_RED_CRANE_BUFF.id)
    ) {
      if (this.chijiStackCount === MAX_CHIJI_STACKS) {
        this.freeCasts += 1;
      } else if (this.chijiStackCount < MAX_CHIJI_STACKS) {
        this.castsBelowMaxStacks += 1;
      }
      this.chijiStackCount = 0;
    }
  }

  stackCount() {
    if (this.chijiStackCount === MAX_CHIJI_STACKS) {
      this.wastedStacks += 1;
    } else {
      this.chijiStackCount += 1;
    }
  }

  subStatistic() {
    return (
      <StatisticListBoxItem
        title={<SpellLink id={TALENTS_MONK.INVOKE_CHI_JI_THE_RED_CRANE_TALENT.id} />}
        value={`${formatPercentage(
          this.owner.getPercentageOfTotalHealingDone(this.totalHealing),
        )} %`}
      />
    );
  }

  get guideCastBreakdown() {
    const explanation = (
      <p>
        <strong>
          <SpellLink id={TALENTS_MONK.INVOKE_CHI_JI_THE_RED_CRANE_TALENT.id} />
        </strong>
        <br />
        Before casting <SpellLink id={TALENTS_MONK.INVOKE_CHI_JI_THE_RED_CRANE_TALENT} />, it is
        essential to prepare by doing the following
        <ul>
          <li>
            Cast <SpellLink id={TALENTS_MONK.ESSENCE_FONT_TALENT} /> to duplicate{' '}
            <SpellLink id={SPELLS.GUST_OF_MISTS_CHIJI} /> events
          </li>
          <li>
            Get 3 stacks of <SpellLink id={TALENTS_MONK.TEACHINGS_OF_THE_MONASTERY_TALENT} /> so
            that you can instantly cast <SpellLink id={SPELLS.BLACKOUT_KICK} /> for 8 total{' '}
            <SpellLink id={SPELLS.GUST_OF_MISTS_CHIJI} /> heals
          </li>
          <li>
            If talented into <SpellLink id={TALENTS_MONK.SHAOHAOS_LESSONS_TALENT} />, cast{' '}
            <SpellLink id={TALENTS_MONK.SHEILUNS_GIFT_TALENT} /> with enough clouds to cover the
            entire duration of <SpellLink id={TALENTS_MONK.INVOKE_CHI_JI_THE_RED_CRANE_TALENT} />
          </li>
        </ul>
        During the duration of <SpellLink id={TALENTS_MONK.INVOKE_CHI_JI_THE_RED_CRANE_TALENT} />,
        it is important to do the following
        <ul>
          <li>
            If <SpellLink id={TALENTS_MONK.SECRET_INFUSION_TALENT} /> talented, use{' '}
            <SpellLink id={TALENTS_MONK.THUNDER_FOCUS_TEA_TALENT} /> with{' '}
            <SpellLink id={TALENTS_MONK.RENEWING_MIST_TALENT} /> or{' '}
            <SpellLink id={TALENTS_MONK.ESSENCE_FONT_TALENT} /> for a multaplicative haste bonus
          </li>
          <li>
            Avoid overcapping on <SpellLink id={TALENTS_MONK.TEACHINGS_OF_THE_MONASTERY_TALENT} />{' '}
            stacks
          </li>
          <li>
            Avoid overcapping on <SpellLink id={SPELLS.INVOKE_CHIJI_THE_RED_CRANE_BUFF} /> stacks
          </li>
          <li>
            Recast <SpellLink id={TALENTS_MONK.ESSENCE_FONT_TALENT} /> if talented into{' '}
            <SpellLink id={TALENTS_MONK.JADE_BOND_TALENT} />
          </li>
          <li>
            Cast <SpellLink id={TALENTS_MONK.ENVELOPING_MIST_TALENT} /> on allies that are near
            other allies (e.g. not ranged players standing alone) to maximize targets hit by{' '}
            <SpellLink id={TALENTS_MONK.ENVELOPING_BREATH_TALENT} />
          </li>
        </ul>
      </p>
    );

    const data = (
      <div>
        <strong>Per-Cast Breakdown</strong>
        <small> - click to expand</small>
        {this.castTrackers.map((cast, ix) => {
          const header = (
            <>
              @ {this.owner.formatTimestamp(cast.timestamp)} &mdash;{' '}
              <SpellLink id={TALENTS_MONK.INVOKE_CHI_JI_THE_RED_CRANE_TALENT.id} />
            </>
          );
          const totmRefreshPerf =
            cast.overcappedTotmStacks > 0
              ? QualitativePerformance.Fail
              : QualitativePerformance.Good;
          const chijiRefreshPerf =
            cast.overcappedChijiStacks > 0
              ? QualitativePerformance.Fail
              : QualitativePerformance.Good;
          const superList = super.getCooldownExpandableItems(cast);
          const checklistItems: CooldownExpandableItem[] = superList[1];
          let totmPerf = QualitativePerformance.Good;
          if (cast.totmStacks < 2) {
            totmPerf = QualitativePerformance.Fail;
          } else if (cast.totmStacks < 3) {
            totmPerf = QualitativePerformance.Ok;
          }
          checklistItems.push({
            label: (
              <>
                <SpellLink id={TALENTS_MONK.TEACHINGS_OF_THE_MONASTERY_TALENT} /> stacks on cast
              </>
            ),
            result: <PerformanceMark perf={totmPerf} />,
            details: <>{cast.totmStacks} stacks</>,
          });
          const allPerfs = [totmRefreshPerf, chijiRefreshPerf, totmPerf].concat(superList[0]);
          if (this.selectedCombatant.hasTalent(TALENTS_MONK.JADE_BOND_TALENT)) {
            const rval = this.getEfRefreshPerfAndItem(cast);
            allPerfs.push(rval[0]);
            checklistItems.push(rval[1]);
          }

          checklistItems.push({
            label: (
              <>
                Wasted <SpellLink id={SPELLS.TEACHINGS_OF_THE_MONASTERY} /> stacks during Chi-ji
              </>
            ),
            result: <PerformanceMark perf={totmRefreshPerf} />,
            details: <>{cast.overcappedTotmStacks} wasted stacks</>,
          });
          checklistItems.push({
            label: (
              <>
                Wasted <SpellLink id={SPELLS.INVOKE_CHIJI_THE_RED_CRANE_BUFF} /> stacks
              </>
            ),
            result: <PerformanceMark perf={chijiRefreshPerf} />,
            details: <>{cast.overcappedChijiStacks} wasted stacks</>,
          });
          const lowestPerf = getLowestPerf(allPerfs);
          return (
            <CooldownExpandable
              header={header}
              checklistItems={checklistItems}
              perf={lowestPerf}
              key={ix}
            />
          );
        })}
      </div>
    );

    return explanationAndDataSubsection(explanation, data);
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.DEFAULT}
        category={STATISTIC_CATEGORY.TALENTS}
        size="flexible"
        tooltip={
          <>
            Healing Breakdown:
            <ul>
              <li>
                {formatNumber(this.gustHealing)} healing from{' '}
                <SpellLink id={SPELLS.GUST_OF_MISTS_CHIJI.id} />.
              </li>
              <li>
                {formatNumber(this.envelopHealing)} healing from{' '}
                <SpellLink id={TALENTS_MONK.ENVELOPING_BREATH_TALENT.id} />.
              </li>
            </ul>
            Stack Breakdown:
            <ul>
              <li>
                {formatNumber(this.freeCasts)} free{' '}
                <SpellLink id={TALENTS_MONK.ENVELOPING_MIST_TALENT.id} /> cast(s).
              </li>
              <li>
                {formatNumber(this.castsBelowMaxStacks)}{' '}
                <SpellLink id={TALENTS_MONK.ENVELOPING_MIST_TALENT.id} /> cast(s) below max (
                {MAX_CHIJI_STACKS}) Chi-Ji stacks.
              </li>
              <li>
                {formatNumber(this.wastedStacks)} stack(s) wasted from overcapping Chi-Ji stacks.
              </li>
            </ul>
            Activity:
            <ul>
              <li>
                {(this.chijiGlobals / this.chijiUses).toFixed(2)} average gcds inside Chi-Ji window
              </li>
            </ul>
          </>
        }
      >
        <BoringValueText
          label={
            <>
              <SpellLink id={TALENTS_MONK.INVOKE_CHI_JI_THE_RED_CRANE_TALENT.id} /> and
              <br />
              <SpellLink id={TALENTS_MONK.ENVELOPING_BREATH_TALENT.id} />
            </>
          }
        >
          <>
            <ItemHealingDone amount={this.totalHealing} />
            <br />
            {formatNumber(this.missedGlobals)} <small>missed GCDs</small>
          </>
        </BoringValueText>
      </Statistic>
    );
  }
}

export default InvokeChiJi;
