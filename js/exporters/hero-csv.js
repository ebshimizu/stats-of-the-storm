const DetailStatList = require('../game-data/detail-stat-list');
const PerMapStatList = require('../game-data/map-stats');

function heroDataCSV(docs) {
  // first, setup fields
  let outData = '';

  // identifiers
  outData += 'ToonHandle';
  outData += ',name';
  outData += ',hero';
  outData += ',date';
  outData += ',win';
  outData += ',map';
  outData += ',length';

  // stats in order
  for (let s of DetailStatList) {
    outData += ',' + s;
  }

  for (let m in PerMapStatList) {
    for (let s of PerMapStatList[m]) {
      outData += ',' + s;
    }
  }

  // talents
  outData += ',Tier 1 Choice';
  outData += ',Tier 2 Choice';
  outData += ',Tier 3 Choice';
  outData += ',Tier 4 Choice';
  outData += ',Tier 5 Choice';
  outData += ',Tier 6 Choice';
  outData += ',Tier 7 Choice';

  // time for exporting
  for (doc of docs) {
    let row = '';

    // identifiers
    row += doc.ToonHandle;
    row += ',' + doc.name;
    row += ',' + doc.hero;
    row += ',' + doc.date;
    row += ',' + (doc.win ? 'true' : 'false');
    row += ',' + doc.map;
    row += ',' + doc.length;

    // stats in order
    for (let s of DetailStatList) {
      row += ',' + doc.gameStats[s];
    }

    for (let m in PerMapStatList) {
      for (let s of PerMapStatList[m]) {
        if (s in doc.gameStats) {
          row += ',' + doc.gameStats[s];
        } else {
          row += ', ';
        }
      }
    }

    // talents, should render to undefined if, well, undefined
    row += ',' + doc.talents['Tier 1 Choice'];
    row += ',' + doc.talents['Tier 2 Choice'];
    row += ',' + doc.talents['Tier 3 Choice'];
    row += ',' + doc.talents['Tier 4 Choice'];
    row += ',' + doc.talents['Tier 5 Choice'];
    row += ',' + doc.talents['Tier 6 Choice'];
    row += ',' + doc.talents['Tier 7 Choice'];

    outData += '\n' + row;
  }

  return outData;
}

module.exports = heroDataCSV;
