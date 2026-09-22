import React from 'react';

export default function SharedFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/90 py-8 text-center text-xs text-brand-gray mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-white">CG CHILLCATION</span>
          <span>&bull; G's Booking System v1.0</span>
        </div>
        <p>Antipolo & Cainta Suites &bull; All Rights Reserved 2026</p>
      </div>
    </footer>
  );
}
