import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  Layers, 
  PlusCircle, 
  ListOrdered, 
  LogOut, 
  User, 
  Key, 
  Sparkles,
  Sliders,
  Bell
} from 'lucide-react';
import { fetchNotifications, markNotificationsAsRead } from '../api';

export default function Navbar({ wsConnected }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('triagex_theme') || 'dark');

  useEffect(() => {
    if (user) {
      fetchNotifications().then(setNotifications).catch(() => {});
      const interval = setInterval(() => {
        fetchNotifications().then(setNotifications).catch(() => {});
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleToggleNotifications = async () => {
    if (!showNotifications && notifications.some(n => !n.is_read)) {
      await markNotificationsAsRead().catch(() => {});
      fetchNotifications().then(setNotifications).catch(() => {});
    }
    setShowNotifications(!showNotifications);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('triagex_theme', next);
    if (next === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      {/* Top micro banner for SIH / Hackathon branding */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-950/30 to-slate-900 border-b border-blue-900/30 px-4 py-1 text-xs flex items-center justify-between text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            HELLO WORLD 2026
          </span>
          <span className="hidden sm:inline">Advanced Track • PS 4: Predictive Support Triage & Sentiment Router</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[11px] font-mono text-slate-300">
              {wsConnected ? 'LIVE WEBSOCKET' : 'SYNCING'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-medium">Team TriageX</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0070C0] to-[#1F497D] flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white font-mono">Triage<span className="text-[#0070C0]">X</span></span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20">
                  AI Router
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
                Predictive Sentiment & Urgency Dispatch
              </p>
            </div>
          </Link>

          {/* Nav Links according to Role */}
          <nav className="flex items-center space-x-1.5">
            {!user ? (
              // Logged Out
              <>
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/') ? 'bg-[#0070C0] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/login"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/login') ? 'bg-[#0070C0] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0070C0] hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  Create Account
                </Link>
              </>
            ) : user.role === 'customer' ? (
              // Customer Role
              <>
                <Link
                  to="/customer/tickets"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/customer/tickets') ? 'bg-[#0070C0] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ListOrdered className="w-4 h-4" />
                  <span>My Tickets</span>
                </Link>
                <Link
                  to="/customer/new"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/customer/new') ? 'bg-[#0070C0] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Ticket</span>
                </Link>
              </>
            ) : user.role === 'agent' ? (
              // Agent Role
              <>
                <Link
                  to="/agent"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/agent') ? 'bg-[#0070C0] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Triage Queue</span>
                </Link>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/dashboard') ? 'bg-[#0070C0] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Simulator</span>
                </Link>
              </>
            ) : (
              // Admin Role
              <>
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/admin') ? 'bg-[#0070C0] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Admin Console</span>
                </Link>
                <Link
                  to="/agent"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/agent') ? 'bg-[#0070C0] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Agent View</span>
                </Link>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/dashboard') ? 'bg-[#0070C0] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Simulator</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80">
                <div className="w-7 h-7 rounded-lg bg-[#1F497D] border border-blue-400/40 flex items-center justify-center text-xs font-bold text-white">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] flex items-center space-x-1.5 mt-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold uppercase border border-blue-500/30">
                      {user.role === 'agent' ? `${user.agent_level || 'Standard'} Agent` : user.role}
                    </span>
                    {user.customer_type && (
                      <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                        user.customer_type === 'VIP' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        user.customer_type === 'Premium' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {user.customer_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* In-App Notifications Bell */}
              <div className="relative">
                <button
                  onClick={handleToggleNotifications}
                  title="Notifications"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors relative border border-transparent hover:border-slate-700"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                      <span className="text-[10px] text-blue-400 font-mono">{notifications.length} recent</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-3 hover:bg-slate-800/40 transition-colors">
                            <div className="text-xs font-semibold text-slate-200">{n.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{n.message}</div>
                            <div className="text-[9px] text-slate-500 font-mono mt-1">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Dark / Light Mode Pill */}
              <button
                onClick={toggleTheme}
                title="Toggle Theme Mode"
                className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700 text-xs"
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>

              <Link
                to="/profile"
                title="My Profile"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700"
              >
                <User className="w-4 h-4" />
              </Link>

              <Link
                to="/change-password"
                title="Change Password"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700"
              >
                <Key className="w-4 h-4" />
              </Link>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-bold border border-slate-700 hover:border-rose-500/40 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
