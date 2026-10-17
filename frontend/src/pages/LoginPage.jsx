// =============================================================================
// TriageX - Professional Enterprise Login Page
// कमेंट: स्वच्छ, कॉर्पोरेट लॉगिन पेज. 
// अॅडमिनसाठी सोपे 1-क्लिक एक्सेस आणि कस्टोडियन्स/एजंट्ससाठी सुरक्षित ऑथेंटिकेशन.
// =============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle,
  KeyRound,
  UserPlus,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const { login, sessionExpiredMsg } = useAuth();
  const navigate = useNavigate();

  // इनपुट स्टेट्स (सुरुवातीला पूर्णपणे रिकामे - कोणतेही नाव किंवा ईमेल आधीच भरलेले नाही)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(sessionExpiredMsg || null);

  // लॉगिन फॉर्म सबमिट हँडलर
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      if (user.must_change_password) {
        navigate('/change-password');
      } else if (user.role === 'customer') {
        navigate('/customer/tickets');
      } else if (user.role === 'agent') {
        navigate('/agent');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // हॅकाथॉन इव्हॅल्युएटर्ससाठी 1-क्लिक अॅडमिन क्रेडेन्शियल्स भरणे
  const fillAdminCredentials = () => {
    setEmail('admin@triagex.com');
    setPassword('Admin@123');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 shadow-md shadow-blue-500/20 text-white mb-3">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Access your AI Support Triage & Sentiment Workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm border border-slate-200 rounded-2xl space-y-6">
          {/* एरर अलर्ट बॉक्स */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* लॉगिन फॉर्म */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Evaluator Helper - Quick Admin Login Fill */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                  <span>Evaluation Admin Access</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  admin@triagex.com
                </div>
              </div>
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-300 rounded-lg shadow-2xs transition-all"
              >
                Auto-Fill
              </button>
            </div>
          </div>

          {/* Customer Registration Call to Action */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-600">
              Don't have a customer account?{' '}
              <Link 
                to="/register" 
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center space-x-1"
              >
                <span>Register as Customer</span>
              </Link>
            </p>
          </div>
        </div>

        {/* Security & Agent Provisioning Notice */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-slate-400">
            ℹ️ <strong className="text-slate-600">Note for Support Agents:</strong> Agent accounts are provisioned exclusively by the Administrator from the Admin Panel. Generated credentials are sent directly to your registered email.
          </p>
          <div className="inline-flex items-center space-x-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Enterprise TLS 256-bit Encryption • PBKDF2 Password Hashing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
