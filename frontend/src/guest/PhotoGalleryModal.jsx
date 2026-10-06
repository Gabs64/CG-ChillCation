import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function PhotoGalleryModal({ images = [], initialIndex = 0, roomName, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const imageContainerRef = useRef(null);
  const touchStartDistRef = useRef(0);

  // Reset zoom & pan when image changes
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length, resetZoom]);

  const handleNext = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length, resetZoom]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleToggleZoom = (e) => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2);
    }
  };

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (scale > 1) {
          resetZoom();
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (scale === 1) handlePrev();
      } else if (e.key === 'ArrowRight') {
        if (scale === 1) handleNext();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale, handlePrev, handleNext, onClose, resetZoom]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 4));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || scale <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    // Calculate boundaries
    const maxBoundX = (scale - 1) * 350;
    const maxBoundY = (scale - 1) * 250;
    
    const newX = Math.max(-maxBoundX, Math.min(maxBoundX, dragStartRef.current.posX + dx));
    const newY = Math.max(-maxBoundY, Math.min(maxBoundY, dragStartRef.current.posY + dy));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan gesture
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (touchStartDistRef.current > 0) {
        const factor = dist / touchStartDistRef.current;
        setScale((prev) => Math.max(1, Math.min(4, prev * factor)));
        touchStartDistRef.current = dist;
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      
      const maxBoundX = (scale - 1) * 350;
      const maxBoundY = (scale - 1) * 250;
      
      const newX = Math.max(-maxBoundX, Math.min(maxBoundX, dragStartRef.current.posX + dx));
      const newY = Math.max(-maxBoundY, Math.min(maxBoundY, dragStartRef.current.posY + dy));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = 0;
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
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 z-20 bg-black/60 backdrop-blur-md">
        
        {/* Left: Room & Counter */}
        <div className="flex items-center space-x-3 min-w-0">
          <span className="text-white font-bold text-sm sm:text-base tracking-wide truncate">
            {roomName} Photo Gallery
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 text-zinc-300 border border-white/10 shrink-0">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        {/* Right: Zoom & Window Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className={`p-1.5 rounded-lg text-zinc-300 transition-colors ${
                scale <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10 hover:text-white'
              }`}
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              onClick={resetZoom}
              className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset Zoom (0)"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className={`p-1.5 rounded-lg text-zinc-300 transition-colors ${
                scale >= 4 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10 hover:text-white'
              }`}
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {scale > 1 && (
              <button
                onClick={resetZoom}
                className="p-1.5 rounded-lg text-amber-400 hover:bg-white/10 transition-colors border-l border-white/10 pl-1.5"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Gallery */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 transition-colors"
            title="Close Gallery (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage with Zoom and Pan */}
      <div 
        ref={imageContainerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden select-none ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
      >
        {/* Prev Button (only visible when not zoomed in) */}
        {scale === 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 z-20 p-3 rounded-full bg-black/70 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md transition-all hover:scale-110 shadow-2xl"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Current Photo with Transform */}
        <div 
          onClick={scale === 1 ? handleToggleZoom : undefined}
          className="max-w-6xl max-h-[70vh] sm:max-h-[76vh] w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          <img
            src={images[currentIndex]}
            alt={`${roomName} - Photo ${currentIndex + 1}`}
            draggable={false}
            className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 pointer-events-none"
          />
        </div>

        {/* Next Button (only visible when not zoomed in) */}
        {scale === 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-6 z-20 p-3 rounded-full bg-black/70 hover:bg-white text-white hover:text-black border border-white/20 backdrop-blur-md transition-all hover:scale-110 shadow-2xl"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Zoom Instructions / Hint Pill */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/70 border border-white/10 text-[11px] font-mono text-zinc-400 backdrop-blur-md pointer-events-none">
          {scale > 1
            ? `Zoom: ${Math.round(scale * 100)}% • Drag to pan • Click to reset`
            : 'Click image or use controls to zoom • Scroll to magnify'}
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="h-20 sm:h-24 px-4 sm:px-8 border-t border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-center space-x-2 sm:space-x-3 overflow-x-auto no-scrollbar z-20">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => {
              resetZoom();
              setCurrentIndex(idx);
            }}
            className={`relative flex-shrink-0 h-14 sm:h-16 w-20 sm:w-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
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
