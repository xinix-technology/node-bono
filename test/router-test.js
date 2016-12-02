const assert = require('assert');
const router = require('../router');

describe('Router', function() {
  'use strict';

  var r;

  beforeEach(function() {
    r = router();
  });

  describe('#_isStatic', function() {
    it('return true if no regexp', function() {
      assert(r._isStatic('/test'));
      assert(r._isStatic('/foo/bar'));
    });

    it('return false if regexp', function() {
      assert.equal(r._isStatic('/[test]'), false);
      assert.equal(r._isStatic('/foo/{bar}'), false);
      assert.equal(r._isStatic('/foo[/{bar}]'), false);
    });
  });

  describe('#route', function() {
    beforeEach(function() {
      r = router();
    });

    it('return own instance and can be chained', function() {
      var result = r.route({
        methods: ['GET'],
        pattern: '/test',
      });
      assert.equal(result, r);
      assert.equal(r.routes.GET[0].type, 's');
    });

    it('able to create static, variable, and regex routes', function() {
      r.route({
          methods: ['GET'],
          pattern: '/test',
        })
        .route({
          methods: ['POST'],
          pattern: '/foo/{bar}'
        })
        .route({
          methods: ['PUT'],
          pattern: /^\/some\/regex\/(\d+)/
        });
      assert.equal(r.routes.GET[0].type, 's');
      assert.equal(r.routes.POST[0].type, 'v');
      assert.equal(r.routes.PUT[0].type, 'v');
    });
  });

  describe('#_routeRegExp', function() {
    it('should handle optional ([])', function() {
      var str, expected, re;

      str = '/foo/bar[/baz]';
      expected = /^\/foo\/bar(?:\/baz)?$/.toString();
      re = r._routeRegExp(str);

      assert.equal(re[0].toString(), expected);
      assert.equal(re[1].length, 0);

      str = '/foo[/bar/baz]';
      expected = /^\/foo(?:\/bar\/baz)?$/.toString();
      re = r._routeRegExp(str);
      assert.equal(re[0].toString(), expected);
      assert.equal(re[1].length, 0);
    });

    it('should handle params ({})', function() {
      var str, expected, re;

      str = '/foo/{bar}/{baz}';
      expected = /^\/foo\/([^\/]+)\/([^\/]+)$/.toString();
      re = r._routeRegExp(str);
      assert.equal(re[0].toString(), expected);
      assert.deepEqual(re[1], ['bar', 'baz']);
    });

    it('should handle both optionals ([]) and params ({})', function() {
      var str, expected, re;

      str = '/foo/{bar}[/{baz}]';
      expected = /^\/foo\/([^\/]+)(?:\/([^\/]+))?$/.toString();
      re = r._routeRegExp(str);
      assert.equal(re[0].toString(), expected);
      assert.deepEqual(re[1], ['bar', 'baz']);
    });
  });
});