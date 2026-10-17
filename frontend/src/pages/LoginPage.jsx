import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  AlertCircle,
  Building,
  UserCheck,
  Headphones,
  Sliders
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    roleLabel: "Admin",
    name: "System Administrator",
    email: "admin@triagex.com",
    password: "Admin@123",
    badge: "Full Control",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    icon: <Sliders className="w-4 h-4 text-purple-400" />
  },
  {
    roleLabel: "Senior Agent",
    name: "Pooja Sharma",
    email: "senior@triagex.com",
    password: "Agent@123",
    badge: "Senior Level",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    icon: <ShieldCheck className="w-4 h-4 text-rose-400" />
  },
  {
    roleLabel: "Agent",
    name: "Vikas Patil",
    email: "agent@triagex.com",
    password: "Agent@123",
    badge: "Standard Level",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    icon: <Headphones className="w-4 h-4 text-blue-400" />
  },
  {
    roleLabel: "Customer",
    name: "Abhishek Kanadje",
    email: "customer@triagex.com",
    password: "Customer@123",
    badge: "VIP Tier",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    icon: <Building className="w-4 h-4 text-amber-400" />
  }
];

export default function LoginPage() {
  const { login, sessionExpiredMsg } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(sessionExpiredMsg || null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (user.must_change_password) {
        navigate('/change-password');
      } else if (user.role === 'customer') {
        navigate('/customer/tickets');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setLoading(true);
    setError(null);
    try {
      const user = await login(demo.email, demo.password);
      if (user.must_change_password) {
        navigate('/change-password');
      } else if (user.role === 'customer') {
        navigate('/customer/tickets');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white">Sign In to TriageX</h1>
        <p className="text-sm text-slate-400">Access support queues, customer tickets, and predictive routing controls</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Login Form */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0070C0]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0070C0]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-3 bg-[#0070C0] hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 font-bold hover:underline">
              Create customer account
            </Link>
          </div>
        </div>

        {/* Right: 1-Click Demo Accounts */}
        <div className="md:col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              1-Click Demo Logins
            </h3>
          </div>

          <p className="text-xs text-slate-400">
            Quickly authenticate as any pre-seeded persona for the hackathon evaluation:
          </p>

          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((d, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin(d)}
                className="w-full p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    {d.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                      Login as {d.roleLabel}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {d.email}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${d.badgeColor}`}>
                  {d.badge}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-500 italic">
              Note: Agent accounts are created and provisioned by the admin only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
