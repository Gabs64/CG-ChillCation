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
  const [secretAdminPath, setSecretAdminPath] = useState('portal-access-8f3k29x7-admin-secure');

  // Fetch configured secret portal path from public settings
  useEffect(() => {
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.secretAdminPath) {
          setSecretAdminPath(d.settings.secretAdminPath);
        }
      })
      .catch(() => {});
  }, []);

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
        {/* Public Dedicated Guest Routes (Section 49, 55) */}
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

        {/* Secret Non-Public Administrative Entry Path (Redirects to /login) */}
        <Route
          path="/portal-access-8f3k29x7-admin-secure"
          element={<Navigate to="/login" replace />}
        />
        {secretAdminPath !== 'portal-access-8f3k29x7-admin-secure' && (
          <Route
            path={`/${secretAdminPath}`}
            element={<Navigate to="/login" replace />}
          />
        )}

        {/* Dedicated Staff & Customer Support Protected Portal */}
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

        {/* Dedicated Executive Owner Protected Portal */}
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

        {/* Fallback Catch-all: Public unauthorized paths redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
