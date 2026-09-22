import React, { useState } from 'react';
import { X, MapPin, Maximize2, Images, CheckCircle2, Sparkles } from 'lucide-react';
import PhotoGalleryModal from './PhotoGalleryModal';

export default function RoomDetailsModal({ room, onClose, onStartBooking }) {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!room) return null;

  const images = room.images && room.images.length > 0 ? room.images : ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'];

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-4xl liquid-glass border border-white/20 rounded-3xl overflow-hidden shadow-2xl my-8 animate-modal-pop">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 text-white border border-white/20 hover:bg-white hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Column: Image Showcase */}
            <div className="relative h-72 md:h-full min-h-[340px] bg-brand-dark">
              <img
                src={images[selectedImageIndex]}
                alt={room.room_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-transparent to-transparent" />

              {/* Gallery Launcher Pill */}
              <button
                onClick={() => setShowGallery(true)}
                className="absolute bottom-4 left-4 liquid-glass text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/20 hover:bg-white hover:text-black transition-all flex items-center space-x-2"
              >
                <Images className="w-4 h-4" />
                <span>View All Photos ({images.length})</span>
              </button>

              {/* Thumbnail Selector */}
              <div className="absolute bottom-4 right-4 flex space-x-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx ? 'border-white scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Details & Actions */}
            <div className="p-6 md:p-8 flex flex-col justify-between space-y-6 pr-14">
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-black uppercase tracking-wider flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{room.location}</span>
                  </span>
                  <span className="text-xs font-mono text-brand-lightgray border border-white/10 px-2.5 py-1 rounded-full flex items-center space-x-1 bg-black/40">
                    <Maximize2 className="w-3 h-3" />
                    <span>35 sqm</span>
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-white mt-2 mb-1">
                  {room.room_name}
                </h2>
                <p className="text-xs text-brand-gray tracking-widest uppercase mb-4 font-mono">
                  CG Chillcation Premium Suite &bull; {room.location}
                </p>

                <p className="text-sm text-brand-offwhite leading-relaxed mb-6">
                  {room.description}
                </p>

                {/* Features List */}
                <div className="space-y-2.5 mb-6">
                  <span className="text-xs font-bold text-brand-lightgray uppercase tracking-wider block">Included Amenities</span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-brand-offwhite">
                    <div className="flex items-center space-x-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>King Size Bed</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>High-Speed Wi-Fi</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Hot & Cold Shower</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Smart Ambient Lights</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Action Row */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-brand-gray uppercase tracking-wider font-mono block">Rate per night</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-white">₱{room.price_per_night.toLocaleString()}</span>
                    <span className="text-xs text-brand-gray">/ night</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onStartBooking(room);
                  }}
                  className="liquid-btn-primary px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Book Now</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>

      {showGallery && (
        <PhotoGalleryModal
          images={images}
          initialIndex={selectedImageIndex}
          roomName={room.room_name}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
}
