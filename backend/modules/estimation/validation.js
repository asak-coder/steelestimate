const { z } = require('zod');

const booleanLike = z.union([
  z.boolean(),
  z.string().trim().transform((value) => {
    const normalized = value.toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'n', 'off', ''].includes(normalized)) {
      return false;
    }
    throw new Error('Invalid boolean value');
  })
]);

const estimateCalculationSchema = z.object({
  projectType: z.string().trim().min(1, 'projectType is required'),
  width: z.coerce.number().positive('width must be greater than 0'),
  length: z.coerce.number().positive('length must be greater than 0'),
  height: z.coerce.number().positive('height must be greater than 0'),
  tonnage: z.coerce.number().positive('tonnage must be greater than 0'),
  workType: z.string().trim().min(1, 'workType is required'),
  locationType: z.string().trim().min(1, 'locationType is required'),
  hazard: booleanLike,
  shutdown: booleanLike,
  nightShift: booleanLike
});

const parseEstimateCalculationInput = (payload) => {
  const result = estimateCalculationSchema.safeParse(payload);

  if (!result.success) {
    const issues = result.error.issues || [];
    const message = issues.length
      ? issues.map((issue) => issue.message).join(', ')
      : 'Invalid estimate calculation payload';
    const error = new Error(message);
    error.name = 'ValidationError';
    error.issues = issues;
    throw error;
  }

  return result.data;
};

module.exports = {
  estimateCalculationSchema,
  parseEstimateCalculationInput
};