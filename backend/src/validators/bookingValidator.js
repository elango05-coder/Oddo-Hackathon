const { z } = require('zod');

const bookResourceSchema = z.object({
  body: z.object({
    resourceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource asset ID'),
    // Accept both startTime/endTime (legacy) and startDate/endDate (frontend)
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    reason: z.string().optional(),
    purpose: z.string().optional(),
  }).refine(data => data.startTime || data.startDate, {
    message: 'startTime or startDate is required',
    path: ['startTime'],
  }).refine(data => data.endTime || data.endDate, {
    message: 'endTime or endDate is required',
    path: ['endTime'],
  }),
});

const rescheduleBookingSchema = z.object({
  body: z.object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).refine(data => data.startTime || data.startDate, {
    message: 'startTime or startDate is required',
    path: ['startTime'],
  }).refine(data => data.endTime || data.endDate, {
    message: 'endTime or endDate is required',
    path: ['endTime'],
  }),
});

module.exports = {
  bookResourceSchema,
  rescheduleBookingSchema,
};
