const Redis = require('ioredis');
const { REDIS_URL } = require('./constants');

const client = new Redis(REDIS_URL);
const subscriber = new Redis(REDIS_URL);
const conn = {
  createClient: (type) => {
    switch (type) {
      case 'client':
        return client;
      case 'subscriber':
        return subscriber;
      default:
        return new Redis(REDIS_URL);
    }
  },
};

module.exports = conn;
