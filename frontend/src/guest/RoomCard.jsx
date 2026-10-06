import React from 'react';
import { MapPin, Maximize2, ArrowRight, Heart, Images } from 'lucide-react';

export default function RoomCard({ room, onSelect }) {
  const mainImage = room.images && room.images.length > 0
    ? room.images[0]
    : 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80';

  const photoCount = room.images ? room.images.length : 1;

  return (
    <div className={`group relative liquid-glass-card rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-500 border ${
      room.is_featured ? 'border-amber-400/40 shadow-xl shadow-amber-500/10 hover:border-amber-400/70' : 'border-white/10 hover:border-white/30'
    }`}>
      
      {/* Image Showcase with Dynamic Zoom & Gloss Gradient */}
      <div className="relative h-64 w-full overflow-hidden bg-brand-dark cursor-pointer" onClick={() => onSelect(room)}>
        <img
          src={mainImage}
          alt={room.room_name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        
        {/* Liquid Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/30 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-75" />

        {/* Top Badges: Location & Featured Tag */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 items-center z-10">
          <div className="liquid-glass text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20 flex items-center space-x-1.5 shadow-lg backdrop-blur-md">
            <MapPin className="w-3.5 h-3.5 text-white" />
            <span>{room.location}</span>
          </div>

          {room.is_featured && (
            <div className="bg-gradient-to-r from-amber-400 to-amber-300 text-black text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center shadow-lg shadow-amber-400/25 backdrop-blur-md">
              <span>Featured</span>
            </div>
          )}
        </div>

        {/* Bottom Tags: Photo Count & Suite Size */}
        <div className="absolute bottom-3.5 left-3.5 flex items-center space-x-2 z-10">
          <div className="text-[11px] font-mono text-zinc-300 flex items-center space-x-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 shadow-sm">
            <Maximize2 className="w-3 h-3 text-white" />
            <span>35 sqm Studio</span>
          </div>

          <div className="text-[11px] font-mono text-zinc-300 flex items-center space-x-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 shadow-sm">
            <Images className="w-3 h-3 text-white" />
            <span>{photoCount} Photos</span>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-black text-white group-hover:text-zinc-100 transition-colors">
              {room.room_name}
            </h3>
            
            {/* Operational Status with pulsing live dot */}
            <span className={`text-[10px] font-mono uppercase font-bold tracking-widest px-3 py-1 rounded-full border backdrop-blur-md flex items-center space-x-1.5 ${
              room.status === 'AVAILABLE' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-white/10 text-zinc-300 border-white/20'
            }`}>
              {room.status === 'AVAILABLE' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              <span>{room.status}</span>
            </span>
          </div>

          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans">
            {room.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono block">Price per night</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-white tracking-tight">₱{Number(room.price_per_night).toLocaleString()}</span>
              <span className="text-xs text-zinc-400 font-mono">/ night</span>
            </div>
          </div>

          <button
            onClick={() => onSelect(room)}
            className="liquid-btn-primary px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center space-x-2 group/btn shadow-xl hover:scale-105 transition-all"
          >
            <span>View Suite</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

    </div>
  );
}
