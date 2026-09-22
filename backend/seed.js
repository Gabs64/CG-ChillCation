import bcrypt from 'bcryptjs';
import { run, get, all, initDb } from './db.js';

export const seedDatabase = async () => {
  await initDb();

  // Check if rooms exist
  const existingRooms = await all('SELECT * FROM rooms');
  if (existingRooms.length === 0) {
    console.log('Seeding 14 rooms (7 Antipolo, 7 Cainta)...');

    const roomImagesPool = [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c3d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80'
    ];

    for (let i = 1; i <= 14; i++) {
      const roomNum = i < 10 ? `0${i}` : `${i}`;
      const location = i <= 7 ? 'Antipolo' : 'Cainta';
      const name = `Room ${roomNum}`;
      const description = `Luxury 35sqm minimalist suite located in ${location}. Features king-sized bed, high-speed Wi-Fi, ambient smart lighting, air conditioning, and private bathroom with hot shower.`;
      const price = location === 'Antipolo' ? 2800 : 2500;

      const res = await run(
        `INSERT INTO rooms (room_name, location, description, price_per_night, status) VALUES (?, ?, ?, ?, ?)`,
        [name, location, description, price, 'AVAILABLE']
      );

      const roomId = res.lastID;

      // Add 3 images per room
      for (let imgIdx = 0; imgIdx < 3; imgIdx++) {
        const imageUrl = roomImagesPool[(i + imgIdx) % roomImagesPool.length];
        await run(
          `INSERT INTO room_images (room_id, image_url, display_order) VALUES (?, ?, ?)`,
          [roomId, imageUrl, imgIdx + 1]
        );
      }
    }
    console.log('Seeded 14 rooms with photo galleries.');
  }

  // Seed Users
  const existingUsers = await all('SELECT * FROM users');
  if (existingUsers.length === 0) {
    console.log('Seeding initial admin users...');
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

  // Seed Customer Reviews
  const existingReviews = await all('SELECT * FROM reviews');
  if (existingReviews.length === 0) {
    console.log('Seeding initial customer reviews...');
    const reviews = [
      { name: 'Maria Santos', rating: 5, review: 'Very clean and comfortable place. The booking process was fast and easy. Loved the quiet vibe in Antipolo!' },
      { name: 'Juan Dela Cruz', rating: 5, review: 'Super seamless checkout. The monochrome interior feels so high-end and cozy.' },
      { name: 'Clarissa Ramos', rating: 4, review: 'Great location in Cainta! QR payment confirmation was fast and customer support responded quickly on Messenger.' },
      { name: 'Mark Anthony', rating: 5, review: 'Top notch cleanliness and excellent ambient room lighting. Will definitely book again!' }
    ];

    for (const r of reviews) {
      await run(
        `INSERT INTO reviews (guest_name, rating, review, display_status) VALUES (?, ?, ?, ?)`,
        [r.name, r.rating, r.review, 'APPROVED']
      );
    }
    console.log('Customer reviews seeded.');
  }

  // Seed Sample Bookings for today and upcoming dates for dashboard demo
  const existingBookings = await all('SELECT * FROM bookings');
  if (existingBookings.length === 0) {
    console.log('Seeding sample bookings...');
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

    // Booking 1 - Room 01 (Antipolo)
    const b1 = await run(
      `INSERT INTO bookings (reference_number, room_id, guest_name, guest_count, contact_number, email, vehicle, age, check_in, check_out, booking_status, check_in_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['CGC-20260921-0001', 1, 'Juan Dela Cruz', 2, '09171234567', 'juan@example.com', 'Car', 24, todayStr, tomorrow, 'CONFIRMED', 'NOT_CHECKED_IN']
    );
    await run(
      `INSERT INTO payments (booking_id, payment_method, payment_reference, amount, payment_status, paid_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [b1.lastID, 'QR Ph', 'QRPH-981247', 2800, 'PAID']
    );

    // Booking 2 - Room 08 (Cainta)
    const b2 = await run(
      `INSERT INTO bookings (reference_number, room_id, guest_name, guest_count, contact_number, email, vehicle, age, check_in, check_out, booking_status, check_in_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['CGC-20260921-0002', 8, 'Maria Santos', 1, '09189876543', 'maria@example.com', 'Motorcycle', 29, todayStr, dayAfter, 'CONFIRMED', 'CHECKED_IN']
    );
    await run(
      `INSERT INTO payments (booking_id, payment_method, payment_reference, amount, payment_status, paid_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [b2.lastID, 'Dragonpay', 'DP-443109', 5000, 'PAID']
    );

    console.log('Sample bookings & payments seeded.');
  }

  console.log('Database seeding process completed.');
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch(console.error);
}
