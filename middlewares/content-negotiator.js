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

  function renderJSON(context) {
    return context.state;
  }

  function match(contentType) {
    return options.mapper[contentType] || contentType;
  }

  function negotiate(context) {

    // if route already set content type, use this instead
    var responseContentType = context.type;
    if (responseContentType) {
        return responseContentType;
    }

    if (context.extension && options.mapper[context.extension]) {
      return options.mapper[context.extension];
    }


    if (context.request.type) {
      return options.mapper[context.request.type] || context.request.type;
    }

    var accepted = context.accepts(options.accepts);
    if (accepted) {
      return options.mapper[accepted] || accepted;
    }
  }

  function render(context) {
    return options.renderers[context.type](context);
  }

  return function (context, next) {
    return next().then(function() {
      if (context.attributes['@renderer.rendered']) {
        return;
      }

      var contentType = negotiate(context);
      if (contentType) {
        context.type = match(contentType);
        if (options.renderers[context.type]) {
          return Promise.resolve(options.renderers[context.type](context))
            .then(function(body) {
              context.body = body;
              context.attributes['@renderer.rendered'] = 'content-negotiator';
            });
        }
      }
    });
  };
};