'use strict';

const Opts = require('../utils/opts');
const rawBody = require('raw-body');
const qs = require('qs');

const WITH_BODY_METHODS = {
  'POST': true,
  'PUT': true,
};

module.exports = function(options) {
  options = (new Opts({
      parsers: {
        json: function(body) {
          return JSON.parse(body);
        },
        form: function(body) {
          return qs(body);
        },
      }
    })).merge(options)
    .toArray();
  return function(context, next) {
    context.attr('@bodyParser', true);

    if (WITH_BODY_METHODS[context.method]) {
      return rawBody(context.req)
        .then(function(buffer) {
          context.request.body = buffer;
          for (var i in options.parsers) {
            if (context.is(i)) {
              context.request.parsedBody = options.parsers[i](buffer);
              return;
            }
          }
        })
        .then(next);
    } else {
      return next();
    }
  };
};