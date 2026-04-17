const { z } = require('zod');

const estimateCreateSchema = z.object({
  projectType: z.string().trim().min(1),
  inputs: z.object({
    geometry: z.object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive()
    }),
    soilData: z.object({}).optional(),
    loads: z.object({}).optional(),
    designCode: z.string().trim().optional(),
    unitSystem: z.enum(['metric', 'imperial']).optional(),
    location: z.string().trim().optional(),
    crane: z.boolean().optional(),
    craneCapacity: z.number().nonnegative().optional()
  })
});

module.exports = {
  estimateCreateSchema
};