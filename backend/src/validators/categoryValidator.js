const { z } = require('zod');

const metadataFieldDefSchema = z.object({
  name: z.string().min(1, 'Field name identifier is required'),
  label: z.string().min(1, 'Field label is required'),
  type: z.enum(['text', 'number', 'boolean', 'date']),
  required: z.boolean().default(false),
});

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    code: z.string().min(2, 'Category code must be at least 2 characters'),
    description: z.string().optional(),
    fields: z.array(metadataFieldDefSchema).optional(),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(2).optional(),
    description: z.string().optional(),
    fields: z.array(metadataFieldDefSchema).optional(),
  }),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
