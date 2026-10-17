import React from 'react';
import { 
  ShieldAlert, 
  Layers, 
  Settings, 
  UserCheck, 
  Activity, 
  HelpCircle, 
  Cpu, 
  Radio, 
  LogOut, 
  User,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  currentUser, 
  onOpenLogin, 
  onLogout, 
  wsConnected, 
  queueCount,
  criticalCount 
}) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      {/* Top micro banner for SIH / Hackathon branding */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border-b border-indigo-900/30 px-4 py-1 text-xs flex items-center justify-between text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            HELLO WORLD 2026
          </span>
          <span className="hidden sm:inline">Advanced Track • PS 4: Predictive Support Triage & Sentiment Router</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[11px] font-mono text-slate-300">
              {wsConnected ? 'LIVE WEBSOCKET' : 'CONNECTING...'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-medium">Team TriageX</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('queue')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white font-mono">Triage<span className="text-indigo-400">X</span></span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                  AI Router
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
                Predictive Sentiment & Urgency Dispatch
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setCurrentTab('queue')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'queue'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Live Queue</span>
              {queueCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  criticalCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300'
                }`}>
                  {queueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('customer')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'customer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Customer Portal</span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-bold border border-amber-400/30">
                Demo
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Admin & Weights</span>
            </button>

            <button
              onClick={() => setCurrentTab('architecture')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'architecture'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span className="hidden md:inline">Architecture</span>
            </button>
          </nav>

          {/* User profile / Role Switcher */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-2.5 bg-slate-800/80 pl-2 pr-3 py-1.5 rounded-xl border border-slate-700/80">
                <img 
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} 
                  alt={currentUser.name} 
                  className="w-7 h-7 rounded-lg bg-indigo-900 border border-indigo-400/40"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-white flex items-center space-x-1">
                    <span>{currentUser.name.split(' ')[0]}</span>
                    <span className="text-[10px] px-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                    {currentUser.email}
                  </div>
                </div>
                <button
                  onClick={onOpenLogin}
                  title="Switch Role"
                  className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 rounded font-semibold border border-indigo-500/30 transition-all flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="hidden sm:inline">Switch Role</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              >
                <User className="w-4 h-4" />
                <span>Log In / Switch</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
