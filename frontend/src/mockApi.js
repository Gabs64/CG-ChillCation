// Client-side Mock Data Store & API Interceptor for CG Chillcation v2.0

const DB_KEY = 'cg_chillcation_mock_db_v3';

const getInitialRooms = () => {
  return []; // Clean slate: 0 demo rooms
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
  const yesterdayStr = formatDate(new Date(today.getTime() - 86400000));

  return {
    settings: {
      security_deposit_amount: '1000',
      security_deposit_enabled: 'true',
      meta_messenger_url: 'https://m.me/cgchillcation',
      secret_admin_path: 'portal-access-8f3k29x7-admin-secure',
      google_maps_antipolo: 'https://maps.google.com/?q=Antipolo+Rizal+CG+Chillcation',
      google_maps_cainta: 'https://maps.google.com/?q=Cainta+Rizal+CG+Chillcation'
    },
    inclusions: [
      { id: 1, name: 'Car Parking Space', description: 'Designated secure covered parking space for 1 standard automobile', price: 200, location: 'All', is_active: 1 },
      { id: 2, name: 'Motorcycle Parking Space', description: 'Designated secure motorcycle parking bay', price: 100, location: 'All', is_active: 1 },
      { id: 3, name: 'Extra Guest (Mattress & Linen)', description: 'Additional guest accommodation setup with complete premium bedding kit', price: 300, location: 'All', is_active: 1 },
      { id: 4, name: 'Late Check-out Pass (Until 2:00 PM)', description: 'Extend your stay by 2 hours subject to availability', price: 500, location: 'Antipolo', is_active: 1 },
      { id: 5, name: 'Artisan Breakfast Basket', description: 'Curated breakfast spread with fresh brew coffee and pastries for 2', price: 450, location: 'Cainta', is_active: 1 }
    ],
    policies: [
      {
        id: 1,
        title: 'Check-in & Check-out Schedule',
        content: 'Standard check-in begins promptly at 2:00 PM (Asia/Manila time). Check-out is strictly by 12:00 PM noon to allow comprehensive sanitization.',
        display_order: 1,
        is_active: 1
      },
      {
        id: 2,
        title: 'Refundable Security Deposit',
        content: 'A refundable security deposit of ₱1,000 is required upon check-in. The full amount is refunded upon departure following room inspection.',
        display_order: 2,
        is_active: 1
      },
      {
        id: 3,
        title: 'Age Requirement & Guest Verification',
        content: 'The primary guest registering the booking must be at least 18 years old and present a valid government-issued ID upon arrival.',
        display_order: 3,
        is_active: 1
      },
      {
        id: 4,
        title: 'Quiet Hours & Suite Etiquette',
        content: 'To ensure a serene experience for all guests, quiet hours are observed from 10:00 PM to 8:00 AM. Smoking and vaping are strictly prohibited inside the suites.',
        display_order: 4,
        is_active: 1
      },
      {
        id: 5,
        title: 'Cancellation & Rescheduling Policy',
        content: 'Rescheduling requests must be submitted at least 48 hours before scheduled check-in date. Down payments are non-refundable for same-day cancellations.',
        display_order: 5,
        is_active: 1
      }
    ],
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
    guest_experiences: [
      {
        id: 1,
        guest_name: 'Maria Santos',
        rating: 5,
        review_text: 'Very clean and comfortable place. The booking process was fast and easy. Loved the quiet vibe in Antipolo!',
        room_name: 'Room 01',
        stay_date: '2026-09-28',
        photo_url: null,
        status: 'APPROVED',
        created_at: new Date(today.getTime() - 86400000 * 5).toISOString(),
        reviewed_by: 'CG Owner'
      },
      {
        id: 2,
        guest_name: 'Juan Dela Cruz',
        rating: 5,
        review_text: 'Super seamless check-in via QR code! The monochrome interior feels so high-end and cozy. Highly recommended.',
        room_name: 'Room 08',
        stay_date: '2026-10-01',
        photo_url: null,
        status: 'APPROVED',
        created_at: new Date(today.getTime() - 86400000 * 3).toISOString(),
        reviewed_by: 'CG Owner'
      },
      {
        id: 3,
        guest_name: 'Clarissa Ramos',
        rating: 5,
        review_text: 'Great location in Antipolo! QR payment confirmation was instantaneous and customer support answered our queries on Messenger immediately.',
        room_name: 'Room 04',
        stay_date: '2026-10-02',
        photo_url: null,
        status: 'APPROVED',
        created_at: new Date(today.getTime() - 86400000 * 2).toISOString(),
        reviewed_by: 'CG Owner'
      },
      {
        id: 4,
        guest_name: 'Mark Anthony Gomez',
        rating: 4,
        review_text: 'Top notch cleanliness, crisp linens, and ambient lighting. Will definitely book again for my next staycation.',
        room_name: 'Room 12',
        stay_date: '2026-10-03',
        photo_url: null,
        status: 'APPROVED',
        created_at: new Date(today.getTime() - 86400000).toISOString(),
        reviewed_by: 'CG Owner'
      },
      {
        id: 5,
        guest_name: 'Eleanor Vance',
        rating: 5,
        review_text: 'Peaceful retreat in Antipolo. Booking inclusions were easy to choose.',
        room_name: 'Room 02',
        stay_date: '2026-10-04',
        photo_url: null,
        status: 'PENDING',
        created_at: new Date().toISOString()
      }
    ],
    bookings: [
      {
        id: 1,
        reference_number: 'CGC-20261006-1001',
        room_id: 1,
        room_name: 'Room 01',
        location: 'Antipolo',
        guest_name: 'Juan Dela Cruz',
        guest_count: 2,
        contact_number: '09171234567',
        email: 'juan@example.com',
        vehicle: 'Car (ABC 1234)',
        age: 26,
        check_in: todayStr,
        check_out: tomorrowStr,
        booking_status: 'CONFIRMED',
        check_in_status: 'NOT_CHECKED_IN',
        created_at: new Date(today.getTime() - 86400000 * 2).toISOString(),
        payment_method: 'QR Ph',
        payment_reference: 'QRPH-99281726',
        amount: 2000,
        payment_status: 'PAID',
        breakdown: {
          room_rate_snapshot: 2800,
          nights: 1,
          room_subtotal: 2800,
          inclusions_subtotal: 200,
          security_deposit: 1000,
          total_amount: 4000,
          down_payment: 2000,
          remaining_balance: 2000
        },
        inclusions: [
          { inclusion_id: 1, name_snapshot: 'Car Parking Space', price_snapshot: 200, quantity: 1, subtotal: 200 }
        ],
        securityDeposit: {
          amount: 1000,
          payment_status: 'PENDING',
          paid_at: null,
          paid_by: null,
          refunded_at: null,
          refunded_by: null
        }
      },
      {
        id: 2,
        reference_number: 'CGC-20261006-1002',
        room_id: 8,
        room_name: 'Room 08',
        location: 'Cainta',
        guest_name: 'Maria Santos',
        guest_count: 1,
        contact_number: '09189876543',
        email: 'maria@example.com',
        vehicle: 'Motorcycle (XYZ 789)',
        age: 29,
        check_in: yesterdayStr,
        check_out: todayStr,
        booking_status: 'CHECKED_IN',
        check_in_status: 'CHECKED_IN',
        created_at: new Date(today.getTime() - 86400000 * 4).toISOString(),
        payment_method: 'Dragonpay',
        payment_reference: 'DP-88273619',
        amount: 3600,
        payment_status: 'PAID',
        breakdown: {
          room_rate_snapshot: 2500,
          nights: 1,
          room_subtotal: 2500,
          inclusions_subtotal: 100,
          security_deposit: 1000,
          total_amount: 3600,
          down_payment: 3600,
          remaining_balance: 0
        },
        inclusions: [
          { inclusion_id: 2, name_snapshot: 'Motorcycle Parking Space', price_snapshot: 100, quantity: 1, subtotal: 100 }
        ],
        securityDeposit: {
          amount: 1000,
          payment_status: 'PAID',
          paid_at: new Date(today.getTime() - 86400000).toISOString(),
          paid_by: 'Antipolo Staff',
          refunded_at: null,
          refunded_by: null
        }
      },
      {
        id: 3,
        reference_number: 'CGC-20261006-1003',
        room_id: 4,
        room_name: 'Room 04',
        location: 'Antipolo',
        guest_name: 'Carlos Mendoza',
        guest_count: 3,
        contact_number: '09191112233',
        email: 'carlos@example.com',
        vehicle: 'Car (NCR 456)',
        age: 32,
        check_in: tomorrowStr,
        check_out: dayAfterStr,
        booking_status: 'CONFIRMED',
        check_in_status: 'NOT_CHECKED_IN',
        created_at: new Date(today.getTime() - 86400000).toISOString(),
        payment_method: 'GCash',
        payment_reference: 'GCASH-77162544',
        amount: 2050,
        payment_status: 'PAID',
        breakdown: {
          room_rate_snapshot: 2800,
          nights: 1,
          room_subtotal: 2800,
          inclusions_subtotal: 300,
          security_deposit: 1000,
          total_amount: 4100,
          down_payment: 2050,
          remaining_balance: 2050
        },
        inclusions: [
          { inclusion_id: 3, name_snapshot: 'Extra Guest (Mattress & Linen)', price_snapshot: 300, quantity: 1, subtotal: 300 }
        ],
        securityDeposit: {
          amount: 1000,
          payment_status: 'PENDING'
        }
      }
    ],
    audit_logs: [
      {
        id: 1,
        user_name: 'System',
        user_role: 'SYSTEM',
        action: 'SYSTEM_INITIALIZATION',
        target: 'v2.0 Database',
        details: 'Initialized FSD v2.0 schema, rooms, inclusions, and policies.',
        created_at: new Date().toISOString()
      }
    ]
  };
};

