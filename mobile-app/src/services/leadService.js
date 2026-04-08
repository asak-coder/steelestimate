const { request, normalizeError } = require('./apiService');

async function createLead(data) {
  try {
    return await request('/leads', {
      method: 'POST',
      body: data,
    });
  } catch (error) {
    throw normalizeError(error);
  }
}

module.exports = {
  createLead,
};