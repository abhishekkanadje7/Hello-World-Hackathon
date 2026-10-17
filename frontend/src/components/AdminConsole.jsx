import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Activity, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  ShieldAlert, 
  Database, 
  Cpu, 
  Layers, 
  HelpCircle, 
  TrendingUp, 
  Users, 
  Bot,
  Zap,
  BarChart3
} from 'lucide-react';
import { fetchWeights, updateWeights, fetchStats, fetchAuditLogs, fetchKbArticles } from '../api';

export default function AdminConsole({ onWeightsRecalculated }) {
  const [weights, setWeights] = useState({
    frustration_weight: 0.40,
    urgency_weight: 0.40,
    customer_value_weight: 0.20,
    critical_threshold: 70,
    standard_threshold: 40
  });

  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [kbArticles, setKbArticles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);

  const loadData = async () => {
    try {
      const [w, s, logs, kb] = await Promise.all([
        fetchWeights(),
        fetchStats(),
        fetchAuditLogs(),
        fetchKbArticles()
      ]);
      setWeights(w);
      setStats(s);
      setAuditLogs(logs);
      setKbArticles(kb);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWeightChange = (key, val) => {
    setWeights(prev => ({ ...prev, [key]: parseFloat(val) }));
    setSaveSuccess(null);
  };

  const handleSaveAndRecalculate = async () => {
    setSaving(true);
    setSaveSuccess(null);
    try {
      const res = await updateWeights(weights);
      setSaveSuccess(res.message);
      if (onWeightsRecalculated) onWeightsRecalculated();
      // Reload stats and logs
      const [s, logs] = await Promise.all([fetchStats(), fetchAuditLogs()]);
      setStats(s);
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setWeights({
      frustration_weight: 0.40,
      urgency_weight: 0.40,
      customer_value_weight: 0.20,
      critical_threshold: 70,
      standard_threshold: 40
    });
  };

  const totalWeightPercent = Math.round((weights.frustration_weight + weights.urgency_weight + weights.customer_value_weight) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold border border-purple-500/20 mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Control Center & Algorithm Tuning</span>
          </div>
          <h1 className="text-2xl font-black text-white">System Administration & Triage Weights</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure mathematical scoring weights, inspect executive analytics, and audit real-time dispatch decisions.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={resetDefaults}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSaveAndRecalculate}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Recalculating...' : 'Apply & Recalculate Live Queue'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Analytics KPI Ribbon */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
            <div className="text-xs text-slate-400 font-semibold">VIP Churn Risk Prevented</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1 flex items-baseline space-x-1">
              <span>{stats.churn_risk_mitigated_vip}</span>
              <span className="text-xs text-slate-500 font-normal">Enterprise Accounts</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Critical tickets resolved under SLA</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
            <div className="text-xs text-slate-400 font-semibold">AI KB Deflection Rate</div>
            <div className="text-2xl font-black text-indigo-400 font-mono mt-1">
              {stats.kb_deflection_rate_percentage}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{stats.auto_resolved_count} of {stats.total_tickets} tickets automated</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
            <div className="text-xs text-slate-400 font-semibold">Average Priority Score</div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {stats.average_priority_score} <span className="text-sm font-normal text-slate-500">/ 100</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Normalized across all channels</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
            <div className="text-xs text-slate-400 font-semibold">Avg First Response Time</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {stats.avg_first_response_minutes} <span className="text-sm font-normal text-slate-500">mins</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">82% faster than FIFO queue</div>
          </div>
        </div>
      )}

      {/* Main Algorithm Configurator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Weight Tuning Sliders */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>Priority Formula Weight Configurator</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Priority = (Frustration × W₁) + (Urgency × W₂) + (Customer Value × W₃)
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold ${
              totalWeightPercent === 100 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              Total: {totalWeightPercent}%
            </span>
          </div>

          <div className="space-y-6">
            {/* Frustration Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-white flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span>W₁: Frustration & Sentiment Weight</span>
                </label>
                <span className="font-mono text-rose-400 font-bold text-sm">
                  {Math.round(weights.frustration_weight * 100)}% ({weights.frustration_weight.toFixed(2)})
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.frustration_weight}
                onChange={(e) => handleWeightChange('frustration_weight', e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <p className="text-[11px] text-slate-400">
                Calculated via VADER Sentiment NLP + Hostility keyword boosters + exclamation/shouting detectors.
              </p>
            </div>

            {/* Urgency Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-white flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                  <span>W₂: Urgency & Intent Weight</span>
                </label>
                <span className="font-mono text-amber-400 font-bold text-sm">
                  {Math.round(weights.urgency_weight * 100)}% ({weights.urgency_weight.toFixed(2)})
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.urgency_weight}
                onChange={(e) => handleWeightChange('urgency_weight', e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <p className="text-[11px] text-slate-400">
                Flags outage triggers ('down', 'crash', 'data loss'), financial blocks ('double charged'), and deadlines.
              </p>
            </div>

            {/* Customer Value Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-white flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
                  <span>W₃: Customer Plan Tier Value Weight</span>
                </label>
                <span className="font-mono text-indigo-400 font-bold text-sm">
                  {Math.round(weights.customer_value_weight * 100)}% ({weights.customer_value_weight.toFixed(2)})
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={weights.customer_value_weight}
                onChange={(e) => handleWeightChange('customer_value_weight', e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                Enterprise (100 pts), Pro Plan (60 pts), Free Plan (20 pts).
              </p>
            </div>

            <div className="border-t border-slate-800 pt-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Routing Decision Thresholds</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Senior Escalation Threshold (≥ Score)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="95"
                    value={weights.critical_threshold}
                    onChange={(e) => handleWeightChange('critical_threshold', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono font-bold text-rose-400"
                  />
                  <span className="text-[10px] text-slate-500">Tickets scoring above this immediately jump the queue</span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Standard Agent Threshold (≥ Score)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="60"
                    value={weights.standard_threshold}
                    onChange={(e) => handleWeightChange('standard_threshold', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono font-bold text-amber-400"
                  />
                  <span className="text-[10px] text-slate-500">Below this, matched FAQs are auto-resolved by KB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-time Audit Trail & Knowledge Base */}
        <div className="lg:col-span-5 space-y-6">
          {/* Audit Trail */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Real-Time Audit Trail</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">SQLite / Immutable</span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">No audit logs recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-400 text-[11px]">{log.action}</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-tight">{log.details}</p>
                    <div className="text-[10px] text-slate-500">By: {log.performed_by}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Knowledge Base Articles */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Knowledge Base Rules ({kbArticles.length})</h3>
              </div>
              <span className="text-[10px] text-indigo-400 font-mono font-bold">Auto-Deflection</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {kbArticles.map((kb) => (
                <div key={kb.id} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>{kb.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      {kb.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {kb.keywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
