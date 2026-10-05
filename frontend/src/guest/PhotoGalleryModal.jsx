import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

export default function PhotoGalleryModal({ images = [], initialIndex = 0, roomName, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullScreen(false);
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl animate-fade-in select-none">
      
      {/* Top Controls Bar */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 z-10 bg-black/40">
        <div className="flex items-center space-x-3">
          <span className="text-white font-bold text-base tracking-wide">
            {roomName} Photo Gallery
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 text-zinc-300 border border-white/10">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 transition-colors"
            title="Close Gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        
        {/* Prev Button */}
        <button
          onClick={handlePrev}
          className="absolute left-4 sm:left-8 z-20 p-3 rounded-full bg-black/60 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md transition-all hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Current Photo */}
        <div className="max-w-5xl max-h-[70vh] sm:max-h-[75vh] w-full h-full flex items-center justify-center">
          <img
            src={images[currentIndex]}
            alt={`${roomName} - Photo ${currentIndex + 1}`}
            className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 transition-all duration-300"
          />
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute right-4 sm:right-8 z-20 p-3 rounded-full bg-black/60 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md transition-all hover:scale-110"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="h-24 px-4 sm:px-8 border-t border-white/10 bg-black/60 flex items-center justify-center space-x-3 overflow-x-auto no-scrollbar">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`relative flex-shrink-0 h-16 w-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
              currentIndex === idx
                ? 'border-white scale-105 shadow-lg shadow-white/10 ring-2 ring-white/30'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

    </div>
  );
}
