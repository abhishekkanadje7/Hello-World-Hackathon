import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  User, 
  Clock,
  Sparkles,
  Radio
} from 'lucide-react';
import { logTicketCall } from '../api';

export default function VoiceCallModal({
  isOpen,
  onClose,
  recipientName = 'Support Specialist',
  recipientRole = 'Support Specialist',
  ticketId,
  ticketNumber = '',
  onCallCompleted
}) {
  if (!isOpen) return null;

  const [callState, setCallState] = useState('calling'); // 'calling' | 'connected' | 'ended'
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [ending, setEnding] = useState(false);

  // Timer ref
  const timerRef = useRef(null);

  // Auto transition from calling to connected after 2.5 seconds
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallState('connected');
    }, 2400);

    return () => clearTimeout(connectTimer);
  }, []);

  // Duration counter when connected
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleEndCall = async () => {
    if (ending) return;
    setEnding(true);
    setCallState('ended');
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      if (ticketId) {
        await logTicketCall(ticketId, Math.max(1, seconds), 'Completed');
      }
      if (onCallCompleted) {
        onCallCompleted(seconds);
      }
    } catch (e) {
      console.warn('Call log failed:', e);
    } finally {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center text-white shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow backdrop effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Info */}
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300 font-mono">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Encrypted In-App Audio Call</span>
          </div>
          {ticketNumber && (
            <p className="text-[11px] text-slate-400 font-mono pt-1">
              Ticket: {ticketNumber}
            </p>
          )}
        </div>

        {/* Avatar & Pulse */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl transition-all ${
              callState === 'connected' ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 ring-4 ring-emerald-500/30' :
              callState === 'ended' ? 'bg-slate-700 ring-4 ring-slate-600/30' :
              'bg-gradient-to-tr from-blue-600 to-indigo-500 animate-pulse ring-4 ring-blue-500/30'
            }`}>
              <User className="w-10 h-10" />
            </div>

            {callState === 'connected' && (
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px]">
                ✓
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-white mt-4 tracking-tight">
            {recipientName}
          </h3>
          <p className="text-xs text-slate-400 capitalize">
            {recipientRole}
          </p>

          {/* Call Status / Timer */}
          <div className="mt-2 text-sm font-mono font-semibold">
            {callState === 'calling' && (
              <span className="text-blue-400 flex items-center space-x-1.5">
                <span className="animate-pulse">Calling</span>
                <span className="tracking-widest">...</span>
              </span>
            )}
            {callState === 'connected' && (
              <span className="text-emerald-400 flex items-center space-x-1.5 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{formatDuration(seconds)}</span>
              </span>
            )}
            {callState === 'ended' && (
              <span className="text-slate-400">Call Ended ({formatDuration(seconds)})</span>
            )}
          </div>
        </div>

        {/* Voice Waveform Simulation */}
        {callState === 'connected' && (
          <div className="flex items-center justify-center space-x-1 py-1">
            {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 35, 70].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-emerald-400/80 rounded-full transition-all duration-150 animate-pulse"
                style={{
                  height: `${Math.max(8, isMuted ? 4 : h * 0.35)}px`,
                  animationDelay: `${(i * 0.08)}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Call Controls */}
        <div className="flex items-center justify-center space-x-4 pt-2">
          {/* Mute Button */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            disabled={ending}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg hover:shadow-red-500/30 transition-all hover:scale-105"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Speaker Button */}
          <button
            type="button"
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              !isSpeakerOn ? 'bg-slate-800/40 text-slate-500' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isSpeakerOn ? 'Mute speaker' : 'Enable speaker'}
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        <p className="text-[10px] text-slate-500">
          Audio session is automatically logged into the ticket audit record.
        </p>
      </div>
    </div>
  );
}
