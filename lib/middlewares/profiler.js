// jshint esnext: true

var _ = require('lodash');

module.exports = function(next) {
  return function *(next) {
    var start = new Date();
    yield next;
    var time = (new Date() - start) / 1000;

    this.set('X-Profiler-Response-Time', time + ' ms');
    this.set('X-Profiler-Memory-Usage', _.map(process.memoryUsage(), function(v, k) {
      return k + '=' + v;
    }).join(' '));
  };
};