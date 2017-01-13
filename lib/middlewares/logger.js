module.exports = () => {
  return async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;

    console.log(`${ctx.status} ${ctx.method} ${ctx.url} - ${ms}ms`);
  };
};
