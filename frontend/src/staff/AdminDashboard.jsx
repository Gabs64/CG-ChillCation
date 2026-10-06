import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, CheckCircle, Clock, Filter, Search, UserCheck, ShieldCheck, MapPin,
  ChevronLeft, ChevronRight, RotateCcw, QrCode, LogIn, LogOut, DollarSign,
  AlertCircle, ShieldAlert, ArrowRight, Eye, ExternalLink, Loader2, Check,
  Camera, X, RefreshCw, Upload, Video, VideoOff, CheckCircle2, SwitchCamera,
  Plus, Bed, Grid, Layers, Building, HelpCircle, Phone, Mail, Tag, Globe
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import CustomModal from '../shared/CustomModal';

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AdminDashboard({ token, currentUser }) {
  const isCustomerSupport = currentUser?.role === 'CUSTOMER_SUPPORT';

  // Navigation Tabs: 'daily_log', 'qr_scanner', 'calendar', 'bookings', 'room_status'
  const [activeTab, setActiveTab] = useState(isCustomerSupport ? 'calendar' : 'daily_log');

  // Daily Arrivals & Departures State (Section 27, 28, 29, 57, 58)
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [dailyData, setDailyData] = useState({ arrivals: [], departures: [], inHouse: [], summary: {} });
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [dailySubTab, setDailySubTab] = useState('arrivals'); // 'arrivals', 'departures', 'in_house'

  // QR Scanner State (Section 34, 35, 36, 37)
  const [scannedRefInput, setScannedRefInput] = useState('');
  const [scannedBooking, setScannedBooking] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [qrScanError, setQrScanError] = useState(null);
  const [scannerMode, setScannerMode] = useState('camera'); // 'camera', 'upload', 'manual'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState(false);
  const [cooldownCountdown, setCooldownCountdown] = useState(0);
  const html5QrScannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastScanTimestampRef = useRef(0);
  const cooldownTimerRef = useRef(null);

  // Master Calendar State
  const [calendarSubView, setCalendarSubView] = useState('matrix'); // 'matrix' (Timeline Grid: Days as cols, Rooms as rows) or 'per_room' (Calendar per room)
  const [selectedRoomIdForPerRoom, setSelectedRoomIdForPerRoom] = useState(null);
  const [calendarRooms, setCalendarRooms] = useState([]);
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()); // 0-11
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(today);

  // Manual Booking Modal State
  const [isManualBookingModalOpen, setIsManualBookingModalOpen] = useState(false);
  const [manualBookingForm, setManualBookingForm] = useState({
    roomId: '',
    guestName: '',
    guestCount: 2,
    contactNumber: '',
    email: '',
    vehicle: 'None',
    age: 25,
    checkIn: '',
    checkOut: '',
    bookingSource: 'Direct / Walk-in',
    totalAmount: 0,
    amountPaid: 0,
    paymentMethod: 'Cash',
    paymentReference: '',
    notes: ''
  });
  const [isSubmittingManualBooking, setIsSubmittingManualBooking] = useState(false);
  const [manualBookingError, setManualBookingError] = useState(null);
  const [manualBookingSuccess, setManualBookingSuccess] = useState(null);

  // All Bookings State (Section 41, 42, 43, 44)
  const [allBookings, setAllBookings] = useState([]);
  const [bookingFilterDate, setBookingFilterDate] = useState('All'); // 'All', 'Today', 'Yesterday', 'Tomorrow', 'This Week', 'This Month'
  const [bookingFilterLocation, setBookingFilterLocation] = useState('All');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('All');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Room Status Page State (Section 24, 25)
  const [roomStatuses, setRoomStatuses] = useState([]);
  const [isLoadingRoomStatus, setIsLoadingRoomStatus] = useState(false);

  // Booking Detail Modal State
  const [selectedBookingForModal, setSelectedBookingForModal] = useState(null);

  // Enforce customer support role lock
  useEffect(() => {
    if (isCustomerSupport && activeTab !== 'calendar') {
      setActiveTab('calendar');
    }
  }, [isCustomerSupport, activeTab]);

  // Auto-refresh when tabs change
  useEffect(() => {
    if (activeTab === 'daily_log') fetchDailyArrivalsDepartures(selectedDate);
    if (activeTab === 'calendar') fetchCalendarData();
    if (activeTab === 'bookings') fetchAllBookings();
    if (activeTab === 'room_status') fetchRoomStatuses();
  }, [activeTab, selectedDate]);

  // 1. Fetch Daily Arrivals & Departures (Section 27-29)
  const fetchDailyArrivalsDepartures = async (dateStr) => {
    setIsLoadingDaily(true);
    try {
      const res = await fetch(`/api/admin/arrivals-departures?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDailyData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDaily(false);
    }
  };

  // Date Navigators
  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    const prev = new Date(current.getTime() - 86400000);
    setSelectedDate(formatDate(prev));
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    const next = new Date(current.getTime() + 86400000);
    setSelectedDate(formatDate(next));
  };

  const handleToday = () => {
    setSelectedDate(formatDate(new Date()));
  };

  // 2. Fetch Master Calendar
  const fetchCalendarData = async () => {
    setIsLoadingCalendar(true);
    try {
      const res = await fetch('/api/admin/calendar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        const fetchedRooms = data.rooms || [];
        setCalendarRooms(fetchedRooms);
        setCalendarBookings(data.bookings || []);
        if (fetchedRooms.length > 0 && !selectedRoomIdForPerRoom) {
          setSelectedRoomIdForPerRoom(fetchedRooms[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Open Manual Booking Modal
  const handleOpenManualBooking = (preselectedRoomId = null, preselectedCheckIn = null) => {
    const targetRoomId = preselectedRoomId || selectedRoomIdForPerRoom || (calendarRooms[0]?.id) || '';
    const selectedRoom = calendarRooms.find(r => String(r.id) === String(targetRoomId)) || calendarRooms[0];
    const checkIn = preselectedCheckIn || formatDate(new Date());
    const dIn = new Date(checkIn);
    const dOut = new Date(dIn.getTime() + 86400000);
    const checkOut = formatDate(dOut);
    const nightlyPrice = selectedRoom ? Number(selectedRoom.price_per_night || 2500) : 2500;

    setManualBookingForm({
      roomId: targetRoomId,
      guestName: '',
      guestCount: 2,
      contactNumber: '',
      email: '',
      vehicle: 'None',
      age: 25,
      checkIn: checkIn,
      checkOut: checkOut,
      bookingSource: 'Direct / Walk-in',
      totalAmount: nightlyPrice,
      amountPaid: nightlyPrice,
      paymentMethod: 'Cash',
      paymentReference: '',
      notes: ''
    });
    setManualBookingError(null);
    setManualBookingSuccess(null);
    setIsManualBookingModalOpen(true);
  };

  // Update form fields and recalculate totals automatically
  const handleManualFormChange = (field, value) => {
    setManualBookingForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // If room or dates changed, calculate nights and price
      if (field === 'roomId' || field === 'checkIn' || field === 'checkOut') {
        const rId = field === 'roomId' ? value : updated.roomId;
        const cIn = field === 'checkIn' ? value : updated.checkIn;
        const cOut = field === 'checkOut' ? value : updated.checkOut;
        
        const roomObj = calendarRooms.find(r => String(r.id) === String(rId));
        if (roomObj && cIn && cOut) {
          const d1 = new Date(cIn);
          const d2 = new Date(cOut);
          const diffTime = d2.getTime() - d1.getTime();
          const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
          const estimatedTotal = Number(roomObj.price_per_night || 2500) * nights;
          updated.totalAmount = estimatedTotal;
          if (updated.amountPaid === prev.totalAmount || updated.amountPaid === 0) {
            updated.amountPaid = estimatedTotal;
          }
        }
      }
      return updated;
    });
  };

  // Submit Manual Booking
  const handleSubmitManualBooking = async (e) => {
    e.preventDefault();
    setManualBookingError(null);
    setManualBookingSuccess(null);
    setIsSubmittingManualBooking(true);

    try {
      if (!manualBookingForm.roomId) {
        throw new Error('Please select a suite/room.');
      }
      if (!manualBookingForm.guestName.trim()) {
        throw new Error('Please enter the guest name.');
      }
      if (new Date(manualBookingForm.checkOut) <= new Date(manualBookingForm.checkIn)) {
        throw new Error('Check-out date must be after check-in date.');
      }

      const res = await fetch('/api/admin/bookings/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(manualBookingForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create manual reservation.');
      }

      setManualBookingSuccess(`Manual booking ${data.referenceNumber} created successfully!`);
      await fetchCalendarData();
      if (activeTab === 'bookings') fetchAllBookings();
      setTimeout(() => {
        setIsManualBookingModalOpen(false);
        setManualBookingSuccess(null);
      }, 1400);
    } catch (err) {
      setManualBookingError(err.message);
    } finally {
      setIsSubmittingManualBooking(false);
    }
  };



  // 3. Fetch All Bookings
  const fetchAllBookings = async () => {
    setIsLoadingBookings(true);
    try {
      let queryParams = new URLSearchParams();
      if (bookingFilterLocation !== 'All') queryParams.append('location', bookingFilterLocation);
      if (bookingFilterStatus !== 'All') queryParams.append('status', bookingFilterStatus);
      if (bookingSearchQuery) queryParams.append('search', bookingSearchQuery);

      const res = await fetch(`/api/admin/bookings?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        let list = data.bookings || [];

        // Apply client date preset filters if active
        const todayStr = formatDate(new Date());
        const yesterdayStr = formatDate(new Date(Date.now() - 86400000));
        const tomorrowStr = formatDate(new Date(Date.now() + 86400000));

        if (bookingFilterDate === 'Today') {
          list = list.filter((b) => b.check_in === todayStr || b.check_out === todayStr);
        } else if (bookingFilterDate === 'Yesterday') {
          list = list.filter((b) => b.check_in === yesterdayStr || b.check_out === yesterdayStr);
        } else if (bookingFilterDate === 'Tomorrow') {
          list = list.filter((b) => b.check_in === tomorrowStr || b.check_out === tomorrowStr);
        }

        setAllBookings(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // 4. Fetch Room Statuses
  const fetchRoomStatuses = async () => {
    setIsLoadingRoomStatus(true);
    try {
      const res = await fetch('/api/admin/room-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRoomStatuses(data.roomStatuses || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRoomStatus(false);
    }
  };

  // Check-In / Check-Out Actions
  const handleUpdateCheckInStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/checkin-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ checkInStatus: newStatus })
      });
      if (res.ok) {
        fetchDailyArrivalsDepartures(selectedDate);
        fetchAllBookings();
        fetchRoomStatuses();
        if (selectedBookingForModal && selectedBookingForModal.id === bookingId) {
          setSelectedBookingForModal((prev) => ({ ...prev, check_in_status: newStatus }));
        }
        if (scannedBooking && scannedBooking.id === bookingId) {
          handleLookupQR(scannedBooking.reference_number);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Security Deposit Actions (Section 32, 33)
  const handleSecurityDepositAction = async (bookingId, action, notes = '') => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/security-deposit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, notes })
      });
      if (res.ok) {
        fetchDailyArrivalsDepartures(selectedDate);
        fetchAllBookings();
        if (scannedBooking && scannedBooking.id === bookingId) {
          handleLookupQR(scannedBooking.reference_number);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Audio Feedback using Web Audio API
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  // Helper to extract clean booking reference from QR string/URL
  const extractReferenceCode = (raw) => {
    if (!raw) return '';
    const match = String(raw).match(/CGC-\d{8}-\d{4}/i);
    if (match) return match[0].toUpperCase();
    return String(raw).trim();
  };

  const handleScannedResult = async (decodedText) => {
    const ref = extractReferenceCode(decodedText);
    if (!ref) return;

    const now = Date.now();
    // 3-second cooldown throttle to prevent duplicate rapid scans
    if (now - lastScanTimestampRef.current < 3000) {
      return;
    }
    lastScanTimestampRef.current = now;

    playBeep();
    setScanSuccessFeedback(true);
    setScannedRefInput(ref);

    // 3-second visual countdown
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    setCooldownCountdown(3);
    cooldownTimerRef.current = setInterval(() => {
      setCooldownCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current);
          setScanSuccessFeedback(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    await handleLookupQR(ref);
  };

  // Stop Camera Scanner
  const stopCameraScanner = async () => {
    if (html5QrScannerRef.current) {
      try {
        if (html5QrScannerRef.current.isScanning) {
          await html5QrScannerRef.current.stop();
        }
        await html5QrScannerRef.current.clear();
      } catch (err) {
        console.warn('Camera stop warning:', err);
      }
      html5QrScannerRef.current = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
  };

  // Start Live Camera Scanner
  const startCameraScanner = async (cameraIdToUse) => {
    setQrScanError(null);
    setIsStartingCamera(true);

    try {
      if (html5QrScannerRef.current) {
        await stopCameraScanner();
      }

      let devices = [];
      try {
        devices = await Html5Qrcode.getCameras();
        setCameraDevices(devices);
      } catch (e) {
        console.warn('Could not enumerate cameras:', e);
      }

      const targetCamera = cameraIdToUse || selectedCameraId || (devices.length > 0 ? (devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'))?.id || devices[0].id) : { facingMode: 'environment' });

      const qrScanner = new Html5Qrcode('qr-reader-viewport');
      html5QrScannerRef.current = qrScanner;

      await qrScanner.start(
        targetCamera,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScannedResult(decodedText);
        },
        () => {}
      );

      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera startup error:', err);
      let msg = 'Unable to access camera. Please allow camera permissions in your browser or use image upload / reference input.';
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        msg = 'Live camera scanning requires HTTPS. You can upload voucher screenshots or enter the reference code below.';
      }
      setQrScanError(msg);
      setIsCameraActive(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Switch camera device
  const handleSwitchCamera = async (newCameraId) => {
    setSelectedCameraId(newCameraId);
    if (isCameraActive) {
      await startCameraScanner(newCameraId);
    }
  };

  // Scan from Uploaded File
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrScanError(null);
    setIsScanning(true);

    try {
      const tempScanner = new Html5Qrcode('qr-reader-file-temp');
      const decoded = await tempScanner.scanFile(file, true);
      await tempScanner.clear();
      await handleScannedResult(decoded);
    } catch (err) {
      setQrScanError('Could not detect a valid QR Code in this image. Please ensure the QR code is clearly visible, or enter the reference number manually.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Cleanup camera when switching tabs or unmounting
  useEffect(() => {
    if (activeTab !== 'qr_scanner') {
      stopCameraScanner();
    }
    return () => {
      stopCameraScanner();
    };
  }, [activeTab]);

  // QR Code Verification (Section 34-37)
  const handleLookupQR = async (ref) => {
    if (!ref || !ref.trim()) return;
    setIsScanning(true);
    setQrScanError(null);

    try {
      const cleanRef = ref.trim();
      const res = await fetch(`/api/admin/qr/lookup/${encodeURIComponent(cleanRef)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        setQrScanError(data.error || 'No matching booking found for this QR code.');
        setScannedBooking(null);
      } else {
        setScannedBooking(data.booking);
      }
    } catch (err) {
      setQrScanError('Failed to verify QR Code.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateRoomOperationalStatus = async (roomId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchRoomStatuses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const allStaffTabs = [
    { id: 'daily_log', label: 'Daily Arrivals & Departures', desc: 'Check-in & Check-out Flow', icon: Clock },
    { id: 'qr_scanner', label: 'QR Scanner', desc: 'Fast Booking Verification', icon: QrCode },
    { id: 'calendar', label: 'Master Calendar', desc: 'Visual Schedule & Timeline', icon: Calendar },
    { id: 'bookings', label: 'All Bookings Log', desc: 'Search & Snapshot Records', icon: Search },
    { id: 'room_status', label: 'Room Status', desc: 'Real-time Suite Conditions', icon: ShieldCheck },
  ];

  const staffNavTabs = isCustomerSupport
    ? [{ id: 'calendar', label: 'Master Calendar', desc: 'Visual Schedule & Room Calendars', icon: Calendar }]
    : allStaffTabs;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch lg:items-start pb-16">
      
      {/* ================= STAFF / SUPPORT OPERATIONAL SIDEBAR NAV ================= */}
      <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-28 z-20">
        <div className="liquid-glass rounded-3xl p-3 sm:p-4 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-3">
          
          <div className="px-3 py-2 border-b border-white/5 hidden lg:flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 block">
                {isCustomerSupport ? 'Support Operations' : 'Operations Menu'}
              </span>
              <span className="text-[9px] font-mono text-zinc-500 block uppercase">
                {currentUser?.role ? currentUser.role.replace('_', ' ') : 'Staff & Support'}
              </span>
            </div>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold border ${
              isCustomerSupport 
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                : 'bg-white/10 text-zinc-300 border-white/10'
            }`}>
              {isCustomerSupport ? 'SUPPORT' : 'STAFF'}
            </span>
          </div>

          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 no-scrollbar">
            {staffNavTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-auto lg:w-full px-3.5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-between gap-3 group text-left ${
                    isActive
                      ? 'bg-white text-black shadow-lg shadow-white/10 scale-[1.01]'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isActive ? 'bg-black text-white' : 'bg-white/5 text-zinc-400 group-hover:text-white group-hover:bg-white/10'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate font-bold text-[11px] sm:text-xs">{tab.label}</span>
                      <span className={`hidden lg:block text-[9px] font-mono normal-case tracking-normal truncate ${
                        isActive ? 'text-zinc-600 font-medium' : 'text-zinc-500 group-hover:text-zinc-400'
                      }`}>
                        {tab.desc}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ================= ACTIVE TAB MAIN CONTENT ================= */}
      <div className="flex-1 min-w-0 space-y-6">

      {/* ================= TAB 1: DAILY ARRIVALS & DEPARTURES LOG (Section 27-33, 57-58) ================= */}
      {activeTab === 'daily_log' && (
        <div className="space-y-6">
          
          {/* Header & Easy Date Switcher Bar (Section 28, 29) */}
          <div className="p-4 sm:p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">
                Asia/Manila System Date
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Daily Arrival & Departure Management
              </h2>
            </div>

            {/* Easy Date Switcher Controls */}
            <div className="flex items-center space-x-2 self-start md:self-auto">
              <button
                onClick={handlePrevDay}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center space-x-1"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev Day</span>
              </button>

              <button
                onClick={handleToday}
                className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider shadow-md hover:bg-zinc-200"
              >
                Today
              </button>

              <button
                onClick={handleNextDay}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center space-x-1"
                title="Next Day"
              >
                <span className="hidden sm:inline">Next Day</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          {/* Quick Metrics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => setDailySubTab('arrivals')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                dailySubTab === 'arrivals' ? 'bg-white/10 border-white shadow-lg' : 'bg-black/40 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Arrivals on {selectedDate}</span>
                <LogIn className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-2xl font-black text-white font-mono">
                {dailyData.arrivals?.length || 0}
              </span>
            </div>

            <div
              onClick={() => setDailySubTab('departures')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                dailySubTab === 'departures' ? 'bg-white/10 border-white shadow-lg' : 'bg-black/40 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Departures on {selectedDate}</span>
                <LogOut className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-2xl font-black text-white font-mono">
                {dailyData.departures?.length || 0}
              </span>
            </div>

            <div
              onClick={() => setDailySubTab('in_house')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                dailySubTab === 'in_house' ? 'bg-white/10 border-white shadow-lg' : 'bg-black/40 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Currently In-House</span>
                <UserCheck className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-2xl font-black text-white font-mono">
                {dailyData.inHouse?.length || 0}
              </span>
            </div>
          </div>

          {/* List Table */}
          <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                {dailySubTab === 'arrivals' && `Scheduled Arrivals for ${selectedDate}`}
                {dailySubTab === 'departures' && `Scheduled Departures for ${selectedDate}`}
                {dailySubTab === 'in_house' && 'Active In-House Guests'}
              </h3>
              <span className="text-xs font-mono text-zinc-400">
                Auto-synced with SQLite &bull; Asia/Manila Time
              </span>
            </div>

            {isLoadingDaily ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
              </div>
            ) : (
              (() => {
                const list = dailySubTab === 'arrivals'
                  ? dailyData.arrivals
                  : dailySubTab === 'departures'
                  ? dailyData.departures
                  : dailyData.inHouse;

                if (!list || list.length === 0) {
                  return (
                    <div className="text-center py-12 text-zinc-500 text-xs italic">
                      No bookings recorded for this category on {selectedDate}.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {list.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-white/20 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black text-white">{b.room_name}</span>
                            <span className="text-xs text-zinc-400 font-mono">({b.location})</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-zinc-200 border border-white/15">
                              {b.reference_number}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              b.check_in_status === 'CHECKED_IN'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : b.check_in_status === 'CHECKED_OUT'
                                ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}>
                              {b.check_in_status}
                            </span>
                          </div>

                          <div className="text-xs text-zinc-300 flex flex-wrap gap-x-4 gap-y-1">
                            <span><strong>Guest:</strong> {b.guest_name} ({b.guest_count} pax)</span>
                            <span><strong>Phone:</strong> {b.contact_number}</span>
                            <span><strong>Vehicle:</strong> {b.vehicle}</span>
                            <span><strong>Stay:</strong> {b.check_in} &rarr; {b.check_out}</span>
                          </div>

                          {/* Security Deposit Badge (Section 31) */}
                          <div className="pt-1 flex items-center space-x-2 text-[11px] font-mono">
                            <span className="text-zinc-400">Security Deposit (₱1,000):</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase border ${
                              b.deposit_status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : b.deposit_status === 'REFUNDED'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}>
                              {b.deposit_status || 'PENDING'}
                            </span>
                            {b.deposit_paid_by && (
                              <span className="text-zinc-500">Paid to: {b.deposit_paid_by}</span>
                            )}
                          </div>
                        </div>

                        {/* Operational Action Buttons (Section 32, 33, 57, 58) */}
                        <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto flex-shrink-0">
                          
                          {/* Deposit Confirmation Button */}
                          {b.deposit_status !== 'PAID' && b.deposit_status !== 'REFUNDED' && (
                            <button
                              onClick={() => handleSecurityDepositAction(b.id, 'CONFIRM_PAYMENT')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 transition-all flex items-center space-x-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Confirm Deposit</span>
                            </button>
                          )}

                          {/* Deposit Refund Button */}
                          {b.deposit_status === 'PAID' && (
                            <button
                              onClick={() => handleSecurityDepositAction(b.id, 'MARK_REFUNDED')}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition-all flex items-center space-x-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Mark Deposit Refunded</span>
                            </button>
                          )}

                          {/* Check-In Action Button */}
                          {b.check_in_status === 'NOT_CHECKED_IN' && (
                            <button
                              onClick={() => handleUpdateCheckInStatus(b.id, 'CHECKED_IN')}
                              className="liquid-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase flex items-center space-x-1 shadow-md"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Mark Check-In</span>
                            </button>
                          )}

                          {/* Check-Out Action Button */}
                          {b.check_in_status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleUpdateCheckInStatus(b.id, 'CHECKED_OUT')}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all flex items-center space-x-1"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Mark Check-Out</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedBookingForModal(b)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs"
                            title="View Full Breakdown Snapshot"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>

        </div>
      )}

      {/* ================= TAB 2: QR CODE SCANNER (Section 34-37) ================= */}
      {activeTab === 'qr_scanner' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          
          {/* Main Scanner Control Center */}
          <div className="p-6 sm:p-8 rounded-3xl liquid-glass border border-white/15 text-center space-y-6 shadow-2xl">
            
            {/* Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-white via-zinc-200 to-zinc-400 text-black shadow-xl shadow-white/10 mb-2">
                <QrCode className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Live QR Code Scanner
              </h2>
              <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Scan guest digital booking vouchers in real-time with your device camera, upload screenshot images, or search by reference code.
              </p>
            </div>

            {/* Scanner Mode Switcher */}
            <div className="inline-flex p-1.5 rounded-2xl bg-black/60 border border-white/10 gap-1 max-w-md mx-auto">
              <button
                onClick={() => {
                  setScannerMode('camera');
                  setQrScanError(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
                  scannerMode === 'camera'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Live Camera</span>
              </button>

              <button
                onClick={() => {
                  setScannerMode('upload');
                  setQrScanError(null);
                  stopCameraScanner();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
                  scannerMode === 'upload'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
              </button>

              <button
                onClick={() => {
                  setScannerMode('manual');
                  setQrScanError(null);
                  stopCameraScanner();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
                  scannerMode === 'manual'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Reference</span>
              </button>
            </div>

            {/* MODE 1: LIVE CAMERA SCANNER */}
            {scannerMode === 'camera' && (
              <div className="space-y-4 max-w-md mx-auto">
                <div className="relative w-full aspect-square max-w-[340px] mx-auto rounded-3xl overflow-hidden bg-black/90 border border-white/20 shadow-2xl flex items-center justify-center">
                  
                  {/* Camera Video Viewport */}
                  <div id="qr-reader-viewport" className="w-full h-full" />

                  {/* Laser & Reticle Overlay when Camera Active */}
                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                      {/* Targeting Corners */}
                      <div className="relative w-full h-full border-2 border-white/20 rounded-2xl overflow-hidden">
                        {/* 4 Corner Accents */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />

                        {/* Animated Laser Scan Line */}
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-500/50 animate-scan-laser" />
                      </div>
                    </div>
                  )}

                  {/* Placeholder when Camera is inactive */}
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4 text-center bg-black/80 backdrop-blur-sm">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                        <Camera className="w-8 h-8" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">Camera Inactive</span>
                        <span className="text-xs text-zinc-400 block mt-1">
                          Click below to start live stream scanning
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isStartingCamera}
                        onClick={() => startCameraScanner()}
                        className="liquid-btn-primary px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 shadow-xl hover:scale-105 transition-all"
                      >
                        {isStartingCamera ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                        <span>{isStartingCamera ? 'Opening Camera...' : 'Launch Live Camera'}</span>
                      </button>
                    </div>
                  )}

                </div>

                {/* Camera Controls Bar */}
                {isCameraActive && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {cameraDevices.length > 1 && (
                      <select
                        value={selectedCameraId}
                        onChange={(e) => handleSwitchCamera(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-black/80 border border-white/20 text-white text-xs font-mono focus:outline-none"
                      >
                        {cameraDevices.map((cam, idx) => (
                          <option key={cam.id} value={cam.id}>
                            {cam.label || `Camera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={stopCameraScanner}
                      className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
                    >
                      <VideoOff className="w-3.5 h-3.5" />
                      <span>Stop Camera</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: UPLOAD IMAGE VOUCHER */}
            {scannerMode === 'upload' && (
              <div className="space-y-4 max-w-md mx-auto">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {/* Hidden container for file decoder */}
                <div id="qr-reader-file-temp" className="hidden" />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 rounded-3xl border-2 border-dashed border-white/20 hover:border-white/50 bg-black/40 hover:bg-white/5 cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {isScanning ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      {isScanning ? 'Decoding QR Code...' : 'Upload Voucher Image or Screenshot'}
                    </span>
                    <span className="text-xs text-zinc-400 block mt-1">
                      Click to browse PNG, JPG, or WebP files
                    </span>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold uppercase tracking-wider group-hover:bg-white group-hover:text-black transition-colors"
                  >
                    Select File
                  </button>
                </div>
              </div>
            )}

            {/* MODE 3: MANUAL REFERENCE INPUT & USB BARCODE */}
            {scannerMode === 'manual' && (
              <div className="space-y-4 max-w-md mx-auto">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLookupQR(scannedRefInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="e.g. CGC-20261006-1001"
                    value={scannedRefInput}
                    onChange={(e) => setScannedRefInput(e.target.value)}
                    className="flex-1 h-12 px-4 rounded-xl bg-black/80 border border-white/20 text-white text-xs font-mono uppercase focus:outline-none focus:border-white/50"
                  />
                  <button
                    type="submit"
                    disabled={isScanning}
                    className="liquid-btn-primary px-5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5"
                  >
                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Lookup</span>
                  </button>
                </form>
              </div>
            )}

            {/* Quick Demo QR Links */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap justify-center items-center gap-2 text-xs">
              <span className="text-zinc-500 font-mono text-[11px]">Quick Samples:</span>
              <button
                onClick={() => {
                  setScannedRefInput('CGC-20261006-1001');
                  handleLookupQR('CGC-20261006-1001');
                }}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 font-mono text-[11px] border border-white/10 transition-colors"
              >
                CGC-20261006-1001 (Room 01)
              </button>
              <button
                onClick={() => {
                  setScannedRefInput('CGC-20261006-1002');
                  handleLookupQR('CGC-20261006-1002');
                }}
                className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 font-mono text-[11px] border border-white/10 transition-colors"
              >
                CGC-20261006-1002 (Room 08)
              </button>
            </div>

          </div>

          {/* Cooldown & Success Notification Banner */}
          {scanSuccessFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between shadow-2xl animate-fade-in">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold text-sm block text-white">QR Code Verified Successfully!</span>
                  <span className="font-mono text-emerald-300/90 text-xs">
                    Voucher reference <strong className="text-white underline">{scannedRefInput}</strong> matched in database.
                  </span>
                </div>
              </div>
              {cooldownCountdown > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-400/30 text-emerald-300 font-mono text-xs flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Cooldown: Ready in {cooldownCountdown}s</span>
                </div>
              )}
            </div>
          )}

          {/* Scanner Cooldown Standalone Indicator (if success banner is hidden but cooldown active) */}
          {!scanSuccessFeedback && cooldownCountdown > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-fade-in font-mono">
              <span>Scanner cooldown active to prevent double scans...</span>
              <span className="font-bold">{cooldownCountdown}s</span>
            </div>
          )}

          {/* Error Banner */}
          {qrScanError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{qrScanError}</span>
            </div>
          )}

          {/* QR Scanned Booking Result Display (Comprehensive Dossier) */}
          {scannedBooking && (
            <div className="p-6 sm:p-8 rounded-3xl bg-black/70 border border-white/20 space-y-6 animate-fade-in shadow-2xl backdrop-blur-xl">
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      VERIFIED VOUCHER
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      Ref: {scannedBooking.reference_number}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {scannedBooking.room_name || `Suite Room #${scannedBooking.room_id}`}
                  </h3>
                  <span className="text-xs text-zinc-400 block">
                    📍 Location: <strong className="text-white">{scannedBooking.location || 'Antipolo / Cainta'}</strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-4 py-2 rounded-2xl text-xs font-mono font-black uppercase tracking-wider ${
                    scannedBooking.check_in_status === 'CHECKED_IN'
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                      : scannedBooking.check_in_status === 'CHECKED_OUT'
                      ? 'bg-zinc-700 text-zinc-300'
                      : 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  }`}>
                    {scannedBooking.check_in_status === 'CHECKED_IN' ? '✓ IN-HOUSE (CHECKED IN)' : scannedBooking.check_in_status === 'CHECKED_OUT' ? 'CHECKED OUT' : 'NOT CHECKED IN YET'}
                  </span>

                  <button
                    onClick={() => {
                      setScannedBooking(null);
                      setScannedRefInput('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Scan Next
                  </button>
                </div>
              </div>

              {/* Grid 1: Guest Information & Stay Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guest Profile Card */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">
                    Primary Guest & Contact
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Guest Name:</span>
                      <strong className="text-white text-sm">{scannedBooking.guest_name}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Total Guests:</span>
                      <span className="text-white font-mono">{scannedBooking.guest_count} Person(s)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Contact Number:</span>
                      <span className="text-emerald-400 font-mono font-bold">{scannedBooking.contact_number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Email:</span>
                      <span className="text-zinc-300 font-mono truncate max-w-[180px]">{scannedBooking.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Vehicle / Parking:</span>
                      <span className="text-white font-mono">{scannedBooking.vehicle || 'None'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Primary Guest Age:</span>
                      <span className="text-white font-mono">{scannedBooking.age || '18+'} yrs old</span>
                    </div>
                  </div>
                </div>

                {/* Stay Schedule Card */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">
                    Stay Duration & Timings
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono block">Check-In Date</span>
                        <strong className="text-white text-sm font-mono">{scannedBooking.check_in}</strong>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">From 2:00 PM</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono block">Check-Out Date</span>
                        <strong className="text-white text-sm font-mono">{scannedBooking.check_out}</strong>
                      </div>
                      <span className="text-xs font-mono text-zinc-400">By 12:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Financial & Payment Status Matrix */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/15 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-black">
                    Financial & Payment Breakdown
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-white/10 text-white border border-white/20">
                    Paid via: {scannedBooking.payment_method || 'Online Gateway'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-[10px] text-zinc-400 uppercase block">Total Stay</span>
                    <strong className="text-white text-sm">
                      ₱{(Number(scannedBooking.breakdown?.total_amount || scannedBooking.amount || 0)).toLocaleString()}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-[10px] text-emerald-400 uppercase block">Down Payment Paid</span>
                    <strong className="text-emerald-300 text-sm">
                      ₱{(Number(scannedBooking.breakdown?.down_payment || scannedBooking.amount || 0)).toLocaleString()}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-[10px] text-zinc-400 uppercase block">Remaining Balance</span>
                    <strong className={`text-sm ${
                      Number(scannedBooking.breakdown?.remaining_balance || 0) <= 0
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}>
                      ₱{(Number(scannedBooking.breakdown?.remaining_balance || 0)).toLocaleString()}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-[10px] text-zinc-400 uppercase block">Security Deposit (₱1,000)</span>
                    <strong className={`text-sm uppercase ${
                      scannedBooking.securityDeposit?.payment_status === 'PAID'
                        ? 'text-emerald-400'
                        : scannedBooking.securityDeposit?.payment_status === 'REFUNDED'
                        ? 'text-blue-400'
                        : 'text-amber-400'
                    }`}>
                      {scannedBooking.securityDeposit?.payment_status || 'PENDING'}
                    </strong>
                  </div>
                </div>

                {/* Security Deposit Quick Collect / Refund Action */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">Refundable Security Deposit (₱1,000)</span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Must be collected upon key handover and inspected upon checkout departure.
                    </span>
                  </div>

                  {scannedBooking.securityDeposit?.payment_status !== 'PAID' ? (
                    <button
                      onClick={() => handleSecurityDepositAction(scannedBooking.id, 'CONFIRM_PAYMENT')}
                      className="px-4 py-2 rounded-xl text-xs font-bold uppercase bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-md self-start sm:self-auto"
                    >
                      Collect ₱1,000 Deposit
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSecurityDepositAction(scannedBooking.id, 'MARK_REFUNDED')}
                      className="px-4 py-2 rounded-xl text-xs font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30 self-start sm:self-auto"
                    >
                      Mark ₱1,000 Refunded
                    </button>
                  )}
                </div>
              </div>

              {/* Action Controls Bar: Check-In / Check-Out */}
              <div className="pt-4 border-t border-white/15 flex flex-wrap gap-3 justify-between items-center">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForModal(scannedBooking)}
                  className="px-5 py-3 rounded-2xl text-xs font-bold uppercase bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center space-x-2 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Full Snapshot</span>
                </button>

                <div className="flex flex-wrap gap-2">
                  {scannedBooking.check_in_status === 'NOT_CHECKED_IN' && (
                    <button
                      onClick={() => handleUpdateCheckInStatus(scannedBooking.id, 'CHECKED_IN')}
                      className="liquid-btn-primary px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 shadow-2xl hover:scale-105 transition-all"
                    >
                      <CheckCircle className="w-5 h-5 text-white" />
                      <span>MARK CHECK-IN</span>
                    </button>
                  )}

                  {scannedBooking.check_in_status === 'CHECKED_IN' && (
                    <button
                      onClick={() => handleUpdateCheckInStatus(scannedBooking.id, 'CHECKED_OUT')}
                      className="px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-rose-600 text-white hover:bg-rose-500 transition-all flex items-center space-x-2 shadow-2xl hover:scale-105"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>MARK CHECK-OUT</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= TAB 3: MASTER CALENDAR ================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          
          {/* Calendar Control Bar */}
          <div className="p-4 sm:p-5 rounded-3xl liquid-glass border border-white/15 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block font-bold">
                  Visual Schedule Matrix
                </span>
                {isCustomerSupport && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    SUPPORT DESK VIEW
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight">
                Master Reservation Calendar
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Month Navigation */}
              <div className="inline-flex items-center bg-black/60 p-1 rounded-2xl border border-white/15 shadow-inner">
                <button
                  onClick={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear((y) => y - 1);
                    } else {
                      setCalendarMonth((m) => m - 1);
                    }
                  }}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    const now = new Date();
                    setCalendarMonth(now.getMonth());
                    setCalendarYear(now.getFullYear());
                  }}
                  className="px-3 py-1 rounded-xl text-xs font-bold font-mono text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                  title="Reset to current month"
                >
                  {MONTH_NAMES[calendarMonth]} {calendarYear}
                </button>

                <button
                  onClick={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear((y) => y + 1);
                    } else {
                      setCalendarMonth((m) => m + 1);
                    }
                  }}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* View Toggle: Timeline Matrix vs Calendars Per Room */}
              <div className="inline-flex items-center bg-black/60 p-1 rounded-2xl border border-white/15 shadow-inner">
                <button
                  onClick={() => setCalendarSubView('matrix')}
                  className={`h-8 px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                    calendarSubView === 'matrix'
                      ? 'bg-white text-black shadow-md font-black'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Timeline Matrix</span>
                </button>
                <button
                  onClick={() => {
                    setCalendarSubView('per_room');
                    if (!selectedRoomIdForPerRoom && calendarRooms.length > 0) {
                      setSelectedRoomIdForPerRoom(calendarRooms[0].id);
                    }
                  }}
                  className={`h-8 px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                    calendarSubView === 'per_room'
                      ? 'bg-white text-black shadow-md font-black'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Bed className="w-3.5 h-3.5" />
                  <span>Per Room</span>
                </button>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => handleOpenManualBooking()}
                className="h-10 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Booking</span>
              </button>

              <button
                onClick={fetchCalendarData}
                disabled={isLoadingCalendar}
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/15 flex items-center justify-center transition-colors flex-shrink-0"
                title="Refresh Calendar"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingCalendar ? 'animate-spin text-white' : ''}`} />
              </button>
            </div>
          </div>

          {/* Color Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-[11px] font-mono text-zinc-400">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-zinc-500 uppercase font-bold text-[9px] tracking-wider">Legend:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                <span>Direct / Walk-in</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm"></span>
                <span>Airbnb</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block shadow-sm"></span>
                <span>Agoda</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm"></span>
                <span>Facebook / Chat</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm"></span>
                <span>Pending Payment</span>
              </span>
            </div>
            <span className="text-zinc-400 hidden md:inline">
              Tip: Click any empty cell to create a manual booking for that suite & date.
            </span>
          </div>

          {/* ---------------- VIEW 1: TIMELINE MATRIX (DAYS AS COLUMNS, ROOMS AS ROWS) ---------------- */}
          {calendarSubView === 'matrix' && (
            <div className="rounded-3xl bg-black/70 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
              {isLoadingCalendar ? (
                <div className="text-center py-24">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400 mb-2" />
                  <span className="text-xs font-mono text-zinc-400">Loading master timeline matrix...</span>
                </div>
              ) : calendarRooms.length === 0 ? (
                <div className="text-center py-16 px-6 space-y-4 max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white">No Suites Found</h4>
                    <p className="text-xs text-zinc-400 font-mono">
                      Suites created in Room Management will automatically appear here as rows.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto max-w-full no-scrollbar">
                  <table className="w-full border-collapse min-w-[1100px] text-left">
                    <thead>
                      <tr className="border-b border-white/15 bg-zinc-950/90 sticky top-0 z-20">
                        {/* Sticky Suite/Room Header Column */}
                        <th className="p-3 sm:p-4 w-60 min-w-[240px] sticky left-0 z-30 bg-zinc-950 border-r border-white/10 backdrop-blur-md">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono uppercase font-black tracking-wider text-white">
                              Suite / Room Roster
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-bold">
                              {calendarRooms.length} Units
                            </span>
                          </div>
                        </th>

                        {/* Day of Month Columns */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const dayNum = i + 1;
                          const dateObj = new Date(calendarYear, calendarMonth, dayNum);
                          const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          const dayOfWeekShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
                          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                          const isToday = dateStr === formatDate(new Date());

                          return (
                            <th
                              key={`th-col-${dayNum}`}
                              className={`p-2 text-center min-w-[50px] w-14 border-r border-white/5 font-mono select-none ${
                                isToday
                                  ? 'bg-white/15 text-white font-black ring-1 ring-white/40'
                                  : isWeekend
                                  ? 'bg-white/[0.03] text-zinc-300'
                                  : 'text-zinc-400'
                              }`}
                            >
                              <div className="text-[9px] uppercase font-semibold tracking-tight">{dayOfWeekShort}</div>
                              <div className={`text-xs font-black ${isToday ? 'text-white underline underline-offset-2' : ''}`}>
                                {String(dayNum).padStart(2, '0')}
                              </div>
                              {isToday && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {calendarRooms.map((room) => {
                        return (
                          <tr key={`matrix-room-${room.id}`} className="hover:bg-white/[0.015] transition-colors group">
                            {/* Sticky Room Details Left Column */}
                            <td className="p-3.5 sticky left-0 z-20 bg-zinc-950/95 border-r border-white/10 backdrop-blur-md">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <strong className="text-white text-xs font-bold truncate block">
                                      {room.room_name}
                                    </strong>
                                  </div>
                                  <div className="flex items-center space-x-1.5 text-[10px] font-mono text-zinc-400 mt-0.5">
                                    <span className="truncate">{room.location}</span>
                                    <span>•</span>
                                    <span className="text-zinc-300 font-bold">₱{Number(room.price_per_night || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleOpenManualBooking(room.id)}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white text-zinc-400 hover:text-black border border-white/10 transition-all opacity-70 group-hover:opacity-100 flex-shrink-0"
                                  title={`Book ${room.room_name}`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Day Cells for this Room */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const dayNum = i + 1;
                              const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                              const isToday = dateStr === formatDate(new Date());

                              // Find booking covering this date
                              const booking = calendarBookings.find((b) => {
                                if (Number(b.room_id) !== Number(room.id)) return false;
                                if (b.check_in === b.check_out && b.check_in === dateStr) return true;
                                return dateStr >= b.check_in && dateStr < b.check_out;
                              });

                              if (booking) {
                                const isStartDay = booking.check_in === dateStr;
                                const source = String(booking.payment_method || booking.source || '').toLowerCase();
                                const isAirbnb = source.includes('airbnb');
                                const isAgoda = source.includes('agoda');
                                const isFB = source.includes('facebook') || source.includes('messenger');
                                const isPending = booking.booking_status === 'PENDING_PAYMENT';

                                let styleClasses = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
                                if (isAirbnb) styleClasses = 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30';
                                else if (isAgoda) styleClasses = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30';
                                else if (isFB) styleClasses = 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30';
                                else if (isPending) styleClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';

                                return (
                                  <td
                                    key={`cell-${room.id}-${dayNum}`}
                                    className={`p-1 text-center border-r border-white/5 align-middle relative ${
                                      isToday ? 'bg-white/[0.04]' : ''
                                    }`}
                                  >
                                    <button
                                      onClick={() => setSelectedBookingForModal(booking)}
                                      title={`${booking.guest_name} (${booking.check_in} to ${booking.check_out}) - ${booking.reference_number}`}
                                      className={`w-full h-12 rounded-xl border p-1 text-left flex flex-col justify-between transition-all cursor-pointer shadow-sm ${styleClasses}`}
                                    >
                                      <div className="flex items-center justify-between overflow-hidden">
                                        <span className="text-[9px] font-mono font-bold truncate block">
                                          {isStartDay ? 'IN' : 'STAY'}
                                        </span>
                                        {isAirbnb && <span className="text-[8px] font-bold px-1 rounded bg-rose-500/40">AB</span>}
                                        {isAgoda && <span className="text-[8px] font-bold px-1 rounded bg-cyan-500/40">AG</span>}
                                        {isFB && <span className="text-[8px] font-bold px-1 rounded bg-blue-500/40">FB</span>}
                                      </div>
                                      <span className="text-[9px] font-bold truncate text-white block">
                                        {booking.guest_name ? booking.guest_name.split(' ')[0] : 'Guest'}
                                      </span>
                                    </button>
                                  </td>
                                );
                              }

                              // Vacant Day Cell
                              return (
                                <td
                                  key={`cell-${room.id}-${dayNum}`}
                                  onClick={() => handleOpenManualBooking(room.id, dateStr)}
                                  className={`p-1 text-center border-r border-white/5 align-middle relative group/cell cursor-pointer transition-colors ${
                                    isToday ? 'bg-white/[0.04] hover:bg-white/10' : 'hover:bg-white/5'
                                  }`}
                                  title={`Click to book ${room.room_name} on ${dateStr}`}
                                >
                                  <div className="w-full h-12 rounded-xl flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity bg-white/5 border border-dashed border-white/20">
                                    <Plus className="w-3.5 h-3.5 text-zinc-300" />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ---------------- VIEW 2: CALENDARS PER ROOM ---------------- */}
          {calendarSubView === 'per_room' && (
            <div className="space-y-6">
              {/* Suite Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {calendarRooms.map((room) => {
                  const isSelected = String(room.id) === String(selectedRoomIdForPerRoom);
                  return (
                    <button
                      key={`room-tab-${room.id}`}
                      onClick={() => setSelectedRoomIdForPerRoom(room.id)}
                      className={`px-4 py-3 rounded-2xl text-left border transition-all flex-shrink-0 flex items-center space-x-3 ${
                        isSelected
                          ? 'bg-white text-black border-white shadow-xl shadow-white/10 scale-[1.02]'
                          : 'bg-black/50 text-zinc-400 hover:text-white border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-black text-white' : 'bg-white/10 text-zinc-300'
                      }`}>
                        <Bed className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold">{room.room_name}</span>
                        <span className={`block text-[10px] font-mono ${isSelected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                          ₱{Number(room.price_per_night || 0).toLocaleString()}/night
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Suite Dedicated Calendar Container */}
              {(() => {
                const currentRoom = calendarRooms.find(r => String(r.id) === String(selectedRoomIdForPerRoom)) || calendarRooms[0];
                if (!currentRoom) return null;

                const roomBookings = calendarBookings.filter(b => Number(b.room_id) === Number(currentRoom.id));
                const bookedNightsThisMonth = Array.from({ length: daysInMonth }).filter((_, i) => {
                  const dStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                  return roomBookings.some(b => dStr >= b.check_in && dStr < b.check_out);
                }).length;
                const occupancyRate = ((bookedNightsThisMonth / daysInMonth) * 100).toFixed(0);

                return (
                  <div className="space-y-6">
                    {/* Room Summary Header */}
                    <div className="p-5 sm:p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">
                          Dedicated Suite Calendar
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white">{currentRoom.room_name}</h3>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">{currentRoom.location} • Rate: ₱{Number(currentRoom.price_per_night || 0).toLocaleString()} per night</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="px-3.5 py-2 rounded-2xl bg-black/40 border border-white/10 text-center">
                          <span className="text-[9px] uppercase font-mono text-zinc-400 block">Occupancy</span>
                          <strong className="text-sm font-black text-emerald-400 font-mono">{occupancyRate}%</strong>
                        </div>
                        <div className="px-3.5 py-2 rounded-2xl bg-black/40 border border-white/10 text-center">
                          <span className="text-[9px] uppercase font-mono text-zinc-400 block">Nights Booked</span>
                          <strong className="text-sm font-black text-white font-mono">{bookedNightsThisMonth} / {daysInMonth}</strong>
                        </div>
                        <button
                          onClick={() => handleOpenManualBooking(currentRoom.id)}
                          className="px-4 py-2.5 rounded-2xl bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center space-x-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Book This Suite</span>
                        </button>
                      </div>
                    </div>

                    {/* Dedicated Month Calendar Grid */}
                    <div className="p-4 sm:p-6 rounded-3xl bg-black/60 border border-white/10 overflow-x-auto shadow-2xl">
                      <div className="min-w-[700px]">
                        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-mono font-bold text-zinc-400 uppercase">
                          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`lead-blank-${i}`} className="h-28 rounded-2xl bg-white/[0.02] border border-white/5 opacity-30" />
                          ))}

                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const isCurrentDay = dateString === formatDate(new Date());

                            const booking = roomBookings.find(b => {
                              if (b.check_in === b.check_out && b.check_in === dateString) return true;
                              return dateString >= b.check_in && dateString < b.check_out;
                            });

                            if (booking) {
                              return (
                                <div
                                  key={`room-cal-day-${dayNum}`}
                                  onClick={() => setSelectedBookingForModal(booking)}
                                  className={`h-28 p-2.5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer ${
                                    isCurrentDay
                                      ? 'bg-emerald-500/20 border-emerald-400/60 text-white'
                                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200 hover:border-emerald-400'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono font-bold">{dayNum}</span>
                                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/30 font-bold uppercase">
                                      BOOKED
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-white block truncate">{booking.guest_name}</span>
                                    <span className="text-[8px] font-mono text-zinc-300 block truncate">{booking.reference_number}</span>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={`room-cal-day-${dayNum}`}
                                onClick={() => handleOpenManualBooking(currentRoom.id, dateString)}
                                className={`h-28 p-2.5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer ${
                                  isCurrentDay
                                    ? 'bg-white/10 border-white/40 hover:border-white'
                                    : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-mono font-bold ${isCurrentDay ? 'text-white font-black' : 'text-zinc-500'}`}>
                                    {dayNum}
                                  </span>
                                  <span className="text-[8px] font-mono text-zinc-600">Available</span>
                                </div>
                                <div className="flex justify-end opacity-0 hover:opacity-100 transition-opacity">
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-black font-bold">+ Book</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ---------------- MANUAL BOOKING MODAL ---------------- */}
          <CustomModal
            isOpen={isManualBookingModalOpen}
            onClose={() => setIsManualBookingModalOpen(false)}
            title="Record Manual Booking"
            subtitle="Direct & OTA Channel Integration"
            icon={Tag}
            size="2xl"
          >
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 -mt-2">
                Add reservations from Airbnb, Agoda, Facebook Messenger, Walk-ins, or Phone inquiries.
              </p>

              {manualBookingError && (
                <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{manualBookingError}</span>
                </div>
              )}

              {manualBookingSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{manualBookingSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSubmitManualBooking} className="space-y-4 pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Suite Selection */}
                    <div>
                      <label className="text-[11px] font-mono uppercase text-zinc-300 block mb-1">
                        Select Suite / Room *
                      </label>
                      <select
                        value={manualBookingForm.roomId}
                        onChange={(e) => handleManualFormChange('roomId', e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white focus:outline-none"
                      >
                        <option value="" disabled>Choose a Suite</option>
                        {calendarRooms.map((r) => (
                          <option key={`m-room-${r.id}`} value={r.id}>
                            {r.room_name} ({r.location}) - ₱{Number(r.price_per_night || 0).toLocaleString()}/night
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Booking Source */}
                    <div>
                      <label className="text-[11px] font-mono uppercase text-zinc-300 block mb-1">
                        Booking Source / Channel *
                      </label>
                      <select
                        value={manualBookingForm.bookingSource}
                        onChange={(e) => handleManualFormChange('bookingSource', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white focus:outline-none"
                      >
                        <option value="Direct / Walk-in">Direct / Walk-in</option>
                        <option value="Facebook / Messenger">Facebook / Messenger</option>
                        <option value="Airbnb">Airbnb</option>
                        <option value="Agoda">Agoda</option>
                        <option value="Booking.com">Booking.com</option>
                        <option value="Phone Call">Phone Call / SMS</option>
                        <option value="Instagram">Instagram Direct</option>
                        <option value="Other">Other Channel</option>
                      </select>
                    </div>
                  </div>

                  {/* Guest Information */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                      Primary Guest Details
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Guest Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Maria Santos"
                          value={manualBookingForm.guestName}
                          onChange={(e) => handleManualFormChange('guestName', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Contact Number</label>
                        <input
                          type="text"
                          placeholder="0917-000-0000"
                          value={manualBookingForm.contactNumber}
                          onChange={(e) => handleManualFormChange('contactNumber', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="guest@example.com"
                          value={manualBookingForm.email}
                          onChange={(e) => handleManualFormChange('email', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Guest Count</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={manualBookingForm.guestCount}
                          onChange={(e) => handleManualFormChange('guestCount', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Age</label>
                        <input
                          type="number"
                          min="18"
                          value={manualBookingForm.age}
                          onChange={(e) => handleManualFormChange('age', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Vehicle / Parking</label>
                        <input
                          type="text"
                          placeholder="Plate / Sedan / None"
                          value={manualBookingForm.vehicle}
                          onChange={(e) => handleManualFormChange('vehicle', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dates & Payment */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                      Dates & Financial Presets
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Check-in Date *</label>
                        <input
                          type="date"
                          required
                          value={manualBookingForm.checkIn}
                          onChange={(e) => handleManualFormChange('checkIn', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Check-out Date *</label>
                        <input
                          type="date"
                          required
                          value={manualBookingForm.checkOut}
                          onChange={(e) => handleManualFormChange('checkOut', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Total Stay (₱) *</label>
                        <input
                          type="number"
                          required
                          value={manualBookingForm.totalAmount}
                          onChange={(e) => handleManualFormChange('totalAmount', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Amount Paid / Down (₱)</label>
                        <input
                          type="number"
                          value={manualBookingForm.amountPaid}
                          onChange={(e) => handleManualFormChange('amountPaid', Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Payment Method</label>
                        <select
                          value={manualBookingForm.paymentMethod}
                          onChange={(e) => handleManualFormChange('paymentMethod', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white focus:outline-none"
                        >
                          <option value="Cash">Cash</option>
                          <option value="GCash">GCash</option>
                          <option value="Maya">Maya</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="Airbnb Payout">Airbnb Payout</option>
                          <option value="Agoda Collect">Agoda Collect</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Payment Ref / Code</label>
                        <input
                          type="text"
                          placeholder="e.g. GCash Ref # / Airbnb HM123"
                          value={manualBookingForm.paymentReference}
                          onChange={(e) => handleManualFormChange('paymentReference', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:border-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">Notes / Remarks</label>
                        <input
                          type="text"
                          placeholder="Special requests, arrival time, etc."
                          value={manualBookingForm.notes}
                          onChange={(e) => handleManualFormChange('notes', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:border-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsManualBookingModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingManualBooking}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 uppercase tracking-wider flex items-center space-x-1.5 shadow-lg active:scale-95 transition-all"
                    >
                      {isSubmittingManualBooking ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Booking</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
            </div>
          </CustomModal>

        </div>
      )}

      {/* ================= TAB 4: ALL BOOKINGS LOG (Section 41-44) ================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="p-4 sm:p-6 rounded-3xl liquid-glass border border-white/15 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Audit Trail</span>
                <h2 className="text-xl sm:text-2xl font-black text-white">Historical Bookings Log</h2>
              </div>

              {/* Date Presets (Section 42) */}
              <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
                {['All', 'Today', 'Yesterday', 'Tomorrow'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setBookingFilterDate(preset);
                      fetchAllBookings();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      bookingFilterDate === preset
                        ? 'bg-white text-black font-black'
                        : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Search guest name, ref, or email..."
                value={bookingSearchQuery}
                onChange={(e) => setBookingSearchQuery(e.target.value)}
                className="h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
              />

              <select
                value={bookingFilterLocation}
                onChange={(e) => setBookingFilterLocation(e.target.value)}
                className="h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-white/40"
              >
                <option value="All">All Locations</option>
                <option value="Antipolo">Antipolo</option>
                <option value="Cainta">Cainta</option>
              </select>

              <select
                value={bookingFilterStatus}
                onChange={(e) => setBookingFilterStatus(e.target.value)}
                className="h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-white/40"
              >
                <option value="All">All Statuses</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CHECKED_IN">CHECKED_IN</option>
                <option value="CHECKED_OUT">CHECKED_OUT</option>
                <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
              </select>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-3">
            {isLoadingBookings ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
              </div>
            ) : allBookings.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs italic">
                No matching bookings found.
              </div>
            ) : (
              <div className="space-y-3">
                {allBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-black/60 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-white">{b.room_name}</span>
                        <span className="text-xs text-zinc-400 font-mono">({b.location})</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-zinc-300 border border-white/15">
                          {b.reference_number}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {b.booking_status}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-300 flex flex-wrap gap-x-4 gap-y-1">
                        <span><strong>Guest:</strong> {b.guest_name}</span>
                        <span><strong>Dates:</strong> {b.check_in} &rarr; {b.check_out}</span>
                        <span><strong>Total:</strong> ₱{Number(b.total_amount || b.amount || 0).toLocaleString()}</span>
                        <span><strong>Deposit:</strong> {b.deposit_status || 'PENDING'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedBookingForModal(b)}
                      className="liquid-btn-primary px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center space-x-1.5 self-end md:self-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ================= TAB 5: ROOM STATUS PAGE (Section 24, 25) ================= */}
      {activeTab === 'room_status' && (
        <div className="space-y-6">
          <div className="p-4 sm:p-6 rounded-3xl liquid-glass border border-white/15 flex items-center justify-between shadow-xl">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">
                Operational Control
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Live Suite Operational Status
              </h2>
            </div>
            <button
              onClick={fetchRoomStatuses}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomStatuses.map(({ room, currentBooking, operationalStatus }) => (
              <div
                key={room.id}
                className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-black text-white">{room.room_name}</h3>
                    <span className="text-xs font-mono text-zinc-400">{room.location}</span>
                  </div>

                  {/* Physical Status Pill */}
                  <div className="mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                      operationalStatus === 'AVAILABLE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : operationalStatus === 'CHECKED_IN'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : operationalStatus === 'MAINTENANCE'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                    }`}>
                      Status: {operationalStatus}
                    </span>
                  </div>

                  {/* Current Active Booking Info */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-mono block">Today's Occupancy</span>
                    {currentBooking ? (
                      <>
                        <span className="font-bold text-white block">{currentBooking.guest_name}</span>
                        <span className="text-zinc-400 block font-mono">{currentBooking.check_in} &rarr; {currentBooking.check_out}</span>
                      </>
                    ) : (
                      <span className="text-zinc-500 italic block">No active guest staying today</span>
                    )}
                  </div>
                </div>

                {/* Status Switcher Selector */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono">Set Operational Status:</span>
                  <select
                    value={operationalStatus}
                    onChange={(e) => handleUpdateRoomOperationalStatus(room.id, e.target.value)}
                    className="px-2 py-1 rounded-lg bg-black border border-white/20 text-white text-xs font-mono focus:outline-none"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="CHECKED_IN">CHECKED_IN</option>
                    <option value="CHECKED_OUT">CHECKED_OUT</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="UNAVAILABLE">UNAVAILABLE</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* ================= DETAIL MODAL (Preserved Snapshot Viewer - Section 40, 43, 44) ================= */}
      <CustomModal
        isOpen={Boolean(selectedBookingForModal)}
        onClose={() => setSelectedBookingForModal(null)}
        title={selectedBookingForModal?.reference_number}
        subtitle="Booking Snapshot"
        size="xl"
        footer={
          <button
            onClick={() => setSelectedBookingForModal(null)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 uppercase tracking-wider"
          >
            Close
          </button>
        }
      >
        {selectedBookingForModal && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-black/40 border border-white/10">
              <div>
                <span className="text-zinc-400 font-mono block text-[10px] uppercase">Guest Name</span>
                <span className="font-bold text-white">{selectedBookingForModal.guest_name}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-mono block text-[10px] uppercase">Suite & Location</span>
                <span className="font-bold text-white">{selectedBookingForModal.room_name} ({selectedBookingForModal.location})</span>
              </div>
              <div>
                <span className="text-zinc-400 font-mono block text-[10px] uppercase">Check-in</span>
                <span className="font-bold text-white font-mono">{selectedBookingForModal.check_in}</span>
              </div>
              <div>
                <span className="text-zinc-400 font-mono block text-[10px] uppercase">Check-out</span>
                <span className="font-bold text-white font-mono">{selectedBookingForModal.check_out}</span>
              </div>
            </div>

            {/* Financial Snapshot Breakdown */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="font-bold uppercase tracking-wider text-zinc-300 font-mono block">Financial Preservation Breakdown</span>
              <div className="flex justify-between text-zinc-400">
                <span>Room Rate ({selectedBookingForModal.nights || 1} nights):</span>
                <span className="text-white font-mono">₱{Number(selectedBookingForModal.room_subtotal || selectedBookingForModal.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Inclusions Subtotal:</span>
                <span className="text-white font-mono">₱{Number(selectedBookingForModal.inclusions_subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Refundable Security Deposit:</span>
                <span className="font-mono font-bold">₱1,000 ({selectedBookingForModal.deposit_status || 'PENDING'})</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-sm text-white">
                <span>Total Booking Amount:</span>
                <span className="font-mono">₱{Number(selectedBookingForModal.total_amount || selectedBookingForModal.amount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </CustomModal>

    </div>
  );
}
