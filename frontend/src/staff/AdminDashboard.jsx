import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, Filter, Search, UserCheck, ShieldCheck, MapPin, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export default function AdminDashboard({ token, currentUser }) {
  const [activeTab, setActiveTab] = useState('checkins'); // 'checkins', 'calendar', 'bookings'
  
  // Today's check-ins state
  const [checkins, setCheckins] = useState([]);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoadingCheckins, setIsLoadingCheckins] = useState(false);

  // Master calendar state
  const [calendarRooms, setCalendarRooms] = useState([]);
  const [calendarBookings, setCalendarBookings] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  // Month & Year state for Master Calendar
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()); // 0-indexed (0=Jan, 11=Dec)

  // All bookings state
  const [allBookings, setAllBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  useEffect(() => {
    if (activeTab === 'checkins') fetchCheckins();
    if (activeTab === 'calendar') fetchCalendar();
    if (activeTab === 'bookings') fetchAllBookings();
  }, [activeTab, targetDate]);

  const fetchCheckins = async () => {
    setIsLoadingCheckins(true);
    try {
      const res = await fetch(`/api/admin/checkins?date=${targetDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.checkins) setCheckins(data.checkins);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCheckins(false);
    }
  };

  const fetchCalendar = async () => {
    setIsLoadingCalendar(true);
    try {
      const res = await fetch('/api/admin/calendar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.rooms && data.bookings) {
        setCalendarRooms(data.rooms);
        setCalendarBookings(data.bookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const fetchAllBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.bookings) setAllBookings(data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingBookings(false);
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
        fetchCheckins();
        fetchAllBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar columns for selected month and year
  const getCalendarDatesForMonth = (year, month) => {
    const dates = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      const dayOfWeek = new Date(year, month, day).toLocaleDateString('en-US', { weekday: 'short' });
      dates.push({ dateStr, dayNum: dd, dayOfWeek });
    }
    return dates;
  };

  const calendarDates = getCalendarDatesForMonth(calendarYear, calendarMonth);

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleResetToToday = () => {
    const now = new Date();
    setCalendarYear(now.getFullYear());
    setCalendarMonth(now.getMonth());
  };

  return (
    <div className="space-y-8 pb-24">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-widest text-brand-lightgray">STAFF & CUSTOMER SUPPORT PORTAL</span>
            <span className="text-xs bg-white text-black px-2.5 py-0.5 rounded-full font-bold uppercase">
              {currentUser?.role?.replace('_', ' ') || 'STAFF'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Operational Control Center</h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-2 bg-brand-card p-1.5 rounded-2xl border border-brand-border">
          <button
            onClick={() => setActiveTab('checkins')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
              activeTab === 'checkins' ? 'bg-white text-black' : 'text-brand-lightgray hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Today's Check-ins</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
              activeTab === 'calendar' ? 'bg-white text-black' : 'text-brand-lightgray hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Master Calendar</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
              activeTab === 'bookings' ? 'bg-white text-black' : 'text-brand-lightgray hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>All Bookings</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TODAY'S CHECK-INS */}
      {activeTab === 'checkins' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-brand-card p-4 rounded-2xl border border-brand-border">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Daily Arrival & Departure Log</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-brand-lightgray uppercase">Select Date:</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-brand-black border border-brand-border rounded-xl p-2 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          {isLoadingCheckins ? (
            <div className="h-64 bg-brand-card rounded-2xl border border-brand-border animate-pulse" />
          ) : checkins.length === 0 ? (
            <div className="text-center py-16 bg-brand-card rounded-2xl border border-brand-border">
              <UserCheck className="w-10 h-10 text-brand-gray mx-auto mb-2" />
              <p className="text-white font-bold">No check-ins or departures scheduled for {targetDate}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {checkins.map((b) => (
                <div key={b.id} className="bg-brand-card rounded-2xl border border-brand-border p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-brand-border pb-3">
                    <div>
                      <span className="text-xs font-bold text-white font-mono">{b.reference_number}</span>
                      <h4 className="text-lg font-bold text-white mt-0.5">{b.room_name}</h4>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-black border border-brand-border text-brand-lightgray">
                      {b.location}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-brand-lightgray">
                    <p>Guest: <strong className="text-white">{b.guest_name}</strong> ({b.guest_count} guests)</p>
                    <p>Contact: <strong className="text-white">{b.contact_number}</strong></p>
                    <p>Dates: <strong className="text-white">{b.check_in}</strong> to <strong className="text-white">{b.check_out}</strong></p>
                    <p>Payment: <strong className="text-white">₱{b.amount ? b.amount.toLocaleString() : '0'} ({b.payment_method || 'QR Ph'})</strong></p>
                    <p>Status: <strong className="text-emerald-400 uppercase">{b.check_in_status.replace('_', ' ')}</strong></p>
                  </div>

                  <div className="pt-3 border-t border-brand-border flex gap-2">
                    {b.check_in_status !== 'CHECKED_IN' && (
                      <button
                        onClick={() => handleUpdateCheckInStatus(b.id, 'CHECKED_IN')}
                        className="flex-1 py-2 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-brand-offwhite transition-colors"
                      >
                        Mark Checked In
                      </button>
                    )}

                    {b.check_in_status === 'CHECKED_IN' && (
                      <button
                        onClick={() => handleUpdateCheckInStatus(b.id, 'CHECKED_OUT')}
                        className="flex-1 py-2 rounded-xl bg-brand-black text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-border border border-brand-border transition-colors"
                      >
                        Mark Checked Out
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MASTER CALENDAR MATRIX */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-brand-card p-6 rounded-3xl border border-brand-border space-y-6 overflow-x-auto">
            
            {/* Month & Year Navigation Control Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">14-Room Master Calendar Matrix</h3>
                <p className="text-xs text-brand-lightgray mt-0.5">
                  Showing occupancy for <strong className="text-white uppercase font-mono">{MONTH_NAMES[calendarMonth]} {calendarYear}</strong>
                </p>
              </div>

              {/* Month / Year Selector Controls */}
              <div className="flex items-center space-x-2 bg-brand-black p-1.5 rounded-2xl border border-white/15">
                {/* Previous Month Button */}
                <button
                  onClick={handlePrevMonth}
                  title="Previous Month"
                  className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Month Dropdown */}
                <select
                  value={calendarMonth}
                  onChange={(e) => setCalendarMonth(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold uppercase text-white focus:outline-none cursor-pointer py-1 px-2"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx} className="bg-black text-white">
                      {name}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={calendarYear}
                  onChange={(e) => setCalendarYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer py-1 px-2 border-l border-white/10"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                    <option key={yr} value={yr} className="bg-black text-white">
                      {yr}
                    </option>
                  ))}
                </select>

                {/* Next Month Button */}
                <button
                  onClick={handleNextMonth}
                  title="Next Month"
                  className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors border-l border-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Reset to Today Button */}
                <button
                  onClick={handleResetToToday}
                  title="Go to Today"
                  className="p-2 rounded-xl text-white bg-white/10 hover:bg-white/20 transition-colors border-l border-white/10"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {isLoadingCalendar ? (
              <div className="h-64 animate-pulse bg-brand-black rounded-2xl" />
            ) : (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="p-3 text-xs font-bold text-brand-lightgray uppercase w-32 sticky left-0 bg-brand-card z-10 shadow-md">
                      Room
                    </th>
                    {calendarDates.map((item) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isToday = item.dateStr === todayStr;
                      return (
                        <th
                          key={item.dateStr}
                          className={`p-2 text-center text-[10px] font-mono border-l border-brand-border min-w-[36px] ${
                            isToday ? 'bg-white text-black font-black rounded-t-md' : 'text-brand-gray'
                          }`}
                        >
                          <div className="leading-tight">{item.dayNum}</div>
                          <div className="text-[9px] uppercase opacity-75">{item.dayOfWeek}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {calendarRooms.map((room) => (
                    <tr key={room.id} className="border-b border-brand-border hover:bg-brand-black/40">
                      <td className="p-3 text-xs font-bold text-white sticky left-0 bg-brand-card border-r border-brand-border flex items-center justify-between z-10">
                        <span>{room.room_name}</span>
                        <span className="text-[9px] text-brand-gray uppercase ml-1">({room.location[0]})</span>
                      </td>

                      {calendarDates.map((item) => {
                        const booked = calendarBookings.find(
                          (b) => b.room_id === room.id && item.dateStr >= b.check_in && item.dateStr < b.check_out
                        );

                        const todayStr = new Date().toISOString().split('T')[0];
                        const isToday = item.dateStr === todayStr;

                        return (
                          <td key={item.dateStr} className={`p-1 border-l border-brand-border text-center ${isToday ? 'bg-white/5' : ''}`}>
                            {booked ? (
                              <div
                                title={`${booked.guest_name} (${booked.reference_number}) - ${booked.booking_status}`}
                                className="w-full py-2 bg-white text-black text-[9px] font-bold rounded-md uppercase tracking-tighter truncate px-1 shadow-sm hover:scale-105 transition-transform"
                              >
                                {booked.guest_name.split(' ')[0]}
                              </div>
                            ) : (
                              <div className="w-full h-8 bg-brand-black/40 rounded-md border border-brand-border/40" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ALL BOOKINGS TABLE */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-brand-card p-4 rounded-2xl border border-brand-border">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Complete Booking Registry</h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-brand-gray" />
              <input
                type="text"
                placeholder="Search reference or guest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-brand-black border border-brand-border rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div className="bg-brand-card rounded-2xl border border-brand-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-black text-brand-lightgray uppercase border-b border-brand-border">
                <tr>
                  <th className="p-3">Ref Number</th>
                  <th className="p-3">Room / Location</th>
                  <th className="p-3">Guest Name</th>
                  <th className="p-3">Dates</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Check-in Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {allBookings
                  .filter((b) => 
                    b.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    b.guest_name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-brand-black/50">
                      <td className="p-3 font-mono font-bold text-white">{b.reference_number}</td>
                      <td className="p-3 font-semibold text-white">{b.room_name} ({b.location})</td>
                      <td className="p-3 text-brand-offwhite">{b.guest_name}</td>
                      <td className="p-3 text-brand-gray">{b.check_in} to {b.check_out}</td>
                      <td className="p-3 font-bold text-white">₱{b.amount ? b.amount.toLocaleString() : '0'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-white text-black uppercase text-[10px]">
                          {b.booking_status}
                        </span>
                      </td>
                      <td className="p-3 text-brand-lightgray">{b.check_in_status.replace('_', ' ')}</td>
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
