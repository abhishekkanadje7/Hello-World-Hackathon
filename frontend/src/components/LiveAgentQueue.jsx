import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  Building, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  Mail, 
  Globe, 
  MessageSquare,
  RefreshCw,
  Eye,
  Bot
} from 'lucide-react';

export default function LiveAgentQueue({ 
  tickets = [], 
  onSelectTicket, 
  onRefresh, 
  loading, 
  wsConnected,
  currentUser 
}) {
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering
  const filteredTickets = tickets.filter(t => {
    if (tierFilter !== 'ALL') {
      if (tierFilter === 'SENIOR' && t.assigned_tier !== 'Senior Agent') return false;
      if (tierFilter === 'STANDARD' && t.assigned_tier !== 'Standard Agent') return false;
      if (tierFilter === 'KB' && t.assigned_tier !== 'KB Auto-reply') return false;
    }
    if (statusFilter !== 'ALL' && t.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSub = t.subject?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchNum = t.ticket_number?.toLowerCase().includes(q);
      const matchCust = t.customer_name?.toLowerCase().includes(q);
      if (!matchSub && !matchDesc && !matchNum && !matchCust) return false;
    }
    return true;
  });

  const criticalCount = tickets.filter(t => t.priority_score >= 70).length;
  const standardCount = tickets.filter(t => t.priority_score >= 40 && t.priority_score < 70).length;
  const kbCount = tickets.filter(t => t.assigned_tier === 'KB Auto-reply').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Total Live Queue</div>
            <div className="text-2xl font-black text-white font-mono mt-1">{tickets.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Synced in real-time</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-2xl shadow-lg flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="text-xs font-semibold text-rose-300">Critical Priority (Score ≥ 70)</div>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1 flex items-center space-x-2">
              <span>{criticalCount}</span>
              {criticalCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-sans font-bold border border-rose-500/40 uppercase animate-pulse">
                  Senior Action
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Under 15m SLA guarantee</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-300">Standard Queue (40-69)</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{standardCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Assigned to support staff</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-300">KB Auto-Deflected</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{kbCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">0s wait time for routine FAQ</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Queue Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filter Tier:</span>
            {['ALL', 'SENIOR', 'STANDARD', 'KB'].map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  tierFilter === tier
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700'
                }`}
              >
                {tier === 'ALL' ? 'All Tiers' : tier === 'SENIOR' ? '🔴 Senior Escalated' : tier === 'STANDARD' ? '🟡 Standard Agent' : '🟢 KB Auto-Reply'}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search ticket, customer, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
              />
            </div>
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh queue"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Priority Sorted Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Rank & ID</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Customer & Account</th>
                <th className="py-3 px-4">Issue Summary & NLP Factors</th>
                <th className="py-3 px-4">Assigned Route</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No tickets found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t, idx) => {
                  const isCritical = t.priority_score >= 70;
                  const isStandard = t.priority_score >= 40 && t.priority_score < 70;
                  const expl = t.explainability || {};

                  return (
                    <tr 
                      key={t.id}
                      onClick={() => onSelectTicket(t)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isCritical ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Rank & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                            idx === 0 && isCritical ? 'bg-rose-500 text-white animate-bounce' : 'bg-slate-800 text-slate-400'
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-mono font-bold text-indigo-400">{t.ticket_number}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(t.created_at).toLocaleTimeString()}
                        </div>
                      </td>

                      {/* Priority Score Gauge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <div className={`px-2.5 py-1 rounded-xl font-mono text-sm font-black border flex items-center space-x-1 ${
                            isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-critical' :
                            isStandard ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                            'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            <span>{t.priority_score}</span>
                            <span className="text-[10px] opacity-70">/100</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {isCritical ? '🔴 Urgent Escalation' : isStandard ? '🟡 Normal Triage' : '🟢 Routine FAQ'}
                        </div>
                      </td>

                      {/* Customer & Plan */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white truncate max-w-[160px]">{t.customer_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">{t.customer_email}</div>
                        <div className="mt-1 flex items-center space-x-1.5">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-bold ${
                            t.plan_tier === 'enterprise' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            t.plan_tier === 'pro' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {t.plan_tier}
                          </span>
                          <span className="text-slate-500 capitalize text-[10px] flex items-center space-x-0.5">
                            {t.channel === 'email' ? <Mail className="w-3 h-3" /> :
                             t.channel === 'chat' ? <MessageSquare className="w-3 h-3" /> :
                             <Globe className="w-3 h-3" />}
                            <span>{t.channel}</span>
                          </span>
                        </div>
                      </td>

                      {/* Subject & NLP Breakdown preview */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-white truncate">{t.subject}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{t.description}</div>
                        {/* NLP Indicators */}
                        <div className="flex items-center space-x-2 mt-1.5 text-[10px]">
                          <span className="text-rose-400 font-mono">Frust: {expl.frustration_score || 0}%</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-amber-400 font-mono">Urg: {expl.urgency_score || 0}%</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-indigo-400 font-mono">Val: {expl.customer_value_score || 20}pt</span>
                        </div>
                      </td>

                      {/* Assigned Route */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${
                          t.assigned_tier === 'Senior Agent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                          t.assigned_tier === 'Standard Agent' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {t.assigned_tier}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {t.assigned_agent || 'Unassigned'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'Escalated' ? 'bg-rose-500 text-white' :
                          t.status === 'In Progress' ? 'bg-amber-400 text-slate-900' :
                          t.status === 'Auto-Resolved' ? 'bg-emerald-500 text-white' :
                          t.status === 'Resolved' ? 'bg-slate-700 text-slate-300' :
                          'bg-indigo-600 text-white'
                        }`}>
                          {t.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(t);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg font-semibold transition-all border border-indigo-500/40 flex items-center space-x-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Explain AI</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
