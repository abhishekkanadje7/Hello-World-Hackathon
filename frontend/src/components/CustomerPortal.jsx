import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Flame, 
  Zap, 
  FileText, 
  Smile, 
  Frown, 
  Meh, 
  Building,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { createTicket, previewTicketScore } from '../api';

const DEMO_PRESETS = [
  {
    name: "🔥 Critical Enterprise Outage",
    badge: "Escalates to Senior Agent (Score ~95)",
    color: "border-rose-500/50 bg-rose-500/10 text-rose-300",
    customer_name: "Abhishek Kanadje (Apex Corp)",
    customer_email: "abhishek@apexcorp.com",
    plan_tier: "enterprise",
    channel: "email",
    category: "Outage",
    subject: "EMERGENCY: Production Checkout Down! Payment gateway 500 errors!",
    description: "Our entire customer checkout is down. Customers cannot pay and we are losing thousands of dollars every minute! This is unacceptable! Fix this immediately or we will cancel our enterprise contract today!!!"
  },
  {
    name: "💡 Routine Password Reset FAQ",
    badge: "Auto-Resolved by Knowledge Base (Score ~18)",
    color: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    customer_name: "Ravi Kumar",
    customer_email: "ravi.kumar@gmail.com",
    plan_tier: "free",
    channel: "web",
    category: "Account",
    subject: "How do I reset my password? Forgot credentials",
    description: "Hello, I cannot remember my password to log in. Where can I find the link to change or reset my account password? Thank you."
  },
  {
    name: "⚠️ Sarcastic Broken Feature Bug",
    badge: "Standard Agent Queue (Score ~65)",
    color: "border-amber-500/50 bg-amber-500/10 text-amber-300",
    customer_name: "Neha Kulkarni (Startuply)",
    customer_email: "neha@startuply.io",
    plan_tier: "pro",
    channel: "chat",
    category: "Technical",
    subject: "Great job, latest release broke all our automated reports",
    description: "Your latest update completely ruined our scheduled PDF reports. Fantastic work as usual. We really need this fixed today because our investors are asking for the metrics."
  },
  {
    name: "📄 Past Tax Invoice Request",
    badge: "Auto-Resolved by KB (Score ~22)",
    color: "border-blue-500/50 bg-blue-500/10 text-blue-300",
    customer_name: "Siddharth Joshi",
    customer_email: "siddharth@gmail.com",
    plan_tier: "pro",
    channel: "web",
    category: "Billing",
    subject: "Need past monthly tax invoice for accounting",
    description: "Hi support team, could you tell me where I can download the past tax invoices and payment receipts for our yearly filing? Thanks in advance!"
  }
];

