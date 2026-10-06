import React from 'react';

export default function SharedFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/90 py-8 text-center text-xs text-brand-gray mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg overflow-hidden bg-black border border-white/20 flex items-center justify-center">
            <img src="/logo.png" alt="CG Chillcation" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-white tracking-wider uppercase">CG CHILLCATION</span>
          <span>&bull; Alpha-Test v1.1</span>
        </div>
        <p>Antipolo & Cainta Suites &bull; All Rights Reserved 2026</p>
      </div>
    </footer>
  );
}
