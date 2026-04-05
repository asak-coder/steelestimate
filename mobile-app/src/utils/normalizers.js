export function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeProjectData(projectData = {}) {
  return {
    length: toNumber(projectData.length),
    width: toNumber(projectData.width),
    height: toNumber(projectData.height),
    soilType: projectData.soilType ? String(projectData.soilType).trim() : '',
    designCode: projectData.designCode ? String(projectData.designCode).trim() : 'IS800',
    unitSystem: projectData.unitSystem ? String(projectData.unitSystem).trim() : 'Metric',
  };
}

export function normalizeLeadData(leadData = {}) {
  return {
    name: leadData.name ? String(leadData.name).trim() : '',
    phone: leadData.phone ? String(leadData.phone).trim() : '',
    email: leadData.email ? String(leadData.email).trim() : '',
    city: leadData.city ? String(leadData.city).trim() : '',
    requirement: leadData.requirement ? String(leadData.requirement).trim() : '',
  };
}

export function normalizePebResponse(response) {
  if (!response || typeof response !== 'object') {
    return { success: false, data: null, message: 'Invalid API response' };
  }

  return {
    success: Boolean(response.success),
    data: response.data || null,
    message: typeof response.message === 'string' ? response.message : '',
  };
}