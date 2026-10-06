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

  // 4. Seed Rooms (Only if explicitly requested with SEED_DEMO_ROOMS=true)
  if (process.env.SEED_DEMO_ROOMS === 'true') {
    const existingRooms = await all('SELECT * FROM rooms');
    if (existingRooms.length === 0) {
      console.log('Seeding demo rooms (SEED_DEMO_ROOMS=true)...');

      const roomImagesPool = [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1590490360182-c3d57733427?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80'
      ];

      const standardPaymentMethods = ['QR Ph', 'Dragonpay', 'GCash', 'Maya', 'Bank Transfer'];

      for (let i = 1; i <= 4; i++) {
        const roomNum = `0${i}`;
        const location = i <= 2 ? 'Antipolo' : 'Cainta';
        const name = `Demo Suite ${roomNum}`;
        const description = `Luxury minimalist suite located in ${location}.`;
        const price = location === 'Antipolo' ? 2800 : 2500;

        const res = await run(
          `INSERT INTO rooms (room_name, location, description, price_per_night, status, is_featured, google_maps_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [name, location, description, price, 'AVAILABLE', 1, 'https://maps.google.com']
        );

        const roomId = res.lastID;
        for (let imgIdx = 0; imgIdx < 2; imgIdx++) {
          await run(
            `INSERT INTO room_images (room_id, image_url, display_order, is_primary) VALUES (?, ?, ?, ?)`,
            [roomId, roomImagesPool[imgIdx], imgIdx + 1, imgIdx === 0 ? 1 : 0]
          );
        }

        for (const pm of standardPaymentMethods) {
          await run(
            `INSERT INTO room_payment_methods (room_id, payment_method, is_enabled) VALUES (?, ?, 1)`,
            [roomId, pm]
          );
        }
      }
      console.log('Demo rooms seeded.');
    }
  } else if (process.env.CLEAR_EXISTING_ROOMS === 'true') {
    // Explicit reset: Delete any old demo rooms
    await run('DELETE FROM rooms');
    await run('DELETE FROM room_images');
    await run('DELETE FROM room_payment_methods');
    await run('DELETE FROM bookings');
    await run('DELETE FROM booking_inclusions');
    await run('DELETE FROM booking_payment_breakdown');
    await run('DELETE FROM booking_policy_acknowledgements');
    await run('DELETE FROM payments');
    await run('DELETE FROM security_deposits');
    console.log('Clean slate: All existing rooms & demo bookings cleared.');
  }

  // 5. Seed Users (Owner, Staff, Customer Support)
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

    console.log('Admin users seeded (Owner: owner@cgchillcation.com, Staff: staff@cgchillcation.com, Support: support@cgchillcation.com).');
  }

  // 6. Seed Initial Audit Logs
  const existingAudit = await all('SELECT * FROM audit_logs');
  if (existingAudit.length === 0) {
    console.log('Seeding initial audit logs...');
    await run(
      `INSERT INTO audit_logs (user_name, user_role, action, target, details) VALUES (?, ?, ?, ?, ?)`,
      ['System', 'SYSTEM', 'SYSTEM_INITIALIZATION', 'Railway Live Database', 'Initialized system settings, inclusions, policies, and users. Ready for real suites.']
    );
  }

  console.log('Database initialization and seeding process fully completed.');
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch(console.error);
}
