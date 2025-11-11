const colors = {
  info: '\x1b[36m%s\x1b[0m',    // Cyan
  success: '\x1b[32m%s\x1b[0m', // Green
  warn: '\x1b[33m%s\x1b[0m',    // Yellow
  error: '\x1b[31m%s\x1b[0m'    // Red
};

class Logger {
  info(message, ...args) {
    console.log(colors.info, `ℹ️ ${message}`, ...args);
  }

  success(message, ...args) {
    console.log(colors.success, `✅ ${message}`, ...args);
  }

  warn(message, ...args) {
    console.log(colors.warn, `⚠️ ${message}`, ...args);
  }

  error(message, ...args) {
    console.error(colors.error, `❌ ${message}`, ...args);
  }

  debug(message, ...args) {
    console.log(colors.info, `🔍 ${message}`, ...args);
  }

  // API logging
  apiRequest(url, method, params = {}) {
    this.info(`API Request: ${method} ${url}`, params);
  }

  apiResponse(url, status, duration, data = {}) {
    this.success(`API Response: ${url} [${status}] ${duration}ms`, data);
  }

  // Job logging
  jobProcessing(jobId, type, data = {}) {
    this.info(`Processing Job ${jobId} [${type}]`, data);
  }

  jobCompleted(jobId, type, duration, results = {}) {
    this.success(`Completed Job ${jobId} [${type}] in ${duration}ms`, results);
  }

  jobFailed(jobId, type, error) {
    this.error(`Failed Job ${jobId} [${type}]`, error);
  }
}

module.exports = new Logger();

