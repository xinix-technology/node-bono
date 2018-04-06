const Bundle = require('..');
const test = require('supertest');
const assert = require('assert');

describe('Route bundle', () => {
  it('route to destined static bundle', async () => {
    let app = new Bundle();

    let foo = new Bundle();
    foo.get('/', ctx => { ctx.body = 'foo root'; });
    foo.get('/other', ctx => { ctx.body = 'foo other'; });

    let bar = new Bundle();
    bar.get('/', ctx => { ctx.body = 'bar root'; });

    app.bundle('/foo', foo);
    app.bundle('/bar', bar);

    let resp;

    resp = await test(app.callback()).get('/foo').expect(200);
    assert.equal(resp.text, 'foo root');

    resp = await test(app.callback()).get('/bar').expect(200);
    assert.equal(resp.text, 'bar root');

    resp = await test(app.callback()).get('/foo/other').expect(200);
    assert.equal(resp.text, 'foo other');

    await test(app.callback()).get('/fooz').expect(404);
  });

  it('route to destined pattern bundle', async () => {
    let app = new Bundle();

    let foo = new Bundle();
    foo.get('/', ctx => { ctx.body = 'foo root'; });
    foo.get('/other', ctx => { ctx.body = 'foo other'; });

    let bar = new Bundle();
    bar.get('/', ctx => { ctx.body = 'bar root'; });

    app.bundle('/{id}/foo', foo);
    app.bundle('/{id}/bar', bar);

    let resp;

    resp = await test(app.callback()).get('/1/foo').expect(200);
    assert.equal(resp.text, 'foo root');

    resp = await test(app.callback()).get('/2/bar').expect(200);
    assert.equal(resp.text, 'bar root');

    resp = await test(app.callback()).get('/3/foo/other').expect(200);
    assert.equal(resp.text, 'foo other');

    await test(app.callback()).get('/4/fooz').expect(404);
  });
});
