import React from 'react';
import { Sparkles, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function GuestNavbar({ onOpenBookingsLookup, currentUser }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full liquid-glass border-b border-white/10 bg-[#09090b]/85 backdrop-blur-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link 
          to="/" 
          className="flex items-center space-x-3 group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white via-zinc-200 to-zinc-400 text-black flex items-center justify-center font-extrabold text-xl tracking-tighter shadow-lg shadow-white/15 group-hover:scale-105 transition-all duration-300 border border-white/40">
            CG
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base sm:text-lg font-black tracking-wider text-white uppercase block leading-none group-hover:text-zinc-200 transition-colors whitespace-nowrap">
                CG Chillcation
              </span>
              <Sparkles className="w-3.5 h-3.5 text-white/70 animate-pulse flex-shrink-0" />
            </div>
            <span className="text-[10px] text-brand-lightgray tracking-widest block font-mono mt-0.5 uppercase whitespace-nowrap">
              G'S BOOKING SYSTEM
            </span>
          </div>
        </Link>

        {/* Guest Exclusive Navigation Items */}
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1 no-scrollbar">
          
          <Link
            to="/"
            className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap bg-white text-black shadow-md shadow-white/10 flex items-center justify-center"
          >
            Suites
          </Link>

          <button
            onClick={onOpenBookingsLookup}
            className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-300 flex items-center justify-center"
          >
            My Booking
          </button>

          <a
            href="https://m.me/cgchillcation"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-300 flex items-center justify-center"
          >
            Chat
          </a>

          {/* Portal Switcher for logged in staff/owner */}
          {currentUser && (
            <Link
              to={currentUser.role === 'OWNER' ? '/owner' : '/staff'}
              className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Go to Admin Portal ({currentUser.role.replace('_', ' ')})</span>
            </Link>
          )}

        </div>

      </div>
    </header>
  );
}
