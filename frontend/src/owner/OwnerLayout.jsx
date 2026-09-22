import React from 'react';
import OwnerNavbar from './OwnerNavbar';
import OwnerDashboard from './OwnerDashboard';
import SharedFooter from '../shared/SharedFooter';

export default function OwnerLayout({ token, currentUser, onLogout }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] flex flex-col font-sans">
      <OwnerNavbar currentUser={currentUser} onLogout={onLogout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <OwnerDashboard token={token} currentUser={currentUser} />
      </main>

      <SharedFooter />
    </div>
  );
}
