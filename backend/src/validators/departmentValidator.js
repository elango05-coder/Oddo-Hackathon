const { z } = require('zod');

const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Department name is required'),
    code: z.string().min(2, 'Department code must be at least 2 characters'),
    parentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent ID').nullable().optional(),
    headId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department head ID').nullable().optional(),
  }),
});

const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(2).optional(),
    parentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent ID').nullable().optional(),
    headId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid head ID').nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
};
