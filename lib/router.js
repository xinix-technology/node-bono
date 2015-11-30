// jshint esnext: true
var _ = require('lodash');
var co = require('co');

var methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

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
  'use strict';

  if (!(this instanceof Router)) {
    return new Router();
  }

  this.routes = {};
  _.forEach(methods, function(method) {
    this.routes[method] = [];
  }.bind(this));
}

Router.prototype._isStatic = function(pattern) {
  'use strict';
  return pattern.match(/[[{]/) ? false: true;
};

Router.prototype._routeRegExp = function(str) {
  'use strict';
  var chunks = str.split('[');
  if (chunks > 2) {
    throw new Error('Invalid use of optional params');
  }

  var matches = chunks[0].match(/{[^}]+}/);
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
  'use strict';

  _.forEach(route.methods, function(method) {
    var pattern, args = [], type;
    if (typeof route.pattern === 'string') {
      if (this._isStatic(route.pattern)) {
        type = 's';
        pattern = route.pattern;
      } else {
        type = 'v';
        var result = this._routeRegExp(route.pattern);
        pattern = result[0];
        args = result[1];
      }
    } else if (route.pattern instanceof RegExp) {
      type = 'v';
      pattern = route.pattern;
      args = [];
    } else {
      throw new Error('Unimplemented pattern for route: ' + (typeof route.pattern));
    }
    this.routes[method.toUpperCase()].push({
      type: type,
      pattern: pattern,
      args: args,
      handler: route.handler,
    });
  }.bind(this));

  return this;
};

Router.prototype.dispatch = function(method, path) {
  'use strict';

  var attributes = {};
  var route = _.find(this.routes[method], function(route) {
    if (route.type === 's') {
      if (path === route.pattern) {
        return true;
      }
    } else if (route.type === 'v') {
      var result = path.match(route.pattern);
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
      handler: route.handler,
      attributes: attributes
    };
  }
};