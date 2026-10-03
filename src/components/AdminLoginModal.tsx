import React, { useState } from 'react';
import { Lock, Mail, KeyRound, AlertCircle, X, Shield, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedInput = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedInput || !trimmedPass) {
      setError('Please enter both Username/Email and Password.');
      return;
    }

    // Authorized Admin accounts
    const authorizedUsers = [
      'renuka1983charu@gmail.com',
      'admin@nexusgear.com',
      'admin'
    ];

    // Current valid admin password (configurable by admin, default: admin123)
    const storedPassword = (() => {
      try {
        return localStorage.getItem('nexusgear_admin_password') || 'admin123';
      } catch {
        return 'admin123';
      }
    })();

    const isUserAuthorized = authorizedUsers.includes(trimmedInput);
    const isPasswordCorrect = trimmedPass === storedPassword;

    if (isUserAuthorized && isPasswordCorrect) {
      onLoginSuccess(trimmedInput);
      setEmail('');
      setPassword('');
      setError(null);
    } else {
      // Clear password field on failed attempt
      setPassword('');
      setError('Access denied. Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white font-mono tracking-tight">
            Administrator Verification
          </h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Restricted access. Please enter your authorized credentials to continue.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-zinc-300 block">
              Admin Username / Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Enter admin username or email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-900 text-xs text-white placeholder-zinc-500 border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-zinc-300 block">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 text-xs text-white placeholder-zinc-500 border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-400 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs font-mono transition-all shadow-lg hover:shadow-amber-500/10 cursor-pointer"
          >
            Authenticate &amp; Enter
          </button>
        </form>

        <div className="pt-2 text-center text-[10px] text-zinc-500 font-mono flex items-center justify-center gap-1.5">
          <Shield className="w-3 h-3 text-zinc-600" />
          <span>Protected Area · All access attempts are recorded</span>
        </div>

      </div>
    </div>
  );
};
