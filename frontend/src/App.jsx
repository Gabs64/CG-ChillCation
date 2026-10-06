import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GuestLayout from './guest/GuestLayout';
import StaffLayout from './staff/StaffLayout';
import OwnerLayout from './owner/OwnerLayout';
import LoginPage from './shared/LoginPage';
import ProtectedRoute from './shared/ProtectedRoute';
import LoadingScreen from './shared/LoadingScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cg_token') || '');
  const [isLoadingAuth, setIsLoadingAuth] = useState(!!localStorage.getItem('cg_token'));
  const [secretAdminPath, setSecretAdminPath] = useState('portal-access-8f3k29x7-admin-secure');
  const [showInitialSplash, setShowInitialSplash] = useState(true);

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
      setIsLoadingAuth(true);
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (data.user) {
            setCurrentUser(data.user);
          } else {
            throw new Error('No user data');
          }
        })
        .catch(() => {
          localStorage.removeItem('cg_token');
          setToken('');
          setCurrentUser(null);
        })
        .finally(() => {
          setIsLoadingAuth(false);
        });
    } else {
      setIsLoadingAuth(false);
    }
  }, [token]);

  const handleLoginSuccess = (user, authToken) => {
    setCurrentUser(user);
    setToken(authToken);
    setIsLoadingAuth(false);
    localStorage.setItem('cg_token', authToken);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    setIsLoadingAuth(false);
    localStorage.removeItem('cg_token');
  };

  return (
    <>
      {/* Initial Entry / Page Loading Animation */}
      {showInitialSplash && (
        <LoadingScreen
          minDisplayTime={1400}
          onFinished={() => setShowInitialSplash(false)}
        />
      )}

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
                isLoadingAuth={isLoadingAuth}
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
                isLoadingAuth={isLoadingAuth}
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
                isLoadingAuth={isLoadingAuth}
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
    </>
  );
}
