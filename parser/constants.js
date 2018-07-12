// enums and other constants
const TeamType = {
  'Blue' : 0,
  'Red' : 1
};

const TrackerEvent = {
  UnitBorn: 1,
  UnitDied: 2,
  UnitOwnerChange: 3,
  UnitTypeChange: 4,
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
  LootVoiceLineUsed: 'LootVoiceLineUsed',
  GatesOpen: 'GatesOpen',
  AltarCaptured: 'Altar Captured',
  ImmortalDefeated: 'Immortal Defeated',
  TributeCollected: 'TributeCollected',
  DragonKnightActivated: 'DragonKnightActivated',
  GardenTerrorActivated: 'GardenTerrorActivated',
  ShrineCaptured: 'Infernal Shrine Captured',
  PunisherKilled: 'Punisher Killed',
  SpidersSpawned: 'SoulEatersSpawned',
  CampCapture: 'JungleCampCapture',
  SixTowersStart: 'Six Town Event Start',
  SixTowersEnd: 'Six Town Event End',
  TowersFortCaptured: 'Town Captured',
  Upvote: 'EndOfGameUpVotesCollected',
  BraxisWaveStart: `BraxisHoldoutMapEventComplete`
};

const StructureStrings = {
  TownTownHallL2: 'Fort',
  TownTownHallL3: 'Keep',
  TownMoonwellL2: 'Fort Well',
  TownMoonwellL3: 'Keep Well',
  TownCannonTowerL2: 'Fort Tower',
  TownCannonTowerL3: 'Keep Tower'
}

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
  TimeInTemple: 'Time In Temple',
  TimeOnPayload: 'Time on Payload'
  // I skip the "Wins___" categories, they appear to be used for daily quest completion checks
};

