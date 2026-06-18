import React, { useState, useEffect } from 'react';

export default function SitRepModal({ isOpen, onClose, rawContent, isLoading }) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setDisplayText('');
      return;
    }

    if (isLoading || !rawContent) {
      setDisplayText('');
      return;
    }

    let i = 0;
    setDisplayText('');
    const interval = setInterval(() => {
      if (i < rawContent.length) {
        setDisplayText((prev) => prev + rawContent.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [isOpen, rawContent, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 transition-opacity"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0F1C23] border border-[#A3E635]/30 rounded-[2rem] w-full max-w-2xl shadow-[0_0_50px_rgba(163,230,53,0.1)] flex flex-col max-h-[85dvh] overflow-hidden relative text-left"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-gray-500 hover:text-white text-xl z-10"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
        <div className="px-5 md:px-8 py-5 md:py-6 border-b border-white/10 flex items-center gap-3 shrink-0">
          <i className="fa-solid fa-robot text-[#A3E635] text-xl"></i>
          <div>
            <h3 className="text-white font-display font-bold text-base md:text-lg">Commander's SitRep</h3>
            <p className="text-[9px] md:text-[10px] text-gray-400 font-mono tracking-widest uppercase">
              AI Synthesized Tactical Briefing
            </p>
          </div>
        </div>
        <div className="p-5 md:p-8 overflow-y-auto">
          <div className="text-gray-300 font-mono text-xs md:text-sm leading-relaxed min-h-[150px] whitespace-pre-wrap">
            {isLoading ? (
              <span>
                <i className="fa-solid fa-circle-notch fa-spin text-[#A3E635] mr-2"></i>
                Analyzing live grid data...
              </span>
            ) : (
              displayText || rawContent
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
