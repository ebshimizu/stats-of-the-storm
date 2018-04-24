const MPQArchive = require('empeeku/mpyq').MPQArchive;
const fs = require('fs');
const XRegExp = require('xregexp');

function getBattletags(archive) {
  let data = new MPQArchive(archive);
  let battlelobby = data.readFile('replay.server.battlelobby').toString();

  let btagRegExp = XRegExp('(\\p{L}|\\d){3,24}#\\d{4,10}[zØ]?', 'g');
  let matches = battlelobby.match(btagRegExp);

  // process
  let tagMap = [];
  for (let match of matches) {
    // split into name + tag
    let name = match.substr(0, match.indexOf('#'));
    let tag = match.substr(match.indexOf('#') + 1);
    tagMap.push({ tag, name, full: match });
    console.log('found tag: ' + match);
  }

  return tagMap;
}

exports.get = getBattletags;