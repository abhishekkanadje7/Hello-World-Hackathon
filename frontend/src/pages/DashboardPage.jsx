import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LiveAgentQueue from '../components/LiveAgentQueue';
import AdminConsole from '../components/AdminConsole';
import ArchitectureView from '../components/ArchitectureView';
import TicketDetailModal from '../components/TicketDetailModal';
import { fetchTickets, initWebSocket } from '../api';
import { Layers, Sliders, Cpu, Bell, X } from 'lucide-react';

export default function DashboardPage({ wsConnected }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'queue' : 'queue');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await fetchTickets();
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // WebSocket updates
  useEffect(() => {
    const ws = initWebSocket(
      (msg) => {
        if (msg.event === 'TICKET_CREATED') {
          const newTicket = msg.data;
          setTickets(prev => {
            const updated = [newTicket, ...prev.filter(t => t.id !== newTicket.id)];
            return updated.sort((a, b) => b.priority_score - a.priority_score);
          });
          setToast({
            title: `New Ticket ${newTicket.ticket_number} (${newTicket.assigned_tier})`,
            desc: `${newTicket.subject}`,
            isCritical: newTicket.assigned_tier === 'Critical'
          });
          setTimeout(() => setToast(null), 6000);
        } else if (msg.event === 'TICKET_UPDATED') {
          const updated = msg.data;
          setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
          if (selectedTicket && selectedTicket.id === updated.id) {
            setSelectedTicket(updated);
          }
        } else if (msg.event === 'WEIGHTS_RECALCULATED') {
          loadTickets();
        }
      }
    );

    return () => {
      ws.close();
    };
  }, [selectedTicket]);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 max-w-md ${
            toast.isCritical 
              ? 'bg-rose-950/95 border-rose-500 text-rose-100 shadow-rose-500/20' 
              : 'bg-blue-950/95 border-blue-500 text-blue-100 shadow-blue-500/20'
          }`}>
            <Bell className="w-5 h-5 animate-pulse" />
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

      {/* Top Tab Bar for Agent/Admin */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'queue'
                ? 'bg-[#0070C0] text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Live Triage Queue ({tickets.length})</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#0070C0] text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Admin Weights & Control</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'architecture'
                ? 'bg-[#0070C0] text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Architecture Flow</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'queue' && (
        <LiveAgentQueue
          tickets={tickets}
          onSelectTicket={(t) => setSelectedTicket(t)}
          onRefresh={loadTickets}
          loading={loading}
          wsConnected={wsConnected}
          currentUser={user}
        />
      )}

      {activeTab === 'admin' && user?.role === 'admin' && (
        <AdminConsole
          onWeightsRecalculated={loadTickets}
        />
      )}

      {activeTab === 'architecture' && (
        <ArchitectureView />
      )}

      {/* Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onTicketUpdated={(updated) => {
          setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
          setSelectedTicket(updated);
        }}
        currentUser={user}
      />
    </div>
  );
}
