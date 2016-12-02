'use strict';

const _ = require('lodash');
const compose = require('koa-compose');
const co = require('co');

function match(path, prefix) {
  // does not match prefix at all
  if (0 !== path.indexOf(prefix)) return false;

  var newPath = path.replace(prefix, '') || '/';
  return newPath;
}

module.exports = function(app) {
  return function (context, next) {
    var prev = context.pathname;
    var newPath;
    var foundBundle = _.find(app.bundles, function(bundle) {
      var p = match(prev, bundle.uri);
      if (p) {
        newPath = p;
        return true;
      }
    });

    if (foundBundle) {
      context.attr('route.bundle', foundBundle);

      var downstream = foundBundle.handler.middleware ? compose(foundBundle.handler.middleware)
        : foundBundle.handler;

      context.pathname = newPath;
      context.basepath = foundBundle.uri;

      return downstream(context)
        .then(() => {
          context.pathname = prev;
          return next();
        });

      // yield downstream.call(context, function *(){
      //   context.pathname = prev;
      //   yield next;
      //   context.pathname = newPath;
      // }.call(context));

    } else {
      var routeInfo = app.router.dispatch(context.method, context.pathname);
      context.attr('route.info', routeInfo);

      if (routeInfo) {
        context.status = 200;

        context.matches = routeInfo.matches;
        _.merge(context.attributes, routeInfo.attributes);

        return Promise.resolve(routeInfo.handler(context, routeInfo.attributes))
          .then(state => {
            if (undefined !== state) {
              context.state = state;
            }
            return next();
          });
      }
    }
  };
};