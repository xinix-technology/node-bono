# Bono (node-bono)

[![npm version](https://badge.fury.io/js/bono.svg)](https://badge.fury.io/js/bono)
[![GitHub license](https://img.shields.io/github/license/xinix-technology/node-bono.svg)](https://github.com/xinix-technology/node-bono/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/xinix-technology/node-bono.svg?branch=master)](https://travis-ci.org/xinix-technology/node-bono)

```sh
npm i bono --save
```

Bono is light and modular Node.js web application framework (based on Koa.js) to develop api and website.

## Getting Started

Assuming you already installed Node.js, create directory to hold your application. Move to that directory and start initialize npm project on that directory. Then, install bono as dependency.

```sh
mkdir my-project
cd my-project
npm init
npm i bono --save
```

Write code below as `app.js`

```javascript
const http = require('http');
const Bundle = require('bono');

let app = new Bundle();

app.get('/', ctx => 'Hello world!');

let server = http.Server(app.callback());
server.listen(3000, () => console.log('Listening on port 3000'));
```

Then run with node, or you might want to use [nodemon](https://www.npmjs.com/package/nodemon) on development.

```sh
node app.js
```

Now your application is alive on port 3000, you can access http://localhost:3000 from your local machine.

Right now your application only define single route. You will learn how to use bundles, middlewares, and routes below.

## Bundle

Bono Bundle is a single module context which have middlewares, routes, and sub bundles. The application itself is a bundle.

Bundle is mechanism to separate concern of modules. You can create an application bundle that delegates dissect each of every request context to separate sub bundles.

You can hook any bundle as sub bundles of bigger application, it means programmers can distribute common bundles to be used by another kind of applications, and reuse bundles that you had written for previous project as sub bundles of current project.

Bundles basically are Koa.js applications, so every method and property that Koa.js applications have, you can use them in bundles.

```javascript
const http = require('http');
const Bundle = require('bono');

const auth = new Bundle();
auth.post('/login', async ctx => {
  let { username, password } = await ctx.parse();

  ctx.assert(username === 'foo' && password === 'bar', 401, 'Login failed!');
});

const app = new Bundle();
app.get('/', ctx => ctx.redirect('/auth/login'));
app.bundle('/auth', auth);

let server = http.Server(app.callback());
server.listen(3000, () => console.log('Listening on port 3000'));
```

### Extend Bundle

You can prepare generic bundle to reuse in your projects. This bundle can be packaged into separate package also.

Write codes below in `auth.js` file.

```javascript
const Bundle = require('bono');

class AuthBundle extends Bundle {
  constructor () {
    super();

    this.post('/login', async ctx => {
      let { username, password } = await ctx.parse();

      ctx.assert(username === 'foo' && password === 'bar', 401, 'Login failed!');

      // append server side data

      return 'login success';
    });

    this.get('/logout', ctx => {
      // remove server side data

      return 'logout success';
    });
  }
}
```

Then use the bundle in application.

```javascript
const http = require('http');
const Bundle = require('bono');
const AuthBundle = require('./auth');

const app = new Bundle();

app.bundle(new AuthBundle());

let server = http.Server(app.callback());
server.listen(3000, () => console.log('Listening on port 3000'));
```

## Middlewares

Bono middlewares basically is pure Koa.js middlewares.

Middleware cascade in a more traditional way as you may be used to with similar tools - this was previously difficult to make user friendly with node's use of callbacks. However with generators we can achieve "true" middleware. Contrasting Connect's implementation which simply passes control through series of functions until one returns, Koa yields "downstream", then control flows back "upstream".

Middleware definition takes the following structure:

```js
bundle.use(MIDDLEWARE)
```

Where:

bundle is an instance of Bono bundle and MIDDLEWARE is a function with arguments as Koa.js request context and next middleware function. MIDDLEWARE can be async function.

```javascript
const http = require('http');
const Bundle = require('bono');

const app = new Bundle();

app.use(async (ctx, next) => {
  console.log('before route');

  await next();

  console.log('after route');
});

app.get('/', ctx => {
  console.log('route running');
  return 'Hello world!';
});

let server = http.Server(app.callback());
server.listen(3000, () => console.log('Listening on port 3000'));
```

Run server and go to URL http://localhost:3000/ and you will see `Hello world!`. In server logs, you can see,

```sh
$ node app.js
Listening on port 3000
before route
route running
after route
```

### Built-in Middlewares

Bono provides programmmers built-in middlewares as follows:

#### JSON Middleware

```javascript
bundle.use(require('bono/middlewares/json')());
```

#### Logger Middleware

```javascript
bundle.use(require('bono/middlewares/logger')());
```

#### Not Found Middleware

```javascript
bundle.use(require('bono/middlewares/not-found')('404 Not Found'));
```

## Routes

Routing refers to determining how an application responds to a client request to a particular endpoint, which is a URI (or path) and a specific HTTP request method (GET, POST, and so on).

Each route can have one or more handler functions, which are executed when the route is matched.

Route definition takes the following structure:

```js
bundle.METHOD(PATH, HANDLER)
```

Where:

Bundle is an instance of Bono bundle.

- METHOD is an HTTP request method, in lowercase.
- PATH is a path on the server.
- HANDLER is the function executed when the route is matched.

HANDLER accepts Koa.js request context as argument. HANDLER can be async function.

## Context

Bono context is Koa.js context with addition in API as follows:

- ctx.parse() - async method to parse request body
- ctx.parameters - object contains parameters from url
