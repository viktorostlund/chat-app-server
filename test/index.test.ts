const chai = require('chai');
// const mocha = require('mocha')
const should = chai.should();
const testport = 3001;

const mockio = require('socket.mockio-client');

describe('Client socket transmissions should result in correct response from server, ', function () {
  let server,
    options = {
      transports: ['websocket'],
      'force new connection': true,
    };

  const messageObj = {
    userName: 'Viktor',
    message: 'Viktor entered the chat',
    time: new Date().getTime(),
  };

  const messageObj2 = {
    userName: 'Viktor',
    message: 'Hej',
    time: new Date().getTime(),
  };

  beforeEach(function (done) {
    server = require('../index.ts').server;
    done();
  });

  it('client should not be connected by default', function (done) {
    const client = mockio.connect(`http://localhost:${port}`, options);
    client.connected.should.equal(false);
    done();
  });

  it('client should connect', function (done) {
    const client = mockio.connect(`http://localhost:${port}`, options);
    client.once('connect', function () {
      client.connected.should.equal(true);
      client.disconnect();
      done();
    });
  });

  it('client should disconnect', function (done) {
    const client = mockio.connect(`http://localhost:${port}`, options);
    client.once('connect', function () {
      client.disconnect();
      client.connected.should.equal(false);
      done();
    });
  });

  it('server should send out message when client logs in', function (done) {
    const client = mockio.connect(`http://localhost:${port}`, options);
    client.once('connect', function () {
      client.once('message', function (response) {
        response.message.should.equal(messageObj.message);
        client.disconnect();
        done();
      });
      client.emit('login', 'Viktor');
    });
  });

  it('server should send out message when client logs in', function (done) {
    const client = mockio.connect(`http://localhost:${port}`, options);
    client.once('connect', function () {
      client.once('message', function (response) {
        response.message.should.equal(messageObj.message);
        client.disconnect();
        done();
      });
      client.emit('login', 'Viktor');
    });
  });
});

// describe('Array', function() {
//   describe('#indexOf()', function() {
//     it('should return -1 when the value is not present', function() {
//       assert.equal([1, 2, 3].indexOf(4), -1);
//     });
//   });
// });
