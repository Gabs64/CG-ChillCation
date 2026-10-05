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

// Helper: Generate unique reference number: CGC-YYYYMMDD-XXXX
const generateBookingReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CGC-${dateStr}-${randomSuffix}`;
};

// Helper: Record Audit Log
const recordAuditLog = async (userName, userRole, action, target, details, prevVal = null, newVal = null) => {
  try {
    await run(
      `INSERT INTO audit_logs (user_name, user_role, action, target, details, previous_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userName || 'System', userRole || 'SYSTEM', action, target, details, prevVal ? String(prevVal) : null, newVal ? String(newVal) : null]
    );
  } catch (err) {
    console.error('Audit log record error:', err);
  }
};

// ----------------------------------------------------
// 1. PUBLIC CONFIGURATION & SETTINGS
// ----------------------------------------------------

router.get('/settings/public', async (req, res) => {
  try {
    const settingsRows = await all('SELECT key, value FROM settings');
    const settingsMap = {};
    settingsRows.forEach((r) => {
      settingsMap[r.key] = r.value;
    });

    res.json({
      success: true,
      settings: {
        securityDepositAmount: Number(settingsMap['security_deposit_amount'] || 1000),
        securityDepositEnabled: settingsMap['security_deposit_enabled'] !== 'false',
        metaMessengerUrl: settingsMap['meta_messenger_url'] || 'https://m.me/cgchillcation',
        googleMapsAntipolo: settingsMap['google_maps_antipolo'] || 'https://maps.google.com/?q=Antipolo+Rizal+CG+Chillcation',
        googleMapsCainta: settingsMap['google_maps_cainta'] || 'https://maps.google.com/?q=Cainta+Rizal+CG+Chillcation',
        secretAdminPath: settingsMap['secret_admin_path'] || 'portal-access-8f3k29x7-admin-secure'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 2. PUBLIC ROOMS, GALLERIES & AVAILABILITY
// ----------------------------------------------------

// Get all rooms (with filters for location and featured)
router.get('/rooms', async (req, res) => {
  try {
    const { location, featured } = req.query;
    let sql = 'SELECT * FROM rooms WHERE status != "DEACTIVATED"';
    let params = [];

    if (location && location !== 'All') {
      sql += ' AND location = ?';
      params.push(location);
    }
    if (featured === 'true') {
      sql += ' AND is_featured = 1';
    }
    sql += ' ORDER BY is_featured DESC, id ASC';

    const rooms = await all(sql, params);

    // Fetch images and payment methods for each room
    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        const images = await all(
          'SELECT image_url, display_order, is_primary FROM room_images WHERE room_id = ? ORDER BY display_order ASC',
          [room.id]
        );
        const paymentMethods = await all(
          'SELECT payment_method FROM room_payment_methods WHERE room_id = ? AND is_enabled = 1',
          [room.id]
        );

        return {
          ...room,
          is_featured: Boolean(room.is_featured),
          images: images.map((img) => img.image_url),
          image_details: images,
          payment_methods: paymentMethods.map((pm) => pm.payment_method)
        };
      })
    );

    res.json({ success: true, rooms: roomsWithDetails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single room details
router.get('/rooms/:id', async (req, res) => {
  try {
    const room = await get('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    const images = await all('SELECT image_url, display_order, is_primary FROM room_images WHERE room_id = ? ORDER BY display_order ASC', [room.id]);
    const paymentMethods = await all('SELECT payment_method FROM room_payment_methods WHERE room_id = ? AND is_enabled = 1', [room.id]);

    res.json({
      success: true,
      room: {
        ...room,
        is_featured: Boolean(room.is_featured),
        images: images.map((img) => img.image_url),
        image_details: images,
        payment_methods: paymentMethods.map((pm) => pm.payment_method)
      }
    });
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
// 3. PUBLIC INCLUSIONS & POLICIES
// ----------------------------------------------------

// Get all active inclusions for guests
router.get('/inclusions', async (req, res) => {
  try {
    const inclusions = await all('SELECT * FROM inclusions WHERE is_active = 1 ORDER BY price ASC');
    res.json({ success: true, inclusions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active policies for guest acknowledgement
router.get('/policies', async (req, res) => {
  try {
    const policies = await all('SELECT * FROM policies WHERE is_active = 1 ORDER BY display_order ASC');
    res.json({ success: true, policies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. GUEST BOOKING FLOW & PAYMENT (FSD v2.0)
// ----------------------------------------------------

// Create Booking with Inclusions, Policy Acknowledgement & Financial Breakdown Snapshot
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
      checkOut,
      selectedInclusions = [], // Array of { id, quantity }
      policyAcknowledged = false
    } = req.body;

    // Validate fields
    if (!roomId || !guestName || !guestCount || !contactNumber || !email || !vehicle || age === undefined || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'All guest and booking fields are required.' });
    }

    // Rules & Policy acknowledgement validation
    if (!policyAcknowledged) {
      return res.status(400).json({ error: 'You must acknowledge and accept the Rules and Policies before proceeding.' });
    }

    // BR-004: Guests below 18 years old cannot make a booking
    if (Number(age) < 18) {
      return res.status(400).json({
        error: 'Booking unavailable. Lead guest must be 18 years old or above.'
      });
    }

    // Validate date sequence
    if (new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date.' });
    }

    // BR-005: Double booking prevention
    const existingOverlapping = await get(
      `SELECT id FROM bookings 
       WHERE room_id = ? 
       AND booking_status IN ('CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN')
       AND check_in < ? AND check_out > ?`,
      [roomId, checkOut, checkIn]
    );

    if (existingOverlapping) {
      return res.status(409).json({
        error: 'Selected room is no longer available for these dates. Please select different dates or another room.'
      });
    }

    const room = await get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!room) {
      return res.status(404).json({ error: 'Selected room does not exist.' });
    }

    // Calculate nights & Room subtotal
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) || 1;
    const roomRate = Number(room.price_per_night);
    const roomSubtotal = roomRate * nights;

    // Process Inclusions & Snapshots
    let inclusionsSubtotal = 0;
    const resolvedInclusions = [];

    if (Array.isArray(selectedInclusions) && selectedInclusions.length > 0) {
      for (const item of selectedInclusions) {
        const incId = item.id || item.inclusionId;
        const qty = Number(item.quantity) || 1;
        const incDb = await get('SELECT * FROM inclusions WHERE id = ? AND is_active = 1', [incId]);
        if (incDb) {
          const itemSubtotal = incDb.price * qty;
          inclusionsSubtotal += itemSubtotal;
          resolvedInclusions.push({
            inclusion_id: incDb.id,
            name_snapshot: incDb.name,
            price_snapshot: incDb.price,
            quantity: qty,
            subtotal: itemSubtotal
          });
        }
      }
    }

    // Retrieve configured Security Deposit
    const secDepositSetting = await get('SELECT value FROM settings WHERE key = "security_deposit_amount"');
    const securityDepositAmount = secDepositSetting ? Number(secDepositSetting.value) : 1000;

    // Financial Breakdown
    const totalAmount = roomSubtotal + inclusionsSubtotal + securityDepositAmount;
    const downPayment = Math.round(totalAmount * 0.5); // 50% required down payment
    const remainingBalance = totalAmount - downPayment;

    const referenceNumber = generateBookingReference();

    // 1. Insert Booking
    const insertResult = await run(
      `INSERT INTO bookings (reference_number, room_id, guest_name, guest_count, contact_number, email, vehicle, age, check_in, check_out, booking_status, check_in_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_PAYMENT', 'NOT_CHECKED_IN')`,
      [referenceNumber, roomId, guestName, guestCount, contactNumber, email, vehicle, age, checkIn, checkOut]
    );

    const bookingId = insertResult.lastID;

    // 2. Insert Inclusions Snapshots
    for (const inc of resolvedInclusions) {
      await run(
        `INSERT INTO booking_inclusions (booking_id, inclusion_id, inclusion_name_snapshot, price_snapshot, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [bookingId, inc.inclusion_id, inc.name_snapshot, inc.price_snapshot, inc.quantity, inc.subtotal]
      );
    }

    // 3. Record Policy Acknowledgement
    const activePolicies = await all('SELECT id FROM policies WHERE is_active = 1');
    for (const pol of activePolicies) {
      await run(
        `INSERT INTO booking_policy_acknowledgements (booking_id, policy_id, policy_version) VALUES (?, ?, 'v2.0')`,
        [bookingId, pol.id]
      );
    }

    // 4. Insert Preserved Payment Breakdown Snapshot
    await run(
      `INSERT INTO booking_payment_breakdown (booking_id, room_rate_snapshot, nights, room_subtotal, inclusions_subtotal, security_deposit, other_charges, discount, total_amount, down_payment, remaining_balance)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
      [bookingId, roomRate, nights, roomSubtotal, inclusionsSubtotal, securityDepositAmount, totalAmount, downPayment, remainingBalance]
    );

    // 5. Initialize Security Deposit Record (Status = PENDING)
    await run(
      `INSERT INTO security_deposits (booking_id, amount, payment_status) VALUES (?, ?, 'PENDING')`,
      [bookingId, securityDepositAmount]
    );

    // Fetch enabled payment methods for this room
    const roomPaymentMethods = await all(
      'SELECT payment_method FROM room_payment_methods WHERE room_id = ? AND is_enabled = 1',
      [roomId]
    );

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
        contactNumber,
        vehicle,
        checkIn,
        checkOut,
        nights,
        roomRate,
        roomSubtotal,
        inclusions: resolvedInclusions,
        inclusionsSubtotal,
        securityDeposit: securityDepositAmount,
        totalAmount,
        downPayment,
        remainingBalance,
        bookingStatus: 'PENDING_PAYMENT',
        availablePaymentMethods: roomPaymentMethods.map((pm) => pm.payment_method)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process Payment & Confirm Booking with Payment Reference
router.post('/bookings/:id/pay', async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { paymentMethod, paymentReference, amount } = req.body;

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

    // Process / simulate payment gateway
    const paymentResult = await processPaymentGateway(paymentMethod, amount);
    const finalRef = paymentReference && paymentReference.trim() ? paymentReference.trim() : paymentResult.transactionReference;

    // Record payment entry
    await run(
      `INSERT INTO payments (booking_id, payment_method, payment_reference, amount, payment_status, paid_at)
       VALUES (?, ?, ?, ?, 'PAID', CURRENT_TIMESTAMP)`,
      [bookingId, paymentMethod, finalRef, amount]
    );

    // Update booking status to CONFIRMED
    await run(
      `UPDATE bookings SET booking_status = 'CONFIRMED' WHERE id = ?`,
      [bookingId]
    );

    // Fetch breakdown and inclusions
    const breakdown = await get('SELECT * FROM booking_payment_breakdown WHERE booking_id = ?', [bookingId]);
    const inclusions = await all('SELECT * FROM booking_inclusions WHERE booking_id = ?', [bookingId]);
    const securityDeposit = await get('SELECT * FROM security_deposits WHERE booking_id = ?', [bookingId]);

    const updatedBooking = {
      ...booking,
      booking_status: 'CONFIRMED',
      payment_method: paymentMethod,
      payment_reference: finalRef,
      amount_paid: amount,
      breakdown,
      inclusions,
      securityDeposit
    };

    // Trigger Email Notification Service
    await sendBookingConfirmationEmail({
      email: booking.email,
      guestName: booking.guest_name,
      referenceNumber: booking.reference_number,
      roomName: booking.room_name,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      totalAmount: breakdown?.total_amount || amount
    });

    // Trigger Google Sheets Sync Service
    await syncBookingToSheets(updatedBooking);

    // Record audit log
    await recordAuditLog('Guest Payment', 'GUEST', 'BOOKING_PAYMENT_CONFIRMED', booking.reference_number, `Confirmed payment of ₱${amount} via ${paymentMethod} (Ref: ${finalRef})`);

    res.json({
      success: true,
      booking: updatedBooking,
      payment: {
        method: paymentMethod,
        reference: finalRef,
        amount
      }
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
      `SELECT b.*, r.room_name, r.location, r.description, r.google_maps_url,
              p.payment_method, p.payment_reference, p.amount as paid_amount, p.paid_at
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN payments p ON b.id = p.booking_id
       WHERE LOWER(b.reference_number) = LOWER(?) AND LOWER(b.email) = LOWER(?)`,
      [referenceNumber.trim(), email.trim()]
    );

    if (!booking) {
      return res.status(404).json({ error: 'No matching booking found for the provided reference number and email.' });
    }

    const breakdown = await get('SELECT * FROM booking_payment_breakdown WHERE booking_id = ?', [booking.id]);
    const inclusions = await all('SELECT * FROM booking_inclusions WHERE booking_id = ?', [booking.id]);
    const securityDeposit = await get('SELECT * FROM security_deposits WHERE booking_id = ?', [booking.id]);
    const roomImages = await all('SELECT image_url FROM room_images WHERE room_id = ? ORDER BY display_order ASC', [booking.room_id]);

    res.json({
      success: true,
      booking: {
        ...booking,
        room_images: roomImages.map((img) => img.image_url),
        breakdown,
        inclusions,
        securityDeposit
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 5. GUEST EXPERIENCES (REVIEWS) SYSTEM
// ----------------------------------------------------

// Public Approved Guest Experiences
router.get('/guest-experiences', async (req, res) => {
  try {
    const experiences = await all(
      `SELECT * FROM guest_experiences WHERE status = 'APPROVED' ORDER BY created_at DESC`
    );
    res.json({ success: true, experiences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guest Submits a New Experience (Defaults to PENDING status)
router.post('/guest-experiences', async (req, res) => {
  try {
    const { guestName, rating, reviewText, roomName, stayDate, photoUrl, bookingId } = req.body;
    if (!guestName || !rating || !reviewText) {
      return res.status(400).json({ error: 'Guest name, rating, and review text are required.' });
    }

    const result = await run(
      `INSERT INTO guest_experiences (guest_name, rating, review_text, room_name, stay_date, photo_url, booking_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [guestName, rating, reviewText, roomName || null, stayDate || null, photoUrl || null, bookingId || null]
    );

    res.json({
      success: true,
      message: 'Thank you! Your Guest Experience has been submitted for owner approval.',
      experienceId: result.lastID
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 6. AUTHENTICATION (Staff, Customer Support, Owner)
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

    await recordAuditLog(user.name, user.role, 'USER_LOGIN', user.email, `User logged into administration portal`);

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
// 7. STAFF, CS & OWNER OPERATIONAL PORTAL
// ----------------------------------------------------

// Daily Arrival & Departure Log with Easy Date Selection (Asia/Manila time)
router.get('/admin/arrivals-departures', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = req.query.date || todayStr;

    // Arrivals on target date
    const arrivals = await all(
      `SELECT b.*, r.room_name, r.location, p.payment_method, p.amount, p.payment_status,
              sd.amount as deposit_amount, sd.payment_status as deposit_status, sd.paid_by as deposit_paid_by, sd.paid_at as deposit_paid_at,
              pb.total_amount, pb.down_payment, pb.remaining_balance
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN payments p ON b.id = p.booking_id
       LEFT JOIN security_deposits sd ON b.id = sd.booking_id
       LEFT JOIN booking_payment_breakdown pb ON b.id = pb.booking_id
       WHERE b.check_in = ?
       ORDER BY b.id ASC`,
      [targetDate]
    );

    // Departures on target date
    const departures = await all(
      `SELECT b.*, r.room_name, r.location, p.payment_method, p.amount, p.payment_status,
              sd.amount as deposit_amount, sd.payment_status as deposit_status, sd.refunded_by as deposit_refunded_by, sd.refunded_at as deposit_refunded_at,
              pb.total_amount, pb.down_payment, pb.remaining_balance
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN payments p ON b.id = p.booking_id
       LEFT JOIN security_deposits sd ON b.id = sd.booking_id
       LEFT JOIN booking_payment_breakdown pb ON b.id = pb.booking_id
       WHERE b.check_out = ?
       ORDER BY b.id ASC`,
      [targetDate]
    );

    // Currently In-House
    const inHouse = await all(
      `SELECT b.*, r.room_name, r.location, p.payment_method, p.amount,
              sd.amount as deposit_amount, sd.payment_status as deposit_status
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN payments p ON b.id = p.booking_id
       LEFT JOIN security_deposits sd ON b.id = sd.booking_id
       WHERE b.check_in_status = 'CHECKED_IN'
       ORDER BY b.check_out ASC`
    );

    res.json({
      success: true,
      date: targetDate,
      arrivals,
      departures,
      inHouse,
      summary: {
        totalArrivals: arrivals.length,
        totalDepartures: departures.length,
        totalInHouse: inHouse.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Check-in / Check-out status with audit log
router.patch('/admin/bookings/:id/checkin-status', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { checkInStatus } = req.body;

    if (!['NOT_CHECKED_IN', 'CHECKED_IN', 'CHECKED_OUT'].includes(checkInStatus)) {
      return res.status(400).json({ error: 'Invalid check-in status value.' });
    }

    const currentBooking = await get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!currentBooking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    let bookingStatusUpdate = '';
    if (checkInStatus === 'CHECKED_IN') bookingStatusUpdate = ", booking_status = 'CHECKED_IN'";
    if (checkInStatus === 'CHECKED_OUT') bookingStatusUpdate = ", booking_status = 'CHECKED_OUT'";

    await run(
      `UPDATE bookings SET check_in_status = ? ${bookingStatusUpdate} WHERE id = ?`,
      [checkInStatus, bookingId]
    );

    // Update physical room status
    if (checkInStatus === 'CHECKED_IN') {
      await run('UPDATE rooms SET status = "CHECKED_IN" WHERE id = ?', [currentBooking.room_id]);
    } else if (checkInStatus === 'CHECKED_OUT') {
      await run('UPDATE rooms SET status = "AVAILABLE" WHERE id = ?', [currentBooking.room_id]);
    }

    await recordAuditLog(
      req.user.name,
      req.user.role,
      `BOOKING_${checkInStatus}`,
      currentBooking.reference_number,
      `Check-in status modified from ${currentBooking.check_in_status} to ${checkInStatus}`,
      currentBooking.check_in_status,
      checkInStatus
    );

    const updated = await get(
      `SELECT b.*, r.room_name, r.location, p.payment_method, p.amount, p.payment_reference 
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id 
       LEFT JOIN payments p ON b.id = p.booking_id 
       WHERE b.id = ?`,
      [bookingId]
    );

    if (updated) {
      await syncBookingToSheets(updated);
    }

    res.json({ success: true, message: `Status successfully updated to ${checkInStatus}`, booking: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Security Deposit Confirmation & Refund Tracking
router.patch('/admin/bookings/:id/security-deposit', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { action, notes } = req.body; // action: 'CONFIRM_PAYMENT', 'MARK_REFUNDED', 'FORFEIT'

    const deposit = await get('SELECT * FROM security_deposits WHERE booking_id = ?', [bookingId]);
    const booking = await get('SELECT reference_number FROM bookings WHERE id = ?', [bookingId]);

    if (!deposit) {
      return res.status(404).json({ error: 'Security deposit record not found for this booking.' });
    }

    if (action === 'CONFIRM_PAYMENT') {
      await run(
        `UPDATE security_deposits SET payment_status = 'PAID', paid_at = CURRENT_TIMESTAMP, paid_by = ?, notes = ? WHERE booking_id = ?`,
        [req.user.name, notes || 'Paid at reception', bookingId]
      );
      await recordAuditLog(req.user.name, req.user.role, 'DEPOSIT_CONFIRMED', booking?.reference_number, `Confirmed security deposit of ₱${deposit.amount}`);
    } else if (action === 'MARK_REFUNDED') {
      await run(
        `UPDATE security_deposits SET payment_status = 'REFUNDED', refunded_at = CURRENT_TIMESTAMP, refunded_by = ?, notes = ? WHERE booking_id = ?`,
        [req.user.name, notes || 'Refunded upon room inspection', bookingId]
      );
      await recordAuditLog(req.user.name, req.user.role, 'DEPOSIT_REFUNDED', booking?.reference_number, `Refunded security deposit of ₱${deposit.amount}`);
    } else if (action === 'FORFEIT') {
      await run(
        `UPDATE security_deposits SET payment_status = 'FORFEITED', notes = ? WHERE booking_id = ?`,
        [notes || 'Forfeited due to damage/policy violation', bookingId]
      );
      await recordAuditLog(req.user.name, req.user.role, 'DEPOSIT_FORFEITED', booking?.reference_number, `Forfeited deposit: ${notes}`);
    } else {
      return res.status(400).json({ error: 'Invalid security deposit action.' });
    }

    const updatedDeposit = await get('SELECT * FROM security_deposits WHERE booking_id = ?', [bookingId]);
    res.json({ success: true, message: `Security deposit status updated.`, securityDeposit: updatedDeposit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// QR Scanner Lookup Endpoint
router.get('/admin/qr/lookup/:ref', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const rawRef = req.params.ref.trim();

    const booking = await get(
      `SELECT b.*, r.room_name, r.location, p.payment_method, p.payment_reference, p.amount, p.payment_status as payment_record_status
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN payments p ON b.id = p.booking_id
       WHERE LOWER(b.reference_number) = LOWER(?)`,
      [rawRef]
    );

    if (!booking) {
      return res.status(404).json({ error: `No booking found for QR Reference "${rawRef}"` });
    }

    const breakdown = await get('SELECT * FROM booking_payment_breakdown WHERE booking_id = ?', [booking.id]);
    const inclusions = await all('SELECT * FROM booking_inclusions WHERE booking_id = ?', [booking.id]);
    const securityDeposit = await get('SELECT * FROM security_deposits WHERE booking_id = ?', [booking.id]);

    // Determine eligible QR actions
    const canCheckIn = booking.check_in_status === 'NOT_CHECKED_IN';
    const canCheckOut = booking.check_in_status === 'CHECKED_IN';

    res.json({
      success: true,
      booking: {
        ...booking,
        breakdown,
        inclusions,
        securityDeposit,
        canCheckIn,
        canCheckOut
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Master Calendar Data Matrix
router.get('/admin/calendar', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const rooms = await all('SELECT id, room_name, location, price_per_night, status FROM rooms WHERE status != "DEACTIVATED" ORDER BY id ASC');
    const bookings = await all(
      `SELECT b.id, b.reference_number, b.room_id, b.guest_name, b.guest_count, b.vehicle, b.contact_number, b.email,
              b.check_in, b.check_out, b.booking_status, b.check_in_status,
              r.room_name, r.location,
              p.payment_method, p.payment_reference, p.amount, p.payment_status,
              sd.payment_status as deposit_status, sd.amount as deposit_amount,
              pb.total_amount, pb.down_payment, pb.remaining_balance
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN payments p ON b.id = p.booking_id
       LEFT JOIN security_deposits sd ON b.id = sd.booking_id
       LEFT JOIN booking_payment_breakdown pb ON b.id = pb.booking_id
       WHERE b.booking_status IN ('CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN', 'CHECKED_OUT')`
    );

    res.json({ success: true, rooms, bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin All Bookings List (with preserved snapshots and rich filters)
router.get('/admin/bookings', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const { status, location, roomId, search, startDate, endDate } = req.query;

    let sql = `
      SELECT b.*, r.room_name, r.location,
             p.payment_method, p.payment_reference, p.amount as payment_amount, p.payment_status,
             sd.amount as deposit_amount, sd.payment_status as deposit_status,
             pb.room_rate_snapshot, pb.nights, pb.room_subtotal, pb.inclusions_subtotal, pb.total_amount, pb.down_payment, pb.remaining_balance
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      LEFT JOIN payments p ON b.id = p.booking_id
      LEFT JOIN security_deposits sd ON b.id = sd.booking_id
      LEFT JOIN booking_payment_breakdown pb ON b.id = pb.booking_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      sql += ' AND (b.booking_status = ? OR b.check_in_status = ?)';
      params.push(status, status);
    }
    if (location && location !== 'All') {
      sql += ' AND r.location = ?';
      params.push(location);
    }
    if (roomId && roomId !== 'All') {
      sql += ' AND b.room_id = ?';
      params.push(roomId);
    }
    if (startDate) {
      sql += ' AND b.check_in >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND b.check_out <= ?';
      params.push(endDate);
    }
    if (search) {
      sql += ' AND (LOWER(b.guest_name) LIKE ? OR LOWER(b.reference_number) LIKE ? OR LOWER(b.email) LIKE ?)';
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY b.created_at DESC';

    const bookings = await all(sql, params);
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Room Status Page (Physical status vs Booking status)
router.get('/admin/room-status', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const rooms = await all('SELECT * FROM rooms WHERE status != "DEACTIVATED" ORDER BY id ASC');

    const statusList = await Promise.all(
      rooms.map(async (room) => {
        // Find current active booking for today
        const currentBooking = await get(
          `SELECT b.*, p.payment_status, sd.payment_status as deposit_status
           FROM bookings b
           LEFT JOIN payments p ON b.id = p.booking_id
           LEFT JOIN security_deposits sd ON b.id = sd.booking_id
           WHERE b.room_id = ? 
           AND b.booking_status IN ('CONFIRMED', 'CHECKED_IN')
           AND b.check_in <= ? AND b.check_out >= ?
           ORDER BY b.id DESC LIMIT 1`,
          [room.id, todayStr, todayStr]
        );

        return {
          room,
          currentBooking: currentBooking || null,
          operationalStatus: room.status
        };
      })
    );

    res.json({ success: true, roomStatuses: statusList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Room Operational Status (AVAILABLE, MAINTENANCE, UNAVAILABLE, etc.)
router.patch('/admin/rooms/:id/status', verifyToken, requireRoles(['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']), async (req, res) => {
  try {
    const roomId = req.params.id;
    const { status } = req.body;

    const room = await get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    await run('UPDATE rooms SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, roomId]);
    await recordAuditLog(req.user.name, req.user.role, 'ROOM_STATUS_CHANGE', room.room_name, `Status changed from ${room.status} to ${status}`, room.status, status);

    res.json({ success: true, message: `Room status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 8. OWNER EXCLUSIVE MANAGEMENT FEATURES
// ----------------------------------------------------

// Revenue Analytics
router.get('/owner/revenue', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const totalPaid = await get(`SELECT SUM(amount) as total FROM payments WHERE payment_status = 'PAID'`);
    const paidCount = await get(`SELECT COUNT(*) as count FROM bookings WHERE booking_status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')`);
    const pendingCount = await get(`SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'PENDING_PAYMENT'`);
    const depositsHeld = await get(`SELECT SUM(amount) as total FROM security_deposits WHERE payment_status = 'PAID'`);

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
      securityDepositsInCustody: depositsHeld.total || 0,
      revenueByLocation: byLocation,
      revenueByRoom: byRoom
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Room Management: Create Room
router.post('/owner/rooms', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const { roomName, location, description, pricePerNight, isFeatured = false, googleMapsUrl, images = [], paymentMethods = [] } = req.body;

    if (!roomName || !location || !pricePerNight) {
      return res.status(400).json({ error: 'Room name, location, and price per night are required.' });
    }

    const result = await run(
      `INSERT INTO rooms (room_name, location, description, price_per_night, is_featured, google_maps_url, status)
       VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE')`,
      [roomName, location, description || '', pricePerNight, isFeatured ? 1 : 0, googleMapsUrl || null]
    );

    const roomId = result.lastID;

    // Insert Images (minimum 2 images requirement)
    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        await run(
          `INSERT INTO room_images (room_id, image_url, display_order, is_primary) VALUES (?, ?, ?, ?)`,
          [roomId, images[i], i + 1, i === 0 ? 1 : 0]
        );
      }
    }

    // Insert Room Payment Methods
    const methods = paymentMethods.length > 0 ? paymentMethods : ['QR Ph', 'Dragonpay', 'GCash', 'Maya', 'Bank Transfer'];
    for (const pm of methods) {
      await run(`INSERT INTO room_payment_methods (room_id, payment_method, is_enabled) VALUES (?, ?, 1)`, [roomId, pm]);
    }

    await recordAuditLog(req.user.name, req.user.role, 'ROOM_CREATED', roomName, `Created suite in ${location} at ₱${pricePerNight}/night`);

    res.json({ success: true, message: 'Room created successfully', roomId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Room Management: Update Room Details, Pricing, Featured status, Photos
router.patch('/owner/rooms/:id', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const roomId = req.params.id;
    const { roomName, location, description, pricePerNight, isFeatured, status, googleMapsUrl, images, paymentMethods } = req.body;

    const current = await get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!current) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    let updates = [];
    let params = [];

    if (roomName !== undefined) { updates.push('room_name = ?'); params.push(roomName); }
    if (location !== undefined) { updates.push('location = ?'); params.push(location); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (pricePerNight !== undefined) { updates.push('price_per_night = ?'); params.push(pricePerNight); }
    if (isFeatured !== undefined) { updates.push('is_featured = ?'); params.push(isFeatured ? 1 : 0); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (googleMapsUrl !== undefined) { updates.push('google_maps_url = ?'); params.push(googleMapsUrl); }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length > 1) {
      params.push(roomId);
      await run(`UPDATE rooms SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Update images if provided
    if (Array.isArray(images)) {
      await run('DELETE FROM room_images WHERE room_id = ?', [roomId]);
      for (let i = 0; i < images.length; i++) {
        await run(
          `INSERT INTO room_images (room_id, image_url, display_order, is_primary) VALUES (?, ?, ?, ?)`,
          [roomId, images[i], i + 1, i === 0 ? 1 : 0]
        );
      }
    }

    // Update payment methods if provided
    if (Array.isArray(paymentMethods)) {
      await run('DELETE FROM room_payment_methods WHERE room_id = ?', [roomId]);
      for (const pm of paymentMethods) {
        await run(`INSERT INTO room_payment_methods (room_id, payment_method, is_enabled) VALUES (?, ?, 1)`, [roomId, pm]);
      }
    }

    await recordAuditLog(
      req.user.name,
      req.user.role,
      'ROOM_UPDATED',
      current.room_name,
      `Updated settings: Price ₱${pricePerNight || current.price_per_night}, Featured: ${isFeatured !== undefined ? isFeatured : current.is_featured}`
    );

    res.json({ success: true, message: 'Room updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Room Management: Deactivate / Remove Room
router.delete('/owner/rooms/:id', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const roomId = req.params.id;
    const room = await get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!room) return res.status(404).json({ error: 'Room not found.' });

    // Deactivate rather than delete to preserve historical booking data (Section 20)
    await run('UPDATE rooms SET status = "DEACTIVATED" WHERE id = ?', [roomId]);
    await recordAuditLog(req.user.name, req.user.role, 'ROOM_DEACTIVATED', room.room_name, 'Deactivated room to preserve historical records');

    res.json({ success: true, message: 'Room deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Inclusion Price Configuration
router.get('/owner/inclusions', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const inclusions = await all('SELECT * FROM inclusions ORDER BY id ASC');
    res.json({ success: true, inclusions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/owner/inclusions', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const { name, description, price, isActive = true } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: 'Name and price are required.' });

    const result = await run(
      `INSERT INTO inclusions (name, description, price, is_active) VALUES (?, ?, ?, ?)`,
      [name, description || '', price, isActive ? 1 : 0]
    );

    await recordAuditLog(req.user.name, req.user.role, 'INCLUSION_ADDED', name, `Added inclusion at ₱${price}`);
    res.json({ success: true, message: 'Inclusion created', inclusionId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/owner/inclusions/:id', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const { name, description, price, isActive } = req.body;
    const current = await get('SELECT * FROM inclusions WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Inclusion not found.' });

    await run(
      `UPDATE inclusions SET name = COALESCE(?, name), description = COALESCE(?, description), price = COALESCE(?, price), is_active = COALESCE(?, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, description, price, isActive !== undefined ? (isActive ? 1 : 0) : null, req.params.id]
    );

    await recordAuditLog(req.user.name, req.user.role, 'INCLUSION_UPDATED', current.name, `Updated price from ₱${current.price} to ₱${price || current.price}`, current.price, price);
    res.json({ success: true, message: 'Inclusion updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/owner/inclusions/:id', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    await run('UPDATE inclusions SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Inclusion deactivated.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Rules & Policies Configuration
router.get('/owner/policies', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const policies = await all('SELECT * FROM policies ORDER BY display_order ASC');
    res.json({ success: true, policies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/owner/policies', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const { title, content, displayOrder = 1, isActive = true } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required.' });

    const result = await run(
      `INSERT INTO policies (title, content, display_order, is_active) VALUES (?, ?, ?, ?)`,
      [title, content, displayOrder, isActive ? 1 : 0]
    );

    await recordAuditLog(req.user.name, req.user.role, 'POLICY_ADDED', title, 'Added new house rule/policy');
    res.json({ success: true, message: 'Policy created', policyId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/owner/policies/:id', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const { title, content, displayOrder, isActive } = req.body;
    await run(
      `UPDATE policies SET title = COALESCE(?, title), content = COALESCE(?, content), display_order = COALESCE(?, display_order), is_active = COALESCE(?, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title, content, displayOrder, isActive !== undefined ? (isActive ? 1 : 0) : null, req.params.id]
    );

    await recordAuditLog(req.user.name, req.user.role, 'POLICY_UPDATED', title || 'Policy', 'Updated policy details');
    res.json({ success: true, message: 'Policy updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/owner/policies/:id', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    await run('DELETE FROM policies WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Policy removed.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Guest Experience Approval Workflow (PENDING, APPROVED, DECLINED)
router.get('/owner/guest-experiences', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const pending = await all(`SELECT * FROM guest_experiences WHERE status = 'PENDING' ORDER BY created_at DESC`);
    const approved = await all(`SELECT * FROM guest_experiences WHERE status = 'APPROVED' ORDER BY created_at DESC`);
    const declined = await all(`SELECT * FROM guest_experiences WHERE status = 'DECLINED' ORDER BY created_at DESC`);

    res.json({
      success: true,
      pending,
      approved,
      declined,
      totalCount: pending.length + approved.length + declined.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/owner/guest-experiences/:id', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const expId = req.params.id;
    const { status } = req.body; // 'APPROVED', 'DECLINED', 'DELETE'

    if (status === 'DELETE') {
      await run('DELETE FROM guest_experiences WHERE id = ?', [expId]);
      await recordAuditLog(req.user.name, req.user.role, 'GUEST_EXP_DELETED', `ID ${expId}`, 'Deleted guest review submission');
      return res.json({ success: true, message: 'Guest experience submission deleted.' });
    }

    if (!['APPROVED', 'DECLINED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be APPROVED or DECLINED.' });
    }

    await run(
      `UPDATE guest_experiences SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, req.user.name, expId]
    );

    await recordAuditLog(req.user.name, req.user.role, `GUEST_EXP_${status}`, `ID ${expId}`, `Marked guest experience as ${status}`);

    res.json({ success: true, message: `Guest experience status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner System Settings Management
router.get('/owner/settings', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const settingsRows = await all('SELECT key, value FROM settings');
    const settingsMap = {};
    settingsRows.forEach((r) => { settingsMap[r.key] = r.value; });
    res.json({ success: true, settings: settingsMap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/owner/settings', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const entries = req.body; // Key-value object
    for (const [key, value] of Object.entries(entries)) {
      await run(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }

    await recordAuditLog(req.user.name, req.user.role, 'SETTINGS_UPDATED', 'System Settings', 'Updated system settings');
    res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner User Management
router.get('/owner/users', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const users = await all(`SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC`);
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

    await recordAuditLog(req.user.name, req.user.role, 'USER_CREATED', email, `Created ${role} account for ${name}`);

    res.json({
      success: true,
      message: `Successfully created ${role} account for ${name}`,
      userId: result.lastID
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

    await recordAuditLog(req.user.name, req.user.role, 'USER_UPDATED', user.email, `Updated user details`);

    res.json({ success: true, message: 'User account updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Owner Audit Logs
router.get('/owner/audit-logs', verifyToken, requireRoles(['OWNER']), async (req, res) => {
  try {
    const logs = await all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    res.json({ success: true, logs });
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
