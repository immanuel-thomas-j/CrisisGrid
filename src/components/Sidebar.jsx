import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

export default function Sidebar({ onPurge }) {
  const { user, logOut } = useAuth();
  const location = useLocation();

  const handlePurge = async () => {
    if (!window.confirm("Erase all demo tickets?")) return;
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      if (onPurge) onPurge();
    } catch (err) {
      console.error("Error purging database:", err.message);
      alert("Failed to purge database.");
    }
  };

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    if (isActive) {
      return "flex items-center justify-between px-4 py-3 bg-[#A3E635] text-[#0F1C23] rounded-full text-sm font-bold shadow-[0_4px_15px_rgba(163,230,53,0.3)] transition-transform hover:-translate-y-1";
    }
    return "flex items-center justify-between px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-full text-sm font-medium transition-colors";
  };

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Operator';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName[0])}&background=A3E635&color=0F1C23`;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0F1C23] rounded-[2rem] p-6 shrink-0 shadow-xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#A3E635] opacity-10 rounded-full blur-2xl"></div>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 bg-[#A3E635] rounded-full flex items-center justify-center">
          <i className="fa-solid fa-satellite-dish text-[#0F1C23] text-xs"></i>
        </div>
        <span className="font-display font-bold text-white tracking-widest text-lg">CRISISGRID</span>
      </div>
      <nav className="flex-1 space-y-3">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Operations</p>
        <Link to="/dashboard" className={getLinkClass('/dashboard')}>
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-map-location-dot"></i> Active Grid
          </span>
        </Link>
        <Link to="/triage" className={getLinkClass('/triage')}>
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-microchip"></i> AI Triage
          </span>
        </Link>
        <Link to="/analytics" className={getLinkClass('/analytics')}>
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-chart-pie"></i> Analytics
          </span>
        </Link>
      </nav>

      {location.pathname === '/dashboard' && (
        <button
          onClick={handlePurge}
          className="mb-4 text-xs font-bold text-red-500 border border-red-500/30 hover:bg-red-500/10 py-2 rounded-xl transition-colors"
        >
          <i className="fa-solid fa-trash-can mr-1"></i> Purge Grid Demo
        </button>
      )}

      <div
        onClick={logOut}
        className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-red-500/10 transition-colors group"
      >
        <img
          id="user-avatar"
          src={userAvatar}
          alt="User Avatar"
          referrerPolicy="no-referrer"
          className="w-10 h-10 rounded-full border-2 border-[#0F1C23]"
        />
        <div className="min-w-0 flex-1">
          <p id="user-name" className="text-xs font-bold text-white truncate">
            {userName}
          </p>
          <p className="text-[10px] text-gray-400 group-hover:text-red-400 transition-colors flex items-center gap-1">
            <i className="fa-solid fa-power-off"></i> Disconnect
          </p>
        </div>
      </div>
    </aside>
  );
}
