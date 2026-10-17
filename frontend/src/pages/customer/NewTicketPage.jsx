import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createTicket } from '../../api';
import { 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  AlertTriangle, 
  Building, 
  Bot, 
  RefreshCw,
  ArrowRight,
  ListOrdered
} from 'lucide-react';

const EXAMPLES = [
  {
    label: "🔥 Critical Outage",
    subject: "Production Payment API Down! Losing thousands per minute!",
    description: "Our live checkout is completely broken. Customers are getting 500 error when submitting payments. This is unacceptable! Fix this immediately or we will terminate our contract today!!!"
  },
  {
    label: "💡 Routine Password Reset FAQ",
    subject: "How do I reset my account password?",
    description: "Hello, I cannot remember my login password and need to reset it. Where do I click to reset my password? Thank you."
  },
  {
    label: "⚠️ Billing Question",
    subject: "Need tax invoice receipt for last month's payment",
    description: "Hi team, could you please share the invoice receipt with GST number included for our auditing? Thank you!"
  }
];

export default function NewTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const charCount = description.length;

  const handleFillExample = (ex) => {
    setSubject(ex.subject);
    setDescription(ex.description);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const ticket = await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        channel: 'web',
        category: 'Support'
      });
      setResult(ticket);
    } catch (err) {
      setError(err.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">Create Support Ticket</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as <strong className="text-white">{user?.name}</strong> • Account Tier: <strong className="text-blue-400 uppercase font-mono">{user?.customer_type || 'Regular'}</strong>
          </p>
        </div>
        <Link
          to="/customer/tickets"
          className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors w-fit"
        >
          <ListOrdered className="w-4 h-4" />
          <span>View My Tickets</span>
        </Link>
      </div>

      {/* 3 Fill Example Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Example Scenarios (Click to test):</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EXAMPLES.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleFillExample(ex)}
              className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-2xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                {ex.label}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                "{ex.subject}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Result Card after submit */}
      {result ? (
        <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Ticket Submitted Successfully!</h3>
                <div className="text-xs font-mono text-blue-400">ID: {result.ticket_number}</div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              result.assigned_tier === 'Critical' ? 'bg-rose-500 text-white animate-pulse' :
              result.assigned_tier === 'Standard' ? 'bg-amber-400 text-slate-950 font-black' :
              'bg-emerald-500 text-white'
            }`}>
              {result.assigned_tier} Tier • Score {result.priority_score}/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-semibold uppercase">AI Routing Decision</div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {result.routing_reason}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-semibold uppercase">SLA Commitment</div>
              <p className="text-xs text-slate-200 leading-relaxed font-mono">
                Response Target: <strong>{new Date(result.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> ({result.assigned_tier === 'Critical' ? '15m' : result.assigned_tier === 'Standard' ? '2h' : '24h'} SLA)
              </p>
            </div>
          </div>

          {result.kb_auto_reply && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-5 rounded-2xl space-y-2 text-emerald-300 text-xs">
              <div className="flex items-center space-x-2 font-bold text-emerald-400">
                <Bot className="w-4 h-4" />
                <span>Instant Knowledge Base Auto-Resolution</span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                {result.kb_auto_reply.snippet}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={() => {
                setResult(null);
                setSubject('');
                setDescription('');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              Submit Another Ticket
            </button>
            <Link
              to={`/customer/tickets/${result.id}`}
              className="px-5 py-2 bg-[#0070C0] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
            >
              <span>Open Ticket Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Ticket Form with Subject & Description only */
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Subject / Summary</label>
            <input
              type="text"
              required
              placeholder="Brief summary of your issue..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0070C0]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Message / Issue Details</label>
              <span className="text-[11px] font-mono text-slate-500">
                {charCount} characters
              </span>
            </div>
            <textarea
              required
              rows={6}
              placeholder="Describe what happened in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0070C0] leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !subject.trim() || !description.trim()}
            className="w-full py-3 bg-[#0070C0] hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing NLP & Dispatching...</span>
              </div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Ticket</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