const MapType = {
  ControlPoints: 'Sky Temple',
  TowersOfDoom: 'Towers of Doom',
  HauntedMines: 'Haunted Mines',
  BattlefieldOfEternity: 'Battlefield of Eternity',
  BlackheartsBay: "Blackheart's Bay",
  CursedHollow: 'Cursed Hollow',
  DragonShire: 'Dragon Shire',
  HauntedWoods: 'Garden of Terror',
  Shrines: 'Infernal Shrines',
  Crypts: 'Tomb of the Spider Queen',
  Volskaya: 'Volskaya Foundry',
  'Warhead Junction': 'Warhead Junction',   // blizz why
  BraxisHoldout: 'Braxis Holdout',
  Hanamura: 'Hanamura',
  AlteracPass: 'Alterac Pass'
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

// note that this is a subset of all possible units,
// only the ones we actually care about in the parse are listed here
const UnitType = {
  FootmanMinion: 'FootmanMinion',
  WizardMinion: 'WizardMinion',
  RangedMinion: 'RangedMinion',
  RegenGlobe: 'RegenGlobe',
  RegenGlobeNeutral: 'RegenGlobeNeutral',
  MinesBoss: 'UnderworldSummonedBoss',
  RavenLordTribute: 'RavenLordTribute',
  SunShrine: 'DragonShireShrineSun',
  MoonShrine: 'DragonShireShrineMoon',
  GardenTerrorVehicle: 'VehiclePlantHorror',
  DragonVehicle: 'VehicleDragon',
  Webweaver: 'SoulEater',
  Triglav: 'VolskayaVehicle',
  Nuke: 'NukeTargetMinimapIconUnit',
  BraxisControlPoint: 'ZergHiveControlBeacon',
  BraxisZergPath: 'ZergPathDummy',
  ImmortalHeaven: 'BossDuelLanerHeaven',
  ImmortalHell: 'BossDuelLanerHell',
  WarheadSpawn: 'WarheadSingle',
  WarheadDropped: 'WarheadDropped',
  HealingPulseItem: 'HealingPulsePickup',
  TurretItem: 'TurretPickup',
  Fort: 'TownTownHallL2',
  Keep: 'TownTownHallL3',
  FortWell: 'TownMoonwellL2',
  KeepWell: 'TownMoonwellL3',
  FortTower: 'TownCannonTowerL2',
  KeepTower: 'TownCannonTowerL3',
  KingsCore: 'KingsCore',
  VanndarStormpike: 'VanndarStormpike',  // blue team core for Alterac Pass
  DrekThar: 'DrekThar', // red team core for Alterac Pass
  AbathurSymbiote: 'AbathurSymbiote',
  AVCapturePointBeingCappedDummy: 'AVCapturePointBeingCappedDummy',
  AVCapturePointDefender: 'AVCapturePointDefender',
  AllianceCavalry: 'AllianceCavalry',
  HordeCavalry: 'HordeCavalry'
};

const BraxisUnitType = {
  ZergZergling: 'ZergZergling',
  ZergBaneling: 'ZergBaneling',
  ZergHydralisk: 'ZergHydralisk',
  ZergGuardian: 'ZergGuardian',
  ZergUltralisk: 'ZergUltralisk'
};

const MercUnitType = {
  TerranHellbat: 'TerranHellbat',
  SlimeBossLaner: 'SlimeBossLaner',
  TerranArchangelLaner: 'TerranArchangelLaner',
  TerranGoliath: 'TerranGoliath',
  TerranRaven: 'TerranRaven',
  JungleGraveGolemLaner: 'JungleGraveGolemLaner',
  MercLanerSiegeGiant: 'MercLanerSiegeGiant',
  MercGoblinSapperLaner: 'MercGoblinSapperLaner',
  MercSiegeTrooperLaner: 'MercSiegeTrooperLaner',
  MercSummonerLaner: 'MercSummonerLaner',
  MercLanerRangedOgre: 'MercLanerRangedOgre',
  MercLanerMeleeOgre: 'MercLanerMeleeOgre',
  MercLanerMeleeKnight: 'MercLanerMeleeKnight',
  MercLanerRangedMage: 'MercLanerRangedMage'
  //MercSummonerLanerMinionDummy: 'MercSummonerLanerMinionDummy' -- this is cool but the amount of data it spits out is frankly absurd
}

const MercUnitString = {
  TerranHellbat: 'Hellbat',
  SlimeBossLaner: 'Warhead Boss',
  TerranArchangelLaner: 'Archangel Boss',
  TerranGoliath: 'Goliath',
  TerranRaven: 'Raven',
  JungleGraveGolemLaner: 'Grave Golem Boss',
  MercLanerSiegeGiant: 'Siege Giant',
  MercGoblinSapperLaner: 'Goblin Sapper',
  MercSiegeTrooperLaner: 'Siege Trooper',
  MercSummonerLaner: 'Summoner',
  MercLanerRangedOgre: 'Ranged Ogre',
  MercLanerMeleeOgre: 'Melee Ogre',
  MercLanerMeleeKnight: 'Melee Knight',
  MercLanerRangedMage: 'Ranged Mage',
  MercSummonerLanerMinionDummy: 'Summoned Merc'
}

const MinionXP = {
  FootmanMinion:  [70, 71, 72, 73, 74, 76, 77, 78, 79, 80, 82, 83, 84, 85, 86, 88, 89, 90, 91, 92, 94, 95, 96, 97, 98, 100, 101, 102, 103, 104, 106],
  WizardMinion:   [62, 64, 66, 67, 69, 71, 73, 75, 76, 78, 80, 82, 84, 85, 87, 89, 91, 93, 94, 96, 98, 100, 102, 103, 105, 107, 109, 111, 112, 114, 116],
  RangedMinion:   [60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120],
  CatapultMinion: [1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 29, 30, 31, 32, 33, 35, 36, 37]
};

const TombMinionXP = {
  FootmanMinion: [55, 56, 57, 58, 59, 61, 62, 63, 64, 65, 67, 68, 69, 70, 71, 73, 74, 75, 76, 77 ,79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 90, 92],
  WizardMinion:  [51, 53, 55, 56, 58, 60, 62, 64, 65, 67, 69, 71, 73, 74, 76, 78, 80, 82, 83, 85, 87, 89, 91, 92, 94, 96, 98, 100, 101, 103, 105],
  RangedMinion:  [51, 53, 55, 57, 59, 61, 63, 65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89, 91, 93, 95, 97, 99, 101, 103, 105, 107, 109, 111],
  CatapultMinion: [1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 29, 30, 31, 32, 33, 35, 36, 37]
};

const GameStart = 610;

const GameMode = {
  AI: 50021,
  Practice: 50041,
  QuickMatch: 50001,
  Brawl: 50031,
  UnrankedDraft: 50051,
  HeroLeague: 50061,
  TeamLeague: 50071,
  Custom: -1
}

const GameModeStrings = {
  50021: 'Versus AI',
  50041: 'Practice',
  50001: 'Quick Match',
  50031: 'Brawl',
  50051: 'Unranked Draft',
  50061: 'Hero League',
  50071: 'Team League',
  '-1': 'Custom'
}

const SeasonDates = {
  'Preseason' : {
    start: new Date(0),
    end: new Date('06-14-2016'),
    id: 0
  },
  '2016 Season 1' : {
    start: new Date('06-14-2016'),
    end: new Date('09-13-2016'),
    id: 1
  },
  '2016 Season 2' : {
    start: new Date('09-13-2016'),
    end: new Date('12-13-2016'),
    id: 2
  },
  '2016 Season 3' : {
    start: new Date('12-13-2016'),
    end: new Date('3-13-2017'),
    id: 3
  },
  '2017 Season 1' : {
    start: new Date('3-13-2017'),
    end: new Date('6-14-2017'),
    id: 4
  },
  '2017 Season 2' : {
    start: new Date('6-14-2017'),
    end: new Date('9-5-2017'),
    id: 5
  },
  '2017 Season 3' : {
    start: new Date('9-5-2017'),
    end: new Date('12-13-2017'),
    id: 6
  },
  '2018 Season 1' : {
    start: new Date('12-13-2017'),
    end: new Date('3-7-2018'),
    id: 7
  },
  '2018 Season 2': {
    start: new Date('3-7-2018'),
    end: new Date('7-9-2018'),
    id: 8
  }
}

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
exports.GameStart = GameStart;
exports.GameMode = GameMode;
exports.GameModeStrings = GameModeStrings;
exports.BraxisUnitType = BraxisUnitType;
exports.MercUnitType = MercUnitType;
exports.StructureStrings = StructureStrings
exports.MercUnitString = MercUnitString;
exports.SeasonDates = SeasonDates;