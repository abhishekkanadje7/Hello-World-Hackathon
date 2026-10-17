// =============================================================================
// TriageX - Professional Customer Ticket Submission Page
// कमेंट: ग्राहकांसाठी (Customer) स्वच्छ आणि तपशीलवार तिकीट नोंदणी फॉर्म.
// यात कोणताही गडद (dark) लुक नाही, कोणतेही बनावट चाचणी बटणे नाहीत.
// ग्राहकाला अंतर्गत AI Priority Score किंवा Triage Rules दिसत नाहीत; 
// AI निर्णय घेईल पण तो फक्त एजंट आणि अॅडमिनला दिसेल.
// =============================================================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createTicket } from '../../api';
import { 
  Send, 
  CheckCircle2, 
  ArrowRight, 
  ListOrdered, 
  FileText, 
  Layers, 
  AlertCircle,
  HelpCircle,
  Smartphone,
  Phone,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function NewTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // फॉर्म इनपुट स्टेट्स
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Support');
  const [environment, setEnvironment] = useState('Web Application');
  const [contactInfo, setContactInfo] = useState('');
  const [description, setDescription] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const charCount = description.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    setError(null);

    // वर्णनात अतिरिक्त ग्राहक माहिती सुरक्षितपणे जोडणे
    let fullDescription = description.trim();
    const extraMetadata = [];
    if (environment) extraMetadata.push(`Platform: ${environment}`);
    if (contactInfo.trim()) extraMetadata.push(`Contact: ${contactInfo.trim()}`);
    if (errorDetails.trim()) extraMetadata.push(`Error/Log details: ${errorDetails.trim()}`);

    if (extraMetadata.length > 0) {
      fullDescription += `\n\n--- Additional Context ---\n${extraMetadata.join('\n')}`;
    }

    try {
      const ticket = await createTicket({
        subject: subject.trim(),
        description: fullDescription,
        category: category,
        channel: 'web'
      });
      setResult(ticket);
    } catch (err) {
      setError(err.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto bg-slate-50 space-y-6">
      {/* शीर्ष शीर्षक (Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Submit a Support Request
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong className="text-slate-800">{user?.name}</strong> • Account: <strong className="text-slate-700">{user?.email}</strong>
          </p>
        </div>
        <Link
          to="/customer/tickets"
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors w-fit"
        >
          <ListOrdered className="w-4 h-4 text-slate-500" />
          <span>My Support Tickets</span>
        </Link>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* सबमिट झाल्यानंतरची पुष्टी (Customer Confirmation Screen - No AI scores exposed) */}
      {result ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 border-b border-slate-100 pb-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Ticket Submitted Successfully!
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your request has been safely received and logged in our system.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Ticket Reference</span>
              <span className="font-mono font-bold text-blue-600 text-sm">{result.ticket_number}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Department</span>
              <span className="font-semibold text-slate-800">{category}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                {result.status || 'Open'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <p className="font-medium text-slate-800">
              What happens next?
            </p>
            <p className="leading-relaxed">
              Our support team has been notified. An agent will review your issue and post updates directly to your ticket thread. You can view the live status and reply anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setResult(null);
                setSubject('');
                setDescription('');
                setErrorDetails('');
                setContactInfo('');
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
            >
              Submit Another Request
            </button>
            <Link
              to={`/customer/tickets/${result.id}`}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-1.5"
            >
              <span>View Ticket Conversation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* मुख्य तिकीट निर्मिती फॉर्म (Full Support Ticket Form) */
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* १. Subject */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Subject / Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Unable to process credit card payment or invoice question"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* २. Category & Platform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Department / Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                <option value="Technical Support">Technical Support</option>
                <option value="Billing & Invoicing">Billing & Invoicing</option>
                <option value="Account & Security">Account & Security</option>
                <option value="API & Integrations">API & Integrations</option>
                <option value="Feature Request">Feature Request</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Platform / Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                <option value="Web Application">Web Application (Browser)</option>
                <option value="Mobile App">Mobile App (iOS / Android)</option>
                <option value="REST API">REST API / Webhooks</option>
                <option value="Desktop">Desktop Client</option>
                <option value="Other">Other / Not Applicable</option>
              </select>
            </div>
          </div>

          {/* ३. Alternative Contact (Optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Contact Phone or Callback <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* ४. Detailed Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {charCount} characters
              </span>
            </div>
            <textarea
              required
              rows={5}
              placeholder="Please provide details about what happened, steps to reproduce, or what you need assistance with..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed transition-all"
            />
          </div>

          {/* ५. Error message or code snippet (Optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Error Message, URL or Code Snippet <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Error 500 on /checkout or screenshot link"
              value={errorDetails}
              onChange={(e) => setErrorDetails(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* सबमिट बटण */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !description.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Ticket...</span>
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
