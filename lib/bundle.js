// jshint esnext: true

var koa = require('koa');
var _ = require('lodash');
var wrapper = require('./middlewares/wrapper');
var path = require('path');
var router = require('./router');

var routeMethods = {
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
  'use strict';

  if (!(this instanceof Bundle)) {
    return new Bundle(options);
  }

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
      this.routeMap([route.method || 'get'], route.uri, route.handler);
    }.bind(this));
  }

  if (this.options.bundles) {
    _.forEach(this.options.bundles, function(bundle) {
      this.addBundle(bundle);
    }.bind(this));
  }
}

Bundle.prototype = koa();

var originalCreateContext = Bundle.prototype.createContext;
Bundle.prototype.createContext = function(req, res){
  'use strict';

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
    attributes: {
      get() {
        return this.request.attributes;
      },
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
  'use strict';
  return this.options[key];
};

Bundle.prototype.set = function(key, value) {
  'use strict';
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
  'use strict';
  return this.use(middleware);
};

Bundle.prototype.addBundle = function(bundle) {
  'use strict';
  bundle.handler.finalize();
  this.bundles.push(bundle);
  return this;
};

_.forEach(routeMethods, function(methods, name) {
  'use strict';
  Bundle.prototype['route' + name] = function(pattern, handler, args) {
    return this.routeMap(methods, pattern, handler, args);
  };

  Bundle.prototype['removeRoute' + name] = function(pattern) {
    return this.removeRoute(methods, pattern);
  };
});

Bundle.prototype.routeMap = function(methods, pattern, handler, args) {
  'use strict';

  var route = {
    'methods': methods,
    'pattern': pattern,
    'handler': handler,
    'args': args,
  };

  // this.routes.push(route);
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
  'use strict';

  if (this.finalized) return;

  this.finalized = true;
  this.use(wrapper(this));
};

var originalCallback = Bundle.prototype.callback;
Bundle.prototype.callback = function() {
  'use strict';

  this.finalize();

  return originalCallback.apply(this, arguments);
};
