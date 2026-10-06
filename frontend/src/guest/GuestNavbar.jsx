import React from 'react';
import { Sparkles, Heart, Search, MessageCircle, Star, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GuestNavbar({
  onOpenBookingsLookup,
  onOpenWishlist,
  wishlistCount = 0,
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white via-zinc-200 to-zinc-400 text-black flex items-center justify-center font-black text-xl tracking-tighter shadow-lg shadow-white/15 group-hover:scale-105 transition-all duration-300 border border-white/40">
            CG
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
            onClick={onOpenWishlist}
            className="h-10 px-3.5 sm:px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap text-zinc-300 hover:text-white hover:bg-white/5 transition-all duration-300 flex items-center justify-center relative border border-transparent hover:border-white/10"
          >
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-mono font-black bg-rose-500 text-white rounded-full">
                {wishlistCount}
              </span>
            )}
          </button>

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
