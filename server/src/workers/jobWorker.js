const queueService = require('../services/queueService');
const logger = require('../utils/logger');

const queue = queueService.getQueue();

// Use environment-configurable concurrency as per assignment bonus requirements
const CONCURRENCY = parseInt(process.env.QUEUE_CONCURRENCY, 10) || 5;

queue.process('import-jobs', CONCURRENCY, async (job) => {
  logger.info(`Processing job ${job.id} - Batch ${job.data.batchNumber}/${job.data.totalBatches}`);

  try {
    const result = await queueService.processBatch(job);

    // Update job progress
    if (job.data.jobs && job.data.jobs.length) {
      const totalProcessed = result.newJobs + result.updatedJobs + result.failedJobs;
      const progress = (totalProcessed / job.data.jobs.length) * 100;
      await job.progress(progress);
    }

    return result;
  } catch (error) {
    logger.error(`Error in worker processing job ${job.id}:`, error);
    throw error;
  }
});

queue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

queue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

logger.info(`🔄 Worker started with concurrency: ${CONCURRENCY}`);

module.exports = queue;