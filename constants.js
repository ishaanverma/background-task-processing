const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const PORT = process.env.PORT || 3000;

module.exports = {
  REDIS_URL,
  PORT,
};
