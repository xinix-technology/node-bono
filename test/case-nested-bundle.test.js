const Bundle = require('../');
const test = require('supertest');
const assert = require('assert');

describe('Nested bundle', () => {
  it('route to nested bundle on static route', async () => {
    let child = new Bundle();
    let methodCalled;
    let pathCalled;
    child.use(async (ctx, next) => {
      methodCalled = ctx.method;
      pathCalled = ctx.path;
      await next();
    });
    child.get('/', () => 'root');
    child.get('/foo', () => 'foo');

    let parent = new Bundle();
    parent.use(require('../middlewares/json')());
    parent.bundle('/child', child);

    {
      let { text } = await test(parent.callback()).get('/child');
      assert.equal(methodCalled, 'GET');
      assert.equal(pathCalled, '/');
      assert.equal(text, 'root');
    }

    {
      let { text } = await test(parent.callback()).get('/child/foo');
      assert.equal(methodCalled, 'GET');
      assert.equal(pathCalled, '/foo');
      assert.equal(text, 'foo');
    }
  });

  it('route to nested bundle on root', async () => {
    let child = new Bundle();
    let methodCalled;
    let pathCalled;
    child.use(async (ctx, next) => {
      methodCalled = ctx.method;
      pathCalled = ctx.path;
      await next();
    });
    child.get('/', () => 'root');
    child.get('/foo', () => 'foo');

    let parent = new Bundle();
    parent.use(require('../middlewares/json')());
    parent.bundle('/', child);

    {
      let { text } = await test(parent.callback()).get('/');
      assert.equal(methodCalled, 'GET');
      assert.equal(pathCalled, '/');
      assert.equal(text, 'root');
    }

    {
      let { text } = await test(parent.callback()).get('/foo');
      assert.equal(methodCalled, 'GET');
      assert.equal(pathCalled, '/foo');
      assert.equal(text, 'foo');
    }
  });

  it('route to nested bundle on dynamic route', async () => {
    let child = new Bundle();
    let methodCalled;
    let pathCalled;
    let parametersCalled;
    child.use(async (ctx, next) => {
      methodCalled = ctx.method;
      pathCalled = ctx.path;
      parametersCalled = ctx.parameters;
      await next();
    });
    child.get('/', () => 'root');
    child.get('/foo', () => 'foo');

    let parent = new Bundle();
    parent.use(require('../middlewares/json')());
    parent.bundle('/{arg}', child);

    {
      let { text } = await test(parent.callback()).get('/arg1');
      assert.equal(methodCalled, 'GET');
      assert.equal(pathCalled, '/');
      assert.equal(text, 'root');
      assert.equal(parametersCalled.arg, 'arg1');
    }

    {
      let { text } = await test(parent.callback()).get('/arg2/foo');
      assert.equal(methodCalled, 'GET');
      assert.equal(pathCalled, '/foo');
      assert.equal(text, 'foo');
      assert.equal(parametersCalled.arg, 'arg2');
    }
  });
});
