// Client-side Mock Data Store & API Interceptor for CG Chillcation Demo

const DB_KEY = 'cg_chillcation_mock_db_v1';

const getInitialRooms = () => {
  const roomImagesPool = [
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1590490360182-c3d57733427?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80'
  ];

  const rooms = [];
  for (let i = 1; i <= 14; i++) {
    const roomNum = i < 10 ? `0${i}` : `${i}`;
    const location = i <= 7 ? 'Antipolo' : 'Cainta';
    const name = `Room ${roomNum}`;
    const description = `Luxury 35sqm minimalist suite located in ${location}. Features king-sized bed, high-speed Wi-Fi, ambient smart lighting, air conditioning, and private bathroom with hot shower.`;
    const price = location === 'Antipolo' ? 2800 : 2500;
    
    const images = [
      roomImagesPool[(i - 1) % roomImagesPool.length],
      roomImagesPool[(i) % roomImagesPool.length],
      roomImagesPool[(i + 1) % roomImagesPool.length]
    ];

    rooms.push({
      id: i,
      room_name: name,
      location,
      description,
      price_per_night: price,
      status: 'AVAILABLE',
      images
    });
  }
  return rooms;
};

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialDb = () => {
  const today = new Date();
  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(new Date(today.getTime() + 86400000));
  const dayAfterStr = formatDate(new Date(today.getTime() + 86400000 * 2));
  const threeDaysAfterStr = formatDate(new Date(today.getTime() + 86400000 * 3));
  const yesterdayStr = formatDate(new Date(today.getTime() - 86400000));
  const twoDaysAgoStr = formatDate(new Date(today.getTime() - 86400000 * 2));

  return {
    rooms: getInitialRooms(),
    users: [
      {
        id: 1,
        name: 'CG Owner',
        email: 'owner@cgchillcation.com',
        password: 'password123',
        role: 'OWNER',
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Antipolo Staff',
        email: 'staff@cgchillcation.com',
        password: 'password123',
        role: 'STAFF',
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Support Team',
        email: 'support@cgchillcation.com',
        password: 'password123',
        role: 'CUSTOMER_SUPPORT',
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      }
    ],
    reviews: [
      {
        id: 1,
        guest_name: 'Maria Santos',
        rating: 5,
        review: 'Very clean and comfortable place. The booking process was fast and easy. Loved the quiet vibe in Antipolo!',
        display_status: 'APPROVED',
        created_at: new Date(today.getTime() - 86400000 * 3).toISOString()
      },
      {
        id: 2,
        guest_name: 'Juan Dela Cruz',
        rating: 5,
        review: 'Super seamless checkout. The monochrome interior feels so high-end and cozy.',
        display_status: 'APPROVED',
        created_at: new Date(today.getTime() - 86400000 * 2).toISOString()
      },
      {
        id: 3,
        guest_name: 'Clarissa Ramos',
        rating: 4,
        review: 'Great location in Cainta! QR payment confirmation was fast and customer support responded quickly on Messenger.',
        display_status: 'APPROVED',
        created_at: new Date(today.getTime() - 86400000).toISOString()
      },
      {
        id: 4,
        guest_name: 'Mark Anthony',
        rating: 5,
        review: 'Top notch cleanliness and excellent ambient room lighting. Will definitely book again!',
        display_status: 'APPROVED',
        created_at: new Date().toISOString()
      }
    ],
    bookings: [
      {
        id: 1,
        reference_number: 'CGC-20260921-0001',
        room_id: 1,
        room_name: 'Room 01',
        location: 'Antipolo',
        description: 'Luxury 35sqm minimalist suite located in Antipolo.',
        guest_name: 'Juan Dela Cruz',
        guest_count: 2,
        contact_number: '09171234567',
        email: 'juan@example.com',
        vehicle: 'Car',
        age: 24,
        check_in: todayStr,
        check_out: tomorrowStr,
        booking_status: 'CONFIRMED',
        check_in_status: 'NOT_CHECKED_IN',
        payment_method: 'QR Ph',
        payment_reference: 'QRPH-981247',
        amount: 2800,
        payment_status: 'PAID',
        created_at: new Date(today.getTime() - 86400000).toISOString()
      },
      {
        id: 2,
        reference_number: 'CGC-20260921-0002',
        room_id: 8,
        room_name: 'Room 08',
        location: 'Cainta',
        description: 'Luxury 35sqm minimalist suite located in Cainta.',
        guest_name: 'Maria Santos',
        guest_count: 1,
        contact_number: '09189876543',
        email: 'maria@example.com',
        vehicle: 'Motorcycle',
        age: 29,
        check_in: todayStr,
        check_out: dayAfterStr,
        booking_status: 'CHECKED_IN',
        check_in_status: 'CHECKED_IN',
        payment_method: 'Dragonpay',
        payment_reference: 'DP-443109',
        amount: 5000,
        payment_status: 'PAID',
        created_at: new Date(today.getTime() - 86400000 * 2).toISOString()
      },
      {
        id: 3,
        reference_number: 'CGC-20260921-0003',
        room_id: 3,
        room_name: 'Room 03',
        location: 'Antipolo',
        description: 'Luxury 35sqm minimalist suite located in Antipolo.',
        guest_name: 'Mark Anthony',
        guest_count: 2,
        contact_number: '09191122334',
        email: 'mark@example.com',
        vehicle: 'Car',
        age: 31,
        check_in: twoDaysAgoStr,
        check_out: yesterdayStr,
        booking_status: 'CHECKED_OUT',
        check_in_status: 'CHECKED_OUT',
        payment_method: 'GCash',
        payment_reference: 'GC-776210',
        amount: 2800,
        payment_status: 'PAID',
        created_at: new Date(today.getTime() - 86400000 * 4).toISOString()
      },
      {
        id: 4,
        reference_number: 'CGC-20260921-0004',
        room_id: 10,
        room_name: 'Room 10',
        location: 'Cainta',
        description: 'Luxury 35sqm minimalist suite located in Cainta.',
        guest_name: 'Clarissa Ramos',
        guest_count: 2,
        contact_number: '09205566778',
        email: 'clarissa@example.com',
        vehicle: 'None',
        age: 26,
        check_in: tomorrowStr,
        check_out: threeDaysAfterStr,
        booking_status: 'CONFIRMED',
        check_in_status: 'NOT_CHECKED_IN',
        payment_method: 'Maya',
        payment_reference: 'MY-339811',
        amount: 5000,
        payment_status: 'PAID',
        created_at: new Date().toISOString()
      }
    ],
    payments: [
      { id: 1, booking_id: 1, payment_method: 'QR Ph', payment_reference: 'QRPH-981247', amount: 2800, payment_status: 'PAID', paid_at: new Date().toISOString() },
      { id: 2, booking_id: 2, payment_method: 'Dragonpay', payment_reference: 'DP-443109', amount: 5000, payment_status: 'PAID', paid_at: new Date().toISOString() },
      { id: 3, booking_id: 3, payment_method: 'GCash', payment_reference: 'GC-776210', amount: 2800, payment_status: 'PAID', paid_at: new Date().toISOString() },
      { id: 4, booking_id: 4, payment_method: 'Maya', payment_reference: 'MY-339811', amount: 5000, payment_status: 'PAID', paid_at: new Date().toISOString() }
    ],
    sheetsLog: [
      { id: 1, booking_reference: 'CGC-20260921-0001', guest_name: 'Juan Dela Cruz', status: 'SYNCED', synced_at: new Date().toISOString() },
      { id: 2, booking_reference: 'CGC-20260921-0002', guest_name: 'Maria Santos', status: 'SYNCED', synced_at: new Date().toISOString() },
      { id: 3, booking_reference: 'CGC-20260921-0004', guest_name: 'Clarissa Ramos', status: 'SYNCED', synced_at: new Date().toISOString() }
    ]
  };
};

