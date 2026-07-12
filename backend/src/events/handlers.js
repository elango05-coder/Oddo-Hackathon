const appEventEmitter = require('./eventEmitter');
const ActivityLogRepository = require('../repositories/ActivityLogRepository');
const notificationDispatcher = require('../notifications/notificationDispatcher');
const logger = require('../config/logger');

// Standardized Activity Logging helper
const logActivity = async (data) => {
  try {
    const { userId, action, collectionName, recordId, oldValue, newValue, ipAddress, userAgent } = data;
    if (!userId) return; // Skip logging if user context is missing (e.g. system cron jobs)
    
    await ActivityLogRepository.create({
      userId,
      action,
      collectionName,
      recordId,
      oldValue,
      newValue,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent || 'System Process',
    });
  } catch (err) {
    logger.error(`[EVENT HANDLER] Failed to write activity log: ${err.message}`);
  }
};

// Generic activity log registration
appEventEmitter.on('activity.log', logActivity);

// 1. Allocation Created
appEventEmitter.on('allocation.created', async ({ allocation, asset, user, triggeredBy }) => {
  await logActivity({
    userId: triggeredBy.id,
    action: 'ALLOCATE_ASSET',
    collectionName: 'Assets',
    recordId: asset._id,
    newValue: { status: asset.status, currentHolderId: asset.currentHolderId },
    ipAddress: triggeredBy.ip,
    userAgent: triggeredBy.userAgent,
  });

  await notificationDispatcher.send({
    userId: user._id,
    title: 'Asset Allocated to You',
    message: `Asset '${asset.name}' (${asset.tag}) has been assigned to you. Expected return date: ${new Date(allocation.expectedReturnDate).toDateString()}`,
    sendEmail: true,
    emailTo: user.email,
    emailSubject: 'AssetFlow - Asset Allocated',
  });
});

// 2. Allocation Returned
appEventEmitter.on('allocation.returned', async ({ allocation, asset, user, triggeredBy }) => {
  await logActivity({
    userId: triggeredBy.id,
    action: 'RETURN_ASSET',
    collectionName: 'Assets',
    recordId: asset._id,
    newValue: { status: asset.status, currentHolderId: null },
    ipAddress: triggeredBy.ip,
    userAgent: triggeredBy.userAgent,
  });

  await notificationDispatcher.send({
    userId: user._id,
    title: 'Asset Return Confirmed',
    message: `Your return check-in for Asset '${asset.name}' (${asset.tag}) has been processed. Condition: ${allocation.conditionOnReturn}.`,
    sendEmail: true,
    emailTo: user.email,
    emailSubject: 'AssetFlow - Asset Return Processing',
  });
});

// 3. Transfer Requested
appEventEmitter.on('transfer.requested', async ({ request, asset, fromUser, toUser, triggeredBy }) => {
  await logActivity({
    userId: triggeredBy.id,
    action: 'REQUEST_TRANSFER',
    collectionName: 'TransferRequests',
    recordId: request._id,
    newValue: request,
    ipAddress: triggeredBy.ip,
    userAgent: triggeredBy.userAgent,
  });

  // Notify recipient they need to accept or wait for approval
  await notificationDispatcher.send({
    userId: toUser._id,
    title: 'Asset Transfer Initiated',
    message: `An asset transfer for '${asset.name}' (${asset.tag}) has been requested to be transferred to you from ${fromUser.name}.`,
    sendEmail: true,
    emailTo: toUser.email,
    emailSubject: 'AssetFlow - Incoming Asset Transfer Request',
  });
});

// 4. Transfer Approved
appEventEmitter.on('transfer.approved', async ({ request, asset, fromUser, toUser, triggeredBy }) => {
  await logActivity({
    userId: triggeredBy.id,
    action: 'APPROVE_TRANSFER',
    collectionName: 'TransferRequests',
    recordId: request._id,
    newValue: request,
    ipAddress: triggeredBy.ip,
    userAgent: triggeredBy.userAgent,
  });

  // Notify former holder
  await notificationDispatcher.send({
    userId: fromUser._id,
    title: 'Asset Transfer Completed',
    message: `Asset '${asset.name}' (${asset.tag}) has been successfully transferred to ${toUser.name}.`,
    sendEmail: true,
    emailTo: fromUser.email,
  });

  // Notify new holder
  await notificationDispatcher.send({
    userId: toUser._id,
    title: 'Asset Transfer Completed',
    message: `Asset '${asset.name}' (${asset.tag}) is now allocated to you following a transfer request from ${fromUser.name}.`,
    sendEmail: true,
    emailTo: toUser.email,
    emailSubject: 'AssetFlow - Asset Transfer Completed',
  });
});

// 5. Transfer Rejected
appEventEmitter.on('transfer.rejected', async ({ request, asset, fromUser, triggeredBy }) => {
  await logActivity({
    userId: triggeredBy.id,
    action: 'REJECT_TRANSFER',
    collectionName: 'TransferRequests',
    recordId: request._id,
    newValue: { status: 'Rejected' },
    ipAddress: triggeredBy.ip,
    userAgent: triggeredBy.userAgent,
  });

  await notificationDispatcher.send({
    userId: fromUser._id,
    title: 'Asset Transfer Rejected',
    message: `The transfer request for '${asset.name}' (${asset.tag}) was rejected by the Department Head.`,
    sendEmail: true,
    emailTo: fromUser.email,
  });
});

