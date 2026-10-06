import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, CheckCircle, Clock, Filter, Search, UserCheck, ShieldCheck, MapPin,
  ChevronLeft, ChevronRight, RotateCcw, QrCode, LogIn, LogOut, DollarSign,
  AlertCircle, ShieldAlert, ArrowRight, Eye, ExternalLink, Sparkles, Loader2, Check,
  Camera, X, RefreshCw, Upload, Video, VideoOff, CheckCircle2, SwitchCamera, Sparkle
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AdminDashboard({ token, currentUser }) {
  // Navigation Tabs: 'daily_log', 'qr_scanner', 'calendar', 'bookings', 'room_status'
  const [activeTab, setActiveTab] = useState('daily_log');

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
  const html5QrScannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Master Calendar State (Section 38, 39, 40)
  const [calendarView, setCalendarView] = useState('month'); // 'month', 'week', 'day'
  const [calendarRooms, setCalendarRooms] = useState([]);
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()); // 0-11
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(today);

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
        setCalendarRooms(data.rooms || []);
        setCalendarBookings(data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCalendar(false);
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
    playBeep();
    setScanSuccessFeedback(true);
    setTimeout(() => setScanSuccessFeedback(false), 3000);
    setScannedRefInput(ref);
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

  const staffNavTabs = [
    { id: 'daily_log', label: 'Daily Arrivals & Departures', desc: 'Check-in & Check-out Flow', icon: Clock },
    { id: 'qr_scanner', label: 'QR Scanner', desc: 'Fast Booking Verification', icon: QrCode },
    { id: 'calendar', label: 'Master Calendar', desc: 'Visual Schedule & Timeline', icon: Calendar },
    { id: 'bookings', label: 'All Bookings Log', desc: 'Search & Snapshot Records', icon: Search },
    { id: 'room_status', label: 'Room Status', desc: 'Real-time Suite Conditions', icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch lg:items-start pb-16">
      
      {/* ================= STAFF OPERATIONAL SIDEBAR NAV ================= */}
      <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-28 z-20">
        <div className="liquid-glass rounded-3xl p-3 sm:p-4 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-3">
          
          <div className="px-3 py-2 border-b border-white/5 hidden lg:flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 block">
                Operations Menu
              </span>
              <span className="text-[9px] font-mono text-zinc-500 block uppercase">
                {currentUser?.role ? currentUser.role.replace('_', ' ') : 'Staff & Support'}
              </span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-bold border border-white/10">
              STAFF
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

          {/* Success Notification Banner */}
          {scanSuccessFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-3 shadow-xl animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-sm block">QR Code Scanned Successfully!</span>
                <span className="font-mono text-emerald-300/80">
                  Voucher reference {scannedRefInput} verified.
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {qrScanError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{qrScanError}</span>
            </div>
          )}

          {/* QR Scanned Booking Result Display (Section 37) */}
          {scannedBooking && (
            <div className="p-6 rounded-3xl bg-black/60 border border-white/15 space-y-5 animate-fade-in shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Verified Booking</span>
                  <span className="text-xl font-mono font-black text-white">{scannedBooking.reference_number}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                    scannedBooking.check_in_status === 'CHECKED_IN'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : scannedBooking.check_in_status === 'CHECKED_OUT'
                      ? 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {scannedBooking.check_in_status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Payment: {scannedBooking.payment_status || 'PAID'}
                  </span>
                </div>
              </div>

              {/* Guest & Stay Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-zinc-400 font-mono text-[10px] uppercase block">Guest Name</span>
                  <span className="font-bold text-white text-sm">{scannedBooking.guest_name}</span>
                  <span className="text-zinc-500 block">{scannedBooking.guest_count} Guests</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-mono text-[10px] uppercase block">Assigned Suite</span>
                  <span className="font-bold text-white text-sm">{scannedBooking.room_name}</span>
                  <span className="text-zinc-500 block">{scannedBooking.location}</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-mono text-[10px] uppercase block">Check-in</span>
                  <span className="font-bold text-white text-sm">{scannedBooking.check_in}</span>
                  <span className="text-zinc-500 block">From 2:00 PM</span>
                </div>
                <div>
                  <span className="text-zinc-400 font-mono text-[10px] uppercase block">Check-out</span>
                  <span className="font-bold text-white text-sm">{scannedBooking.check_out}</span>
                  <span className="text-zinc-500 block">By 12:00 PM</span>
                </div>
              </div>

              {/* Security Deposit Verification Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Refundable Security Deposit (₱1,000)</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Status: <strong className={`uppercase ${
                      scannedBooking.securityDeposit?.payment_status === 'PAID'
                        ? 'text-emerald-400'
                        : scannedBooking.securityDeposit?.payment_status === 'REFUNDED'
                        ? 'text-blue-400'
                        : 'text-amber-400'
                    }`}>{scannedBooking.securityDeposit?.payment_status || 'PENDING'}</strong>
                  </span>
                </div>

                {scannedBooking.securityDeposit?.payment_status !== 'PAID' ? (
                  <button
                    onClick={() => handleSecurityDepositAction(scannedBooking.id, 'CONFIRM_PAYMENT')}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-md self-start sm:self-auto"
                  >
                    Confirm ₱1,000 Deposit
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

              {/* QR Check-In / Check-Out Execution Actions (Section 35, 36) */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap gap-3 justify-between items-center">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForModal(scannedBooking)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center space-x-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full Snapshot</span>
                </button>

                <div className="flex gap-2">
                  {scannedBooking.check_in_status === 'NOT_CHECKED_IN' && (
                    <button
                      onClick={() => handleUpdateCheckInStatus(scannedBooking.id, 'CHECKED_IN')}
                      className="liquid-btn-primary px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center space-x-2 shadow-xl"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>MARK CHECK-IN</span>
                    </button>
                  )}

                  {scannedBooking.check_in_status === 'CHECKED_IN' && (
                    <button
                      onClick={() => handleUpdateCheckInStatus(scannedBooking.id, 'CHECKED_OUT')}
                      className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-rose-500 text-white hover:bg-rose-600 transition-all flex items-center space-x-2 shadow-xl"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>MARK CHECK-OUT</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= TAB 3: MASTER CALENDAR (Section 38, 39, 40) ================= */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          
          {/* Calendar Header & Month Navigation */}
          <div className="p-4 sm:p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">
                Visual Room Grid
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Master Booking Calendar ({MONTH_NAMES[calendarMonth]} {calendarYear})
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear((y) => y - 1);
                  } else {
                    setCalendarMonth((m) => m - 1);
                  }
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const now = new Date();
                  setCalendarMonth(now.getMonth());
                  setCalendarYear(now.getFullYear());
                }}
                className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-wider"
              >
                This Month
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
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 sm:p-6 rounded-3xl bg-black/60 border border-white/10 overflow-x-auto shadow-2xl">
            <div className="min-w-[700px]">
              
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-mono font-bold text-zinc-400 uppercase">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-2">
                {/* Blank lead cells */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`blank-${i}`} className="h-28 rounded-2xl bg-white/[0.02] border border-white/5 opacity-30" />
                ))}

                {/* Day boxes */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isCurrentDay = dateString === formatDate(new Date());

                  // Filter bookings on this day
                  const dayBookings = calendarBookings.filter((b) => {
                    return b.check_in <= dateString && b.check_out >= dateString;
                  });

                  return (
                    <div
                      key={`day-${dayNum}`}
                      className={`h-32 p-2 rounded-2xl border flex flex-col justify-between transition-all overflow-hidden ${
                        isCurrentDay
                          ? 'bg-white/10 border-white/40 ring-1 ring-white/30'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-mono font-bold ${isCurrentDay ? 'text-white font-black' : 'text-zinc-400'}`}>
                          {dayNum}
                        </span>
                        {dayBookings.length > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                            {dayBookings.length} stay{dayBookings.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Booking Container Labels (Section 39) */}
                      <div className="flex-1 overflow-y-auto space-y-1 my-1 no-scrollbar">
                        {dayBookings.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBookingForModal(b)}
                            className="w-full text-left p-1.5 rounded-lg bg-zinc-900/90 border border-white/15 hover:border-white text-[10px] text-zinc-200 block truncate transition-all shadow-sm"
                          >
                            <span className="font-bold text-white block truncate">{b.room_name}</span>
                            <span className="text-zinc-400 block truncate">{b.guest_name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

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
      {selectedBookingForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-xl liquid-glass border border-white/20 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 animate-modal-pop my-6 space-y-5 max-h-[90vh] flex flex-col">
            
            <button
              onClick={() => setSelectedBookingForModal(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-3 border-b border-white/10">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block">Booking Snapshot</span>
              <h3 className="text-xl font-black text-white">{selectedBookingForModal.reference_number}</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar text-xs">
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

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedBookingForModal(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 uppercase tracking-wider"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
