// enums and other constants
const TeamType = {
  'Blue' : 0,
  'Red' : 1
};

const TrackerEvent = {
  UnitBorn: 1,
  UnitDied: 2,
  UnitOwnerChange: 3,
  UnitTypeChane: 4,
  Upgrade: 5,
  UnitInit: 6,
  UnitDone: 7,
  UnitPositions: 8,
  PlayerSetup: 9,
  Stat: 10,
  Score: 11,
  UnitRevived: 12,
  HeroBanned: 13,
  HeroPicked: 14,
  HeroSwapped: 15
};

const StatEventType = {
  PlayerInit: 'PlayerInit',
  PlayerSpawned: 'PlayerSpawned',
  TalentChosen: 'TalentChosen',
  RegenGlobePickedUp: 'RegenGlobePickedUp',
  PeriodicXPBreakdown: 'PeriodicXPBreakdown',
  PlayerDeath: 'PlayerDeath',
  LevelUp: 'LevelUp',
  SkyTempleCaptured: 'SkyTempleCaptured',
  SkyTempleShotsFired: 'SkyTempleShotsFired',
  EndOfGameXPBreakdown: 'EndOfGameXPBreakdown',
  EndOfGameTimeSpentDead: 'EndOfGameTimeSpentDead',
  EndOfGameTalentChoices: 'EndOfGameTalentChoices',
  LootSprayUsed: 'LootSprayUsed',
  GatesOpen: 'GatesOpen'
};

// display strings for score event names
const ScoreEventNames = {
  Takedowns: 'Takedowns',
  Deaths: 'Deaths',
  TownKills: 'Town Kills',
  SoloKill: 'Solo Kills',
  Assists: 'Assists',
  MetaExperience: 'Team Experience',
  Level: 'Level',
  TeamTakedowns: 'Team Takedowns',
  ExperienceContribution: 'Experience Contribution',
  Healing: 'Healing',
  SiegeDamage: 'Seige Damage',
  StructureDamage: 'Structure Damage',
  MinionDamage: 'Minion Damage',
  HeroDamage: 'Hero Damage',
  MercCampCaptures: 'Merc Camp Captures',
  WatchTowerCaptures: 'Watch Tower Captures',
  SelfHealing: 'Self Healing',
  TimeSpentDead: 'Time Spent Dead',
  TimeCCdEnemyHeroes: 'CC Time',
  CreepDamage: 'Creep Damage',
  SummonDamage: 'Summon Damage',
  Tier1Talent: 'Level 1 Talent',
  Tier2Talent: 'Level 4 Talent',
  Tier3Talent: 'Level 7 Talent',
  Tier4Talent: 'Heroic Talent',
  Tier5Talent: 'Level 13 Talent',
  Tier6Talent: 'Level 16 Talent',
  Tier7Talent: 'Storm Talent',
  DamageTaken: 'Damage Taken',
  Role: 'Role',
  KilledTreasureGoblin: 'Killed Treasure Goblin',
  GameScore: 'Game Score',
  HighestKillStreak: 'Highest Kill Streak',
  TeamLevel: 'Team Level',
  ProtectionGivenToAllies: 'Shielding',
  TimeSilencingEnemyHeroes: 'Silence Time',
  TimeRootingEnemyHeroes: 'Root Time',
  TimeStunningEnemyHeroes: 'Stun Time',
  ClutchHealsPerformed: 'Clutch Heals',
  EscapesPerformed: 'Escapes Performed',
  VengeancesPerformed: 'Revenge Kills',
  TeamfightEscapesPerformed: 'Team Fight Escapes',
  OutnumberedDeaths: 'Deaths While Outnumbered',
  TeamfightHealingDone: 'Team Fight Healing',
  TeamfightDamageTaken: 'Team Fight Damage Taken',
  TeamfightHeroDamage: 'Team Fight Hero Damage Dealt',
  EndOfMatchAwardMVPBoolean: 'MVP',
  EndOfMatchAwardHighestKillStreakBoolean: 'Highest Kill Streak Award',
  EndOfMatchAwardMostVengeancesPerformedBoolean: 'Revenge Kills Award',
  EndOfMatchAwardMostDaredevilEscapesBoolean: 'Most Daredevil Escapes Award',
  EndOfMatchAwardMostEscapesBoolean: 'Escape Artist',
  EndOfMatchAwardMostXPContributionBoolean: 'XP Contribution Award',
  EndOfMatchAwardMostHeroDamageDoneBoolean: 'Most Hero Damage Award',
  EndOfMatchAwardMostKillsBoolean: 'Most Kills Award',
  EndOfMatchAwardHatTrickBoolean: 'Hat Trick',
  EndOfMatchAwardClutchHealerBoolean: 'Clutch Healer',
  EndOfMatchAwardMostProtectionBoolean: 'Most Protection Award',
  EndOfMatchAward0DeathsBoolean: 'No Deaths Award',
  EndOfMatchAwardMostSiegeDamageDoneBoolean: 'Most Siege Damage Award',
  EndOfMatchAwardMostDamageTakenBoolean: 'Most Damage Taken Award',
  EndOfMatchAward0OutnumberedDeathsBoolean: 'No Deaths While Outnumbered Award',
  EndOfMatchAwardMostHealingBoolean: 'Most Healing Award',
  EndOfMatchAwardMostStunsBoolean: 'Most Stuns Award',
  EndOfMatchAwardMostRootsBoolean: 'Most Roots Award',
  EndOfMatchAwardMostSilencesBoolean: 'Most Silences Award',
  EndOfMatchAwardMostMercCampsCapturedBoolean: 'Most Merc Camps Award',
  EndOfMatchAwardMapSpecificBoolean: 'Objective Award',
  EndOfMatchAwardMostDragonShrinesCapturedBoolean: 'Most Dragon Shrines Captured Award',
  EndOfMatchAwardMostCurseDamageDoneBoolean: 'Most Curse Damage Done Award',
  EndOfMatchAwardMostCoinsPaidBoolean: 'Most Coins Paid Award',
  EndOfMatchAwardMostImmortalDamageBoolean: 'Most Immortal Damage Award',
  EndOfMatchAwardMostDamageDoneToZergBoolean: 'Most Damage Done To Zerg Award',
  EndOfMatchAwardMostDamageToPlantsBoolean: 'Most Damage Done To Plants Award',
  EndOfMatchAwardMostDamageToMinionsBoolean: 'Most Damage Done To Minions Award',
  EndOfMatchAwardMostTimeInTempleBoolean: 'Most Time In Temple Award',
  EndOfMatchAwardMostGemsTurnedInBoolean: 'Most Gems Turned In Award',
  EndOfMatchAwardMostSkullsCollectedBoolean: 'Most Skulls Collected Award',
  EndOfMatchAwardMostAltarDamageDone: 'Most Altar Damage Done Award',
  EndOfMatchAwardMostNukeDamageDoneBoolean: 'Most Nuke Damage Done Award',
  EndOfMatchAwardMostTeamfightDamageTakenBoolean: 'Most Team Fight Damage Taken Award',
  EndOfMatchAwardMostTeamfightHealingDoneBoolean: 'Most Team Fight Healing Done Award',
  EndOfMatchAwardMostTeamfightHeroDamageDoneBoolean: 'Most Team Fight Hero Damage Done Award',
  EndOfMatchAwardGivenToNonwinner: 'End of Match Award Given to Winner',
  OnFireTimeOnFire: 'Time On Fire',
  LunarNewYearSuccesfulArtifactTurnIns: 'Lunar New Year Event Turn Ins',
  EndOfMatchAwardMostTimePushingBoolean: 'Most Time Pushing Award',
  EndOfMatchAwardMostTimeOnPointBoolean: 'Most Time on Point Award',
  TimeOnPoint: 'Time On Point',
  TimeInTemple: 'Time In Temple'
  // I skip the "Wins___" categories, they appear to be used for daily quest completion checks
};

