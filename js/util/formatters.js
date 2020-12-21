// formats to mm:ss
function formatSeconds(val) {
  if (isNaN(val)) return '--:--';

  let invert = false;
  if (val < 0) invert = true;
  let fval = Math.abs(val);

  let duration = new Date(fval * 1000);
  let seconds = duration.getUTCSeconds();
  let minutes = duration.getUTCMinutes();
  let hours = duration.getUTCHours();

  // going to display minutes only here, can change this later maybe
  minutes += hours * 60;

  return (invert ? '-' : '') + (minutes < 1 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

function formatStat(field, val, allFixed = false) {
  if (Number.isNaN(val)) return '-';

  if (val === undefined) return 0;

  if (
    field.startsWith('pct') ||
    field === 'mercUptimePercent' ||
    field === 'levelAdvPct' ||
    field === 'KillParticipation' ||
    field === 'timeDeadPct' ||
    field === 'DPct' ||
    field === 'DTPct' ||
    field === 'HPct' ||
    field === 'SoftCCPct' ||
    field === 'HardCCPct'
  ) {
    return (val * 100).toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%';
  } else if (field === 'KDA') return val.toLocaleString('en-US', { maximumFractionDigits: 1 });
  else if (
    field.startsWith('Time') ||
    field.startsWith('time') ||
    field === 'OnFireTimeOnFire' ||
    field === 'timeTo10' ||
    field == 'levelAdvTime' ||
    field === 'timeTo20' ||
    field === 'mercUptime' ||
    field === 'avgTimeSpentDead'
  ) {
    return formatSeconds(val);
  } else if (field === 'passiveXPDiff') {
    return `+${((val - 1) * 100).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })}%`;
  }

  if (allFixed) {
    return val.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }

  return val.toLocaleString('en-US');
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDelta(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=/]/g, function (s) {
    return entityMap[s];
  });
}

module.exports = {
  formatSeconds,
  formatStat,
  capitalize,
  formatDelta,
  escapeHtml,
};
