class Route {
  constructor (uri, callback) {
    this.uri = uri;
    this.callback = callback;
    this.isStatic = !uri.match(/[[{]/);
  }

  match (ctx) {
    if (this.isStatic) {
      if (ctx.url === this.uri) {
        return true;
      }
    } else {
      throw new Error('Unimplemented yet');
    }

    return false;
  }

  async dispatch (ctx) {
    const result = await this.callback(ctx);
    if (result === undefined) {
      return;
    }

    ctx.status = ctx.status === 404 ? 200 : ctx.status;
    ctx.state.result = result;
  }
}

module.exports = Route;
