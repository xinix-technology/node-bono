class Route {
  static parse (str) {
    let chunks = str.split('[');

    if (chunks.length > 2) {
      throw new Error('Invalid use of optional params');
    }

    let [ chunk, restChunk ] = chunks;
    let tokens = [];

    let re = chunk.replace(/{([^}]+)}/g, function (g, token, i) {
      while (i >= 0) {
        let current = chunk[i];
        if (current === '}') {
          break;
        }

        if (current === ':' && i >= 2 && chunk.substr(i - 2, 3) === '(?:') {
          i = i - 3;
          continue;
        }

        if (current === '(') {
          tokens.push('');
        }
        i--;
      }
      tokens.push(token);
      return '([^/]+)';
    }).replace(/\//g, '\\/');

    let optRe = '';
    if (restChunk) {
      optRe = '(?:' + restChunk.slice(0, -1).replace(/{([^}]+)}/g, function (g, token) {
        tokens.push(token);
        return '([^/]+)';
      }).replace(/\//g, '\\/') + ')?';
    }
    return [ new RegExp('^' + re + optRe + '$'), tokens ];
  }

  static isStatic (uri) {
    return !uri.match(/[[{]/);
  }

  constructor (uri, callback) {
    this.uri = uri;
    this.callback = callback;
    this.isStatic = Route.isStatic(uri);
    if (!this.isStatic) {
      [ this.pattern, this.args ] = Route.parse(this.uri);
    }
  }

  static fetchParams (result = [], args = []) {
    return result.reduce((params, token, index) => {
      params[index] = token;
      return params;
    }, args.reduce((params, name, index) => {
      if (name) {
        params[name] = result[index + 1];
      }
      return params;
    }, {}));
  }

  match (ctx) {
    if (this.isStatic) {
      if (ctx.path === this.uri) {
        return true;
      }
    } else {
      const result = ctx.path.match(this.pattern);
      if (result) {
        ctx.parameters = Object.assign(ctx.parameters, Route.fetchParams(result, this.args));
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
