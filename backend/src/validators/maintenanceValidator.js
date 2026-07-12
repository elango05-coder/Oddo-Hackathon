const { z } = require('zod');

const raiseMaintenanceSchema = z.object({
  body: z.object({
    assetId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid asset ID'),
    description: z.string().min(5, 'Description must be at least 5 characters long'),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  }),
});

const approveMaintenanceSchema = z.object({
  body: z.object({
    assignedTechnicianId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid technician ID'),
    estimatedCost: z.coerce.number().min(0, 'Estimated cost cannot be negative'),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  }),
});

const resolveMaintenanceSchema = z.object({
  body: z.object({
    actualCost: z.coerce.number().min(0, 'Actual cost cannot be negative'),
    remarks: z.string().min(1, 'Remarks are required for ticket resolution'),
  }),
});

module.exports = {
  raiseMaintenanceSchema,
  approveMaintenanceSchema,
  resolveMaintenanceSchema,
};
