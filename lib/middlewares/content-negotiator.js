// jshint esnext: true

var co = require('co');
var opts = require('../utils/opts');

module.exports = function(options) {
  'use strict';

  var defaultOptions = {
    matchingTypes: {
      'application/x-www-form-urlencoded': 'text/html',
      'multipart/form-data': 'text/html'
    },
    accepts: {
      'json': 'application/json',
      'text/html': null,
      'application/json': null,
    },
    renderers: {
      'application/json': renderJSON,
    }
  };

  options = opts(defaultOptions)
    .merge(options)
    .toArray();

  var optionsAccepts = Object.keys(options.accepts);

  function renderJSON(ctx) {
    return ctx.state;
  }

  function match(contentType) {
    return options.matchingTypes[contentType] || contentType;
  }

  function negotiate(ctx) {

    if (ctx.extension && options.accepts[ctx.extension]) {
      return options.accepts[ctx.extension];
    }

    if (ctx.request.type) {
      return ctx.request.type;
    }

    var accepted = ctx.accepts(optionsAccepts);
    if (accepted) {
      return options.accepts[accepted] || accepted;
    }
  }

  function *render(ctx) {
    return yield options.renderers[ctx.type](ctx);
  }

  return function *(next) {
    yield next;

    var contentType = negotiate(this);
    if (contentType) {
      this.type = match(contentType);
      if (options.renderers[this.type]) {
        this.body = yield co.wrap(options.renderers[this.type])(this);
      } else if (!this.body) {
        this.throw(406, 'content type "' + contentType + '" not acceptable or unable to render properly');
      }
    }
  };
};