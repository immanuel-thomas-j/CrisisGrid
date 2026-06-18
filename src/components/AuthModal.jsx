import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

export default function AuthModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      // Let the browser paint before triggering transition
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Connection refused. Please try again.');
      setLoading(false);
    }
  };

  if (!rendered) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300 p-4 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`glass-panel w-full max-w-sm p-8 rounded-[2rem] border-t border-t-primary/50 shadow-2xl relative transform transition-transform duration-300 ${
          visible ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-primary/20 shadow-[0_0_15px_rgba(163,230,53,0.1)]">
            <i className="fa-solid fa-shield-halved text-primary text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">System Login</h2>
          <p className="text-xs text-gray-400 font-mono tracking-widest">OPERATOR ACCESS REQUIRED</p>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-slate-900 py-4 rounded-full text-sm font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,255,255,0.2)] flex justify-center items-center gap-3 disabled:opacity-80 disabled:cursor-wait disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i> Establishing Connection...
            </>
          ) : (
            <>
              <i className="fa-brands fa-google text-lg"></i> Sign in with Google
            </>
          )}
        </button>

        {error && (
          <div className="text-alert text-xs font-mono bg-alert/10 border border-alert/20 p-3 rounded-xl mt-4 text-center">
            {error}
          </div>
        )}

        <div className="mt-8 text-center border-t border-white/5 pt-4">
          <p className="text-[10px] text-gray-500 font-mono leading-relaxed px-4">
            <span className="text-primary font-bold">SYSTEM NOTICE:</span> Only authorized dispatchers may access the active grid.
          </p>
        </div>
      </div>
    </div>
  );
}