const getDb = () => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initial = getInitialDb();
      localStorage.setItem(DB_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    const initial = getInitialDb();
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
};

const saveDb = (db) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// Response helper
const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const initMockApi = () => {
  // Ensure DB is initialized
  getDb();

  const originalFetch = window.fetch;

  window.fetch = async (input, init = {}) => {
    const urlString = typeof input === 'string' ? input : input.url;

    // Only intercept /api/ endpoints
    if (!urlString.includes('/api/')) {
      return originalFetch(input, init);
    }

    const parsedUrl = new URL(urlString, window.location.origin);
    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.searchParams;
    const method = (init.method || 'GET').toUpperCase();
    const body = init.body ? (typeof init.body === 'string' ? JSON.parse(init.body) : init.body) : {};

    // Simulate minor network latency for realistic feel (80ms - 200ms)
    await new Promise((r) => setTimeout(r, 120));

    const db = getDb();

    // 1. GET /api/rooms
    if (pathname === '/api/rooms' && method === 'GET') {
      const location = searchParams.get('location');
      let rooms = db.rooms;
      if (location && location !== 'All') {
        rooms = rooms.filter((r) => r.location.toLowerCase() === location.toLowerCase());
      }
      return jsonResponse({ success: true, rooms });
    }

    // 2. POST /api/bookings/check-availability
    if (pathname === '/api/bookings/check-availability' && method === 'POST') {
      const { roomId, checkIn, checkOut } = body;
      if (!roomId || !checkIn || !checkOut) {
        return jsonResponse({ error: 'Room ID, check-in, and check-out dates are required.' }, 400);
      }
      if (new Date(checkOut) <= new Date(checkIn)) {
        return jsonResponse({ error: 'Check-out date must be after check-in date.' }, 400);
      }

      const hasOverlap = db.bookings.some((b) => {
        if (b.room_id !== Number(roomId)) return false;
        if (!['CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN'].includes(b.booking_status)) return false;
        return b.check_in < checkOut && b.check_out > checkIn;
      });

      return jsonResponse({ success: true, isAvailable: !hasOverlap, roomId, checkIn, checkOut });
    }

    // 3. POST /api/bookings
    if (pathname === '/api/bookings' && method === 'POST') {
      const { roomId, guestName, guestCount, contactNumber, email, vehicle, age, checkIn, checkOut } = body;
      if (!roomId || !guestName || !guestCount || !contactNumber || !email || !vehicle || age === undefined || !checkIn || !checkOut) {
        return jsonResponse({ error: 'All fields are required.' }, 400);
      }

      if (Number(age) < 18) {
        return jsonResponse({ error: 'Booking unavailable. Guests must be 18 years old or above.' }, 400);
      }

      if (new Date(checkOut) <= new Date(checkIn)) {
        return jsonResponse({ error: 'Check-out date must be after check-in date.' }, 400);
      }

      const hasOverlap = db.bookings.some((b) => {
        if (b.room_id !== Number(roomId)) return false;
        if (!['CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN'].includes(b.booking_status)) return false;
        return b.check_in < checkOut && b.check_out > checkIn;
      });

      if (hasOverlap) {
        return jsonResponse({ error: 'Selected room is no longer available for these dates.' }, 409);
      }

      const room = db.rooms.find((r) => r.id === Number(roomId));
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceNumber = `CGC-${dateStr}-${randomSuffix}`;
      const newBookingId = db.bookings.length > 0 ? Math.max(...db.bookings.map((b) => b.id)) + 1 : 1;

      const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
      const totalAmount = (room?.price_per_night || 2500) * nights;

      const newBooking = {
        id: newBookingId,
        reference_number: referenceNumber,
        room_id: Number(roomId),
        room_name: room ? room.room_name : `Room ${roomId}`,
        location: room ? room.location : 'Antipolo',
        description: room ? room.description : '',
        guest_name: guestName,
        guest_count: Number(guestCount),
        contact_number: contactNumber,
        email,
        vehicle,
        age: Number(age),
        check_in: checkIn,
        check_out: checkOut,
        booking_status: 'PENDING_PAYMENT',
        check_in_status: 'NOT_CHECKED_IN',
        amount: totalAmount,
        payment_status: 'PENDING',
        created_at: new Date().toISOString()
      };

      db.bookings.push(newBooking);
      saveDb(db);

      return jsonResponse({
        success: true,
        booking: {
          id: newBookingId,
          referenceNumber,
          roomId: Number(roomId),
          roomName: newBooking.room_name,
          location: newBooking.location,
          guestName,
          email,
          checkIn,
          checkOut,
          nights,
          totalAmount,
          bookingStatus: 'PENDING_PAYMENT'
        }
      });
    }

    // 4. POST /api/bookings/:id/pay
    const payMatch = pathname.match(/^\/api\/bookings\/(\d+)\/pay$/);
    if (payMatch && method === 'POST') {
      const bookingId = Number(payMatch[1]);
      const { paymentMethod, amount } = body;

      const bookingIndex = db.bookings.findIndex((b) => b.id === bookingId);
      if (bookingIndex === -1) {
        return jsonResponse({ error: 'Booking not found.' }, 404);
      }

      const txRef = `${(paymentMethod || 'PAY').toUpperCase().replace(/\s+/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;

      db.bookings[bookingIndex].booking_status = 'CONFIRMED';
      db.bookings[bookingIndex].payment_method = paymentMethod || 'QR Ph';
      db.bookings[bookingIndex].payment_reference = txRef;
      db.bookings[bookingIndex].amount = amount || db.bookings[bookingIndex].amount;
      db.bookings[bookingIndex].payment_status = 'PAID';

      db.payments.push({
        id: db.payments.length + 1,
        booking_id: bookingId,
        payment_method: paymentMethod || 'QR Ph',
        payment_reference: txRef,
        amount: amount || db.bookings[bookingIndex].amount,
        payment_status: 'PAID',
        paid_at: new Date().toISOString()
      });

      db.sheetsLog.unshift({
        id: db.sheetsLog.length + 1,
        booking_reference: db.bookings[bookingIndex].reference_number,
        guest_name: db.bookings[bookingIndex].guest_name,
        status: 'SYNCED',
        synced_at: new Date().toISOString()
      });

      saveDb(db);

      return jsonResponse({
        success: true,
        booking: db.bookings[bookingIndex],
        payment: {
          status: 'SUCCESS',
          transactionReference: txRef,
          amount: db.bookings[bookingIndex].amount,
          method: paymentMethod
        }
      });
    }

    // 5. GET /api/bookings/lookup
    if (pathname === '/api/bookings/lookup' && method === 'GET') {
      const ref = (searchParams.get('referenceNumber') || '').trim().toLowerCase();
      const email = (searchParams.get('email') || '').trim().toLowerCase();

      if (!ref || !email) {
        return jsonResponse({ error: 'Booking Reference and Email are required.' }, 400);
      }

      const booking = db.bookings.find(
        (b) => b.reference_number.toLowerCase() === ref && b.email.toLowerCase() === email
      );

      if (!booking) {
        return jsonResponse({ error: 'No matching booking found for the provided details.' }, 404);
      }

      return jsonResponse({ success: true, booking });
    }

    // 6. GET /api/reviews
    if (pathname === '/api/reviews' && method === 'GET') {
      const approved = db.reviews.filter((r) => r.display_status === 'APPROVED');
      return jsonResponse({ success: true, reviews: approved });
    }

    // 7. POST /api/reviews
    if (pathname === '/api/reviews' && method === 'POST') {
      const { guestName, rating, review } = body;
      if (!guestName || !rating || !review) {
        return jsonResponse({ error: 'Guest name, rating, and review text are required.' }, 400);
      }

      const newReview = {
        id: db.reviews.length + 1,
        guest_name: guestName,
        rating: Number(rating),
        review,
        display_status: 'APPROVED',
        created_at: new Date().toISOString()
      };
      db.reviews.unshift(newReview);
      saveDb(db);

      return jsonResponse({ success: true, message: 'Thank you for your feedback!' });
    }

    // 8. POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { email, password } = body;
      const user = db.users.find((u) => u.email.toLowerCase() === (email || '').trim().toLowerCase());

      if (!user || user.password !== password) {
        return jsonResponse({ error: 'Invalid email or password.' }, 401);
      }

      if (user.status !== 'ACTIVE') {
        return jsonResponse({ error: 'Account is currently inactive. Contact Owner.' }, 403);
      }

      const token = `mock_jwt_token_${user.role.toLowerCase()}_${user.id}_${Date.now()}`;
      return jsonResponse({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // 9. GET /api/auth/me
    if (pathname === '/api/auth/me' && method === 'GET') {
      const authHeader = init.headers?.Authorization || (typeof init.headers?.get === 'function' ? init.headers.get('Authorization') : '');
      if (!authHeader) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
      // Return user based on stored token or default to Owner
      const storedToken = localStorage.getItem('cg_token') || '';
      let role = 'OWNER';
      if (storedToken.includes('staff')) role = 'STAFF';
      if (storedToken.includes('support')) role = 'CUSTOMER_SUPPORT';

      const user = db.users.find((u) => u.role === role) || db.users[0];
      return jsonResponse({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // 10. GET /api/admin/checkins
    if (pathname === '/api/admin/checkins' && method === 'GET') {
      const todayStr = formatDate(new Date());
      const targetDate = searchParams.get('date') || todayStr;

      const checkins = db.bookings.filter((b) => {
        return b.check_in === targetDate || b.check_out === targetDate || b.check_in_status === 'CHECKED_IN';
      });

      return jsonResponse({ success: true, date: targetDate, checkins });
    }

    // 11. PATCH /api/admin/bookings/:id/checkin-status
    const checkinMatch = pathname.match(/^\/api\/admin\/bookings\/(\d+)\/checkin-status$/);
    if (checkinMatch && method === 'PATCH') {
      const bookingId = Number(checkinMatch[1]);
      const { checkInStatus } = body;

      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) {
        return jsonResponse({ error: 'Booking not found.' }, 404);
      }

      booking.check_in_status = checkInStatus;
      if (checkInStatus === 'CHECKED_IN') booking.booking_status = 'CHECKED_IN';
      if (checkInStatus === 'CHECKED_OUT') booking.booking_status = 'CHECKED_OUT';

      db.sheetsLog.unshift({
        id: db.sheetsLog.length + 1,
        booking_reference: booking.reference_number,
        guest_name: booking.guest_name,
        status: `UPDATED (${checkInStatus})`,
        synced_at: new Date().toISOString()
      });

      saveDb(db);

      return jsonResponse({
        success: true,
        message: `Check-in status updated to ${checkInStatus}`,
        booking
      });
    }

    // 12. GET /api/admin/calendar
    if (pathname === '/api/admin/calendar' && method === 'GET') {
      const rooms = db.rooms.map((r) => ({ id: r.id, room_name: r.room_name, location: r.location }));
      const bookings = db.bookings.map((b) => ({
        id: b.id,
        reference_number: b.reference_number,
        room_id: b.room_id,
        guest_name: b.guest_name,
        check_in: b.check_in,
        check_out: b.check_out,
        booking_status: b.booking_status,
        check_in_status: b.check_in_status,
        room_name: b.room_name,
        location: b.location
      }));

      return jsonResponse({ success: true, rooms, bookings });
    }

    // 13. GET /api/admin/bookings
    if (pathname === '/api/admin/bookings' && method === 'GET') {
      return jsonResponse({ success: true, bookings: db.bookings });
    }

    // 14. GET /api/owner/revenue
    if (pathname === '/api/owner/revenue' && method === 'GET') {
      const paidBookings = db.bookings.filter((b) => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(b.booking_status));
      const totalRevenue = paidBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      const paidCount = paidBookings.length;
      const pendingCount = db.bookings.filter((b) => b.booking_status === 'PENDING_PAYMENT').length;

      const locationMap = {};
      const roomMap = {};

      paidBookings.forEach((b) => {
        // Location
        const loc = b.location || 'Antipolo';
        if (!locationMap[loc]) locationMap[loc] = { location: loc, revenue: 0, total_bookings: 0 };
        locationMap[loc].revenue += Number(b.amount) || 0;
        locationMap[loc].total_bookings += 1;

        // Room
        const rName = b.room_name || `Room ${b.room_id}`;
        if (!roomMap[rName]) roomMap[rName] = { room_name: rName, location: loc, revenue: 0, total_bookings: 0 };
        roomMap[rName].revenue += Number(b.amount) || 0;
        roomMap[rName].total_bookings += 1;
      });

      return jsonResponse({
        success: true,
        totalRevenue,
        paidBookingsCount: paidCount,
        pendingPaymentsCount: pendingCount,
        revenueByLocation: Object.values(locationMap),
        revenueByRoom: Object.values(roomMap).sort((a, b) => b.revenue - a.revenue)
      });
    }

    // 15. GET /api/owner/users
    if (pathname === '/api/owner/users' && method === 'GET') {
      const usersList = db.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        created_at: u.created_at
      }));
      return jsonResponse({ success: true, users: usersList });
    }

    // 16. POST /api/owner/users
    if (pathname === '/api/owner/users' && method === 'POST') {
      const { name, email, password, role } = body;
      if (!name || !email || !password || !role) {
        return jsonResponse({ error: 'Name, email, password, and role are required.' }, 400);
      }

      if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        return jsonResponse({ error: 'User with this email already exists.' }, 400);
      }

      const newUser = {
        id: db.users.length + 1,
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      };

      db.users.unshift(newUser);
      saveDb(db);

      return jsonResponse({
        success: true,
        message: `Successfully created ${role} account for ${name}`,
        userId: newUser.id
      });
    }

    // 17. PATCH /api/owner/users/:id
    const userMatch = pathname.match(/^\/api\/owner\/users\/(\d+)$/);
    if (userMatch && method === 'PATCH') {
      const userId = Number(userMatch[1]);
      const { status, password, role } = body;

      const user = db.users.find((u) => u.id === userId);
      if (!user) {
        return jsonResponse({ error: 'User not found.' }, 404);
      }

      if (user.role === 'OWNER' && status === 'INACTIVE') {
        return jsonResponse({ error: 'Owner account cannot be deactivated.' }, 400);
      }

      if (status) user.status = status;
      if (role) user.role = role;
      if (password) user.password = password;

      saveDb(db);

      return jsonResponse({ success: true, message: 'User account updated successfully.' });
    }

    // 18. PATCH /api/owner/reviews/:id
    const reviewMatch = pathname.match(/^\/api\/owner\/reviews\/(\d+)$/);
    if (reviewMatch && method === 'PATCH') {
      const reviewId = Number(reviewMatch[1]);
      const { displayStatus } = body;

      const rev = db.reviews.find((r) => r.id === reviewId);
      if (!rev) {
        return jsonResponse({ error: 'Review not found.' }, 404);
      }

      rev.display_status = displayStatus;
      saveDb(db);

      return jsonResponse({ success: true, message: `Review display status updated to ${displayStatus}` });
    }

    // 19. GET /api/owner/sheets-log
    if (pathname === '/api/owner/sheets-log' && method === 'GET') {
      return jsonResponse({ success: true, logs: db.sheetsLog });
    }

    // Fallback if unmatched
    return originalFetch(input, init);
  };
};
