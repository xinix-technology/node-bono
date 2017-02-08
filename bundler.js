class Bundler {
  constructor () {
    this.data = [];
  }

  set (uri, bundle) {
    this.data.push({ uri, bundle });
  }

  match (ctx) {
    return this.data.find(b => ctx.path.indexOf(b.uri) !== -1);
  }

  async delegate (ctx) {
    const matches = this.match(ctx);
    if (!matches) {
      return false;
    }

    await matches.bundle.dispatch(matches.uri, ctx);

    return true;
  }
}

module.exports = Bundler;
