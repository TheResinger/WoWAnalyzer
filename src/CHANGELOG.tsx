import React from 'react';
import { Abelito75, ackwell, AdamKelly, Aelexe, Amani, Amrux, Anatta336, axelkic, Barter, blazyb, ChagriAli, Chizu, ChristopherKiss, Dambroda, Dorixius, Draenal, emallson, fluffels, Fyruna, Gebuz, Guyius, Haelrail, Hartra344, HawkCorrigan, HolySchmidt, Hordehobbs, Jafowler, JeremyDwayne, jos3p, joshinator, Juko8, Keraldi, Khadaj, Khazak, Kruzershtern, layday, Mae, Mamtooth, Matardarix, Moonrabbit, Nalhan, niseko, Putro, Qbz, Satyric, Scotsoo, Sharrq, Ssabbar, Stui, Vetyst, Viridis, Yajinni, Zeboot, Zerotorescue, Keraldi } from 'CONTRIBUTORS';
import ItemLink from 'common/ItemLink';
import ITEMS from 'common/ITEMS';
import SPELLS from 'common/SPELLS';
import SpellLink from 'common/SpellLink';
import { change, date } from 'common/changelog';

// prettier-ignore
export default [
  change(date(2020, 12, 11), 'Converted some root files from JS to TS', Keraldi),
  change(date(2020, 12, 10), 'Removed Heart of Azeroth from player selection screen as well as added Anti-magic zone to the tracked cooldowns', Abelito75),
  change(date(2020, 12, 10), 'Update character lookup to show Castle Nathria instead of Ny\'alotha', Putro),
  change(date(2020, 12, 10), 'Speed up build workflow.', Zerotorescue),
  change(date(2020, 12, 9), 'Fixed a crash here and there.', Zerotorescue),
  change(date(2020, 12, 9), 'Fixed a bug in Cancelled Casts that was counting enchant procs and other effects as abilities that interrupted casts', Sharrq),
  change(date(2020, 12, 9), 'Updated Potions and Flask!', Abelito75),
  change(date(2020, 12, 8), <>Removed all changelog entries before October 2020 that were not related to Shadowlands development, and updated spec contributors to match. If you're interested in older changelogs, visit our <a href="https://github.com/WoWAnalyzer/WoWAnalyzer/tree/bfa">BFA GitHub branch</a>.</>, Putro),
  change(date(2020, 12, 8), 'Removed Azerite traits, Essences, and anything else BFA related from WoWAnalyzer.', Putro),
  change(date(2020, 12, 8), 'Updated Stat Tracking to use squished stat values, and added shadowlands food, potions, and flasks.', Sharrq),
  change(date(2020, 12, 7), 'Added background and headshot graphics for Castle Nathria bosses', Sharrq),
  change(date(2020, 12, 3), 'Removed Azerite Overview from the character panel', niseko),
  change(date(2020, 12, 1), 'Added Weapon Oils and Sharpening Stones/Weightstones to Checklist and added Weapon Enchants', Sharrq),
  change(date(2020, 11, 28), 'Removed all BFA Modules', Sharrq),
  change(date(2020, 11, 23), 'Updated i18n ids', jos3p),
  change(date(2020, 11, 19), 'Final Interface and Restoration Shaman localization, correction of typos', Amani),
  change(date(2020, 11, 15), 'Added ability to get the active time/downtime for a specified time frame', Sharrq),
  change(date(2020, 11, 7), 'Adjust our Soulbind, Covenant, Conduit scripts per latest raid testing', Putro),
  change(date(2020, 11, 4), 'Migrate Castle Nathria to TS', Guyius),
  change(date(2020, 11, 2), 'Converted the following components to TypeScript: ItemLink, ResourceLink, Rule and Expandable', Mae),
  change(date(2020, 10, 31), 'Update several component to Typescript and refactor to hooks', Guyius),
  change(date(2020, 11, 1), 'Eliminated x-axis padding in several charts.', emallson),
  change(date(2020, 11, 1), 'Shifted all spells to use the same generic Spell type', Putro),
  change(date(2020, 10, 31), 'Added IDs to i18n of PlayerLoader', jos3p),
  change(date(2020, 10, 31), 'Added i18n of Premium page', jos3p),
  change(date(2020, 10, 29), 'Update game components to Typescript', jos3p),
  change(date(2020, 10, 29), 'Update ResourceTracker to TypeScript', Khazak),
  change(date(2020, 10, 29), 'Updated Potions Checklist items to show potions used instead of pre Potions/second Potions.', Sharrq),
  change(date(2020, 10, 29), 'Update several component to Typescript, center player name in player gear header', Guyius),
  change(date(2020, 10, 28), 'Added more translateable elements.', niseko),
  change(date(2020, 10, 27), 'Fix encounter stats on the character pane', joshinator),
  change(date(2020, 10, 27), 'Russian localization of Interface and Restoration Shaman', [Amani, Haelrail, Kruzershtern]),
  change(date(2020, 10, 25), 'Enabled additional code quality rule (enforce camelcase).', Zeboot),
  change(date(2020, 10, 25), 'Update PlayerTile, characters to Typescript, create new HOA type file, refactor PlayerTile to hooks', Guyius),
  change(date(2020, 10, 25), 'Fixed Healing Efficiency Tracker showing errors', niseko),
  change(date(2020, 10, 24), 'Update Regular Article to Typescript', Ssabbar),
  change(date(2020, 10, 24), 'Update PlayerSection to Typescript', Guyius),
  change(date(2020, 10, 23), 'Added initial Russian localization', [Amani, Haelrail, Kruzershtern]),
  change(date(2020, 10, 23), 'Healing Efficiency Tracker TypeScript conversion', niseko),
  change(date(2020, 10, 22), 'Update Footer to Typescript', Ssabbar),
  change(date(2020, 10, 22), 'Update Progressbar to Typescript', Guyius),
  change(date(2020, 10, 21), 'Update some news components to Typescript', ChagriAli),
  change(date(2020, 10, 21), 'Update to "2018-01-31-1st-Anniversary" Typescript', ChagriAli),
  change(date(2020, 10, 19), 'Converted Boring components to TypeScript', Khazak),
  change(date(2020, 10, 19), 'Updated some react components, and adjusted our ContributorDetails modal to more accurately show what it represents', Putro),
  change(date(2020, 10, 19), 'Removed legacy event listener support and enabled camelcase lint rule', Zeboot),
  change(date(2020, 10, 18), 'Updated talent row levels.', Abelito75),
  change(date(2020, 10, 18), 'Added drain event', Zeboot),
  change(date(2020, 10, 18), 'Converted components in interface/common to functional components in TypeScript.', Barter),
  change(date(2020, 10, 18), 'Refactored Contributor and fixed some typing of ContributorDetails', Dambroda),
  change(date(2020, 10, 18), 'Updated core legacy event listeners to event filters', Zeboot),
  change(date(2020, 10, 15), 'Updated the Spec tab styles', Dambroda),
  change(date(2020, 10, 15), 'Updated the Spec tab styles to clearly indicate unmaintained specs', Dambroda),
  change(date(2020, 10, 15), 'Added a warning message when loading Classic Logs', Sharrq),
  change(date(2020, 10, 14), 'Fixed the character page.', Abelito75),
  change(date(2020, 10, 14), <>Adjusted the values of <SpellLink id={SPELLS.ARCANE_INTELLECT.id} /> and <SpellLink id={SPELLS.BATTLE_SHOUT.id} />.</>, niseko),
  change(date(2020, 10, 13), 'Internationalization for each spec', Jafowler),
  change(date(2020, 10, 13), 'Fixed typo in the Timeline buffs timelineHighlight propery', Sharrq),
  change(date(2020, 10, 13), 'Converted DistancedMoved and DispelTracker modules to TypeScript', Dambroda),
  change(date(2020, 10, 13), 'Convert Js files to typescript', Ssabbar),
  change(date(2020, 10, 13), 'Fixed Putros StatTracker', niseko),
  change(date(2020, 10, 13), 'Updated our StatTracker to reflect prepatch stat values and the diminishing return system added in Shadowlands', Putro),
  change(date(2020, 10, 13), 'Converted StatisticsSectionTitle/TABS to TypeScript', ChagriAli),
  change(date(2020, 10, 13), 'Throughput & Language files TypeScript conversion', niseko),
  change(date(2020, 10, 13), 'Converted BAD_ICONS, aprilFools, colorForPerformance, Alerts, ContributorButton, Modal to TypeScript', Barter),
  change(date(2020, 10, 13), 'Converted AbilityTracker, Enemy, Enemies, Pet, and Pets to TypeScript', Dambroda),
  change(date(2020, 10, 13), 'Allow the use of any of the threshold breakpoints (minor, average, major) as the primary breakpoint for suggestions', Dambroda),
  change(date(2020, 10, 13), 'Merged CooldownTrackers to remove duplicated code and converted them to TypeScript', Putro),
  change(date(2020, 10, 13), 'Converted Items to TypeScript', Zeboot),
  change(date(2020, 10, 13), 'Converted Spells to TypeScript', Zeboot),
  change(date(2020, 10, 13), 'Converted Consumable Checkers to TypeScript', Zeboot),
  change(date(2020, 10, 13), 'Converted Combatants to TypeScript', niseko),
  change(date(2020, 10, 13), 'Changed code quality rules.', Zerotorescue),
  change(date(2020, 10, 13), 'Added a new event map for catch-all event types. Converted SpellUsable to TypeScript.', Dambroda),
  change(date(2020, 10, 13), 'Converted WCL API Access to TypeScript', Zeboot),
  change(date(2020, 10, 13), 'Cleaned up the console a little bit.', Abelito75),
  change(date(2020, 10, 13), 'Added a toggle-all button to the EventTab.', niseko),
  change(date(2020, 10, 13), 'Added dispel to filterable type for EventTab.', Moonrabbit),
  change(date(2020, 10, 13), 'Added Castle Nathria boss configs and updated the default report header image.', Sharrq),
  change(date(2020, 10, 13), 'Added pet tracking to the Cooldown tab.', Abelito75),
  change(date(2020, 10, 13), 'Converted charts to new library.', emallson),
  change(date(2020, 10, 13), 'Added a new search option to the homepage to view a guild\'s recent reports.', Dambroda),
  change(date(2020, 10, 13), 'Updated mana costs for all healers.', Abelito75),
  change(date(2020, 10, 13), 'Updated abilities effiency tracker to default to 0 if no casts were possible.', Abelito75),
  change(date(2020, 10, 13), 'Added holy power tracking for prot and holy paladin specs.', HolySchmidt),
  change(date(2020, 10, 13), 'Updated search in Event tab to allow for multi-word searching in quotes.', Abelito75),
  change(date(2020, 10, 13), 'Add some early checks to see if a player has a given conduit, soulbind or covenant.', Putro),
  change(date(2020, 10, 13), 'Add some scripts for generating conduit information.', Putro),
  change(date(2020, 10, 13), 'Fixed cast efficiency calculations for channeled spells. They are now no longer adding channeled time on top of cooldown as time they were unavailable', Juko8),
  change(date(2020, 10, 7), 'Updated the report header design: moved phase and time selection slightly out of view.', Zerotorescue),
  change(date(2020, 10, 6), 'Provide the ability to analyse anonymous reports.', AdamKelly),
  change(date(2020, 10, 6), 'Fixed guild and character search so they can be submitted.', ChristopherKiss),
  change(date(2020, 10, 5), 'Convert TimeInput/TimeFilter to typescript', ChagriAli),
  change(date(2020, 10, 4), 'Removed remaining trackers', Zerotorescue),
  change(date(2020, 10, 2), 'Updated project dependencies.', Zerotorescue),
];
