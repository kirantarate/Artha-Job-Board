const cron = require('node-cron');
const jobService = require('../services/jobService');

// Run every hour: '0 * * * *'
const schedule = process.env.CRON_SCHEDULE || '0 * * * *';

const startCronJob = () => {
  cron.schedule(schedule, async () => {
    console.log('⏰ Cron job triggered - Starting import...');
    try {
      await jobService.triggerImport();
    } catch (error) {
      console.error('❌ Cron job failed:', error);
    }
  });
  
  console.log(`⏰ Cron job scheduled: ${schedule}`);
};

module.exports = startCronJob;