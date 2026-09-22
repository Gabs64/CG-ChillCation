import React, { useState } from 'react';
import { X, Lock, Mail, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginModal({ onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed.');
      } else {
        onLoginSuccess(data.user, data.token);
        if (onClose) onClose();
      }
    } catch (err) {
      setError('Network error authenticating credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md liquid-glass border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 animate-modal-pop">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 rounded-full liquid-btn text-white hover:bg-white hover:text-black transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-black mb-3 shadow-xl">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black text-white">Administrative Portal</h3>
          <p className="text-xs text-brand-lightgray mt-1">
            Staff, Customer Support & Owner Login
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-gray" />
              <input
                type="email"
                required
                placeholder="admin@cgchillcation.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full liquid-input rounded-xl pl-10 pr-3 py-3 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-brand-lightgray uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-gray" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full liquid-input rounded-xl pl-10 pr-3 py-3 text-white text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full liquid-btn-primary py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Log In</span>
          </button>
        </form>

        {/* Demo Quick Logins */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center space-y-2">
          <span className="text-[10px] text-brand-gray uppercase tracking-widest block">Quick Demo Logins (Password: password123)</span>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleQuickFill('owner@cgchillcation.com')}
              className="text-[11px] liquid-btn text-brand-lightgray px-3 py-1 rounded-lg"
            >
              Owner
            </button>
            <button
              onClick={() => handleQuickFill('staff@cgchillcation.com')}
              className="text-[11px] liquid-btn text-brand-lightgray px-3 py-1 rounded-lg"
            >
              Staff
            </button>
            <button
              onClick={() => handleQuickFill('support@cgchillcation.com')}
              className="text-[11px] liquid-btn text-brand-lightgray px-3 py-1 rounded-lg"
            >
              Customer Support
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
