import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { signInWithGoogle } from './firebase';

const Login = ({ onAdminLogin }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Failed to log in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = (e) => {
    e.preventDefault();
    if (adminUsername === 'parth' && adminPassword === 'parth@1234') {
      onAdminLogin({ uid: 'admin', role: 'admin', displayName: 'Super Admin' });
    } else {
      setError('Invalid admin credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-900 to-slate-900 z-0"></div>
      
      <div className="z-10 w-full max-w-md p-8 rounded-2xl bg-slate-800/80 backdrop-blur-xl border border-slate-700 shadow-2xl text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
            <TrendingUp size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TradePro</h1>
          <p className="text-slate-400">Sign in to manage your P&L</p>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 py-2 rounded-lg">{error}</p>}

        {!isAdminMode ? (
          <>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-600 rounded-xl shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-slate-900 transition-all"
            >
              {isLoading ? (
                <span className="text-slate-300">Connecting...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
            <p className="mt-6 text-sm text-slate-400">
              Are you an administrator?{' '}
              <button onClick={() => setIsAdminMode(true)} className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                Admin Login
              </button>
            </p>
          </>
        ) : (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500"
                placeholder="Admin Username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500"
                placeholder="Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-slate-900 bg-teal-500 hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all mt-2"
            >
              Secure Login
            </button>
            <p className="mt-4 text-sm text-slate-400">
              <button type="button" onClick={() => setIsAdminMode(false)} className="text-slate-300 hover:text-white font-medium transition-colors">
                ← Back to User Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
