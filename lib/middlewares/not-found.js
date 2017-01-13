module.exports = (body) => {
  return async (ctx, next) => {
    await next();

    if (ctx.status === 404) {
      ctx.body = body;
      ctx.status = 404;
    }
  };
};
