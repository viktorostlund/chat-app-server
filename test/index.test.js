

const chai = require('chai')
const mocha = require('mocha')
const should = chai.should()

var io = require('socket.io-client');

describe("echo", function () {

let server,
    options ={
        transports: ['websocket'],
        'force new connection': true
    };

beforeEach(function (done) {
    // start the server
    server = require('../index.ts').server;

    done();
});

it("echos message", function (done) {
  var client = io.connect("http://localhost:3001", options);

  client.once("connect", function () {
    console.log('connected')
      client.once("echo", function (message) {
        console.log('echo received')
          message.should.equal("Hello World");
          client.disconnect();
          done();
      });
      client.emit("echo", "Hello World");
  });
});

})

// const assert = require('assert');

// var expect = require('chai').expect
//   , server = require('../index.ts')
//   , io = require('socket.io-client')
//   , ioOptions = { 
//       transports: ['websocket']
//     , forceNew: true
//     , reconnection: false
//   }
//   , testMsg = 'HelloWorld'
//   , sender
//   , receiver

// describe('Chat Events', function(){
//   beforeEach(function(done){
    
//     // start the io server
//     server.start()
//     // connect two io clients
//     sender = io('http://localhost:3000/', ioOptions)
//     receiver = io('http://localhost:3000/', ioOptions)
    
//     // finish beforeEach setup
//     done()
//   })
//   afterEach(function(done){
    
//     // disconnect io clients after each test
//     sender.disconnect()
//     receiver.disconnect()
//     done()
//   })

//   describe('Message Events', function(){
//     it('Clients should receive a message when the `message` event is emited.', function(done){
//       sender.emit('message', testMsg)
//       receiver.on('message', function(msg){
//         expect(msg).to.equal(testMsg)
//         done()
//       })
//     })
//   })
// })

// describe('Array', function() {
//   describe('#indexOf()', function() {
//     it('should return -1 when the value is not present', function() {
//       assert.equal([1, 2, 3].indexOf(4), -1);
//     });
//   });
// });
