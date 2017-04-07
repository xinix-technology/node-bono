module.exports = ({ debug = false } = {}) => {
  function marshallErr (err) {
    let error = { message: err.message };
    if (debug) {
      error.stack = err.stack;
    }
    return error;
  }

  return async (ctx, next) => {
    try {
      await next();

      if (ctx.status >= 400) {
        let { status, message } = ctx;
        ctx.body = ctx.body || { errors: [ { message } ] };
        ctx.status = status;
      } else if (ctx.state.result) {
        ctx.body = ctx.state.result;
      }
    } catch (err) {
      ctx.status = err.status || 500;
      if (ctx.status >= 500) {
        console.error(`Caught error with stack: ${err.stack}`);
      }
      ctx.lastError = err;

      let errors = [];
      if (err.children) {
        errors = err.children.map(childErr => marshallErr(childErr));
      } else {
        errors.push(marshallErr(err));
      }

      ctx.body = { errors };
    }
  };
};
