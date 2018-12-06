const Bundle = require('../bundle');
const test = require('supertest');
const assert = require('assert');

describe('complex query', () => {
  it('process object, array, and plain', async () => {
    let bundle = new Bundle();

    bundle.get('/', ctx => {
      assert.strictEqual(ctx.query.obj.one, '1');
      assert.strictEqual(ctx.query.obj.two, '2');
      assert.strictEqual(ctx.query.plain, 'text');
      assert.deepStrictEqual(ctx.query.arr, ['1', '2']);
    });

    await test(bundle.callback())
      .get('/?obj[one]=1&obj[two]=2&plain=text&arr[]=1&arr[]=2')
      .expect(200);
  });
});
