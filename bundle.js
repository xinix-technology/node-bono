'use strict';

const Koa = require('koa');
const _ = require('lodash');
const wrapper = require('./middlewares/wrapper');
const path = require('path');
const router = require('./router');
const assert = require('assert');

const routeMethods = {
  'Get': ['GET'],
  'Post': ['POST'],
  'Put': ['PUT'],
  'Delete': ['DELETE'],
  'Patch': ['PATCH'],
  'Options': ['OPTIONS'],
  'Any': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

module.exports = Bundle;

function Bundle(options) {
  this.options = {};
  this.bundles = [];
  this.middlewares = [];
  // this.routes = [];

  this.router = router();

  // override koa application attribute
  this.middleware = [];

  _.defaults(this.options, options);

  if (this.options.middlewares) {
    _.forEach(this.options.middlewares, function(middleware) {
      this.use(middleware);
    }.bind(this));
  }

  if (this.options.routes) {
    _.forEach(this.options.routes, function(route) {
      route.methods = route.methods || [route.method || 'get'];
      this.routeMap(route);
    }.bind(this));
  }

  if (this.options.bundles) {
    _.forEach(this.options.bundles, function(bundle) {
      this.addBundle(bundle);
    }.bind(this));
  }
}

Bundle.prototype = new Koa();

const originalCreateContext = Bundle.prototype.createContext;
Bundle.prototype.createContext = function(req, res){
  var context = originalCreateContext.apply(this, arguments);

  context.request.attributes = {};

  Object.defineProperties(context, {
    pathname: {
      get() {
        return this.request.pathname;
      },
      set(pathname) {
        this.request.pathname = pathname;
      }
    },
    basepath: {
      get() {
        return this.request.basepath;
      },
      set(basepath) {
        this.request.basepath = basepath;
      }
    },
    extension: {
      get() {
        return this.request.extension;
      },
      set(extension) {
        this.request.extension = extension;
      }
    },
    parsedBody: {
      get() {
        return this.request.parsedBody;
      },
      set(parsedBody) {
        this.request.parsedBody = parsedBody;
      }
    },
    attributes: {
      get() {
        return this.request.attributes;
      },
    },

    attr: {
      writable: false,
      enumerable: false,
      configurable: false,
      value: function (key, value) {
        switch(arguments.length) {
          case 0:
            return this.attributes;
          case 1:
            return this.attributes[key] || undefined;
          default:
            this.attributes[key] = value;
            break;
        }
      }
    },

    depends: {
      writable: false,
      enumerable: false,
      configurable: false,
      value: function () {
        var attributes = this.attributes;
        var foundMissing = _.find(arguments, arg => !attributes[arg]);
        if (foundMissing) {
          throw new Error(`Unregistered dependency ${foundMissing} middleware!`);
        }
      }
    }
  });

  // override respond

  // parse pathname and extension
  var parsedPath = path.parse(context.request.path);
  context.request.basepath = '';
  context.request.pathname = (parsedPath.dir === '/' ? parsedPath.dir : parsedPath.dir + '/') + parsedPath.name;
  context.request.extension = parsedPath.ext.substr(1);

  return context;
};

Bundle.prototype.get = function(key) {
  return this.options[key];
};

Bundle.prototype.set = function(key, value) {
  if (arguments.length === 1) {
    this.options = key;
  } else {
    this.options[key] = value;
  }
  return this;
};

/**
 * Alias #use
 * @param {[type]} middleware [description]
 */
Bundle.prototype.addMiddleware = function(middleware) {
  return this.use(middleware);
};

Bundle.prototype.addBundle = function(bundle) {
  bundle.handler.finalize();
  this.bundles.push(bundle);
  return this;
};

_.forEach(routeMethods, function(methods, name) {
  Bundle.prototype['route' + name] = function(route) {
    assert.equal(typeof route, 'object', 'Invalid argument, route { object }');
    route.methods = methods;
    return this.routeMap(route);
  };

  Bundle.prototype['removeRoute' + name] = function(pattern) {
    return this.removeRoute(methods, pattern);
  };
});

Bundle.prototype.routeMap = function(route) {
  assert.equal(typeof route, 'object', 'Invalid argument, route { object }');

  if ('string' === typeof route.handler) {
    if ('function' !== typeof this[route.handler]) {
      throw new Error(`Method ${route.handler} is undefined!`);
    }
    route.handler = this[route.handler].bind(this);
  }

  this.router.route(route);

  return this;
};

Bundle.prototype.removeRoute = function(methods, pattern) {
  this.router.removeRoute({
    methods: methods,
    pattern: pattern,
  });

  return this;
};

Bundle.prototype.finalize = function() {
  if (this.finalized) return;

  this.finalized = true;
  this.use(wrapper(this));
};

var originalCallback = Bundle.prototype.callback;
Bundle.prototype.callback = function() {
  this.finalize();

  return originalCallback.apply(this, arguments);
};