const MapType = {
  SkyTemple: 'Sky Temple'
};

const MessageType = {
  Chat: 0,
  Ping: 1,
  LoadingProgress: 2,
  ServerPing: 3,
  ReconnectNotify: 4,
  PlayerAnnounce: 5
};

const AnnouncmentType = {
  None: 0,
  Ability: 1,
  Behavior: 2,
  Vitals: 3
};

const MessageTarget = {
  All: 0,
  Allies: 1,
  Obeservers: 4
};

const VitalType = {
  Health: 0,
  Mana: 2
};

const UnitType = {
  FootmanMinion: 'Footman Minion',
  WizardMinion: 'Wizard Minion',
  RangedMinion: 'Ranged Minion',
  RegenGlobe: 'Regen Globe',
  RegenGlobeNeutral: 'Neutral Regen Globe'
};

const MinionXP = {
  FootmanMinion:  [70, 71, 72, 73, 74, 76, 77, 78, 79, 80, 82, 83, 84, 85, 86, 88, 89, 90, 91, 92, 94, 95, 96, 97, 98, 100, 101, 102, 103, 104, 106],
  WizardMinion:   [62, 64, 66, 67, 69, 71, 73, 75, 76, 78, 80, 82, 84, 85, 87, 89, 91, 93, 94, 96, 98, 100, 102, 103, 105, 107, 109, 111, 112, 114, 116],
  RangedMinion:   [60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120],
  CatapultMinion: [1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 29, 30]
};

const TombMinionXP = {
  FootmanMinion: [55, 56, 57, 58, 59, 61, 62, 63, 64, 65, 67, 68, 69, 70, 71, 73, 74, 75, 76, 77 ,79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 90, 92],
  WizardMinion:  [51, 53, 55, 56, 58, 60, 62, 64, 65, 67, 69, 71, 73, 74, 76, 78, 80, 82, 83, 85, 87, 89, 91, 92, 94, 96, 98, 100, 101, 103, 105],
  RangedMinion:  [51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99, 101, 103, 105, 107, 109, 111] 
};

exports.TeamType = TeamType;
exports.TrackerEvent = TrackerEvent;
exports.StatEventType = StatEventType;
exports.ScoreEventNames = ScoreEventNames;
exports.MessageType = MessageType;
exports.AnnouncmentType = AnnouncmentType;
exports.MessageTarget = MessageTarget;
exports.VitalType = VitalType;
exports.UnitType = UnitType;
exports.MinionXP = MinionXP;
exports.TombMinionXP = TombMinionXP;
exports.MapType = MapType;