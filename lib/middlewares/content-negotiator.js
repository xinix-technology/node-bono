'use strict';

const co = require('co');
const opts = require('../utils/opts');

module.exports = function(options) {
  var defaultOptions = {
    mapper: {
      'application/x-www-form-urlencoded': 'text/html',
      'multipart/form-data': 'text/html',
      'json': 'application/json',
    },
    renderers: {
      'application/json': renderJSON,
    },
    accepts: [
      'text/html'
    ],
  };

  options = opts(defaultOptions)
    .merge(options)
    .toArray();

  function renderJSON(ctx) {
    return ctx.state;
  }

  function match(contentType) {
    return options.mapper[contentType] || contentType;
  }

  function negotiate(ctx) {

    if (ctx.extension && options.mapper[ctx.extension]) {
      return options.mapper[ctx.extension];
    }

    if (ctx.request.type) {
      return options.mapper[ctx.request.type] || ctx.request.type;
    }

    var accepted = ctx.accepts(options.accepts);
    if (accepted) {
      return options.mapper[accepted] || accepted;
    }
  }

  function *render(ctx) {
    return yield options.renderers[ctx.type](ctx);
  }

  return function *(next) {
    yield next;

    if (this.attributes['response.rendered']) {
      return;
    }

    var contentType = negotiate(this);
    if (contentType) {
      this.type = match(contentType);
      if (options.renderers[this.type]) {
        this.body = yield co.wrap(options.renderers[this.type])(this);
        this.attributes['response.rendered'] = 'content-negotiator';
      // } else if (!this.body) {
      //   this.throw(406, 'content type "' + contentType + '" not acceptable or unable to render properly');
      }
    }
  };
};