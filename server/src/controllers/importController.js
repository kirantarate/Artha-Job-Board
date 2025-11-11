const jobService = require('../services/jobService');
const queueService = require('../services/queueService');

exports.triggerImport = async (req, res) => {
  try {
    const result = await jobService.triggerImport();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const history = await jobService.getImportHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQueueStats = async (req, res) => {
  try {
    const stats = await queueService.getQueueStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};