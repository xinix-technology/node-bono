'use strict';

module.exports = function() {
  return (context, next) => {
    console.log(context.method, context.url);
    return next();
  };
};