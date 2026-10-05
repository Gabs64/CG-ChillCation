import bcrypt from 'bcryptjs';
import { run, get, all, initDb } from './db.js';

export const seedDatabase = async () => {
  await initDb();

  // 1. Seed Settings
  const existingSettings = await all('SELECT * FROM settings');
  if (existingSettings.length === 0) {
    console.log('Seeding default settings...');
    const defaultSettings = [
      { key: 'security_deposit_amount', value: '1000' },
      { key: 'security_deposit_enabled', value: 'true' },
      { key: 'meta_messenger_url', value: 'https://m.me/cgchillcation' },
      { key: 'secret_admin_path', value: 'portal-access-8f3k29x7-admin-secure' },
      { key: 'google_maps_antipolo', value: 'https://maps.google.com/?q=Antipolo+Rizal+CG+Chillcation' },
      { key: 'google_maps_cainta', value: 'https://maps.google.com/?q=Cainta+Rizal+CG+Chillcation' }
    ];
    for (const s of defaultSettings) {
      await run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [s.key, s.value]);
    }
  }

  // 2. Seed Inclusions
  const existingInclusions = await all('SELECT * FROM inclusions');
  if (existingInclusions.length === 0) {
    console.log('Seeding standard inclusions...');
    const inclusionsList = [
      { name: 'Car Parking Space', description: 'Designated secure covered parking space for 1 standard automobile', price: 200, is_active: 1 },
      { name: 'Motorcycle Parking Space', description: 'Designated secure motorcycle parking bay', price: 100, is_active: 1 },
      { name: 'Extra Guest (Mattress & Linen)', description: 'Additional guest accommodation setup with complete premium bedding kit', price: 300, is_active: 1 },
      { name: 'Late Check-out Pass (Until 2:00 PM)', description: 'Extend your stay by 2 hours subject to availability', price: 500, is_active: 1 },
      { name: 'Artisan Breakfast Basket', description: 'Curated breakfast spread with fresh brew coffee and pastries for 2', price: 450, is_active: 1 }
    ];
    for (const inc of inclusionsList) {
      await run(
        `INSERT INTO inclusions (name, description, price, is_active) VALUES (?, ?, ?, ?)`,
        [inc.name, inc.description, inc.price, inc.is_active]
      );
    }
  }

  // 3. Seed Policies
  const existingPolicies = await all('SELECT * FROM policies');
  if (existingPolicies.length === 0) {
    console.log('Seeding rules and policies...');
    const policiesList = [
      {
        title: 'Check-in & Check-out Schedule',
        content: 'Standard check-in begins promptly at 2:00 PM (Asia/Manila time). Check-out is strictly by 12:00 PM noon to allow comprehensive sanitization.',
        display_order: 1,
        is_active: 1
      },
      {
        title: 'Refundable Security Deposit',
        content: 'A refundable security deposit of ₱1,000 is required upon check-in. The full amount is refunded upon departure following room inspection.',
        display_order: 2,
        is_active: 1
      },
      {
        title: 'Age Requirement & Guest Verification',
        content: 'The primary guest registering the booking must be at least 18 years old and present a valid government-issued ID upon arrival.',
        display_order: 3,
        is_active: 1
      },
      {
        title: 'Quiet Hours & Suite Etiquette',
        content: 'To ensure a serene experience for all guests, quiet hours are observed from 10:00 PM to 8:00 AM. Smoking and vaping are strictly prohibited inside the suites.',
        display_order: 4,
        is_active: 1
      },
      {
        title: 'Cancellation & Rescheduling Policy',
        content: 'Rescheduling requests must be submitted at least 48 hours before scheduled check-in date. Down payments are non-refundable for same-day cancellations.',
        display_order: 5,
        is_active: 1
      }
    ];
    for (const pol of policiesList) {
      await run(
        `INSERT INTO policies (title, content, display_order, is_active) VALUES (?, ?, ?, ?)`,
        [pol.title, pol.content, pol.display_order, pol.is_active]
      );
    }
  }

  // 4. Seed Rooms & Multiple Photos
  const existingRooms = await all('SELECT * FROM rooms');
  if (existingRooms.length === 0) {
    console.log('Seeding 14 rooms (7 Antipolo, 7 Cainta) with multiple photos & payment methods...');

    const roomImagesPool = [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c3d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80'
    ];

    const standardPaymentMethods = ['QR Ph', 'Dragonpay', 'GCash', 'Maya', 'Bank Transfer'];

    for (let i = 1; i <= 14; i++) {
      const roomNum = i < 10 ? `0${i}` : `${i}`;
      const location = i <= 7 ? 'Antipolo' : 'Cainta';
      const name = `Room ${roomNum}`;
      const description = `Luxury 35sqm minimalist suite located in ${location}. Features king-sized bed, high-speed Wi-Fi, ambient smart lighting, air conditioning, and private bathroom with hot shower.`;
      const price = location === 'Antipolo' ? 2800 : 2500;
      const isFeatured = (i === 1 || i === 4 || i === 8 || i === 12) ? 1 : 0;
      const mapsUrl = location === 'Antipolo' 
        ? 'https://maps.google.com/?q=Antipolo+Rizal+CG+Chillcation'
        : 'https://maps.google.com/?q=Cainta+Rizal+CG+Chillcation';

      const res = await run(
        `INSERT INTO rooms (room_name, location, description, price_per_night, status, is_featured, google_maps_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, location, description, price, 'AVAILABLE', isFeatured, mapsUrl]
      );

      const roomId = res.lastID;

      // Add 3-4 images per room (exceeds minimum of 2 required by Section 2.2)
      for (let imgIdx = 0; imgIdx < 4; imgIdx++) {
        const imageUrl = roomImagesPool[(i + imgIdx) % roomImagesPool.length];
        const isPrimary = imgIdx === 0 ? 1 : 0;
        await run(
          `INSERT INTO room_images (room_id, image_url, display_order, is_primary) VALUES (?, ?, ?, ?)`,
          [roomId, imageUrl, imgIdx + 1, isPrimary]
        );
      }

      // Configure room payment methods
      for (const pm of standardPaymentMethods) {
        await run(
          `INSERT INTO room_payment_methods (room_id, payment_method, is_enabled) VALUES (?, ?, 1)`,
          [roomId, pm]
        );
      }
    }
    console.log('Seeded 14 rooms with multi-photo galleries, featured tags, and payment configs.');
  }

  // 5. Seed Users
  const existingUsers = await all('SELECT * FROM users');
  if (existingUsers.length === 0) {
    console.log('Seeding admin users...');
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // Owner
    await run(
      `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
      ['CG Owner', 'owner@cgchillcation.com', defaultPasswordHash, 'OWNER', 'ACTIVE']
    );

    // Staff
    await run(
      `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
      ['Antipolo Staff', 'staff@cgchillcation.com', defaultPasswordHash, 'STAFF', 'ACTIVE']
    );

    // Customer Support
    await run(
      `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
      ['Support Team', 'support@cgchillcation.com', defaultPasswordHash, 'CUSTOMER_SUPPORT', 'ACTIVE']
    );

    console.log('Admin users seeded (Owner, Staff, Customer Support).');
  }

  // 6. Seed Guest Experiences
  const existingExp = await all('SELECT * FROM guest_experiences');
  if (existingExp.length === 0) {
    console.log('Seeding guest experiences (Approved & Pending)...');
    const experiences = [
      { name: 'Maria Santos', rating: 5, room: 'Room 01', date: '2026-09-28', review: 'Very clean and comfortable place. The booking process was fast and easy. Loved the quiet vibe in Antipolo!', status: 'APPROVED' },
      { name: 'Juan Dela Cruz', rating: 5, room: 'Room 08', date: '2026-10-01', review: 'Super seamless check-in via QR code! The monochrome interior feels so high-end and cozy. Highly recommended.', status: 'APPROVED' },
      { name: 'Clarissa Ramos', rating: 5, room: 'Room 04', date: '2026-10-02', review: 'Great location in Antipolo! QR payment confirmation was instantaneous and customer support answered our queries on Messenger immediately.', status: 'APPROVED' },
      { name: 'Mark Anthony Gomez', rating: 4, room: 'Room 12', date: '2026-10-03', review: 'Top notch cleanliness, crisp linens, and excellent ambient lighting. Will definitely book again for my next staycation.', status: 'APPROVED' },
      { name: 'Eleanor Vance', rating: 5, room: 'Room 02', date: '2026-10-04', review: 'Peaceful aesthetic retreat. The parking inclusion made arriving hassle-free!', status: 'PENDING' }
    ];

    for (const exp of experiences) {
      await run(
        `INSERT INTO guest_experiences (guest_name, rating, review_text, room_name, stay_date, status, reviewed_by, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [exp.name, exp.rating, exp.review, exp.room, exp.date, exp.status, exp.status === 'APPROVED' ? 'CG Owner' : null, exp.status === 'APPROVED' ? new Date().toISOString() : null]
      );
    }
  }

  // 7. Seed Sample Bookings with Preserved Price Snapshots & Security Deposits
  const existingBookings = await all('SELECT * FROM bookings');
  if (existingBookings.length === 0) {
    console.log('Seeding sample bookings with v2.0 financial snapshots & security deposit records...');
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Booking 1 - Today Arrival (Room 01 Antipolo)
    const b1 = await run(
      `INSERT INTO bookings (reference_number, room_id, guest_name, guest_count, contact_number, email, vehicle, age, check_in, check_out, booking_status, check_in_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['CGC-20261006-1001', 1, 'Juan Dela Cruz', 2, '09171234567', 'juan@example.com', 'Car (ABC 1234)', 26, todayStr, tomorrow, 'CONFIRMED', 'NOT_CHECKED_IN']
    );
    const b1Id = b1.lastID;

    // Inclusions for B1
    await run(
      `INSERT INTO booking_inclusions (booking_id, inclusion_id, inclusion_name_snapshot, price_snapshot, quantity, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [b1Id, 1, 'Car Parking Space', 200, 1, 200]
    );

    // Breakdown for B1 (Room: 2800 * 1 = 2800, Inclusions: 200, Deposit: 1000, Total: 4000, Downpayment: 2000, Balance: 2000)
    await run(
      `INSERT INTO booking_payment_breakdown (booking_id, room_rate_snapshot, nights, room_subtotal, inclusions_subtotal, security_deposit, other_charges, discount, total_amount, down_payment, remaining_balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b1Id, 2800, 1, 2800, 200, 1000, 0, 0, 4000, 2000, 2000]
    );

    // Payment for B1
    await run(
      `INSERT INTO payments (booking_id, payment_method, payment_reference, amount, payment_status, paid_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [b1Id, 'QR Ph', 'QRPH-99281726', 2000, 'PAID']
    );

    // Security Deposit for B1 (Pending arrival)
    await run(
      `INSERT INTO security_deposits (booking_id, amount, payment_status)
       VALUES (?, ?, ?)`,
      [b1Id, 1000, 'PENDING']
    );

    // Booking 2 - Currently Checked In (Room 08 Cainta)
    const b2 = await run(
      `INSERT INTO bookings (reference_number, room_id, guest_name, guest_count, contact_number, email, vehicle, age, check_in, check_out, booking_status, check_in_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['CGC-20261006-1002', 8, 'Maria Santos', 1, '09189876543', 'maria@example.com', 'Motorcycle (XYZ 789)', 29, yesterday, todayStr, 'CHECKED_IN', 'CHECKED_IN']
    );
    const b2Id = b2.lastID;

    await run(
      `INSERT INTO booking_inclusions (booking_id, inclusion_id, inclusion_name_snapshot, price_snapshot, quantity, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [b2Id, 2, 'Motorcycle Parking Space', 100, 1, 100]
    );

    await run(
      `INSERT INTO booking_payment_breakdown (booking_id, room_rate_snapshot, nights, room_subtotal, inclusions_subtotal, security_deposit, other_charges, discount, total_amount, down_payment, remaining_balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b2Id, 2500, 1, 2500, 100, 1000, 0, 0, 3600, 3600, 0]
    );

    await run(
      `INSERT INTO payments (booking_id, payment_method, payment_reference, amount, payment_status, paid_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [b2Id, 'Dragonpay', 'DP-88273619', 3600, 'PAID']
    );

    // Security deposit for B2 is already paid upon check-in
    await run(
      `INSERT INTO security_deposits (booking_id, amount, payment_status, paid_at, paid_by)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)`,
      [b2Id, 1000, 'PAID', 'Antipolo Staff']
    );

    // Booking 3 - Upcoming stay (Room 04 Antipolo)
    const b3 = await run(
      `INSERT INTO bookings (reference_number, room_id, guest_name, guest_count, contact_number, email, vehicle, age, check_in, check_out, booking_status, check_in_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['CGC-20261006-1003', 4, 'Carlos Mendoza', 3, '09191112233', 'carlos@example.com', 'Car (NCR 456)', 32, tomorrow, dayAfter, 'CONFIRMED', 'NOT_CHECKED_IN']
    );
    const b3Id = b3.lastID;

    await run(
      `INSERT INTO booking_inclusions (booking_id, inclusion_id, inclusion_name_snapshot, price_snapshot, quantity, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [b3Id, 3, 'Extra Guest (Mattress & Linen)', 300, 1, 300]
    );

    await run(
      `INSERT INTO booking_payment_breakdown (booking_id, room_rate_snapshot, nights, room_subtotal, inclusions_subtotal, security_deposit, other_charges, discount, total_amount, down_payment, remaining_balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [b3Id, 2800, 1, 2800, 300, 1000, 0, 0, 4100, 2050, 2050]
    );

    await run(
      `INSERT INTO payments (booking_id, payment_method, payment_reference, amount, payment_status, paid_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [b3Id, 'GCash', 'GCASH-77162544', 2050, 'PAID']
    );

    await run(
      `INSERT INTO security_deposits (booking_id, amount, payment_status)
       VALUES (?, ?, ?)`,
      [b3Id, 1000, 'PENDING']
    );

    console.log('Sample v2.0 bookings seeded.');
  }

  // 8. Seed Initial Audit Logs
  const existingAudit = await all('SELECT * FROM audit_logs');
  if (existingAudit.length === 0) {
    console.log('Seeding initial audit logs...');
    await run(
      `INSERT INTO audit_logs (user_name, user_role, action, target, details) VALUES (?, ?, ?, ?, ?)`,
      ['System', 'SYSTEM', 'SYSTEM_INITIALIZATION', 'v2.0 Database', 'Initialized FSD v2.0 schema, rooms, inclusions, and policies.']
    );
  }

  console.log('Database v2.0 seeding process fully completed.');
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch(console.error);
}
