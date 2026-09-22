import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PhotoGalleryModal({ images, initialIndex = 0, roomName, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!images || images.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8">
      
      {/* Top Header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div>
          <h4 className="text-lg font-bold text-white uppercase tracking-wider">{roomName}</h4>
          <p className="text-xs text-brand-gray font-mono">
            Photo {currentIndex + 1} of {images.length}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-brand-card border border-brand-border text-white hover:bg-white hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div className="relative max-w-5xl w-full h-[70vh] flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`${roomName} photograph ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-brand-border"
        />

        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className="absolute left-4 p-3 rounded-full bg-brand-black/80 border border-white/20 text-white hover:bg-white hover:text-black transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute right-4 p-3 rounded-full bg-brand-black/80 border border-white/20 text-white hover:bg-white hover:text-black transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnail Bar */}
      <div className="absolute bottom-6 flex items-center space-x-3 overflow-x-auto max-w-xl px-4 py-2 bg-brand-card/80 backdrop-blur-md rounded-2xl border border-brand-border">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
              currentIndex === idx ? 'border-white scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

    </div>
  );
}
