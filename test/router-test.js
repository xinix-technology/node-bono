var assert = require('assert');

var router = require('../lib/router');

describe('Router', function() {
  'use strict';

  var r = router();

  describe('#_routeRegExp', function() {
    it('should handle optional ([])', function() {
      var str, expected, re;

      str = '/foo/bar[/baz]';
      expected = /^\/foo\/bar(?:\/baz)?$/.toString();
      re = r._routeRegExp(str);
      assert.equal(re.toString(), expected);

      str = '/foo[/bar/baz]';
      expected = /^\/foo(?:\/bar\/baz)?$/.toString();
      re = r._routeRegExp(str);
      assert.equal(re.toString(), expected);
    });

    it('should handle params ({})', function() {
      var str, expected, re;

      str = '/foo/{bar}/{baz}';
      expected = /^\/foo\/([^\/]+)\/([^\/]+)$/.toString();
      re = r._routeRegExp(str);
      assert.equal(re.toString(), expected);
    });

    it('should handle both optionals ([]) and params ({})', function() {
      var str, expected, re;

      str = '/foo/{bar}[/{baz}]';
      expected = /^\/foo\/([^\/]+)(?:\/([^\/]+))?$/.toString();
      re = r._routeRegExp(str);
      assert.equal(re.toString(), expected);
    });
  });
});