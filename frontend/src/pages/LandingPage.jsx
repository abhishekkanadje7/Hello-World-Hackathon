// =============================================================================
// TriageX - Premium Enterprise Landing Page & Live AI Triage Experience
// कमेंट: अत्यंत आधुनिक, कॉर्पोरेट आणि प्रभावी लँडिंग पेज.
// लाइव्ह कॉग्निटिव्ह एआय सिम्युलेटर, भाषा समज (मराठी/इंग्रजी), 
// रियल-टाइम एसएलए काउंटडाउन आणि ॲडमिन/एजंट क्रेडेंशियल्ससह सुसज्ज.
// =============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { calculateClientPriority } from '../mockEngine';
import { 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Layers, 
  Clock, 
  Building, 
  Bot,
  MessageSquare,
  Sliders,
  CheckCircle,
  AlertCircle,
  Database,
  Cpu,
  Lock,
  Globe,
  Flame,
  FileCheck2,
  Users
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  
  // इंटरअॅक्टिव्ह सिम्युलेटर इनपुट स्टेट्स
  const [demoText, setDemoText] = useState("URGENT! Production payment gateway is down and checkout is throwing 500 errors! Losing thousands of dollars every minute!");
  const [demoPlan, setDemoPlan] = useState("VIP");

  // थेट कॉग्निटिव्ह एआय इंजिनद्वारे रियल-टाइम मोजणी
  const aiResult = calculateClientPriority("Customer Inquiry", demoText, demoPlan);
  const { total_priority_score, assigned_tier, metrics, diagnosis, suggested_solution, sla_minutes } = aiResult;

  return (
    <div className="space-y-20 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-50">
      
      {/* 1. Hero Section with Live Badges */}
      <section className="text-center space-y-6 pt-4 pb-2">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 text-blue-700 text-xs font-semibold border border-blue-200/60 shadow-xs">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Hello World 2026 / SIH PS 4</span>
          <span className="text-blue-300">•</span>
          <span>Cognitive AI Routing Engine</span>
          <span className="text-blue-300">•</span>
          <span className="text-emerald-700 font-bold">Cloud PostgreSQL Active</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-5xl mx-auto leading-tight">
          Next-Gen Support Triage. <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500">
            Critical issues resolved first.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Traditional FIFO ticket queues make high-priority, revenue-impacting customers wait in line. 
          TriageX uses autonomous <strong>Cognitive Semantic AI</strong> to analyze true technical severity, sentiment distress, and financial risk in milliseconds.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
          {!user ? (
            <>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all flex items-center justify-center space-x-2 active:scale-98"
              >
                <span>Register as Customer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold text-sm shadow-2xs hover:border-slate-400 transition-all flex items-center justify-center space-x-2"
              >
                <span>Staff & Customer Sign In</span>
              </Link>
            </>
          ) : (
            <Link
              to={user.role === 'admin' ? '/admin' : user.role === 'agent' ? '/agent' : '/customer/tickets'}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <span>Go to {user.role === 'admin' ? 'Admin Portal' : user.role === 'agent' ? 'Agent Dispatch Queue' : 'My Support Tickets'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Live System Metric Badges */}
        <div className="pt-4 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>15-Minute Critical SLA</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Bilingual (English + मराठी / Hinglish)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Database className="w-4 h-4 text-purple-500" />
            <span>Zero-Loss Cloud PostgreSQL</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Lock className="w-4 h-4 text-slate-600" />
            <span>RBAC Protected Metrics</span>
          </div>
        </div>
      </section>

      {/* 2. Interactive Live Cognitive AI Simulator */}
      <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-lg shadow-slate-200/40 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>Interactive AI Simulator</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Autonomous Cognitive Triage Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Type any support message (or try Marathi/Hinglish) to see how the AI detects outage, revenue risk, and emotion instantly.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-semibold px-2">Account Tier:</span>
            {['Regular', 'Premium', 'VIP'].map((tier) => (
              <button
                key={tier}
                onClick={() => setDemoPlan(tier)}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase text-xs transition-all ${
                  demoPlan === tier 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input column */}
          <div className="lg:col-span-7 space-y-4">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Customer Inquiry Description:</span>
              <span className="text-[11px] text-slate-400 font-normal">Real-time NLP parsing</span>
            </label>
            <textarea
              rows={4}
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              placeholder="e.g. Production server crashed or payment failed..."
              className="w-full p-4 bg-slate-50/50 border border-slate-300 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed font-sans shadow-2xs transition-all"
            />

            {/* Quick Test Scenarios with Marathi included */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Instant Test Scenarios (Click to test):
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button 
                  onClick={() => setDemoText("URGENT! Production payment gateway is down and checkout is throwing 500 errors! Losing thousands of dollars every minute!")}
                  className="px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/80 rounded-lg font-medium transition-all"
                >
                  🔥 P1 Production Outage
                </button>
                <button 
                  onClick={() => setDemoText("Amcha server band padla aahe ani client che payment double deduct zale! Please help immediately!")}
                  className="px-2.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80 rounded-lg font-medium transition-all"
                >
                  🇮🇳 Marathi / Hinglish Outage
                </button>
                <button 
                  onClick={() => setDemoText("I cannot log into my account. It says 2FA token expired and my account is locked out.")}
                  className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 rounded-lg font-medium transition-all"
                >
                  🔐 Security & Lockout
                </button>
                <button 
                  onClick={() => setDemoText("Could you please share the invoice receipt and update our billing company address?")}
                  className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg font-medium transition-all"
                >
                  📄 Routine Billing FAQ
                </button>
              </div>
            </div>
          </div>

          {/* AI Result Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl space-y-5 border border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Composite Priority Score</div>
                <div className="text-4xl font-black font-mono mt-1 flex items-baseline space-x-1">
                  <span className={total_priority_score >= 70 ? 'text-red-400' : total_priority_score >= 40 ? 'text-blue-400' : 'text-emerald-400'}>
                    {total_priority_score}
                  </span>
                  <span className="text-slate-500 text-sm font-normal">/100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Tier</div>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-extrabold uppercase mt-1 tracking-wider ${
                  assigned_tier === 'Critical' 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-xs' 
                    : assigned_tier === 'Standard' 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                }`}>
                  {assigned_tier} Tier
                </span>
              </div>
            </div>

            {/* Breakdown Sub-metrics */}
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Technical Urgency & Outage:</span>
                <span className="font-mono font-bold text-white">{metrics.urgency_score} / 100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Emotional Distress / Frustration:</span>
                <span className="font-mono font-bold text-white">{metrics.sentiment_score} / 100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Value Baseline:</span>
                <span className="font-mono font-bold text-white">{metrics.customer_tier_score} / 100</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-700/80">
                <span className="text-slate-400 font-semibold">Strict SLA Resolution Target:</span>
                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                  assigned_tier === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
                }`}>
                  {sla_minutes <= 15 ? '⏱️ 15 Minutes (Senior SRE)' : sla_minutes <= 120 ? '⏱️ 2 Hours (Standard Support)' : '⏱️ 24 Hours (Routine Queue)'}
                </span>
              </div>
            </div>

            {/* AI Diagnosis & Suggested Draft */}
            <div className="pt-3 border-t border-slate-700/80 space-y-2">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Bot className="w-3.5 h-3.5" />
                <span>AI Problem Diagnosis</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans bg-white/5 p-2.5 rounded-lg border border-white/10">
                {diagnosis}
              </p>

              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5 pt-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready-to-Send Agent Solution Draft</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-white/5 p-2.5 rounded-lg border border-white/10 italic">
                "{suggested_solution}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Architectural Pillars */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Enterprise Architecture</div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Engineered for Maximum Reliability & Scale
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Replacing slow manual sorting with an automated, auditable, and resilient support infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm space-y-3.5 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
              <Cpu className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Cognitive Intent Recognition</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Understands multi-tier system outages, payment deductions, and account lockouts without depending on external rate-limited APIs.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm space-y-3.5 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Zero-Loss Cloud PostgreSQL</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Integrated with persistent Cloud PostgreSQL. Even if the free Render container sleeps, all tickets, users, and audit logs remain permanently preserved.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm space-y-3.5 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Strict SLA & Role Protection</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time countdown clocks prevent SLA breaches. Internal priority scores and diagnostic metrics remain strictly hidden from customers.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Credentials & Quick Access Callout */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Evaluation & Hackathon Access</div>
            <h3 className="text-2xl font-black tracking-tight">Ready to test the live platform?</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Use the authenticated Administrator account to inspect real-time telemetry, test SLA dispatch queues, and calibrate NLP weights.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl space-y-3 text-xs min-w-[280px]">
            <div className="font-bold text-white border-b border-white/10 pb-2 flex items-center justify-between">
              <span>Admin Credentials</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700">Pre-Configured</span>
            </div>
            <div className="space-y-1 font-mono">
              <div className="text-slate-300">Email: <span className="text-cyan-300 select-all font-bold">abhishekkanadje7@gmail.com</span></div>
              <div className="text-slate-300">Password: <span className="text-cyan-300 select-all font-bold">Abhi*2007...</span></div>
            </div>
            <Link
              to="/login"
              className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md"
            >
              <span>Sign In as Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
