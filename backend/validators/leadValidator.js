const { z } = require('zod');

const leadStatusSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'])
});

const leadCreateSchema = z.object({
  estimateId: z.string().trim().min(1),
  clientName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().email(),
  notes: z.string().trim().optional(),
  source: z.enum(['mobile', 'admin', 'api']).optional(),
  consent: z.boolean().optional()
});

const leadScoringParamsSchema = z.object({});

const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

module.exports = {
  leadStatusSchema,
  leadCreateSchema,
  leadScoringParamsSchema,
  adminLoginSchema
};
