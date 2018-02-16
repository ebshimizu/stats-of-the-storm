// a loader for the data contained in the heroes folder of heroes-talents

const fs = require('fs');

const Awards = {
  EndOfMatchAwardMVPBoolean: {name: 'MVP', subtitle: 'MVP', image: 'storm_ui_mvp_icon.png' },
  EndOfMatchAwardHighestKillStreakBoolean: { name: 'Dominator', subtitle: 'Highest Kill Streak', image: 'storm_ui_mvp_icons_rewards_dominator.png'},
  EndOfMatchAwardMostVengeancesPerformedBoolean: { name: 'Avenger', subtitle: 'Most Vengeances Performed', image: 'storm_ui_mvp_icons_rewards_avenger.png'},
  EndOfMatchAwardMostDaredevilEscapesBoolean: { name: 'Daredevil', subtitle: 'Most Daredevil Escapes', image: 'storm_ui_mvp_icons_rewards_daredevil.png'},
  EndOfMatchAwardMostEscapesBoolean: {name: 'Escape Artist', subtitle: 'Most Escapes', image: 'storm_ui_mvp_icons_rewards_escapeartist.png'},
  EndOfMatchAwardMostXPContributionBoolean: {name: 'Experienced', subtitle: 'Most XP Contribution', image: 'storm_ui_mvp_icons_rewards_experienced.png'},
  EndOfMatchAwardMostHeroDamageDoneBoolean: {name: 'Painbringer', subtitle: 'Most Hero Damage Done', image: 'storm_ui_mvp_icons_rewards_painbringer.png'},
  EndOfMatchAwardMostKillsBoolean: {name: 'Finisher', subtitle: 'Most Kills', image: 'storm_ui_mvp_icons_rewards_finisher.png'},
  EndOfMatchAwardHatTrickBoolean: {name: 'Hat Trick', subtitle: 'First Three Kills Of The Match', image: 'storm_ui_mvp_icons_rewards_hottrick.png'},
  EndOfMatchAwardClutchHealerBoolean: {name: 'Clutch Healer', subtitle: 'Clutch Healer', image: 'storm_ui_mvp_icons_rewards_clutchhealer.png'},
  EndOfMatchAwardMostProtectionBoolean: {name: 'Protector', subtitle: 'Most Protection/Shields', image: 'storm_ui_mvp_icons_rewards_protector.png'},
  EndOfMatchAward0DeathsBoolean: {name: 'Sole Survivor', subtitle: 'No Deaths', image: 'storm_ui_mvp_icons_rewards_solesurvivor.png'},
  EndOfMatchAwardMostSiegeDamageDoneBoolean: {name: 'Seige Master', subtitle: 'Most Seige Damage Done', image: 'storm_ui_mvp_icons_rewards_siegemaster.png'},
  EndOfMatchAwardMostDamageTakenBoolean: {name: 'Bulwark', subtitle: 'Most Damage Taken', image: 'storm_ui_mvp_icons_rewards_bulwark.png'},
  EndOfMatchAward0OutnumberedDeathsBoolean: {name: 'Team Player', subtitle: 'No Deaths While Outnumbered', image: 'storm_ui_mvp_icons_rewards_teamplayer.png'},
  EndOfMatchAwardMostHealingBoolean: {name: 'Main Healer', subtitle: 'Most Healing', image: 'storm_ui_mvp_icons_rewards_mainhealer.png'},
  EndOfMatchAwardMostStunsBoolean: {name: 'Stunner', subtitle: 'Most Stuns', image: 'storm_ui_mvp_icons_rewards_stunner.png'},
  EndOfMatchAwardMostRootsBoolean: {name: 'Trapper', subtitle: 'Most Roots', image: 'storm_ui_mvp_icons_rewards_trapper.png'},
  EndOfMatchAwardMostSilencesBoolean: {name: 'Silencer', subtitle: 'Most Silences', image: 'storm_ui_mvp_icons_rewards_silencer.png'},
  EndOfMatchAwardMostMercCampsCapturedBoolean: {name: 'Headhunter', subtitle: 'Most Mercenary Camps Captured', image: 'storm_ui_mvp_icons_rewards_headhunter.png'},
  EndOfMatchAwardMapSpecificBoolean: {name: 'Map Objective', subtitle: 'Map Specific Award', image: 'storm_ui_mvp_icons_rewards_cannoneer.png'},
  EndOfMatchAwardMostAltarDamageDone: {name: 'Cannoneer', subtitle: 'Most Altar Damage Done', image: 'storm_ui_mvp_icons_rewards_cannoneer.png'},
  EndOfMatchAwardMostDragonShrinesCapturedBoolean: {name: 'Shriner', subtitle: 'Most Dragon Shrines Captured', image: 'storm_ui_mvp_icons_rewards_shriner.png'},
  EndOfMatchAwardMostCurseDamageDoneBoolean: {name: 'Master of the Curse', subtitle: 'Most Curse Damage Done', image: 'storm_ui_mvp_icons_rewards_masterofthecurse.png'},
  EndOfMatchAwardMostCoinsPaidBoolean: {name: 'Moneybags', subtitle: 'Most Coins Paid', image: 'storm_ui_mvp_icons_rewards_moneybags.png'},
  EndOfMatchAwardMostImmortalDamageBoolean: {name: 'Immortal Slayer', subtitle: 'Most Immortal Damage Done', image: 'storm_ui_mvp_icons_rewards_immortalslayer.png'},
  EndOfMatchAwardMostDamageDoneToZergBoolean: {name: 'Zerg Crusher', subtitle: 'Most Damage Done To Zerg', image: 'storm_ui_mvp_icons_rewards_zergcrusher.png'},
  EndOfMatchAwardMostDamageToPlantsBoolean: {name: 'Garden Terror', subtitle: 'Most Damage To Plants', image: 'storm_ui_mvp_icons_rewards_gardenterror.png'},
  EndOfMatchAwardMostDamageToMinionsBoolean: {name: 'Guardian Slayer', subtitle: 'Most Damage To Shrine Minions', image: 'storm_ui_mvp_icons_rewards_guardianslayer.png'},
  EndOfMatchAwardMostTimeInTempleBoolean: {name: 'Temple Master', subtitle: 'Most Time In Temple', image: 'storm_ui_mvp_icons_rewards_templemaster.png'},
  EndOfMatchAwardMostGemsTurnedInBoolean: {name: 'Jeweler', subtitle: 'Most Gems Turned In', image: 'storm_ui_mvp_icons_rewards_jeweler.png'},
  EndOfMatchAwardMostSkullsCollectedBoolean: {name: 'Skull Collector', subtitle: 'Most Skulls Collected', image: 'storm_ui_mvp_icons_rewards_skullcollector.png'},
  EndOfMatchAwardMostNukeDamageDoneBoolean: {name: 'Da Bomb', subtitle: 'Most Nuke Damage Done', image: 'storm_ui_mvp_icons_rewards_dabomb.png'},
  EndOfMatchAwardMostTeamfightDamageTakenBoolean: {name: 'Guardian', subtitle: 'Most Team Fight Damage Taken', image: 'storm_ui_mvp_icons_rewards_guardian.png'},
  EndOfMatchAwardMostTeamfightHealingDoneBoolean: {name: 'Combat Medic', subtitle: 'Most Team Fight Healing', image: 'storm_ui_mvp_icons_rewards_combatmedic.png'},
  EndOfMatchAwardMostTeamfightHeroDamageDoneBoolean: {name: 'Scrapper', subtitle: 'Most Team Fight Damage Done', image: 'storm_ui_mvp_icons_rewards_scrapper.png'},
  EndOfMatchAwardMostTimePushingBoolean: {name: 'Pusher', subtitle: 'Most Time Pushing', image: 'storm_ui_mvp_icons_rewards_pusher.png'},
  EndOfMatchAwardMostTimeOnPointBoolean: {name: 'Point Guard', subtitle: 'Most Time on Point', image: 'storm_ui_mvp_icons_rewards_pointguard.png'}
}

