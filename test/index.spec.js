/**
 * @file test/index.spec.js
 */
'use strict';

// Test dependencies
const chai           = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon          = require('sinon');
const sinonChai      = require('sinon-chai');
const should         = chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

// Module to be tested
const pubsub = require('../lib');

// Describe tests
describe('module', () => {
  it('should export a function', () => {
    pubsub.should.be.a('function');
  });

  it('should return a Promise', (done) => {
    let result = pubsub();
    result.should.be.a('Promise');
    result.should.be.rejected.notify(done);
  });
});

describe('pubsub client', () => {
  let client;

  beforeEach(() => {
    client = pubsub({
      user:     'postgres',
      password: '',
      database: 'travis_ci_test',
      host:     'localhost',
      port:     5432
    });

    return client;
  });

  afterEach(() => {
    return client.then((client) => {
      return client.end();
    });
  });

  it('should ignore notifications for channels it is not subscribed to', (done) => {
    client.then((client) => {
      client.emit('notification', {
        channel: 'notsubscribed',
        payload: 'never delivered'
      });
    }).should.be.fulfilled.notify(done);
  });

  describe('#listen', () => {
    it('should add event listener for specified channel', (done) => {
      client.then((client) => {
        client.listenerCount('channel').should.equal(0);

        return client.listen('channel', () => {});
      }).then((client) => {
        client.listenerCount('channel').should.equal(1);
      }).should.be.fulfilled.notify(done);
    });

    it('should return a Promise', (done) => {
      client.then((client) => {
        client.listen('channel', () => {}).should.be.a('Promise');
      }).should.be.fulfilled.notify(done);
    });
  });

  describe('#notify', () => {
    it('should notify the specified channel', (done) => {
      client.then((client) => {
        return client.listen('channel', done);
      }).then((client) => {
        client.notify('channel');
      }).should.be.fulfilled;
    });

    it('should notify the specified channel with a payload', (done) => {
      const payload = 'payload';

      client.then((client) => {
        return client.listen('channel', (result) => {
          result.should.equal(payload);
          done();
        });
      }).then((client) => {
        client.notify('channel', payload);
      }).should.be.fulfilled;
    });

    it('should return a Promise', (done) => {
      client.then((client) => {
        client.notify('channel').should.be.a('Promise');
      }).should.be.fulfilled.notify(done);
    });
  });

  describe('#unlisten', () => {
    it('should remove event listeners for specified channel', (done) => {
      client.then((client) => {
        client.listenerCount('channel').should.equal(0);

        return client.listen('channel', () => {});
      }).then((client) => {
        client.listenerCount('channel').should.equal(1);

        return client.unlisten('channel');
      }).then((client) => {
        client.listenerCount('channel').should.equal(0);
      }).should.be.fulfilled.notify(done);
    });

    it('should return a Promise', (done) => {
      client.then((client) => {
        client.unlisten('channel').should.be.a('Promise');
      }).should.be.fulfilled.notify(done);
    });
  });
});
