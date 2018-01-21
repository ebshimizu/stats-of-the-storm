function initSettingsPage() {
  let path = settings.get('dbPath');
  $('#settings-set-db-folder input').val(path);
}