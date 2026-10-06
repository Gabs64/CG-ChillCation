import React, { useState } from 'react';
import { MapPin, Maximize2, Images, CheckCircle2, MessageCircle, ExternalLink, Calendar } from 'lucide-react';
import PhotoGalleryModal from './PhotoGalleryModal';
import CustomModal from '../shared/CustomModal';

export default function RoomDetailsModal({ room, onClose, onStartBooking }) {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!room) return null;

  const images = room.images && room.images.length > 0
    ? room.images
    : ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'];

  // Google Maps link
  const googleMapsUrl = room.google_maps_url || (
    room.location === 'Antipolo'
      ? 'https://maps.google.com/?q=Antipolo+Rizal+CG+Chillcation'
      : 'https://maps.google.com/?q=Cainta+Rizal+CG+Chillcation'
  );

  // Auto-generate Meta/Messenger Draft Message (Section 17, 18)
  const handleOpenMessenger = () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const draftMessage = `Hello CG Chillcation! I am interested in booking:\n\nRoom: ${room.room_name}\nLocation: ${room.location}\nCheck-in: ${today}\nCheck-out: ${tomorrow}\nGuests: 2\nRate: ₱${Number(room.price_per_night).toLocaleString()}/night\n\nCan you provide more information?`;
    
    const encodedText = encodeURIComponent(draftMessage);
    const messengerUrl = `https://m.me/cgchillcation?text=${encodedText}`;
    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <CustomModal
        isOpen={true}
        onClose={onClose}
        size="4xl"
        bodyClassName="p-0 sm:p-0"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[520px]">
          {/* Left Column: Multi-Photo Showcase */}
          <div className="relative h-72 md:h-full min-h-[360px] bg-brand-dark">
            <img
              src={images[selectedImageIndex]}
              alt={room.room_name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowGallery(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b]/90 via-transparent to-transparent pointer-events-none" />

            {/* Gallery Launcher Pill */}
            <button
              onClick={() => setShowGallery(true)}
              className="absolute bottom-4 left-4 liquid-glass text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/20 hover:bg-white hover:text-black transition-all flex items-center space-x-2 shadow-lg backdrop-blur-md"
            >
              <Images className="w-4 h-4" />
              <span>View All Photos ({images.length})</span>
            </button>

            {/* Thumbnail Selector */}
            <div className="absolute bottom-4 right-4 flex space-x-1.5">
              {images.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx ? 'border-white scale-105 ring-2 ring-white/30' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Details, Google Maps & Meta integration */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-black uppercase tracking-wider flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{room.location}</span>
                </span>

                {room.is_featured && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-black uppercase tracking-wider flex items-center">
                    <span>Featured Suite</span>
                  </span>
                )}

                <span className="text-xs font-mono text-zinc-300 border border-white/10 px-2.5 py-1 rounded-full flex items-center space-x-1 bg-black/40">
                  <Maximize2 className="w-3 h-3 text-white" />
                  <span>35 sqm Studio</span>
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white mt-2 mb-1">
                {room.room_name}
              </h2>
              <p className="text-xs text-zinc-400 tracking-widest uppercase mb-4 font-mono">
                CG Chillcation &bull; {room.location}, Philippines
              </p>

              <p className="text-sm text-zinc-300 leading-relaxed mb-6 font-sans">
                {room.description}
              </p>

              {/* Included Amenities */}
              <div className="space-y-2.5 mb-6">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block font-mono">Included Amenities</span>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-200">
                  <div className="flex items-center space-x-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>King Size Bed</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>High-Speed Wi-Fi</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hot & Cold Shower</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-black/40 p-2.5 rounded-xl border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Smart Ambient Lights</span>
                  </div>
                </div>
              </div>

              {/* External Actions: Google Maps & Meta/Messenger */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View on Google Maps</span>
                </a>

                <button
                  onClick={handleOpenMessenger}
                  className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ask via Messenger</span>
                </button>
              </div>
            </div>

            {/* Price & Primary Action Row */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono block">Rate per night</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-black text-white">₱{Number(room.price_per_night).toLocaleString()}</span>
                  <span className="text-xs text-zinc-400">/ night</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onStartBooking(room);
                }}
                className="liquid-btn-primary px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg"
              >
                <span>Book Now</span>
              </button>
            </div>

          </div>
        </div>
      </CustomModal>

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
