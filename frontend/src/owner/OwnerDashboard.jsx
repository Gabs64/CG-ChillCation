import React, { useState, useEffect, useRef } from 'react';
import {
  DollarSign, Users, UserPlus, ShieldCheck, MapPin, Eye, EyeOff, FileText, CheckCircle2,
  Lock, Loader2, AlertCircle, Plus, Edit2, Trash2, Star, Check, X, ShieldAlert,
  Layers, Settings, Sliders, Image, QrCode, RefreshCw, Building2, Upload, Camera,
  Clock, Calendar, Search, Filter, ChevronLeft, ChevronRight, LogIn, LogOut, Video, VideoOff,
  SwitchCamera, ExternalLink, RotateCcw, ArrowRight, Bed, Grid, Tag, Globe, Phone, Mail,
  UserCheck, UserX, Key, Shield, Tv, Wind, Bath, Coffee, BedDouble, Maximize2, Sparkles, MessageCircle
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import CustomModal, { ConfirmModal } from '../shared/CustomModal';

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function OwnerDashboard({ token, currentUser, activeTab: externalActiveTab, setActiveTab: setExternalActiveTab }) {
  // Navigation Tabs:
  // Operations: 'daily_log', 'qr_scanner', 'calendar', 'bookings', 'room_status'
  // Executive: 'revenue', 'rooms', 'inclusions', 'policies', 'experiences', 'users', 'settings'
  const [internalActiveTab, setInternalActiveTab] = useState('revenue');
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = setExternalActiveTab || setInternalActiveTab;

  // ----------------------------------------------------
  // STAFF OPERATIONAL STATE
  // ----------------------------------------------------

  // 1. Daily Arrivals & Departures State
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [dailyData, setDailyData] = useState({ arrivals: [], departures: [], inHouse: [], summary: {} });
  const [isLoadingDaily, setIsLoadingDaily] = useState(false);
  const [dailySubTab, setDailySubTab] = useState('arrivals'); // 'arrivals', 'departures', 'in_house'

  // 2. QR Scanner State
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
  const qrFileInputRef = useRef(null);
  const lastScanTimestampRef = useRef(0);
  const cooldownTimerRef = useRef(null);

  // 3. Master Calendar State
  const [calendarSubView, setCalendarSubView] = useState('matrix'); // 'matrix' (Timeline Grid) vs 'per_room' (Calendar per room)
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

  // 4. All Bookings State
  const [allBookings, setAllBookings] = useState([]);
  const [bookingFilterDate, setBookingFilterDate] = useState('All');
  const [bookingFilterLocation, setBookingFilterLocation] = useState('All');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('All');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // 5. Room Operational Status State
  const [roomStatuses, setRoomStatuses] = useState([]);
  const [isLoadingRoomStatus, setIsLoadingRoomStatus] = useState(false);

  // Booking Detail Modal
  const [selectedBookingForModal, setSelectedBookingForModal] = useState(null);

  // ----------------------------------------------------
  // OWNER EXECUTIVE STATE
  // ----------------------------------------------------

  // 6. Revenue Analytics State
  const [revenueData, setRevenueData] = useState(null);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);

  // 7. Room Customization & Pricing State
  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [roomSaveError, setRoomSaveError] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomModalTab, setRoomModalTab] = useState('inclusions'); // 'inclusions' | 'basic' | 'specs' | 'rules' | 'photos'
  const [roomFormName, setRoomFormName] = useState('');
  const [roomFormLocation, setRoomFormLocation] = useState('Antipolo');
  const [roomFormPrice, setRoomFormPrice] = useState(2800);
  const [roomFormDescription, setRoomFormDescription] = useState('');
  const [roomFormFeatured, setRoomFormFeatured] = useState(false);
  const [roomFormStatus, setRoomFormStatus] = useState('AVAILABLE');
  const [roomFormCapacity, setRoomFormCapacity] = useState('2 - 4 Guests');
  const [roomFormBedSetup, setRoomFormBedSetup] = useState('King Luxury Bed');
  const [roomFormSuiteSize, setRoomFormSuiteSize] = useState('35 sqm Studio');
  const [roomFormCheckInTime, setRoomFormCheckInTime] = useState('2:00 PM onwards');
  const [roomFormCheckOutTime, setRoomFormCheckOutTime] = useState('12:00 PM');
  const [roomFormSecurityDeposit, setRoomFormSecurityDeposit] = useState(1000);
  const [roomFormGoogleMapsUrl, setRoomFormGoogleMapsUrl] = useState('');
  const [roomFormLocationDescription, setRoomFormLocationDescription] = useState('');
  const [roomFormHighlights, setRoomFormHighlights] = useState([
    'Instant QR Pass Check-in',
    'Self Keyless Digital Lock',
    'Cleaned & Sanitized Daily'
  ]);
  const [roomFormAmenities, setRoomFormAmenities] = useState({
    entertainment: [
      '55-inch 4K Smart TV with Netflix & YouTube',
      'Smart Ambient Mood Lighting System',
      'High-Speed 100+ Mbps Fiber Wi-Fi',
      'Curated Board & Card Games'
    ],
    bedroom: [
      'King Size Luxury Orthopedic Mattress',
      '100% Egyptian Cotton Luxury Bed Linens',
      'Full Blackout Privacy Curtains',
      'Whisper-Quiet Inverter Air Conditioning'
    ],
    bathroom: [
      'Instant Hot & Cold Rain Shower',
      'Modern Ceramic Bidet Spray',
      'Fresh Hotel-Grade Plush Towels',
      'Hairdryer & Complimentary Toiletries'
    ],
    kitchenette: [
      'Mini Refrigerator & Beverage Chiller',
      'Microwave Oven & Electric Kettle',
      'Complete Plates, Cutlery & Wine Glasses',
      'Dining Counter with Designer Stools'
    ]
  });
  const [roomFormHouseRules, setRoomFormHouseRules] = useState([
    { title: '🚭 No Smoking Inside', desc: 'Smoking and vaping are strictly prohibited inside the suite to keep fresh air quality.' },
    { title: '🔇 Quiet Hours', desc: '10:00 PM – 8:00 AM to maintain a relaxing atmosphere for all guests.' },
    { title: '🎫 Instant QR Check-in', desc: 'Present your digital booking voucher pass upon arrival for immediate contactless verification.' },
    { title: '💵 Security Deposit', desc: '₱1,000 incidental security deposit required upon check-in, 100% refundable upon room clearance.' }
  ]);
  const [roomFormImages, setRoomFormImages] = useState([]);
  const [roomFormPaymentMethods, setRoomFormPaymentMethods] = useState(['QR Ph', 'Dragonpay', 'GCash', 'Maya', 'Bank Transfer']);
  const roomFileInputRef = useRef(null);

  // 8. Inclusions State (with Antipolo vs Cainta location differentiation)
  const [inclusions, setInclusions] = useState([]);
  const [showInclusionModal, setShowInclusionModal] = useState(false);
  const [editingInclusion, setEditingInclusion] = useState(null);
  const [incName, setIncName] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incPrice, setIncPrice] = useState(200);
  const [incLocation, setIncLocation] = useState('All'); // 'All' | 'Antipolo' | 'Cainta'
  const [incLocationFilter, setIncLocationFilter] = useState('All');
  const [incActive, setIncActive] = useState(true);

  // 9. Policies State
  const [policies, setPolicies] = useState([]);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [polTitle, setPolTitle] = useState('');
  const [polContent, setPolContent] = useState('');
  const [polOrder, setPolOrder] = useState(1);
  const [polActive, setPolActive] = useState(true);

  // 10. Guest Experiences
  const [guestExpData, setGuestExpData] = useState({ pending: [], approved: [], declined: [] });
  const [expSubTab, setExpSubTab] = useState('pending');
  const [isLoadingExp, setIsLoadingExp] = useState(false);

  // 11. User Management State
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('STAFF');
  const [createUserError, setCreateUserError] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Edit Staff User State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState('STAFF');
  const [editUserStatus, setEditUserStatus] = useState('ACTIVE');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserError, setEditUserError] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Staff List Filtering & Search
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // 12. Universal Custom Confirmation Modal State (replaces browser confirm)
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    onConfirm: null,
    isLoading: false,
    requireMatchText: '',
    inputLabel: '',
    inputPlaceholder: ''
  });

  // 12. System Settings & Audit Log State
  const [systemSettings, setSystemSettings] = useState({
    security_deposit_amount: '1000',
    meta_messenger_url: 'https://m.me/cgchillcation',
    secret_admin_path: 'portal-access-8f3k29x7-admin-secure',
    google_maps_antipolo: 'https://maps.google.com/?q=Antipolo+Rizal+CG+Chillcation',
    google_maps_cainta: 'https://maps.google.com/?q=Cainta+Rizal+CG+Chillcation'
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  // Auto-fetch data based on active tab
  useEffect(() => {
    // Operations
    if (activeTab === 'daily_log') fetchDailyArrivalsDepartures(selectedDate);
    if (activeTab === 'calendar') fetchCalendarData();
    if (activeTab === 'bookings') fetchAllBookings();
    if (activeTab === 'room_status') fetchRoomStatuses();

    // Executive
    if (activeTab === 'revenue') fetchRevenue();
    if (activeTab === 'rooms') fetchRooms();
    if (activeTab === 'inclusions') fetchInclusions();
    if (activeTab === 'policies') fetchPolicies();
    if (activeTab === 'experiences') fetchGuestExperiences();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'settings') {
      fetchSettings();
      fetchAuditLogs();
    }
  }, [activeTab, selectedDate]);

  // ----------------------------------------------------
  // API FETCH HELPERS
  // ----------------------------------------------------

  const fetchDailyArrivalsDepartures = async (dateStr) => {
    setIsLoadingDaily(true);
    try {
      const res = await fetch(`/api/admin/arrivals-departures?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setDailyData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDaily(false);
    }
  };

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
    const targetRoomId = preselectedRoomId || selectedRoomIdForPerRoom || (calendarRooms[0]?.id) || (rooms[0]?.id) || '';
    const selectedRoom = calendarRooms.find(r => String(r.id) === String(targetRoomId)) || rooms.find(r => String(r.id) === String(targetRoomId)) || calendarRooms[0] || rooms[0];
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
      
      if (field === 'roomId' || field === 'checkIn' || field === 'checkOut') {
        const rId = field === 'roomId' ? value : updated.roomId;
        const cIn = field === 'checkIn' ? value : updated.checkIn;
        const cOut = field === 'checkOut' ? value : updated.checkOut;
        
        const roomObj = calendarRooms.find(r => String(r.id) === String(rId)) || rooms.find(r => String(r.id) === String(rId));
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

  const fetchRoomStatuses = async () => {
    setIsLoadingRoomStatus(true);
    try {
      const res = await fetch('/api/admin/room-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setRoomStatuses(data.roomStatuses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRoomStatus(false);
    }
  };

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

  // Futuristic Multi-Tone Crystal Chime for QR Scan Success
  const playScanSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Dynamics Compressor for studio-quality crispness
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(10, ctx.currentTime);
      compressor.attack.setValueAtTime(0.001, ctx.currentTime);
      compressor.release.setValueAtTime(0.2, ctx.currentTime);
      compressor.connect(ctx.destination);

      // Sci-fi 4-tone harmonic chime (D5 -> A5 -> D6 -> A6 sparkle)
      const notes = [
        { freq: 587.33, start: 0.00, dur: 0.12, type: 'sine', vol: 0.22 },
        { freq: 880.00, start: 0.06, dur: 0.15, type: 'triangle', vol: 0.25 },
        { freq: 1174.66, start: 0.12, dur: 0.22, type: 'sine', vol: 0.30 },
        { freq: 1760.00, start: 0.16, dur: 0.35, type: 'sine', vol: 0.18 },
      ];

      notes.forEach(({ freq, start, dur, type, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.025, ctx.currentTime + start + dur * 0.4);

        gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);

        osc.connect(gain);
        gain.connect(compressor);

        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      });
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  };

  // Subtle rejection sound for invalid QR
  const playScanErrorSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
  };

  const extractReferenceCode = (raw) => {
    if (!raw) return '';
    const match = String(raw).match(/CGC-\d{8}-\d{4}/i);
    if (match) return match[0].toUpperCase();
    return String(raw).trim();
  };

  const handleScannedResult = async (decodedText) => {
    const ref = extractReferenceCode(decodedText);
    if (!ref) {
      setQrScanError('Could not recognize a valid reference code from this QR.');
      return;
    }

    const now = Date.now();
    if (now - lastScanTimestampRef.current < 2500) return;
    lastScanTimestampRef.current = now;

    setScannedRefInput(ref);
    await handleLookupQR(ref);
  };

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
        { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => handleScannedResult(decodedText),
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

  const handleSwitchCamera = async (newCameraId) => {
    setSelectedCameraId(newCameraId);
    if (isCameraActive) {
      await startCameraScanner(newCameraId);
    }
  };

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
      playScanErrorSound();
      setQrScanError('Could not detect a valid QR Code in this image. Please ensure the QR code is clearly visible, or enter the reference number manually.');
    } finally {
      setIsScanning(false);
      if (qrFileInputRef.current) qrFileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (activeTab !== 'qr_scanner') {
      stopCameraScanner();
    }
    return () => {
      stopCameraScanner();
    };
  }, [activeTab]);

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
        // Red error state: Keep camera running, display error alert and audible cue
        playScanErrorSound();
        const rawErr = data?.error || '';
        const cleanError = (rawErr && !rawErr.includes('http') && !rawErr.includes('://') && !rawErr.includes('.app') && !rawErr.includes('.com'))
          ? rawErr
          : 'No booking found for this QR code. Please try scanning another voucher.';
        setQrScanError(cleanError);
        setScannedBooking(null);
      } else {
        // Verified Success: stop camera, play cool crystal chime and proceed to details view
        await stopCameraScanner();
        playScanSuccessSound();
        setScannedBooking(data.booking);
        setQrScanError(null);
      }
    } catch (err) {
      playScanErrorSound();
      setQrScanError('Failed to verify QR Code. Please check connection.');
      setScannedBooking(null);
    } finally {
      setIsScanning(false);
    }
  };

  const handleReturnToScanner = () => {
    setScannedBooking(null);
    setScannedRefInput('');
    setQrScanError(null);
    setScannerMode('camera');
    setTimeout(() => {
      startCameraScanner();
    }, 150);
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

  // ----------------------------------------------------
  // OWNER EXECUTIVE API FETCHES & HANDLERS
  // ----------------------------------------------------

  const fetchRevenue = async () => {
    setIsLoadingRevenue(true);
    try {
      const res = await fetch('/api/owner/revenue', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setRevenueData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRevenue(false);
    }
  };

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/owner/rooms', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.rooms) {
        setRooms(data.rooms);
      } else {
        const pubRes = await fetch('/api/rooms', { headers: { Authorization: `Bearer ${token}` } });
        const pubData = await pubRes.json();
        if (pubData.rooms) setRooms(pubData.rooms);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const fetchInclusions = async () => {
    try {
      const res = await fetch('/api/owner/inclusions', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.inclusions) setInclusions(data.inclusions);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/owner/policies', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.policies) setPolicies(data.policies);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGuestExperiences = async () => {
    setIsLoadingExp(true);
    try {
      const res = await fetch('/api/owner/guest-experiences', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setGuestExpData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingExp(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/owner/users', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/owner/settings', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.settings) setSystemSettings((prev) => ({ ...prev, ...data.settings }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/owner/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.logs) setAuditLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Room Management
  const handleToggleFeaturedRoom = async (room, e) => {
    if (e) e.stopPropagation();
    const newFeatured = !room.is_featured;
    
    // Optimistic UI update
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_featured: newFeatured } : r));

    try {
      const res = await fetch(`/api/owner/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isFeatured: newFeatured })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        // Rollback
        setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_featured: !newFeatured } : r));
        alert(data.error || 'Failed to update featured suite status.');
      } else {
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Error toggling featured status:', err);
      // Rollback
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_featured: !newFeatured } : r));
    }
  };

  const STANDARD_AMENITIES_CONFIG = [
    {
      key: 'entertainment',
      title: 'Entertainment & Atmosphere',
      icon: Tv,
      placeholder: 'e.g. 55-inch 4K Smart TV with Netflix & YouTube',
      defaults: [
        '55-inch 4K Smart TV with Netflix & YouTube',
        'Smart Ambient Mood Lighting System',
        'High-Speed 100+ Mbps Fiber Wi-Fi',
        'Curated Board & Card Games'
      ]
    },
    {
      key: 'bedroom',
      title: 'Master Bedroom Comfort',
      icon: Wind,
      placeholder: 'e.g. King Size Luxury Orthopedic Mattress',
      defaults: [
        'King Size Luxury Orthopedic Mattress',
        '100% Egyptian Cotton Luxury Bed Linens',
        'Full Blackout Privacy Curtains',
        'Whisper-Quiet Inverter Air Conditioning'
      ]
    },
    {
      key: 'bathroom',
      title: 'Private Spa Ensuite',
      icon: Bath,
      placeholder: 'e.g. Instant Hot & Cold Rain Shower',
      defaults: [
        'Instant Hot & Cold Rain Shower',
        'Modern Ceramic Bidet Spray',
        'Fresh Hotel-Grade Plush Towels',
        'Hairdryer & Complimentary Toiletries'
      ]
    },
    {
      key: 'kitchenette',
      title: 'Kitchenette & Dining',
      icon: Coffee,
      placeholder: 'e.g. Mini Refrigerator & Beverage Chiller',
      defaults: [
        'Mini Refrigerator & Beverage Chiller',
        'Microwave Oven & Electric Kettle',
        'Complete Plates, Cutlery & Wine Glasses',
        'Dining Counter with Designer Stools'
      ]
    }
  ];

  const STANDARD_HIGHLIGHTS_DEFAULT = [
    'Instant QR Pass Check-in',
    'Self Keyless Digital Lock',
    'Cleaned & Sanitized Daily'
  ];

  const STANDARD_RULES_DEFAULT = [
    { title: '🚭 No Smoking Inside', desc: 'Smoking and vaping are strictly prohibited inside the suite to keep fresh air quality.' },
    { title: '🔇 Quiet Hours', desc: '10:00 PM – 8:00 AM to maintain a relaxing atmosphere for all guests.' },
    { title: '🎫 Instant QR Check-in', desc: 'Present your digital booking voucher pass upon arrival for immediate contactless verification.' },
    { title: '💵 Security Deposit', desc: '₱1,000 incidental security deposit required upon check-in, 100% refundable upon room clearance.' }
  ];

  const handleOpenRoomModal = (room = null) => {
    setRoomSaveError('');
    setIsSavingRoom(false);
    setRoomModalTab('inclusions'); // Default to Inclusions tab
    if (room) {
      setEditingRoom(room);
      setRoomFormName(room.room_name || '');
      setRoomFormLocation(room.location || 'Antipolo');
      setRoomFormPrice(room.price_per_night || 2800);
      setRoomFormDescription(room.description || '');
      setRoomFormFeatured(Boolean(room.is_featured));
      setRoomFormStatus(room.status || 'AVAILABLE');
      setRoomFormCapacity(room.capacity || '2 - 4 Guests');
      setRoomFormBedSetup(room.bed_setup || 'King Luxury Bed');
      setRoomFormSuiteSize(room.suite_size || '35 sqm Studio');
      setRoomFormCheckInTime(room.check_in_time || '2:00 PM onwards');
      setRoomFormCheckOutTime(room.check_out_time || '12:00 PM');
      setRoomFormSecurityDeposit(room.security_deposit !== undefined ? room.security_deposit : 1000);
      setRoomFormGoogleMapsUrl(room.google_maps_url || '');
      setRoomFormLocationDescription(room.location_description || '');
      setRoomFormHighlights(
        room.highlights && room.highlights.length > 0
          ? [...room.highlights]
          : [...STANDARD_HIGHLIGHTS_DEFAULT]
      );
      setRoomFormAmenities(
        room.amenities
          ? {
              entertainment: room.amenities.entertainment ? [...room.amenities.entertainment] : [...STANDARD_AMENITIES_CONFIG[0].defaults],
              bedroom: room.amenities.bedroom ? [...room.amenities.bedroom] : [...STANDARD_AMENITIES_CONFIG[1].defaults],
              bathroom: room.amenities.bathroom ? [...room.amenities.bathroom] : [...STANDARD_AMENITIES_CONFIG[2].defaults],
              kitchenette: room.amenities.kitchenette ? [...room.amenities.kitchenette] : [...STANDARD_AMENITIES_CONFIG[3].defaults]
            }
          : {
              entertainment: [...STANDARD_AMENITIES_CONFIG[0].defaults],
              bedroom: [...STANDARD_AMENITIES_CONFIG[1].defaults],
              bathroom: [...STANDARD_AMENITIES_CONFIG[2].defaults],
              kitchenette: [...STANDARD_AMENITIES_CONFIG[3].defaults]
            }
      );
      setRoomFormHouseRules(
        room.house_rules && room.house_rules.length > 0
          ? [...room.house_rules]
          : [...STANDARD_RULES_DEFAULT]
      );
      setRoomFormImages(room.images ? [...room.images] : []);
      setRoomFormPaymentMethods(room.payment_methods ? [...room.payment_methods] : ['QR Ph', 'Dragonpay', 'GCash', 'Maya', 'Bank Transfer']);
    } else {
      setEditingRoom(null);
      setRoomFormName(`Suite ${rooms.length + 1 < 10 ? `0${rooms.length + 1}` : rooms.length + 1}`);
      setRoomFormLocation('Antipolo');
      setRoomFormPrice(2800);
      setRoomFormDescription('Luxury minimalist suite located in Antipolo with scenic ridge views, ambient lighting, and curated premium comforts.');
      setRoomFormFeatured(false);
      setRoomFormStatus('AVAILABLE');
      setRoomFormCapacity('2 - 4 Guests');
      setRoomFormBedSetup('King Luxury Bed');
      setRoomFormSuiteSize('35 sqm Studio');
      setRoomFormCheckInTime('2:00 PM onwards');
      setRoomFormCheckOutTime('12:00 PM');
      setRoomFormSecurityDeposit(1000);
      setRoomFormGoogleMapsUrl('');
      setRoomFormLocationDescription('Located along the breezy scenic ridge of Antipolo, close to iconic overlook cafés, Cloud 9, Pinto Art Museum, and hilltop dining.');
      setRoomFormHighlights([...STANDARD_HIGHLIGHTS_DEFAULT]);
      setRoomFormAmenities({
        entertainment: [...STANDARD_AMENITIES_CONFIG[0].defaults],
        bedroom: [...STANDARD_AMENITIES_CONFIG[1].defaults],
        bathroom: [...STANDARD_AMENITIES_CONFIG[2].defaults],
        kitchenette: [...STANDARD_AMENITIES_CONFIG[3].defaults]
      });
      setRoomFormHouseRules([...STANDARD_RULES_DEFAULT]);
      setRoomFormImages([]);
      setRoomFormPaymentMethods(['QR Ph', 'Dragonpay', 'GCash', 'Maya', 'Bank Transfer']);
    }
    setShowRoomModal(true);
  };

  // Category Amenity Manipulation Handlers
  const handleAddAmenityItem = (categoryKey) => {
    setRoomFormAmenities(prev => ({
      ...prev,
      [categoryKey]: [...(prev[categoryKey] || []), '']
    }));
  };

  const handleUpdateAmenityItem = (categoryKey, index, value) => {
    setRoomFormAmenities(prev => {
      const list = [...(prev[categoryKey] || [])];
      list[index] = value;
      return { ...prev, [categoryKey]: list };
    });
  };

  const handleRemoveAmenityItem = (categoryKey, index) => {
    setRoomFormAmenities(prev => ({
      ...prev,
      [categoryKey]: (prev[categoryKey] || []).filter((_, i) => i !== index)
    }));
  };

  const handleResetAmenityCategory = (categoryKey) => {
    const config = STANDARD_AMENITIES_CONFIG.find(c => c.key === categoryKey);
    if (!config) return;
    setRoomFormAmenities(prev => ({
      ...prev,
      [categoryKey]: [...config.defaults]
    }));
  };

  // Highlights Manipulation Handlers
  const handleAddHighlight = () => {
    setRoomFormHighlights(prev => [...prev, '']);
  };

  const handleUpdateHighlight = (index, value) => {
    setRoomFormHighlights(prev => {
      const list = [...prev];
      list[index] = value;
      return list;
    });
  };

  const handleRemoveHighlight = (index) => {
    setRoomFormHighlights(prev => prev.filter((_, i) => i !== index));
  };

  // House Rules Manipulation Handlers
  const handleAddHouseRule = () => {
    setRoomFormHouseRules(prev => [...prev, { title: '', desc: '' }]);
  };

  const handleUpdateHouseRule = (index, field, value) => {
    setRoomFormHouseRules(prev => {
      const list = [...prev];
      list[index] = { ...list[index], [field]: value };
      return list;
    });
  };

  const handleRemoveHouseRule = (index) => {
    setRoomFormHouseRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleDevicePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const MAX_WIDTH = 1600;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setRoomFormImages((prev) => [...prev, compressedDataUrl]);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setRoomSaveError('');
    setIsSavingRoom(true);

    const trimmedName = roomFormName.trim();
    if (!trimmedName) {
      setRoomSaveError('Room name is required.');
      setIsSavingRoom(false);
      return;
    }

    if (!roomFormImages || roomFormImages.length === 0) {
      setRoomSaveError('Please upload at least 1 photo of the suite from your device.');
      setIsSavingRoom(false);
      return;
    }

    // Filter out blank amenity, highlight and rule items
    const cleanedAmenities = {
      entertainment: (roomFormAmenities.entertainment || []).filter(item => item && item.trim().length > 0),
      bedroom: (roomFormAmenities.bedroom || []).filter(item => item && item.trim().length > 0),
      bathroom: (roomFormAmenities.bathroom || []).filter(item => item && item.trim().length > 0),
      kitchenette: (roomFormAmenities.kitchenette || []).filter(item => item && item.trim().length > 0)
    };

    const cleanedHighlights = (roomFormHighlights || []).filter(h => h && h.trim().length > 0);
    const cleanedHouseRules = (roomFormHouseRules || []).filter(r => r && (r.title.trim().length > 0 || r.desc.trim().length > 0));

    const payload = {
      roomName: trimmedName,
      location: roomFormLocation,
      pricePerNight: Number(roomFormPrice),
      description: roomFormDescription,
      isFeatured: roomFormFeatured,
      status: roomFormStatus,
      capacity: roomFormCapacity,
      bedSetup: roomFormBedSetup,
      suiteSize: roomFormSuiteSize,
      checkInTime: roomFormCheckInTime,
      checkOutTime: roomFormCheckOutTime,
      securityDeposit: Number(roomFormSecurityDeposit),
      googleMapsUrl: roomFormGoogleMapsUrl,
      locationDescription: roomFormLocationDescription,
      highlights: cleanedHighlights,
      amenities: cleanedAmenities,
      houseRules: cleanedHouseRules,
      images: roomFormImages,
      paymentMethods: roomFormPaymentMethods
    };

    try {
      let res;
      if (editingRoom) {
        res = await fetch(`/api/owner/rooms/${editingRoom.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/owner/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save suite. Please verify inputs.');
      }

      setShowRoomModal(false);
      await fetchRooms();
      await fetchCalendarData();
    } catch (err) {
      console.error('Error saving room:', err);
      setRoomSaveError(err.message || 'Failed to save suite.');
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleDeactivateRoom = (room) => {
    const roomId = room?.id || room;
    const roomName = room?.room_name || 'Suite';
    
    // Step 1: Initial Deletion Confirmation Prompt
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Suite',
      subtitle: 'Step 1 of 2: Inventory Removal',
      message: `Are you sure you want to delete and deactivate "${roomName}"? This will remove the suite from active catalog listings and the master reservation calendar.`,
      confirmText: 'Continue to Verification',
      cancelText: 'Cancel',
      variant: 'warning',
      requireMatchText: '',
      onConfirm: () => {
        // Step 2: Second Prompt - Requires typing exact suite name to confirm
        setConfirmModalConfig({
          isOpen: true,
          title: 'Confirm Suite Deletion',
          subtitle: 'Step 2 of 2: Security Verification',
          message: `This action cannot be undone. To permanently delete this suite and its reservation calendar row, please type the exact suite name below:`,
          confirmText: 'Permanently Delete Suite',
          cancelText: 'Cancel',
          variant: 'danger',
          requireMatchText: roomName,
          inputPlaceholder: `Type "${roomName}" here`,
          onConfirm: async () => {
            setConfirmModalConfig((prev) => ({ ...prev, isLoading: true }));
            try {
              await fetch(`/api/owner/rooms/${roomId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              await fetchRooms();
              await fetchCalendarData();
            } catch (err) {
              console.error(err);
            } finally {
              setConfirmModalConfig({ isOpen: false, isLoading: false, requireMatchText: '' });
            }
          }
        });
      }
    });
  };

  const handleConfirmDeleteReview = (expId, guestName) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Review',
      subtitle: 'Guest Experiences',
      message: `Are you sure you want to permanently delete the review from ${guestName || 'this guest'}?`,
      confirmText: 'Delete Review',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmModalConfig((prev) => ({ ...prev, isLoading: true }));
        await handleReviewStatus(expId, 'DELETE');
        setConfirmModalConfig({ isOpen: false, isLoading: false });
      }
    });
  };


  // Handlers for Inclusions
  const handleSaveInclusion = async (e) => {
    e.preventDefault();
    try {
      if (editingInclusion) {
        await fetch(`/api/owner/inclusions/${editingInclusion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: incName, description: incDesc, price: Number(incPrice), location: incLocation, isActive: incActive })
        });
      } else {
        await fetch('/api/owner/inclusions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: incName, description: incDesc, price: Number(incPrice), location: incLocation, isActive: incActive })
        });
      }
      setShowInclusionModal(false);
      fetchInclusions();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Policies
  const handleSavePolicy = async (e) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        await fetch(`/api/owner/policies/${editingPolicy.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: polTitle, content: polContent, displayOrder: Number(polOrder), isActive: polActive })
        });
      } else {
        await fetch('/api/owner/policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: polTitle, content: polContent, displayOrder: Number(polOrder), isActive: polActive })
        });
      }
      setShowPolicyModal(false);
      fetchPolicies();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Guest Experiences Workflow
  const handleReviewStatus = async (expId, status) => {
    try {
      await fetch(`/api/owner/guest-experiences/${expId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      fetchGuestExperiences();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/owner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(systemSettings)
      });
      setSaveSettingsSuccess(true);
      setTimeout(() => setSaveSettingsSuccess(false), 3000);
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Users & Staff Accounts
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserError('');
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/owner/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCreateUserError(data.error || 'Failed to create user account.');
        return;
      }
      setShowCreateUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('STAFF');
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      setCreateUserError('Network error while creating account.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setEditUserName(user.name || '');
    setEditUserEmail(user.email || '');
    setEditUserRole(user.role || 'STAFF');
    setEditUserStatus(user.status || 'ACTIVE');
    setEditUserPassword('');
    setEditUserError('');
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditUserError('');
    setIsUpdatingUser(true);
    try {
      const payload = {
        name: editUserName,
        email: editUserEmail,
        role: editUserRole,
        status: editUserStatus,
      };
      if (editUserPassword && editUserPassword.trim().length > 0) {
        payload.password = editUserPassword.trim();
      }

      const res = await fetch(`/api/owner/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setEditUserError(data.error || 'Failed to update user account.');
        return;
      }
      setShowEditUserModal(false);
      setEditingUser(null);
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      console.error(err);
      setEditUserError('Network error while updating account.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleToggleUserStatus = (user) => {
    if (user.role === 'OWNER') return;
    const isActivating = user.status !== 'ACTIVE';
    
    setConfirmModalConfig({
      isOpen: true,
      title: isActivating ? 'Activate Staff Account' : 'Deactivate Staff Account',
      subtitle: `${user.name} • ${user.email}`,
      message: isActivating
        ? `Are you sure you want to activate the account for ${user.name}? They will immediately be able to log in to their ${user.role} portal.`
        : `Are you sure you want to deactivate the account for ${user.name}? They will be immediately blocked from logging in to the portal until reactivated.`,
      confirmText: isActivating ? 'Activate Account' : 'Deactivate Account',
      cancelText: 'Cancel',
      variant: isActivating ? 'warning' : 'danger',
      isLoading: false,
      requireMatchText: '',
      onConfirm: async () => {
        setConfirmModalConfig(prev => ({ ...prev, isLoading: true }));
        try {
          const res = await fetch(`/api/owner/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: isActivating ? 'ACTIVE' : 'INACTIVE' })
          });
          const data = await res.json();
          if (res.ok) {
            setConfirmModalConfig({ isOpen: false, requireMatchText: '' });
            fetchUsers();
            fetchAuditLogs();
          } else {
            alert(data.error || 'Failed to update account status.');
            setConfirmModalConfig(prev => ({ ...prev, isLoading: false }));
          }
        } catch (err) {
          console.error(err);
          setConfirmModalConfig(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  // Unified Navigation Menu
  const operationsNavTabs = [
    { id: 'daily_log', label: 'Daily Arrivals & Departures', desc: 'Check-in & Check-out Flow', icon: Clock },
    { id: 'qr_scanner', label: 'QR Scanner', desc: 'Fast Booking Verification', icon: QrCode },
    { id: 'calendar', label: 'Master Calendar', desc: 'Visual Schedule & Timeline', icon: Calendar },
    { id: 'bookings', label: 'All Bookings Log', desc: 'Search & Snapshot Records', icon: Search },
    { id: 'room_status', label: 'Room Status', desc: 'Real-time Suite Conditions', icon: ShieldCheck },
  ];

  const executiveNavTabs = [
    { id: 'revenue', label: 'Revenue Analytics', desc: 'Financial Overview', icon: DollarSign },
    { id: 'rooms', label: 'Room Management', desc: 'Suites, Pricing & Photos', icon: Layers },
    { id: 'inclusions', label: 'Inclusions Config', desc: 'Add-ons & Amenities', icon: Sliders },
    { id: 'policies', label: 'Rules & Policies', desc: 'House Guidelines', icon: FileText },
    { id: 'experiences', label: 'Guest Reviews & Approval', desc: 'Moderation Queue', icon: Star, badge: guestExpData?.pending?.length > 0 ? guestExpData.pending.length : null },
    { id: 'users', label: 'Staff Accounts', desc: 'Roles & Access Control', icon: Users },
    { id: 'settings', label: 'Settings & Audit Log', desc: 'System & Security', icon: Settings },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch lg:items-start pb-16">
      
      {/* ================= UNIFIED EXECUTIVE SIDEBAR NAV ================= */}
      <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-24 z-20">
        <div className="liquid-glass rounded-3xl p-3 sm:p-4 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-4 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar">
          
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white block">
                Executive Command
              </span>
              <span className="text-[9px] font-mono text-zinc-400 block uppercase">
                All-in-One Operations
              </span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-400 text-black font-extrabold uppercase">
              OWNER
            </span>
          </div>

          {/* Section 1: Operations */}
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">
              Front Desk & Operations
            </span>
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 no-scrollbar">
              {operationsNavTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-auto lg:w-full px-3 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-between gap-3 group text-left ${
                      isActive
                        ? 'bg-white text-black shadow-lg shadow-white/10 scale-[1.01]'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive ? 'bg-black text-white' : 'bg-white/5 text-zinc-400 group-hover:text-white group-hover:bg-white/10'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-bold text-[11px]">{tab.label}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Executive Management */}
          <div className="space-y-1 pt-2 border-t border-white/10">
            <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">
              Management & Controls
            </span>
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 no-scrollbar">
              {executiveNavTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-auto lg:w-full px-3 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-between gap-3 group text-left ${
                      isActive
                        ? 'bg-white text-black shadow-lg shadow-white/10 scale-[1.01]'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive ? 'bg-black text-white' : 'bg-white/5 text-zinc-400 group-hover:text-white group-hover:bg-white/10'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-bold text-[11px]">{tab.label}</span>
                      </div>
                    </div>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        isActive ? 'bg-rose-500 text-white' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </aside>

      {/* ================= ACTIVE TAB MAIN CONTENT ================= */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* ----------------- TAB: DAILY ARRIVALS & DEPARTURES LOG ----------------- */}
        {activeTab === 'daily_log' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">
                  Asia/Manila Operations
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Daily Arrival & Departure Management
                </h2>
              </div>

              <div className="flex items-center space-x-2 self-start md:self-auto">
                <button
                  onClick={handlePrevDay}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
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
                >
                  <span className="hidden sm:inline">Next</span>
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

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setDailySubTab('arrivals')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  dailySubTab === 'arrivals' ? 'bg-white/10 border-white shadow-lg' : 'bg-black/40 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Expected Arrivals (All)</span>
                  <LogIn className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-2xl font-black text-white font-mono">{dailyData.arrivals?.length || 0}</span>
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
                <span className="text-2xl font-black text-white font-mono">{dailyData.departures?.length || 0}</span>
              </div>

              <div
                onClick={() => setDailySubTab('in_house')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  dailySubTab === 'in_house' ? 'bg-white/10 border-white shadow-lg' : 'bg-black/40 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Currently In-House</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-2xl font-black text-white font-mono">{dailyData.inHouse?.length || 0}</span>
              </div>
            </div>

            {/* List for active subtab */}
            <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white font-mono uppercase">
                {dailySubTab === 'arrivals' && `All Expected Arrivals (${dailyData.arrivals?.length || 0})`}
                {dailySubTab === 'departures' && `Expected Departures (${dailyData.departures?.length || 0})`}
                {dailySubTab === 'in_house' && `Currently In-House Guests (${dailyData.inHouse?.length || 0})`}
              </h3>

              {isLoadingDaily ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
                </div>
              ) : (
                <div className="space-y-3">
                  {(dailySubTab === 'arrivals' ? dailyData.arrivals : dailySubTab === 'departures' ? dailyData.departures : dailyData.inHouse)?.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-xs italic">
                      {dailySubTab === 'arrivals' ? 'No customer bookings found.' : 'No guests scheduled for this category.'}
                    </div>
                  ) : (
                    (dailySubTab === 'arrivals' ? dailyData.arrivals : dailySubTab === 'departures' ? dailyData.departures : dailyData.inHouse).map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-black text-white">{item.guest_name}</span>
                            <span className="text-xs font-mono text-zinc-400">&bull; {item.room_name} ({item.location})</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-zinc-300">
                              {item.reference_number}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400 flex flex-wrap gap-3">
                            <span>Check-in: <strong className="text-white font-mono">{item.check_in}</strong></span>
                            <span>Check-out: <strong className="text-white font-mono">{item.check_out}</strong></span>
                            <span>Status: <strong className="text-amber-400 uppercase font-mono">{item.check_in_status}</strong></span>
                            <span>Deposit: <strong className="text-emerald-400 font-mono">{item.deposit_status || 'PENDING'}</strong></span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                          {item.check_in_status === 'NOT_CHECKED_IN' && (
                            <button
                              onClick={() => handleUpdateCheckInStatus(item.id, 'CHECKED_IN')}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center space-x-1"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Mark Check-in</span>
                            </button>
                          )}
                          {item.check_in_status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleUpdateCheckInStatus(item.id, 'CHECKED_OUT')}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center space-x-1"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Mark Check-out</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedBookingForModal(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: QR SCANNER ----------------- */}
        {activeTab === 'qr_scanner' && (
          <div className="space-y-6">
            {scannedBooking ? (
              /* Verified Booking Details Full Screen View */
              <div className="space-y-6 animate-fade-in">
                {/* Top Navigation Back Bar */}
                <div className="flex items-center justify-between pb-1">
                  <button
                    type="button"
                    onClick={handleReturnToScanner}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/15 hover:scale-105 shadow-md group"
                  >
                    <ChevronLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Camera Scanner</span>
                  </button>
                  <span className="text-[11px] font-mono text-zinc-400 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Verified Dossier Active</span>
                  </span>
                </div>

                {/* Header with Back to Scanner button */}
                <div className="p-5 sm:p-6 rounded-3xl liquid-glass border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>VERIFIED VOUCHER</span>
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        Ref: <strong className="text-white font-mono">{scannedBooking.reference_number}</strong>
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {scannedBooking.room_name || `Room #${scannedBooking.room_id}`}
                    </h2>
                    <span className="text-xs text-zinc-400">
                      📍 Location: <strong className="text-white">{scannedBooking.location || 'Antipolo / Cainta'}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
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
                      onClick={handleReturnToScanner}
                      className="liquid-btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-lg hover:scale-105 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Scan Another QR Code</span>
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Guest Information */}
                  <div className="p-6 rounded-3xl bg-black/60 border border-white/10 space-y-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                      Primary Guest Profile
                    </span>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-zinc-400">Guest Name:</span>
                        <strong className="text-white text-base">{scannedBooking.guest_name}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-zinc-400">Guest Count:</span>
                        <strong className="text-white font-mono">{scannedBooking.guest_count} Person(s)</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-zinc-400">Contact Number:</span>
                        <strong className="text-emerald-400 font-mono text-sm">{scannedBooking.contact_number}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-zinc-400">Email Address:</span>
                        <span className="text-zinc-300 font-mono">{scannedBooking.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-white/5">
                        <span className="text-zinc-400">Vehicle / Parking:</span>
                        <span className="text-white font-mono">{scannedBooking.vehicle || 'None'}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-zinc-400">Primary Guest Age:</span>
                        <span className="text-white font-mono">{scannedBooking.age || '18+'} yrs old</span>
                      </div>
                    </div>
                  </div>

                  {/* Stay Schedule & Timings */}
                  <div className="p-6 rounded-3xl bg-black/60 border border-white/10 space-y-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                      Stay Schedule & Times
                    </span>
                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-mono block">Check-In Date</span>
                          <strong className="text-white text-sm font-mono">{scannedBooking.check_in}</strong>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 font-bold">Standard: 2:00 PM</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase font-mono block">Check-Out Date</span>
                          <strong className="text-white text-sm font-mono">{scannedBooking.check_out}</strong>
                        </div>
                        <span className="text-xs font-mono text-zinc-400 font-bold">Standard: 12:00 PM</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <span className="text-zinc-400">Booking Status:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {scannedBooking.booking_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary & Actions Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-black/60 border border-white/15 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold">
                      Financial Summary & Status
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-white/10 text-white border border-white/20">
                      Payment Method: {scannedBooking.payment_method || 'Online Gateway'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
                      <span className="text-[10px] text-zinc-400 uppercase block">Total Stay</span>
                      <strong className="text-white text-base">
                        ₱{Number(scannedBooking.breakdown?.total_amount || scannedBooking.amount || 0).toLocaleString()}
                      </strong>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
                      <span className="text-[10px] text-emerald-400 uppercase block">Down Payment Paid</span>
                      <strong className="text-emerald-300 text-base">
                        ₱{Number(scannedBooking.breakdown?.down_payment || scannedBooking.amount || 0).toLocaleString()}
                      </strong>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
                      <span className="text-[10px] text-zinc-400 uppercase block">Remaining Balance</span>
                      <strong className={`text-base ${
                        Number(scannedBooking.breakdown?.remaining_balance || 0) <= 0
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}>
                        ₱{Number(scannedBooking.breakdown?.remaining_balance || 0).toLocaleString()}
                      </strong>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
                      <span className="text-[10px] text-zinc-400 uppercase block">Security Deposit</span>
                      <strong className={`text-base uppercase ${
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

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                    {scannedBooking.check_in_status === 'NOT_CHECKED_IN' && (
                      <button
                        onClick={async () => {
                          await handleUpdateCheckInStatus(scannedBooking.id, 'CHECKED_IN');
                          setScannedBooking(prev => prev ? { ...prev, check_in_status: 'CHECKED_IN' } : null);
                        }}
                        className="flex-1 py-3 px-6 rounded-2xl bg-emerald-500 text-black font-black uppercase tracking-wider text-xs shadow-lg hover:bg-emerald-400 transition-all flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Check-In</span>
                      </button>
                    )}
                    {scannedBooking.check_in_status === 'CHECKED_IN' && (
                      <button
                        onClick={async () => {
                          await handleUpdateCheckInStatus(scannedBooking.id, 'CHECKED_OUT');
                          setScannedBooking(prev => prev ? { ...prev, check_in_status: 'CHECKED_OUT' } : null);
                        }}
                        className="flex-1 py-3 px-6 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-wider text-xs shadow-lg hover:bg-rose-400 transition-all flex items-center justify-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Confirm Check-Out</span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedBookingForModal(scannedBooking)}
                      className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs transition-colors flex items-center space-x-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Full Snapshot</span>
                    </button>
                    <button
                      onClick={handleReturnToScanner}
                      className="px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold uppercase text-xs transition-colors flex items-center space-x-1.5 border border-white/10 shadow-lg"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Scan Next</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal Scanner Mode (Camera, Upload, Manual) */
              <div className="space-y-6">
                <div className="p-4 sm:p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Verification Engine</span>
                    <h2 className="text-xl sm:text-2xl font-black text-white">QR Code Fast Verification & Check-In</h2>
                  </div>
                  <div className="flex items-center space-x-1 bg-black/50 p-1 rounded-2xl border border-white/10">
                    <button
                      onClick={() => {
                        setScannerMode('camera');
                        setQrScanError(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center space-x-1.5 ${
                        scannerMode === 'camera' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Live Camera</span>
                    </button>
                    <button
                      onClick={() => {
                        stopCameraScanner();
                        setScannerMode('upload');
                        setQrScanError(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center space-x-1.5 ${
                        scannerMode === 'upload' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image</span>
                    </button>
                  </div>
                </div>

                {/* Error Banner when Red State / Failed Scan */}
                {qrScanError && (
                  <div className="p-4 rounded-2xl bg-rose-500/20 border-2 border-rose-500 text-rose-200 text-xs flex items-center justify-between shadow-2xl animate-fade-in">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 animate-bounce" />
                      <div>
                        <strong className="block text-sm text-white font-bold">QR Verification Failed</strong>
                        <span>{qrScanError}</span>
                      </div>
                    </div>
                    {scannerMode === 'camera' && isCameraActive && (
                      <span className="px-3 py-1 rounded-xl bg-black/60 border border-rose-400/40 text-[11px] font-mono text-rose-300">
                        Camera streaming... Ready to scan
                      </span>
                    )}
                  </div>
                )}

                {/* QR Scanner Display */}
                <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-black/60 border border-white/10 space-y-6 flex flex-col items-center justify-center text-center shadow-2xl">
                  {scannerMode === 'camera' ? (
                    <div className="w-full space-y-4">
                      <div className={`relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden bg-black border-2 transition-all flex items-center justify-center shadow-2xl ${
                        qrScanError ? 'border-rose-500 shadow-rose-500/20' : 'border-dashed border-white/20'
                      }`}>
                        <div id="qr-reader-viewport" className="w-full h-full" />
                        {!isCameraActive && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-3 bg-black/80">
                            <QrCode className="w-12 h-12 text-zinc-500" />
                            <button
                              onClick={() => startCameraScanner()}
                              disabled={isStartingCamera}
                              className="liquid-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2"
                            >
                              {isStartingCamera ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                              <span>Start Camera Scan</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {isCameraActive && (
                        <div className="flex items-center justify-center gap-2">
                          {cameraDevices.length > 1 && (
                            <button
                              onClick={() => {
                                const currIdx = cameraDevices.findIndex(d => d.id === selectedCameraId);
                                const nextDevice = cameraDevices[(currIdx + 1) % cameraDevices.length];
                                handleSwitchCamera(nextDevice.id);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1.5"
                            >
                              <SwitchCamera className="w-3.5 h-3.5" />
                              <span>Switch Camera</span>
                            </button>
                          )}
                          <button
                            onClick={stopCameraScanner}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center space-x-1.5"
                          >
                            <VideoOff className="w-3.5 h-3.5" />
                            <span>Stop Camera</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full max-w-sm space-y-4">
                      <div id="qr-reader-file-temp" className="hidden" />
                      <label
                        onClick={() => qrFileInputRef.current?.click()}
                        className="w-full aspect-square rounded-3xl border-2 border-dashed border-white/20 hover:border-amber-400/60 p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-white/5 hover:bg-white/10 transition-all group"
                      >
                        <Upload className="w-10 h-10 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-white text-xs">Tap to Upload QR Voucher Image</span>
                        <span className="text-[10px] text-zinc-400 mt-1">Select screenshot from photos</span>
                      </label>
                      <input
                        ref={qrFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Manual Reference Fallback */}
                  <div className="w-full pt-4 border-t border-white/10 space-y-2">
                    <span className="text-[10px] font-mono text-zinc-400 block uppercase">Or Enter Booking Reference:</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. CGC-20261006-1234"
                        value={scannedRefInput}
                        onChange={(e) => setScannedRefInput(e.target.value)}
                        className="flex-1 h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono uppercase focus:border-amber-400/60 focus:outline-none"
                      />
                      <button
                        onClick={() => handleLookupQR(scannedRefInput)}
                        disabled={isScanning}
                        className="liquid-btn-primary px-4 rounded-xl text-xs font-bold uppercase flex items-center space-x-1"
                      >
                        {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        <span>Search</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: MASTER CALENDAR ----------------- */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            
            {/* Calendar Control Bar */}
            <div className="p-4 sm:p-5 rounded-3xl liquid-glass border border-white/15 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block font-bold">
                  Visual Schedule Matrix
                </span>
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
                    <button
                      onClick={() => setActiveTab('rooms')}
                      className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all inline-flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Manage Suites</span>
                    </button>
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

        {/* ----------------- TAB: ALL BOOKINGS ----------------- */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Roster & Records</span>
                <h2 className="text-xl sm:text-2xl font-black text-white">All Booking Records</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Search guest, ref, email..."
                  value={bookingSearchQuery}
                  onChange={(e) => setBookingSearchQuery(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none"
                />
                <select
                  value={bookingFilterLocation}
                  onChange={(e) => setBookingFilterLocation(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white text-xs"
                >
                  <option value="All">All Locations</option>
                  <option value="Antipolo">Antipolo</option>
                  <option value="Cainta">Cainta</option>
                </select>
                <select
                  value={bookingFilterStatus}
                  onChange={(e) => setBookingFilterStatus(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="CHECKED_IN">CHECKED_IN</option>
                  <option value="CHECKED_OUT">CHECKED_OUT</option>
                  <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                </select>
              </div>
            </div>

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
                      className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-black text-white">{b.room_name}</span>
                          <span className="text-xs text-zinc-400 font-mono">({b.location})</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-zinc-300">
                            {b.reference_number}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {b.booking_status}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-300 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Guest: <strong className="text-white">{b.guest_name}</strong></span>
                          <span>Dates: <strong className="text-white font-mono">{b.check_in} &rarr; {b.check_out}</strong></span>
                          <span>Total: <strong className="text-white font-mono">₱{Number(b.total_amount || b.amount || 0).toLocaleString()}</strong></span>
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

        {/* ----------------- TAB: ROOM STATUS ----------------- */}
        {activeTab === 'room_status' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-6 rounded-3xl liquid-glass border border-white/15 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Live Conditions</span>
                <h2 className="text-xl sm:text-2xl font-black text-white">Suite Status & Housekeeping</h2>
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

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-mono block">Today's Guest</span>
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

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-mono">Change Status:</span>
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

        {/* ----------------- TAB: REVENUE ANALYTICS ----------------- */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Executive Financials</span>
                <h2 className="text-2xl font-black text-white">Revenue Performance & Analytics</h2>
              </div>
              <button
                onClick={fetchRevenue}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-1 shadow-lg">
                <span className="text-xs font-mono text-zinc-400 uppercase">Total Revenue</span>
                <div className="text-3xl font-black text-white font-mono">
                  ₱{Number(revenueData?.totalRevenue || 0).toLocaleString()}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-1 shadow-lg">
                <span className="text-xs font-mono text-zinc-400 uppercase">Paid Reservations</span>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {revenueData?.paidBookingsCount || 0}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-1 shadow-lg">
                <span className="text-xs font-mono text-zinc-400 uppercase">Pending Payments</span>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  {revenueData?.pendingPaymentsCount || 0}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-1 shadow-lg">
                <span className="text-xs font-mono text-zinc-400 uppercase">Security Deposits Held</span>
                <div className="text-3xl font-black text-cyan-400 font-mono">
                  ₱{Number(revenueData?.securityDepositsInCustody || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Revenue By Location & Room */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-black/50 border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white font-mono uppercase">Revenue by Branch</h3>
                <div className="space-y-3">
                  {revenueData?.revenueByLocation?.map((loc, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-white text-xs">{loc.location}</span>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-sm font-black text-white">₱{Number(loc.revenue || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-zinc-400">{loc.total_bookings} bookings</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-black/50 border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white font-mono uppercase">Top Performing Suites</h3>
                <div className="space-y-3">
                  {revenueData?.revenueByRoom?.map((rm, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-xs block">{rm.room_name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{rm.location}</span>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-sm font-black text-white">₱{Number(rm.revenue || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-zinc-400">{rm.total_bookings} stays</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB: ROOM MANAGEMENT & PHOTOS ----------------- */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Inventory & Pricing</span>
                <h2 className="text-2xl font-black text-white">Suite Customization & Photos</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenRoomModal()}
                  className="liquid-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Suite</span>
                </button>
              </div>
            </div>

            {rooms.length === 0 ? (
              <div className="p-12 sm:p-16 rounded-3xl bg-black/40 border-2 border-dashed border-white/15 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">No Suites in Inventory</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                    Click "Add New Suite" to begin configuring your actual resort suites, pricing, and device photos.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenRoomModal()}
                  className="liquid-btn-primary px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-2 shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Real Suite</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-5 rounded-3xl border space-y-4 flex flex-col justify-between shadow-xl transition-all ${
                      room.is_featured
                        ? 'bg-amber-950/15 border-amber-400/30 shadow-amber-500/5'
                        : 'bg-black/60 border-white/10'
                    }`}
                  >
                    <div>
                      {room.images && room.images.length > 0 && (
                        <div className="w-full h-44 rounded-2xl overflow-hidden mb-3 border border-white/10 relative group">
                          <img src={room.images[0]} alt={room.room_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          
                          {/* Photo Count Badge */}
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/80 text-[10px] font-mono text-white backdrop-blur-md">
                            📸 {room.images.length} photos
                          </span>

                          {/* Top Left: Quick Featured Toggle Badge/Button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleFeaturedRoom(room, e)}
                            className={`absolute top-2.5 left-2.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 backdrop-blur-md transition-all shadow-lg ${
                              room.is_featured
                                ? 'bg-amber-400 text-black shadow-amber-400/30 hover:bg-amber-300'
                                : 'bg-black/70 hover:bg-black text-zinc-300 hover:text-white border border-white/20'
                            }`}
                            title={room.is_featured ? 'Featured on Home (Click to disable)' : 'Click to feature on home page'}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${room.is_featured ? 'bg-black animate-pulse' : 'bg-zinc-500'}`} />
                            <span>{room.is_featured ? 'Featured Suite' : 'Set Featured'}</span>
                          </button>
                        </div>
                      )}

                      {/* Header Row with Room Name & Featured Button */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-lg font-black text-white truncate">{room.room_name}</h3>
                        <button
                          type="button"
                          onClick={(e) => handleToggleFeaturedRoom(room, e)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all shrink-0 ${
                            room.is_featured
                              ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-md shadow-amber-400/20'
                              : 'bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white border border-white/10'
                          }`}
                          title={room.is_featured ? 'Click to disable Featured Suite' : 'Click to enable Featured Suite'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${room.is_featured ? 'bg-black animate-pulse' : 'bg-zinc-600'}`} />
                          <span>{room.is_featured ? 'Featured' : 'Not Featured'}</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-zinc-400 mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{room.location}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-white font-bold">₱{Number(room.price_per_night).toLocaleString()}/night</span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">{room.description}</p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenRoomModal(room)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Suite</span>
                      </button>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`/suite/${room.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs transition-colors"
                          title="View Live Suite Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeactivateRoom(room)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition-colors"
                          title="Delete Suite"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB: INCLUSIONS CONFIG ----------------- */}
        {activeTab === 'inclusions' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Add-ons & Differentiated Pricing</span>
                <h2 className="text-2xl font-black text-white">Inclusion Price Configuration</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure custom pricing per location (Antipolo vs. Cainta) or apply globally.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingInclusion(null);
                  setIncName('');
                  setIncDesc('');
                  setIncPrice(200);
                  setIncLocation(incLocationFilter !== 'All' ? incLocationFilter : 'All');
                  setIncActive(true);
                  setShowInclusionModal(true);
                }}
                className="liquid-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add Inclusion</span>
              </button>
            </div>

            {/* Location Filter Tabs */}
            <div className="flex items-center space-x-2">
              {[
                { id: 'All', label: 'All Inclusions', count: inclusions.length },
                { id: 'Antipolo', label: 'Antipolo Only', count: inclusions.filter((i) => i.location === 'Antipolo').length },
                { id: 'Cainta', label: 'Cainta Only', count: inclusions.filter((i) => i.location === 'Cainta').length },
                { id: 'Global', label: 'All Locations (Shared)', count: inclusions.filter((i) => !i.location || i.location === 'All').length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setIncLocationFilter(tab.id === 'Global' ? 'All_Shared' : tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 ${
                    (tab.id === 'Global' && incLocationFilter === 'All_Shared') || incLocationFilter === tab.id
                      ? 'bg-white text-black shadow-lg shadow-white/10'
                      : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-black/40 text-zinc-300">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Inclusions List */}
            <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-3">
              {inclusions
                .filter((inc) => {
                  if (incLocationFilter === 'All') return true;
                  if (incLocationFilter === 'All_Shared') return !inc.location || inc.location === 'All';
                  return inc.location === incLocationFilter;
                })
                .map((inc) => (
                <div key={inc.id} className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{inc.name}</h4>
                      
                      {/* Location Badge */}
                      {inc.location === 'Antipolo' ? (
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          📍 Antipolo
                        </span>
                      ) : inc.location === 'Cainta' ? (
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          📍 Cainta
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/15">
                          🌐 All Locations
                        </span>
                      )}

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${inc.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                        {inc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{inc.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase block">Rate</span>
                      <span className="text-base sm:text-lg font-black text-white font-mono">₱{Number(inc.price).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditingInclusion(inc);
                        setIncName(inc.name);
                        setIncDesc(inc.description || '');
                        setIncPrice(inc.price);
                        setIncLocation(inc.location || 'All');
                        setIncActive(Boolean(inc.is_active));
                        setShowInclusionModal(true);
                      }}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                      title="Edit Inclusion"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------- TAB: RULES & POLICIES ----------------- */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">House Rules</span>
                <h2 className="text-2xl font-black text-white">Rules & Policies Configuration</h2>
              </div>
              <button
                onClick={() => {
                  setEditingPolicy(null);
                  setPolTitle('');
                  setPolContent('');
                  setPolOrder(policies.length + 1);
                  setPolActive(true);
                  setShowPolicyModal(true);
                }}
                className="liquid-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add Policy</span>
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-3">
              {policies.map((pol) => (
                <div key={pol.id} className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-zinc-400">#{pol.display_order}</span>
                      <h4 className="text-sm font-bold text-white">{pol.title}</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${pol.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                        {pol.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">{pol.content}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingPolicy(pol);
                      setPolTitle(pol.title);
                      setPolContent(pol.content);
                      setPolOrder(pol.display_order);
                      setPolActive(Boolean(pol.is_active));
                      setShowPolicyModal(true);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs self-end sm:self-auto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------- TAB: GUEST EXPERIENCES & APPROVALS ----------------- */}
        {activeTab === 'experiences' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl liquid-glass border border-white/15 shadow-xl">
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Review Moderation</span>
              <h2 className="text-2xl font-black text-white">Guest Experience Approvals</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Guest submissions default to PENDING status and only appear publicly once APPROVED by the Owner.
              </p>
            </div>

            <div className="flex space-x-2 border-b border-white/10 pb-2 text-xs">
              <button
                onClick={() => setExpSubTab('pending')}
                className={`px-4 py-2 rounded-xl font-bold uppercase ${
                  expSubTab === 'pending' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Pending ({guestExpData.pending?.length || 0})
              </button>
              <button
                onClick={() => setExpSubTab('approved')}
                className={`px-4 py-2 rounded-xl font-bold uppercase ${
                  expSubTab === 'approved' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Approved ({guestExpData.approved?.length || 0})
              </button>
              <button
                onClick={() => setExpSubTab('declined')}
                className={`px-4 py-2 rounded-xl font-bold uppercase ${
                  expSubTab === 'declined' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Declined ({guestExpData.declined?.length || 0})
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-3">
              {(guestExpData[expSubTab] || []).length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs italic">
                  No guest experiences in this queue.
                </div>
              ) : (
                guestExpData[expSubTab].map((exp) => (
                  <div key={exp.id} className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">{exp.guest_name}</span>
                        <span className="text-amber-400 font-bold">★ {exp.rating}/5</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{exp.stay_date || exp.created_at}</span>
                      </div>
                      <p className="text-xs text-zinc-300 italic">"{exp.review_text}"</p>
                    </div>

                    <div className="flex items-center space-x-2 self-end md:self-auto">
                      {expSubTab === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReviewStatus(exp.id, 'APPROVED')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewStatus(exp.id, 'DECLINED')}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleConfirmDeleteReview(exp.id, exp.guest_name)}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 text-xs transition-colors"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: STAFF ACCOUNTS MANAGEMENT ----------------- */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Access Control & Security</span>
                <h2 className="text-2xl font-black text-white">Staff Accounts & Permissions</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage staff and customer support credentials and roles. Deactivated accounts are instantly blocked from logging in.
                </p>
              </div>
              <button
                onClick={() => {
                  setCreateUserError('');
                  setShowCreateUserModal(true);
                }}
                className="liquid-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-lg self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Staff Account</span>
              </button>
            </div>

            {/* Filters & Search */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: 'ALL', label: 'All Accounts', count: users.length },
                  { id: 'STAFF', label: 'Staff', count: users.filter(u => u.role === 'STAFF').length },
                  { id: 'CUSTOMER_SUPPORT', label: 'Support', count: users.filter(u => u.role === 'CUSTOMER_SUPPORT').length },
                  { id: 'ACTIVE', label: 'Active', count: users.filter(u => u.status === 'ACTIVE').length },
                  { id: 'INACTIVE', label: 'Deactivated', count: users.filter(u => u.status === 'INACTIVE').length },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setUserRoleFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all ${
                      userRoleFilter === f.id
                        ? 'bg-amber-400 text-black shadow-md'
                        : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {f.label} <span className="opacity-70 text-[10px]">({f.count})</span>
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400/50"
                />
              </div>
            </div>

            {/* User List */}
            <div className="space-y-3">
              {isLoadingUsers ? (
                <div className="p-12 text-center text-zinc-500 text-xs rounded-3xl bg-black/40 border border-white/10">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                  Loading staff accounts...
                </div>
              ) : (
                (() => {
                  const filtered = users.filter(u => {
                    if (userRoleFilter === 'STAFF' && u.role !== 'STAFF') return false;
                    if (userRoleFilter === 'CUSTOMER_SUPPORT' && u.role !== 'CUSTOMER_SUPPORT') return false;
                    if (userRoleFilter === 'ACTIVE' && u.status !== 'ACTIVE') return false;
                    if (userRoleFilter === 'INACTIVE' && u.status !== 'INACTIVE') return false;
                    if (userSearchQuery) {
                      const q = userSearchQuery.toLowerCase();
                      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-12 text-center text-zinc-500 text-xs rounded-3xl bg-black/40 border border-white/10 italic">
                        No staff or support accounts match your search or filter.
                      </div>
                    );
                  }

                  return filtered.map((u) => {
                    const isOwner = u.role === 'OWNER';
                    const isActive = u.status === 'ACTIVE';

                    return (
                      <div
                        key={u.id}
                        className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isOwner
                            ? 'bg-amber-950/10 border-amber-500/20 shadow-lg'
                            : isActive
                            ? 'bg-black/60 border-white/10 hover:border-white/20'
                            : 'bg-zinc-950/60 border-rose-500/20 opacity-80'
                        }`}
                      >
                        {/* Account Info */}
                        <div className="flex items-start space-x-4">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                            isOwner
                              ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                              : u.role === 'STAFF'
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          }`}>
                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-white text-sm">{u.name}</span>
                              
                              {/* Role Tag */}
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wide border flex items-center space-x-1 ${
                                isOwner
                                  ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                                  : u.role === 'STAFF'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              }`}>
                                {isOwner ? '👑 Master Owner' : u.role === 'STAFF' ? '🏨 Staff' : '🎧 Customer Support'}
                              </span>

                              {/* Status Tag */}
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center space-x-1.5 ${
                                isActive
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                                <span>{isActive ? 'ACTIVE' : 'DEACTIVATED'}</span>
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-mono">
                              <span className="flex items-center space-x-1.5 text-zinc-300">
                                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{u.email}</span>
                              </span>
                              {u.created_at && (
                                <span className="text-[11px] text-zinc-500">
                                  Created: {u.created_at.split('T')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 self-end md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5 w-full md:w-auto justify-end">
                          {isOwner ? (
                            <span className="px-3 py-1.5 rounded-xl bg-amber-400/10 text-amber-400/70 border border-amber-400/20 text-[11px] font-mono flex items-center space-x-1">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Master Account Protected</span>
                            </span>
                          ) : (
                            <>
                              {/* Edit Account */}
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-white border border-white/10 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-sm"
                                title="Edit Account Details"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Edit</span>
                              </button>

                              {/* Activate / Deactivate Toggle */}
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-sm border ${
                                  isActive
                                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                                }`}
                                title={isActive ? 'Deactivate this staff account' : 'Activate this staff account'}
                              >
                                {isActive ? (
                                  <>
                                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Activate</span>
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: SETTINGS & AUDIT LOG ----------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl liquid-glass border border-white/15 shadow-xl">
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">System Configuration</span>
              <h2 className="text-2xl font-black text-white">System Settings & Audit Logs</h2>
            </div>

            <div className="p-6 rounded-3xl bg-black/50 border border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white font-mono uppercase">System Settings</h3>
              {saveSettingsSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs">
                  Settings saved successfully!
                </div>
              )}
              <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-zinc-400 font-mono block mb-1">Security Deposit Amount (₱)</label>
                  <input
                    type="number"
                    value={systemSettings.security_deposit_amount || '1000'}
                    onChange={(e) => setSystemSettings({ ...systemSettings, security_deposit_amount: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-mono block mb-1">Facebook Messenger URL</label>
                  <input
                    type="text"
                    value={systemSettings.meta_messenger_url || ''}
                    onChange={(e) => setSystemSettings({ ...systemSettings, meta_messenger_url: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end">
                  <button type="submit" className="liquid-btn-primary px-6 py-2.5 rounded-xl font-bold uppercase text-xs">
                    Save Settings
                  </button>
                </div>
              </form>
            </div>

            <div className="p-6 rounded-3xl bg-black/50 border border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white font-mono uppercase">Audit Log (Recent 100 Entries)</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-black/60 border border-white/5 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white font-mono uppercase">{log.action}</span>
                      <span className="text-zinc-400 block">{log.details} ({log.target})</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{log.created_at} &bull; {log.user_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODAL 1: BOOKING DETAIL SNAPSHOT ================= */}
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

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="font-bold uppercase tracking-wider text-zinc-300 font-mono block">Financial Preservation Breakdown</span>
              <div className="flex justify-between text-zinc-400">
                <span>Room Rate:</span>
                <span className="text-white font-mono">₱{Number(selectedBookingForModal.room_subtotal || selectedBookingForModal.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Inclusions Subtotal:</span>
                <span className="text-white font-mono">₱{Number(selectedBookingForModal.inclusions_subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Security Deposit:</span>
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

      {/* ================= MODAL 2: ADD / EDIT SUITE (Device Photo Uploader & Full Inclusions Editor) ================= */}
      <CustomModal
        isOpen={showRoomModal}
        onClose={() => setShowRoomModal(false)}
        title={editingRoom ? `Edit Suite: ${editingRoom.room_name}` : 'Add New Luxury Suite'}
        subtitle="Suite Customization, 4-Category Inclusions & Inventory"
        icon={Bed}
        size="4xl"
      >
        <div className="space-y-4">
          {roomSaveError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{roomSaveError}</span>
            </div>
          )}

          {/* Modal Sub-Tabs */}
          <div className="flex space-x-1.5 p-1 bg-black/60 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setRoomModalTab('inclusions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                roomModalTab === 'inclusions'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>✨ Included Amenities (4 Categories)</span>
            </button>

            <button
              type="button"
              onClick={() => setRoomModalTab('basic')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                roomModalTab === 'basic'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bed className="w-3.5 h-3.5" />
              <span>🏨 Basic Info & Rate</span>
            </button>

            <button
              type="button"
              onClick={() => setRoomModalTab('specs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                roomModalTab === 'specs'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>📐 Quick Specs & Location</span>
            </button>

            <button
              type="button"
              onClick={() => setRoomModalTab('rules')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                roomModalTab === 'rules'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📜 Stay Policies ({roomFormHouseRules.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setRoomModalTab('photos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                roomModalTab === 'photos'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📸 Device Photos ({roomFormImages.length})</span>
            </button>
          </div>

          <form onSubmit={handleSaveRoom} className="space-y-4 text-xs">
            {/* ================= TAB 1: INCLUDED AMENITIES & PERKS (4 CATEGORIES) ================= */}
            {roomModalTab === 'inclusions' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-200 text-xs flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">4-Category Complimentary Inclusions</span>
                    <span className="text-zinc-300 text-[11px] leading-relaxed">
                      Edit, add, or customize every inclusion item per category for this suite. These will appear highlighted in the "Included Amenities & Perks" section of the public suite screen.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {STANDARD_AMENITIES_CONFIG.map((cat) => {
                    const CatIcon = cat.icon;
                    const items = roomFormAmenities[cat.key] || [];

                    return (
                      <div key={cat.key} className="p-4 rounded-3xl bg-black/60 border border-white/15 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center space-x-2 text-white">
                            <div className="p-2 rounded-xl bg-white/10 text-white">
                              <CatIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs">{cat.title}</h4>
                              <span className="text-[10px] text-zinc-400 font-mono">{items.length} items configured</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleResetAmenityCategory(cat.key)}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] text-zinc-400 hover:text-white transition-colors"
                              title="Reset to default inclusions"
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddAmenityItem(cat.key)}
                              className="px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-[11px] font-bold flex items-center space-x-1 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>

                        {items.length === 0 ? (
                          <div className="py-4 text-center text-zinc-500 text-[11px] italic">
                            No inclusions added for this category yet. Click "Add" above.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {items.map((item, idx) => (
                              <div key={idx} className="flex items-center space-x-2 group">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                <input
                                  type="text"
                                  placeholder={cat.placeholder}
                                  value={item}
                                  onChange={(e) => handleUpdateAmenityItem(cat.key, idx, e.target.value)}
                                  className="flex-1 h-8 px-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAmenityItem(cat.key, idx)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 transition-colors opacity-70 group-hover:opacity-100"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Highlights Pills Under "About This Luxury Suite" */}
                <div className="p-4 rounded-3xl bg-black/60 border border-white/15 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <h4 className="font-bold text-white text-xs">Suite Feature Highlight Badges</h4>
                      <p className="text-[10px] text-zinc-400">Pills displayed right beneath "About This Luxury Suite"</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddHighlight}
                      className="px-2.5 py-1 rounded-lg bg-emerald-400/15 hover:bg-emerald-400/25 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold flex items-center space-x-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Highlight</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {roomFormHighlights.map((hl, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5 p-1.5 rounded-xl bg-black/40 border border-white/10">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                        <input
                          type="text"
                          placeholder="e.g. Instant QR Pass Check-in"
                          value={hl}
                          onChange={(e) => handleUpdateHighlight(idx, e.target.value)}
                          className="flex-1 h-7 px-2 rounded-lg bg-transparent text-white placeholder:text-zinc-600 focus:outline-none text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlight(idx)}
                          className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: BASIC INFO & PRICING ================= */}
            {roomModalTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Suite Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suite 02"
                      value={roomFormName}
                      onChange={(e) => setRoomFormName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Location *</label>
                    <select
                      value={roomFormLocation}
                      onChange={(e) => setRoomFormLocation(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white focus:border-amber-400/60 focus:outline-none"
                    >
                      <option value="Antipolo">Antipolo</option>
                      <option value="Cainta">Cainta</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Price Per Night (₱) *</label>
                    <input
                      type="number"
                      required
                      min="500"
                      step="50"
                      placeholder="2800"
                      value={roomFormPrice}
                      onChange={(e) => setRoomFormPrice(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono focus:border-amber-400/60 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Suite Status</label>
                    <select
                      value={roomFormStatus}
                      onChange={(e) => setRoomFormStatus(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white focus:border-amber-400/60 focus:outline-none"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                      <option value="UNAVAILABLE">UNAVAILABLE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setRoomFormFeatured(!roomFormFeatured)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                      roomFormFeatured
                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${roomFormFeatured ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
                      <span className="font-bold">Featured Suite (Promoted on Public Catalog)</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      roomFormFeatured ? 'bg-amber-400 text-black' : 'bg-white/10 text-zinc-400'
                    }`}>
                      {roomFormFeatured ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </button>
                </div>

                <div>
                  <label className="text-zinc-400 font-mono block mb-1">About This Luxury Suite (Description)</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the suite sanctuary, design aesthetics, scenic view, and vibe..."
                    value={roomFormDescription}
                    onChange={(e) => setRoomFormDescription(e.target.value)}
                    className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* ================= TAB 3: QUICK SPECS & LOCATION ================= */}
            {roomModalTab === 'specs' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 text-xs">
                  <span className="font-bold text-white block">Suite Highlight Bar Specifications</span>
                  <span className="text-[11px] text-zinc-400">These 4 specs are showcased right beneath the suite title banner and in the summary booking card.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Capacity</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 - 4 Guests"
                      value={roomFormCapacity}
                      onChange={(e) => setRoomFormCapacity(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white focus:border-amber-400/60 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Bed Setup</label>
                    <input
                      type="text"
                      placeholder="e.g. King Luxury Bed"
                      value={roomFormBedSetup}
                      onChange={(e) => setRoomFormBedSetup(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white focus:border-amber-400/60 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Suite Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 35 sqm Studio"
                      value={roomFormSuiteSize}
                      onChange={(e) => setRoomFormSuiteSize(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white focus:border-amber-400/60 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Refundable Deposit (₱)</label>
                    <input
                      type="number"
                      placeholder="1000"
                      value={roomFormSecurityDeposit}
                      onChange={(e) => setRoomFormSecurityDeposit(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono focus:border-amber-400/60 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Check-in Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 2:00 PM onwards"
                      value={roomFormCheckInTime}
                      onChange={(e) => setRoomFormCheckInTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white focus:border-amber-400/60 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Check-out Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 12:00 PM"
                      value={roomFormCheckOutTime}
                      onChange={(e) => setRoomFormCheckOutTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white focus:border-amber-400/60 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-3">
                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Location & Surroundings Narrative</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Located along the breezy scenic ridge of Antipolo, close to iconic overlook cafés, Cloud 9, Pinto Art Museum..."
                      value={roomFormLocationDescription}
                      onChange={(e) => setRoomFormLocationDescription(e.target.value)}
                      className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 font-mono block mb-1">Google Maps Pin URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/?q=..."
                      value={roomFormGoogleMapsUrl}
                      onChange={(e) => setRoomFormGoogleMapsUrl(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 4: HOUSE RULES & STAY POLICIES ================= */}
            {roomModalTab === 'rules' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">House Rules & Stay Policies</h4>
                    <p className="text-[10px] text-zinc-400">Configured policy cards displayed on this suite's page</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddHouseRule}
                    className="px-3 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Stay Policy</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {roomFormHouseRules.map((rule, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-black/60 border border-white/15 space-y-2 relative group shadow-md">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 🚭 No Smoking Inside"
                          value={rule.title}
                          onChange={(e) => handleUpdateHouseRule(idx, 'title', e.target.value)}
                          className="w-full max-w-sm h-8 px-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-bold placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveHouseRule(idx)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 transition-colors"
                          title="Remove policy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Policy description..."
                        value={rule.desc}
                        onChange={(e) => handleUpdateHouseRule(idx, 'desc', e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-zinc-300 placeholder:text-zinc-600 focus:border-amber-400/60 focus:outline-none text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= TAB 5: DEVICE PHOTOS ================= */}
            {roomModalTab === 'photos' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-zinc-200 font-bold block font-mono text-xs">
                      Suite Photos from Device ({roomFormImages.length}) *
                    </label>
                    <span className="text-[10px] text-zinc-400">Upload high-res photos directly from your phone or computer</span>
                  </div>
                  {roomFormImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => roomFileInputRef.current?.click()}
                      className="px-3 py-1 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-[11px] font-bold flex items-center space-x-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add More Photos</span>
                    </button>
                  )}
                </div>

                <input
                  ref={roomFileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  multiple
                  onChange={handleDevicePhotoUpload}
                  className="hidden"
                />

                {roomFormImages.length === 0 ? (
                  <label
                    onClick={() => roomFileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-amber-400/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-black/40 hover:bg-white/5 transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform shadow-lg">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="font-bold text-white text-sm">Tap to Select Photos from Device</span>
                    <span className="text-xs text-zinc-400 mt-1">Supports JPG, PNG, WEBP &bull; Select multiple files at once</span>
                  </label>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {roomFormImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-2xl overflow-hidden h-28 border border-white/20 bg-black/60 shadow-lg">
                        <img src={img} alt={`Suite photo ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx === 0 ? (
                          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-400 text-black shadow-md">
                            Cover Photo
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const reordered = [img, ...roomFormImages.filter((_, i) => i !== idx)];
                              setRoomFormImages(reordered);
                            }}
                            className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-black/80 text-zinc-300 opacity-0 group-hover:opacity-100 hover:bg-amber-400 hover:text-black transition-all"
                          >
                            Make Cover
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setRoomFormImages(roomFormImages.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-rose-500 rounded-lg text-rose-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="text-[11px] text-zinc-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>All 4 inclusion categories & details are synced live</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={isSavingRoom}
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white disabled:opacity-50 transition-colors font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRoom}
                  className="liquid-btn-primary px-7 py-2.5 rounded-xl font-black uppercase tracking-wider flex items-center space-x-2 disabled:opacity-50 shadow-xl"
                >
                  {isSavingRoom ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Suite...</span>
                    </>
                  ) : (
                    <span>{editingRoom ? 'Update Suite Sanctuary' : 'Save New Suite'}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </CustomModal>

      {/* ================= MODAL 3: INCLUSION MODAL ================= */}
      <CustomModal
        isOpen={showInclusionModal}
        onClose={() => setShowInclusionModal(false)}
        title={editingInclusion ? 'Edit Inclusion' : 'Add Inclusion'}
        subtitle="Add-ons & Inclusions by Location"
        icon={Sliders}
        size="md"
      >
        <form onSubmit={handleSaveInclusion} className="space-y-4 text-xs">
          <div>
            <label className="text-zinc-400 font-mono block mb-1">Inclusion Name *</label>
            <input
              type="text"
              required
              value={incName}
              placeholder="e.g. Car Parking Space, Extra Mattress"
              onChange={(e) => setIncName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 font-mono block mb-1">Applicable Location *</label>
              <select
                value={incLocation}
                onChange={(e) => setIncLocation(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white cursor-pointer font-medium"
              >
                <option value="All">All Locations (Shared)</option>
                <option value="Antipolo">Antipolo Suites Only</option>
                <option value="Cainta">Cainta Suites Only</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 font-mono block mb-1">Price (₱) *</label>
              <input
                type="number"
                required
                min="0"
                value={incPrice}
                onChange={(e) => setIncPrice(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 font-mono block mb-1">Description</label>
            <textarea
              rows={2}
              value={incDesc}
              placeholder="Brief description of this inclusion or amenity perk..."
              onChange={(e) => setIncDesc(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-white"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button type="button" onClick={() => setShowInclusionModal(false)} className="px-4 py-2 rounded-xl bg-white/10 text-white">Cancel</button>
            <button type="submit" className="liquid-btn-primary px-5 py-2 rounded-xl font-bold uppercase">Save Inclusion</button>
          </div>
        </form>
      </CustomModal>

      {/* ================= MODAL 4: POLICY MODAL ================= */}
      <CustomModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title={editingPolicy ? 'Edit Policy' : 'Add Policy'}
        subtitle="House Rules & Guidelines"
        icon={FileText}
        size="md"
      >
        <form onSubmit={handleSavePolicy} className="space-y-3 text-xs">
          <div>
            <label className="text-zinc-400 font-mono block mb-1">Policy Title *</label>
            <input
              type="text"
              required
              value={polTitle}
              onChange={(e) => setPolTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
            />
          </div>
          <div>
            <label className="text-zinc-400 font-mono block mb-1">Policy Content *</label>
            <textarea
              rows={3}
              required
              value={polContent}
              onChange={(e) => setPolContent(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-white"
            />
          </div>
          <div className="pt-2 flex justify-end space-x-2">
            <button type="button" onClick={() => setShowPolicyModal(false)} className="px-4 py-2 rounded-xl bg-white/10 text-white">Cancel</button>
            <button type="submit" className="liquid-btn-primary px-5 py-2 rounded-xl font-bold uppercase">Save</button>
          </div>
        </form>
      </CustomModal>

      {/* ================= MODAL 5: CREATE STAFF USER MODAL ================= */}
      <CustomModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        title="Create Staff Account"
        subtitle="Team Access & Role Provisioning"
        icon={UserPlus}
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          {createUserError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{createUserError}</span>
            </div>
          )}

          <div>
            <label className="text-zinc-400 font-mono block mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Maria Santos"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-zinc-400 font-mono block mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="e.g. maria@cgchillcation.com"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-zinc-400 font-mono block mb-1">Temporary Password *</label>
            <input
              type="password"
              required
              placeholder="Min 6 characters"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-zinc-400 font-mono block mb-1">Assigned Role *</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white cursor-pointer focus:border-amber-400/50 focus:outline-none"
            >
              <option value="STAFF">STAFF (Frontdesk Operations & Arrivals)</option>
              <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT (Guest Inquiries & Bookings)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCreateUserModal(false)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingUser}
              className="liquid-btn-primary px-5 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center space-x-1.5"
            >
              {isCreatingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isCreatingUser ? 'Creating...' : 'Create Account'}</span>
            </button>
          </div>
        </form>
      </CustomModal>

      {/* ================= MODAL 5b: EDIT STAFF USER MODAL ================= */}
      <CustomModal
        isOpen={showEditUserModal}
        onClose={() => setShowEditUserModal(false)}
        title={editingUser ? `Edit ${editingUser.name}` : 'Edit Staff Account'}
        subtitle="Account Details, Role & Access Control"
        icon={Edit2}
        size="md"
      >
        <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
          {editUserError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{editUserError}</span>
            </div>
          )}

          <div>
            <label className="text-zinc-400 font-mono block mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={editUserName}
              onChange={(e) => setEditUserName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-zinc-400 font-mono block mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={editUserEmail}
              onChange={(e) => setEditUserEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 font-mono block mb-1">Role *</label>
              <select
                value={editUserRole}
                onChange={(e) => setEditUserRole(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white cursor-pointer focus:border-amber-400/50 focus:outline-none"
              >
                <option value="STAFF">STAFF</option>
                <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-400 font-mono block mb-1">Account Status *</label>
              <select
                value={editUserStatus}
                onChange={(e) => setEditUserStatus(e.target.value)}
                className={`w-full h-10 px-3 rounded-xl bg-black/60 border text-white cursor-pointer focus:outline-none font-bold ${
                  editUserStatus === 'ACTIVE'
                    ? 'border-emerald-500/50 text-emerald-300'
                    : 'border-rose-500/50 text-rose-300'
                }`}
              >
                <option value="ACTIVE">ACTIVE (Authorized to login)</option>
                <option value="INACTIVE">INACTIVE (Deactivated / Blocked)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-400 font-mono block">Reset Password</label>
              <span className="text-[10px] text-zinc-500">Leave blank to keep existing password</span>
            </div>
            <input
              type="password"
              placeholder="Enter new password (optional)"
              value={editUserPassword}
              onChange={(e) => setEditUserPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowEditUserModal(false)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingUser}
              className="liquid-btn-primary px-5 py-2 rounded-xl font-bold uppercase tracking-wider flex items-center space-x-1.5"
            >
              {isUpdatingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isUpdatingUser ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </CustomModal>

      {/* ================= MODAL 6: UNIVERSAL CONFIRMATION MODAL ================= */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig({ isOpen: false, requireMatchText: '' })}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        subtitle={confirmModalConfig.subtitle}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        variant={confirmModalConfig.variant}
        isLoading={confirmModalConfig.isLoading}
        requireMatchText={confirmModalConfig.requireMatchText}
        inputLabel={confirmModalConfig.inputLabel}
        inputPlaceholder={confirmModalConfig.inputPlaceholder}
      />

    </div>
  );
}
