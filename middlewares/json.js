module.exports = () => {
  return async (ctx, next) => {
    try {
      await next();
      if (ctx.state.result) {
        ctx.body = ctx.state.result;
      }
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = {
        errors: [
          { message: err.message, stack: err.stack },
        ],
      };
    }
  };
};
