const chai = require('chai');
const should = chai.should();
const testport = 3001;
const { restartTimer, getIndex } = require('../utils/helpers.ts');

const testio = require('socket.io-client');

describe('Client emits should be picked up correctly by server', function () {
  let server,
    options = {
      transports: ['websocket'],
      'force new connection': true,
    };

  const messageObj = {
    userName: 'Viktor',
    message: 'Viktor joined the chat',
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

  it('client should be disconnected by default', (done) => {
    const client = testio.connect(`http://localhost:${testport}`, options);
    client.connected.should.equal(false);
    done();
  });

  it('client should connect', (done) => {
    const client = testio.connect(`http://localhost:${testport}`, options);
    client.once('connect', () => {
      client.connected.should.equal(true);
      client.disconnect();
      done();
    });
  });

  it('client should disconnect', (done) => {
    const client = testio.connect(`http://localhost:${testport}`, options);
    client.once('connect', () => {
      client.disconnect();
      client.connected.should.equal(false);
      done();
    });
  });

  it('message should be sent when logged in', (done) => {
    const client = testio.connect(`http://localhost:${testport}`, options);
    client.once('connect', () => {
      client.once('message', (response) => {
        response.message.should.equal(messageObj.message);
        client.disconnect();
        done();
      });
      client.emit('login', 'Viktor');
    });
  });

  it('server should send out message when client logs in', (done) => {
    const client = testio.connect(`http://localhost:${testport}`, options);
    client.once('connect', () => {
      client.once('message', (response) => {
        response.message.should.equal(messageObj.message);
        client.disconnect();
        done();
      });
      client.emit('login', 'Viktor');
    });
  });

  it('message should be sent out', (done) => {
    const client = testio.connect(`http://localhost:${testport}`, options);
    client.once('connect', () => {
      client.once('message', () => {
        client.once('message', (response) => {
          response.message.should.equal(messageObj2.message);
          client.disconnect();
          done();
        });
        client.emit(
          'message',
          messageObj2.userName,
          messageObj2.message,
          messageObj.time
        );
      });
      client.emit('login', 'Viktor');
    });
  });

  it('other clients should receive messages', (done) => {
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

describe('Helper functions', () => {
  const mockUsers = [
    { id: '10', userName: 'Viktor', timer: null },
    { id: '11', userName: 'Amanda', timer: null },
  ];

  it('getIndex should return correct index', function (done) {
    getIndex('11', mockUsers).should.equal(1);
    done();
  });

  it('restartTimer should restart timer', (done) => {
    restartTimer({ timer: {} }, done, 10);
  });
});
