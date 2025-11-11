const apiService = require('./apiService');
const queueService = require('./queueService');
const ImportLog = require('../models/ImportLog');
const Job = require('../models/Job');
const logger = require('../utils/logger');
const jobProcessor = require('./jobProcessor');

class JobService {
  async triggerImport() {
    logger.info('🚀 Starting import process...');
    
    // Fetch from all sources
    const sources = await apiService.fetchAllSources();
    
    // Create import logs and queue jobs
    const importIds = [];
    
    for (const source of sources) {
      if (!source.success || !source.jobs?.length) continue;
      
      const startTime = Date.now();
      const importLog = await ImportLog.create({
        fileName: source.url,
        totalFetched: source.jobs.length,
        status: 'pending',
        timestamp: new Date(),
      });
      
      await queueService.addImportJob({
        jobs: source.jobs,
        url: source.url,
        importId: importLog._id,
        startTime
      });
      
      importIds.push(importLog._id);
    }
    
    return { message: 'Import started', importIds };
  }

  async getImportHistory(limit = 50) {
    return await ImportLog.find()
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  async getImportById(id) {
    return await ImportLog.findById(id);
  }

  async processJobBatch(jobs, url, importId) {
    return await jobProcessor.processJobBatch(jobs, url, importId);
  }
}

module.exports = new JobService();