// formats to mm:ss
function formatSeconds(val) {
  let invert = false;
  if (val < 0)
    invert = true;
  let fval = Math.abs(val);

  let duration = new Date(fval * 1000);
  let seconds = duration.getUTCSeconds();
  let minutes = duration.getUTCMinutes();

  return (invert ? '-' : '') + (minutes < 1 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function formatStat(field, val, allFixed = false) {
  if (val === undefined)
    return 0;

  if (field === 'KillParticipation' || field === 'timeDeadPct' || field === 'mercUptimePercent' || field === 'pct')
    return (val * 100).toLocaleString(undefined, { maximumFractionDigits: 1}) + '%';
  else if (field === 'KDA')
    return val.toLocaleString(undefined, { maximumFractionDigits: 1});
  else if (field.startsWith('Time') || field === 'OnFireTimeOnFire' || field === 'timeTo10' ||
    field === 'timeTo20' || field === 'mercUptime' || field === 'avgTimeSpentDead')
    return formatSeconds(val);

  if (allFixed) {
    return val.toLocaleString(undefined, { maximumFractionDigits: 1});
  }

  return val.toLocaleString();
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
  formatSeconds,
  formatStat,
  capitalize
};
