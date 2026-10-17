// =============================================================================
// TriageX - Modern Enterprise Navigation Bar (Navbar)
// कमेंट: स्वच्छ, कॉर्पोरेट आणि स्लीक नेव्हिगेशन बार. 
// सर्व रोल्स (Admin, Agent, Customer) साठी स्पष्ट आणि सुटसुटीत लिंक्स.
// =============================================================================

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

  // इन-अॅप नोटिफिकेशन्स पोलिंग
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      {/* Top micro banner for Event / Hackathon branding */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 text-xs flex items-center justify-between text-slate-600">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
            HELLO WORLD 2026
          </span>
          <span className="hidden sm:inline font-medium text-slate-500">
            Advanced Track • PS 4: Predictive Support Triage & Sentiment Router
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[11px] font-mono font-medium text-slate-700">
              {wsConnected ? 'LIVE SYSTEM' : 'LIVE SYSTEM'}
            </span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 font-semibold">Team TriageX</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link 
            to={user ? (user.role === 'admin' ? '/admin' : user.role === 'agent' ? '/agent' : '/customer/tickets') : '/'} 
            className="flex items-center space-x-2 group"
          >
            <span className="text-2xl font-black tracking-tight text-slate-900 font-sans">
              Triage<span className="text-blue-600">X</span>
            </span>
            <span className="text-slate-300 font-light text-xl">/</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Support Router
            </span>
          </Link>

          {/* Nav Links according to Role */}
          <nav className="flex items-center space-x-1.5">
            {!user ? (
              // Logged Out
              <>
                <Link
                  to="/"
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                >
                  Sign In
                </Link>
              </>
            ) : user.role === 'customer' ? (
              // Customer Role
              <>
                <Link
                  to="/customer/tickets"
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/customer/tickets') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ListOrdered className="w-4 h-4" />
                  <span>My Tickets</span>
                </Link>
                <Link
                  to="/customer/new"
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/customer/new') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </Link>
              </>
            ) : user.role === 'agent' ? (
              // Agent Role
              <>
                <Link
                  to="/agent"
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/agent') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Triage Queue</span>
                </Link>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/dashboard') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Live Simulator</span>
                </Link>
              </>
            ) : (
              // Admin Role
              <>
                <Link
                  to="/admin"
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/admin') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Admin Console</span>
                </Link>
                <Link
                  to="/agent"
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/agent') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Agent Queue</span>
                </Link>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive('/dashboard') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Live Simulator</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Profile & Actions */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Profile Card */}
              <div className="flex items-center space-x-2 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
                <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] flex items-center space-x-1 mt-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-semibold uppercase">
                      {user.role === 'agent' ? `${user.agent_level || 'Standard'} Agent` : user.role}
                    </span>
                    {user.customer_type && (
                      <span className="px-1.5 py-0.2 rounded font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
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
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative border border-slate-200"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</span>
                      <span className="text-[10px] text-blue-600 font-mono font-semibold">{notifications.length} recent</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                            <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">{n.message}</div>
                            <div className="text-[9px] text-slate-400 font-mono mt-1">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Link */}
              <Link
                to="/profile"
                title="My Profile"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                <User className="w-4 h-4" />
              </Link>

              {/* Change Password Link */}
              <Link
                to="/change-password"
                title="Change Password"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                <Key className="w-4 h-4" />
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Log Out"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-semibold border border-slate-200 hover:border-red-200 transition-all"
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
