# Bono (node-bono)

At [Xinix Technology](http://sagara.id), we have our own PHP framework called [Bono](https://github.com/xinix-technology/bono) that we use everyday. This Node.js library adopting the same principal as the PHP flavor.

## How to Use

Initialize your new web application project and install bono as dependency using npm.

```bash
mkdir my-project
cd my-project
npm init
npm install bono --save
```

Write code below as `app.js`

```js
'use strict';

const http = require('http');
const bono = require('bono');

var app = bono();
var server = http.Server(app.callback());
server.listen(3000, () => console.log('Listening on port 3000'));
```

Then run with node, or you might want to use [nodemon](https://www.npmjs.com/package/nodemon) on development.

```bash
node app.js
```

Now your application is alive on port 3000, you can access http://localhost:3000 from your local machine. 

But your application does not have any route defined yet. You have to define routes, bundles, and/or middlewares.

## Configuration

You might want to configure your application, to define routes, bundles, and/or middlewares. Bono will automatically read file `config/config.js` as its configuration.

The configuration states that your application will have one route to handle uri `/`, and it will show for you message `Hello world!`.


## Routes, Bundles, and Middlewares

There are some concepts to learn about Bono. We might back again later to explain them for you.

Have a nice coding!