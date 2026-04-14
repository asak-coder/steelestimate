const ROUTES = {
  ROOT: 'Root',
  HOME: 'HomeScreen',
  STEEL_CALCULATOR: 'SteelCalculatorScreen',
  PEB_ESTIMATOR: 'PEBEstimatorScreen',
  RESULT: 'EstimateResultScreen',
  LEAD_FORM: 'LeadFormScreen',
  SAVED_PROJECTS: 'SavedProjectsScreen',
};

const TABS = {
  HOME: 'HomeTab',
  CALCULATOR: 'CalculatorTab',
  ESTIMATES: 'EstimatesTab',
  SAVED: 'SavedTab',
};

const API = {
  BASE_URL: 'https://steelestimate.onrender.com',
  TIMEOUT_MS: 30000,
  ESTIMATES_PATH: '/api/v1/estimates',
  LEADS_PATH: '/api/v1/leads',
};

const OFFLINE = {
  STORAGE_KEY: 'steelestimate.offline.queue',
  ESTIMATES_KEY: 'steelestimate.saved.estimates',
  PROJECTS_KEY: 'steelestimate.saved.projects',
};

const BUSINESS_RULES = {
  LEAD_TONNAGE_THRESHOLD: 3,
};

const DISCLAIMER =
  'This is a preliminary estimation tool. Not for structural design.';

module.exports = {
  ROUTES,
  TABS,
  API,
  OFFLINE,
  BUSINESS_RULES,
  DISCLAIMER,
};

module.exports.default = {
  ROUTES,
  TABS,
  API,
  OFFLINE,
  BUSINESS_RULES,
  DISCLAIMER,
};