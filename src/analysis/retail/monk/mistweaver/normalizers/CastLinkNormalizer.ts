import SPELLS from 'common/SPELLS';
import EventLinkNormalizer, { EventLink } from 'parser/core/EventLinkNormalizer';
import { Options } from 'parser/core/Module';
import { TALENTS_MONK } from 'common/TALENTS';
import {
  AbilityEvent,
  ApplyBuffEvent,
  EventType,
  GetRelatedEvents,
  HasRelatedEvent,
  RemoveBuffEvent,
} from 'parser/core/Events';

export const APPLIED_HEAL = 'AppliedHeal';
export const BOUNCED = 'Bounced';
export const FROM_DANCING_MISTS = 'FromDM';
export const FROM_HARDCAST = 'FromHardcast';
export const FROM_MISTY_PEAKS = 'FromMistyPeaks';
export const FROM_RAPID_DIFFUSION = 'FromRD'; // can be linked to env mist or rsk cast

const CAST_BUFFER_MS = 150;
const FOUND_REMS = new Set();

/*
  This file is for attributing Renewing Mist and Enveloping Mist applications to hard casts.
  It is needed because mistweaver talents can proc ReM/EnvM, 
  but they are not extended by RM nor do they trigger the flat RM Heal
  */
const EVENT_LINKS: EventLink[] = [
  // link renewing mist apply to its CastEvent
  {
    linkRelation: FROM_HARDCAST,
    reverseLinkRelation: APPLIED_HEAL,
    linkingEventId: [SPELLS.RENEWING_MIST_HEAL.id],
    linkingEventType: [EventType.ApplyBuff],
    referencedEventId: TALENTS_MONK.RENEWING_MIST_TALENT.id,
    referencedEventType: [EventType.Cast],
    forwardBufferMs: CAST_BUFFER_MS,
    backwardBufferMs: CAST_BUFFER_MS,
  },
  // link Enveloping Mist apply to its cast
  {
    linkRelation: FROM_HARDCAST,
    reverseLinkRelation: APPLIED_HEAL,
    linkingEventId: [TALENTS_MONK.ENVELOPING_MIST_TALENT.id, SPELLS.ENVELOPING_MIST_TFT.id],
    linkingEventType: [EventType.ApplyBuff, EventType.RefreshBuff],
    referencedEventId: TALENTS_MONK.ENVELOPING_MIST_TALENT.id,
    referencedEventType: EventType.Cast,
    forwardBufferMs: CAST_BUFFER_MS,
    backwardBufferMs: CAST_BUFFER_MS,
  },
  // link renewing mist apply to the target it was removed from
  {
    linkRelation: BOUNCED,
    linkingEventId: [SPELLS.RENEWING_MIST_HEAL.id],
    linkingEventType: [EventType.ApplyBuff],
    referencedEventId: SPELLS.RENEWING_MIST_HEAL.id,
    referencedEventType: [EventType.RemoveBuff],
    forwardBufferMs: 0,
    backwardBufferMs: 500,
    anyTarget: true,
    additionalCondition(linkingEvent, referencedEvent) {
      return (
        (linkingEvent as ApplyBuffEvent).targetID !== (referencedEvent as RemoveBuffEvent).targetID
      );
    },
  },
  // link renewing mist removal to its application event
  {
    linkRelation: BOUNCED,
    linkingEventId: [SPELLS.RENEWING_MIST_HEAL.id],
    linkingEventType: [EventType.RemoveBuff],
    referencedEventId: SPELLS.RENEWING_MIST_HEAL.id,
    referencedEventType: [EventType.ApplyBuff],
    forwardBufferMs: 0,
    backwardBufferMs: 65000,
  },
  // link ReM to an EnvM/RSK cast
  {
    linkRelation: FROM_RAPID_DIFFUSION,
    linkingEventId: [SPELLS.RENEWING_MIST_HEAL.id],
    linkingEventType: [EventType.ApplyBuff],
    referencedEventId: [
      TALENTS_MONK.RISING_SUN_KICK_TALENT.id,
      TALENTS_MONK.ENVELOPING_MIST_TALENT.id,
      SPELLS.ENVELOPING_MIST_TFT.id,
    ],
    referencedEventType: [EventType.Cast],
    forwardBufferMs: 500,
    backwardBufferMs: 500,
    anyTarget: true,
  },
  // two REMs happen in same timestamp when dancing mists procs
  {
    linkRelation: FROM_DANCING_MISTS,
    linkingEventId: [SPELLS.RENEWING_MIST_HEAL.id],
    linkingEventType: [EventType.ApplyBuff],
    referencedEventId: [SPELLS.RENEWING_MIST_HEAL.id],
    referencedEventType: [EventType.ApplyBuff],
    anyTarget: true,
    additionalCondition(linkingEvent, referencedEvent) {
      return (
        (linkingEvent as ApplyBuffEvent).targetID !== (referencedEvent as ApplyBuffEvent).targetID
      );
    },
  },
  // misty peaks proc from a ReM hot event
  {
    linkRelation: FROM_MISTY_PEAKS,
    linkingEventId: [TALENTS_MONK.ENVELOPING_MIST_TALENT.id],
    linkingEventType: [EventType.ApplyBuff],
    referencedEventId: SPELLS.RENEWING_MIST_HEAL.id,
    referencedEventType: [EventType.Heal],
    anyTarget: true,
    forwardBufferMs: 50,
    backwardBufferMs: 50,
  },
];

/**
 * When a spell is cast on a target, the ordering of the Cast and ApplyBuff/RefreshBuff/(direct)Heal
 * can be semi-arbitrary, making analysis difficult.
 *
 * This normalizer adds a _linkedEvent to the ApplyBuff/RefreshBuff/Heal linking back to the Cast event
 * that caused it (if one can be found).
 *
 * This normalizer adds links for Renewing Mist and Enveloping Mist
 */
class CastLinkNormalizer extends EventLinkNormalizer {
  constructor(options: Options) {
    super(options, EVENT_LINKS);
  }
}

/** Returns true iff the given buff application or heal can be matched back to a hardcast */
export function isFromHardcast(event: AbilityEvent<any>): boolean {
  if (HasRelatedEvent(event, FROM_RAPID_DIFFUSION) || HasRelatedEvent(event, FROM_MISTY_PEAKS)) {
    return false;
  }
  // 2nd ReM application is the duplicated event
  if (HasRelatedEvent(event, FROM_DANCING_MISTS)) {
    if (FOUND_REMS.has(event.timestamp)) {
      return false;
    } else {
      FOUND_REMS.add(event.timestamp);
    }
  }
  if (HasRelatedEvent(event, FROM_HARDCAST)) {
    return true;
  }
  if (HasRelatedEvent(event, BOUNCED)) {
    const relatedEvents = GetRelatedEvents(event, BOUNCED);
    let minEvent = relatedEvents[0];
    // find closest removal/application
    relatedEvents.forEach(function (rel_ev) {
      if (
        Math.abs(rel_ev.timestamp - event.timestamp) <
        Math.abs(minEvent.timestamp - event.timestamp)
      ) {
        minEvent = rel_ev;
      }
    });
    // see if ancestor event can be linked to a hardcast
    if (minEvent.type === EventType.RemoveBuff) {
      return isFromHardcast(minEvent as RemoveBuffEvent);
    } else {
      return isFromHardcast(minEvent as ApplyBuffEvent);
    }
  }
  return false;
}

export default CastLinkNormalizer;
