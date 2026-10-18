import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchTicketById, 
  sendTicketReply,
  initiateTicketCall,
  getTicketCallStatus,
  answerTicketCall,
  endTicketCall
} from '../../api';
import VoiceCallModal from '../../components/VoiceCallModal';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  User, 
  Bot,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  Phone,
  PhoneCall,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Trash2,
  Mail,
  MessageSquare,
  Sparkles,
  Flame,
  Check,
  X
} from 'lucide-react';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Calling modal state
  const [showCallModal, setShowCallModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isAnswering, setIsAnswering] = useState(false);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTicketById(id);
      setTicket(data);
      setReplies(data.replies || []);
    } catch (err) {
      setError(err.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
    // Live polling for chat updates and incoming agent calls
    const interval = setInterval(async () => {
      try {
        const data = await fetchTicketById(id);
        if (data && data.replies) {
          setReplies(data.replies);
          if (data.status !== ticket?.status) {
            setTicket(data);
          }
        }
        const callStat = await getTicketCallStatus(id);
        if (callStat && callStat.status === 'ringing' && callStat.caller_role !== 'customer') {
          setIncomingCall(callStat);
        } else if (callStat && (callStat.status === 'ended' || callStat.status === 'none')) {
          setIncomingCall(null);
        }
      } catch (e) {}
    }, 2500);
    return () => clearInterval(interval);
  }, [id]);

  const handleStartCall = async () => {
    try {
      await initiateTicketCall(ticket.id, ticket.customer_phone);
    } catch (_) {}
    setIsAnswering(false);
    setShowCallModal(true);
  };

  const handleAnswerIncomingCall = async () => {
    try {
      await answerTicketCall(ticket.id);
    } catch (_) {}
    setIncomingCall(null);
    setIsAnswering(true);
    setShowCallModal(true);
  };

  const handleDeclineIncomingCall = async () => {
    try {
      await endTicketCall(ticket.id, 0);
    } catch (_) {}
    setIncomingCall(null);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (replyAttachments.length + files.length > 3) {
      alert('You can attach up to 3 files per reply.');
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
    if (!newReply.trim() && replyAttachments.length === 0) return;

    setSending(true);
    try {
      const rep = await sendTicketReply(ticket.id, newReply.trim() || 'Attached files.', false, replyAttachments);
      setReplies(prev => [...prev, rep]);
      setNewReply('');
      setReplyAttachments([]);
    } catch (err) {
      alert(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
        <span>Loading ticket details & conversation...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error || 'Ticket not found or access denied.'}
        </div>
        <Link
          to="/customer/tickets"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Tickets</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 bg-slate-50 min-h-[calc(100vh-100px)] animate-fade-in">
      {/* शीर्ष नेव्हिगेशन (Back navigation & Call Button) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/customer/tickets"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Tickets</span>
        </Link>

        <div className="flex items-center space-x-2.5">
          {/* Direct Audio Calling Button (Feature 2) */}
          <button
            type="button"
            onClick={handleStartCall}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all hover:scale-105"
            title="Start direct audio call with your assigned support specialist"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Support Agent</span>
          </button>

          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            Ref: {ticket.ticket_number}
          </span>
        </div>
      </div>

      {/* मुख्य तिकीट माहिती कार्ड (Header Card) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {ticket.subject}
            </h1>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 pt-1">
              <span>Submitted {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span className="font-medium text-slate-700">Department: {ticket.category || 'General'}</span>
              {ticket.customer_priority && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center space-x-1 text-slate-700 font-semibold">
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span>Urgency: {ticket.customer_priority}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              ticket.status === 'Resolved' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
              ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              Status: {ticket.status}
            </span>
          </div>
        </div>

        {/* Feature 4: Automated SMS & Email Notification Dispatched Banner */}
        {ticket.status === 'Resolved' && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
            <div className="flex items-start space-x-2.5">
              <Mail className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">
                  Automated Resolution Alerts Dispatched
                </p>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  A completion confirmation was automatically sent via <strong>Email</strong> to <code>{ticket.customer_email}</code>
                  {ticket.customer_phone ? <span> and <strong>SMS</strong> to <code>{ticket.customer_phone}</code>.</span> : '.'}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-800 self-start sm:self-auto">
              Delivered
            </span>
          </div>
        )}

        {/* Feature 5: Historical Similar Case Match Banner */}
        {ticket.historical_match && (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs text-blue-950">
            <div className="flex items-center space-x-1.5 font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>AI Case-Based Resolution Match ({ticket.historical_match.similarity_score}% match with {ticket.historical_match.matched_ticket_number})</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              A similar inquiry was resolved previously. The proven solution is provided below for fast reference:
            </p>
            <div className="p-3 bg-white rounded-lg border border-blue-200 text-slate-800 text-xs whitespace-pre-wrap font-mono">
              {ticket.historical_match.resolution_note}
            </div>
          </div>
        )}

        {/* मूळ समस्या वर्णन (Original Description) */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Ticket Description
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </div>
        </div>

        {/* Feature 1: Attachments on ticket */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
              <span>Attached Files ({ticket.attachments.length})</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ticket.attachments.map((file, idx) => (
                <div
                  key={idx}
                  onClick={() => file.type?.startsWith('image/') && setPreviewImage(file.data)}
                  className={`p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center space-x-2 text-xs ${
                    file.type?.startsWith('image/') ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''
                  }`}
                >
                  {file.type?.startsWith('image/') ? (
                    <img src={file.data} alt={file.name} className="w-9 h-9 rounded object-cover border border-slate-300 flex-shrink-0" />
                  ) : (
                    <FileText className="w-6 h-6 text-slate-500 flex-shrink-0" />
                  )}
                  <div className="truncate">
                    <span className="font-medium text-slate-800 block truncate text-[11px]">{file.name}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* हँडलर माहिती (Handler Info) */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Assigned Support Team: <strong className="text-slate-800">{ticket.assigned_agent_name || 'Support Operations Team'}</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            {ticket.allow_call && (
              <span className="inline-flex items-center space-x-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>Call Allowed</span>
              </span>
            )}
            <span className="font-mono">{ticket.status === 'Resolved' ? 'Resolved' : 'Active Ticket'}</span>
          </div>
        </div>
      </div>

      {/* Feature 6: संभाषण थ्रेड व Live Chat Interface */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Live Chat & Conversation History</span>
            <span className="text-xs font-mono text-slate-400 font-normal">({replies.length} messages)</span>
          </h2>
          <span className="text-[11px] text-emerald-600 flex items-center space-x-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Sync Active</span>
          </span>
        </div>

        {replies.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No replies on this ticket yet. An agent will post an update here soon.
          </p>
        ) : (
          <div className="space-y-4">
            {replies.map((r) => {
              const isSystem = r.author_role === 'system';
              const isAgent = r.author_role === 'agent' || r.author_role === 'admin';
              const isSelf = r.author_role === 'customer';
              const isCallLog = r.message?.includes('📞 Direct Audio Call');

              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl border space-y-2 transition-all ${
                    isCallLog ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-500/20' :
                    isSystem ? 'bg-emerald-50/60 border-emerald-200' :
                    isAgent ? 'bg-blue-50/50 border-blue-200' :
                    'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        isCallLog ? 'bg-emerald-700 text-white' :
                        isSystem ? 'bg-emerald-600 text-white' :
                        isAgent ? 'bg-blue-600 text-white' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {isCallLog ? <Phone className="w-3.5 h-3.5" /> : isSystem ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-bold text-slate-900">{r.author_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                        isCallLog ? 'bg-emerald-200 text-emerald-900' :
                        isSystem ? 'bg-emerald-100 text-emerald-800' :
                        isAgent ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {isCallLog ? 'Audio Call' : r.author_role === 'customer' ? 'Customer' : 'Support Specialist'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed pl-8">
                    {r.message}
                  </div>

                  {/* Reply Attachments */}
                  {r.attachments && r.attachments.length > 0 && (
                    <div className="pl-8 pt-2 flex flex-wrap gap-2">
                      {r.attachments.map((file, fi) => (
                        <div
                          key={fi}
                          onClick={() => file.type?.startsWith('image/') && setPreviewImage(file.data)}
                          className={`p-1.5 rounded-lg border border-slate-200 bg-white flex items-center space-x-2 text-xs ${
                            file.type?.startsWith('image/') ? 'cursor-pointer hover:border-blue-400' : ''
                          }`}
                        >
                          {file.type?.startsWith('image/') ? (
                            <img src={file.data} alt={file.name} className="w-7 h-7 rounded object-cover" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-500" />
                          )}
                          <span className="text-[11px] font-medium text-slate-700 max-w-[120px] truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CSAT Rating Widget (If Resolved) */}
        {ticket.status === 'Resolved' && (
          <div className="p-5 rounded-xl bg-amber-50/80 border border-amber-200 my-4">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <span>⭐</span>
              <span>Customer Satisfaction Rating (CSAT)</span>
            </h3>
            {ticket.csat_rating ? (
              <div className="text-xs text-slate-700 flex items-center space-x-2">
                <span>You rated this ticket:</span>
                <span className="text-amber-500 font-bold text-sm">{'★'.repeat(ticket.csat_rating)}{'☆'.repeat(5 - ticket.csat_rating)}</span>
                <span className="text-slate-500 font-semibold">({ticket.csat_rating}/5 stars)</span>
                {ticket.csat_feedback && <span className="italic text-slate-600">"{ticket.csat_feedback}"</span>}
              </div>
            ) : (
              <CsatSubmissionForm ticketId={ticket.id} onSubmitted={(updated) => setTicket(updated)} />
            )}
          </div>
        )}

        {/* उत्तर पाठवण्यासाठी बॉक्स (Reply Box with File Attachments) */}
        <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 block">
              Reply in Live Thread
            </label>
            <label htmlFor="reply-attachment" className="cursor-pointer inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach File / Image</span>
            </label>
            <input
              type="file"
              id="reply-attachment"
              multiple
              accept="image/*,.pdf,.txt,.log"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <textarea
            rows={3}
            placeholder="Type your message or response here..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed transition-all"
          />

          {/* Reply Attachments Preview */}
          {replyAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {replyAttachments.map((f, i) => (
                <div key={i} className="p-1.5 px-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center space-x-2 text-xs">
                  {f.type?.startsWith('image/') ? (
                    <img src={f.data} alt="preview" className="w-5 h-5 rounded object-cover" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-500" />
                  )}
                  <span className="font-medium text-slate-800 text-[11px] truncate max-w-[140px]">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeReplyAttachment(i)}
                    className="text-slate-400 hover:text-red-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || (!newReply.trim() && replyAttachments.length === 0)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {sending ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Incoming Call Ringing Alert from Agent */}
      {incomingCall && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border-2 border-emerald-500 rounded-2xl p-5 shadow-2xl max-w-sm text-white animate-pulse">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center animate-bounce">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center space-x-1.5">
                <span>Support Agent is Calling You!</span>
              </h4>
              <p className="text-xs text-emerald-300 font-medium">
                {incomingCall.caller_name} (Support Operations)
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Agent wants to assist you regarding Ticket #{ticket.ticket_number}
          </p>
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={handleAnswerIncomingCall}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/40 transition-all hover:scale-105"
            >
              <Phone className="w-4 h-4" />
              <span>Accept & Speak</span>
            </button>
            <button
              onClick={handleDeclineIncomingCall}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Voice Call Modal (Feature 2) */}
      <VoiceCallModal
        isOpen={showCallModal}
        onClose={() => {
          setShowCallModal(false);
          setIsAnswering(false);
        }}
        recipientName={ticket.assigned_agent_name || 'Support Specialist'}
        recipientRole="Support Specialist"
        ticketId={ticket.id}
        ticketNumber={ticket.ticket_number}
        isIncoming={isAnswering}
        onCallCompleted={() => loadTicketData()}
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer animate-fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={previewImage} alt="Expanded Attachment" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CsatSubmissionForm({ ticketId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { submitCsatRating } = await import('../../api');
      const res = await submitCsatRating(ticketId, rating, feedback);
      if (onSubmitted) onSubmitted(res.ticket);
    } catch (err) {
      alert(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center space-x-2">
        <span className="text-xs text-slate-700 font-medium">Rate your experience:</span>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className={`text-lg transition-transform hover:scale-125 ${
                star <= rating ? 'text-amber-500' : 'text-slate-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-xs font-mono font-bold text-amber-800">({rating}/5)</span>
      </div>

      <input
        type="text"
        placeholder="Optional comments or suggestions..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
      />

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-all disabled:opacity-50 shadow-2xs"
      >
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </form>
  );
}
