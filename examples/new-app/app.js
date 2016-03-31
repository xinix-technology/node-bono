'use strict';

const http = require('http');
const bono = require('../../lib/app');

var app = bono();
var server = http.Server(app.callback());
server.listen(3000, () => console.log('Listening on port 3000'));