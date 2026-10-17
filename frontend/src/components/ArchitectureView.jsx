import React from 'react';
import { 
  Cpu, 
  Layers, 
  Database, 
  Radio, 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  AlertTriangle, 
  Building, 
  Bot, 
  CheckCircle2,
  Code2,
  Zap,
  Globe
} from 'lucide-react';

export default function ArchitectureView() {
  const steps = [
    {
      num: "01",
      title: "Intake Ingestion",
      icon: <Globe className="w-5 h-5 text-indigo-400" />,
      desc: "Tickets arrive from Web form, Email ingest, or Chat via FastAPI REST endpoints.",
      tech: "FastAPI • Pydantic • JSON"
    },
    {
      num: "02",
      title: "NLP & Sentiment Scoring",
      icon: <Flame className="w-5 h-5 text-rose-400" />,
      desc: "VADER calculates compound polarity; regex detects exclamation shouting and anger triggers.",
      tech: "VADER Sentiment • NLTK Lexicon"
    },
    {
      num: "03",
      title: "Urgency & Intent Extraction",
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      desc: "Semantic regex detects outages ('down', 'crash'), double-charges, and immediate deadlines.",
      tech: "Intent Matcher • Keyword Boosters"
    },
    {
      num: "04",
      title: "Customer Value Lookup",
      icon: <Building className="w-5 h-5 text-blue-400" />,
      desc: "Account database lookup: Enterprise (100 pts), Pro (60 pts), Free tier (20 pts).",
      tech: "SQLite • CRM Lookup Map"
    },
    {
      num: "05",
      title: "Weighted Priority Engine",
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      desc: "Calculates Priority = (Frustration × 0.4) + (Urgency × 0.4) + (Value × 0.2).",
      tech: "Dynamic Weights • Explainable AI"
    },
    {
      num: "06",
      title: "Smart Routing & WebSockets",
      icon: <Radio className="w-5 h-5 text-emerald-400" />,
      desc: "Assigns to Senior Agent, Standard Agent, or KB Auto-reply; broadcasts live over WebSockets.",
      tech: "FastAPI WebSockets • React Live State"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 mb-2">
          <Cpu className="w-3.5 h-3.5" />
          <span>Technical Architecture & Data Pipeline</span>
        </div>
        <h1 className="text-2xl font-black text-white">End-to-End System Architecture</h1>
        <p className="text-sm text-slate-400 mt-1">
          How TriageX processes incoming customer support queries in milliseconds to deliver explainable, priority-driven routing.
        </p>
      </div>

      {/* Interactive Pipeline Step Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Data Ingestion & Decision Pipeline Flow</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((st, idx) => (
            <div 
              key={idx}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl shadow-lg space-y-3 transition-all hover:scale-[1.01] relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-black text-slate-700 group-hover:text-indigo-500/40 transition-colors">
                  {st.num}
                </span>
                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                  {st.icon}
                </div>
              </div>
              <h3 className="text-base font-bold text-white">{st.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {st.tech}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-400 text-sm font-bold">
            <Code2 className="w-4 h-4" />
            <span>Frontend Tier</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              <span><strong>React 18 + Vite:</strong> Ultra-fast zero-latency UI rendering</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              <span><strong>Tailwind CSS:</strong> Enterprise dark theme with glowing urgency states</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              <span><strong>Native WebSockets:</strong> Live queue updates without manual page refreshes</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 text-sm font-bold">
            <Cpu className="w-4 h-4" />
            <span>Backend & AI Engine</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span><strong>Python FastAPI:</strong> Async high-throughput REST and WebSocket server</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span><strong>VADER NLP:</strong> Valence Aware Dictionary for sentiment and frustration</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span><strong>Explainable AI (XAI):</strong> Transparent point-by-point scoring breakdown</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 text-sm font-bold">
            <Database className="w-4 h-4" />
            <span>Data & Automation</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span><strong>SQLite Database:</strong> Persistent tickets, audit logs, and agent profiles</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span><strong>Knowledge Base Matcher:</strong> Zero-touch auto-deflection for routine FAQs</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span><strong>Dynamic Recalculation:</strong> Live queue re-ordering when weights are tuned</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
