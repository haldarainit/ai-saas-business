// Export all models with their types
export { default as Attendance, type IAttendance, type ILocation, type IClockRecord } from './Attendance';
export { default as Availability, type IAvailability, type ITimeRange, type IWeeklySchedule, type IDateOverride } from './Availability';
export { default as Booking, type IBooking, type IAttendee, type IReminderSent } from './Booking';
export { default as Campaign, type ICampaign, type IRecipient, type ICampaignSettings, type ICsvData } from './Campaign';
export { default as CampaignEmailHistory, type ICampaignEmailHistory, type IDeliveryDetails } from './CampaignEmailHistory';
export { default as EmailAutomationSettings, type IEmailAutomationSettings, type ISmtpConfig } from './EmailAutomationSettings';
export { default as EmailLog, type IEmailLog } from './EmailLog';
export { default as EmailTracking, type IEmailTracking, type IOpenEvent, type IClickEvent, type IDeviceInfo, type ICampaignAnalyticsTotals } from './EmailTracking';
export { default as Employee, type IEmployee, type IWorkSchedule, type ILeaveBalance, type ISalary, type IGeofence } from './Employee';
export { default as EventType, type IEventType, type ICustomQuestion, type IEventTypeLocation } from './EventType';
export { default as Leave, type ILeave } from './Leave';
export { default as LeavePolicy, type ILeavePolicy, type ILeaveTypeRule } from './LeavePolicy';
export { default as LocationTracking, type ILocationTracking, type ILocationCoordinates, type IGeofenceViolation } from './LocationTracking';
export { default as User, type IUser } from './User';
export { default as UserProfile, type IUserProfile, type IGoogleCalendar, type IOutlookCalendar, type INotifications, type IEmailSettings, type IDefaultLocation } from './UserProfile';
