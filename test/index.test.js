
const chai = require('chai')
// const mocha = require('mocha')
const should = chai.should()
const port = 3001;

const io = require('socket.io-client');

describe("Client socket transmissions should result in correct response from server, ", function () {

  let server,
      options ={
          transports: ['websocket'],
          'force new connection': true
      };

  beforeEach(function (done) {
      server = require('../index.ts').server;
      done();
  });

  it("message sent from a logged in client should be sent back to the same client", function (done) {
    const client = io.connect(`http://localhost:${port}`, options);

    const messageObj = {
      userName: 'Viktor',
      message: 'Hej',
      time: new Date().getTime(),
    }

    client.once("connect", function () {
      client.emit("login", "Viktor")
        client.once("message", function (response) {
            response.message.should.equal(messageObj.message);
            client.disconnect();
            done();
        });
        client.emit("message", messageObj);
    });
  });

  it("login attempt with empty username should result in 'empty' response", function (done) {
    const client = io.connect(`http://localhost:${port}`, options);

    client.once("connect", function () {
      client.once("login", function (message) {
          message.should.equal("empty");
          client.disconnect();
          done();
      });
      client.emit("login", "");
    });
  });

  it("login attempt with valid username should result in 'success' response", function (done) {
    const client = io.connect(`http://localhost:${port}`, options);

    client.once("connect", function () {
      client.once("login", function (message) {
          message.should.equal("success");
          client.disconnect();
          done();
      });
      client.emit("login", "Viktor");
    });
  });

  it("login attempt with taken username should result in 'taken' response", function (done) {
    const client = io.connect(`http://localhost:${port}`, options);
    const client2 = io.connect(`http://localhost:${port}`, options);

    client.once("connect", function () {
      client.emit("login", "Viktor");
      client2.once("connect", function () {
        client2.once("login", function (message) {
            message.should.equal("taken");
            client.disconnect();
            client2.disconnect();
            done();
        });
        client2.emit("login", "Viktor");
      });
    });
  });

  it("logout attempt from a client that is not logged in should get a 'failure' response", function (done) {
    const client = io.connect(`http://localhost:${port}`, options);

    client.once("connect", function () {
        client.once("logout", function (response) {
            response.should.equal("failure");
            client.disconnect();
            done();
        });
        client.emit("logout", "Hector");
    });
  });

  it("logout attempt from a logged in client should get a 'success' response", function (done) {
    const client = io.connect(`http://localhost:${port}`, options);

    client.once("connect", function () {
      client.emit("login", "Viktor")
        client.once("logout", function (response) {
            response.should.equal("success");
            client.disconnect();
            done();
        });
        client.emit("logout", "Viktor");
    });
  });

  // Test that if one client is logged out, other clients gets message about it
  // Test that if one client logs in, other clients gets message about it
  // Test that messages are only sent to logged in clients
  // Test that timed logouts work
  // Test that if one client is disconnected, it cannot log in anymore
  // Test that if one client is disconnected, other clients gets message about it

})

// describe('Array', function() {
//   describe('#indexOf()', function() {
//     it('should return -1 when the value is not present', function() {
//       assert.equal([1, 2, 3].indexOf(4), -1);
//     });
//   });
// });
