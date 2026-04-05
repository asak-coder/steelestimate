const { z } = require('zod');

const leadStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'converted'])
});

const leadScoringParamsSchema = z.object({});

const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

module.exports = {
  leadStatusSchema,
  leadScoringParamsSchema,
  adminLoginSchema
};
