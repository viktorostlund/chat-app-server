const chai = require('chai');
// const mocha = require('mocha')
const should = chai.should();
const testport = 3001;
const testRestartTimer = require('../utils.ts').restartDisconnectTimer;
const testGetIndex = require('../utils.ts').getUserIndex;

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

  it('other clients should receive messages', function (done) {
    const client = testio.connect(`http://localhost:${testport}`, options);
    const client2 = testio.connect(`http://localhost:${testport}`, options);
    client.once('connect', () => {
      client.once('message', () => {
        client.once('message', (response) => {
          response.message.should.equal(messageObj.message);
          client.disconnect();
          client2.disconnect();
          done();
        });
        client2.once('connect', () => {});
        client2.emit('login', 'Viktor');
      });
      client.emit('login', 'Amanda');
    });
  });

});

describe('Helper functions', function () {

  const mockUsers = [{ id: '10', userName: 'Viktor', timer: null }, { id: '11', userName: 'Amanda', timer: null }];
  it('getUserIndex should return correct index', function (done) {
    testGetIndex('11', mockUsers).should.equal(1);
    done();
  });

  it('restartDisconnectTimer should restart timer', function (done) {
    testRestartTimer({ timer: {} }, done, 10);
  });

});
