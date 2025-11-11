const Job = require('../models/Job');
const logger = require('../utils/logger');

class JobProcessor {
  async processJobBatch(jobs, url, importId) {
    let newJobs = 0;
    let updatedJobs = 0;
    let failedJobs = 0;
    const failures = [];

    for (const jobData of jobs) {
      try {
        // Check if job already exists by externalId
        const existing = await Job.findOne({ externalId: jobData.externalId });

        if (existing) {
          // Update existing job
          await Job.updateOne(
            { _id: existing._id },
            {
              ...jobData,
              updatedAt: new Date()
            }
          );
          updatedJobs++;
        } else {
          // Create new job
          await Job.create({
            ...jobData,
            sourceUrl: url,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          newJobs++;
        }
      } catch (error) {
        failedJobs++;
        failures.push({
          job: jobData,
          reason: error.message,
          error: error.stack,
        });
        logger.error(`Failed to process job ${jobData.externalId || 'unknown'}:`, error.message);
      }
    }

    logger.info(`Batch processed: ${newJobs} new, ${updatedJobs} updated, ${failedJobs} failed`);

    return {
      newJobs,
      updatedJobs,
      failedJobs,
      failures
    };
  }
}

module.exports = new JobProcessor();
