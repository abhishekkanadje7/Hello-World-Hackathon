import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchTickets } from '../../api';
import { 
  PlusCircle, 
  ListOrdered, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function MyTicketsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'ALL' && t.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchNum = t.ticket_number?.toLowerCase().includes(q);
      const matchSub = t.subject?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchNum && !matchSub && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">My Support Tickets</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as <strong className="text-white">{user?.name}</strong> • Customer Tier: <strong className="text-blue-400 uppercase font-mono">{user?.customer_type || 'Regular'}</strong>
          </p>
        </div>
        <Link
          to="/customer/new"
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-[#0070C0] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Ticket</span>
        </Link>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-1.5">
          {['ALL', 'Open', 'In Progress', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-[#0070C0] text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All Status' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search my tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-52 sm:w-64"
            />
          </div>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Loading tickets...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Clock className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No support tickets found.</p>
            <Link
              to="/customer/new"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0070C0] text-white text-xs font-bold rounded-xl shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Your First Ticket</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Ticket Number</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Priority Score</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredTickets.slice((page - 1) * pageSize, page * pageSize).map((t) => {
                  const isCritical = t.assigned_tier === 'Critical';
                  const isStandard = t.assigned_tier === 'Standard';

                  return (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/customer/tickets/${t.id}`)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                        {t.ticket_number}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-white truncate">{t.subject}</div>
                        <div className="text-[11px] text-slate-400 truncate line-clamp-1 mt-0.5">
                          {t.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${
                          isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                          isStandard ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {t.priority_score}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isCritical ? 'bg-rose-500 text-white' :
                          isStandard ? 'bg-amber-400 text-slate-900 font-bold' :
                          'bg-emerald-500 text-white'
                        }`}>
                          {t.assigned_tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Resolved' ? 'bg-slate-700 text-slate-300' :
                          t.status === 'In Progress' ? 'bg-blue-600 text-white' :
                          'bg-emerald-600 text-white'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] font-mono">
                        {new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredTickets.length > pageSize && (
          <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {Math.min(filteredTickets.length, (page - 1) * pageSize + 1)} to {Math.min(filteredTickets.length, page * pageSize)} of {filteredTickets.length} tickets
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
              >
                Previous
              </button>
              <span className="font-mono text-slate-200">
                Page {page} of {Math.ceil(filteredTickets.length / pageSize)}
              </span>
              <button
                disabled={page >= Math.ceil(filteredTickets.length / pageSize)}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
