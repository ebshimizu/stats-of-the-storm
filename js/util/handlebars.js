const Handlebars = require('handlebars');

// memoize compiled templates for now, ideally it should be preprocessed
const cache = new Map();

function getTemplate(name, selector) {
  const link = document.querySelector('link[name="' + name + '"]');
  return link.import.querySelector(selector).innerHTML;
}

function getHandlebars(name, selector) {
  const key = `${name}-${selector}`;
  if (cache.has(key)) {
    return cache.get(`${name}-${selector}`);
  }
  const result = Handlebars.compile(getTemplate(name, selector));
  cache.set(key, result);
  return result;
}

module.exports = getHandlebars;
