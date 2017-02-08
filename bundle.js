const Koa = require('koa');
const Router = require('./router');
const Bundler = require('./bundler');
const compose = require('koa-compose');

class Bundle extends Koa {
  constructor () {
    super();

    this.router = new Router();
    this.bundler = new Bundler();
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
