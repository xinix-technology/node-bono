class Route {
  static routeRegExp (str) {
    let chunks = str.split('[');

    if (chunks.length > 2) {
      throw new Error('Invalid use of optional params');
    }

    let tokens = [];
    let re = chunks[0].replace(/{([^}]+)}/g, function (g, token) {
      tokens.push(token);
      return '([^/]+)';
    }).replace(/\//g, '\\/');

    let optRe = '';

    if (chunks[1]) {
      optRe = '(?:' + chunks[1].slice(0, -1).replace(/{([^}]+)}/g, function (g, token) {
        tokens.push(token);
        return '([^/]+)';
      }).replace(/\//g, '\\/') + ')?';
    }
    return [ new RegExp('^' + re + optRe + '$'), tokens ];
  }

  constructor (uri, callback) {
    this.uri = uri;
    this.callback = callback;
    this.isStatic = !uri.match(/[[{]/);
    if (!this.isStatic) {
      [ this.pattern, this.args ] = Route.routeRegExp(this.uri);
    }
  }

  match (ctx) {
    if (this.isStatic) {
      if (ctx.path === this.uri) {
        return true;
      }
    } else {
      const result = ctx.path.match(this.pattern);
      if (result) {
        ctx.parameters = this.args.reduce((args, name, index) => {
          args[name] = result[index + 1];
          return args;
        }, {});
        return true;
      }
    }

    return false;
  }

  async dispatch (ctx) {
    ctx.status = 200;

    const result = await this.callback(ctx);
    if (result === undefined) {
      return;
    }

    ctx.state.result = result;
  }
}

module.exports = Route;
