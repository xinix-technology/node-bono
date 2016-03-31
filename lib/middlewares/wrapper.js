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
  return function *(next) {
    var prev = this.pathname;
    var newPath;
    var foundBundle = _.find(app.bundles, function(bundle) {
      var p = match(prev, bundle.uri);
      if (p) {
        newPath = p;
        return true;
      }
    });

    if (foundBundle) {
      var downstream = foundBundle.handler.middleware ? compose(foundBundle.handler.middleware)
        : foundBundle.handler;

      this.pathname = newPath;
      this.basepath = foundBundle.uri;

      yield downstream.call(this, function *(){
        this.pathname = prev;
        yield next;
        this.pathname = newPath;
      }.call(this));

      this.pathname = prev;
    } else {
      var routeInfo = app.router.dispatch(this.method, this.pathname);
      this.routeInfo = routeInfo;
      if (routeInfo) {
        this.status = 200;

        this.matches = routeInfo.matches;
        _.merge(this.attributes, routeInfo.attributes);
        var state = routeInfo.handler.apply(this, routeInfo.args);
        if (state) {
          this.state = typeof state === 'object' && (state instanceof Promise || state.toString() === '[object Generator]') ? yield state : state;
        }
      }

      // always hit next otherwise youll never back to upstream
      yield next;
    }
  };
};