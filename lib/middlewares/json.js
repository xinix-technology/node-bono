module.exports = () => {
  return async (ctx, next) => {
    await next();

    if (ctx.state.result) {
      ctx.body = ctx.state.result;
    }
  };
};
