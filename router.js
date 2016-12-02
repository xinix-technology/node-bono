'use strict';

const _ = require('lodash');
const co = require('co');
const assert = require('assert');

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

// var optionalParam = /\((.*?)\)/g;
// var namedParam    = /(\(\?)?:\w+/g;
// var splatParam    = /\*\w+/g;
// var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;
// _routeToRegExp: function(route) {
//   route = route.replace(escapeRegExp, '\\$&')
//     .replace(optionalParam, '(?:$1)?')
//     .replace(namedParam, function(match, optional) {
//       return optional ? match : '([^/?]+)';
//     })
//     .replace(splatParam, '([^?]*?)');
//   return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
// },

module.exports = Router;

function Router() {
  if (!(this instanceof Router)) {
    return new Router();
  }

  this.routes = {};
  _.forEach(methods, function(method) {
    this.routes[method] = [];
  }.bind(this));
}

Router.prototype._isStatic = function(pattern) {
  return pattern.match(/[[{]/) ? false: true;
};

Router.prototype._routeRegExp = function(str) {
  var chunks = str.split('[');

  assert(chunks.length <= 2, 'Invalid use of optional params');

  // var matches = chunks[0].match(/{[^}]+}/);
  var tokens = [];
  var re = chunks[0].replace(/{([^}]+)}/g, function(g, token) {
    tokens.push(token);
    return '([^\/]+)';
  }).replace(/\//g, '\\/');

  var optRe = '';
  if (chunks[1]) {
    optRe = '(?:' + chunks[1].slice(0, -1).replace(/{([^}]+)}/g, function(g, token) {
      tokens.push(token);
      return '([^\/]+)';
    }).replace(/\//g, '\\/') + ')?';
  }
  return [new RegExp('^' + re + optRe + '$'), tokens];
};

Router.prototype.route = function(route) {
  _.forEach(route.methods || [ route.method || 'GET' ], function(method) {
    var single = _.clone(route);
    single.pattern = single.pattern || single.uri;
    single.method = method;
    if (typeof single.pattern === 'string') {
      if (this._isStatic(single.pattern)) {
        single.type = 's';
        single.args = [];
      } else {
        single.type = 'v';
        var result = this._routeRegExp(single.pattern);
        single.pattern = result[0];
        single.args = result[1];
      }
    } else if (single.pattern instanceof RegExp) {
      single.type = 'v';
      single.args = single.args || [];
    } else {
      throw new Error('Unimplemented pattern for route: ' + (typeof single.pattern));
    }
    this.routes[method.toUpperCase()].push(single);
  }.bind(this));

  return this;
};

Router.prototype.removeRoute = function(route) {
  _.forEach(route.methods, function(method) {
    var routes = this.routes[method];
    var index = _.findIndex(routes, function(r) {
      return r.pattern === route.pattern;
    });
    if (index >= 0) {
      routes.splice(index, 1);
    }
  }.bind(this));
};

Router.prototype.dispatch = function(method, path) {
  var attributes = {}, matches = [];
  var route = _.find(this.routes[method], function(route) {
    if (route.type === 's') {
      if (path === route.pattern) {
        return true;
      }
    } else if (route.type === 'v') {
      var result = path.match(route.pattern);
      if (result) {
        matches = result.slice(1);
      }
      if (result) {
        _.forEach(route.args, function(name, index) {
          attributes[name] = result[index + 1];
        });
        return true;
      }
    } else {
      throw new Error('Unimplemented');
    }
  });

  if (route) {
    return {
      route: route,
      handler: route.handler,
      attributes: attributes,
      matches: matches,
    };
  }
};