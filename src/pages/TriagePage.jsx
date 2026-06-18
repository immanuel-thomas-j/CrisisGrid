import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { getGroqApiKey } from '../utils/getGroqKey';
import useSpeechToText from '../hooks/useSpeechToText';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';

export default function TriagePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Geolocation states
  const [gpsStatus, setGpsStatus] = useState('GPS Offline. Awaiting lock.');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  // Input states
  const [inputText, setInputText] = useState(
    'Massive pileup on Highway 9 near exit 4B. A fuel tanker is overturned and leaking. Multiple people trapped. Need heavy rescue.'
  );

  // Triage state
  const [statusState, setStatusState] = useState('empty'); // 'empty' | 'loading' | 'output'
  const [isProcessing, setIsProcessing] = useState(false);
  const [triageData, setTriageData] = useState(null);

  // Push button state
  const [pushStatus, setPushStatus] = useState('idle'); // 'idle' | 'pushing' | 'pushed' | 'failed'

  // SMS simulation states
  const [smsVisible, setSmsVisible] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [smsSimulating, setSmsSimulating] = useState(false);

  // Speech to text hook
  const { supported: speechSupported, isListening, listen } = useSpeechToText();

  const getGPSLock = () => {
    setGpsStatus('Acquiring satellites...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setLat(latitude);
          setLng(longitude);
          setGpsStatus(`Lock Acquired: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        (error) => {
          setGpsStatus('Lock Failed. Using default sector.');
          setLat(40.7128);
          setLng(-74.0060);
        }
      );
    } else {
      setGpsStatus('GPS Not Supported.');
    }
  };

  const handleSpeechInput = () => {
    listen((text) => {
      setInputText(text);
      triggerTriage(text);
    });
  };

  const triggerTriage = async (textToProcess) => {
    const text = textToProcess || inputText;
    if (!text.trim()) {
      alert('Please enter an intercept text.');
      return;
    }

    setIsProcessing(true);
    setStatusState('loading');
    setPushStatus('idle');

    // Default coordinates in case GPS is not acquired
    const currentLat = lat || 40.7128;
    const currentLng = lng || -74.0060;

    const systemPrompt = `You are an emergency triage AI. Return JSON. 
    If user device coordinates are provided (${currentLat}, ${currentLng}), generate realistic 'lat' and 'lng' floats for the incident nearby.
    Keys required: { 'location': 'string', 'lat': number, 'lng': number, 'subjects': 'string', 'notes': 'string', 'threat': 'string', 'asset': 'string', 'eta': 'string (e.g. 4m)', 'level': 'number 1-3 (1 is highest)', 'title': 'string' }`;

    try {
      const apiKey = await getGroqApiKey();
      if (!apiKey) {
        setStatusState('empty');
        setIsProcessing(false);
        alert('GROQ API key not loaded. Please ensure VITE_GROQ_API_KEY is configured.');
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
            { role: 'user', content: text },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) throw new Error('Groq API Error');
      const data = await response.json();
      const parsedData = JSON.parse(data.choices[0].message.content);

      // fallback coords if not provided by LLM
      parsedData.lat = parsedData.lat || currentLat + (Math.random() - 0.5) * 0.05;
      parsedData.lng = parsedData.lng || currentLng + (Math.random() - 0.5) * 0.05;

      setTriageData(parsedData);
      setStatusState('output');
    } catch (error) {
      console.error(error);
      alert('Triage failed.');
      setStatusState('empty');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateSMS = () => {
    setSmsSimulating(true);
    const msgs = [
      'HELP! The dam just broke, water is rising fast at the elementary school. We have 40 kids trapped on the second floor, need boats NOW!',
      'Massive explosion at the chemical plant on Industrial Blvd. Lots of casualties, green smoke everywhere. People cannot breathe.',
      'Active shooter at the Downtown Metro Hub. Multiple down. Please hurry, hiding in the bathroom.',
      'My roof just caved in from the snowstorm! Trapped in my living room on 5th avenue. I can smell gas leaking.',
      'Emergency! Major derailment of the freight train near the river crossing. Train cars in the water, looks like toxic spill.',
    ];

    const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
    setSmsText(randomMsg);
    setSmsVisible(true);

    setTimeout(() => {
      setSmsVisible(false);
      setInputText(randomMsg);
      setSmsSimulating(false);
      triggerTriage(randomMsg);
    }, 3000);
  };

  const saveTicketToGrid = async () => {
    if (!triageData) return;
    setPushStatus('pushing');

    const isoTime = new Date().toISOString();
    try {
      const { error } = await supabase.from('tickets').insert([
        {
          location: triageData.location,
          landmark: triageData.landmark || '',
          subjects: triageData.subjects,
          notes: triageData.notes,
          threat: triageData.threat,
          asset: triageData.asset,
          level: String(triageData.level),
          title: triageData.title || triageData.location,
          time_string: isoTime,
          status: 'pending',
          lat: triageData.lat,
          lng: triageData.lng,
        },
      ]);

      if (error) throw error;
      setPushStatus('pushed');
    } catch (err) {
      console.error(err);
      setPushStatus('failed');
    }
  };

  const simulateMassCasualty = async () => {
    const confirm = window.confirm("Initiate Mass Casualty Simulation? This will insert 3 critical incidents immediately.");
    if (!confirm) return;

    const payloads = [
      {
        location: 'Downtown Metro Hub',
        landmark: 'Central Station Platform 2',
        lat: 40.7128,
        lng: -74.006,
        subjects: '150+ Civilians',
        threat: 'Fire',
        asset: 'HAZMAT Unit',
        level: '1',
        title: 'Tunnel Collapse',
        time_string: new Date(Date.now() - 600000).toISOString(),
      },
      {
        location: 'Riverfront Bridge',
        landmark: 'Southbound Lane G',
        lat: 40.715,
        lng: -74.01,
        subjects: '12 Vehicles',
        threat: 'Collapse',
        asset: 'Marine Rescue',
        level: '1',
        title: 'Bridge Pileup',
        time_string: new Date(Date.now() - 300000).toISOString(),
      },
      {
        location: 'Sector 4 Substation',
        landmark: 'Grid Node Alpha',
        lat: 40.72,
        lng: -73.99,
        subjects: 'None Visible',
        threat: 'Electrocution',
        asset: 'Utility Control',
        level: '2',
        title: 'Substation Fire',
        time_string: new Date().toISOString(),
      },
    ];

    try {
      for (const t of payloads) {
        await supabase.from('tickets').insert([
          {
            location: t.location,
            landmark: t.landmark,
            subjects: t.subjects,
            threat: t.threat,
            asset: t.asset,
            level: t.level,
            title: t.title,
            time_string: t.time_string,
            lat: t.lat,
            lng: t.lng,
            status: 'pending',
          },
        ]);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to run simulation.');
    }
  };

  // Color mappings
  const getLevelClasses = (lvl) => {
    const levelStr = String(lvl);
    if (levelStr === '1') {
      return {
        header: 'bg-red-50 border-red-100',
        title: 'text-xs font-bold text-red-700 uppercase tracking-widest',
        pulse: 'w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse',
        badge: 'bg-red-50 text-red-700 border-red-100',
        text: 'CRITICAL ALERT',
      };
    } else if (levelStr === '2') {
      return {
        header: 'bg-orange-50 border-orange-100',
        title: 'text-xs font-bold text-orange-700 uppercase tracking-widest',
        pulse: 'w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse',
        badge: 'bg-orange-50 text-orange-700 border-orange-100',
        text: 'ELEVATED ALERT',
      };
    } else {
      return {
        header: 'bg-yellow-50 border-yellow-100',
        title: 'text-xs font-bold text-yellow-700 uppercase tracking-widest',
        pulse: 'w-2.5 h-2.5 bg-yellow-500 rounded-full',
        badge: 'bg-yellow-50 text-yellow-700 border-yellow-100',
        text: 'STANDARD DISPATCH',
      };
    }
  };

  const levelClasses = triageData ? getLevelClasses(triageData.level) : {};

  return (
    <div className="h-screen w-full flex overflow-hidden text-gray-900 antialiased p-2 md:p-4 gap-4 bg-[#F6F7F5]">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Panel split in half */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white rounded-[2rem] shadow-sm border border-gray-200/60">
        
        {/* Left Side: Input Form */}
        <div className="w-full lg:w-1/2 border-r border-gray-100 p-8 md:p-12 flex flex-col h-full overflow-y-auto relative text-left">
          <div className="mb-10">
            <h2 className="text-3xl font-display font-bold text-[#0F1C23]">AI Triage Engine</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Process unstructured distress calls. The system will acquire local GPS telemetry to plot assets on the live map.
            </p>
          </div>

          <div className="flex-1 flex flex-col">
            {/* GPS Telemetry Box */}
            <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 p-3 rounded-xl">
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                  <i className="fa-solid fa-location-crosshairs mr-1"></i> Telemetry Status
                </p>
                <p id="gps-status" className="text-xs font-mono text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: gpsStatus }}></p>
              </div>
              <button
                onClick={getGPSLock}
                className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm"
              >
                Acquire GPS
              </button>
            </div>

            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <i className="fa-solid fa-terminal mr-1"></i> Raw Intercept Input
              </label>
              {speechSupported && (
                <button
                  id="micBtn"
                  onClick={handleSpeechInput}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors shadow-sm flex items-center gap-2 ${
                    isListening ? 'bg-white text-slate-900 border border-slate-200' : 'bg-[#0F1C23] text-white'
                  }`}
                >
                  {isListening ? (
                    <>
                      <i className="fa-solid fa-record-vinyl animate-pulse text-red-500"></i> Recording...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-microphone"></i> Live Radio
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Input & SMS Overlay */}
            <div className="relative mb-6">
              {/* Fake SMS Notification Bubble */}
              <div
                id="smsNotification"
                className={`absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-4 w-[90%] flex items-start gap-3 transition-all duration-500 transform z-50 ${
                  smsVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-8 opacity-0 pointer-events-none'
                }`}
              >
                <div className="bg-green-500 w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                  <i className="fa-solid fa-message text-white"></i>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    Incoming SMS Intercept
                  </p>
                  <p id="smsContent" className="text-sm font-medium text-gray-900 leading-tight">
                    {smsText}
                  </p>
                </div>
              </div>

              <textarea
                id="inputText"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-40 bg-[#F6F7F5] border border-gray-200 rounded-[1.5rem] p-6 text-sm font-mono text-[#0F1C23] resize-none transition-colors focus:ring-1 focus:ring-[#0F1C23]"
              />
            </div>

            {/* Control buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              <button
                id="generateBtn"
                onClick={() => triggerTriage(null)}
                disabled={isProcessing}
                className="w-full bg-[#0F1C23] text-white text-xs font-bold py-4 rounded-xl transition-all duration-300 hover-lift shadow-[0_10px_20px_rgba(15,28,35,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin mr-1"></i> Processing...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-brain mr-1"></i> Run AI Triage
                  </>
                )}
              </button>
              <button
                id="smsBtn"
                onClick={simulateSMS}
                disabled={smsSimulating}
                className="w-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold py-4 rounded-xl transition-all duration-300 hover-lift shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {smsSimulating ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin mr-1"></i> Receiving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-comment-sms mr-1"></i> Simulate SMS
                  </>
                )}
              </button>
              <button
                id="demoSeedBtn"
                onClick={simulateMassCasualty}
                className="w-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold py-4 rounded-xl transition-all duration-300 hover-lift shadow-sm group"
              >
                <i className="fa-solid fa-biohazard group-hover:animate-spin mr-1"></i> Mass Cas Sim
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Output/Result State */}
        <div className="w-full lg:w-1/2 bg-[#F6F7F5]/50 p-8 md:p-12 relative flex flex-col h-full overflow-y-auto text-left">
          {statusState === 'empty' && (
            <div id="emptyState" className="m-auto text-center">
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <i className="fa-solid fa-microchip text-2xl text-gray-300"></i>
              </div>
              <h3 className="text-sm font-bold text-gray-900">Awaiting Payload</h3>
            </div>
          )}

          {statusState === 'loading' && (
            <div id="loadingState" className="w-full max-w-md mx-auto mt-12">
              <div className="flex justify-between items-center mb-8">
                <div className="skeleton h-4 w-24"></div>
                <div className="skeleton h-4 w-16"></div>
              </div>
              <div className="bg-white border border-gray-100 rounded-[1.5rem] p-8 shadow-sm">
                <div className="skeleton h-3 w-1/4 mb-6"></div>
                <div className="skeleton h-10 w-full mb-8"></div>
                <div className="space-y-5">
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="skeleton h-4 w-5/6"></div>
                  <div className="skeleton h-4 w-2/3"></div>
                </div>
              </div>
            </div>
          )}

          {statusState === 'output' && triageData && (
            <div id="outputState" className="w-full max-w-md mx-auto mt-8 fade-in">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Extracted Ticket</span>
                <div className="flex gap-2 items-center">
                  <span id="out-level" className={levelClasses.badge}>
                    LEVEL {triageData.level}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                    <i className="fa-solid fa-bolt text-[#A3E635]"></i> Inference Complete
                  </span>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-[1.5rem] shadow-lg overflow-hidden">
                <div id="ticketHeader" className={`px-6 py-5 flex justify-between items-center border-b ${levelClasses.header}`}>
                  <span id="ticketHeaderLabel" className={levelClasses.title}>
                    {levelClasses.text}
                  </span>
                  <span id="ticketHeaderPulse" className={levelClasses.pulse}></span>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Location & GPS</span>
                    <span id="out-location" className="block text-base font-bold text-gray-900">
                      {triageData.location}
                    </span>
                    <span id="out-coords" className="block text-xs text-blue-600 mt-1 font-mono font-bold">
                      LAT: {triageData.lat ? triageData.lat.toFixed(4) : 'N/A'} / LNG:{' '}
                      {triageData.lng ? triageData.lng.toFixed(4) : 'N/A'}
                    </span>
                  </div>
                  <div className="mb-6">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Subjects & Threat</span>
                    <span id="out-subjects" className="block text-sm font-bold text-gray-900">
                      {triageData.subjects}
                    </span>
                    <span id="out-threat" className="block text-xs font-bold text-red-600 mt-1">
                      {triageData.threat}
                    </span>
                  </div>

                  <div className="pt-6 border-t border-gray-100 bg-blue-50/30 -mx-6 px-6 pb-2">
                    <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">
                      <i className="fa-solid fa-robot mr-1"></i> AI Routing Recommendation
                    </span>
                    <div className="flex justify-between items-center bg-white border border-blue-100 p-3 rounded-xl shadow-sm">
                      <div>
                        <p id="out-asset" className="text-sm font-bold text-[#0F1C23] flex items-center gap-2">
                          <i className="fa-solid fa-truck-medical text-blue-500"></i> {triageData.asset}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-mono">Matched based on threat profile</p>
                      </div>
                      <div className="text-right font-display">
                        <p id="out-eta" className="text-lg font-bold text-blue-600">
                          {triageData.eta}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">EST. ARRIVAL</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-5 border-t border-gray-100">
                  <button
                    onClick={saveTicketToGrid}
                    disabled={pushStatus === 'pushing' || pushStatus === 'pushed'}
                    className={`w-full border text-sm font-bold py-3 rounded-full hover-lift transition-colors shadow-lg ${
                      pushStatus === 'pushed'
                        ? 'bg-[#A3E635] text-[#0F1C23] border-[#A3E635]'
                        : pushStatus === 'failed'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-[#0F1C23] text-white border-gray-200'
                    }`}
                  >
                    {pushStatus === 'idle' && (
                      <>
                        <i className="fa-solid fa-satellite-dish mr-1"></i> Plot to Live Map Grid
                      </>
                    )}
                    {pushStatus === 'pushing' && (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin mr-1"></i> Syncing to Sat-Link...
                      </>
                    )}
                    {pushStatus === 'pushed' && (
                      <>
                        <i className="fa-solid fa-check mr-1"></i> Pushed! Go to Dashboard
                      </>
                    )}
                    {pushStatus === 'failed' && (
                      <>
                        <i className="fa-solid fa-triangle-exclamation mr-1"></i> DB Push Failed - Retry
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
