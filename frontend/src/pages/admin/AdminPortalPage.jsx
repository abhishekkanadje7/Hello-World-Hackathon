import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAdminAnalytics,
  fetchTickets,
  exportTicketsCsv,
  fetchAdminUsers,
  createAdminAgent,
  updateAdminUser,
  resetAdminUserPassword,
  fetchAdminFaqs,
  createAdminFaq,
  updateAdminFaq,
  deleteAdminFaq,
  testAdminFaqMatcher,
  fetchSystemSettings,
  saveSystemSettings,
  testGeminiConnection,
  resetDemoDatabase,
  fetchAuditLogs
} from '../../api';

export default function AdminPortalPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'tickets' | 'users' | 'kb' | 'settings' | 'audit'

  // Global feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Overview data
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // 2. All Tickets data
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketTierFilter, setTicketTierFilter] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('');

  // 3. Users data
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userTab, setUserTab] = useState('agents'); // 'agents' | 'customers'
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentLevel, setNewAgentLevel] = useState('Standard');
  const [createdAgentResult, setCreatedAgentResult] = useState(null);
  const [userSearch, setUserSearch] = useState('');

  // 4. Knowledge Base data
  const [faqs, setFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqTitle, setFaqTitle] = useState('');
  const [faqCategory, setFaqCategory] = useState('General');
  const [faqKeywords, setFaqKeywords] = useState('');
  const [faqSnippet, setFaqSnippet] = useState('');
  const [faqContent, setFaqContent] = useState('');
  const [faqActive, setFaqActive] = useState(true);
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testingMatcher, setTestingMatcher] = useState(false);

  // 5. Settings data
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);

  // 6. Audit Log data
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilter, setAuditFilter] = useState('');

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Section Loaders
  useEffect(() => {
    if (activeSection === 'overview') {
      loadAnalytics();
    } else if (activeSection === 'tickets') {
      loadTickets();
    } else if (activeSection === 'users') {
      loadUsers();
    } else if (activeSection === 'kb') {
      loadFaqs();
    } else if (activeSection === 'settings') {
      loadSettings();
    } else if (activeSection === 'audit') {
      loadAudit();
    }
  }, [activeSection]);

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await fetchAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const data = await fetchTickets();
      setTickets(data);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await fetchAdminUsers();
      setUsersList(data);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const data = await fetchAdminFaqs();
      setFaqs(data);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const data = await fetchSystemSettings();
      setSettings(data);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadAudit = async () => {
    setLoadingAudit(true);
    try {
      const data = await fetchAuditLogs();
      setAuditLogs(data);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoadingAudit(false);
    }
  };

  // CSV Export
  const handleExportCsv = async () => {
    try {
      const blob = await exportTicketsCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `triagex_tickets_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showNotification('CSV export downloaded successfully!');
    } catch (err) {
      showNotification('Failed to export CSV: ' + err.message, true);
    }
  };

  // Agent Creation
  const handleCreateAgent = async (e) => {
    e.preventDefault();
    try {
      const res = await createAdminAgent({
        name: newAgentName,
        email: newAgentEmail,
        agent_level: newAgentLevel
      });
      setCreatedAgentResult(res);
      setNewAgentName('');
      setNewAgentEmail('');
      loadUsers();
      showNotification('Agent account created successfully!');
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // Toggle user activation
  const handleToggleUserActive = async (targetUser) => {
    try {
      await updateAdminUser(targetUser.id, {
        is_active: !targetUser.is_active
      });
      loadUsers();
      showNotification(`User ${targetUser.email} ${targetUser.is_active ? 'deactivated' : 'activated'}.`);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // Reset user password
  const handleResetUserPassword = async (targetUser) => {
    if (!window.confirm(`Reset temporary password for ${targetUser.email}?`)) return;
    try {
      const res = await resetAdminUserPassword(targetUser.id);
      alert(`Temporary password for ${targetUser.email}:\n\n${res.temporary_password}\n\nPlease share this securely with the user.`);
      showNotification(`Password reset for ${targetUser.email}.`);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // Customer plan type update
  const handleChangeCustomerType = async (customerId, newType) => {
    try {
      await updateAdminUser(customerId, { customer_type: newType });
      loadUsers();
      showNotification(`Customer plan updated to ${newType}. Open tickets recalculated.`);
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // FAQ CRUD
  const handleOpenFaqModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqTitle(faq.title);
      setFaqCategory(faq.category);
      setFaqKeywords(Array.isArray(faq.keywords) ? faq.keywords.join(', ') : faq.keywords);
      setFaqSnippet(faq.snippet);
      setFaqContent(faq.full_content);
      setFaqActive(bool(faq.is_active));
    } else {
      setEditingFaq(null);
      setFaqTitle('');
      setFaqCategory('General');
      setFaqKeywords('');
      setFaqSnippet('');
      setFaqContent('');
      setFaqActive(true);
    }
    setShowFaqModal(true);
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    const payload = {
      title: faqTitle,
      category: faqCategory,
      keywords: faqKeywords.split(',').map(k => k.trim()).filter(Boolean),
      snippet: faqSnippet,
      full_content: faqContent,
      is_active: faqActive
    };

    try {
      if (editingFaq) {
        await updateAdminFaq(editingFaq.id, payload);
        showNotification('FAQ updated successfully!');
      } else {
        await createAdminFaq(payload);
        showNotification('New FAQ article created!');
      }
      setShowFaqModal(false);
      loadFaqs();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm('Are you sure you want to delete this FAQ article?')) return;
    try {
      await deleteAdminFaq(faqId);
      loadFaqs();
      showNotification('FAQ article deleted.');
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleTestMatcher = async (e) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setTestingMatcher(true);
    try {
      const res = await testAdminFaqMatcher(testQuery);
      setTestResult(res);
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setTestingMatcher(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveSystemSettings(settings);
      showNotification('System settings and routing thresholds successfully updated!');
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setSavingSettings(false);
    }
  };

  // Test Direct Gemini AI Connection
  const handleTestGemini = async () => {
    const key = (settings?.gemini_api_key || '').trim();
    if (!key) {
      showNotification('Please enter a Gemini API Key to test.', true);
      return;
    }
    setTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await testGeminiConnection(key);
      setGeminiTestResult(res);
      showNotification(res.message || 'Successfully connected to Google Gemini AI!');
    } catch (err) {
      showNotification(err.message || 'Gemini AI test failed. Please verify API key.', true);
    } finally {
      setTestingGemini(false);
    }
  };

  // Reset Demo DB
  const handleResetDemoDb = async () => {
    if (!window.confirm('⚠️ ATTENTION: This will reset all demo tickets, customer accounts, and restore clean seeded hackathon data. Proceed?')) return;
    try {
      await resetDemoDatabase();
      showNotification('Demo database successfully restored to pristine state!');
      loadAnalytics();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  function bool(val) {
    return Boolean(val && val !== '0' && val !== 0);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0">
        <div>
          <div className="mb-8 border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white tracking-tight">Admin Console</h2>
            <span className="text-[11px] text-slate-400">Settings & Telemetry</span>
          </div>

          <nav className="space-y-1 text-xs font-medium">
            {[
              { id: 'overview', label: 'Overview Analytics' },
              { id: 'tickets', label: 'All Tickets & CSV' },
              { id: 'users', label: 'Users & Agents' },
              { id: 'kb', label: 'Knowledge Base FAQs' },
              { id: 'settings', label: 'Engine & Thresholds' },
              { id: 'audit', label: 'System Audit Log' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-lg transition-all text-left ${
                  activeSection === item.id
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/80 mt-6">
          <div className="text-[11px] text-slate-500 font-medium">
            Production Environment
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-xs text-red-400">Dismiss</button>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-sm flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-xs text-emerald-400">Dismiss</button>
          </div>
        )}

        {/* 1. OVERVIEW ANALYTICS */}
        {activeSection === 'overview' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">System Overview Analytics</h1>
                <p className="text-xs text-slate-400 mt-1">Real-time triage telemetry, SLA adherence, and agent capacity metrics</p>
              </div>
              <button
                onClick={loadAnalytics}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                Refresh Metrics
              </button>
            </div>

            {loadingAnalytics ? (
              <div className="py-20 text-center text-slate-400">Loading analytics...</div>
            ) : analytics ? (
              <>
                {/* 4 Top KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ingested</div>
                    <div className="text-3xl font-extrabold text-white mt-2">{analytics.total_tickets}</div>
                    <div className="text-xs text-slate-500 mt-1">Open: {analytics.open_tickets} • Resolved: {analytics.resolved_tickets}</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Escalations</div>
                    <div className="text-3xl font-extrabold text-red-400 mt-2">{analytics.critical_tickets}</div>
                    <div className="text-xs text-slate-500 mt-1">Routed to Senior Agents (&gt;70)</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SLA Compliance</div>
                    <div className="text-3xl font-extrabold text-emerald-400 mt-2">{analytics.sla_compliance_rate}%</div>
                    <div className="text-xs text-slate-500 mt-1">Overdue: {analytics.overdue_sla_count} tickets</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">KB Deflection Rate</div>
                    <div className="text-3xl font-extrabold text-blue-400 mt-2">{analytics.kb_deflection_rate}%</div>
                    <div className="text-xs text-slate-500 mt-1">Auto-resolved via knowledge base</div>
                  </div>
                </div>

                {/* SVG Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Tier Distribution Breakdown */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
                    <h3 className="text-sm font-bold text-white mb-4">Routing Tier Distribution</h3>
                    <div className="space-y-4">
                      {analytics.tier_distribution?.map(item => {
                        const pct = analytics.total_tickets > 0 ? Math.round((item.value / analytics.total_tickets) * 100) : 0;
                        return (
                          <div key={item.name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-semibold text-slate-300">{item.name} Tier</span>
                              <span className="font-mono text-slate-400">{item.value} ({pct}%)</span>
                            </div>
                            <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chart 2: Customer Sentiment & Frustration Buckets */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
                    <h3 className="text-sm font-bold text-white mb-4">NLP Sentiment Polarity Buckets</h3>
                    <div className="space-y-4">
                      {analytics.sentiment_distribution?.map(item => {
                        const pct = analytics.total_tickets > 0 ? Math.round((item.count / analytics.total_tickets) * 100) : 0;
                        return (
                          <div key={item.name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-slate-300">{item.name}</span>
                              <span className="font-mono text-slate-400">{item.count} tickets ({pct}%)</span>
                            </div>
                            <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chart 3: Agent Workload & Resolution Metrics */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl lg:col-span-2">
                    <h3 className="text-sm font-bold text-white mb-4">Agent Workload & Productivity</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Agent</th>
                            <th className="py-2.5 px-3">Level</th>
                            <th className="py-2.5 px-3">Active Tickets</th>
                            <th className="py-2.5 px-3">Resolved</th>
                            <th className="py-2.5 px-3">Total Assigned</th>
                            <th className="py-2.5 px-3">Capacity Bar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {analytics.agent_workload?.map(a => (
                            <tr key={a.agent_id} className="hover:bg-slate-800/30">
                              <td className="py-3 px-3 font-semibold text-white">{a.agent_name}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  a.agent_level === 'Senior'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                                }`}>
                                  {a.agent_level}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-amber-300">{a.active_tickets}</td>
                              <td className="py-3 px-3 font-mono text-emerald-400">{a.resolved_tickets}</td>
                              <td className="py-3 px-3 font-mono text-slate-300">{a.total_assigned}</td>
                              <td className="py-3 px-3 w-48">
                                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${Math.min(100, (a.active_tickets / 5) * 100)}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* 2. ALL TICKETS & CSV EXPORT */}
        {activeSection === 'tickets' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">All System Tickets</h1>
                <p className="text-xs text-slate-400 mt-1">Global ticket index across all customer tiers and agent queues</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportCsv}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
                >
                  <span>📥</span>
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={loadTickets}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              <input
                type="text"
                placeholder="Search ticket #, subject, or customer..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                className="rounded-lg bg-slate-950 border border-slate-800 text-xs px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <select
                value={ticketTierFilter}
                onChange={(e) => setTicketTierFilter(e.target.value)}
                className="rounded-lg bg-slate-950 border border-slate-800 text-xs px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Tiers (Critical, Standard, Routine)</option>
                <option value="Critical">Critical</option>
                <option value="Standard">Standard</option>
                <option value="Routine">Routine</option>
              </select>
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="rounded-lg bg-slate-950 border border-slate-800 text-xs px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Statuses (Open, In Progress, Resolved)</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Table */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              {loadingTickets ? (
                <div className="py-20 text-center text-slate-400">Loading tickets...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">Ticket</th>
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Priority</th>
                        <th className="py-3 px-3">Tier</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Assignee</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {tickets
                        .filter(t => {
                          if (ticketTierFilter && t.assigned_tier !== ticketTierFilter) return false;
                          if (ticketStatusFilter && t.status !== ticketStatusFilter) return false;
                          if (ticketSearch) {
                            const q = ticketSearch.toLowerCase();
                            return (
                              t.ticket_number?.toLowerCase().includes(q) ||
                              t.subject?.toLowerCase().includes(q) ||
                              t.customer_name?.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        })
                        .map(t => (
                          <tr key={t.id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-blue-400">{t.ticket_number}</span>
                              <div className="text-slate-300 font-medium line-clamp-1 mt-0.5">{t.subject}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-slate-200">{t.customer_name}</div>
                              <span className="text-[10px] text-amber-300 font-semibold uppercase">{t.customer_type}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                                t.priority_score >= 70 ? 'text-red-400 bg-red-950/60' : t.priority_score >= 40 ? 'text-blue-400 bg-blue-950/60' : 'text-emerald-400 bg-emerald-950/60'
                              }`}>
                                {t.priority_score}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                t.assigned_tier === 'Critical' ? 'bg-red-950 text-red-300 border border-red-800' : t.assigned_tier === 'Standard' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}>
                                {t.assigned_tier}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-slate-300">{t.status}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-400">
                              {t.assigned_agent_name || <span className="italic text-slate-500">Unassigned</span>}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <a
                                href={`/agent/tickets/${t.id}`}
                                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                              >
                                View
                              </a>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. USERS & AGENTS MANAGEMENT */}
        {activeSection === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">User Administration</h1>
                <p className="text-xs text-slate-400 mt-1">Manage agent tiers, customer SLA plan types, and credentials</p>
              </div>
              <button
                onClick={() => {
                  setCreatedAgentResult(null);
                  setShowCreateAgentModal(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-1.5"
              >
                <span>➕</span>
                <span>Create New Agent</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 space-x-6">
              <button
                onClick={() => setUserTab('agents')}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  userTab === 'agents' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Support Agents ({usersList.filter(u => u.role === 'agent').length})
              </button>
              <button
                onClick={() => setUserTab('customers')}
                className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  userTab === 'customers' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Customers ({usersList.filter(u => u.role === 'customer').length})
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              {loadingUsers ? (
                <div className="py-20 text-center text-slate-400">Loading user accounts...</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Name & Email</th>
                      <th className="py-3 px-4">Role & Level</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Must Change PW</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {usersList
                      .filter(u => userTab === 'agents' ? u.role === 'agent' : u.role === 'customer')
                      .map(u => (
                        <tr key={u.id} className="hover:bg-slate-800/30">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            {u.role === 'agent' ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.agent_level === 'Senior'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : 'bg-blue-950 text-blue-300 border border-blue-800'
                              }`}>
                                {u.agent_level} Agent
                              </span>
                            ) : (
                              <select
                                value={u.customer_type || 'Regular'}
                                onChange={(e) => handleChangeCustomerType(u.id, e.target.value)}
                                className="rounded bg-slate-950 border border-slate-700 text-amber-300 font-semibold px-2 py-1 text-xs"
                              >
                                <option value="Regular">Regular</option>
                                <option value="Premium">Premium</option>
                                <option value="VIP">VIP</option>
                              </select>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              bool(u.is_active)
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                : 'bg-red-950/80 text-red-300 border border-red-800'
                            }`}>
                              {bool(u.is_active) ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono">
                            {bool(u.must_change_password) ? '⚠️ Yes' : 'No'}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleResetUserPassword(u)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                            >
                              Reset PW
                            </button>
                            <button
                              onClick={() => handleToggleUserActive(u)}
                              className={`px-2.5 py-1 rounded ${
                                bool(u.is_active)
                                  ? 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {bool(u.is_active) ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Create Agent Modal */}
            {showCreateAgentModal && (
              <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white">Create New Support Agent</h3>
                    <button onClick={() => setShowCreateAgentModal(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  {createdAgentResult ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                        <strong className="block text-sm font-bold text-emerald-800">🎉 Support Agent Account Provisioned!</strong>
                        <p className="text-slate-600">
                          An automated onboarding email has been sent to <strong>{createdAgentResult.user?.email || newAgentEmail}</strong> with the login details and temporary password.
                        </p>
                        <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold pt-1">
                          <span>📧 Status: Credentials dispatched automatically to inbox</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block mb-1">Generated Temporary Password:</span>
                        <div className="bg-slate-100 p-3 rounded-xl border border-slate-300 font-mono text-center text-sm font-bold text-slate-900 select-all">
                          {createdAgentResult.temporary_password}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 text-center">
                          The agent will be prompted to set a permanent password upon first login.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowCreateAgentModal(false);
                          setCreatedAgentResult(null);
                        }}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                      >
                        Close & Refresh Agent List
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateAgent} className="space-y-3.5">
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">Agent Full Name</label>
                        <input
                          type="text"
                          required
                          value={newAgentName}
                          onChange={(e) => setNewAgentName(e.target.value)}
                          placeholder="E.g. Meera Iyer"
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">Agent Email Address</label>
                        <input
                          type="email"
                          required
                          value={newAgentEmail}
                          onChange={(e) => setNewAgentEmail(e.target.value)}
                          placeholder="meera@triagex.com"
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">Support Tier Level</label>
                        <select
                          value={newAgentLevel}
                          onChange={(e) => setNewAgentLevel(e.target.value)}
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="Standard">Standard Tier (Standard & Routine tickets)</option>
                          <option value="Senior">Senior Tier (Critical & Outage escalations)</option>
                        </select>
                      </div>
                      <div className="pt-2 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateAgentModal(false)}
                          className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white"
                        >
                          Generate Account
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. KNOWLEDGE BASE FAQ CRUD & TEST */}
        {activeSection === 'kb' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Knowledge Base & Deflection Engine</h1>
                <p className="text-xs text-slate-400 mt-1">Manage self-service FAQ articles and test the regex NLP matching matcher</p>
              </div>
              <button
                onClick={() => handleOpenFaqModal()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-1.5"
              >
                <span>➕</span>
                <span>Add FAQ Article</span>
              </button>
            </div>

            {/* Live Matcher Test Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                🧪 Test Live FAQ Matcher
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Type customer inquiries to verify if the routing engine will automatically deflect and auto-reply.
              </p>
              <form onSubmit={handleTestMatcher} className="flex gap-2">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="E.g. How do I reset my password? or what is your refund policy?"
                  className="flex-1 rounded-xl bg-slate-950 border border-slate-800 text-xs px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={testingMatcher || !testQuery.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50"
                >
                  {testingMatcher ? 'Matching...' : 'Test Match'}
                </button>
              </form>

              {testResult && (
                <div className={`mt-3 p-3.5 rounded-xl text-xs border ${
                  testResult.matched
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                }`}>
                  {testResult.matched ? (
                    <div>
                      <strong className="block text-emerald-300">🎯 MATCH FOUND (Confidence: {testResult.confidence})</strong>
                      <div className="mt-1 font-semibold">{testResult.article.title}</div>
                      <div className="mt-0.5 text-slate-300">{testResult.article.snippet}</div>
                    </div>
                  ) : (
                    <span>⚠️ {testResult.message}</span>
                  )}
                </div>
              )}
            </div>

            {/* FAQs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map(faq => (
                <div
                  key={faq.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {faq.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        bool(faq.is_active) ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {bool(faq.is_active) ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white text-sm">{faq.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{faq.snippet}</p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {(Array.isArray(faq.keywords) ? faq.keywords : []).map((k, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleOpenFaqModal(faq)}
                      className="px-2.5 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="px-2.5 py-1 rounded text-xs bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ Create/Edit Modal */}
            {showFaqModal && (
              <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white">{editingFaq ? 'Edit FAQ' : 'Create FAQ Article'}</h3>
                    <button onClick={() => setShowFaqModal(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <form onSubmit={handleSaveFaq} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">Article Title</label>
                      <input
                        type="text"
                        required
                        value={faqTitle}
                        onChange={(e) => setFaqTitle(e.target.value)}
                        placeholder="E.g. How to Reset Your Password"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">Category</label>
                        <input
                          type="text"
                          required
                          value={faqCategory}
                          onChange={(e) => setFaqCategory(e.target.value)}
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-300 block mb-1">Status</label>
                        <select
                          value={faqActive ? '1' : '0'}
                          onChange={(e) => setFaqActive(e.target.value === '1')}
                          className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="1">Active (Enabled in Router)</option>
                          <option value="0">Disabled (Draft)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">Trigger Keywords (comma-separated)</label>
                      <input
                        type="text"
                        required
                        value={faqKeywords}
                        onChange={(e) => setFaqKeywords(e.target.value)}
                        placeholder="reset password, forgot password, credentials"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">Snippet Summary</label>
                      <input
                        type="text"
                        required
                        value={faqSnippet}
                        onChange={(e) => setFaqSnippet(e.target.value)}
                        placeholder="Brief 1-line resolution summary"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">Full Solution Content (Markdown)</label>
                      <textarea
                        rows={5}
                        required
                        value={faqContent}
                        onChange={(e) => setFaqContent(e.target.value)}
                        placeholder="Step-by-step instructions sent in auto-replies..."
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="pt-2 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowFaqModal(false)}
                        className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white"
                      >
                        Save FAQ Article
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. SETTINGS & DYNAMIC THRESHOLDS */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Engine Settings & Weights</h1>
              <p className="text-xs text-slate-400 mt-1">Configure real-time NLP weights and SLA deadline durations</p>
            </div>

            {loadingSettings ? (
              <div className="py-20 text-center text-slate-400">Loading settings...</div>
            ) : settings ? (
              <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
                {/* 0. Direct Google Gemini AI Autonomous Decision Engine */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/30 shadow-md space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider mb-1">
                        <span>Generative AI Engine</span>
                      </div>
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <span>Direct Google Gemini AI Autonomous Triage</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        When configured, tickets are read and triaged directly by Google Gemini LLM with complete human contextual understanding, tone detection, and automated solution drafts.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Google Gemini API Key
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="password"
                        placeholder="Paste your Gemini API Key (AIzaSy...)"
                        value={settings.gemini_api_key || ''}
                        onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                        className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleTestGemini}
                        disabled={testingGemini || !(settings.gemini_api_key || '').trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        {testingGemini ? <span>Testing AI...</span> : <span>Test AI Connection</span>}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      🔒 Key is stored securely. If omitted or offline, TriageX automatically falls back to our high-precision local NLP engine without disruption.
                    </p>
                  </div>

                  {geminiTestResult && (
                    <div className="p-3.5 bg-blue-950/60 border border-blue-500/40 rounded-xl text-xs text-blue-200 space-y-2 animate-fade-in">
                      <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                        <span>✓</span>
                        <span>{geminiTestResult.message}</span>
                      </div>
                      {geminiTestResult.test_evaluation && (
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1 border-t border-blue-900/40">
                          <div>Priority: <strong className="text-blue-300">{geminiTestResult.test_evaluation.priority_score}/100</strong></div>
                          <div>Tier: <strong className="text-amber-300">{geminiTestResult.test_evaluation.assigned_tier}</strong></div>
                          <div className="col-span-2 text-slate-400 font-sans italic text-[11px] mt-0.5">
                            "{geminiTestResult.test_evaluation.routing_reason}"
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Weights Sliders Card */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md space-y-4">
                  <h3 className="text-sm font-bold text-white mb-2">Priority Scoring Model Weights (Local Fallback)</h3>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Frustration Weight</span>
                      <span className="font-mono text-blue-400">{(parseFloat(settings.active_weights?.frustration_weight || 0.4) * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={settings.active_weights?.frustration_weight || 0.4}
                      onChange={(e) => setSettings({
                        ...settings,
                        active_weights: { ...settings.active_weights, frustration_weight: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Urgency Weight</span>
                      <span className="font-mono text-amber-400">{(parseFloat(settings.active_weights?.urgency_weight || 0.4) * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={settings.active_weights?.urgency_weight || 0.4}
                      onChange={(e) => setSettings({
                        ...settings,
                        active_weights: { ...settings.active_weights, urgency_weight: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Customer Plan Value Weight</span>
                      <span className="font-mono text-purple-400">{(parseFloat(settings.active_weights?.customer_value_weight || 0.2) * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.6"
                      step="0.05"
                      value={settings.active_weights?.customer_value_weight || 0.2}
                      onChange={(e) => setSettings({
                        ...settings,
                        active_weights: { ...settings.active_weights, customer_value_weight: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Tier Thresholds Card */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md space-y-4">
                  <h3 className="text-sm font-bold text-white mb-2">Routing Threshold Cutoffs</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Critical Tier Cutoff (&gt;= Score)</label>
                      <input
                        type="number"
                        min="50"
                        max="95"
                        value={settings.active_weights?.critical_threshold || 70}
                        onChange={(e) => setSettings({
                          ...settings,
                          active_weights: { ...settings.active_weights, critical_threshold: parseInt(e.target.value) }
                        })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Standard Tier Cutoff (&gt;= Score)</label>
                      <input
                        type="number"
                        min="20"
                        max="60"
                        value={settings.active_weights?.standard_threshold || 40}
                        onChange={(e) => setSettings({
                          ...settings,
                          active_weights: { ...settings.active_weights, standard_threshold: parseInt(e.target.value) }
                        })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* SLA Targets Card */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md space-y-4">
                  <h3 className="text-sm font-bold text-white mb-2">Service Level Agreement (SLA) Targets</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Critical Tier (Minutes)</label>
                      <input
                        type="number"
                        value={settings.sla_critical_minutes || '15'}
                        onChange={(e) => setSettings({ ...settings, sla_critical_minutes: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Standard Tier (Hours)</label>
                      <input
                        type="number"
                        value={settings.sla_standard_hours || '2'}
                        onChange={(e) => setSettings({ ...settings, sla_standard_hours: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Routine Tier (Hours)</label>
                      <input
                        type="number"
                        value={settings.sla_routine_hours || '24'}
                        onChange={(e) => setSettings({ ...settings, sla_routine_hours: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {savingSettings ? 'Saving & Recalculating...' : 'Save Settings & Recalculate Tickets'}
                </button>
              </form>
            ) : null}
          </div>
        )}

        {/* 6. AUDIT LOG */}
        {activeSection === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">System Audit Log</h1>
                <p className="text-xs text-slate-400 mt-1">Immutable security ledger capturing all triage, login, and configuration events</p>
              </div>
              <button
                onClick={loadAudit}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                🔄 Refresh Logs
              </button>
            </div>

            <input
              type="text"
              placeholder="Filter by action or user..."
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              className="w-full max-w-md rounded-xl bg-slate-950 border border-slate-800 text-xs px-3.5 py-2 text-white focus:outline-none focus:border-blue-500"
            />

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              {loadingAudit ? (
                <div className="py-20 text-center text-slate-400">Loading audit trail...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">Timestamp</th>
                        <th className="py-3 px-3">Action</th>
                        <th className="py-3 px-3">Details</th>
                        <th className="py-3 px-3">Performed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {auditLogs
                        .filter(l => {
                          if (!auditFilter) return true;
                          const q = auditFilter.toLowerCase();
                          return l.action?.toLowerCase().includes(q) || l.details?.toLowerCase().includes(q) || l.performed_by?.toLowerCase().includes(q);
                        })
                        .map(l => (
                          <tr key={l.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                              {new Date(l.timestamp).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/80 text-[11px] font-bold">
                                {l.action}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 font-sans">
                              {l.details}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                              {l.performed_by}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
