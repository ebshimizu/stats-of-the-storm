const fs = require('fs');
const cp = require('child_process');

// this script assumes you are running it from the heroprotocol folder
fs.readdir('./', function(err, items) {
  let cmd = 'pyinstaller';
  let args = ['./heroprotocol.py', '-y'];
  for (let i in items) {
    let file = items[i];

    if (file.match(/protocol[\d]{5}.py$/)) {
      args.push('--hidden-import=' + file.substr(0, file.length - 3));
    }
  }

  console.log('Running command:');
  console.log(cmd + ' ' + args.join(' '));

  let sp = cp.spawn(cmd, args);
  sp.stdout.on('data', (data) => {
    console.log(data);
  });
  sp.stderr.on('data', (data) => {
    console.log(`${data}`);
  });
  sp.on('close', (code) => {
    console.log('complete');
  });
});