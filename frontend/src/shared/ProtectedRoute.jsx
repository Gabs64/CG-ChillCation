import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ currentUser, allowedRoles, children }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // If logged in as staff trying to access owner route, redirect to staff
    if (currentUser.role !== 'OWNER') {
      return <Navigate to="/staff" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
