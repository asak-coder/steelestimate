const { z } = require('zod');

const boqTypeSchema = z.enum(['IS', 'PLATE', 'PIPE']);

const boqDimensionsSchema = z.record(z.unknown()).default({});

const boqItemSchema = z.object({
  type: boqTypeSchema,
  section: z.string().trim().min(1, 'Section is required'),
  dimensions: boqDimensionsSchema,
  weight: z.number().nonnegative('Weight must be a non-negative number'),
  cost: z.number().nonnegative('Cost must be a non-negative number')
});

const boqSaveSchema = z.object({
  items: z.array(boqItemSchema).min(1, 'At least one BOQ item is required'),
  totalWeight: z.number().nonnegative('Total weight must be a non-negative number'),
  totalCost: z.number().nonnegative('Total cost must be a non-negative number'),
  projectName: z.string().trim().max(120).optional()
});

const boqProjectIdSchema = z.object({
  id: z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid project id')
});

const boqListQuerySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }

      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    })
});

module.exports = {
  boqTypeSchema,
  boqItemSchema,
  boqSaveSchema,
  boqProjectIdSchema,
  boqListQuerySchema
};