const express = require('express');
const BookingController = require('../controllers/BookingController');
const validate = require('../middlewares/validation');
const { authenticate, requirePermission } = require('../middlewares/auth');
const { PERMISSIONS } = require('../constants');
const { bookResourceSchema, rescheduleBookingSchema } = require('../validators/bookingValidator');

const router = express.Router();

router.use(authenticate);

router.get('/calendar', requirePermission(PERMISSIONS.BOOKING_READ), BookingController.getCalendar);
router.post('/', requirePermission(PERMISSIONS.BOOKING_WRITE), validate(bookResourceSchema), BookingController.bookResource);
router.post('/:id/reschedule', requirePermission(PERMISSIONS.BOOKING_WRITE), validate(rescheduleBookingSchema), BookingController.rescheduleBooking);
router.post('/:id/cancel', requirePermission(PERMISSIONS.BOOKING_DELETE), BookingController.cancelBooking);

module.exports = router;
