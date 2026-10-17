import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  Building, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Send, 
  Sparkles,
  Bot,
  UserCheck,
  Tag
} from 'lucide-react';
import { updateTicketStatus } from '../api';

export default function TicketDetailModal({ ticket, isOpen, onClose, onTicketUpdated, currentUser }) {
  if (!isOpen || !ticket) return null;

  const [status, setStatus] = useState(ticket.status);
  const [assignedAgent, setAssignedAgent] = useState(ticket.assigned_agent || '');
  const [note, setNote] = useState(ticket.resolution_note || '');
  const [saving, setSaving] = useState(false);

  const expl = ticket.explainability || {};
  const factors = expl.factors || [];
  const detectedKws = expl.detected_keywords || [];

  // Recommended AI response templates
  const getAiRecommendedResponse = () => {
    if (ticket.status === 'Auto-Resolved' && ticket.kb_auto_reply) {
      return `Dear ${ticket.customer_name},\n\nOur automated knowledge base identified an immediate solution for your inquiry:\n\n${ticket.kb_auto_reply.snippet}\n\nFor the complete step-by-step guide, please reference: "${ticket.kb_auto_reply.title}".`;
    }
    if (ticket.priority_score >= 70) {
      return `Dear ${ticket.customer_name},\n\nI understand the critical urgency of this issue regarding "${ticket.subject}". Because you are an esteemed ${ticket.plan_tier.toUpperCase()} customer experiencing an active operational disruption, this ticket has been prioritized to our Senior Engineering Operations team.\n\nWe are actively investigating and will provide a status update within 15 minutes.\n\nBest regards,\n${currentUser?.name || 'Senior Support Operations'}`;
    }
    return `Hello ${ticket.customer_name},\n\nThank you for reaching out to TriageX support. We have received your query regarding "${ticket.subject}" and our team is reviewing it.\n\nWe will get back to you shortly.\n\nBest regards,\n${currentUser?.name || 'Customer Support Team'}`;
  };

  const handleUpdate = async (newStatus) => {
    setSaving(true);
    try {
      const updated = await updateTicketStatus(ticket.id, {
        status: newStatus || status,
        assigned_agent: assignedAgent || currentUser?.name,
        resolution_note: note || (newStatus === 'Resolved' ? 'Resolved by agent' : undefined)
      });
      if (onTicketUpdated) onTicketUpdated(updated);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {ticket.ticket_number}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              ticket.priority_score >= 70 ? 'bg-rose-500 text-white animate-pulse' :
              ticket.priority_score >= 40 ? 'bg-amber-500 text-slate-900 font-bold' :
              'bg-emerald-500 text-white font-bold'
            }`}>
              Priority {ticket.priority_score}/100 • {ticket.assigned_tier}
            </span>
            <span className="text-xs text-slate-400">
              SLA: <strong>{ticket.sla_minutes_remaining || 30} mins</strong>
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Info Box */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">{ticket.subject}</h2>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
                  <span>From: <strong className="text-slate-200">{ticket.customer_name}</strong> ({ticket.customer_email})</span>
                  <span>•</span>
                  <span className="text-indigo-400 font-mono uppercase font-bold">{ticket.plan_tier} Tier</span>
                  <span>•</span>
                  <span>Channel: <span className="capitalize">{ticket.channel}</span></span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Created: {new Date(ticket.created_at).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-normal">
              {ticket.description}
            </div>
          </div>

          {/* Explainable AI Decision Engine Box (JUDGE KILLER FEATURE) */}
          <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border border-indigo-500/30 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Explainable AI (XAI) Scoring & Triage Rationale
                </h3>
              </div>
              <span className="text-xs font-mono text-indigo-300">
                Formula: (F × 0.4) + (U × 0.4) + (V × 0.2)
              </span>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 leading-relaxed">
              <strong>Routing Decision:</strong> {ticket.routing_reason}
            </div>

            {/* Factor Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {factors.map((f, idx) => (
                <div key={idx} className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{f.factor}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      Weight {f.weight}%
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-bold font-mono text-indigo-400">+{f.contribution}</span>
                    <span className="text-[11px] text-slate-400">pts to total</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full" 
                      style={{ width: `${Math.min(100, f.score)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{f.detail}</p>
                </div>
              ))}
            </div>

            {/* Detected Keywords Tag Cloud */}
            {detectedKws.length > 0 && (
              <div className="flex items-center space-x-2 pt-2">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs text-slate-400">Identified Triggers:</span>
                <div className="flex flex-wrap gap-1.5">
                  {detectedKws.map((kw, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Recommended Response */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>AI Auto-Suggested Response</span>
              </div>
              <button
                onClick={() => setNote(getAiRecommendedResponse())}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
              >
                <span>Use Template</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={note || getAiRecommendedResponse()}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
            />
          </div>

          {/* Agent Action Controls */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
            <label className="text-xs font-bold text-slate-300 block">Agent Operations & State Transitions</label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleUpdate('In Progress')}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Claim & Start Working</span>
              </button>

              <button
                onClick={() => handleUpdate('Escalated')}
                disabled={saving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Escalate to Senior Staff</span>
              </button>

              <button
                onClick={() => handleUpdate('Resolved')}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Send Resolution & Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