// 6. Booking Created
appEventEmitter.on('booking.created', async ({ booking, resource, user, triggeredBy }) => {
  await logActivity({
    userId: triggeredBy.id,
    action: 'BOOK_RESOURCE',
    collectionName: 'Bookings',
    recordId: booking._id,
    newValue: booking,
    ipAddress: triggeredBy.ip,
    userAgent: triggeredBy.userAgent,
  });

  await notificationDispatcher.send({
    userId: user._id,
    title: 'Resource Booking Confirmed',
    message: `Your booking for resource '${resource.name}' (${resource.tag}) from ${new Date(booking.startTime).toLocaleString()} to ${new Date(booking.endTime).toLocaleString()} has been confirmed.`,
    sendEmail: true,
    emailTo: user.email,
    emailSubject: 'AssetFlow - Booking Confirmation',
  });
});

// 7. Booking Cancelled
appEventEmitter.on('booking.cancelled', async ({ booking, resource, user, triggeredBy }) => {
  await logActivity({
    userId: triggeredBy.id,
    action: 'CANCEL_BOOKING',
    collectionName: 'Bookings',
    recordId: booking._id,
    newValue: { status: 'Cancelled' },
    ipAddress: triggeredBy.ip,
    userAgent: triggeredBy.userAgent,
  });

  await notificationDispatcher.send({
    userId: user._id,
    title: 'Resource Booking Cancelled',
    message: `Your booking for resource '${resource.name}' starting at ${new Date(booking.startTime).toLocaleString()} has been cancelled.`,
    sendEmail: true,
    emailTo: user.email,
  });
});

// 8. Maintenance Requested
appEventEmitter.on('maintenance.requested', async ({ request, asset, user, triggeredBy }) => {
  await logActivity({
    userId: triggeredBy.id,
    action: 'REQUEST_MAINTENANCE',
    collectionName: 'MaintenanceRequests',
    recordId: request._id,
    newValue: request,
    ipAddress: triggeredBy.ip,
    userAgent: triggeredBy.userAgent,
  });

  await notificationDispatcher.send({
    userId: user._id,
    title: 'Maintenance Request Submitted',
    message: `Your maintenance request for asset '${asset.name}' has been successfully logged. Ticket: ${request._id}`,
    sendEmail: true,
    emailTo: user.email,
  });
});

// 9. Maintenance Approved
appEventEmitter.on('maintenance.approved', async ({ request, asset, technician, triggeredBy }) => {
  await logActivity({
    userId: triggeredBy.id,
    action: 'APPROVE_MAINTENANCE',
    collectionName: 'MaintenanceRequests',
    recordId: request._id,
    newValue: { status: 'Approved', assignedTechnicianId: request.assignedTechnicianId },
    ipAddress: triggeredBy.ip,
    userAgent: triggeredBy.userAgent,
  });

  if (technician) {
    await notificationDispatcher.send({
      userId: technician._id,
      title: 'Maintenance Task Assigned',
      message: `You have been assigned to service asset '${asset.name}' (${asset.tag}). Priority: ${request.priority}.`,
      sendEmail: true,
      emailTo: technician.email,
      emailSubject: 'AssetFlow - Maintenance Service Assignment',
    });
  }
});

// 10. Maintenance Resolved
appEventEmitter.on('maintenance.resolved', async ({ request, asset, user, triggeredBy }) => {
  await logActivity({
    userId: triggeredBy.id,
    action: 'RESOLVE_MAINTENANCE',
    collectionName: 'MaintenanceRequests',
    recordId: request._id,
    newValue: { status: 'Resolved' },
    ipAddress: triggeredBy.ip,
    userAgent: triggeredBy.userAgent,
  });

  // Notify original reporter
  await notificationDispatcher.send({
    userId: user._id,
    title: 'Maintenance Ticket Resolved',
    message: `Maintenance ticket for asset '${asset.name}' (${asset.tag}) has been resolved. Asset status: Available.`,
    sendEmail: true,
    emailTo: user.email,
  });
});

// 11. Audit Cycle Completed
appEventEmitter.on('audit.completed', async ({ cycle, auditor, discrepanciesCount }) => {
  // Audit logs don't trigger email directly to single user, usually Admin or Auditor
  await notificationDispatcher.send({
    userId: auditor._id,
    title: 'Audit Cycle Completed',
    message: `Audit cycle '${cycle.name}' has been closed. Total verified records matching discrepancies: ${discrepanciesCount}.`,
    sendEmail: true,
    emailTo: auditor.email,
    emailSubject: 'AssetFlow - Audit Cycle Completed Report',
  });
});

// 12. User Promotion
appEventEmitter.on('user.promoted', async ({ targetUser, oldRoleName, newRoleName, triggeredBy }) => {
  await logActivity({
    userId: triggeredBy.id,
    action: 'PROMOTE_USER',
    collectionName: 'Users',
    recordId: targetUser._id,
    oldValue: { role: oldRoleName },
    newValue: { role: newRoleName },
    ipAddress: triggeredBy.ip,
    userAgent: triggeredBy.userAgent,
  });

  await notificationDispatcher.send({
    userId: targetUser._id,
    title: 'Account Role Promoted',
    message: `Your account role has been updated from ${oldRoleName} to ${newRoleName}.`,
    sendEmail: true,
    emailTo: targetUser.email,
  });
});

module.exports = appEventEmitter;
