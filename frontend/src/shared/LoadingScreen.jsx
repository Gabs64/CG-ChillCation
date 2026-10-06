import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, ShieldCheck } from 'lucide-react';

export default function LoadingScreen({ minDisplayTime = 1400, onFinished }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing luxury sanctuary...');
  const [isExiting, setIsExiting] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min(Math.round((elapsed / minDisplayTime) * 100), 100);

      setProgress(calculatedProgress);

      if (calculatedProgress < 30) {
        setStatusText('Preparing minimalist suites...');
      } else if (calculatedProgress < 65) {
        setStatusText('Synchronizing availability calendar...');
      } else if (calculatedProgress < 90) {
        setStatusText('Curating bespoke guest experience...');
      } else {
        setStatusText('Welcome to CG Chillcation');
      }

      if (elapsed >= minDisplayTime) {
        clearInterval(interval);
        setIsExiting(true);
        setTimeout(() => {
          setIsUnmounted(true);
          if (onFinished) onFinished();
        }, 650); // Matches exit transition duration
      }
    }, 35);

    return () => clearInterval(interval);
  }, [minDisplayTime, onFinished]);

  if (isUnmounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090b] select-none transition-all duration-700 ease-out ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ willChange: 'opacity, transform' }}
    >
      {/* Ambient background light gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-emerald-500/[0.04] rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center space-y-6 animate-fade-in">
        
        {/* Animated Brand Emblem */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 -m-3 rounded-3xl border border-white/10 animate-ping opacity-30" />
          <div className="absolute inset-0 -m-1.5 rounded-3xl border border-white/20 animate-pulse" />
          
          {/* Emblem Box */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black/80 border border-white/30 backdrop-blur-2xl shadow-2xl flex flex-col items-center justify-center p-3 relative overflow-hidden group">
            {/* Shimmer light sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
            
            <img src="/logo.png" alt="CG Chillcation Logo" className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-md" />
            <div className="w-6 h-0.5 bg-white/60 rounded-full mt-1.5 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
        </div>

        {/* Brand Name & Typography */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-[0.25em] text-white uppercase font-sans">
            CG Chillcation
          </h1>
          <p className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-zinc-400 font-medium">
            Antipolo &bull; Cainta &bull; Philippines
          </p>
        </div>

        {/* Minimalist Progress Bar & Metric */}
        <div className="w-56 sm:w-64 space-y-2 pt-2">
          <div className="relative h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-white/40 via-white to-white transition-all duration-100 ease-out shadow-[0_0_12px_rgba(255,255,255,0.8)] rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span className="text-zinc-400 truncate max-w-[170px] text-left">
              {statusText}
            </span>
            <span className="text-zinc-300 font-bold ml-2">
              {progress}%
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
