const Bundle = require('../');
const test = require('supertest');
const assert = require('assert');

describe('Encoded route params', () => {
  it('encode route parameters', async () => {
    const bundle = new Bundle();

    let argCalled;
    bundle.get('/{arg}', ctx => {
      ctx.body = argCalled = ctx.parameters.arg;
    });

    {
      const { text } = await test(bundle.callback()).get('/foo').expect(200);
      assert.strictEqual(argCalled, 'foo');
      assert.strictEqual(text, 'foo');
    }

    {
      const { text } = await test(bundle.callback()).get('/foo bar').expect(200);
      assert.strictEqual(argCalled, 'foo bar');
      assert.strictEqual(text, 'foo bar');
    }
  });
});
