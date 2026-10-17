// =============================================================================
// TriageX - Professional Modern Landing Page
// कमेंट: कॉर्पोरेट आणि स्वच्छ डिझाइनसह मुख्य लँडिंग पेज.
// यात कोणताही गडद किंवा एआय सारखा भडक लुक नाही, तर आधुनिक सॉस (SaaS) प्लॅटफॉर्मचा फिल आहे.
// =============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Next-Generation Predictive Support Triage & Sentiment Router</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Intelligent ticket routing. <br className="hidden sm:inline" />
          <span className="text-blue-600">
            The right issue, handled first.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Generic first-come, first-served queues make angry and high-value customers wait. TriageX uses real-time NLP sentiment analysis, urgency detection, and account value to instantly route critical issues to senior engineers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/register"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2"
          >
            <span>Register as Customer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-300 shadow-2xs transition-all flex items-center justify-center space-x-2"
          >
            <span>Admin Sign In</span>
          </Link>
        </div>
      </section>

      {/* 2. Interactive Live Scoring Simulator */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Interactive Live Scoring Simulator</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">Experience the TriageX Prioritization Engine</h2>
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Predictive NLP Scoring</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Calculates composite priority based on VADER emotional sentiment, urgency keywords, customer ARR value, and churn indicators.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Real-Time SLA Enforcement</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strict SLA countdown clocks with visual alerts before compliance breaches occur. Critical outages routed instantly to Senior on-call staff.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Role-Based Security</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Full RBAC protection. Standard agents are restricted from claiming Critical tier tickets without escalation permissions. Internal notes kept confidential.
          </p>
        </div>
      </section>
    </div>
  );
}
