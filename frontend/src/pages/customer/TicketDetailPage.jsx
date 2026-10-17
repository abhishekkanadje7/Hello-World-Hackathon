// =============================================================================
// TriageX - Professional Customer Ticket Detail & Conversation Thread
// कमेंट: ग्राहकांसाठी (Customer) तिकीट तपशील आणि संभाषण पृष्ठ.
// यात कोणताही अंतर्गत AI Priority Score किंवा गुप्त Triage स्कोअर दिसत नाही.
// केवळ ग्राहकाचे प्रश्न, एजंटची उत्तरे आणि सोडवल्यानंतर CSAT रेटिंग दिसते.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchTicketById, sendTicketReply } from '../../api';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  User, 
  Bot,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building
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
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
        <span>Loading ticket details...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error || 'Ticket not found or access denied.'}
        </div>
        <Link
          to="/customer/tickets"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Tickets</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 bg-slate-50 min-h-[calc(100vh-100px)] animate-fade-in">
      {/* शीर्ष नेव्हिगेशन (Back navigation) */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/tickets"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Tickets</span>
        </Link>
        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
          Ref: {ticket.ticket_number}
        </span>
      </div>

      {/* मुख्य तिकीट माहिती कार्ड (Header Card) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {ticket.subject}
            </h1>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 pt-1">
              <span>Submitted {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span className="font-medium text-slate-700">Department: {ticket.category || 'General'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              ticket.status === 'Resolved' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
              ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              Status: {ticket.status}
            </span>
          </div>
        </div>

        {/* मूळ समस्या वर्णन (Original Description) */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Ticket Description
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </div>
        </div>

        {/* हँडलर माहिती (Handler Info - No internal scoring exposed) */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Assigned Support Team: <strong className="text-slate-800">{ticket.assigned_agent_name || 'Support Operations Team'}</strong></span>
          </div>
          <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Active Ticket</span>
          </div>
        </div>
      </div>

      {/* संभाषण थ्रेड (Conversation Thread) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
          <span>Conversation History</span>
          <span className="text-xs font-mono text-slate-400 font-normal">({replies.length} messages)</span>
        </h2>

        {replies.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No replies on this ticket yet. An agent will post an update here soon.
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
                  className={`p-4 rounded-xl border space-y-2 ${
                    isSystem ? 'bg-emerald-50/60 border-emerald-200' :
                    isAgent ? 'bg-blue-50/50 border-blue-200' :
                    'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        isSystem ? 'bg-emerald-600 text-white' :
                        isAgent ? 'bg-blue-600 text-white' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {isSystem ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-bold text-slate-900">{r.author_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                        isSystem ? 'bg-emerald-100 text-emerald-800' :
                        isAgent ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {r.author_role === 'customer' ? 'Customer' : 'Support Specialist'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed pl-8">
                    {r.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CSAT Rating Widget (If Resolved) */}
        {ticket.status === 'Resolved' && (
          <div className="p-5 rounded-xl bg-amber-50/80 border border-amber-200 my-4">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <span>⭐</span>
              <span>Customer Satisfaction Rating (CSAT)</span>
            </h3>
            {ticket.csat_rating ? (
              <div className="text-xs text-slate-700 flex items-center space-x-2">
                <span>You rated this ticket:</span>
                <span className="text-amber-500 font-bold text-sm">{'★'.repeat(ticket.csat_rating)}{'☆'.repeat(5 - ticket.csat_rating)}</span>
                <span className="text-slate-500 font-semibold">({ticket.csat_rating}/5 stars)</span>
                {ticket.csat_feedback && <span className="italic text-slate-600">"{ticket.csat_feedback}"</span>}
              </div>
            ) : (
              <CsatSubmissionForm ticketId={ticket.id} onSubmitted={(updated) => setTicket(updated)} />
            )}
          </div>
        )}

        {/* उत्तर पाठवण्यासाठी बॉक्स (Reply Box) */}
        <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-3">
          <label className="text-xs font-semibold text-slate-700 block">
            Reply to Ticket
          </label>
          <textarea
            rows={3}
            required
            placeholder="Type your message or response here..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed transition-all"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || !newReply.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
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
        <span className="text-xs text-slate-700 font-medium">Rate your experience:</span>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className={`text-lg transition-transform hover:scale-125 ${
                star <= rating ? 'text-amber-500' : 'text-slate-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-xs font-mono font-bold text-amber-800">({rating}/5)</span>
      </div>

      <input
        type="text"
        placeholder="Optional comments or suggestions..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
      />

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-all disabled:opacity-50 shadow-2xs"
      >
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  );
}
