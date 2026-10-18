import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchTicketById,
  claimTicket,
  releaseTicket,
  updateTicketStatus,
  sendTicketReply,
  fetchKbArticles
} from '../../api';
import VoiceCallModal from '../../components/VoiceCallModal';
import { 
  Phone, 
  PhoneCall, 
  Paperclip, 
  UploadCloud, 
  X, 
  Flame, 
  Sparkles, 
  Mail, 
  FileText, 
  Image as ImageIcon 
} from 'lucide-react';

export default function AgentTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState([]);

  // Calling & image preview modal states
  const [showCallModal, setShowCallModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  // KB Articles
  const [kbArticles, setKbArticles] = useState([]);
  const [showKbModal, setShowKbModal] = useState(false);

  // Canned Replies
  const [cannedReplies, setCannedReplies] = useState([]);
  const [showCannedModal, setShowCannedModal] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);

  const loadTicket = async () => {
    try {
      const data = await fetchTicketById(id);
      setTicket(data);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
    fetchKbArticles().then(setKbArticles).catch(() => {});
    import('../../api').then(mod => mod.fetchCannedReplies().then(setCannedReplies).catch(() => {}));
  }, [id]);

  const handleApplyCanned = (cr) => {
    let replaced = cr.content
      .replace(/{{customer_name}}/g, ticket.customer_name || 'Customer')
      .replace(/{{agent_name}}/g, user?.name || 'Support Agent')
      .replace(/{{ticket_number}}/g, ticket.ticket_number || '');
    setReplyText(replaced);
    setShowCannedModal(false);
  };

  const handleApplyHistoricalResolution = () => {
    if (!ticket?.historical_match?.resolution_note) return;
    setReplyText(`Hello ${ticket.customer_name},\n\nBased on a previously verified resolution for this issue:\n\n${ticket.historical_match.resolution_note}\n\nPlease let us know if this solves your issue!`);
    setIsInternal(false);
  };

  const handleClaim = async () => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      await claimTicket(ticket.id);
      await loadTicket();
      setSuccessMsg('Ticket successfully claimed!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to claim ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!window.confirm('Are you sure you want to release this ticket back to the unassigned queue?')) return;
    setActionLoading(true);
    setErrorMsg('');
    try {
      await releaseTicket(ticket.id);
      await loadTicket();
      setSuccessMsg('Ticket released back to unassigned queue.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to release ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'Resolved') {
      setShowResolveModal(true);
      return;
    }
    setUpdatingStatus(true);
    setErrorMsg('');
    try {
      await updateTicketStatus(ticket.id, newStatus);
      await loadTicket();
      setSuccessMsg(`Status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    setErrorMsg('');
    try {
      await updateTicketStatus(
        ticket.id,
        'Resolved',
        ticket.assigned_agent_id || user.id,
        ticket.assigned_agent_name || user.name,
        resolutionNote || 'Ticket resolved by support agent.'
      );
      setShowResolveModal(false);
      setResolutionNote('');
      await loadTicket();
      setSuccessMsg('Ticket marked as Resolved!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resolve ticket');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (replyAttachments.length + files.length > 4) {
      alert('You can attach up to 4 files per reply.');
      return;
    }

    files.forEach(file => {
      if (file.size > 3 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 3MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setReplyAttachments(prev => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type,
            data: reader.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReplyAttachment = (index) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() && replyAttachments.length === 0) return;

    setSendingReply(true);
    setErrorMsg('');
    try {
      await sendTicketReply(ticket.id, replyText.trim() || 'Attached files.', isInternal, replyAttachments);
      setReplyText('');
      setReplyAttachments([]);
      setIsInternal(false);
      await loadTicket();
      setSuccessMsg(isInternal ? 'Internal note added.' : 'Reply sent to customer.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to post reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleApplyKbArticle = (art) => {
    setReplyText(prev => `${prev ? prev + '\n\n' : ''}Hello ${ticket.customer_name},\n\n${art.full_content}\n\nPlease let us know if this resolves your query!`);
    setIsInternal(false);
    setShowKbModal(false);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading ticket details...
      </div>
    );
  }

  if (errorMsg && !ticket) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="p-6 rounded-2xl bg-red-950/60 border border-red-800 text-red-200">
          <h2 className="text-lg font-bold">Access Denied or Error</h2>
          <p className="text-sm mt-2">{errorMsg}</p>
          <Link
            to="/agent"
            className="inline-block mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            ← Return to Agent Queue
          </Link>
        </div>
      </div>
    );
  }

  const isAssignedToMe = ticket.assigned_agent_id === user?.id;
  const isUnassigned = !ticket.assigned_agent_id;
  const expl = ticket.explainability || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/agent"
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center space-x-1 transition-colors"
        >
          <span>← Back to Triage Queue</span>
        </Link>
        <div className="text-xs text-slate-500 font-mono">
          Ticket ID: <span className="text-slate-300">{ticket.id}</span>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-sm flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-xs text-red-400">Dismiss</button>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-sm flex items-center justify-between">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-xs text-emerald-400">Dismiss</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded border border-blue-800">
              {ticket.ticket_number}
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
              ticket.assigned_tier === 'Critical'
                ? 'bg-red-950 text-red-300 border border-red-800'
                : ticket.assigned_tier === 'Standard'
                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {ticket.assigned_tier} Tier
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              ticket.customer_type === 'VIP'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : ticket.customer_type === 'Premium'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {ticket.customer_type} Customer
            </span>
            <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 border border-slate-700">
              {ticket.category}
            </span>
            {ticket.customer_priority && (
              <span className="px-2.5 py-0.5 rounded text-xs bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center space-x-1 font-medium">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Urgency: {ticket.customer_priority}</span>
              </span>
            )}
            {ticket.allow_call && (
              <span className="px-2.5 py-0.5 rounded text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center space-x-1 font-medium">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>Call Consent Granted</span>
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {ticket.subject}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
            <span>Customer: <strong className="text-slate-200">{ticket.customer_name}</strong> ({ticket.customer_email})</span>
            {ticket.customer_phone && <span>• <span>Phone: <strong className="text-slate-200 font-mono">{ticket.customer_phone}</strong></span></span>}
            <span>•</span>
            <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
            <span>•</span>
            <span>SLA Target: <strong className="text-slate-200">{new Date(ticket.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Direct Audio Calling Button (Feature 2) */}
          <button
            onClick={() => setShowCallModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
            title={ticket.customer_phone ? `Direct Call: ${ticket.customer_phone}` : 'Initiate voice call with customer'}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Customer {ticket.customer_phone ? `(${ticket.customer_phone})` : ''}</span>
          </button>

          {isUnassigned && ticket.status !== 'Resolved' && (
            <button
              onClick={handleClaim}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Claiming...' : 'Claim This Ticket'}
            </button>
          )}

          {isAssignedToMe && ticket.status !== 'Resolved' && (
            <button
              onClick={handleRelease}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
            >
              Release Ticket
            </button>
          )}

          {/* Status Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            {['Open', 'In Progress', 'Resolved'].map(st => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                disabled={updatingStatus || ticket.status === st}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  ticket.status === st
                    ? st === 'Resolved'
                      ? 'bg-emerald-600 text-white font-semibold shadow'
                      : st === 'In Progress'
                      ? 'bg-blue-600 text-white font-semibold shadow'
                      : 'bg-amber-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Description & Conversation Thread */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feature 4: Automated SMS & Email Notification Dispatched Banner */}
          {ticket.status === 'Resolved' && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-200">
              <div className="flex items-start space-x-2.5">
                <Mail className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">
                    Automated Resolution Alerts Dispatched
                  </p>
                  <p className="text-emerald-300/80 text-[11px] mt-0.5">
                    Completion confirmation sent via <strong>Email</strong> to <code>{ticket.customer_email}</code>
                    {ticket.customer_phone ? <span> and <strong>SMS</strong> to <code>{ticket.customer_phone}</code>.</span> : '.'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-700 self-start sm:self-auto">
                Delivered
              </span>
            </div>
          )}

          {/* Feature 5: Historical Similar Case Match Banner */}
          {ticket.historical_match && (
            <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-800/80 space-y-3 text-xs text-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-blue-300">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>AI Historical Duplicate/Similar Match ({ticket.historical_match.similarity_score}% match with {ticket.historical_match.matched_ticket_number})</span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyHistoricalResolution}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1 shadow-md shadow-blue-600/30"
                >
                  <span>Apply Past Resolution</span>
                </button>
              </div>
              <p className="text-slate-300 text-xs">
                Matched Past Inquiry: <strong className="text-white font-mono">{ticket.historical_match.matched_subject}</strong>
              </p>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-blue-900/50 text-slate-200 text-xs whitespace-pre-wrap font-mono">
                {ticket.historical_match.resolution_note}
              </div>
            </div>
          )}

          {/* Original Customer Message */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-slate-300">Customer Issue Description</span>
              <span>Channel: <span className="font-mono text-slate-200">{ticket.channel}</span></span>
            </div>
            <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 font-sans">
              {ticket.description}
            </p>

            {/* Feature 1: Attachments on ticket */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <span>Customer Uploaded Attachments ({ticket.attachments.length})</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ticket.attachments.map((file, idx) => (
                    <div
                      key={idx}
                      onClick={() => file.type?.startsWith('image/') && setPreviewImage(file.data)}
                      className={`p-2 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center space-x-2 text-xs ${
                        file.type?.startsWith('image/') ? 'cursor-pointer hover:border-blue-500 transition-colors' : ''
                      }`}
                    >
                      {file.type?.startsWith('image/') ? (
                        <img src={file.data} alt={file.name} className="w-9 h-9 rounded-lg object-cover border border-slate-700 flex-shrink-0" />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-400 flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-medium text-slate-200 block truncate text-[11px]">{file.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Conversation Thread */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
              Conversation Thread ({ticket.replies?.length || 0})
            </h2>

            {ticket.replies && ticket.replies.length > 0 ? (
              <div className="space-y-4 mb-6">
                {ticket.replies.map((rep, idx) => {
                  const isCallLog = rep.message?.includes('📞 Direct Audio Call');
                  return (
                    <div
                      key={rep.id || idx}
                      className={`p-4 rounded-2xl border ${
                        isCallLog
                          ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-100 ring-1 ring-emerald-500/30'
                          : rep.is_internal
                          ? 'bg-amber-950/30 border-amber-800/50 text-amber-100'
                          : rep.author_role === 'agent' || rep.author_role === 'admin'
                          ? 'bg-blue-950/30 border-blue-800/50 text-blue-100'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5 opacity-80">
                        <div className="flex items-center space-x-2">
                          {isCallLog ? (
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                          ) : null}
                          <strong className="text-white">{rep.author_name}</strong>
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-900/80 border border-slate-700">
                            {isCallLog ? 'Audio Call' : rep.author_role}
                          </span>
                          {rep.is_internal && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              🔒 INTERNAL NOTE (Hidden from Customer)
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          {new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed mt-1">
                        {rep.message}
                      </p>

                      {/* Reply Attachments */}
                      {rep.attachments && rep.attachments.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex flex-wrap gap-2">
                          {rep.attachments.map((file, fi) => (
                            <div
                              key={fi}
                              onClick={() => file.type?.startsWith('image/') && setPreviewImage(file.data)}
                              className={`p-1.5 rounded-lg border border-slate-700 bg-slate-900 flex items-center space-x-2 text-xs ${
                                file.type?.startsWith('image/') ? 'cursor-pointer hover:border-blue-400' : ''
                              }`}
                            >
                              {file.type?.startsWith('image/') ? (
                                <img src={file.data} alt={file.name} className="w-7 h-7 rounded object-cover" />
                              ) : (
                                <FileText className="w-4 h-4 text-slate-400" />
                              )}
                              <span className="text-[11px] font-medium text-slate-200 max-w-[120px] truncate">{file.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No replies yet. Post a response or internal note below.
              </div>
            )}

            {/* Reply Composer Form */}
            <form onSubmit={handleSendReply} className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  {isInternal ? '📝 Add Internal Staff Note' : '💬 Post Public Reply to Customer'}
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCannedModal(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                  >
                    <span>⚡ Canned Reply</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowKbModal(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <span>💡 Insert KB Solution</span>
                  </button>
                  <label className="flex items-center space-x-1.5 text-xs text-amber-300 cursor-pointer bg-amber-950/40 px-2 py-1 rounded border border-amber-800/60">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-0"
                    />
                    <span>Mark as Internal Note</span>
                  </label>
                </div>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder={
                  isInternal
                    ? 'Write internal triage observation, next steps, or technical notes...'
                    : `Write your response directly to ${ticket.customer_name}...`
                }
                className={`w-full rounded-xl bg-slate-950 border text-slate-100 text-sm p-3.5 focus:outline-none transition-colors ${
                  isInternal ? 'border-amber-700/60 focus:border-amber-500' : 'border-slate-800 focus:border-blue-500'
                }`}
              />

              {/* Reply attachments preview */}
              {replyAttachments.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                  {replyAttachments.map((f, i) => (
                    <div key={i} className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
                      <span className="text-slate-300 truncate max-w-[140px]">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeReplyAttachment(i)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-3">
                  <label
                    htmlFor="agent-file-upload"
                    className="cursor-pointer inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach Files ({replyAttachments.length}/4)</span>
                  </label>
                  <input
                    id="agent-file-upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.log,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-[11px] text-slate-500">
                    {isInternal ? '⚠️ Only agents and admins will see this note.' : 'Public message sent directly to customer portal.'}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={sendingReply || (!replyText.trim() && replyAttachments.length === 0)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 ${
                    isInternal
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/30'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30'
                  }`}
                >
                  {sendingReply ? 'Posting...' : isInternal ? 'Save Internal Note' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: AI NLP Explainability & Routing Insights */}
        <div className="space-y-6">
          {/* Priority Score Breakdown Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
              <span>Predictive AI Triage Score</span>
              <span className="text-lg font-mono font-bold text-white">
                {ticket.priority_score}/100
              </span>
            </h3>

            {/* Score Factors Breakdown */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Frustration & Hostility</span>
                  <span className="font-mono text-slate-400">{expl.frustration_score ?? 'N/A'}/100</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.min(100, expl.frustration_score || 0)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Urgency & Impact</span>
                  <span className="font-mono text-slate-400">{expl.urgency_score ?? 'N/A'}/100</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, expl.urgency_score || 0)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Customer Plan Tier Value</span>
                  <span className="font-mono text-slate-400">{expl.customer_value_score ?? 'N/A'}/100</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, expl.customer_value_score || 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Routing Decision */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-1">Explainable Routing Decision</div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                {ticket.routing_reason}
              </p>
            </div>

            {/* Detected Keywords */}
            {expl.detected_keywords && expl.detected_keywords.length > 0 && (
              <div className="mt-4">
                <div className="text-[11px] font-semibold text-slate-400 mb-2">Detected Trigger Keywords:</div>
                <div className="flex flex-wrap gap-1.5">
                  {expl.detected_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/40 text-red-300 border border-red-800/50"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer Meta Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Customer Profile
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Name</span>
                <span className="text-white font-medium">{ticket.customer_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Email</span>
                <span className="text-slate-200 font-mono">{ticket.customer_email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Tier Plan</span>
                <span className="text-amber-300 font-bold">{ticket.customer_type}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Current Assignee</span>
                <span className="text-blue-400 font-medium">{ticket.assigned_agent_name || 'Unassigned'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resolve Confirmation Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Resolve Ticket {ticket.ticket_number}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Please enter an optional resolution note describing how this customer issue was resolved.
            </p>
            <form onSubmit={handleConfirmResolve}>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="E.g., Investigated server logs, reset API credentials, and confirmed webhook delivery with customer."
                rows={4}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm p-3 focus:outline-none focus:border-emerald-500 mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  {updatingStatus ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KB Insertion Modal */}
      {showKbModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Select Knowledge Base Article</h3>
              <button onClick={() => setShowKbModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
              {kbArticles.map(art => (
                <div
                  key={art.id}
                  onClick={() => handleApplyKbArticle(art)}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-blue-500/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-blue-300">
                      {art.title}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {art.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {art.snippet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Canned Replies Modal */}
      {showCannedModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Select Canned Response Template</h3>
                <span className="text-xs text-slate-400">Placeholders like customer name and ticket number will be filled automatically.</span>
              </div>
              <button onClick={() => setShowCannedModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
              {cannedReplies.map(cr => (
                <div
                  key={cr.id}
                  onClick={() => handleApplyCanned(cr)}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-purple-500/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                        /{cr.shortcut}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-200 group-hover:text-purple-300">
                        {cr.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {cr.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 whitespace-pre-wrap font-sans">
                    {cr.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Voice Call Modal (Feature 2) */}
      <VoiceCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        ticketId={ticket.id}
        partyName={ticket.customer_name}
        partyPhone={ticket.customer_phone}
        isAgentCalling={true}
        onCallLogged={loadTicket}
      />

      {/* Image Preview Modal (Feature 1) */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Attachment Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-700" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
