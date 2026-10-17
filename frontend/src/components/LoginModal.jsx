import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  User, 
  Key, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  Building,
  Headphones,
  Sliders
} from 'lucide-react';
import { fetchDemoUsers, loginUser } from '../api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [demoUsers, setDemoUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchDemoUsers().then(users => setDemoUsers(users)).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser(email, password);
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user) => {
    setLoading(true);
    setError(null);
    try {
      // In seed data, default password for admin is admin123, senior is senior123, agent is agent123, clients are client123
      let pw = 'client123';
      if (user.role === 'admin') pw = 'admin123';
      else if (user.role === 'senior_agent') pw = 'senior123';
      else if (user.role === 'standard_agent') pw = 'agent123';
      
      const data = await loginUser(user.email, pw);
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Select Role / Log In</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  ⚡ 1-Click Evaluation Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400">Switch persona instantly to evaluate different user perspectives</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Quick 1-Click Persona Switcher */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 block flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Persona Login (Recommended for Judges)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoUsers.map((u) => {
                let badgeColor = 'bg-slate-700 text-slate-300';
                let icon = <User className="w-4 h-4" />;
                if (u.role === 'admin') {
                  badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                  icon = <Sliders className="w-4 h-4 text-purple-400" />;
                } else if (u.role === 'senior_agent') {
                  badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                  icon = <ShieldCheck className="w-4 h-4 text-rose-400" />;
                } else if (u.role === 'standard_agent') {
                  badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
                  icon = <Headphones className="w-4 h-4 text-indigo-400" />;
                } else if (u.plan_tier === 'enterprise') {
                  badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  icon = <Building className="w-4 h-4 text-amber-400" />;
                }

                return (
                  <button
                    key={u.id}
                    disabled={loading}
                    onClick={() => handleQuickLogin(u)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 text-left transition-all group shadow-sm hover:shadow-indigo-500/10"
                  >
                    <div className="flex items-center space-x-3">
                      <img 
                        src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} 
                        alt={u.name} 
                        className="w-10 h-10 rounded-xl bg-slate-700 border border-slate-600"
                      />
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                          {u.email}
                        </div>
                        <div className="mt-1 flex items-center space-x-1.5">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${badgeColor} capitalize`}>
                            {u.role.replace('_', ' ')}
                          </span>
                          {u.plan_tier && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-700/80 text-slate-300 uppercase font-mono">
                              {u.plan_tier}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase font-mono">Or Manual Credentials</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Email Address</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Log In to Account</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
