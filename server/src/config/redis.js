const Redis = require('ioredis');
const logger = require('../utils/logger');

// Check for required Redis configuration
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  logger.error('❌ Missing Redis configuration. Set REDIS_URL in your environment.');
  process.exit(1);
}

const redisConfig = {
  redisUrl: REDIS_URL,
  db: 0,
  tls: {
    rejectUnauthorized: false,
    servername: 'redis-13901.c9.us-east-1-2.ec2.redns.redis-cloud.com'
  },
  connectTimeout: 20000,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(Math.pow(2, times) * 1000, 30000);
    logger.warn(`Retrying Redis connection in ${delay}ms... (Attempt ${times})`);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  enableOfflineQueue: true,
  enableReadyCheck: true,
  maxReconnectAttempts: 10
};

const createRedisClient = () => {
  const client = new Redis(redisConfig);

  client.on('error', (err) => {
    logger.error('❌ Redis Error:', err);
  });

  client.on('connect', () => {
    logger.info('✅ Redis Connected');
  });

  client.on('ready', () => {
    logger.info('✅ Redis Ready');
  });

  client.on('reconnecting', () => {
    logger.info('🔄 Redis Reconnecting...');
  });

  return client;
};

module.exports = {
  createRedisClient,
  redisConfig
};