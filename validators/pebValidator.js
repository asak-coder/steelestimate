const { z } = require('zod');

const pebCalculationSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  location: z.string().trim().min(1),
  crane: z.boolean(),
  craneCapacity: z.number().nonnegative().optional()
});

const pebLeadSchema = z.object({
  clientName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().email(),
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  location: z.string().trim().min(1),
  crane: z.boolean(),
  craneCapacity: z.number().nonnegative().optional()
});

const pricingOptimizationSchema = z.object({
  baseCost: z.number().positive(),
  projectSize: z.number().positive(),
  location: z.string().trim().min(1)
});

module.exports = {
  pebCalculationSchema,
  pebLeadSchema,
  pricingOptimizationSchema
};