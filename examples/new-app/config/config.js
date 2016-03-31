'use strict';

module.exports = {
  routes: [
    {
      uri: '/',
      handler: function() {
        console.log('handler');
      }
    }
  ]
};