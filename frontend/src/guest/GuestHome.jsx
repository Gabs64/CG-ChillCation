import React, { useState, useEffect } from 'react';
import { MapPin, Sparkles, Star, MessageCircle, ShieldCheck } from 'lucide-react';
import RoomCard from './RoomCard';

export default function GuestHome({ onSelectRoom }) {
  const [rooms, setRooms] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchRooms(selectedLocation);
  }, [selectedLocation]);

  useEffect(() => {
    fetchReviews();
  }, []);

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

  return (
    <div className="space-y-16 pb-24">
      
      {/* Hero Section */}
      <section className="relative rounded-3xl liquid-glass border border-white/15 p-8 sm:p-14 overflow-hidden shadow-2xl animate-fade-in">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full liquid-glass text-xs font-mono text-brand-lightgray uppercase tracking-widest border border-white/20 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: '8s' }} />
            <span>Liquid Luxury Suites &bull; Antipolo & Cainta</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Minimalist Sanctuary for Your Perfect Staycation.
          </h1>

          <p className="text-sm sm:text-base text-brand-lightgray max-w-2xl leading-relaxed">
            Experience CG Chillcation’s signature 14-suite inventory across Antipolo and Cainta. Instant QR verification, zero guest registration, and seamless payment via QR Ph and Dragonpay.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-white liquid-glass px-4 py-2.5 rounded-2xl border border-white/15 shadow-md">
              <MapPin className="w-4 h-4 text-white" />
              <span>7 Suites in Antipolo</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-white liquid-glass px-4 py-2.5 rounded-2xl border border-white/15 shadow-md">
              <MapPin className="w-4 h-4 text-white" />
              <span>7 Suites in Cainta</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-white liquid-glass px-4 py-2.5 rounded-2xl border border-white/15 shadow-md">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Same 35sqm Layout</span>
            </div>
          </div>
        </div>
      </section>

      {/* Location Filter & Rooms Section */}
      <section className="space-y-8">
        
        {/* Filter Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Available Suites</h2>
            <p className="text-xs text-brand-lightgray">
              Showing {rooms.length} suite{rooms.length === 1 ? '' : 's'} available for immediate booking
            </p>
          </div>

          {/* Liquid Glass Location Filter Pills */}
          <div className="flex items-center space-x-2 liquid-glass p-1.5 rounded-2xl border border-white/15 shadow-lg">
            {['All', 'Antipolo', 'Cainta'].map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-5 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
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

        {/* 14-Room Grid */}
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

      {/* Customer Reviews Section */}
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

      {/* Floating Messenger Support Button */}
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
