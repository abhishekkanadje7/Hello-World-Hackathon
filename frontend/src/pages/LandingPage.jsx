// =============================================================================
// TriageX - Professional Modern Landing Page
// कमेंट: कॉर्पोरेट आणि स्वच्छ डिझाइनसह मुख्य लँडिंग पेज.
// यात कोणताही गडद किंवा एआय सारखा भडक लुक नाही, तर आधुनिक सॉस (SaaS) प्लॅटफॉर्मचा फिल आहे.
// =============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  HelpCircle
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  // इंटरअॅक्टिव्ह सिम्युलेटर इनपुट स्टेट्स
  const [demoText, setDemoText] = useState("URGENT! Production payment gateway is down and checkout is throwing 500 errors! Losing thousands of dollars every minute!");
  const [demoPlan, setDemoPlan] = useState("VIP");

  // रिअल-टाइम स्कोअर प्रिव्ह्यू गणती
  const isUrgent = demoText.toLowerCase().includes("urgent") || demoText.toLowerCase().includes("down");
  const isAngry = demoText.toLowerCase().includes("unacceptable") || demoText.includes("!") || demoText.toLowerCase().includes("losing");
  const frustScore = isAngry ? 88 : 25;
  const urgScore = isUrgent ? 92 : 20;
  const planScore = demoPlan === 'VIP' ? 100 : demoPlan === 'Premium' ? 60 : 20;
  const priorityScore = Math.round((frustScore * 0.4) + (urgScore * 0.4) + (planScore * 0.2));

  return (
    <div className="space-y-16 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-50">
      {/* 1. Hero Section */}
      <section className="text-center space-y-6 pt-6 pb-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <span>Enterprise Support Triage & SLA Dispatch Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Intelligent ticket routing. <br className="hidden sm:inline" />
          <span className="text-blue-600">
            The right issue, handled first.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Generic first-come, first-served queues make urgent and high-value customers wait. TriageX prioritizes tickets based on urgency, customer account value, and response time commitments.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {!user ? (
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>Sign In to Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to={user.role === 'admin' ? '/admin' : user.role === 'agent' ? '/agent' : '/customer/tickets'}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center space-x-2"
            >
              <span>Go to {user.role === 'admin' ? 'Admin Console' : user.role === 'agent' ? 'Agent Queue' : 'My Tickets'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </section>

      {/* 2. Interactive Live Scoring Simulator */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Priority Simulator
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">Interactive Ticket Prioritization Engine</h2>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500 font-medium">Customer Tier:</span>
            {['Regular', 'Premium', 'VIP'].map((tier) => (
              <button
                key={tier}
                onClick={() => setDemoPlan(tier)}
                className={`px-3 py-1 rounded-md font-semibold uppercase text-xs transition-all ${
                  demoPlan === tier 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <label className="text-xs font-semibold text-slate-700 block">
              Sample Customer Message (Type or modify):
            </label>
            <textarea
              rows={4}
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed font-sans shadow-2xs"
            />
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-400">Quick tests:</span>
              <button 
                onClick={() => setDemoText("URGENT! Production payment gateway is down and checkout is throwing 500 errors! Losing thousands of dollars every minute!")}
                className="text-blue-600 hover:underline font-medium"
              >
                • Production Outage
              </button>
              <button 
                onClick={() => setDemoText("How do I reset my account password? I forgot my login credentials.")}
                className="text-emerald-600 hover:underline font-medium"
              >
                • Password Reset
              </button>
              <button 
                onClick={() => setDemoText("Could you please provide the tax invoice for our last monthly subscription?")}
                className="text-purple-600 hover:underline font-medium"
              >
                • Tax Invoice
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-semibold">Priority Score</div>
                <div className="text-3xl font-extrabold text-slate-900 font-mono mt-0.5 flex items-baseline space-x-1">
                  <span className={priorityScore >= 70 ? 'text-red-600' : priorityScore >= 40 ? 'text-blue-600' : 'text-emerald-600'}>
                    {priorityScore}
                  </span>
                  <span className="text-slate-400 text-xs font-normal">/100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-semibold">Routing Tier</div>
                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase mt-1 ${
                  priorityScore >= 70 
                    ? 'bg-red-100 text-red-800 border border-red-200' 
                    : priorityScore >= 40 
                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {priorityScore >= 70 ? 'Critical' : priorityScore >= 40 ? 'Standard' : 'Routine'}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Sentiment Negativity:</span>
                <span className="font-mono font-bold text-slate-800">{frustScore}%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Urgency Keyword Weight:</span>
                <span className="font-mono font-bold text-slate-800">{urgScore}%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Target SLA Commitment:</span>
                <span className="font-mono font-bold text-blue-600">
                  {priorityScore >= 70 ? '15 Minutes' : priorityScore >= 40 ? '2 Hours' : '24 Hours'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
            01
          </div>
          <h3 className="text-base font-bold text-slate-900">Priority Scoring Engine</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Calculates composite priority based on detected urgency keywords, customer account tier, and historical SLA commitments.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
            02
          </div>
          <h3 className="text-base font-bold text-slate-900">Real-Time SLA Enforcement</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strict SLA countdown clocks with visual alerts before compliance breaches occur. Critical outages routed instantly to Senior staff.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
            03
          </div>
          <h3 className="text-base font-bold text-slate-900">Role-Based Access Control</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Full RBAC protection. Standard agents are restricted from claiming Critical tier tickets without escalation permissions.
          </p>
        </div>
      </section>

      {/* 4. Live Platform Highlights / Why TriageX */}
      <section className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10 shadow-sm space-y-6">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            Operational Reliability
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How TriageX Streamlines Support Operations
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Instead of routing tickets blindly by arrival time, TriageX applies real-time urgency analysis and revenue weighting to protect business-critical relationships.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
            <div className="text-2xl font-black font-mono text-blue-400">15 Min</div>
            <div className="text-xs font-bold text-white">Critical SLA Guarantee</div>
            <p className="text-[11px] text-slate-400">High-frustration outage tickets assigned to Senior Engineers immediately.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
            <div className="text-2xl font-black font-mono text-emerald-400">42%</div>
            <div className="text-xs font-bold text-white">Automated Deflection</div>
            <p className="text-[11px] text-slate-400">Routine FAQ queries answered and auto-resolved by Knowledge Base.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
            <div className="text-2xl font-black font-mono text-amber-400">99.4%</div>
            <div className="text-xs font-bold text-white">SLA Compliance Rate</div>
            <p className="text-[11px] text-slate-400">Real-time timers prevent tickets from languishing unattended.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
            <div className="text-2xl font-black font-mono text-purple-400">100%</div>
            <div className="text-xs font-bold text-white">Auditable Explainability</div>
            <p className="text-[11px] text-slate-400">Every routing decision displays point-by-point scoring factors.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
