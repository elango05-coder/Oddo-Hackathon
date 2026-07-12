const { z } = require('zod');

// We coerce fields where appropriate (e.g. cost from form data)
const registerAssetSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Asset name is required'),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional().nullable(),
    serialNumber: z.string().optional(),
    purchaseDate: z.string().transform((val) => new Date(val)),
    purchaseCost: z.coerce.number().min(0, 'Purchase cost cannot be negative'),
    metadata: z.record(z.any()).optional().default({}),
  }),
});

const updateAssetSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID').optional(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional().nullable(),
    serialNumber: z.string().optional(),
    purchaseDate: z.string().transform((val) => new Date(val)).optional(),
    purchaseCost: z.coerce.number().min(0).optional(),
    metadata: z.record(z.any()).optional(),
    status: z.string().optional(),
  }),
});

module.exports = {
  registerAssetSchema,
  updateAssetSchema,
};
