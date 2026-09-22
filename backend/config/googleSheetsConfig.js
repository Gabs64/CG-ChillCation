/**
 * Server-Side Google Sheets Configuration
 * PRD Requirement: Google Sheets configuration MUST NOT be shown in any of the UI pages.
 * Instead, it is hardcoded & managed securely on the backend server.
 */

export const GOOGLE_SHEETS_CONFIG = {
  // Primary Google Sheets Spreadsheet ID for CG Chillcation Booking Schedules
  spreadsheetId: process.env.GOOGLE_SHEETS_ID || '1CG_CHILLCATION_BOOKINGS_SCHEDULE_2026',
  
  // Google Sheets Sync Destination Name / Tab Title
  tabName: 'Booking Schedules Master Log',

  // Google Apps Script / Webhook Endpoint for Direct Auto-Insertion
  webhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbx_CG_CHILLCATION_SHEETS_SYNC/exec',
  
  // Enable / Disable operational Google Sheets auto-sync
  autoSyncEnabled: true,

  // Full Header Columns mapping all booking schedule details
  columns: [
    'Reference Number',
    'Room Name',
    'Location',
    'Guest Name',
    'Guest Count',
    'Contact Number',
    'Email Address',
    'Vehicle Type',
    'Guest Age',
    'Check-in Date',
    'Check-out Date',
    'Total Amount Paid (PHP)',
    'Payment Method',
    'Payment Reference',
    'Booking Status',
    'Check-in Status',
    'Sync Timestamp'
  ]
};
