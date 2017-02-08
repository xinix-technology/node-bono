const Koa = require('koa');
const Router = require('./router');
const Bundler = require('./bundler');
const compose = require('koa-compose');
const parse = require('co-body');

class Bundle extends Koa {
  constructor () {
    super();

    this.router = new Router();
    this.bundler = new Bundler();
  }

  createContext (req, res) {
    let ctx = super.createContext(req, res);

    Object.assign(ctx, {
      parse (type) {
        if ('_parsedBody' in this.request === false) {
          if (!type) {
            this.request._parsedBody = parse(this);
          } else if (!parse[type]) {
            throw new Error(`Parser ${type} not found`);
          } else {
            this.request._parsedBody = parse[type](this);
          }
        }

        return this.request._parsedBody;
      },
    });

    return ctx;
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

  delete (uri, callback) {
    this.route(['DELETE'], uri, callback);
  }

  route (methods, uri, callback) {
    this.router.route(methods, uri, callback);
  }

  finalize () {
    if (!this._downstream) {
      this.use(bundleMiddleware(this));
      this._downstream = compose(this.middleware);
    }

    return this._downstream;
  }

  async dispatch (uri, ctx) {
    const originalPath = ctx.path;
    ctx.path = ctx.path.substr(uri.length) || '/';

    const downstream = this.finalize();

    await downstream(ctx);

    ctx.path = originalPath;
  }

  callback () {
    this.finalize();

    return super.callback();
  }
}

function bundleMiddleware (bundle) {
  const { bundler, router } = bundle;
  return async (ctx, next) => {
    const delegated = await bundler.delegate(ctx);
    if (!delegated) {
      await router.delegate(ctx);
    }

    await next();
  };
}

module.exports = Bundle;