export default function CustomerPortal({ currentUser, onTicketCreated, tickets = [] }) {
  const [formData, setFormData] = useState({
    customer_name: currentUser?.name || 'Abhishek Kanadje (Apex Corp)',
    customer_email: currentUser?.email || 'abhishek@apexcorp.com',
    plan_tier: currentUser?.plan_tier || 'enterprise',
    channel: 'web',
    category: 'Outage',
    subject: '',
    description: ''
  });

  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState(null);

  // Update form if user switches
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        customer_name: currentUser.name,
        customer_email: currentUser.email,
        plan_tier: currentUser.plan_tier || 'free'
      }));
    }
  }, [currentUser]);

  // Real-time sentiment preview debounced
  useEffect(() => {
    if (!formData.subject && !formData.description) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const p = await previewTicketScore({
          subject: formData.subject,
          description: formData.description,
          plan_tier: formData.plan_tier
        });
        setPreview(p);
      } catch (e) {
        console.error(e);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [formData.subject, formData.description, formData.plan_tier]);

  const loadPreset = (preset) => {
    setFormData({
      customer_name: preset.customer_name,
      customer_email: preset.customer_email,
      plan_tier: preset.plan_tier,
      channel: preset.channel,
      category: preset.category,
      subject: preset.subject,
      description: preset.description
    });
    setSuccessResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.description) return;
    setSubmitting(true);
    setError(null);
    try {
      const ticket = await createTicket(formData);
      setSuccessResult(ticket);
      if (onTicketCreated) onTicketCreated(ticket);
      // Reset form text
      setFormData(prev => ({ ...prev, subject: '', description: '' }));
      setPreview(null);
    } catch (err) {
      setError(err.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter tickets by current user or show recent
  const myTickets = tickets.filter(t => 
    t.customer_email?.toLowerCase() === formData.customer_email?.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>AI-Driven Predictive Triage System</span>
          </div>
          <h1 className="text-2xl font-black text-white">Customer Support & Dispatch Portal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Submit a query to experience real-time Natural Language Processing, Sentiment Analysis, and Instant Routing.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
          <Building className="w-4 h-4 text-indigo-400" />
          <span>Active Plan: <strong className="text-white uppercase font-mono">{formData.plan_tier}</strong></span>
        </div>
      </div>

      {/* ⚡ 1-Click Evaluation Presets for Judges */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>⚡ 1-Click Scenarios for Hackathon Judges</span>
          </label>
          <span className="text-[11px] text-slate-500">Click any preset to auto-fill realistic test cases</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(p)}
              className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between ${p.color}`}
            >
              <div>
                <div className="text-xs font-bold text-white mb-1 flex items-center justify-between">
                  <span>{p.name}</span>
                </div>
                <p className="text-[11px] text-slate-300 opacity-90 line-clamp-2">
                  "{p.subject}"
                </p>
              </div>
              <div className="mt-2 text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-black/40 border border-white/10 w-fit">
                {p.badge}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form on Left, Live AI Analyzer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Ticket Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Submit Support Ticket</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">Channel: Web / REST API</span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Customer / Organization Name</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Plan Tier & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Account Plan Tier</label>
                <select
                  value={formData.plan_tier}
                  onChange={(e) => setFormData({ ...formData, plan_tier: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="enterprise">Enterprise (VIP - 100pts)</option>
                  <option value="pro">Pro Plan (60pts)</option>
                  <option value="free">Free Tier (20pts)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Outage">Critical Outage</option>
                  <option value="Billing">Billing & Payment</option>
                  <option value="Technical">Technical Bug</option>
                  <option value="Account">Account Access</option>
                  <option value="General">General Inquiry</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Channel</label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="web">Web Portal Form</option>
                  <option value="email">Email Ingestion</option>
                  <option value="chat">Live Chat Ingest</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Subject / Issue Summary</label>
              <input
                type="text"
                required
                placeholder="e.g. Critical outage on production API..."
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            {/* Description with Typing Listener */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">Detailed Description</label>
                <span className="text-[11px] text-indigo-400 font-mono animate-pulse">
                  ● NLP Engine Listening Live
                </span>
              </div>
              <textarea
                required
                rows={5}
                placeholder="Describe your issue in detail. Try words like 'urgent', 'crashed', 'payment failed' or paste an angry message to see the priority meter jump..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-normal leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !formData.subject || !formData.description}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-40"
            >
              {submitting ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing NLP & Routing...</span>
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Ticket & Dispatch to Queue</span>
                </>
              )}
            </button>
          </form>

          {/* Success Result Card */}
          {successResult && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Ticket Created: {successResult.ticket_number}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                  successResult.priority_score >= 70 ? 'bg-rose-500 text-white animate-pulse' :
                  successResult.priority_score >= 40 ? 'bg-amber-500 text-slate-900' : 'bg-emerald-500 text-white'
                }`}>
                  Priority {successResult.priority_score}/100
                </span>
              </div>
              <p className="text-xs text-slate-300">
                <strong>Assigned Tier:</strong> <span className="text-indigo-300 font-semibold">{successResult.assigned_tier}</span>
                {successResult.assigned_agent && ` (${successResult.assigned_agent})`}
              </p>
              <div className="text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <strong>AI Routing Rationale:</strong> {successResult.routing_reason}
              </div>
              {successResult.kb_auto_reply && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Instant Knowledge Base Auto-Resolution</span>
                  </div>
                  <p>Matched FAQ: <em>{successResult.kb_auto_reply.title}</em> ({Math.round(successResult.kb_auto_reply.confidence * 100)}% match)</p>
                  <p className="text-slate-300 opacity-90 text-[11px] mt-1">{successResult.kb_auto_reply.snippet}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Real-Time AI Sentiment & Scoring Radar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live NLP Preview Radar</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono font-semibold border border-indigo-500/20">
                Zero-Latency
              </span>
            </div>

            {preview ? (
              <div className="space-y-4">
                {/* Score Big Meter */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Predicted Priority Score</div>
                    <div className="text-3xl font-black text-white font-mono mt-0.5 flex items-baseline space-x-1">
                      <span className={
                        preview.priority_score >= 70 ? 'text-rose-400' :
                        preview.priority_score >= 40 ? 'text-amber-400' : 'text-emerald-400'
                      }>
                        {preview.priority_score}
                      </span>
                      <span className="text-slate-500 text-sm font-normal">/ 100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Predicted Route</div>
                    <span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-lg font-bold ${
                      preview.predicted_tier === 'Senior Agent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' :
                      preview.predicted_tier === 'Standard Agent' ? 'bg-amber-400 text-slate-900 font-bold' :
                      'bg-emerald-500 text-white font-bold'
                    }`}>
                      {preview.predicted_tier}
                    </span>
                  </div>
                </div>

                {/* Meter Bars */}
                <div className="space-y-3 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
                  {/* Frustration */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>Frustration & Anger (40%):</span>
                      </span>
                      <span className="font-mono font-bold text-rose-400">{preview.frustration_score}/100</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-300"
                        style={{ width: `${preview.frustration_score}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                      <span>VADER Polarity: {preview.sentiment_compound}</span>
                      <span>{preview.frustration_score > 60 ? 'Severe Negative Tone' : preview.frustration_score > 30 ? 'Neutral / Concerned' : 'Calm / Polite'}</span>
                    </div>
                  </div>

                  {/* Urgency */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Urgency & Outage Impact (40%):</span>
                      </span>
                      <span className="font-mono font-bold text-amber-400">{preview.urgency_score}/100</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-amber-500 h-full transition-all duration-300"
                        style={{ width: `${preview.urgency_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Customer Plan */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Building className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Account Tier Value (20%):</span>
                      </span>
                      <span className="font-mono font-bold text-indigo-400 capitalize">
                        {formData.plan_tier} ({formData.plan_tier === 'enterprise' ? 100 : formData.plan_tier === 'pro' ? 60 : 20} pts)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Keywords Tags */}
                {preview.keywords && preview.keywords.length > 0 && (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Detected NLP Triggers:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {preview.keywords.map((kw, idx) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ Auto-match detected */}
                {preview.kb_match && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                    <div className="font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Instant KB FAQ Match Detected!</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      "{preview.kb_match.title}" will resolve this ticket immediately without human delay.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center space-y-2 text-slate-500">
                <Smile className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">Type in the form or select a demo preset above to see the real-time NLP analysis breakdown.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer's My Tickets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>My Active Support Tickets</span>
            </h3>
            <p className="text-xs text-slate-400">Live status updates synced over WebSocket</p>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
            {myTickets.length} Tickets
          </span>
        </div>

        {myTickets.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No tickets submitted yet for {formData.customer_email}. Use the form above to submit your first ticket!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Routing Tier</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned Handler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {myTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-400">{t.ticket_number}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white truncate max-w-xs">{t.subject}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{t.description}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        t.priority_score >= 70 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        t.priority_score >= 40 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {t.priority_score}/100
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-200">{t.assigned_tier}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        t.status === 'Escalated' ? 'bg-rose-500 text-white' :
                        t.status === 'In Progress' ? 'bg-amber-400 text-slate-900' :
                        t.status === 'Auto-Resolved' ? 'bg-emerald-500 text-white' :
                        t.status === 'Resolved' ? 'bg-slate-700 text-slate-300' :
                        'bg-indigo-600 text-white'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{t.assigned_agent || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
