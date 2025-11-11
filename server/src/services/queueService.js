const Queue = require('bull');
const logger = require('../utils/logger');
const { redisConfig } = require('../config/redis');
const ImportLog = require('../models/ImportLog');
const Job = require('../models/Job');
const jobProcessor = require('./jobProcessor');

const CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY, 10) || 3;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE, 10) || 100;

const jobQueue = new Queue('job-import', {
  redis: redisConfig.redisUrl,
  settings: {
    lockDuration: 30000, // 30 seconds
    stalledInterval: 30000, // How often check for stalled jobs
    maxStalledCount: 3 // Max number of times a job can be marked as stalled
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 100, // Keep last 100 failed jobs
    timeout: 60000 // 60 seconds
  }
});

// Event handlers
jobQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

jobQueue.on('waiting', (jobId) => logger.info(`Job ${jobId} is waiting`));
jobQueue.on('active', (job) => logger.info(`Job ${job.id} is active`));
jobQueue.on('completed', (job) => logger.success(`Job ${job.id} completed`));
jobQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
  logger.debug('Failed job payload:', job.data);
});

// Monitor Redis connection (ioredis client exposed by bull)
if (jobQueue.client) {
  jobQueue.client.on('connect', () => logger.info('Queue Redis client connected'));
  jobQueue.client.on('reconnecting', () => logger.warn('Queue Redis client reconnecting...'));
  jobQueue.client.on('close', () => logger.warn('Queue Redis connection closed'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

class QueueService {
  async addImportJob(data) {
    const { jobs, url, importId, startTime } = data;

    const batches = [];
    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      batches.push(jobs.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < batches.length; i++) {
      await jobQueue.add('import-jobs', {
        jobs: batches[i],
        url,
        importId,
        batchNumber: i + 1,
        totalBatches: batches.length,
        startTime
      }, {
        priority: 1,
        attempts: 3
      });
    }

    logger.info(`Added ${batches.length} batches to queue for import ${importId}`);
  }

  async processBatch(job) {
    const { jobs, url, importId, batchNumber, totalBatches, startTime } = job.data;

    try {
      if (batchNumber === 1) {
        await ImportLog.findByIdAndUpdate(importId, { status: 'processing', startTime: new Date(startTime) });
      }

      const results = await jobProcessor.processJobBatch(jobs, url, importId);

      const updateQuery = {
        $inc: {
          totalImported: jobs.length,
          newJobs: results.newJobs,
          updatedJobs: results.updatedJobs,
          failedJobs: results.failedJobs
        }
      };

      if (results.failures && results.failures.length) {
        updateQuery.$push = { failures: { $each: results.failures } };
      }

      if (batchNumber === totalBatches) {
        updateQuery.$set = { status: 'completed', duration: Date.now() - startTime };
      }

      await ImportLog.findByIdAndUpdate(importId, updateQuery);

      return results;
    } catch (err) {
      logger.error(`Error processing batch ${batchNumber}/${totalBatches} for import ${importId}:`, err);
      if (batchNumber === totalBatches) {
        await ImportLog.findByIdAndUpdate(importId, { status: 'failed', duration: Date.now() - startTime });
      }
      throw err;
    }
  }

  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      jobQueue.getWaitingCount(),
      jobQueue.getActiveCount(),
      jobQueue.getCompletedCount(),
      jobQueue.getFailedCount()
    ]);

    return { waiting, active, completed, failed };
  }

  getQueue() {
    return jobQueue;
  }
}

module.exports = new QueueService();