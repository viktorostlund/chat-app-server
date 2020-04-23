const chai = require('chai');
// const mocha = require('mocha')
const should = chai.should();
const testport = 3001;
const helpers = require('../helpers.ts');

const testio = require('socket.io-client');

describe('Client emits should be picked up correctly by server', function () {
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

  it('client should be disconnected by default', function (done) {
    const client = testio.connect(`http://localhost:${testport}`, options);
    client.connected.should.equal(false);
    done();
  });

  it('client should connect', function (done) {
    const client = testio.connect(`http://localhost:${testport}`, options);
    client.once('connect', function () {
      client.connected.should.equal(true);
      client.disconnect();
      done();
    });
  });

  it('client should disconnect', function (done) {
    const client = testio.connect(`http://localhost:${testport}`, options);
    client.once('connect', function () {
      client.disconnect();
      client.connected.should.equal(false);
      done();
    });
  });

  it('message should be sent when logged in', function (done) {
    const client = testio.connect(`http://localhost:${testport}`, options);
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
    const client = testio.connect(`http://localhost:${testport}`, options);
    client.once('connect', function () {
      client.once('message', function (response) {
        response.message.should.equal(messageObj.message);
        client.disconnect();
        done();
      });
      client.emit('login', 'Viktor');
    });
  });

  it('message should be sent out', function (done) {
    const client = testio.connect(`http://localhost:${testport}`, options);
    client.once('connect', function () {
      client.once('message', function (response) {
        client.once('message', function (response) {
          response.message.should.equal(messageObj2.message);
          client.disconnect();
          done();
        });
        client.emit('message', messageObj2);
      });
      client.emit('login', 'Viktor');
    });
  });
});

describe('Helper functions', function () {
  const mockUsers = [{ id: '10', userName: 'Viktor', timer: null }, { id: '11', userName: 'Amanda', timer: null }];
  it('', function (done) {
    helpers.getUserIndex('11', mockUsers).should.equal(1);
  });
});

// describe('Array', function() {
//   describe('#indexOf()', function() {
//     it('should return -1 when the value is not present', function() {
//       assert.equal([1, 2, 3].indexOf(4), -1);
//     });
//   });
// });
