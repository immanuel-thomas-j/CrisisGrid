import React from 'react';

export default function TicketModal({ ticket, isOpen, onClose }) {
  if (!isOpen || !ticket) return null;

  let headerTheme = 'bg-gray-50 border-gray-100 text-gray-700';
  let badgeTheme = 'bg-white border-gray-200 text-gray-600';

  if (ticket.level === '1' || ticket.level === 1) {
    headerTheme = 'bg-red-50 border-red-100 text-red-700';
    badgeTheme = 'bg-red-100 border-red-200 text-red-800';
  } else if (ticket.level === '2' || ticket.level === 2) {
    headerTheme = 'bg-orange-50 border-orange-100 text-orange-700';
    badgeTheme = 'bg-orange-100 border-orange-200 text-orange-800';
  } else if (ticket.level === '3' || ticket.level === 3) {
    headerTheme = 'bg-yellow-50 border-yellow-100 text-yellow-700';
    badgeTheme = 'bg-yellow-100 border-yellow-200 text-yellow-800';
  }

  const displayStatus = ticket.status ? ticket.status.replace('_', ' ').toUpperCase() : 'UNKNOWN';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-opacity"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className={`px-5 md:px-6 py-4 md:py-5 border-b flex justify-between items-center shrink-0 rounded-t-[2rem] ${headerTheme}`}>
          <div className="flex items-center gap-1.5 md:gap-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap">
              L{ticket.level} EVENT
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <span className={`text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm uppercase tracking-widest whitespace-nowrap ${badgeTheme}`}>
              {displayStatus}
            </span>
            <button
              onClick={onClose}
              className="text-current opacity-50 hover:opacity-100 transition-opacity text-lg md:text-xl"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div className="p-5 md:p-6 space-y-5 md:space-y-6 overflow-y-auto scrollbar-hide text-left">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-location-crosshairs text-blue-500"></i>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Precise Location</p>
            </div>
            <p className="font-bold text-gray-900 text-lg md:text-xl leading-tight">
              {ticket.location}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 font-mono mt-2 bg-gray-100 inline-block px-2 py-1 rounded-md border border-gray-200">
              {ticket.landmark || "No landmark specified"}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <i className="fa-solid fa-clipboard-list text-gray-400"></i> Operator Notes
            </p>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
              {ticket.notes || "No additional intelligence provided."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Subjects</p>
              <p className="font-bold text-gray-900 text-sm md:text-base">{ticket.subjects || 'Unknown'}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Threat Level</p>
              <p className="font-bold text-red-600 text-sm md:text-base">{ticket.threat || 'N/A'}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2">Recommended Asset</p>
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 p-3 rounded-xl inline-flex w-full sm:w-auto">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                  <i class="fa-solid fa-truck-medical text-white text-xs"></i>
                </div>
                <p className="font-bold text-blue-900 text-sm truncate">{ticket.asset || "TBD"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
