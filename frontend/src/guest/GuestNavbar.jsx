import React from 'react';
import { Heart, Search, MessageCircle, Star, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GuestNavbar({
  onOpenBookingsLookup,
  onOpenReviews,
  onOpenExperienceModal
}) {
  return (
    <header className="sticky top-0 z-40 w-full liquid-glass border-b border-white/10 bg-[#09090b]/90 backdrop-blur-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link 
          to="/" 
          className="flex items-center space-x-3 group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-lg shadow-white/10 group-hover:scale-105 transition-all duration-300 border border-white/20">
            <img src="/logo.png" alt="CG Chillcation Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-black tracking-wider text-white uppercase block leading-none group-hover:text-zinc-200 transition-colors whitespace-nowrap">
              CG Chillcation
            </span>
          </div>
        </Link>

        {/* Public Customer Navigation Items (Strictly customer-facing as per FSD Section 45, 49, 55) */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1 no-scrollbar">
          
          <a
            href="#rooms-section"
            className="h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap bg-white text-black shadow-md shadow-white/10 flex items-center justify-center hover:bg-zinc-200 transition-all"
          >
            <span>Suites</span>
          </a>

          <button
            onClick={onOpenBookingsLookup}
            className="h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-300 flex items-center justify-center border border-transparent hover:border-white/10"
          >
            <span>My Booking</span>
          </button>

          <a
            href="#guest-experiences-section"
            className="h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-300 flex items-center justify-center border border-transparent hover:border-white/10"
          >
            <span>Reviews</span>
          </a>

          <a
            href="https://m.me/cgchillcation"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-300 flex items-center justify-center border border-transparent hover:border-white/10"
          >
            <span>Chat</span>
          </a>

        </div>

      </div>
    </header>
  );
}
