const dotenv = require('dotenv');

dotenv.config();
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const PORT = process.env.PORT || 3000;
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const MONGO_URL = process.env.MONGO_URL;

module.exports = {
  REDIS_URL,
  PORT,
  REDIS_HOST,
  MONGO_URL,
};
