import React, { useState, useEffect } from 'react';

export default function TicketCard({ ticket, onOpenModal, onUpdateStatus }) {
  const [timeLeft, setTimeLeft] = useState(300);
  const [isEscalated, setIsEscalated] = useState(false);

  const createdAt = new Date(ticket.time_string || ticket.created_at).getTime();

  useEffect(() => {
    if (ticket.status !== 'pending') return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const diff = Math.floor((now - createdAt) / 1000);
      const SLA = 300;

      if (diff >= SLA) {
        setIsEscalated(true);
        setTimeLeft(0);
      } else {
        setIsEscalated(false);
        setTimeLeft(SLA - diff);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [createdAt, ticket.status]);

  const formatTimeLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const levelStr = String(ticket.level);
  const theme = {
    '1': { line: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-100' },
    '2': { line: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-100' },
    '3': { line: 'bg-yellow-500', badge: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    'default': { line: 'bg-gray-500', badge: 'bg-gray-50 text-gray-700 border-gray-100' }
  };

  const tTheme = theme[levelStr] || theme.default;

  return (
    <div
      onClick={() => onOpenModal(ticket)}
      className={`ticket-card bg-white border rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 shadow-sm card-lift relative overflow-hidden cursor-pointer ${
        ticket.status === 'resolved' ? 'opacity-60 grayscale' : ''
      } ${isEscalated && ticket.status === 'pending' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-gray-100'}`}
    >
      <div className={`absolute top-0 left-0 w-1 md:w-1.5 h-full ${tTheme.line}`}></div>
      <div className="pl-2 flex flex-col h-full text-left">
        <div className="flex justify-between items-start mb-2 md:mb-3 gap-2">
          <span className={`text-[9px] md:text-[10px] font-bold ${tTheme.badge} px-2 py-0.5 rounded-full shrink-0`}>
            LEVEL {levelStr}
          </span>
          <span className={`text-[9px] md:text-[10px] shrink-0 ${ticket.status === 'pending' ? 'text-red-500 font-bold' : 'text-gray-400 font-medium'}`}>
            <i className="fa-regular fa-clock"></i> {timeAgo(ticket.time_string || ticket.created_at)}
          </span>
        </div>
        <h4 className="text-sm md:text-base font-bold text-gray-900 mb-1 leading-tight break-words">
          {ticket.title || ticket.location || 'Unknown Incident'}
        </h4>
        <p className="text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4 truncate w-full pr-2">
          {ticket.subjects || 'Unknown'}
        </p>
        
        <div className="mt-auto space-y-1.5 md:space-y-2">
          <div className="text-[9px] md:text-[10px] bg-gray-50 text-gray-700 px-2 py-1.5 rounded-lg font-bold border border-gray-200 flex items-start gap-1.5 shadow-sm">
            <i className="fa-solid fa-truck-medical text-blue-500 mt-0.5 shrink-0"></i>
            <span className="leading-tight">{ticket.asset || 'UNSPECIFIED'}</span>
          </div>
          
          {ticket.status === 'pending' && (
            isEscalated ? (
              <div className="pending-timer mt-2 md:mt-3 text-[9px] md:text-[10px] font-bold text-red-600 bg-red-50 py-1 md:py-1.5 px-2 rounded-lg border border-red-200 flex items-center justify-center gap-1 animate-pulse">
                <i className="fa-solid fa-triangle-exclamation"></i> ESCALATED
              </div>
            ) : (
              <div className="pending-timer mt-2 md:mt-3 text-[9px] md:text-[10px] font-bold text-gray-500 bg-gray-50 py-1 md:py-1.5 px-2 rounded-lg border border-gray-200 flex items-center justify-center gap-1">
                <i className="fa-regular fa-clock"></i> Dispatch in: {formatTimeLeft(timeLeft)}
              </div>
            )
          )}

          {ticket.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(ticket.id, 'en_route');
              }}
              className="mt-2 md:mt-3 w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 py-1.5 md:py-2 rounded-xl text-[10px] font-bold shadow-sm"
            >
              <i className="fa-solid fa-truck-fast mr-1"></i> Dispatch
            </button>
          )}

          {ticket.status === 'en_route' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(ticket.id, 'on_scene');
              }}
              className="mt-2 md:mt-3 w-full bg-orange-50 border border-orange-100 text-orange-600 hover:bg-orange-100 py-1.5 md:py-2 rounded-xl text-[10px] font-bold shadow-sm"
            >
              <i className="fa-solid fa-location-dot mr-1"></i> On-Scene
            </button>
          )}

          {ticket.status === 'on_scene' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(ticket.id, 'resolved');
              }}
              className="mt-2 md:mt-3 w-full bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 py-1.5 md:py-2 rounded-xl text-[10px] font-bold shadow-sm"
            >
              <i className="fa-solid fa-check-double mr-1"></i> Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
