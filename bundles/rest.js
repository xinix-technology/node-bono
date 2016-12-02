'use strict';

const Bundle = require('../bundle');

class Rest extends Bundle {
  constructor(options) {
    super(options);

    this.routeMap({ methods: ['GET'], uri: '/', template: (options.name || 'shared') + '/search', 'handler': 'search' });
    this.routeMap({ methods: ['POST'], uri: '/', template: (options.name || 'shared') + '/create', 'handler': 'create' });
    this.routeMap({ methods: ['GET'], uri: '/{id}', template: (options.name || 'shared') + '/read', 'handler': 'read' });
    this.routeMap({ methods: ['PUT'], uri: '/{id}', template: (options.name || 'shared') + '/update', 'handler': 'update' });
    this.routeMap({ methods: ['DELETE'], uri: '/{id}', template: (options.name || 'shared') + '/delete', 'handler': 'delete' });

    this.routeMap({ methods: ['GET', 'POST'], uri: '/null/create', 'handler': 'create' });
    this.routeMap({ methods: ['GET'], uri: '/{id}/read', 'handler': 'read' });
    this.routeMap({ methods: ['GET', 'PUT'], uri: '/{id}/update', 'handler': 'update' });
    this.routeMap({ methods: ['GET', 'DELETE'], uri: '/{id}/delete', 'handler': 'delete' });
  }

  _getHandler(name) {
    if (!this[name]) {
      throw new Error(`Method ${name} is undefined!`);
    }

    return function(context) {
      context.depends('@bodyParser');

      return this[name].apply(this, arguments);
    }.bind(this);
  }
}

module.exports = Rest;