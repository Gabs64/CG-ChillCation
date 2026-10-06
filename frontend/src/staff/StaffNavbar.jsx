import React from 'react';
import { Sparkles, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StaffNavbar({ currentUser, onLogout }) {
  return (
    <header className="sticky top-0 z-40 w-full liquid-glass border-b border-white/10 bg-[#09090b]/85 backdrop-blur-2xl transition-all duration-300">
      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link 
          to="/staff" 
          className="flex items-center space-x-3 group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white via-zinc-200 to-zinc-400 text-black flex items-center justify-center font-extrabold text-xl tracking-tighter shadow-lg shadow-white/15 group-hover:scale-105 transition-all duration-300 border border-white/40">
            CG
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base sm:text-lg font-black tracking-wider text-white uppercase block leading-none group-hover:text-zinc-200 transition-colors whitespace-nowrap">
                Staff & Support Portal
              </span>
              <Sparkles className="w-3.5 h-3.5 text-white/70 animate-pulse flex-shrink-0" />
            </div>
            <span className="text-[10px] text-brand-lightgray tracking-widest block font-mono mt-0.5 uppercase whitespace-nowrap">
              OPERATIONAL CONTROL CENTER
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-2">
          
          {/* Owner Portal Link - ONLY visible to OWNER role */}
          {currentUser?.role === 'OWNER' && (
            <Link
              to="/owner"
              className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center justify-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Owner Portal</span>
            </Link>
          )}

          <Link
            to="/"
            target="_blank"
            className="h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center space-x-1.5"
          >
            <span>View Guest Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {currentUser && (
            <div className="flex items-center space-x-2 pl-3 border-l border-white/15 flex-shrink-0">
              <span className="h-10 px-3.5 rounded-xl text-[11px] font-mono font-bold uppercase tracking-widest text-white bg-white/10 border border-white/15 flex items-center justify-center whitespace-nowrap">
                {currentUser.role.replace('_', ' ')}
              </span>

              <button
                onClick={onLogout}
                title="Log Out"
                className="h-10 px-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center space-x-1 text-xs font-bold uppercase tracking-wider"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
