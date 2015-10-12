var _ = require('lodash');
var path = require('path');

module.exports = Opts;

var globalEnv;

function Opts(attributes, env) {
  'use strict';

  if (!(this instanceof Opts)) {
    return new Opts(attributes, env);
  }

  if (!env) {
    env = globalEnv;
  }

  globalEnv = this.env = env;

  this.attributes = _.merge({}, attributes || {});
}

Opts.prototype.mergeFile = function(file) {
  'use strict';

  file = path.resolve(file);

  var parsed = path.parse(file);
  var envFile = path.join(parsed.dir, parsed.name + '-' + this.env + parsed.ext);

  try {
    this.merge(require(file));
  } catch(e) {}

  try {
    this.merge(require(envFile));
  } catch(e) {}

  return this;
};

Opts.prototype.merge = function(attributes) {
  'use strict';

  this.mergeAttributes(this.attributes, attributes);

  return this;
};

Opts.prototype.mergeAttributes = function(to, from) {
  'use strict';

  _.forOwn(from, function(value, i) {
    var f = i.split('!');
    var key = f[0];
    var action = f[1] || 'merge';

    if (action === 'unset') {
      delete to[key];
    } else if (action === 'set') {
      to[key] = from[i];
    } else if (typeof from[key] === 'object' && !Array.isArray(from[key])) {
      if (!to[key] || (typeof to[key] !== 'object' && !Array.isArray(from[key]))) {
        to[key] = {};
      }
      this.mergeAttributes(to[key], from[key]);
    } else {
      to[key] = from[key];
    }
  }.bind(this));
};

Opts.prototype.toArray = function() {
  'use strict';

  return this.attributes;
};