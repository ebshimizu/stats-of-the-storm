// a loader for the data contained in the heroes folder of heroes-talents

const fs = require('fs');

const Awards = require('./game-data/awards');
const TalentRenames = require('./game-data/talent-renames');

class HeroesTalents {
  constructor(path, extra) {
    this._heroPath = path + '/hero';
    this._heroImgPath = path + '/images/heroes';
    this._talentImgPath = path + '/images/talents';
    this._missingPath = extra + '/deleted_talents.json';

    this.loadData();
  }

  // sync'd load, app needs this to open, so should block until loaded
  loadData() {
    this._heroes = {};
    this._talents = {};
    this._roles = {};
    this._heroAttr = {};
    this._lcAttr = {};

    // extra data
    // load this first in case it gets overwritten
    console.log('loading deleted talents from ' + this._missingPath);
    let deleted = JSON.parse(fs.readFileSync(this._missingPath)); // eslint-disable-line global-require
    for (let i in deleted) {
      deleted[i].removed = true;
      this._talents[deleted[i].talentTreeId] = deleted[i];
    }

    let files = fs.readdirSync(this._heroPath);

    for (let i = 0; i < files.length; i++) {
      let file = this._heroPath + '/' + files[i];

      console.log('loading ' + file + ' (' + (i + 1) + '/' + files.length + ')');
      let data = JSON.parse(fs.readFileSync(file)); // eslint-disable-line global-require

      // sort everything, some data is replicated but that's ok

      // this is a stats of the storm specific hack because I keyed off of lucio's unaccented hero name
      // this has been regarded as a mistake but we are at version 2.3.x+ so here we are
      // with apologies to the proper accent
      if (data.name === 'Lúcio') {
        data.name = 'Lucio';
      }
      // end hack

      this._heroes[data.name] = data;
      this._heroAttr[data.attributeId] = data.name;
      this._lcAttr[data.attributeId.toLowerCase()] = data.name;

      for (let tier in data.talents) {
        for (let t in data.talents[tier]) {
          this._talents[data.talents[tier][t].talentTreeId] = data.talents[tier][t];
        }
      }

      if (!(data.expandedRole in this._roles)) this._roles[data.expandedRole] = { all: [], Ranged: [], Melee: [] };

      this._roles[data.expandedRole].all.push(data.name);
      this._roles[data.expandedRole][data.type].push(data.name);
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
    } else if (data.type) {
      return this._roles[data.role][data.type];
    }

    return this._roles[data.role].all;
  }

  heroRoleCount(role) {
    return this._roles[role].all.length;
  }

  get roles() {
    return Object.keys(this._roles);
  }

  role(name) {
    if (name in this._heroes) {
      return this._heroes[name].expandedRole;
    }

    return '';
  }

  oldRole(name) {
    if (name in this._heroes) {
      return this._heroes[name].role;
    }

    return '';
  }

  heroNameFromAttr(attr) {
    if (attr in this._heroAttr) return this._heroAttr[attr];

    return 'NotFound';
  }

  heroNameFromLCAttr(attr) {
    if (attr in this._lcAttr) {
      return this._lcAttr[attr];
    }

    return 'NotFound';
  }

  heroIcon(hero) {
    if (hero in this._heroes) return this._heroes[hero].icon;

    // specific to this project
    return '../../../images/not-found.png';
  }

  talentIcon(talentName) {
    let id = this.getRenamedTalent(talentName);

    if (id in this._talents) {
      return this._talents[id].icon;
    }

    // specific to this project
    return '../../../images/not-found.png';
  }

  talentDesc(talentName) {
    let id = this.getRenamedTalent(talentName);

    if (id in this._talents) {
      return this._talents[id].description;
    }

    return 'No Description Found.';
  }

  talentName(talentName) {
    let id = this.getRenamedTalent(talentName);

    if (id in this._talents) {
      if (this._talents[id].removed) {
        return this._talents[id].name + ' [Removed]';
      }

      return this._talents[id].name;
    }

    return id + ' [Removed]';
  }

  // checks for renamed talent IDs
  getRenamedTalent(id) {
    if (id in TalentRenames) {
      return TalentRenames[id];
    }

    return id;
  }

  awardInfo(award) {
    if (award in Awards) return Awards[award];

    console.log(award + ' is unknown!');
    return { name: 'Unknown Award', subtitle: '', image: 'not-found.png' };
  }
}

exports.HeroesTalents = HeroesTalents;
