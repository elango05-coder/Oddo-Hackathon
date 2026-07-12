const { z } = require('zod');

const bookResourceSchema = z.object({
  body: z.object({
    resourceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource asset ID'),
    startTime: z.string().transform((val) => new Date(val)),
    endTime: z.string().transform((val) => new Date(val)),
    reason: z.string().optional(),
  }),
});

const rescheduleBookingSchema = z.object({
  body: z.object({
    startTime: z.string().transform((val) => new Date(val)),
    endTime: z.string().transform((val) => new Date(val)),
  }),
});

module.exports = {
  bookResourceSchema,
  rescheduleBookingSchema,
};
