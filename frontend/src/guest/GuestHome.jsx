import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, MapPin, Star, MessageCircle, ArrowRight, Heart, QrCode, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import RoomCard from './RoomCard';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=85',
    title: 'CG CHILLCATION',
    subtitle: 'YOUR UNFORGETTABLE GETAWAY & SANCTUARY'
  },
  {
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=2000&q=85',
    title: 'MINIMALIST LUXURY',
    subtitle: 'BESPOKE 35SQM SUITES IN ANTIPOLO & CAINTA'
  },
  {
    image: 'https://images.unsplash.com/photo-1590490360182-c3d57733427?auto=format&fit=crop&w=2000&q=85',
    title: 'SEAMLESS BOOKING',
    subtitle: 'INSTANT QR CHECK-IN & DEDICATED SUPPORT'
  }
];

export default function GuestHome({ onSelectRoom, onOpenExperienceModal }) {
  const [rooms, setRooms] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All', 'Featured', 'Antipolo', 'Cainta'
  const [isLoading, setIsLoading] = useState(true);
  const [guestExperiences, setGuestExperiences] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Search Bar State
  const [arrivalDate, setArrivalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [departureDate, setDepartureDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [guestCount, setGuestCount] = useState('2');
  const [searchLocation, setSearchLocation] = useState('All');

  useEffect(() => {
    fetchRooms();
    fetchGuestExperiences();
  }, [selectedFilter]);

  // Auto Hero Slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      let url = '/api/rooms';
      if (selectedFilter === 'Featured') {
        url = '/api/rooms?featured=true';
      } else if (selectedFilter === 'Antipolo' || selectedFilter === 'Cainta') {
        url = `/api/rooms?location=${encodeURIComponent(selectedFilter)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.rooms) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGuestExperiences = async () => {
    try {
      const res = await fetch('/api/guest-experiences');
      const data = await res.json();
      if (data.experiences) {
        setGuestExperiences(data.experiences);
      }
    } catch (err) {
      console.error('Failed to load guest experiences:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchLocation !== 'All') {
      setSelectedFilter(searchLocation);
    }
    const section = document.getElementById('rooms-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative space-y-16 pb-16">
      
      {/* Luxury Ambient Background Glow Mesh */}
      <div className="luxury-ambient-bg pointer-events-none">
        <div className="luxury-ambient-orb-1 animate-aurora" />
        <div className="luxury-ambient-orb-2 animate-aurora" />
      </div>

      {/* ================= 1. HERO CAROUSEL ================= */}
      <div className="relative h-[480px] sm:h-[540px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover grayscale-[10%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-black/30" />
            
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 max-w-3xl space-y-3 z-20">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none uppercase">
                {slide.title}
              </h1>

              <p className="text-xs sm:text-sm text-zinc-300 tracking-wider font-mono">
                {slide.subtitle}
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href="#rooms-section"
                  className="liquid-btn-primary px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-xl hover:scale-105 transition-all"
                >
                  <span>Explore All Suites</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <button
                  onClick={onOpenExperienceModal}
                  className="px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all flex items-center space-x-2 hover:scale-105"
                >
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Guest Reviews</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Slide Controls & Live Progress Dots */}
        <div className="absolute bottom-6 right-6 z-30 flex items-center space-x-2">
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="p-2.5 rounded-full bg-black/60 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex space-x-1.5 px-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  currentSlide === i ? 'w-8 bg-white shadow-lg shadow-white/50' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="p-2.5 rounded-full bg-black/60 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md transition-all active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= 2. SEARCH & DATE ESTIMATOR BAR ================= */}
      <div className="space-y-4">
        <div className="liquid-glass border border-white/15 p-4 sm:p-6 rounded-3xl shadow-xl">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Location
              </label>
              <div className="relative">
                <select
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-white/40"
                >
                  <option value="All">All Locations (Antipolo & Cainta)</option>
                  <option value="Antipolo">Antipolo City (7 Suites)</option>
                  <option value="Cainta">Cainta Rizal (7 Suites)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Check-in Date
              </label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-white/40 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Check-out Date
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-white/40 font-mono"
              />
            </div>

            <div>
              <button
                type="submit"
                className="liquid-btn-primary w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg hover:scale-[1.02] transition-all"
              >
                <span>Search Available Suites</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Luxury Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center space-x-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Instant QR Access</span>
              <span className="text-[10px] text-zinc-400 font-mono">Digital voucher on payment</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center space-x-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Guaranteed Reservation</span>
              <span className="text-[10px] text-zinc-400 font-mono">100% verified stay allocation</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center space-x-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">50% Downpayment Rate</span>
              <span className="text-[10px] text-zinc-400 font-mono">Lock dates, balance at check-in</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. ROOM INVENTORY GRID (Section 2, 3) ================= */}
      <div id="rooms-section" className="space-y-6">
        
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 block">
              Bespoke Accommodation
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Featured Suites & Inventory
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
            {['All', 'Featured', 'Antipolo', 'Cainta'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedFilter === tab
                    ? 'bg-white text-black shadow-md shadow-white/10 font-black'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                {tab === 'All' ? 'All Suites' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Room Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-96 rounded-3xl bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-3xl bg-black/40 border border-white/10">
            <p className="text-zinc-300 font-bold">No suites found for selected filter.</p>
            <button
              onClick={() => setSelectedFilter('All')}
              className="mt-3 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={onSelectRoom}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= 4. GUEST EXPERIENCES & REVIEWS (Section 4, 8, 9) ================= */}
      <div id="guest-experiences-section" className="space-y-6 pt-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 block">
              Verified Stays & Community
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              <span>Guest Experiences</span>
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenExperienceModal}
              className="liquid-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Leave a Review</span>
            </button>
          </div>
        </div>

        {/* Experience Cards Carousel / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {guestExperiences.slice(0, 8).map((exp) => (
            <div
              key={exp.id}
              className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= exp.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {exp.stay_date || 'Verified'}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 italic line-clamp-3 leading-relaxed">
                  "{exp.review_text}"
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-white block truncate">{exp.guest_name}</span>
                  {exp.room_name && (
                    <span className="text-[10px] font-mono text-zinc-400 block">{exp.room_name}</span>
                  )}
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                  {exp.guest_name.charAt(0)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Google Maps + Guest Experience CTA Banner (Section 8) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-black border border-white/15 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1 text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl font-black text-white">Enjoyed Your Staycation?</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Find our exact pin on Google Maps, leave your feedback, or get real-time directions to our Antipolo and Cainta luxury locations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center">
            <button
              onClick={onOpenExperienceModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase bg-white text-black hover:bg-zinc-200 transition-all flex items-center space-x-1.5 shadow-lg"
            >
              <Star className="w-3.5 h-3.5 fill-black" />
              <span>Leave a Review</span>
            </button>

            <a
              href="https://maps.google.com/?q=Antipolo+Rizal+CG+Chillcation"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center space-x-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Antipolo Maps</span>
            </a>

            <a
              href="https://maps.google.com/?q=Cainta+Rizal+CG+Chillcation"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center space-x-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Cainta Maps</span>
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}
