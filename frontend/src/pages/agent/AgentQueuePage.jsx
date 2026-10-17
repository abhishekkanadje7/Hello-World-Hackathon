import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchTickets, fetchAgentStats, claimTicket } from '../../api';

export default function AgentQueuePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unassigned'); // 'unassigned' | 'assigned' | 'resolved'
  const [claimingId, setClaimingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Real-time SLA clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const [ticketsData, statsData] = await Promise.all([
        fetchTickets(),
        fetchAgentStats()
      ]);
      setTickets(ticketsData);
      setStats(statsData);
      setErrorMsg('');
    } catch (err) {
      console.error('Failed to load agent queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // 5-second polling interval
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async (ticketId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setClaimingId(ticketId);
    setErrorMsg('');
    try {
      await claimTicket(ticketId);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to claim ticket');
    } finally {
      setClaimingId(null);
    }
  };

  // Filter tickets by tab
  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'unassigned') {
      return !t.assigned_agent_id && t.status !== 'Resolved';
    } else if (activeTab === 'assigned') {
      return t.assigned_agent_id === user?.id && t.status !== 'Resolved';
    } else {
      return t.status === 'Resolved';
    }
  });

  // SLA time calculation
  const getSlaStatus = (slaDueAt) => {
    if (!slaDueAt) return { text: 'N/A', isOverdue: false };
    const dueTime = new Date(slaDueAt).getTime();
    const diffMs = dueTime - currentTime;
    
    if (diffMs <= 0) {
      const minsPast = Math.abs(Math.floor(diffMs / 60000));
      return {
        text: `Overdue by ${minsPast > 60 ? `${Math.floor(minsPast / 60)}h ${minsPast % 60}m` : `${minsPast}m`}`,
        isOverdue: true
      };
    } else {
      const minsLeft = Math.floor(diffMs / 60000);
      return {
        text: minsLeft > 60 ? `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m remaining` : `${minsLeft}m remaining`,
        isOverdue: false
      };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Agent Triage Queue</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              user?.agent_level === 'Senior'
                ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                : 'bg-blue-950/80 text-blue-300 border-blue-800'
            }`}>
              {user?.agent_level || 'Standard'} Tier Agent
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Logged in as <span className="text-slate-200 font-medium">{user?.name}</span> ({user?.email}) • Auto-refreshing every 5s
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/customer/new"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            + Create Demo Ticket
          </Link>
          <button
            onClick={loadData}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors flex items-center space-x-1"
          >
            <span>🔄 Refresh</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-xs text-red-400 hover:text-red-200">Dismiss</button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">My Open Tickets</div>
          <div className="text-2xl font-bold text-white mt-1">
            {stats?.my_open_count ?? 0}
          </div>
          <div className="text-xs text-blue-400 mt-1">Assigned directly to you</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Unassigned In My Tier</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {stats?.unassigned_in_tier_count ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {user?.agent_level === 'Senior' ? 'Critical tickets waiting' : 'Standard & Routine tickets'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overdue SLA</div>
          <div className={`text-2xl font-bold mt-1 ${stats?.overdue_sla_count > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {stats?.overdue_sla_count ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Past guaranteed resolution time</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Resolved Today</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {stats?.resolved_today_count ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Completed resolution milestone</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 space-x-6">
        <button
          onClick={() => setActiveTab('unassigned')}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center space-x-2 ${
            activeTab === 'unassigned'
              ? 'text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Unassigned Queue</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {tickets.filter(t => !t.assigned_agent_id && t.status !== 'Resolved').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('assigned')}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center space-x-2 ${
            activeTab === 'assigned'
              ? 'text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Assigned To Me</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-950/80 text-blue-300 border border-blue-800">
            {tickets.filter(t => t.assigned_agent_id === user?.id && t.status !== 'Resolved').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('resolved')}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center space-x-2 ${
            activeTab === 'resolved'
              ? 'text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Resolved History</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300">
            {tickets.filter(t => t.status === 'Resolved').length}
          </span>
        </button>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading triage queue...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <span className="text-3xl block mb-2">🎉</span>
            <span className="font-medium text-slate-400">Queue is all clear</span>
            <p className="text-xs text-slate-500 mt-1">No tickets matching the current tab criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Priority & Tier</th>
                  <th className="py-3.5 px-4">SLA Countdown</th>
                  <th className="py-3.5 px-4">Status & Assignee</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTickets.map(ticket => {
                  const sla = getSlaStatus(ticket.sla_due_at);
                  const isAssignedToMe = ticket.assigned_agent_id === user?.id;
                  const isUnassigned = !ticket.assigned_agent_id;

                  return (
                    <tr 
                      key={ticket.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <Link to={`/agent/tickets/${ticket.id}`} className="block">
                          <div className="font-mono text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                            {ticket.ticket_number}
                          </div>
                          <div className="font-medium text-slate-200 mt-0.5 line-clamp-1 group-hover:text-white">
                            {ticket.subject}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {ticket.description}
                          </div>
                        </Link>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-300">{ticket.customer_name}</div>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                            ticket.customer_type === 'VIP'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : ticket.customer_type === 'Premium'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {ticket.customer_type}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">({ticket.channel})</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                            ticket.priority_score >= 70
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : ticket.priority_score >= 40
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {ticket.priority_score}
                          </span>
                          <div>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              ticket.assigned_tier === 'Critical'
                                ? 'bg-red-950/80 text-red-300 border border-red-800'
                                : ticket.assigned_tier === 'Standard'
                                ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            }`}>
                              {ticket.assigned_tier}
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {ticket.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {ticket.status === 'Resolved' ? (
                          <span className="text-xs text-slate-500">Resolved</span>
                        ) : (
                          <div className={`text-xs font-medium flex items-center space-x-1.5 ${
                            sla.isOverdue ? 'text-red-400 animate-pulse' : 'text-slate-300'
                          }`}>
                            <span>{sla.isOverdue ? '🚨' : '⏱️'}</span>
                            <span>{sla.text}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          ticket.status === 'Resolved'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : ticket.status === 'In Progress'
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                        }`}>
                          {ticket.status}
                        </span>
                        <div className="text-xs text-slate-400 mt-1">
                          {ticket.assigned_agent_name ? (
                            <span className={isAssignedToMe ? 'text-blue-300 font-medium' : 'text-slate-400'}>
                              👤 {ticket.assigned_agent_name}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Unassigned</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {isUnassigned && ticket.status !== 'Resolved' && (
                            <button
                              onClick={(e) => handleClaim(ticket.id, e)}
                              disabled={claimingId === ticket.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm disabled:opacity-50 transition-all"
                            >
                              {claimingId === ticket.id ? 'Claiming...' : 'Claim Ticket'}
                            </button>
                          )}
                          <Link
                            to={`/agent/tickets/${ticket.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          >
                            Open →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
