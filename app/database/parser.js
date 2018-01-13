const fs = require('child_process')

const ReplayDataType = {
  game: "gameevents",
  message: "messageevents",
  tracker: "trackerevents",
  attribute: "attributeevents",
  header: "header",
  details: "details",
  init: "initdata",
  stats: "stats"
}

// it's everything except gameevents which is just a massive amount of data
const CommonReplayData = [ReplayDataType.message, ReplayDataType.tracker, ReplayDataType.attribute, ReplayDataType.header, ReplayDataType.details, ReplayDataType.init, ReplayDataType.stats];

// this just wraps the reference python implementation inside of
// a javascript module and will return json objects containing the different
// bundles of data provided by the parser.
// this file also assumes the existence of python on the host computer
function parse(file, requestedData, opts) {
  var replay = {};

  // execute sync
  for (var i in requestedData) {
    console.log("Retrieving " + requestedData[i])

    if (requestedData[i] === ReplayDataType.game) {
      console.log("This is a ton of data, processing may take additional time...");
    }

    const script = fs.spawnSync('python', ['../third_party/heroprotocol/heroprotocol.py','--json', '--' + requestedData[i], file], {
      maxBuffer: 500000*1024    // if anyone asks why it's 500MB it's because gameevents is huge
    });

    var rawData = `${script.stdout}`;

    // each line is a new json object
    rawData = rawData.replace(/\}\r?\n\{/g, '},\n{');
    rawData = rawData.replace(/\]\r?\n\{/g, '],\n{');

    rawData = '[' + rawData + ']';

    replay[requestedData[i]] = JSON.parse(rawData);
  }

  return replay;
}

exports.parse = parse;
exports.ReplayDataType = ReplayDataType
exports.CommonReplayData = CommonReplayData