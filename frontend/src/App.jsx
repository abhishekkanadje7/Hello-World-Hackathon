import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LiveAgentQueue from './components/LiveAgentQueue';
import CustomerPortal from './components/CustomerPortal';
import AdminConsole from './components/AdminConsole';
import ArchitectureView from './components/ArchitectureView';
import TicketDetailModal from './components/TicketDetailModal';
import LoginModal from './components/LoginModal';
import { fetchTickets, initWebSocket } from './api';
import { Sparkles, Bell, X, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('queue');
  const [currentUser, setCurrentUser] = useState({
    id: 'usr-senior',
    email: 'pooja.senior@triagex.ai',
    name: 'Pooja Sharma (Senior Agent)',
    role: 'senior_agent',
    plan_tier: 'enterprise',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja'
  });

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [toast, setToast] = useState(null);

  // Load initial tickets from backend REST API
  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await fetchTickets();
      setTickets(data);
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Initialize Real-time WebSockets
  useEffect(() => {
    const ws = initWebSocket(
      (msg) => {
        if (msg.event === 'TICKET_CREATED') {
          const newTicket = msg.data;
          setTickets(prev => {
            const updated = [newTicket, ...prev.filter(t => t.id !== newTicket.id)];
            return updated.sort((a, b) => b.priority_score - a.priority_score);
          });
          // Show toast alert
          setToast({
            title: `New Ticket: ${newTicket.ticket_number} (Score: ${newTicket.priority_score})`,
            desc: `${newTicket.subject} — Routed to ${newTicket.assigned_tier}`,
            isCritical: newTicket.priority_score >= 70
          });
          setTimeout(() => setToast(null), 6000);
        } else if (msg.event === 'TICKET_UPDATED') {
          const updatedTicket = msg.data;
          setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
          if (selectedTicket && selectedTicket.id === updatedTicket.id) {
            setSelectedTicket(updatedTicket);
          }
        } else if (msg.event === 'WEIGHTS_RECALCULATED') {
          if (msg.data.tickets) {
            setTickets(msg.data.tickets);
          } else {
            loadTickets();
          }
        }
      },
      () => setWsConnected(true),
      () => setWsConnected(false)
    );

    return () => {
      ws.close();
    };
  }, [selectedTicket]);

  const criticalCount = tickets.filter(t => t.priority_score >= 70).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification for Real-Time WebSocket Events */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 max-w-md ${
            toast.isCritical 
              ? 'bg-rose-950/95 border-rose-500 text-rose-100 shadow-rose-500/20 glow-critical' 
              : 'bg-indigo-950/95 border-indigo-500 text-indigo-100 shadow-indigo-500/20'
          }`}>
            <div className={`p-2 rounded-xl ${toast.isCritical ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'}`}>
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold">{toast.title}</div>
              <div className="text-[11px] opacity-90 line-clamp-1">{toast.desc}</div>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={() => setCurrentUser(null)}
        wsConnected={wsConnected}
        queueCount={tickets.length}
        criticalCount={criticalCount}
      />

      {/* Main Views */}
      <main className="flex-1 pb-16">
        {currentTab === 'queue' && (
          <LiveAgentQueue
            tickets={tickets}
            onSelectTicket={(t) => setSelectedTicket(t)}
            onRefresh={loadTickets}
            loading={loading}
            wsConnected={wsConnected}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'customer' && (
          <CustomerPortal
            currentUser={currentUser}
            tickets={tickets}
            onTicketCreated={(newT) => {
              setTickets(prev => [newT, ...prev.filter(t => t.id !== newT.id)].sort((a, b) => b.priority_score - a.priority_score));
            }}
          />
        )}

        {currentTab === 'admin' && (
          <AdminConsole
            onWeightsRecalculated={loadTickets}
          />
        )}

        {currentTab === 'architecture' && (
          <ArchitectureView />
        )}
      </main>

      {/* Ticket Detail & Explainability Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={(updated) => {
          setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
          setSelectedTicket(updated);
        }}
        currentUser={currentUser}
      />

      {/* Multi-role Login & Evaluation Switcher Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          if (u.role === 'customer') setCurrentTab('customer');
          else if (u.role === 'admin') setCurrentTab('admin');
          else setCurrentTab('queue');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white font-mono">TriageX 2.0</span>
            <span>• Predictive Customer Support Triage & Sentiment Router</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Hello World 2026 | ACSES × Semicolon</span>
            <span className="text-slate-700">|</span>
            <span className="text-indigo-400 font-semibold">Team TriageX</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
