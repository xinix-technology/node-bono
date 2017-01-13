const Route = require('./route');

class Router {
  constructor () {
    this.routes = {
      GET: [],
      POST: [],
      PUT: [],
      DELETE: [],
    };
  }

  route (methods, uri, callback) {
    if (!Array.isArray(methods)) {
      methods = [ methods ];
    }

    methods.forEach(method => (this.routes[method].push(new Route(uri, callback))));
  }

  match (ctx) {
    const routes = this.routes[ctx.method];

    if (!routes) {
      return;
    }

    return routes.find(route => route.match(ctx));
  }

  async delegate (ctx) {
    const route = this.match(ctx);
    if (!route) {
      return;
    }

    return await route.dispatch(ctx);
  }
}

module.exports = Router;
