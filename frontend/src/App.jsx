import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GuestLayout from './guest/GuestLayout';
import StaffLayout from './staff/StaffLayout';
import OwnerLayout from './owner/OwnerLayout';
import LoginPage from './shared/LoginPage';
import ProtectedRoute from './shared/ProtectedRoute';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cg_token') || '');

  // Restore user session if token exists
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('cg_token');
          setToken('');
          setCurrentUser(null);
        });
    }
  }, [token]);

  const handleLoginSuccess = (user, authToken) => {
    setCurrentUser(user);
    setToken(authToken);
    localStorage.setItem('cg_token', authToken);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    localStorage.removeItem('cg_token');
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Dedicated Guest Routes */}
        <Route path="/" element={<GuestLayout currentUser={currentUser} />} />
        <Route path="/guest" element={<GuestLayout currentUser={currentUser} />} />

        {/* Administrative Login Route */}
        <Route
          path="/login"
          element={
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              currentUser={currentUser}
            />
          }
        />

        {/* Dedicated Staff & Customer Support Route */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute
              currentUser={currentUser}
              allowedRoles={['STAFF', 'CUSTOMER_SUPPORT', 'OWNER']}
            >
              <StaffLayout
                token={token}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Executive Owner Route */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute
              currentUser={currentUser}
              allowedRoles={['OWNER']}
            >
              <OwnerLayout
                token={token}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
