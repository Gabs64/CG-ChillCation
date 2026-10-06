import React, { useState, useEffect } from 'react';
import {
  DollarSign, Users, UserPlus, ShieldCheck, MapPin, Eye, EyeOff, FileText, CheckCircle2,
  Lock, Loader2, AlertCircle, Sparkles, Plus, Edit2, Trash2, Star, Check, X, ShieldAlert,
  Layers, Settings, Sliders, Image, QrCode, RefreshCw
} from 'lucide-react';

export default function OwnerDashboard({ token, activeTab: externalActiveTab, setActiveTab: setExternalActiveTab }) {
  // Tabs: 'revenue', 'rooms', 'inclusions', 'policies', 'experiences', 'users', 'settings'
  const [internalActiveTab, setInternalActiveTab] = useState('revenue');
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = setExternalActiveTab || setInternalActiveTab;

  // 1. Revenue Analytics State
  const [revenueData, setRevenueData] = useState(null);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);

  // 2. Room Management State (Section 19-23)
  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomFormName, setRoomFormName] = useState('');
  const [roomFormLocation, setRoomFormLocation] = useState('Antipolo');
  const [roomFormPrice, setRoomFormPrice] = useState(2800);
  const [roomFormDescription, setRoomFormDescription] = useState('');
  const [roomFormFeatured, setRoomFormFeatured] = useState(false);
  const [roomFormStatus, setRoomFormStatus] = useState('AVAILABLE');
  const [roomFormImages, setRoomFormImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [roomFormPaymentMethods, setRoomFormPaymentMethods] = useState(['QR Ph', 'Dragonpay', 'GCash', 'Maya', 'Bank Transfer']);

  // 3. Inclusions State (Section 13-14)
  const [inclusions, setInclusions] = useState([]);
  const [showInclusionModal, setShowInclusionModal] = useState(false);
  const [editingInclusion, setEditingInclusion] = useState(null);
  const [incName, setIncName] = useState('');
  const [incDesc, setIncDesc] = useState('');
  const [incPrice, setIncPrice] = useState(200);
  const [incActive, setIncActive] = useState(true);

  // 4. Policies State (Section 16)
  const [policies, setPolicies] = useState([]);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [polTitle, setPolTitle] = useState('');
  const [polContent, setPolContent] = useState('');
  const [polOrder, setPolOrder] = useState(1);
  const [polActive, setPolActive] = useState(true);

  // 5. Guest Experiences (Approval Workflow - Section 4-6)
  const [guestExpData, setGuestExpData] = useState({ pending: [], approved: [], declined: [] });
  const [expSubTab, setExpSubTab] = useState('pending'); // 'pending', 'approved', 'declined'
  const [isLoadingExp, setIsLoadingExp] = useState(false);

  // 6. User Management State
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserRole, setNewUserRole] = useState('STAFF');

  // 7. System Settings & Audit Log State (Section 61-62)
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
  }, [activeTab]);

  // API Call Helpers
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
      const res = await fetch('/api/rooms', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.rooms) setRooms(data.rooms);
    } catch (err) {
      console.error(err);
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
  const handleOpenRoomModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setRoomFormName(room.room_name);
      setRoomFormLocation(room.location);
      setRoomFormPrice(room.price_per_night);
      setRoomFormDescription(room.description);
      setRoomFormFeatured(Boolean(room.is_featured));
      setRoomFormStatus(room.status || 'AVAILABLE');
      setRoomFormImages(room.images ? [...room.images] : []);
      setRoomFormPaymentMethods(room.payment_methods ? [...room.payment_methods] : ['QR Ph', 'Dragonpay', 'GCash', 'Maya', 'Bank Transfer']);
    } else {
      setEditingRoom(null);
      setRoomFormName(`Room ${rooms.length + 1 < 10 ? `0${rooms.length + 1}` : rooms.length + 1}`);
      setRoomFormLocation('Antipolo');
      setRoomFormPrice(2800);
      setRoomFormDescription('Luxury 35sqm minimalist suite.');
      setRoomFormFeatured(false);
      setRoomFormStatus('AVAILABLE');
      setRoomFormImages([
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1590490360182-c3d57733427?auto=format&fit=crop&w=1200&q=80'
      ]);
      setRoomFormPaymentMethods(['QR Ph', 'Dragonpay', 'GCash', 'Maya', 'Bank Transfer']);
    }
    setShowRoomModal(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    const payload = {
      roomName: roomFormName,
      location: roomFormLocation,
      pricePerNight: Number(roomFormPrice),
      description: roomFormDescription,
      isFeatured: roomFormFeatured,
      status: roomFormStatus,
      images: roomFormImages,
      paymentMethods: roomFormPaymentMethods
    };

    try {
      if (editingRoom) {
        await fetch(`/api/owner/rooms/${editingRoom.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/owner/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      setShowRoomModal(false);
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivateRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete/deactivate this room?')) return;
    try {
      await fetch(`/api/owner/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurgeAllRooms = async () => {
    if (!window.confirm('Delete all demo rooms and reset to 0 rooms?')) return;
    try {
      for (const r of rooms) {
        await fetch(`/api/owner/rooms/${r.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setRooms([]);
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Inclusions
  const handleSaveInclusion = async (e) => {
    e.preventDefault();
    try {
      if (editingInclusion) {
        await fetch(`/api/owner/inclusions/${editingInclusion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: incName, description: incDesc, price: Number(incPrice), isActive: incActive })
        });
      } else {
        await fetch('/api/owner/inclusions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: incName, description: incDesc, price: Number(incPrice), isActive: incActive })
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

  // Handlers for Guest Experiences Workflow (Approve / Decline / Delete)
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

  // Handlers for Users
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/owner/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newUserName, email: newUserEmail, password: newUserPassword, role: newUserRole })
      });
      setShowCreateUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const ownerNavTabs = [
    { id: 'revenue', label: 'Revenue Analytics', desc: 'Financial Overview', icon: DollarSign },
    { id: 'rooms', label: 'Room Management', desc: 'Suites & Pricing', icon: Layers },
    { id: 'inclusions', label: 'Inclusions Config', desc: 'Add-ons & Amenities', icon: Sliders },
    { id: 'policies', label: 'Rules & Policies', desc: 'House Guidelines', icon: FileText },
    { id: 'experiences', label: 'Guest Reviews & Approval', desc: 'Moderation Queue', icon: Star, badge: guestExpData?.pending?.length > 0 ? guestExpData.pending.length : null },
    { id: 'users', label: 'Staff Accounts', desc: 'Roles & Access', icon: Users },
    { id: 'settings', label: 'Settings & Audit Log', desc: 'System & Security', icon: Settings },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch lg:items-start pb-16">
      
      {/* ================= OWNER EXECUTIVE SIDEBAR NAV ================= */}
      <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-28 z-20">
        <div className="liquid-glass rounded-3xl p-3 sm:p-4 border border-white/10 shadow-2xl backdrop-blur-2xl space-y-3">
          
          <div className="px-3 py-2 border-b border-white/5 hidden lg:flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 block">
                Executive Console
              </span>
              <span className="text-[9px] font-mono text-zinc-500 block uppercase">
                Owner Controls
              </span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-bold border border-white/10">
              PORTAL
            </span>
          </div>

          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 no-scrollbar">
            {ownerNavTabs.map((tab) => {
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

                  {tab.badge ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold flex-shrink-0 ${
                      isActive
                        ? 'bg-black text-amber-300'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ================= ACTIVE TAB MAIN CONTENT ================= */}
      <div className="flex-1 min-w-0 space-y-6">

      {/* ================= TAB 1: REVENUE ANALYTICS ================= */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl liquid-glass border border-white/15 shadow-xl">
            <h2 className="text-2xl font-black text-white">Financial & Booking Performance</h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Real-time revenue metrics from confirmed reservations</p>
          </div>

          {/* Revenue KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10">
              <span className="text-xs text-zinc-400 font-mono uppercase">Total Gross Revenue</span>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
                ₱{(revenueData?.totalRevenue || 0).toLocaleString()}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border border-white/10">
              <span className="text-xs text-zinc-400 font-mono uppercase">Paid Bookings</span>
              <div className="text-3xl font-black text-white font-mono mt-1">
                {revenueData?.paidBookingsCount || 0}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border border-white/10">
              <span className="text-xs text-zinc-400 font-mono uppercase">Pending Payments</span>
              <div className="text-3xl font-black text-amber-400 font-mono mt-1">
                {revenueData?.pendingPaymentsCount || 0}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border border-white/10">
              <span className="text-xs text-zinc-400 font-mono uppercase">Deposits in Custody</span>
              <div className="text-3xl font-black text-blue-400 font-mono mt-1">
                ₱{(revenueData?.securityDepositsInCustody || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Revenue by Location */}
          <div className="p-6 rounded-3xl bg-black/50 border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white uppercase font-mono">Location Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(revenueData?.revenueByLocation || []).map((loc) => (
                <div key={loc.location} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-white block">{loc.location}</span>
                    <span className="text-xs text-zinc-400 font-mono">{loc.total_bookings} Total Stays</span>
                  </div>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    ₱{Number(loc.revenue || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ROOM MANAGEMENT (Section 19-23) ================= */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Inventory Control</span>
              <h2 className="text-2xl font-black text-white">Room Customization & Pricing</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {rooms.length > 0 && (
                <button
                  onClick={handlePurgeAllRooms}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center space-x-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Demo Rooms ({rooms.length})</span>
                </button>
              )}
              <button
                onClick={() => handleOpenRoomModal()}
                className="liquid-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Suite</span>
              </button>
            </div>
          </div>

          {/* Rooms Grid or Empty State */}
          {rooms.length === 0 ? (
            <div className="p-12 sm:p-16 rounded-3xl bg-black/40 border-2 border-dashed border-white/15 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No Suites in Inventory (Clean Slate)</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                  All demo rooms have been cleared. Click "Add New Suite" to begin configuring your actual resort suites and pricing.
                </p>
              </div>
              <button
                onClick={() => handleOpenRoomModal()}
                className="liquid-btn-primary px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider inline-flex items-center space-x-2 shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Real Suite</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-5 rounded-3xl bg-black/60 border border-white/10 space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-black text-white">{room.room_name}</h3>
                      {room.is_featured && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-black flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5 fill-black" />
                          <span>Featured</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-zinc-400 mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{room.location}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-white font-bold">₱{Number(room.price_per_night).toLocaleString()}/night</span>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                      {room.description}
                    </p>

                    {/* Photos Summary */}
                    <div className="text-[11px] font-mono text-zinc-400 bg-white/5 p-2 rounded-xl border border-white/10 mb-2">
                      📸 {room.images?.length || 0} Photos Configured &bull; Status: {room.status}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenRoomModal(room)}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Suite</span>
                    </button>

                    <button
                      onClick={() => handleDeactivateRoom(room.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs"
                      title="Delete Suite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: INCLUSIONS CONFIGURATION (Section 13-14) ================= */}
      {activeTab === 'inclusions' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Pricing & Add-ons</span>
              <h2 className="text-2xl font-black text-white">Inclusion Price Configuration</h2>
            </div>
            <button
              onClick={() => {
                setEditingInclusion(null);
                setIncName('');
                setIncDesc('');
                setIncPrice(200);
                setIncActive(true);
                setShowInclusionModal(true);
              }}
              className="liquid-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Inclusion</span>
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-3">
            {inclusions.map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{inc.name}</h4>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      inc.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {inc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{inc.description}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-base font-black text-white font-mono">₱{Number(inc.price).toLocaleString()}</span>
                  <button
                    onClick={() => {
                      setEditingInclusion(inc);
                      setIncName(inc.name);
                      setIncDesc(inc.description);
                      setIncPrice(inc.price);
                      setIncActive(Boolean(inc.is_active));
                      setShowInclusionModal(true);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: RULES & POLICIES CONFIGURATION (Section 16) ================= */}
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
              <div
                key={pol.id}
                className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-zinc-400">#{pol.display_order}</span>
                    <h4 className="text-sm font-bold text-white">{pol.title}</h4>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      pol.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {pol.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">{pol.content}</p>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => {
                      setEditingPolicy(pol);
                      setPolTitle(pol.title);
                      setPolContent(pol.content);
                      setPolOrder(pol.display_order);
                      setPolActive(Boolean(pol.is_active));
                      setShowPolicyModal(true);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: GUEST EXPERIENCES APPROVAL WORKFLOW (Section 4-6) ================= */}
      {activeTab === 'experiences' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl liquid-glass border border-white/15 shadow-xl">
            <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Review Moderation</span>
            <h2 className="text-2xl font-black text-white">Guest Experience Approvals</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Guest submissions default to PENDING status and only appear publicly once APPROVED by the Owner.
            </p>
          </div>

          {/* Sub-tabs */}
          <div className="flex space-x-2">
            {['pending', 'approved', 'declined'].map((sub) => (
              <button
                key={sub}
                onClick={() => setExpSubTab(sub)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  expSubTab === sub
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                {sub} ({guestExpData[sub]?.length || 0})
              </button>
            ))}
          </div>

          {/* Reviews List */}
          <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-3">
            {guestExpData[expSubTab]?.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs italic">
                No {expSubTab} reviews found.
              </div>
            ) : (
              guestExpData[expSubTab]?.map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white">{exp.guest_name}</span>
                      {exp.room_name && (
                        <span className="text-xs font-mono text-zinc-400">({exp.room_name})</span>
                      )}
                      <div className="flex items-center space-x-0.5 ml-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= exp.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-300 italic">"{exp.review_text}"</p>
                    <span className="text-[10px] font-mono text-zinc-500 block">Submitted: {exp.created_at}</span>
                  </div>

                  <div className="flex items-center space-x-2 self-end md:self-auto">
                    {expSubTab !== 'approved' && (
                      <button
                        onClick={() => handleReviewStatus(exp.id, 'APPROVED')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {expSubTab !== 'declined' && (
                      <button
                        onClick={() => handleReviewStatus(exp.id, 'DECLINED')}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold uppercase flex items-center space-x-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleReviewStatus(exp.id, 'DELETE')}
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs"
                      title="Delete review"
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

      {/* ================= TAB 6: STAFF ACCOUNTS ================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl liquid-glass border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest block">Access Control</span>
              <h2 className="text-2xl font-black text-white">Staff & Customer Support Accounts</h2>
            </div>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="liquid-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-black/50 border border-white/10 space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{u.name}</span>
                    <span className="text-xs font-mono text-zinc-400">({u.email})</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-zinc-200">
                      {u.role}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Status: {u.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 7: SETTINGS & AUDIT LOG (Section 61, 62) ================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Settings Form */}
          <div className="p-6 rounded-3xl liquid-glass border border-white/15 shadow-xl space-y-4">
            <h2 className="text-2xl font-black text-white">System Settings & Configuration</h2>

            {saveSettingsSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                Settings saved successfully!
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 block mb-1">
                  Refundable Security Deposit Amount (₱)
                </label>
                <input
                  type="number"
                  value={systemSettings.security_deposit_amount || 1000}
                  onChange={(e) => setSystemSettings({ ...systemSettings, security_deposit_amount: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 block mb-1">
                  Meta / Messenger Destination URL
                </label>
                <input
                  type="text"
                  value={systemSettings.meta_messenger_url || ''}
                  onChange={(e) => setSystemSettings({ ...systemSettings, meta_messenger_url: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 block mb-1">
                  Antipolo Google Maps Link
                </label>
                <input
                  type="text"
                  value={systemSettings.google_maps_antipolo || ''}
                  onChange={(e) => setSystemSettings({ ...systemSettings, google_maps_antipolo: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 block mb-1">
                  Cainta Google Maps Link
                </label>
                <input
                  type="text"
                  value={systemSettings.google_maps_cainta || ''}
                  onChange={(e) => setSystemSettings({ ...systemSettings, google_maps_cainta: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 pt-2 flex justify-end">
                <button
                  type="submit"
                  className="liquid-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Save System Settings
                </button>
              </div>
            </form>
          </div>

          {/* Audit Log Table (Section 61) */}
          <div className="p-6 rounded-3xl bg-black/50 border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white uppercase font-mono">Administrative Audit Log</h3>
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

      {/* ================= ROOM MODAL (Add / Edit Suite with Photos & Payment Methods) ================= */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl liquid-glass border border-white/20 rounded-3xl p-6 sm:p-8 space-y-4 max-h-[90vh] flex flex-col">
            <button onClick={() => setShowRoomModal(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white">
              {editingRoom ? `Edit ${editingRoom.room_name}` : 'Add New Suite'}
            </h3>

            <form onSubmit={handleSaveRoom} className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 font-mono block mb-1">Room Name *</label>
                  <input
                    type="text"
                    required
                    value={roomFormName}
                    onChange={(e) => setRoomFormName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-mono block mb-1">Location *</label>
                  <select
                    value={roomFormLocation}
                    onChange={(e) => setRoomFormLocation(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
                  >
                    <option value="Antipolo">Antipolo</option>
                    <option value="Cainta">Cainta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-mono block mb-1">Price Per Night (₱) *</label>
                <input
                  type="number"
                  required
                  value={roomFormPrice}
                  onChange={(e) => setRoomFormPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-mono block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={roomFormDescription}
                  onChange={(e) => setRoomFormDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-white"
                />
              </div>

              {/* Featured & Status */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <label className="flex items-center space-x-2 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomFormFeatured}
                    onChange={(e) => setRoomFormFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-black bg-black border-white/30"
                  />
                  <span className="font-bold text-white">Featured Suite</span>
                </label>

                <div>
                  <label className="text-zinc-400 font-mono block mb-1">Status</label>
                  <select
                    value={roomFormStatus}
                    onChange={(e) => setRoomFormStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="UNAVAILABLE">UNAVAILABLE</option>
                  </select>
                </div>
              </div>

              {/* Photo Manager (Section 23 - Minimum 2 photos) */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-zinc-300 font-bold block font-mono">Room Photos (Minimum 2)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-xl bg-black/60 border border-white/15 text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        setRoomFormImages([...roomFormImages, newImageUrl.trim()]);
                        setNewImageUrl('');
                      }
                    }}
                    className="px-3 rounded-xl bg-white text-black font-bold"
                  >
                    Add Photo
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {roomFormImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden h-16 border border-white/20">
                      <img src={img} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setRoomFormImages(roomFormImages.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-black/80 rounded text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="liquid-btn-primary px-6 py-2 rounded-xl font-bold uppercase">
                  Save Suite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= INCLUSION MODAL ================= */}
      {showInclusionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md liquid-glass border border-white/20 rounded-3xl p-6 space-y-4">
            <button onClick={() => setShowInclusionModal(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-white">
              {editingInclusion ? 'Edit Inclusion' : 'Add Inclusion'}
            </h3>
            <form onSubmit={handleSaveInclusion} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-mono block mb-1">Inclusion Name *</label>
                <input
                  type="text"
                  required
                  value={incName}
                  onChange={(e) => setIncName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 font-mono block mb-1">Price (₱) *</label>
                <input
                  type="number"
                  required
                  value={incPrice}
                  onChange={(e) => setIncPrice(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-zinc-400 font-mono block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-white"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowInclusionModal(false)} className="px-4 py-2 rounded-xl bg-white/10 text-white">Cancel</button>
                <button type="submit" className="liquid-btn-primary px-5 py-2 rounded-xl font-bold uppercase">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= POLICY MODAL ================= */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md liquid-glass border border-white/20 rounded-3xl p-6 space-y-4">
            <button onClick={() => setShowPolicyModal(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-white">
              {editingPolicy ? 'Edit Policy' : 'Add Policy'}
            </h3>
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
                  rows={4}
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
          </div>
        </div>
      )}

      {/* ================= CREATE USER MODAL ================= */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md liquid-glass border border-white/20 rounded-3xl p-6 space-y-4">
            <button onClick={() => setShowCreateUserModal(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-white">Create Staff / Support Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 font-mono block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 font-mono block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 font-mono block mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
                />
              </div>
              <div>
                <label className="text-zinc-400 font-mono block mb-1">Role *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowCreateUserModal(false)} className="px-4 py-2 rounded-xl bg-white/10 text-white">Cancel</button>
                <button type="submit" className="liquid-btn-primary px-5 py-2 rounded-xl font-bold uppercase">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
