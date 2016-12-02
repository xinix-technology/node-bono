'use strict';

const _ = require('lodash');

module.exports = function() {
  return function (context, next) {
    var start = new Date();
    return next()
      .then(function() {
        var time = (new Date() - start) / 1000;

        context.set('X-Profiler-Response-Time', time + ' ms');
        context.set('X-Profiler-Memory-Usage', _.map(process.memoryUsage(), function(v, k) {
          return k + '=' + v;
        }).join(', '));
      });
  };
};