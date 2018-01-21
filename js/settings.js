var settingsRowTemplate;

function initSettingsPage() {
  // templates
  settingsRowTemplate = Handlebars.compile(getTemplate('settings', '#replay-row-template').find('tr')[0].outerHTML);


  let path = settings.get('dbPath');
  $('#settings-set-db-folder input').val(path);
}