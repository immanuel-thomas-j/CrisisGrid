import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import Chart from 'chart.js/auto';

export default function AnalyticsPage() {
  const [totalIntercepts, setTotalIntercepts] = useState(0);
  const [resolutionRate, setResolutionRate] = useState('0%');
  const [topThreat, setTopThreat] = useState('Analyzing...');
  const [highRiskZone, setHighRiskZone] = useState('Analyzing...');

  const timeChartRef = useRef(null);
  const levelChartRef = useRef(null);
  const statusChartRef = useRef(null);

  const timeChartInstance = useRef(null);
  const levelChartInstance = useRef(null);
  const statusChartInstance = useRef(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const { data, error } = await supabase.from('tickets').select('*');
        if (error || !data) return;

        let level1 = 0, level2 = 0, level3 = 0;
        let pending = 0, enroute = 0, onscene = 0, resolved = 0;
        const threatCounts = {};
        const locationCounts = {};
        const timeCounts = {};

        // Initialize last 24 hours
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 60 * 60 * 1000);
          timeCounts[`${d.getHours()}:00`] = 0;
        }

        data.forEach((t) => {
          const levelStr = String(t.level);
          if (levelStr === '1') level1++;
          else if (levelStr === '2') level2++;
          else level3++;

          if (t.status === 'pending') pending++;
          else if (t.status === 'en_route') enroute++;
          else if (t.status === 'on_scene') onscene++;
          else if (t.status === 'resolved') resolved++;

          if (t.threat) {
            threatCounts[t.threat] = (threatCounts[t.threat] || 0) + 1;
          }
          if (t.location) {
            locationCounts[t.location] = (locationCounts[t.location] || 0) + 1;
          }

          const ticketDate = new Date(t.created_at || t.time_string);
          const hourKey = `${ticketDate.getHours()}:00`;
          if (timeCounts[hourKey] !== undefined) {
            timeCounts[hourKey]++;
          }
        });

        // Set state for KPI Cards
        setTotalIntercepts(data.length);
        setResolutionRate(
          data.length ? Math.round((resolved / data.length) * 100) + '%' : '0%'
        );

        const calculatedTopThreat = Object.keys(threatCounts).reduce(
          (a, b) => (threatCounts[a] > threatCounts[b] ? a : b),
          'N/A'
        );
        setTopThreat(calculatedTopThreat === 'N/A' ? 'None' : calculatedTopThreat);

        const calculatedTopLocation = Object.keys(locationCounts).reduce(
          (a, b) => (locationCounts[a] > locationCounts[b] ? a : b),
          'N/A'
        );
        setHighRiskZone(calculatedTopLocation === 'N/A' ? 'None' : calculatedTopLocation);

        // Destroy previous chart instances
        if (timeChartInstance.current) timeChartInstance.current.destroy();
        if (levelChartInstance.current) levelChartInstance.current.destroy();
        if (statusChartInstance.current) statusChartInstance.current.destroy();

        // 1. Render Timeline Line Chart
        if (timeChartRef.current) {
          timeChartInstance.current = new Chart(timeChartRef.current, {
            type: 'line',
            data: {
              labels: Object.keys(timeCounts),
              datasets: [
                {
                  label: 'Incidents',
                  data: Object.values(timeCounts),
                  borderColor: '#0F1C23',
                  backgroundColor: 'rgba(163, 230, 53, 0.2)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.3,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1 },
                },
              },
            },
          });
        }

        // 2. Render Severity Level Chart
        if (levelChartRef.current) {
          levelChartInstance.current = new Chart(levelChartRef.current, {
            type: 'bar',
            data: {
              labels: ['L1 (Critical)', 'L2 (Elevated)', 'L3 (Standard)'],
              datasets: [
                {
                  data: [level1, level2, level3],
                  backgroundColor: ['#EF4444', '#F97316', '#EAB308'],
                  borderRadius: 6,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: '#f3f4f6' },
                },
                x: {
                  grid: { display: false },
                },
              },
            },
          });
        }

        // 3. Render Status Doughnut Chart
        if (statusChartRef.current) {
          statusChartInstance.current = new Chart(statusChartRef.current, {
            type: 'doughnut',
            data: {
              labels: ['Pending', 'En Route', 'On Scene', 'Resolved'],
              datasets: [
                {
                  data: [pending, enroute, onscene, resolved],
                  backgroundColor: ['#EF4444', '#F97316', '#3B82F6', '#D1D5DB'],
                  borderWidth: 0,
                  hoverOffset: 4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '70%',
            },
          });
        }
      } catch (err) {
        console.error('Error fetching analytics data:', err);
      }
    }

    fetchAnalytics();

    return () => {
      // Clean up chart instances on unmount
      if (timeChartInstance.current) timeChartInstance.current.destroy();
      if (levelChartInstance.current) levelChartInstance.current.destroy();
      if (statusChartInstance.current) statusChartInstance.current.destroy();
    };
  }, []);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden text-gray-900 antialiased p-2 md:p-4 gap-4 bg-[#F6F7F5]">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Panel */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white rounded-[2rem] shadow-sm border border-gray-200/60">
        <header className="h-16 md:h-20 border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0">
          <h1 className="text-lg md:text-xl font-display font-bold text-gray-900">System Telemetry</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F6F7F5]/50 flex flex-col gap-6 text-left">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
            <div className="bg-white p-5 rounded-[1.25rem] border border-gray-100 shadow-sm card-lift">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                <i className="fa-solid fa-layer-group text-blue-500 mr-1"></i> Total Intercepts
              </p>
              <h2 id="stat-total" className="text-2xl font-display font-bold text-gray-900">
                {totalIntercepts}
              </h2>
            </div>
            <div className="bg-white p-5 rounded-[1.25rem] border border-gray-100 shadow-sm card-lift">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                <i className="fa-solid fa-check-circle text-[#A3E635] mr-1"></i> Resolution Rate
              </p>
              <h2 id="stat-res-rate" className="text-2xl font-display font-bold text-gray-900">
                {resolutionRate}
              </h2>
            </div>
            <div className="bg-white p-5 rounded-[1.25rem] border border-gray-100 shadow-sm card-lift">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                <i className="fa-solid fa-skull-crossbones text-red-500 mr-1"></i> Top Threat Type
              </p>
              <h2 id="stat-threat" className="text-lg font-bold text-gray-900 truncate">
                {topThreat}
              </h2>
            </div>
            <div className="bg-white p-5 rounded-[1.25rem] border border-gray-100 shadow-sm card-lift">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                <i className="fa-solid fa-map-pin text-orange-500 mr-1"></i> High-Risk Zone
              </p>
              <h2 id="stat-location" className="text-lg font-bold text-gray-900 truncate">
                {highRiskZone}
              </h2>
            </div>
          </div>

          {/* Time Based Chart */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm card-lift shrink-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              Incidents Over Time (Last 24 Hours)
            </p>
            <div className="relative h-48 w-full">
              <canvas ref={timeChartRef} id="timeChart"></canvas>
            </div>
          </div>

          {/* Column Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm card-lift">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                Incidents by Severity
              </p>
              <div className="relative h-64 w-full">
                <canvas ref={levelChartRef} id="levelChart"></canvas>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm card-lift">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                Pipeline Status
              </p>
              <div className="relative h-64 w-full flex justify-center">
                <canvas ref={statusChartRef} id="statusChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
