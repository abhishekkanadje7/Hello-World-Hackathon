import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Flame, 
  AlertTriangle, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Layers, 
  Clock, 
  Building, 
  Bot,
  MessageSquare
} from 'lucide-react';

export default function LandingPage() {
  const [demoText, setDemoText] = useState("URGENT! Production payment gateway is down and checkout is throwing 500 errors! Losing thousands of dollars every minute!");
  const [demoPlan, setDemoPlan] = useState("VIP");

  // Approximate live preview calculation
  const isUrgent = demoText.toLowerCase().includes("urgent") || demoText.toLowerCase().includes("down");
  const isAngry = demoText.toLowerCase().includes("unacceptable") || demoText.includes("!") || demoText.toLowerCase().includes("losing");
  const frustScore = isAngry ? 88 : 25;
  const urgScore = isUrgent ? 92 : 20;
  const planScore = demoPlan === 'VIP' ? 100 : demoPlan === 'Premium' ? 60 : 20;
  const priorityScore = Math.round((frustScore * 0.4) + (urgScore * 0.4) + (planScore * 0.2));

  return (
    <div className="space-y-20 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-6 pb-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Next-Generation AI Customer Experience Automation</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Smarter support. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            The right ticket, handled first.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Generic first-come, first-served queues make angry and high-value customers wait. TriageX uses real-time NLP sentiment analysis, urgency detection, and account value to instantly route critical issues to senior engineers while auto-resolving routine queries.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0070C0] hover:bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
          >
            <span>Create Customer Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-all flex items-center justify-center space-x-2"
          >
            <span>Sign In to Platform</span>
          </Link>
        </div>
      </section>

      {/* Interactive Live-Looking Demo Score Card */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Interactive Live Scoring Simulator</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">Experience the TriageX Prioritization Engine</h2>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Account Tier:</span>
            {['Regular', 'Premium', 'VIP'].map((tier) => (
              <button
                key={tier}
                onClick={() => setDemoPlan(tier)}
                className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${
                  demoPlan === tier 
                    ? 'bg-[#0070C0] text-white shadow-md' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <label className="text-xs font-semibold text-slate-400 block">
              Sample Customer Message (Type or modify):
            </label>
            <textarea
              rows={4}
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
            />
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-500">Quick tests:</span>
              <button 
                onClick={() => setDemoText("URGENT! Production payment gateway is down and checkout is throwing 500 errors! Losing thousands of dollars every minute!")}
                className="text-blue-400 hover:underline"
              >
                • Production Outage
              </button>
              <button 
                onClick={() => setDemoText("How do I reset my account password? I forgot my login credentials.")}
                className="text-emerald-400 hover:underline"
              >
                • Password Reset
              </button>
              <button 
                onClick={() => setDemoText("Could you please provide the tax invoice for our last monthly subscription?")}
                className="text-purple-400 hover:underline"
              >
                • Tax Invoice
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800/90 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-semibold">Priority Score</div>
                <div className="text-4xl font-black text-white font-mono mt-0.5 flex items-baseline space-x-1">
                  <span className={priorityScore >= 70 ? 'text-rose-400' : priorityScore >= 40 ? 'text-amber-400' : 'text-emerald-400'}>
                    {priorityScore}
                  </span>
                  <span className="text-slate-500 text-sm font-normal">/100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Assigned Tier</div>
                <span className={`inline-block mt-1 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide ${
                  priorityScore >= 70 ? 'bg-rose-500 text-white animate-pulse' :
                  priorityScore >= 40 ? 'bg-amber-400 text-slate-950 font-black' :
                  'bg-emerald-500 text-white'
                }`}>
                  {priorityScore >= 70 ? 'Critical (Senior)' : priorityScore >= 40 ? 'Standard Agent' : 'Routine (KB Auto)'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-900 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Frustration (40%):</span>
                </span>
                <span className="font-mono text-rose-400 font-bold">{frustScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Urgency (40%):</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">{urgScore}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-blue-400" />
                  <span>Customer Tier (20%):</span>
                </span>
                <span className="font-mono text-blue-400 font-bold">{demoPlan} ({planScore} pts)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Feature Cards */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Three Intelligent Pillars</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Traditional tools treat every ticket the same. TriageX combines deep emotional NLP with operational impact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-blue-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Sentiment-Aware Triage</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              VADER NLP models read customer frustration, detect hostile vocabulary, all-caps shouting, and exclamation patterns. Angry customers bypass the queue before they churn.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-blue-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Real-Time Urgency Detection</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Syntactic regex categorizes production outages, database corruptions, failed payments, and strict business deadlines to differentiate real emergencies from simple questions.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-blue-500/40 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Explainable Routing (XAI)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No black-box decisions. Support agents see the exact breakdown of why a ticket jumped to #1, including matched trigger keywords and customer plan weighting.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step How It Works */}
      <section className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">How TriageX Works</h2>
          <p className="text-sm text-slate-400">From incoming query to resolved customer in milliseconds</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="text-3xl font-black font-mono text-blue-500">01</div>
            <h4 className="text-sm font-bold text-white">Ingest Ticket</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Customer submits query via web portal, email, or chat API. User tier is verified from account profile.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-black font-mono text-indigo-400">02</div>
            <h4 className="text-sm font-bold text-white">NLP & Sentiment</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              VADER evaluates polarity and emotion. Intent filters check for known FAQ patterns in the knowledge base.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-black font-mono text-purple-400">03</div>
            <h4 className="text-sm font-bold text-white">Score & SLA Calculation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Weighted formula assigns Priority (0–100) and binds SLA deadline (15m for Critical, 2h for Standard, 24h for Routine).
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-black font-mono text-emerald-400">04</div>
            <h4 className="text-sm font-bold text-white">Auto-Routing</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Critical issues escalate to Senior Engineers via WebSockets. Routine FAQs are resolved automatically in 0 seconds.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