class HeroesTalents {
  constructor(path) {
    this._heroPath = path + '/hero';
    this._heroImgPath = path + '/images/heroes';
    this._talentImgPath = path + '/images/talents';

    this.loadData();
  }

  // sync'd load, app needs this to open, so should block until loaded
  loadData() {
    this._heroes = {};
    this._talents = {};
    this._roles = {};
    this._heroAttr = {};

    let files = fs.readdirSync(this._heroPath);

    for (let i = 0; i < files.length; i++) {
      let file = this._heroPath + '/' + files[i];

      console.log('loading ' + file + ' (' + (i + 1) + '/' + files.length + ')');
      let data = JSON.parse(fs.readFileSync(file));
      
      // sort everything, some data is replicated but that's ok
      this._heroes[data.name] = data;
      this._heroAttr[data.attributeId] = data.name;

      for (let tier in data.talents) {
        for (let t in data.talents[tier]) {
          this._talents[data.talents[tier][t].talentTreeId] = data.talents[tier][t]
        }
      }

      if (!(data.role in this._roles))
        this._roles[data.role] = { all: [], Ranged: [], Melee: [] };
      
      this._roles[data.role].all.push(data.name);
      this._roles[data.role][data.type].push(data.name);
    }
  }

  get allHeroNames() {
    return Object.keys(this._heroes);
  }

  get heroCount() {
    return Object.keys(this._heroes).length;
  }

  heroRole(data) {
    if (!data.role) {
      let result = [];
      for (let r in this._roles) {
        result = result.concat(this._roles[r][data.type]);
      }
      return result;
    }
    else if (data.type) {
      return this._roles[data.role][data.type];
    }

    return this._roles[data.role].all;
  }

  role(name) {
    if (name in this._heroes) {
      return this._heroes[name].role;
    }

    return '';
  }

  heroNameFromAttr(attr) {
    if (attr in this._heroAttr)
      return this._heroAttr[attr];
    
    return 'NotFound';
  }

  heroIcon(hero) {
    if (hero in this._heroes)
      return this._heroes[hero].icon;

    // specific to this project
    return '../../../images/not-found.png';
  }

  talentIcon(talentName) {
    if (talentName in this._talents) {
      return this._talents[talentName].icon;
    }

    // specific to this project
    return '../../../images/not-found.png';
  }

  talentDesc(talentName) {
    if (talentName in this._talents)
      return this._talents[talentName].description;

    return 'No Description Found.';
  }

  talentName(talentName) {
    if (talentName in this._talents)
      return this._talents[talentName].name;

    return talentName + ' [Removed]';
  }

  awardInfo(award) {
    if (award in Awards)
      return Awards[award];
    
    console.log(award + ' is unknown!');
    return { name: 'Unknown Award', subtitle: '', image: 'not-found.png'};
  }
}

exports.HeroesTalents = HeroesTalents;