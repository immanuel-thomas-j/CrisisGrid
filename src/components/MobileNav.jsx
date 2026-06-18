import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MobileNav() {
  const { logOut } = useAuth();
  const location = useLocation();

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `flex flex-col items-center gap-1.5 ${
      isActive ? 'text-[#A3E635]' : 'text-gray-500 hover:text-gray-300 transition-colors'
    }`;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F1C23] border-t border-gray-800 flex justify-around items-center px-2 py-3 z-[9000] pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
      <Link to="/dashboard" className={getLinkClass('/dashboard')}>
        <i className="fa-solid fa-map-location-dot text-lg"></i>
        <span className="text-[9px] font-bold uppercase tracking-wider">Grid</span>
      </Link>
      <Link to="/triage" className={getLinkClass('/triage')}>
        <i className="fa-solid fa-microchip text-lg"></i>
        <span className="text-[9px] font-bold uppercase tracking-wider">Triage</span>
      </Link>
      <Link to="/analytics" className={getLinkClass('/analytics')}>
        <i className="fa-solid fa-chart-pie text-lg"></i>
        <span className="text-[9px] font-bold uppercase tracking-wider">Stats</span>
      </Link>
      <button
        onClick={logOut}
        className="flex flex-col items-center gap-1.5 text-red-500/70 hover:text-red-500 transition-colors"
      >
        <i className="fa-solid fa-power-off text-lg"></i>
        <span className="text-[9px] font-bold uppercase tracking-wider">Exit</span>
      </button>
    </nav>
  );
}
