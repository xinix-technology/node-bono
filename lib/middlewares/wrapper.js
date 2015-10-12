// jshint esnext: true

var _ = require('lodash');
var compose = require('koa-compose');

function match(path, prefix) {
  'use strict';

  // does not match prefix at all
  if (0 !== path.indexOf(prefix)) return false;

  var newPath = path.replace(prefix, '') || '/';
  return newPath;
}

module.exports = function(app) {
  'use strict';

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
      if (routeInfo) {
        _.merge(this.attributes, routeInfo.attributes);

        var state = routeInfo.handler.apply(this, routeInfo.args);
        this.status = 200;
        if (state) {
          this.state = yield state;
        }
      }

      // always hit next otherwise youll never back to upstream
      yield next;
    }
  };
};