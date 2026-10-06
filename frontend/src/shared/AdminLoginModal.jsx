import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import CustomModal from './CustomModal';

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
    <CustomModal
      isOpen={true}
      onClose={onClose}
      title="Administrative Portal"
      subtitle="Authorized Access Only"
      icon={ShieldCheck}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-zinc-400 font-mono -mt-2">
          Staff, Customer Support & Owner Management Login
        </p>

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1.5 font-mono text-[11px]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
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
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1.5 font-mono text-[11px]">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
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
        <div className="pt-4 border-t border-white/10 text-center space-y-2">
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">
            Quick Demo Logins (Password: password123)
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleQuickFill('owner@cgchillcation.com')}
              className="text-[11px] liquid-btn text-zinc-300 px-3 py-1 rounded-lg"
            >
              Owner
            </button>
            <button
              onClick={() => handleQuickFill('staff@cgchillcation.com')}
              className="text-[11px] liquid-btn text-zinc-300 px-3 py-1 rounded-lg"
            >
              Staff
            </button>
            <button
              onClick={() => handleQuickFill('support@cgchillcation.com')}
              className="text-[11px] liquid-btn text-zinc-300 px-3 py-1 rounded-lg"
            >
              Customer Support
            </button>
          </div>
        </div>
      </div>
    </CustomModal>
  );
}
