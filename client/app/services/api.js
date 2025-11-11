const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = {
  async triggerImport() {
    const response = await fetch(`${API_BASE}/import/trigger`, {
      method: 'POST',
    });
    return response.json();
  },

  async getHistory() {
    const response = await fetch(`${API_BASE}/import/history`);
    return response.json();
  },

  async getQueueStats() {
    const response = await fetch(`${API_BASE}/import/queue/stats`);
    return response.json();
  },
};