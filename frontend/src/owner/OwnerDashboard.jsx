import React, { useState, useEffect } from 'react';
import { DollarSign, Users, UserPlus, ShieldCheck, MapPin, Eye, EyeOff, FileText, CheckCircle2, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function OwnerDashboard({ token, activeTab: externalActiveTab, setActiveTab: setExternalActiveTab }) {
  const [internalActiveTab, setInternalActiveTab] = useState('revenue');
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = setExternalActiveTab || setInternalActiveTab;

  // Revenue analytics state
  const [revenueData, setRevenueData] = useState(null);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);

  // User management state
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);

  // Create User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserRole, setNewUserRole] = useState('STAFF');
  const [createUserError, setCreateUserError] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);

  // Sheets log state
  const [sheetsLogs, setSheetsLogs] = useState([]);

  useEffect(() => {
    if (activeTab === 'revenue') fetchRevenue();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'sheets') fetchSheetsLog();
  }, [activeTab]);

  const fetchRevenue = async () => {
    setIsLoadingRevenue(true);
    try {
      const res = await fetch('/api/owner/revenue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setRevenueData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRevenue(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/owner/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSheetsLog = async () => {
    try {
      const res = await fetch('/api/owner/sheets-log', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.logs) setSheetsLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setCreateUserError(null);

    try {
      const res = await fetch('/api/owner/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateUserError(data.error || 'Failed to create user account.');
      } else {
        setShowCreateUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        fetchUsers();
      }
    } catch (err) {
      setCreateUserError('Network error creating administrative account.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/owner/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleReviewStatus = async (reviewId, currentStatus) => {
    const newStatus = currentStatus === 'APPROVED' ? 'HIDDEN' : 'APPROVED';
    try {
      const res = await fetch(`/api/owner/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ displayStatus: newStatus })
      });
      if (res.ok) fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-widest text-brand-lightgray">EXECUTIVE OWNER CONTROL</span>
            <span className="text-xs bg-white text-black px-2.5 py-0.5 rounded-full font-black uppercase">
              OWNER ROLE
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">CG Chillcation Executive Dashboard</h1>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-2 bg-brand-card p-1.5 rounded-2xl border border-brand-border overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'revenue' ? 'bg-white text-black' : 'text-brand-lightgray hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Revenue</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'users' ? 'bg-white text-black' : 'text-brand-lightgray hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Account Management</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'reviews' ? 'bg-white text-black' : 'text-brand-lightgray hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Reviews</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'sheets' ? 'bg-white text-black' : 'text-brand-lightgray hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Google Sheets Sync</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REVENUE ANALYTICS */}
      {activeTab === 'revenue' && (
        <div className="space-y-8">
          {isLoadingRevenue ? (
            <div className="h-64 animate-pulse bg-brand-card rounded-3xl" />
          ) : revenueData ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="liquid-glass-card p-6 rounded-3xl border border-white/10 space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-brand-lightgray block">Total Revenue (Verified)</span>
                  <p className="text-4xl font-black text-white">₱{revenueData.totalRevenue.toLocaleString()}</p>
                  <span className="text-[11px] text-white font-semibold block pt-1">
                    Confirmed Paid Reservations
                  </span>
                </div>

                <div className="liquid-glass-card p-6 rounded-3xl border border-white/10 space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-brand-lightgray block">Paid Bookings</span>
                  <p className="text-4xl font-black text-white">{revenueData.paidBookingsCount}</p>
                  <span className="text-[11px] text-brand-gray block pt-1">
                    Completed Transactions
                  </span>
                </div>

                <div className="liquid-glass-card p-6 rounded-3xl border border-white/10 space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-brand-lightgray block">Pending Payments</span>
                  <p className="text-4xl font-black text-white">{revenueData.pendingPaymentsCount}</p>
                  <span className="text-[11px] text-brand-gray block pt-1">
                    Awaiting authorization
                  </span>
                </div>
              </div>

              {/* Revenue by Location Breakdown */}
              <div className="liquid-glass-card p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Revenue Breakdown by Location</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {revenueData.revenueByLocation.map((loc) => (
                    <div key={loc.location} className="bg-black/60 p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-xl bg-white text-black">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">{loc.location}</h4>
                          <span className="text-xs text-brand-gray">{loc.total_bookings} paid booking(s)</span>
                        </div>
                      </div>
                      <span className="text-2xl font-black text-white">₱{loc.revenue ? loc.revenue.toLocaleString() : '0'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 2: OWNER ACCOUNT MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between liquid-glass p-4 rounded-2xl border border-white/15">
            <div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Administrative User Accounts</h3>
              <p className="text-xs text-brand-lightgray">Only Owner can create Staff and Customer Support accounts.</p>
            </div>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="liquid-btn-primary px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>

          <div className="liquid-glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/80 text-brand-lightgray uppercase border-b border-white/10">
                <tr>
                  <th className="p-3.5">User Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-bold text-white">{u.name}</td>
                    <td className="p-3.5 text-brand-offwhite">{u.email}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-white text-black uppercase text-[10px]">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === 'ACTIVE' ? 'bg-white/10 text-white border border-white/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {u.role !== 'OWNER' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className="liquid-btn px-3 py-1.5 rounded-lg text-white text-xs border border-white/15"
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-md liquid-glass border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl animate-modal-pop">
            <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4">Create Admin Account</h3>
            
            {createUserError && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-white/20 text-white text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-white" />
                <span>{createUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs text-brand-lightgray uppercase block mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full liquid-input rounded-xl p-3 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-brand-lightgray uppercase block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@cgchillcation.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full liquid-input rounded-xl p-3 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-brand-lightgray uppercase block mb-1">Assigned Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full liquid-input rounded-xl p-3 text-white text-sm"
                >
                  <option value="STAFF" className="bg-black text-white">Staff</option>
                  <option value="CUSTOMER_SUPPORT" className="bg-black text-white">Customer Support</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-brand-lightgray uppercase block mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full liquid-input rounded-xl p-3 text-white text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="liquid-btn px-4 py-2.5 rounded-xl text-brand-lightgray hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="liquid-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
                >
                  {isCreatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEWS MANAGEMENT */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="liquid-glass p-4 rounded-2xl border border-white/15">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Customer Reviews Approval</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="liquid-glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">{rev.guest_name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      rev.display_status === 'APPROVED' ? 'bg-white/10 text-white border border-white/20' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {rev.display_status}
                    </span>
                  </div>
                  <p className="text-xs text-brand-lightgray italic">"{rev.review}"</p>
                </div>

                <button
                  onClick={() => handleToggleReviewStatus(rev.id, rev.display_status)}
                  className="py-2 rounded-xl liquid-btn border border-white/15 text-white text-xs font-semibold flex items-center justify-center space-x-2"
                >
                  {rev.display_status === 'APPROVED' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{rev.display_status === 'APPROVED' ? 'Hide Review' : 'Approve Review'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE SHEETS OPERATIONAL SYNC LOG */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          <div className="liquid-glass p-4 rounded-2xl border border-white/15">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Google Sheets Operational Sync Log</h3>
            <p className="text-xs text-brand-lightgray">Database is primary source of truth, Google Sheets is operational sync destination.</p>
          </div>

          <div className="liquid-glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/80 text-brand-lightgray uppercase border-b border-white/10">
                <tr>
                  <th className="p-3.5">Reference</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Synced At</th>
                  <th className="p-3.5">Payload Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sheetsLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white">{log.booking_reference}</td>
                    <td className="p-3.5 text-white font-semibold">{log.action}</td>
                    <td className="p-3.5 text-brand-gray">{log.synced_at}</td>
                    <td className="p-3.5 font-mono text-[10px] text-brand-lightgray max-w-md truncate">
                      {log.payload_json}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
