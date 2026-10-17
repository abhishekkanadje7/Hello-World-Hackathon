import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api';
import { 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function ChangePasswordPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isMatch = newPassword && newPassword === confirmPassword;

  let strengthScore = 0;
  if (hasMinLength) strengthScore += 1;
  if (hasLetter) strengthScore += 1;
  if (hasNumber) strengthScore += 1;
  if (newPassword.length >= 12 && /[^A-Za-z0-9]/.test(newPassword)) strengthScore += 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError("New password must be at least 8 characters long and contain at least one letter and one number.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await changePassword(currentPassword, newPassword);
      updateUser({ must_change_password: false });
      setSuccess("Password updated successfully! Redirecting...");
      setTimeout(() => {
        if (user.role === 'customer') {
          navigate('/customer/tickets');
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
          <Key className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-white">Change Password</h1>
        {user?.must_change_password ? (
          <p className="text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-xl max-w-sm mx-auto">
            Security requirement: You must change your temporary password before accessing the system.
          </p>
        ) : (
          <p className="text-sm text-slate-400">Update your account credentials to keep your profile secure</p>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Current Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0070C0]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0070C0]"
              />
            </div>
          </div>

          {newPassword && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Strength:</span>
                <span className={`font-bold ${
                  strengthScore <= 1 ? 'text-rose-400' :
                  strengthScore === 2 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {strengthScore <= 1 ? 'Weak' : strengthScore === 2 ? 'Medium' : 'Strong'}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    strengthScore <= 1 ? 'bg-rose-500 w-1/3' :
                    strengthScore === 2 ? 'bg-amber-500 w-2/3' :
                    'bg-emerald-500 w-full'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                <div className={`flex items-center space-x-1 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasMinLength ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center space-x-1 ${hasLetter ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasLetter ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>Letter</span>
                </div>
                <div className={`flex items-center space-x-1 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasNumber ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>Number</span>
                </div>
                <div className={`flex items-center space-x-1 ${isMatch ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isMatch ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>Match</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0070C0]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword}
            className="w-full py-3 bg-[#0070C0] hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