export const getDb = () => {
  try {
    localStorage.removeItem('cg_chillcation_mock_db');
    localStorage.removeItem('cg_chillcation_mock_db_v2');
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initial = getInitialDb();
      localStorage.setItem(DB_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    const initial = getInitialDb();
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
};

export const saveDb = (db) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const recordAudit = (db, userName, userRole, action, target, details, prevVal = null, newVal = null) => {
  db.audit_logs = db.audit_logs || [];
  db.audit_logs.unshift({
    id: db.audit_logs.length + 1,
    user_name: userName || 'System',
    user_role: userRole || 'STAFF',
    action,
    target,
    details,
    previous_value: prevVal,
    new_value: newVal,
    created_at: new Date().toISOString()
  });
};

export const initMockApi = () => {
  const originalFetch = window.fetch;

  window.fetch = async (url, options = {}) => {
    const urlStr = typeof url === 'string' ? url : url.url;
    const method = (options.method || 'GET').toUpperCase();
    const token = options.headers?.Authorization?.replace('Bearer ', '') || '';

    // If request is not targeted to /api, pass through
    if (!urlStr.startsWith('/api')) {
      return originalFetch(url, options);
    }

    const db = getDb();
    const parsedUrl = new URL(urlStr, window.location.origin);
    const pathname = parsedUrl.pathname;
    const query = Object.fromEntries(parsedUrl.searchParams.entries());

    let body = {};
    if (options.body && typeof options.body === 'string') {
      try {
        body = JSON.parse(options.body);
      } catch (e) {}
    }

    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    // 1. PUBLIC SETTINGS
    if (pathname === '/api/settings/public' && method === 'GET') {
      return jsonResponse({
        success: true,
        settings: {
          securityDepositAmount: Number(db.settings?.security_deposit_amount || 1000),
          securityDepositEnabled: db.settings?.security_deposit_enabled !== 'false',
          metaMessengerUrl: db.settings?.meta_messenger_url || 'https://m.me/cgchillcation',
          googleMapsAntipolo: db.settings?.google_maps_antipolo || 'https://maps.google.com/?q=Antipolo+Rizal+CG+Chillcation',
          googleMapsCainta: db.settings?.google_maps_cainta || 'https://maps.google.com/?q=Cainta+Rizal+CG+Chillcation',
          secretAdminPath: db.settings?.secret_admin_path || 'portal-access-8f3k29x7-admin-secure'
        }
      });
    }

    // 2. PUBLIC ROOMS
    if (pathname === '/api/rooms' && method === 'GET') {
      let filtered = db.rooms.filter((r) => r.status !== 'DEACTIVATED');
      if (query.location && query.location !== 'All') {
        filtered = filtered.filter((r) => r.location === query.location);
      }
      if (query.featured === 'true') {
        filtered = filtered.filter((r) => r.is_featured);
      }
      return jsonResponse({ success: true, rooms: filtered });
    }

    if (pathname.match(/^\/api\/rooms\/(\d+)$/) && method === 'GET') {
      const id = parseInt(pathname.match(/^\/api\/rooms\/(\d+)$/)[1]);
      const room = db.rooms.find((r) => r.id === id);
      if (!room) return jsonResponse({ error: 'Room not found' }, 404);
      return jsonResponse({ success: true, room });
    }

    // 3. INCLUSIONS & POLICIES
    if (pathname === '/api/inclusions' && method === 'GET') {
      let activeInclusions = (db.inclusions || []).filter((i) => i.is_active);
      if (query.location && query.location !== 'All') {
        activeInclusions = activeInclusions.filter((i) => !i.location || i.location === 'All' || i.location === query.location);
      }
      return jsonResponse({ success: true, inclusions: activeInclusions });
    }

    if (pathname === '/api/policies' && method === 'GET') {
      const activePolicies = (db.policies || []).filter((p) => p.is_active).sort((a, b) => a.display_order - b.display_order);
      return jsonResponse({ success: true, policies: activePolicies });
    }

    // 4. CHECK AVAILABILITY
    if (pathname === '/api/bookings/check-availability' && method === 'POST') {
      const { roomId, checkIn, checkOut } = body;
      const isOverlapping = db.bookings.some((b) => {
        if (b.room_id !== Number(roomId)) return false;
        if (!['CONFIRMED', 'PENDING_PAYMENT', 'CHECKED_IN'].includes(b.booking_status)) return false;
        return b.check_in < checkOut && b.check_out > checkIn;
      });
      return jsonResponse({ success: true, isAvailable: !isOverlapping, roomId, checkIn, checkOut });
    }

    // 5. CREATE BOOKING
    if (pathname === '/api/bookings' && method === 'POST') {
      const { roomId, guestName, guestCount, contactNumber, email, vehicle, age, checkIn, checkOut, selectedInclusions = [], policyAcknowledged } = body;

      if (!policyAcknowledged) {
        return jsonResponse({ error: 'You must acknowledge the Rules and Policies.' }, 400);
      }
      if (Number(age) < 18) {
        return jsonResponse({ error: 'Guests must be 18 years old or above.' }, 400);
      }

      const room = db.rooms.find((r) => r.id === Number(roomId));
      if (!room) return jsonResponse({ error: 'Room not found' }, 404);

      const dIn = new Date(checkIn);
      const dOut = new Date(checkOut);
      const nights = Math.ceil((dOut - dIn) / (1000 * 60 * 60 * 24)) || 1;
      const roomSubtotal = room.price_per_night * nights;

      let inclusionsSubtotal = 0;
      const resolvedInclusions = [];
      for (const item of selectedInclusions) {
        const incDb = db.inclusions.find((i) => i.id === (item.id || item.inclusionId));
        if (incDb) {
          const qty = Number(item.quantity) || 1;
          const sub = incDb.price * qty;
          inclusionsSubtotal += sub;
          resolvedInclusions.push({
            inclusion_id: incDb.id,
            name_snapshot: incDb.name,
            price_snapshot: incDb.price,
            quantity: qty,
            subtotal: sub
          });
        }
      }

      const depositAmount = Number(db.settings?.security_deposit_amount || 1000);
      const totalAmount = roomSubtotal + inclusionsSubtotal + depositAmount;
      const downPayment = Math.round(totalAmount * 0.5);
      const remainingBalance = totalAmount - downPayment;

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const refSuffix = Math.floor(1000 + Math.random() * 9000);
      const referenceNumber = `CGC-${dateStr}-${refSuffix}`;

      const newBooking = {
        id: db.bookings.length + 1,
        reference_number: referenceNumber,
        room_id: room.id,
        room_name: room.room_name,
        location: room.location,
        guest_name: guestName,
        guest_count: guestCount,
        contact_number: contactNumber,
        email,
        vehicle,
        age: Number(age),
        check_in: checkIn,
        check_out: checkOut,
        booking_status: 'PENDING_PAYMENT',
        check_in_status: 'NOT_CHECKED_IN',
        created_at: new Date().toISOString(),
        breakdown: {
          room_rate_snapshot: room.price_per_night,
          nights,
          room_subtotal: roomSubtotal,
          inclusions_subtotal: inclusionsSubtotal,
          security_deposit: depositAmount,
          total_amount: totalAmount,
          down_payment: downPayment,
          remaining_balance: remainingBalance
        },
        inclusions: resolvedInclusions,
        securityDeposit: {
          amount: depositAmount,
          payment_status: 'PENDING'
        }
      };

      db.bookings.push(newBooking);
      saveDb(db);

      return jsonResponse({
        success: true,
        booking: {
          ...newBooking,
          referenceNumber,
          roomId: room.id,
          roomName: room.room_name,
          location: room.location,
          guestName,
          email,
          checkIn,
          checkOut,
          nights,
          roomRate: room.price_per_night,
          roomSubtotal,
          inclusions: resolvedInclusions,
          inclusionsSubtotal,
          securityDeposit: depositAmount,
          totalAmount,
          downPayment,
          remainingBalance,
          bookingStatus: 'PENDING_PAYMENT',
          availablePaymentMethods: room.payment_methods || ['QR Ph', 'Dragonpay', 'GCash', 'Maya']
        }
      });
    }

    // 6. PAY BOOKING
    if (pathname.match(/^\/api\/bookings\/(\d+)\/pay$/) && method === 'POST') {
      const id = parseInt(pathname.match(/^\/api\/bookings\/(\d+)\/pay$/)[1]);
      const { paymentMethod, paymentReference, amount } = body;
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) return jsonResponse({ error: 'Booking not found' }, 404);

      booking.booking_status = 'CONFIRMED';
      booking.payment_method = paymentMethod;
      booking.payment_reference = paymentReference || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      booking.amount = amount;
      booking.payment_status = 'PAID';
      booking.paid_at = new Date().toISOString();

      recordAudit(db, 'Guest Payment', 'GUEST', 'BOOKING_PAYMENT_CONFIRMED', booking.reference_number, `Paid ₱${amount} via ${paymentMethod}`);
      saveDb(db);

      return jsonResponse({
        success: true,
        booking,
        payment: { method: paymentMethod, reference: booking.payment_reference, amount }
      });
    }

    // 7. BOOKINGS LOOKUP
    if (pathname === '/api/bookings/lookup' && method === 'GET') {
      const { referenceNumber, email } = query;
      const booking = db.bookings.find((b) => 
        b.reference_number?.toLowerCase() === referenceNumber?.toLowerCase()?.trim() &&
        b.email?.toLowerCase() === email?.toLowerCase()?.trim()
      );

      if (!booking) {
        return jsonResponse({ error: 'No matching booking found' }, 404);
      }

      const room = db.rooms.find((r) => r.id === booking.room_id);
      return jsonResponse({
        success: true,
        booking: {
          ...booking,
          description: room?.description,
          google_maps_url: room?.google_maps_url,
          room_images: room?.images || []
        }
      });
    }

    // 8. GUEST EXPERIENCES (REVIEWS)
    if (pathname === '/api/guest-experiences' && method === 'GET') {
      const approved = (db.guest_experiences || []).filter((g) => g.status === 'APPROVED');
      return jsonResponse({ success: true, experiences: approved });
    }

    if (pathname === '/api/guest-experiences' && method === 'POST') {
      const { guestName, rating, reviewText, roomName, stayDate, photoUrl } = body;
      const newExp = {
        id: (db.guest_experiences || []).length + 1,
        guest_name: guestName,
        rating: Number(rating),
        review_text: reviewText,
        room_name: roomName || null,
        stay_date: stayDate || null,
        photo_url: photoUrl || null,
        status: 'PENDING',
        created_at: new Date().toISOString()
      };
      db.guest_experiences = db.guest_experiences || [];
      db.guest_experiences.unshift(newExp);
      saveDb(db);
      return jsonResponse({ success: true, message: 'Submitted for approval', experienceId: newExp.id });
    }

    // Backwards compatibility for /api/reviews
    if (pathname === '/api/reviews' && method === 'GET') {
      const approved = (db.guest_experiences || []).filter((g) => g.status === 'APPROVED').map((g) => ({
        id: g.id,
        guest_name: g.guest_name,
        rating: g.rating,
        review: g.review_text,
        display_status: 'APPROVED',
        created_at: g.created_at
      }));
      return jsonResponse({ success: true, reviews: approved });
    }

    // 9. AUTH LOGIN & ME
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { email, password } = body;
      const user = db.users.find((u) => u.email.toLowerCase() === email?.toLowerCase()?.trim());
      if (!user || user.password !== password) {
        return jsonResponse({ error: 'Invalid email or password' }, 401);
      }
      if (user.status !== 'ACTIVE') {
        return jsonResponse({ error: 'Account is inactive' }, 403);
      }
      const fakeToken = `mock_token_${user.role.toLowerCase()}_${user.id}_${Date.now()}`;
      recordAudit(db, user.name, user.role, 'USER_LOGIN', user.email, 'User logged into portal');
      saveDb(db);
      return jsonResponse({
        success: true,
        token: fakeToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      if (!token) return jsonResponse({ error: 'Unauthorized' }, 401);
      
      let user = null;
      if (token.startsWith('mock_token_')) {
        const parts = token.split('_');
        const userId = parseInt(parts[3]);
        if (!isNaN(userId)) {
          user = db.users.find((u) => u.id === userId);
        }
      }
      
      if (!user) {
        user = db.users.find((u) => token.includes(`_${u.id}_`));
      }

      if (!user) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      return jsonResponse({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    }

    // 10. DAILY ARRIVALS & DEPARTURES
    if (pathname === '/api/admin/arrivals-departures' && method === 'GET') {
      const targetDate = query.date || formatDate(new Date());
      const arrivals = db.bookings.filter((b) => b.check_in === targetDate);
      const departures = db.bookings.filter((b) => b.check_out === targetDate);
      const inHouse = db.bookings.filter((b) => b.check_in_status === 'CHECKED_IN');

      return jsonResponse({
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
    }

    // 11. CHECK-IN / CHECK-OUT STATUS
    if (pathname.match(/^\/api\/admin\/bookings\/(\d+)\/checkin-status$/) && method === 'PATCH') {
      const id = parseInt(pathname.match(/^\/api\/admin\/bookings\/(\d+)\/checkin-status$/)[1]);
      const { checkInStatus } = body;
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) return jsonResponse({ error: 'Booking not found' }, 404);

      booking.check_in_status = checkInStatus;
      if (checkInStatus === 'CHECKED_IN') booking.booking_status = 'CHECKED_IN';
      if (checkInStatus === 'CHECKED_OUT') booking.booking_status = 'CHECKED_OUT';

      const room = db.rooms.find((r) => r.id === booking.room_id);
      if (room) {
        if (checkInStatus === 'CHECKED_IN') room.status = 'CHECKED_IN';
        if (checkInStatus === 'CHECKED_OUT') room.status = 'AVAILABLE';
      }

      recordAudit(db, 'Staff Member', 'STAFF', `BOOKING_${checkInStatus}`, booking.reference_number, `Updated status to ${checkInStatus}`);
      saveDb(db);
      return jsonResponse({ success: true, booking });
    }

    // 12. SECURITY DEPOSIT CONFIRMATION / REFUND
    if (pathname.match(/^\/api\/admin\/bookings\/(\d+)\/security-deposit$/) && method === 'PATCH') {
      const id = parseInt(pathname.match(/^\/api\/admin\/bookings\/(\d+)\/security-deposit$/)[1]);
      const { action, notes } = body;
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) return jsonResponse({ error: 'Booking not found' }, 404);

      booking.securityDeposit = booking.securityDeposit || { amount: 1000 };

      if (action === 'CONFIRM_PAYMENT') {
        booking.securityDeposit.payment_status = 'PAID';
        booking.securityDeposit.paid_at = new Date().toISOString();
        booking.securityDeposit.paid_by = 'Antipolo Staff';
        recordAudit(db, 'Staff Member', 'STAFF', 'DEPOSIT_CONFIRMED', booking.reference_number, 'Confirmed security deposit payment of ₱1,000');
      } else if (action === 'MARK_REFUNDED') {
        booking.securityDeposit.payment_status = 'REFUNDED';
        booking.securityDeposit.refunded_at = new Date().toISOString();
        booking.securityDeposit.refunded_by = 'Antipolo Staff';
        recordAudit(db, 'Staff Member', 'STAFF', 'DEPOSIT_REFUNDED', booking.reference_number, 'Refunded security deposit of ₱1,000');
      } else if (action === 'FORFEIT') {
        booking.securityDeposit.payment_status = 'FORFEITED';
        booking.securityDeposit.notes = notes;
        recordAudit(db, 'Staff Member', 'STAFF', 'DEPOSIT_FORFEITED', booking.reference_number, notes || 'Deposit forfeited');
      }

      saveDb(db);
      return jsonResponse({ success: true, securityDeposit: booking.securityDeposit });
    }

    // 13. QR SCANNER LOOKUP
    if (pathname.match(/^\/api\/admin\/qr\/lookup\/(.+)$/) && method === 'GET') {
      const ref = decodeURIComponent(pathname.match(/^\/api\/admin\/qr\/lookup\/(.+)$/)[1]).trim();
      const booking = db.bookings.find((b) => b.reference_number?.toLowerCase() === ref.toLowerCase());
      if (!booking) return jsonResponse({ error: `No booking found for QR Reference "${ref}"` }, 404);

      const canCheckIn = booking.check_in_status === 'NOT_CHECKED_IN';
      const canCheckOut = booking.check_in_status === 'CHECKED_IN';

      return jsonResponse({
        success: true,
        booking: {
          ...booking,
          canCheckIn,
          canCheckOut
        }
      });
    }

    // 14. MASTER CALENDAR
    if (pathname === '/api/admin/calendar' && method === 'GET') {
      const rooms = db.rooms.filter((r) => r.status !== 'DEACTIVATED');
      return jsonResponse({ success: true, rooms, bookings: db.bookings });
    }

    // 15. ALL BOOKINGS
    if (pathname === '/api/admin/bookings' && method === 'GET') {
      let bookings = [...db.bookings];
      if (query.status && query.status !== 'All') {
        bookings = bookings.filter((b) => b.booking_status === query.status || b.check_in_status === query.status);
      }
      if (query.location && query.location !== 'All') {
        bookings = bookings.filter((b) => b.location === query.location);
      }
      if (query.roomId && query.roomId !== 'All') {
        bookings = bookings.filter((b) => b.room_id === Number(query.roomId));
      }
      if (query.search) {
        const q = query.search.toLowerCase().trim();
        bookings = bookings.filter((b) => 
          b.guest_name?.toLowerCase().includes(q) ||
          b.reference_number?.toLowerCase().includes(q) ||
          b.email?.toLowerCase().includes(q)
        );
      }
      return jsonResponse({ success: true, bookings });
    }

    // 16. ROOM STATUS PAGE
    if (pathname === '/api/admin/room-status' && method === 'GET') {
      const todayStr = formatDate(new Date());
      const roomStatuses = db.rooms.filter((r) => r.status !== 'DEACTIVATED').map((room) => {
        const currentBooking = db.bookings.find((b) => 
          b.room_id === room.id &&
          ['CONFIRMED', 'CHECKED_IN'].includes(b.booking_status) &&
          b.check_in <= todayStr && b.check_out >= todayStr
        );
        return {
          room,
          currentBooking: currentBooking || null,
          operationalStatus: room.status
        };
      });
      return jsonResponse({ success: true, roomStatuses });
    }

    if (pathname.match(/^\/api\/admin\/rooms\/(\d+)\/status$/) && method === 'PATCH') {
      const id = parseInt(pathname.match(/^\/api\/admin\/rooms\/(\d+)\/status$/)[1]);
      const { status } = body;
      const room = db.rooms.find((r) => r.id === id);
      if (!room) return jsonResponse({ error: 'Room not found' }, 404);
      room.status = status;
      recordAudit(db, 'Staff Member', 'STAFF', 'ROOM_STATUS_CHANGE', room.room_name, `Status changed to ${status}`);
      saveDb(db);
      return jsonResponse({ success: true, message: 'Updated room status' });
    }

    // 17. OWNER REVENUE
    if (pathname === '/api/owner/revenue' && method === 'GET') {
      const totalRevenue = db.bookings
        .filter((b) => b.payment_status === 'PAID')
        .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      const paidCount = db.bookings.filter((b) => b.payment_status === 'PAID').length;
      const pendingCount = db.bookings.filter((b) => b.booking_status === 'PENDING_PAYMENT').length;
      const depositsHeld = db.bookings
        .filter((b) => b.securityDeposit?.payment_status === 'PAID')
        .reduce((sum, b) => sum + (Number(b.securityDeposit?.amount) || 1000), 0);

      const byLocation = [
        { location: 'Antipolo', revenue: db.bookings.filter((b) => b.location === 'Antipolo' && b.payment_status === 'PAID').reduce((sum, b) => sum + (Number(b.amount) || 0), 0), total_bookings: db.bookings.filter((b) => b.location === 'Antipolo').length },
        { location: 'Cainta', revenue: db.bookings.filter((b) => b.location === 'Cainta' && b.payment_status === 'PAID').reduce((sum, b) => sum + (Number(b.amount) || 0), 0), total_bookings: db.bookings.filter((b) => b.location === 'Cainta').length }
      ];

      return jsonResponse({
        success: true,
        totalRevenue,
        paidBookingsCount: paidCount,
        pendingPaymentsCount: pendingCount,
        securityDepositsInCustody: depositsHeld,
        revenueByLocation: byLocation,
        revenueByRoom: []
      });
    }

    // 18. OWNER ROOM MANAGEMENT (CRUD)
    if (pathname === '/api/owner/rooms' && method === 'POST') {
      const { roomName, location, description, pricePerNight, isFeatured, googleMapsUrl, images, paymentMethods } = body;
      const newRoom = {
        id: db.rooms.length + 1,
        room_name: roomName,
        location,
        description,
        price_per_night: Number(pricePerNight),
        status: 'AVAILABLE',
        is_featured: Boolean(isFeatured),
        google_maps_url: googleMapsUrl || (location === 'Antipolo' ? db.settings?.google_maps_antipolo : db.settings?.google_maps_cainta),
        images: images && images.length > 0 ? images : [
          'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1590490360182-c3d57733427?auto=format&fit=crop&w=1200&q=80'
        ],
        payment_methods: paymentMethods || ['QR Ph', 'Dragonpay', 'GCash', 'Maya', 'Bank Transfer']
      };
      db.rooms.push(newRoom);
      recordAudit(db, 'CG Owner', 'OWNER', 'ROOM_CREATED', roomName, `Created room in ${location}`);
      saveDb(db);
      return jsonResponse({ success: true, message: 'Room created', roomId: newRoom.id });
    }

    if (pathname.match(/^\/api\/owner\/rooms\/(\d+)$/) && method === 'PATCH') {
      const id = parseInt(pathname.match(/^\/api\/owner\/rooms\/(\d+)$/)[1]);
      const room = db.rooms.find((r) => r.id === id);
      if (!room) return jsonResponse({ error: 'Room not found' }, 404);

      if (body.roomName !== undefined) room.room_name = body.roomName;
      if (body.location !== undefined) room.location = body.location;
      if (body.description !== undefined) room.description = body.description;
      if (body.pricePerNight !== undefined) room.price_per_night = Number(body.pricePerNight);
      if (body.isFeatured !== undefined) room.is_featured = Boolean(body.isFeatured);
      if (body.status !== undefined) room.status = body.status;
      if (body.googleMapsUrl !== undefined) room.google_maps_url = body.googleMapsUrl;
      if (Array.isArray(body.images)) room.images = body.images;
      if (Array.isArray(body.paymentMethods)) room.payment_methods = body.paymentMethods;

      recordAudit(db, 'CG Owner', 'OWNER', 'ROOM_UPDATED', room.room_name, 'Updated room settings');
      saveDb(db);
      return jsonResponse({ success: true, message: 'Room updated' });
    }

    if (pathname.match(/^\/api\/owner\/rooms\/(\d+)$/) && method === 'DELETE') {
      const id = parseInt(pathname.match(/^\/api\/owner\/rooms\/(\d+)$/)[1]);
      const room = db.rooms.find((r) => r.id === id);
      if (room) {
        room.status = 'DEACTIVATED';
        recordAudit(db, 'CG Owner', 'OWNER', 'ROOM_DEACTIVATED', room.room_name, 'Deactivated room');
        saveDb(db);
      }
      return jsonResponse({ success: true, message: 'Room deactivated' });
    }

    // 19. OWNER INCLUSIONS CRUD
    if (pathname === '/api/owner/inclusions' && method === 'GET') {
      let list = db.inclusions || [];
      if (query.location && query.location !== 'All') {
        list = list.filter((i) => i.location === query.location || i.location === 'All');
      }
      return jsonResponse({ success: true, inclusions: list });
    }

    if (pathname === '/api/owner/inclusions' && method === 'POST') {
      const { name, description, price, location = 'All', isActive = true } = body;
      const newInc = {
        id: (db.inclusions || []).length + 1,
        name,
        description: description || '',
        price: Number(price),
        location: location || 'All',
        is_active: isActive ? 1 : 0
      };
      db.inclusions = db.inclusions || [];
      db.inclusions.push(newInc);
      recordAudit(db, 'CG Owner', 'OWNER', 'INCLUSION_ADDED', name, `Added inclusion for ${location} at ₱${price}`);
      saveDb(db);
      return jsonResponse({ success: true, message: 'Inclusion created', inclusionId: newInc.id });
    }

    if (pathname.match(/^\/api\/owner\/inclusions\/(\d+)$/) && method === 'PATCH') {
      const id = parseInt(pathname.match(/^\/api\/owner\/inclusions\/(\d+)$/)[1]);
      const inc = (db.inclusions || []).find((i) => i.id === id);
      if (inc) {
        if (body.name !== undefined) inc.name = body.name;
        if (body.description !== undefined) inc.description = body.description;
        if (body.price !== undefined) inc.price = Number(body.price);
        if (body.location !== undefined) inc.location = body.location;
        if (body.isActive !== undefined) inc.is_active = body.isActive ? 1 : 0;
        recordAudit(db, 'CG Owner', 'OWNER', 'INCLUSION_UPDATED', inc.name, `Updated inclusion (${inc.location || 'All'}) price to ₱${inc.price}`);
        saveDb(db);
      }
      return jsonResponse({ success: true, message: 'Inclusion updated' });
    }

    if (pathname.match(/^\/api\/owner\/inclusions\/(\d+)$/) && method === 'DELETE') {
      const id = parseInt(pathname.match(/^\/api\/owner\/inclusions\/(\d+)$/)[1]);
      const inc = (db.inclusions || []).find((i) => i.id === id);
      if (inc) inc.is_active = 0;
      saveDb(db);
      return jsonResponse({ success: true, message: 'Inclusion deactivated' });
    }

    // 20. OWNER POLICIES CRUD
    if (pathname === '/api/owner/policies' && method === 'GET') {
      return jsonResponse({ success: true, policies: db.policies || [] });
    }

    if (pathname === '/api/owner/policies' && method === 'POST') {
      const { title, content, displayOrder = 1, isActive = true } = body;
      const newPol = {
        id: (db.policies || []).length + 1,
        title,
        content,
        display_order: Number(displayOrder),
        is_active: isActive ? 1 : 0
      };
      db.policies = db.policies || [];
      db.policies.push(newPol);
      recordAudit(db, 'CG Owner', 'OWNER', 'POLICY_ADDED', title, 'Added policy');
      saveDb(db);
      return jsonResponse({ success: true, message: 'Policy created', policyId: newPol.id });
    }

    if (pathname.match(/^\/api\/owner\/policies\/(\d+)$/) && method === 'PATCH') {
      const id = parseInt(pathname.match(/^\/api\/owner\/policies\/(\d+)$/)[1]);
      const pol = (db.policies || []).find((p) => p.id === id);
      if (pol) {
        if (body.title !== undefined) pol.title = body.title;
        if (body.content !== undefined) pol.content = body.content;
        if (body.displayOrder !== undefined) pol.display_order = Number(body.displayOrder);
        if (body.isActive !== undefined) pol.is_active = body.isActive ? 1 : 0;
        recordAudit(db, 'CG Owner', 'OWNER', 'POLICY_UPDATED', pol.title, 'Updated policy');
        saveDb(db);
      }
      return jsonResponse({ success: true, message: 'Policy updated' });
    }

    if (pathname.match(/^\/api\/owner\/policies\/(\d+)$/) && method === 'DELETE') {
      const id = parseInt(pathname.match(/^\/api\/owner\/policies\/(\d+)$/)[1]);
      db.policies = (db.policies || []).filter((p) => p.id !== id);
      saveDb(db);
      return jsonResponse({ success: true, message: 'Policy removed' });
    }

    // 21. OWNER GUEST EXPERIENCES (PENDING, APPROVED, DECLINED)
    if (pathname === '/api/owner/guest-experiences' && method === 'GET') {
      const pending = (db.guest_experiences || []).filter((g) => g.status === 'PENDING');
      const approved = (db.guest_experiences || []).filter((g) => g.status === 'APPROVED');
      const declined = (db.guest_experiences || []).filter((g) => g.status === 'DECLINED');

      return jsonResponse({
        success: true,
        pending,
        approved,
        declined,
        totalCount: (db.guest_experiences || []).length
      });
    }

    if (pathname.match(/^\/api\/owner\/guest-experiences\/(\d+)$/) && method === 'PATCH') {
      const id = parseInt(pathname.match(/^\/api\/owner\/guest-experiences\/(\d+)$/)[1]);
      const { status } = body;
      if (status === 'DELETE') {
        db.guest_experiences = (db.guest_experiences || []).filter((g) => g.id !== id);
        recordAudit(db, 'CG Owner', 'OWNER', 'GUEST_EXP_DELETED', `ID ${id}`, 'Deleted review');
      } else {
        const exp = (db.guest_experiences || []).find((g) => g.id === id);
        if (exp) {
          exp.status = status;
          exp.reviewed_by = 'CG Owner';
          exp.reviewed_at = new Date().toISOString();
          recordAudit(db, 'CG Owner', 'OWNER', `GUEST_EXP_${status}`, `ID ${id}`, `Marked as ${status}`);
        }
      }
      saveDb(db);
      return jsonResponse({ success: true, message: `Guest experience status updated` });
    }

    // 22. OWNER SETTINGS
    if (pathname === '/api/owner/settings' && method === 'GET') {
      return jsonResponse({ success: true, settings: db.settings || {} });
    }

    if (pathname === '/api/owner/settings' && method === 'PATCH') {
      db.settings = { ...(db.settings || {}), ...body };
      recordAudit(db, 'CG Owner', 'OWNER', 'SETTINGS_UPDATED', 'Settings', 'Updated system settings');
      saveDb(db);
      return jsonResponse({ success: true, message: 'Settings saved' });
    }

    // 23. OWNER USERS
    if (pathname === '/api/owner/users' && method === 'GET') {
      return jsonResponse({ success: true, users: db.users || [] });
    }

    if (pathname === '/api/owner/users' && method === 'POST') {
      const { name, email, password, role } = body;
      const newUser = {
        id: db.users.length + 1,
        name,
        email,
        password,
        role,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      };
      db.users.push(newUser);
      recordAudit(db, 'CG Owner', 'OWNER', 'USER_CREATED', email, `Created ${role} account`);
      saveDb(db);
      return jsonResponse({ success: true, message: 'User created', userId: newUser.id });
    }

    if (pathname.match(/^\/api\/owner\/users\/(\d+)$/) && method === 'PATCH') {
      const id = parseInt(pathname.match(/^\/api\/owner\/users\/(\d+)$/)[1]);
      const user = db.users.find((u) => u.id === id);
      if (user) {
        if (body.status) user.status = body.status;
        if (body.role) user.role = body.role;
        if (body.password) user.password = body.password;
        recordAudit(db, 'CG Owner', 'OWNER', 'USER_UPDATED', user.email, 'Updated user details');
        saveDb(db);
      }
      return jsonResponse({ success: true, message: 'User updated' });
    }

    // 24. OWNER AUDIT LOGS
    if (pathname === '/api/owner/audit-logs' && method === 'GET') {
      return jsonResponse({ success: true, logs: db.audit_logs || [] });
    }

    // 25. SHEETS LOG
    if (pathname === '/api/owner/sheets-log' && method === 'GET') {
      return jsonResponse({ success: true, logs: [] });
    }

    return originalFetch(url, options);
  };
};
