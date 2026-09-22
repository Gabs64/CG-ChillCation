import express from 'express';
import bcrypt from 'bcryptjs';
import { run, get, all } from '../db.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';
import { processPaymentGateway } from '../services/paymentService.js';
import { sendBookingConfirmationEmail } from '../services/emailService.js';
import { syncBookingToSheets } from '../services/sheetsService.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cg_chillcation_secret_key_2026';

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Helper to generate unique reference number: CGC-YYYYMMDD-XXXX
const generateBookingReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CGC-${dateStr}-${randomSuffix}`;
};

// ----------------------------------------------------
// 1. PUBLIC ROOMS & AVAILABILITY
// ----------------------------------------------------

// Get all rooms (filtered by location option)
router.get('/rooms', async (req, res) => {
  try {
    const { location } = req.query;
    let sql = 'SELECT * FROM rooms';
    let params = [];

    if (location && location !== 'All') {
      sql += ' WHERE location = ?';
      params.push(location);
    }
    sql += ' ORDER BY id ASC';

    const rooms = await all(sql, params);

    // Fetch images for each room
    const roomsWithImages = await Promise.all(
      rooms.map(async (room) => {
        const images = await all('SELECT image_url, display_order FROM room_images WHERE room_id = ? ORDER BY display_order ASC', [room.id]);
        return {
          ...room,
          images: images.map((img) => img.image_url)
        };
      })
    );

    res.json({ success: true, rooms: roomsWithImages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check availability for a specific room and date range
router.post('/bookings/check-availability', async (req, res) => {
  try {
    const { roomId, checkIn, checkOut } = req.body;
    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Room ID, check-in, and check-out dates are required.' });
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date.' });
    }

    // Overlap check rule: (existing.check_in < requested.check_out) AND (existing.check_out > requested.check_in)
    const existing = await get(
      `SELECT id FROM bookings 
       WHERE room_id = ? 
       AND booking_status IN ('CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN')
       AND check_in < ? AND check_out > ?`,
      [roomId, checkOut, checkIn]
    );

    const isAvailable = !existing;
    res.json({ success: true, isAvailable, roomId, checkIn, checkOut });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 2. GUEST BOOKING FLOW & PAYMENT
// ----------------------------------------------------

// Create Booking
router.post('/bookings', async (req, res) => {
  try {
    const {
      roomId,
      guestName,
      guestCount,
      contactNumber,
      email,
      vehicle,
      age,
      checkIn,
      checkOut
    } = req.body;

    // Validate fields
    if (!roomId || !guestName || !guestCount || !contactNumber || !email || !vehicle || age === undefined || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // BR-004: Guests below 18 years old cannot make a booking
    if (Number(age) < 18) {
      return res.status(400).json({
        error: 'Booking unavailable. Guests must be 18 years old or above.'
      });
    }

    // Validate date sequence
    if (new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date.' });
    }

    // BR-005: Server-side double booking prevention
    const existingOverlapping = await get(
      `SELECT id FROM bookings 
       WHERE room_id = ? 
       AND booking_status IN ('CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN')
       AND check_in < ? AND check_out > ?`,
      [roomId, checkOut, checkIn]
    );

    if (existingOverlapping) {
      return res.status(409).json({
        error: 'Selected room is no longer available for these dates. Please select different dates or room.'
      });
    }

    const referenceNumber = generateBookingReference();

    const insertResult = await run(
      `INSERT INTO bookings (reference_number, room_id, guest_name, guest_count, contact_number, email, vehicle, age, check_in, check_out, booking_status, check_in_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_PAYMENT', 'NOT_CHECKED_IN')`,
      [referenceNumber, roomId, guestName, guestCount, contactNumber, email, vehicle, age, checkIn, checkOut]
    );

    const bookingId = insertResult.lastID;
    const room = await get('SELECT * FROM rooms WHERE id = ?', [roomId]);

    // Calculate nights
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) || 1;
    const totalAmount = room.price_per_night * nights;

    res.json({
      success: true,
      booking: {
        id: bookingId,
        referenceNumber,
        roomId,
        roomName: room.room_name,
        location: room.location,
        guestName,
        email,
        checkIn,
        checkOut,
        nights,
        totalAmount,
        bookingStatus: 'PENDING_PAYMENT'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process Payment & Confirm Booking
router.post('/bookings/:id/pay', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { paymentMethod, amount } = req.body;

    if (!paymentMethod || !amount) {
      return res.status(400).json({ error: 'Payment method and amount are required.' });
    }

    const booking = await get(
      `SELECT b.*, r.room_name, r.location 
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id 
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Call payment gateway abstraction
    const paymentResult = await processPaymentGateway(paymentMethod, amount);

    // Record payment entry
    await run(
      `INSERT INTO payments (booking_id, payment_method, payment_reference, amount, payment_status, paid_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [bookingId, paymentMethod, paymentResult.transactionReference, amount, 'PAID']
    );

    // Update booking status to CONFIRMED
    await run(
      `UPDATE bookings SET booking_status = 'CONFIRMED' WHERE id = ?`,
      [bookingId]
    );

    const updatedBooking = {
      ...booking,
      booking_status: 'CONFIRMED',
      payment_method: paymentMethod,
      payment_reference: paymentResult.transactionReference,
      amount
    };

    // Trigger Email Notification Service
    await sendBookingConfirmationEmail({
      email: booking.email,
      guestName: booking.guest_name,
      referenceNumber: booking.reference_number,
      roomName: booking.room_name,
      checkIn: booking.check_in,
      checkOut: booking.check_out
    });

    // Trigger Google Sheets Sync Service (Saves all reservation schedule details in Google Sheets)
    await syncBookingToSheets(updatedBooking);

    res.json({
      success: true,
      booking: updatedBooking,
      payment: paymentResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lookup Guest Booking without Account
router.get('/bookings/lookup', async (req, res) => {
  try {
    const { referenceNumber, email } = req.query;
    if (!referenceNumber || !email) {
      return res.status(400).json({ error: 'Booking Reference and Email are required.' });
    }

    const booking = await get(
      `SELECT b.*, r.room_name, r.location, r.description, p.payment_method, p.payment_reference, p.amount 
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN payments p ON b.id = p.booking_id
       WHERE LOWER(b.reference_number) = LOWER(?) AND LOWER(b.email) = LOWER(?)`,
      [referenceNumber.trim(), email.trim()]
    );

    if (!booking) {
      return res.status(404).json({ error: 'No matching booking found for the provided details.' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 3. REVIEWS
// ----------------------------------------------------

router.get('/reviews', async (req, res) => {
  try {
    const reviews = await all(`SELECT * FROM reviews WHERE display_status = 'APPROVED' ORDER BY created_at DESC`);
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reviews', async (req, res) => {
  try {
    const { guestName, rating, review } = req.body;
    if (!guestName || !rating || !review) {
      return res.status(400).json({ error: 'Guest name, rating, and review text are required.' });
    }

    await run(
      `INSERT INTO reviews (guest_name, rating, review, display_status) VALUES (?, ?, ?, 'APPROVED')`,
      [guestName, rating, review]
    );

    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. AUTHENTICATION (Staff, Customer Support, Owner)
// ----------------------------------------------------

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is currently inactive. Contact Owner.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/auth/me', verifyToken, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ----------------------------------------------------
// 5. ADMIN / STAFF / CS / OWNER DASHBOARDS
// ----------------------------------------------------

// Daily Check-ins (Staff, CS, Owner)
router.get('/admin/checkins', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const { date } = req.query;
    const targetDate = date || todayStr;

    const checkins = await all(
      `SELECT b.*, r.room_name, r.location, p.payment_method, p.amount, p.payment_status
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN payments p ON b.id = p.booking_id
       WHERE b.check_in = ? OR b.check_out = ? OR b.check_in_status = 'CHECKED_IN'
       ORDER BY b.check_in ASC`,
      [targetDate, targetDate]
    );

    res.json({ success: true, date: targetDate, checkins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Check-in / Check-out status
router.patch('/admin/bookings/:id/checkin-status', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { checkInStatus } = req.body;

    if (!['NOT_CHECKED_IN', 'CHECKED_IN', 'CHECKED_OUT'].includes(checkInStatus)) {
      return res.status(400).json({ error: 'Invalid check-in status value.' });
    }

    let bookingStatusUpdate = '';
    if (checkInStatus === 'CHECKED_IN') bookingStatusUpdate = ", booking_status = 'CHECKED_IN'";
    if (checkInStatus === 'CHECKED_OUT') bookingStatusUpdate = ", booking_status = 'CHECKED_OUT'";

    await run(
      `UPDATE bookings SET check_in_status = ? ${bookingStatusUpdate} WHERE id = ?`,
      [checkInStatus, bookingId]
    );

    // Sync status update to Google Sheets
    const updated = await get('SELECT b.*, r.room_name, r.location, p.payment_method, p.amount, p.payment_reference FROM bookings b JOIN rooms r ON b.room_id = r.id LEFT JOIN payments p ON b.id = p.booking_id WHERE b.id = ?', [bookingId]);
    if (updated) {
      await syncBookingToSheets(updated);
    }

    res.json({ success: true, message: `Check-in status updated to ${checkInStatus}`, booking: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Master Calendar Data Matrix
router.get('/admin/calendar', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const rooms = await all('SELECT id, room_name, location FROM rooms ORDER BY id ASC');
    const bookings = await all(
      `SELECT b.id, b.reference_number, b.room_id, b.guest_name, b.check_in, b.check_out, b.booking_status, b.check_in_status, r.room_name, r.location
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.booking_status IN ('CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN', 'CHECKED_OUT')`
    );

    res.json({ success: true, rooms, bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin All Bookings List
router.get('/admin/bookings', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const bookings = await all(
      `SELECT b.*, r.room_name, r.location, p.payment_method, p.amount, p.payment_status
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN payments p ON b.id = p.booking_id
       ORDER BY b.created_at DESC`
    );

    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 6. OWNER EXCLUSIVE FEATURES
// ----------------------------------------------------

// Revenue Analytics
router.get('/owner/revenue', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const totalPaid = await get(`SELECT SUM(amount) as total FROM payments WHERE payment_status = 'PAID'`);
    const paidCount = await get(`SELECT COUNT(*) as count FROM bookings WHERE booking_status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')`);
    const pendingCount = await get(`SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'PENDING_PAYMENT'`);

    const byLocation = await all(
      `SELECT r.location, SUM(p.amount) as revenue, COUNT(b.id) as total_bookings
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN payments p ON b.id = p.booking_id
       WHERE p.payment_status = 'PAID'
       GROUP BY r.location`
    );

    const byRoom = await all(
      `SELECT r.room_name, r.location, SUM(p.amount) as revenue, COUNT(b.id) as total_bookings
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       JOIN payments p ON b.id = p.booking_id
       WHERE p.payment_status = 'PAID'
       GROUP BY r.id ORDER BY revenue DESC`
    );

    res.json({
      success: true,
      totalRevenue: totalPaid.total || 0,
      paidBookingsCount: paidCount.count || 0,
      pendingPaymentsCount: pendingCount.count || 0,
      revenueByLocation: byLocation,
      revenueByRoom: byRoom
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Account Management: Get all users
router.get('/owner/users', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const users = await all(`SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC`);
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Account Management: Create Staff or CS user
router.post('/owner/users', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    if (!['STAFF', 'CUSTOMER_SUPPORT'].includes(role)) {
      return res.status(400).json({ error: 'Role must be STAFF or CUSTOMER_SUPPORT.' });
    }

    const existing = await get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run(
      `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [name, email.trim(), passwordHash, role]
    );

    res.json({
      success: true,
      message: `Successfully created ${role} account for ${name}`,
      userId: result.lastID
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Account Management: Update user status or password
router.patch('/owner/users/:id', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const userId = req.params.id;
    const { status, password, role } = req.body;

    const user = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === 'OWNER' && status === 'INACTIVE') {
      return res.status(400).json({ error: 'Owner account cannot be deactivated.' });
    }

    if (status) {
      await run('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    }

    if (role && ['STAFF', 'CUSTOMER_SUPPORT'].includes(role)) {
      await run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    }

    res.json({ success: true, message: 'User account updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Review Management: Toggle display status
router.patch('/owner/reviews/:id', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { displayStatus } = req.body;

    if (!['APPROVED', 'HIDDEN'].includes(displayStatus)) {
      return res.status(400).json({ error: 'Invalid display status.' });
    }

    await run('UPDATE reviews SET display_status = ? WHERE id = ?', [displayStatus, reviewId]);
    res.json({ success: true, message: `Review display status updated to ${displayStatus}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Sheets Sync Log view
router.get('/owner/sheets-log', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const logs = await all('SELECT * FROM sheets_sync_log ORDER BY synced_at DESC LIMIT 50');
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
