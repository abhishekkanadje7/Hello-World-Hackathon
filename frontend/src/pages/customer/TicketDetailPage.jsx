import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchTicketById, sendTicketReply } from '../../api';
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Bot, 
  User, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTicketById(id);
      setTicket(data);
      setReplies(data.replies || []);
    } catch (err) {
      setError(err.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [id]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setSending(true);
    try {
      const rep = await sendTicketReply(ticket.id, newReply.trim(), false);
      setReplies(prev => [...prev, rep]);
      setNewReply('');
    } catch (err) {
      alert(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
        <span>Loading ticket details...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error || 'Ticket not found or access denied.'}
        </div>
        <Link
          to="/customer/tickets"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Tickets</span>
        </Link>
      </div>
    );
  }

  const isCritical = ticket.assigned_tier === 'Critical';
  const isStandard = ticket.assigned_tier === 'Standard';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/tickets"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Tickets</span>
        </Link>
        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
          {ticket.ticket_number}
        </span>
      </div>

      {/* Main Ticket Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {ticket.subject}
            </h1>
            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 pt-1">
              <span>Submitted on {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span className="capitalize">{ticket.channel} channel</span>
              <span>•</span>
              <span>Category: <strong>{ticket.category}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              isCritical ? 'bg-rose-500 text-white animate-pulse' :
              isStandard ? 'bg-amber-400 text-slate-950 font-bold' :
              'bg-emerald-500 text-white'
            }`}>
              {ticket.assigned_tier} Tier
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              ticket.status === 'Resolved' ? 'bg-slate-700 text-slate-300' :
              ticket.status === 'In Progress' ? 'bg-blue-600 text-white' :
              'bg-emerald-600 text-white'
            }`}>
              {ticket.status}
            </span>
          </div>
        </div>

        {/* Original Issue Description */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Issue Description
          </div>
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </div>
        </div>

        {/* SLA & Status Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div>
              <span className="text-slate-400">SLA Commitment: </span>
              <strong className="text-white font-mono">
                Due {new Date(ticket.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </div>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="text-slate-400">Assigned Handler: </span>
              <strong className="text-white">{ticket.assigned_agent_name || 'Triage Dispatch Team'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <h2 className="text-base font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
          <span>Conversation Thread</span>
          <span className="text-xs font-mono text-slate-400 font-normal">({replies.length} replies)</span>
        </h2>

        {replies.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No replies on this ticket yet. Our support engineering team will post updates here.
          </p>
        ) : (
          <div className="space-y-4">
            {replies.map((r) => {
              const isSystem = r.author_role === 'system';
              const isAgent = r.author_role === 'agent' || r.author_role === 'admin';
              const isSelf = r.author_role === 'customer';

              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    isSystem ? 'bg-emerald-950/20 border-emerald-500/30' :
                    isAgent ? 'bg-blue-950/20 border-blue-500/30' :
                    'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSystem ? 'bg-emerald-500/20 text-emerald-400' :
                        isAgent ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {isSystem ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-bold text-white">{r.author_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                        isSystem ? 'bg-emerald-500/20 text-emerald-300' :
                        isAgent ? 'bg-blue-500/20 text-blue-300' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {r.author_role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed pl-8">
                    {r.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CSAT Rating Widget (If Resolved) */}
        {ticket.status === 'Resolved' && (
          <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/40 my-4">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <span>⭐</span>
              <span>Customer Satisfaction Rating (CSAT)</span>
            </h3>
            {ticket.csat_rating ? (
              <div className="text-xs text-slate-300 flex items-center space-x-2">
                <span>You rated this ticket:</span>
                <span className="text-amber-400 font-bold">{'★'.repeat(ticket.csat_rating)}{'☆'.repeat(5 - ticket.csat_rating)}</span>
                <span className="text-slate-400">({ticket.csat_rating}/5 stars)</span>
                {ticket.csat_feedback && <span className="italic text-slate-400 font-sans">"{ticket.csat_feedback}"</span>}
              </div>
            ) : (
              <CsatSubmissionForm ticketId={ticket.id} onSubmitted={(updated) => setTicket(updated)} />
            )}
          </div>
        )}

        {/* Reply Box */}
        <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            Add a Reply
          </label>
          <textarea
            rows={3}
            required
            placeholder="Type your message here..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            className="w-full p-3.5 bg-slate-950 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0070C0] leading-relaxed"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || !newReply.trim()}
              className="px-5 py-2.5 bg-[#0070C0] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {sending ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CsatSubmissionForm({ ticketId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { submitCsatRating } = await import('../../api');
      const res = await submitCsatRating(ticketId, rating, feedback);
      if (onSubmitted) onSubmitted(res.ticket);
    } catch (err) {
      alert(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center space-x-2">
        <span className="text-xs text-slate-300">Rate your experience:</span>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className={`text-lg transition-transform hover:scale-125 ${
                star <= rating ? 'text-amber-400' : 'text-slate-600'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-xs font-mono font-bold text-amber-300">({rating}/5)</span>
      </div>

      <input
        type="text"
        placeholder="Optional comments or suggestions..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
      />

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  );
}

