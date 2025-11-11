const xmlParser = require('../utils/xmlParser');

const API_SOURCES = [
  'https://jobicy.com/?feed=job_feed',
  'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
  'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
  'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
  'https://jobicy.com/?feed=job_feed&job_categories=data-science',
  'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
  'https://jobicy.com/?feed=job_feed&job_categories=business',
  'https://jobicy.com/?feed=job_feed&job_categories=management',
  'https://www.higheredjobs.com/rss/articleFeed.cfm',
];

class APIService {
  async fetchAllSources() {
    const results = [];
    
    for (const url of API_SOURCES) {
      try {
        console.log(`📥 Fetching: ${url}`);
        const jobs = await xmlParser.fetchAndParse(url);
        results.push({ url, jobs, success: true });
      } catch (error) {
        console.error(`❌ Error fetching ${url}:`, error.message);
        results.push({ url, jobs: [], success: false, error: error.message });
      }
    }
    
    return results;
  }
}

module.exports = new APIService();