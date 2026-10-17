import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const updated = await updateUserProfile(name);
      updateUser({ name: updated.name });
      setMsg('Profile updated successfully!');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-blue-500/20">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{user?.name}</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 uppercase font-mono">
                {user?.role === 'agent' ? `${user?.agent_level || 'Standard'} Agent` : user?.role}
              </span>
              {user?.customer_type && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  user?.customer_type === 'VIP' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  user?.customer_type === 'Premium' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                  'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {user?.customer_type} Plan
                </span>
              )}
            </div>
          </div>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs">
            ✅ {msg}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full rounded-xl bg-slate-950/50 border border-slate-800/80 px-3.5 py-2.5 text-xs text-slate-500 font-mono cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Account emails are permanently linked and verified.</span>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <a
              href="/change-password"
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Change Password →
            </a>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
