const Bundle = require('../');
const test = require('supertest');
const assert = require('assert');

describe('Nested bundle', () => {
  it('route to nested bundle on static route', async () => {
    const child = new Bundle();
    let methodCalled;
    let pathCalled;
    child.use(async (ctx, next) => {
      methodCalled = ctx.method;
      pathCalled = ctx.path;
      await next();
    });
    child.get('/', () => 'root');
    child.get('/foo', () => 'foo');

    const parent = new Bundle();
    parent.use(require('../middlewares/json')());
    parent.bundle('/child', child);

    {
      const { text } = await test(parent.callback()).get('/child');
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/');
      assert.strictEqual(text, 'root');
    }

    {
      const { text } = await test(parent.callback()).get('/child/foo');
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/foo');
      assert.strictEqual(text, 'foo');
    }
  });

  it('route to nested bundle on root', async () => {
    const child = new Bundle();
    let methodCalled;
    let pathCalled;
    child.use(async (ctx, next) => {
      methodCalled = ctx.method;
      pathCalled = ctx.path;
      await next();
    });
    child.get('/', () => 'root');
    child.get('/foo', () => 'foo');

    const parent = new Bundle();
    parent.use(require('../middlewares/json')());
    parent.bundle('/', child);

    {
      const { text } = await test(parent.callback()).get('/');
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/');
      assert.strictEqual(text, 'root');
    }

    {
      const { text } = await test(parent.callback()).get('/foo');
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/foo');
      assert.strictEqual(text, 'foo');
    }
  });

  it('route to nested bundle on dynamic route', async () => {
    const child = new Bundle();
    let methodCalled;
    let pathCalled;
    let parametersCalled;
    let bundleState;

    child.use(async (ctx, next) => {
      methodCalled = ctx.method;
      pathCalled = ctx.path;
      parametersCalled = ctx.parameters;
      await next();
    });

    child.get('/', ctx => {
      bundleState = ctx.state.bundle;
      return 'root';
    });

    child.get('/foo', ctx => {
      bundleState = ctx.state.bundle;
      return 'foo';
    });

    const parent = new Bundle();
    parent.use(require('../middlewares/json')());
    parent.bundle('/{arg}', child);
    parent.get('/', ctx => {
      bundleState = ctx.state.bundle;
      return 'parent-root';
    });

    {
      const { text } = await test(parent.callback()).get('/');
      assert.strictEqual(text, 'parent-root');
      assert.strictEqual(bundleState, parent);
    }

    {
      const { text } = await test(parent.callback()).get('/arg1');
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/');
      assert.strictEqual(text, 'root');
      assert.strictEqual(parametersCalled.arg, 'arg1');
      assert.strictEqual(bundleState, child);
    }

    {
      const { text } = await test(parent.callback()).get('/arg2/foo');
      assert.strictEqual(methodCalled, 'GET');
      assert.strictEqual(pathCalled, '/foo');
      assert.strictEqual(text, 'foo');
      assert.strictEqual(parametersCalled.arg, 'arg2');
      assert.strictEqual(bundleState, child);
    }
  });
});
