const Koa = require('koa');
const Router = require('./router');
const Bundler = require('./bundler');
const compose = require('koa-compose');
const parse = require('co-body');
const qs = require('qs');

const kDownstream = Symbol('downstream');

class Bundle extends Koa {
  constructor () {
    super();

    this.use(bundleMiddleware(this));

    this.router = new Router();
    this.bundler = new Bundler();
  }

  createContext (req, res) {
    const ctx = super.createContext(req, res);

    Object.assign(ctx, {
      parameters: {},

      async parse (type) {
        if ('_parsedBody' in this.request) {
          return this.request._parsedBody;
        } else if ('_parsedError' in this.request) {
          throw this.request._parsedError;
        } else {
          try {
            if (!type) {
              this.request._parsedBody = await parse(this);
            } else if (!parse[type]) {
              throw new Error(`Parser ${type} not found`);
            } else {
              this.request._parsedBody = await parse[type](this);
            }
            return this.request._parsedBody;
          } catch (err) {
            err.status = err.status || 400;
            this.request._parsedError = err;
            throw err;
          }
        }
      },
    });

    Object.defineProperty(ctx.request, 'query', {
      get () {
        const str = this.querystring;
        if (!str) return {};
        const c = this._querycache = this._querycache || {};
        if (!c[str]) {
          c[str] = qs.parse(str);
        }
        return c[str];
      },

      set (obj) {
        this.querystring = qs.stringify(obj);
      },
    });

    return ctx;
  }

  use (fn) {
    const lastFn = this.middleware.pop();
    super.use(fn);
    if (lastFn) {
      super.use(lastFn);
    }
    return this;
  }

  bundle (uri, bundle) {
    this.bundler.set(uri, bundle);
  }

  get (uri, callback) {
    this.route(['GET'], uri, callback);
  }

  post (uri, callback) {
    this.route(['POST'], uri, callback);
  }

  put (uri, callback) {
    this.route(['PUT'], uri, callback);
  }

  patch (uri, callback) {
    this.route(['PATCH'], uri, callback);
  }

  delete (uri, callback) {
    this.route(['DELETE'], uri, callback);
  }

  route (methods, uri, callback) {
    this.router.route(methods, uri, callback);
  }

  getDownstream () {
    if (!this[kDownstream]) {
      this[kDownstream] = compose(this.middleware);
    }

    return this[kDownstream];
  }

  async dispatch (matcher, ctx) {
    const originalPath = ctx.path;

    ctx.path = matcher.shiftPath(ctx);

    const downstream = this.getDownstream();

    await downstream(ctx);

    ctx.path = originalPath;
  }
}

function bundleMiddleware (bundle) {
  return async (ctx, next) => {
    const { bundler, router } = bundle;

    ctx.state.bundle = bundle;

    const delegated = await bundler.delegate(ctx);
    if (!delegated) {
      await router.delegate(ctx);
    }

    await next();
  };
}

module.exports = Bundle;
