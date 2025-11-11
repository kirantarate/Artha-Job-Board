const xml2js = require('xml2js');
const axios = require('axios');

class XMLParser {
  async fetchAndParse(url) {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(response.data);
      
      return this.normalizeJobData(result, url);
    } catch (error) {
      throw new Error(`Failed to fetch/parse ${url}: ${error.message}`);
    }
  }

  normalizeJobData(xmlData, sourceUrl) {
    // Extract jobs from RSS feed
    const items = xmlData.rss?.channel?.item || [];
    const jobArray = Array.isArray(items) ? items : [items];
    
    return jobArray.map(item => ({
      externalId: item.guid?._ || item.guid || item.link,
      title: item.title,
      company: item['company'] || 'Unknown',
      location: item['jobLocation'] || item['location'] || 'Remote',
      description: item.description || item['content:encoded'],
      jobType: item['jobType'] || 'Full-time',
      category: item.category || 'General',
      url: item.link,
      postedDate: new Date(item.pubDate || Date.now()),
      sourceUrl,
    }));
  }
}

module.exports = new XMLParser();