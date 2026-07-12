const { z } = require('zod');

const allocateAssetSchema = z.object({
  body: z.object({
    assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
    assigneeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid assignee ID'),
    expectedReturnDate: z.string().transform((val) => new Date(val)),
    conditionOnAllocation: z.string().min(1, 'Condition description is required'),
  }),
});

const requestTransferSchema = z.object({
  body: z.object({
    assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
    toUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid recipient user ID'),
    reason: z.string().min(3, 'Transfer reason must be at least 3 characters long'),
  }),
});

const returnAssetSchema = z.object({
  body: z.object({
    assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
    conditionOnReturn: z.string().min(1, 'Return condition description is required'),
  }),
});

module.exports = {
  allocateAssetSchema,
  requestTransferSchema,
  returnAssetSchema,
};
