import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, ArrowRight, Database, ShieldCheck } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 animate-slide-up">
          <div className="w-20 h-20 bg-primary-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-primary-500/30 mx-auto mb-6 rotate-3">
            <Database size={36} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">NexusData</h1>
          <p className="text-slate-500 font-medium italic">Secure Data Intelligence Platform</p>
        </div>

        <div className="glass-card p-10 shadow-2xl shadow-slate-200 border-white/50 backdrop-blur-3xl animate-scale-in">
          <div className="flex gap-4 mb-8 p-1.5 bg-slate-100 rounded-2xl">
            <button 
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isSignUp ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${isSignUp ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  className="input-field pl-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="input-field pl-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl text-sm font-bold animate-slide-up flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                <ShieldCheck size={18} />
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full primary-button py-4 text-lg font-black group"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {isSignUp ? 'Create Intelligence Account' : 'Access Dashboard'}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-400 text-sm font-medium">
          By continuing, you agree to NexusData's Security Protocols.
        </p>
      </div>
    </div>
  );
};

export default Auth;
