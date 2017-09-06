module.exports = () => {
  return async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;

    console.info(`${ctx.status} ${ctx.method} ${ctx.url} - ${ms}ms`);
  };
};
