import React from 'react';
import { MapPin, Maximize2, ArrowRight } from 'lucide-react';

export default function RoomCard({ room, onSelect }) {
  const mainImage = room.images && room.images.length > 0 ? room.images[0] : 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="group relative liquid-glass-card liquid-reflection rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-500">
      
      {/* Image Showcase with Dynamic Zoom & Gloss Gradient */}
      <div className="relative h-64 w-full overflow-hidden bg-brand-dark">
        <img
          src={mainImage}
          alt={room.room_name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out grayscale-[15%] group-hover:grayscale-0"
        />
        
        {/* Liquid Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/30 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-75" />

        {/* Location Glass Pill Badge */}
        <div className="absolute top-3.5 left-3.5 liquid-glass text-white text-xs font-bold px-3.5 py-1.5 rounded-full border border-white/20 flex items-center space-x-1.5 shadow-lg backdrop-blur-md">
          <MapPin className="w-3.5 h-3.5 text-white" />
          <span>{room.location}</span>
        </div>

        {/* Room Size Pill Tag */}
        <div className="absolute bottom-3.5 left-3.5 text-[11px] font-mono text-brand-lightgray flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
          <Maximize2 className="w-3 h-3 text-white" />
          <span>35 sqm Studio Suite</span>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-black text-white group-hover:text-zinc-100 transition-colors">
              {room.room_name}
            </h3>
            
            {/* Strictly Monochrome Status Badge */}
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-md">
              {room.status}
            </span>
          </div>

          <p className="text-xs text-brand-lightgray line-clamp-2 leading-relaxed font-sans">
            {room.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] text-brand-gray uppercase tracking-widest font-mono block">Price per night</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-white tracking-tight">₱{room.price_per_night.toLocaleString()}</span>
              <span className="text-xs text-brand-gray">/ night</span>
            </div>
          </div>

          <button
            onClick={() => onSelect(room)}
            className="liquid-btn-primary px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 group/btn shadow-lg"
          >
            <span>View Suite</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

    </div>
  );
}
