const isString = (value) => typeof value === 'string';

const trimString = (value) => (isString(value) ? value.trim() : '');

const makeSchema = (check) => ({
  safeParse(data) {
    const issues = check(data);
    if (issues.length > 0) {
      return {
        success: false,
        error: {
          issues: issues.map((message) => ({ message }))
        }
      };
    }

    return {
      success: true,
      data
    };
  }
});

const leadStatusSchema = makeSchema((data) => {
  const issues = [];
  const status = trimString(data?.status);
  const allowed = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];

  if (!allowed.includes(status)) {
    issues.push('status must be one of NEW, IN_PROGRESS, COMPLETED, REJECTED');
  }

  return issues;
});

const leadCreateSchema = makeSchema((data) => {
  const issues = [];

  if (!trimString(data?.estimateId)) issues.push('estimateId is required');
  if (!trimString(data?.clientName)) issues.push('clientName is required');
  if (!trimString(data?.phone)) issues.push('phone is required');

  const email = trimString(data?.email);
  if (!email) {
    issues.push('email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    issues.push('email must be a valid email address');
  }

  const source = trimString(data?.source);
  if (source && !['mobile', 'admin', 'api'].includes(source)) {
    issues.push('source must be one of mobile, admin, api');
  }

  return issues;
});

const leadScoringParamsSchema = makeSchema(() => []);

const adminLoginSchema = makeSchema((data) => {
  const issues = [];
  const email = trimString(data?.email);
  const password = trimString(data?.password);

  if (!email) {
    issues.push('email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    issues.push('email must be a valid email address');
  }

  if (!password) {
    issues.push('password is required');
  }

  return issues;
});

module.exports = {
  leadStatusSchema,
  leadCreateSchema,
  leadScoringParamsSchema,
  adminLoginSchema
};
