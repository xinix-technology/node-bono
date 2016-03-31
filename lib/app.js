'use strict';

const path = require('path');
const Bundle = require('./bundle');
const opts = require('./utils/opts');

module.exports = App;

function App(options) {
  if (!(this instanceof App)) {
    return new App(options);
  }

  options = options || {};

  var defaultOptions = {
    'env': process.env.ENV || 'development',
    'config.path': './config'
  };

  options = opts(defaultOptions, defaultOptions.env)
    .mergeFile(path.join(options['config.path'] || defaultOptions['config.path'], 'config.js'))
    .merge(options)
    .toArray();

  Bundle.call(this, options);
}

App.Bundle = Bundle;

Object.setPrototypeOf(App.prototype, Object.create(Bundle.prototype));

