// a loader for the data contained in the heroes folder of heroes-talents

const fs = require('fs');

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

    let files = fs.readdirSync(this._heroPath);

    for (let i = 0; i < files.length; i++) {
      let file = this._heroPath + '/' + files[i];

      console.log('loading ' + file + ' (' + (i + 1) + '/' + files.length + ')');
      let data = JSON.parse(fs.readFileSync(file));
      
      // sort everything, some data is replicated but that's ok
      this._heroes[data.name] = data;

      for (let tier in data.talents) {
        for (let t in data.talents[tier]) {
          this._talents[data.talents[tier][t].talentTreeId] = data.talents[tier][t]
        }
      }

      if (!(data.role in this._roles))
        this._roles[data.role] = [];
      
      this._roles[data.role].push(data.name);
    }
  }

  heroIcon(hero) {
    if (hero in this._heroes)
      return this._heroes[hero].icon;

    // specific to this project
    return 'hero-not-found.png';
  }

  talentIcon(talentName) {
    if (talentName in this._talents) {
      return this._talents[talentName].icon;
    }

    // specific to this project
    return 'talent-not-found.png';
  }

  talentDesc(talentName) {
    if (talentName in this._talents)
      return this._talents[talentName].description;

    return 'No Description Found.';
  }

  talentName(talentName) {
    if (talentName in this._talents)
      return this._talents[talentName].name;

    return talentName + ' [Depricated]';
  }
}

exports.HeroesTalents = HeroesTalents;