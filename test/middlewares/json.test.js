const Bundle = require('../..');
const test = require('supertest');
const assert = require('assert');

describe('Middleware: json', () => {
  it('handle http error', async () => {
    const app = new Bundle();
    app.use(require('../../middlewares/json')());

    const resp = await test(app.callback()).get('/').expect(404);
    assert.strictEqual(resp.body.errors.length, 1);
    assert.strictEqual(resp.body.errors[0].message, 'Not Found');
    assert.strictEqual(resp.body.errors[0].status, 404);
  });

  it('handle thrown error', async () => {
    const app = new Bundle();
    app.use(require('../../middlewares/json')());
    app.get('/', ctx => {
      throw new Error('Foo');
    });

    const resp = await test(app.callback()).get('/').expect(500);
    assert.strictEqual(resp.body.errors.length, 1);
    assert.strictEqual(resp.body.errors[0].message, 'Foo');
    assert.strictEqual(resp.body.errors[0].status, 500);
  });

  it('handle thrown error with children', async () => {
    const app = new Bundle();
    app.use(require('../../middlewares/json')());
    app.get('/', ctx => {
      const err = new Error('Foo');
      err.children = [
        new Error('Bar'),
        new Error('Baz'),
      ];
      throw err;
    });

    const resp = await test(app.callback()).get('/').expect(500);
    assert.strictEqual(resp.body.errors.length, 2);
    assert.strictEqual(resp.body.errors[0].message, 'Bar');
    assert.strictEqual(resp.body.errors[1].message, 'Baz');
  });
});
