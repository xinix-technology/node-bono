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
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/');
      assert.strictEqual(text, 'root');
    }

    {
      let { text } = await test(parent.callback()).get('/child/foo');
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/foo');
      assert.strictEqual(text, 'foo');
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
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/');
      assert.strictEqual(text, 'root');
    }

    {
      let { text } = await test(parent.callback()).get('/foo');
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/foo');
      assert.strictEqual(text, 'foo');
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
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/');
      assert.strictEqual(text, 'root');
      assert.strictEqual(parametersCalled.arg, 'arg1');
    }

    {
      let { text } = await test(parent.callback()).get('/arg2/foo');
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/foo');
      assert.strictEqual(text, 'foo');
      assert.strictEqual(parametersCalled.arg, 'arg2');
    }
  });
});
