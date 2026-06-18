import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { getGroqApiKey } from '../utils/getGroqKey';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import TicketCard from '../components/TicketCard';
import TicketModal from '../components/TicketModal';
import SitRepModal from '../components/SitRepModal';
import LiveMap from '../components/LiveMap';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  
  const [isSitRepOpen, setIsSitRepOpen] = useState(false);
  const [sitRepContent, setSitRepContent] = useState('');
  const [isSitRepLoading, setIsSitRepLoading] = useState(false);

  // Play critical alarm
  const playCriticalAlarm = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (startTime) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, startTime); 
        gainNode.gain.setValueAtTime(0.1, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      };
      playBeep(ctx.currentTime);
      playBeep(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context blocked by browser auto-play rules.");
    }
  };

  // Toast notification system
  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Load grid data
  const loadGridData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error("Error loading tickets:", err.message);
    }
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    loadGridData();

    const channel = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        loadGridData(); 
        if (payload.eventType === 'INSERT') {
          showToast(`🚨 New L${payload.new.level} Incident: ${payload.new.location}`);
          if (String(payload.new.level) === '1') {
            playCriticalAlarm();
          }
        }
      })
      .subscribe();

    const interval = setInterval(loadGridData, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [loadGridData]);

  // Update ticket status
  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);
      if (error) throw error;
      loadGridData();
    } catch (err) {
      console.error("Error updating ticket status:", err.message);
    }
  };

  // Generate SitRep from active tickets
  const generateSitRep = async () => {
    setIsSitRepOpen(true);
    setIsSitRepLoading(true);
    setSitRepContent('');

    const activeTickets = tickets.filter((t) => t.status !== 'resolved');
    if (activeTickets.length === 0) {
      setSitRepContent("Grid is clear. No active incidents requiring Commander attention.");
      setIsSitRepLoading(false);
      return;
    }

    const promptData = activeTickets
      .map(
        (t) =>
          `[Level ${t.level}] ${t.title || t.location} at ${t.location}. Threat: ${t.threat}. Asset: ${t.asset}. Status: ${t.status}.`
      )
      .join('\n');

    const systemPrompt =
      "You are an AI Incident Commander running a crisis grid. Read the provided list of active emergencies. Write a brief, tactical Situation Report (SitRep) in a single paragraph. State the total number of active incidents, highlight the most critical priorities (Level 1s), identify imminent risks, and suggest a tactical directive (e.g. 'Recommend redirecting assets...'). Tone should be highly professional, military/tactical, and extremely concise. Do not use markdown, just plain text.";

    try {
      const apiKey = await getGroqApiKey();
      if (!apiKey) {
        setSitRepContent('GROQ API key not loaded. Please ensure VITE_GROQ_API_KEY is configured.');
        setIsSitRepLoading(false);
        return;
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `ACTIVE TICKETS:\n${promptData}` },
          ],
        }),
      });

      if (!response.ok) throw new Error('SitRep Generation Failed');
      const resData = await response.json();
      const text = resData.choices[0].message.content;
      setSitRepContent(text);
    } catch (err) {
      setSitRepContent('Error generating SitRep: Communication Uplink Failed.');
    } finally {
      setIsSitRepLoading(false);
    }
  };

  const handleOpenTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };

  const handleCloseTicketModal = () => {
    setIsTicketModalOpen(false);
    setSelectedTicket(null);
  };

  // Grouping tickets by status
  const pendingTickets = tickets.filter((t) => t.status === 'pending');
  const enRouteTickets = tickets.filter((t) => t.status === 'en_route');
  const onSceneTickets = tickets.filter((t) => t.status === 'on_scene');
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved');

  const criticalCount = tickets.filter((t) => t.status !== 'resolved' && String(t.level) === '1').length;
  const activeAssetsCount = enRouteTickets.length + onSceneTickets.length;
  const totalDispatches = tickets.length;
  const clearRate = totalDispatches === 0 ? 100 : Math.round((resolvedTickets.length / totalDispatches) * 100);

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden text-gray-900 antialiased p-2 md:p-4 gap-4 pb-20 md:pb-4 bg-[#F6F7F5]">
      {/* Toast Container */}
      <div id="toast-container" className="fixed top-6 right-4 md:right-6 z-[9999] flex flex-col gap-3 w-[90%] md:w-auto max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white border-l-4 border-red-500 shadow-xl rounded-lg p-3 md:p-4 text-xs md:text-sm font-bold text-slate-800 toast-enter flex items-center gap-3"
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Sidebar for Desktop */}
      <Sidebar onPurge={loadGridData} />

      {/* Main Panel */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white rounded-[2rem] shadow-sm border border-gray-200/60">
        <header className="py-3 md:py-0 md:h-20 border-b border-gray-100 flex flex-wrap items-center justify-between px-4 md:px-8 shrink-0 gap-3">
          <h1 className="text-xl md:text-2xl font-display font-bold text-gray-900 whitespace-nowrap">Operations Center</h1>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
            {criticalCount > 0 ? (
              <span className="bg-red-50 text-red-600 border border-red-100 px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 md:gap-2 shrink-0">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0"></span>
                <span className="whitespace-nowrap">Critical Alert</span>
              </span>
            ) : (
              <span className="bg-green-50 text-green-600 border border-green-100 px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 md:gap-2 shrink-0">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0"></span>
                <span className="whitespace-nowrap">Normal Ops</span>
              </span>
            )}
            <button
              onClick={generateSitRep}
              className="flex items-center gap-1.5 md:gap-2 bg-[#0F1C23] text-white border border-[#A3E635] px-4 md:px-5 py-2 rounded-full text-xs font-bold hover:bg-[#A3E635] hover:text-[#0F1C23] transition-colors shadow-sm whitespace-nowrap"
            >
              <i className="fa-solid fa-bolt"></i> SitRep
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 md:p-8 bg-[#F6F7F5]/50 flex flex-col">
          {/* KPI Dashboard and Live Map Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 shrink-0">
            <div className="lg:col-span-2 grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[1.5rem] border border-gray-100 shadow-sm card-lift">
                <div className="flex justify-between items-start mb-1 md:mb-2">
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider line-clamp-1">Critical L1</p>
                  <i className="fa-solid fa-triangle-exclamation text-red-500 text-xs md:text-sm"></i>
                </div>
                <h2 className="text-xl md:text-4xl font-display font-bold text-red-600">
                  {criticalCount.toString().padStart(2, '0')}
                </h2>
              </div>
              <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[1.5rem] border border-gray-100 shadow-sm card-lift">
                <div className="flex justify-between items-start mb-1 md:mb-2">
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider line-clamp-1">Active Assets</p>
                  <i className="fa-solid fa-truck-fast text-blue-500 text-xs md:text-sm"></i>
                </div>
                <h2 className="text-xl md:text-4xl font-display font-bold text-gray-900">
                  {activeAssetsCount.toString().padStart(2, '0')}
                </h2>
              </div>
              <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[1.5rem] border border-gray-100 shadow-sm card-lift">
                <div className="flex justify-between items-start mb-1 md:mb-2">
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider line-clamp-1">Dispatches</p>
                  <i className="fa-solid fa-layer-group text-purple-500 text-xs md:text-sm"></i>
                </div>
                <h2 className="text-xl md:text-4xl font-display font-bold text-gray-900">
                  {totalDispatches.toString().padStart(2, '0')}
                </h2>
              </div>
              <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[1.5rem] border border-gray-100 shadow-sm card-lift">
                <div className="flex justify-between items-start mb-1 md:mb-2">
                  <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider line-clamp-1">Clear Rate</p>
                  <i className="fa-solid fa-check-circle text-[#A3E635] text-xs md:text-sm"></i>
                </div>
                <h2 className="text-xl md:text-4xl font-display font-bold text-[#65A30D]">
                  {clearRate}%
                </h2>
              </div>
            </div>

            {/* Live Map Panel */}
            <div className="bg-[#0F1C23] rounded-2xl md:rounded-[1.5rem] shadow-sm relative overflow-hidden border border-gray-200 h-[250px] md:h-full md:min-h-[300px] shrink-0 w-full">
              <LiveMap tickets={tickets} />
              <div className="absolute bottom-3 left-3 text-[9px] md:text-[10px] font-mono text-[#A3E635] tracking-widest uppercase z-20 pointer-events-none drop-shadow-md bg-black/50 px-2 py-1 rounded">
                SAT-LINK ACTIVE
              </div>
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="flex flex-nowrap lg:grid lg:grid-cols-4 gap-4 md:gap-6 overflow-x-auto lg:overflow-x-visible pb-4 snap-x snap-mandatory flex-1 scrollbar-hide min-h-[65vh] lg:min-h-0">
            {/* Pending Column */}
            <div className="flex flex-col gap-3 md:gap-4 min-w-[85vw] sm:min-w-[300px] lg:min-w-0 snap-center h-full">
              <div className="flex items-center gap-2 pb-1 md:pb-2 shrink-0">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                <h3 className="text-[10px] md:text-xs font-bold text-gray-900 uppercase tracking-widest">
                  Pending ({pendingTickets.length})
                </h3>
              </div>
              <div className="flex flex-col gap-3 md:gap-4 overflow-y-auto pb-4 scrollbar-hide flex-1 pr-1 md:pr-2">
                {pendingTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onOpenModal={handleOpenTicketModal}
                    onUpdateStatus={updateTicketStatus}
                  />
                ))}
              </div>
            </div>

            {/* En Route Column */}
            <div className="flex flex-col gap-3 md:gap-4 min-w-[85vw] sm:min-w-[300px] lg:min-w-0 snap-center h-full">
              <div className="flex items-center gap-2 pb-1 md:pb-2 shrink-0">
                <div className="w-2.5 h-2.5 bg-orange-400 rounded-full"></div>
                <h3 className="text-[10px] md:text-xs font-bold text-gray-900 uppercase tracking-widest">
                  En Route ({enRouteTickets.length})
                </h3>
              </div>
              <div className="flex flex-col gap-3 md:gap-4 overflow-y-auto pb-4 scrollbar-hide flex-1 pr-1 md:pr-2">
                {enRouteTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onOpenModal={handleOpenTicketModal}
                    onUpdateStatus={updateTicketStatus}
                  />
                ))}
              </div>
            </div>

            {/* On Scene Column */}
            <div className="flex flex-col gap-3 md:gap-4 min-w-[85vw] sm:min-w-[300px] lg:min-w-0 snap-center h-full">
              <div className="flex items-center gap-2 pb-1 md:pb-2 shrink-0">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                <h3 className="text-[10px] md:text-xs font-bold text-gray-900 uppercase tracking-widest">
                  On Scene ({onSceneTickets.length})
                </h3>
              </div>
              <div className="flex flex-col gap-3 md:gap-4 overflow-y-auto pb-4 scrollbar-hide flex-1 pr-1 md:pr-2">
                {onSceneTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onOpenModal={handleOpenTicketModal}
                    onUpdateStatus={updateTicketStatus}
                  />
                ))}
              </div>
            </div>

            {/* Resolved Column */}
            <div className="flex flex-col gap-3 md:gap-4 min-w-[85vw] sm:min-w-[300px] lg:min-w-0 snap-center h-full">
              <div className="flex items-center gap-2 pb-1 md:pb-2 shrink-0">
                <div className="w-2.5 h-2.5 bg-gray-300 rounded-full"></div>
                <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Resolved ({resolvedTickets.length})
                </h3>
              </div>
              <div className="flex flex-col gap-3 md:gap-4 overflow-y-auto pb-4 scrollbar-hide flex-1 pr-1 md:pr-2">
                {resolvedTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onOpenModal={handleOpenTicketModal}
                    onUpdateStatus={updateTicketStatus}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Ticket Details Modal */}
      <TicketModal
        ticket={selectedTicket}
        isOpen={isTicketModalOpen}
        onClose={handleCloseTicketModal}
      />

      {/* SitRep Modal */}
      <SitRepModal
        isOpen={isSitRepOpen}
        onClose={handleCloseSitRepModal => setIsSitRepOpen(false)}
        rawContent={sitRepContent}
        isLoading={isSitRepLoading}
      />
    </div>
  );
}
