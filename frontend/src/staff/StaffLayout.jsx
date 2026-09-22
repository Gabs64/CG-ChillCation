import React from 'react';
import StaffNavbar from './StaffNavbar';
import AdminDashboard from './AdminDashboard';
import SharedFooter from '../shared/SharedFooter';

export default function StaffLayout({ token, currentUser, onLogout }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] flex flex-col font-sans">
      <StaffNavbar currentUser={currentUser} onLogout={onLogout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <AdminDashboard token={token} currentUser={currentUser} />
      </main>

      <SharedFooter />
    </div>
  );
}
