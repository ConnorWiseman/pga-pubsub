/**
 * @file lib/index.js
 */
'use strict';

// External dependencies
const { Client } = require('pg');
const format     = require('pg-format');

/**
 * Creates and decorates an individual PostgreSQL client with the functionality
 * needed to LISTEN, NOTIFY, and UNLISTEN on specified channels. Implemented
 * solely using the Promise pattern.
 * @param  {Object} options
 * @return {Promise.<Client>}
 */
module.exports = (options) => {

  /**
   * The PostgreSQL client to be decorated.
   * @type {Client}
   */
  const client  = new Client(options);

  /**
   * Listens on the specified channel, applying the specified callback to any
   * notifications received from the PostgreSQL server.
   * @param  {String}   channel
   * @param  {Function} callback
   * @return {Promise.<Client>}
   */
  client.listen = (channel, callback) => {
    const sql = `LISTEN ${channel};`;

    return client.query(sql).then(() => {
      client.addListener(channel, callback);
      return client;
    });
  };

  /**
   * Notifies the specified channel with an optional payload.
   * @param  {String} channel
   * @param  {String} [payload]
   * @return {Promise.<Client>}
   */
  client.notify = (channel, payload) => {
    const sql = (payload)
      ? `NOTIFY ${channel},  ${format.literal(payload)};`
      : `NOTIFY ${channel};`;

    return client.query(sql).then(() => {
      return client;
    });
  };

  /**
   * Unsubscribes from the specified channel and removes all event listeners
   * from the current Client's emitter instance.
   * @param  {String}   channel
   * @return {Promise.<Client>}
   */
  client.unlisten = (channel) => {
    const sql = `UNLISTEN ${channel};`;

    return client.query(sql).then(() => {
      client.removeAllListeners(channel);
      return client;
    });
  };

  /**
   * Connects to the PostgreSQL server before forwarding notifications as
   * typical Node.js events.
   * @type {Promise.<Client>}
   */
  return client.connect().then(() => {
    client.addListener('notification', (message) => {
      const { channel, payload } = message;

      if (client.listenerCount(channel)) {
        client.emit(channel, payload);
      }
    });

    return client;
  });
};
