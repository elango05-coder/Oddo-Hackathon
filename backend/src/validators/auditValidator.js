const { z } = require('zod');

const createAuditCycleSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Audit cycle name must be at least 2 characters'),
    startDate: z.string().transform((val) => new Date(val)),
    endDate: z.string().transform((val) => new Date(val)),
    assignedAuditors: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid auditor ID')).nonempty('At least one auditor must be assigned'),
  }),
});

const verifyAssetSchema = z.object({
  body: z.object({
    cycleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid cycle ID'),
    assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
    status: z.enum(['Verified', 'Missing', 'Damaged']),
    notes: z.string().optional().default(''),
  }),
});

module.exports = {
  createAuditCycleSchema,
  verifyAssetSchema,
};
