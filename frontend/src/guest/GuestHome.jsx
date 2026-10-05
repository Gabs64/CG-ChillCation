import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, MapPin, Star, MessageCircle, ArrowRight } from 'lucide-react';
import RoomCard from './RoomCard';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=85',
    title: 'CG CHILLCATION',
    subtitle: 'YOUR UNFORGETTABLE GETAWAY'
  },
  {
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=2000&q=85',
    title: 'CG CHILLCATION',
    subtitle: 'MINIMALIST LUXURY & TRANQUIL SANCTUARY'
  },
  {
    image: 'https://images.unsplash.com/photo-1590490360182-c3d57733427?auto=format&fit=crop&w=2000&q=85',
    title: 'CG CHILLCATION',
    subtitle: 'BESPOKE SUITES IN ANTIPOLO & CAINTA'
  }
];

export default function GuestHome({ onSelectRoom }) {
  const [rooms, setRooms] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Search Bar State
  const [arrivalDate, setArrivalDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [departureDate, setDepartureDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [guestCount, setGuestCount] = useState('2');
  const [searchLocation, setSearchLocation] = useState('All');

  useEffect(() => {
    fetchRooms(selectedLocation);
  }, [selectedLocation]);

  useEffect(() => {
    fetchReviews();
  }, []);

  // Auto slide banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const fetchRooms = async (location) => {
    setIsLoading(true);
    try {
      const url = location === 'All' ? '/api/rooms' : `/api/rooms?location=${encodeURIComponent(location)}`;
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

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const handleSearchBookNow = (e) => {
    e.preventDefault();
    if (searchLocation !== selectedLocation) {
      setSelectedLocation(searchLocation);
    }
    const roomsSection = document.getElementById('rooms-section');
    if (roomsSection) {
      roomsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-16 pb-24 -mt-2">
      
      {/* 1. HERO BANNER SECTION WITH INTEGRATED SEARCH BAR */}
      <section className="relative rounded-3xl overflow-hidden liquid-glass border border-white/15 shadow-2xl">
        {/* Banner Images Carousel */}
        <div className="relative h-[460px] sm:h-[540px] lg:h-[580px] w-full overflow-hidden bg-black">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.subtitle}
                className="w-full h-full object-cover brightness-[0.75] contrast-[1.05]"
              />
              {/* Dark Gradient Overlay for optimal contrast and mood */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-black/40 to-black/30" />
            </div>
          ))}

          {/* Left Arrow Button */}
          <button
            onClick={handlePrevSlide}
            aria-label="Previous Slide"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full liquid-glass border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 shadow-xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={handleNextSlide}
            aria-label="Next Slide"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full liquid-glass border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 shadow-xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Centered Hero Typography */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pb-20 sm:pb-24 z-10">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-widest uppercase drop-shadow-2xl font-sans">
              {HERO_SLIDES[currentSlide].title}
            </h1>
            <p className="text-xs sm:text-sm lg:text-base font-semibold text-zinc-300 tracking-[0.25em] uppercase mt-3 drop-shadow-md">
              {HERO_SLIDES[currentSlide].subtitle}
            </p>
          </div>

          {/* Floating Booking Search Bar Overlaid at Bottom of Hero */}
          <div className="absolute bottom-4 sm:bottom-6 inset-x-3 sm:inset-x-6 lg:inset-x-12 z-20">
            <form
              onSubmit={handleSearchBookNow}
              className="liquid-glass border border-white/20 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-center"
            >
              {/* Arrival */}
              <div className="bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Arrival</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="bg-transparent text-white text-xs font-semibold focus:outline-none w-full cursor-pointer [color-scheme:dark]"
                  />
                  <Calendar className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                </div>
              </div>

              {/* Departure */}
              <div className="bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Departure</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="bg-transparent text-white text-xs font-semibold focus:outline-none w-full cursor-pointer [color-scheme:dark]"
                  />
                  <Calendar className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                </div>
              </div>

              {/* Guests */}
              <div className="bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Guests</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="bg-transparent text-white text-xs font-semibold focus:outline-none w-full cursor-pointer [color-scheme:dark]"
                  >
                    <option value="1" className="bg-[#09090b] text-white">1 guest</option>
                    <option value="2" className="bg-[#09090b] text-white">2 guests</option>
                    <option value="3" className="bg-[#09090b] text-white">3 guests</option>
                    <option value="4" className="bg-[#09090b] text-white">4 guests</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Location</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <select
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="bg-transparent text-white text-xs font-semibold focus:outline-none w-full cursor-pointer [color-scheme:dark]"
                  >
                    <option value="All" className="bg-[#09090b] text-white">All Locations</option>
                    <option value="Antipolo" className="bg-[#09090b] text-white">Antipolo (7 Suites)</option>
                    <option value="Cainta" className="bg-[#09090b] text-white">Cainta (7 Suites)</option>
                  </select>
                </div>
              </div>

              {/* Book Now Button */}
              <button
                type="submit"
                className="h-[52px] w-full liquid-btn-primary rounded-xl font-extrabold text-xs uppercase tracking-widest flex items-center justify-center space-x-2 shadow-2xl hover:scale-[1.02] transition-transform duration-200"
              >
                <span>BOOK NOW</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL INTRO SECTION (Directly Below Hero - Matches 2nd photo) */}
      <section className="liquid-glass rounded-3xl border border-white/15 p-8 sm:p-12 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand Name & 5-Star Rating */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase font-sans">
              CG CHILLCATION
            </h2>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-white text-white drop-shadow" />
              ))}
              <span className="text-xs font-mono font-bold text-zinc-300 ml-2">5.0 / 5.0</span>
            </div>
          </div>

          {/* Right Column: Editorial Narrative */}
          <div className="lg:col-span-8">
            <p className="text-xs sm:text-sm text-brand-lightgray leading-relaxed font-sans">
              Where Antipolo’s breezy hilltop serenity meets Cainta’s vibrant hospitality. CG Chillcation nestles in prime, secluded staycation hideaways designed for peaceful weekend getaways, private couple retreats, and comfortable workcations. Our exclusive suites capture the feel of a secret haven so completely, you'd never guess how close you are to the metro. Settle in, slow down, and immerse yourself in bespoke minimalist luxury with ultra high-speed Wi-Fi, ambient smart lighting, and instant QR verification.
            </p>
          </div>
        </div>
      </section>

      {/* 3. ROOMS SECTION */}
      <section id="rooms-section" className="space-y-8">
        {/* Section Header with 'Rooms' title on left and 'See All' / location filters on right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">Rooms</h2>
            <p className="text-xs text-brand-lightgray mt-0.5">
              Explore our collection of 35sqm minimalist suites
            </p>
          </div>

          {/* Filter Pills & See All */}
          <div className="flex items-center space-x-2 liquid-glass p-1.5 rounded-2xl border border-white/15 shadow-lg">
            {['All', 'Antipolo', 'Cainta'].map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                  selectedLocation === loc
                    ? 'liquid-btn-primary shadow-md scale-105'
                    : 'text-brand-lightgray hover:text-white hover:bg-white/5'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 liquid-glass rounded-3xl border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 liquid-glass rounded-3xl border border-white/10">
            <p className="text-white font-bold">No suites found in this location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={onSelectRoom}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. CUSTOMER REVIEWS SECTION */}
      <section className="liquid-glass rounded-3xl border border-white/15 p-8 sm:p-12 space-y-8 shadow-2xl">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="flex justify-center space-x-1 text-white mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-5 h-5 fill-white text-white drop-shadow-md" />
            ))}
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-wider">Guest Experiences</h3>
          <p className="text-xs text-brand-lightgray">Verified staycation reviews from CG Chillcation guests</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((rev) => (
            <div key={rev.id} className="liquid-glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
              <p className="text-xs text-brand-offwhite italic leading-relaxed">
                "{rev.review}"
              </p>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-white">— {rev.guest_name}</span>
                <span className="text-brand-gray font-mono">★★★★★</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. FLOATING MESSENGER SUPPORT BUTTON */}
      <a
        href="https://m.me/cgchillcation"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 liquid-btn-primary px-6 py-3.5 rounded-full shadow-2xl flex items-center space-x-2.5 border border-white/40 group hover:scale-110 transition-all duration-300"
        title="Contact Customer Support on Messenger"
      >
        <MessageCircle className="w-5 h-5 fill-black group-hover:rotate-12 transition-transform duration-300" />
        <span className="text-xs font-extrabold tracking-wider uppercase">Messenger Support</span>
      </a>

    </div>
  );
}
