import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ currentUser, isLoadingAuth, allowedRoles, children }) {
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl liquid-glass border border-white/20 flex items-center justify-center shadow-xl">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
          Verifying Session...
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // If logged in as staff/support trying to access owner route, redirect to staff
    if (currentUser.role !== 'OWNER') {
      return <Navigate to="/staff" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

