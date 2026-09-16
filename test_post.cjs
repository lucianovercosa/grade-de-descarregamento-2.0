const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/vehicles',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'token=testtoken' // might fail if token is invalid, but wait we need a real token to test
  }
};
