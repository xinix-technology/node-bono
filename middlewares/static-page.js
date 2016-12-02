'use strict';

module.exports = function() {
  return function(context, next) {
    var renderer = context.attr('@renderer');
      if (!renderer) {
        return next();
      } else {
        var template = `__static__/${context.url.replace(/^\/+/, '').replace(/\/+$/, '') || 'index'}`;
        return renderer.resolve(template)
          .then((exists) => {
            if (exists) {
              context.status = 200;
              context.type = 'text/html';
              context.attr('@renderer.template', template);
            } else {
              return next();
            }
          });
      }
  };
};