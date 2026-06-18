import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import AuthModal from '../components/AuthModal';

export default function LandingPage() {
  const { user, logOut, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, resolved: 0, critical: 0 });
  const [tickerTickets, setTickerTickets] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const resolved = data.filter((t) => t.status === 'resolved').length;
          const critical = data.filter((t) => t.status !== 'resolved' && String(t.level) === '1').length;
          setStats({
            total: data.length,
            resolved,
            critical,
          });
          setTickerTickets(data.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching landing page stats:', err.message);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    // Scroll Reveal implementation
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loadingStats]);

  const handleActionClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      openAuthModal();
    }
  };

  const getLevelColor = (level) => {
    const lvl = String(level);
    if (lvl === '1') return 'text-alert';
    if (lvl === '2') return 'text-orange-400';
    return 'text-primary';
  };

  return (
    <div className="min-h-screen bg-[#070C14] text-[#F8FAFC] font-sans antialiased overflow-x-hidden">
      {/* Background grid */}
      <div className="tech-grid"></div>

      {/* Top Ticker */}
      <div className="ticker-wrap h-8 flex items-center">
        <div className="ticker font-mono text-[10px] text-gray-400 tracking-widest flex gap-8">
          {tickerTickets.length > 0 ? (
            // Double the list to make seamless scrolling
            [...tickerTickets, ...tickerTickets].map((ticket, index) => (
              <React.Fragment key={index}>
                <span className={getLevelColor(ticket.level)}>
                  <i className="fa-solid fa-triangle-exclamation"></i> SOS AT: LAT{' '}
                  {ticket.lat ? ticket.lat.toFixed(4) : 'UNKNOWN'} LON{' '}
                  {ticket.lng ? ticket.lng.toFixed(4) : 'UNKNOWN'}
                </span>
                <span>STATUS: {ticket.status ? ticket.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}</span>
                <span className="text-white">
                  <i className="fa-solid fa-location-dot"></i> LOC: {ticket.title || ticket.location}
                </span>
              </React.Fragment>
            ))
          ) : (
            <>
              <span className="text-alert">
                <i className="fa-solid fa-circle-notch fa-spin"></i> SYNCING LIVE GRID...
              </span>
              <span>AWAITING CONNECTION</span>
              <span className="text-primary">
                <i className="fa-solid fa-satellite-dish"></i> ESTABLISHING UPLINK
              </span>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <i className="fa-solid fa-satellite-dish text-primary text-sm"></i>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CrisisGrid</span>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <a href="#how-it-works" className="hidden md:inline text-xs font-semibold text-gray-400 hover:text-white transition-colors">
            How it works
          </a>
          <a href="#who-its-for" className="hidden md:inline text-xs font-semibold text-gray-400 hover:text-white transition-colors">
            Who it's for
          </a>

          {user && (
            <button
              onClick={logOut}
              className="text-xs font-semibold text-alert hover:text-red-400 transition-colors inline-flex items-center"
            >
              <i className="fa-solid fa-right-from-bracket mr-1"></i> Logout
            </button>
          )}

          <button
            onClick={handleActionClick}
            className="bg-primary text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(163,230,53,0.25)] hover:bg-[#bef264]"
          >
            {user ? (
              <>
                <i className="fa-solid fa-layer-group mr-1"></i> Open Dashboard
              </>
            ) : (
              <>
                <i className="fa-solid fa-user-shield mr-1"></i> Operator Login
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Main Hero */}
      <main className="max-w-7xl mx-auto px-6 pt-6 md:pt-10 pb-16 relative z-10 reveal">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-[10px] font-mono text-primary mb-5 uppercase tracking-widest">
              <i className="fa-solid fa-trophy"></i> Built for NextGenHacks 2026
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-5 leading-[1.15] mt-2">
              Every second counts.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                Smart response saves lives.
              </span>
            </h1>

            {loadingStats ? (
              <p id="live-stats" className="text-xs font-mono text-gray-400 mb-5 uppercase tracking-widest border border-white/10 bg-white/5 inline-block px-3 py-1.5 rounded-lg">
                <i className="fa-solid fa-circle-notch fa-spin mr-1"></i> Fetching live rescue data...
              </p>
            ) : (
              <p id="live-stats" className="text-xs font-mono text-gray-400 mb-5 uppercase tracking-widest border border-white/10 bg-white/5 inline-block px-3 py-1.5 rounded-lg">
                <span className="text-white font-bold">{stats.total}</span> emergencies tracked &middot;{' '}
                <span className="text-white font-bold">{stats.resolved}</span> resolved &middot;{' '}
                <span className="text-alert font-bold">{stats.critical}</span> critical active
              </p>
            )}

            <p className="text-sm md:text-base text-gray-400 mb-8 leading-relaxed max-w-lg font-light">
              An easy-to-use platform for emergency dispatchers. Instantly turn confusing SOS messages into clear, mapped-out rescue missions in less than a second.
            </p>

            <div className="flex items-center gap-5 mb-8 pb-6 border-b border-white/10">
              <div>
                <p id="hero-stats-total" className="text-2xl font-bold text-white mb-0.5">
                  {stats.total}
                </p>
                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Tracked</p>
              </div>
              <div className="w-px h-6 bg-white/10"></div>
              <div>
                <p id="hero-stats-resolved" className="text-2xl font-bold text-primary mb-0.5">
                  {stats.resolved}
                </p>
                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Resolved</p>
              </div>
              <div className="w-px h-6 bg-white/10"></div>
              <div>
                <p id="hero-stats-critical" className="text-2xl font-bold text-alert mb-0.5">
                  {stats.critical}
                </p>
                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Critical L1</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleActionClick}
                className="bg-white text-slate-900 px-6 py-3 rounded-full text-sm font-bold text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(255,255,255,0.15)] flex justify-center items-center gap-2 w-max"
              >
                {user ? 'Open Operations Center' : 'Open Operations Center'}{' '}
                <i className="fa-solid fa-arrow-right"></i>
              </button>
              <a
                href="#how-it-works"
                className="px-6 py-3 rounded-full text-sm font-bold text-center border border-white/15 text-gray-300 hover:text-white hover:border-white/30 transition-colors flex justify-center items-center gap-2 w-max"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Right Visual / Graphic Column */}
          <div className="relative h-[400px] w-full hidden lg:block scale-90 origin-left">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute top-10 left-0 glass-panel p-4 rounded-2xl w-60 float-slow border-alert/30 border-l-4 border-l-alert shadow-2xl">
              <div className="flex gap-2 items-center mb-2">
                <i className="fa-solid fa-mobile-screen-button text-gray-400 text-xs"></i>
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Raw SOS Message</span>
              </div>
              <p className="text-xs font-mono text-gray-300 leading-relaxed">
                "trapped on roof 2nd ave flooding fast need boat 3 people"
              </p>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 glass-panel rounded-full flex items-center justify-center border-primary/50 shadow-[0_0_30px_rgba(163,230,53,0.15)] z-10">
              <i className="fa-solid fa-microchip text-2xl text-primary"></i>
            </div>
            <svg className="absolute inset-0 w-full h-full -z-10" style={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: 4 }}>
              <path d="M 120 100 Q 250 200 300 200" fill="none" className="animate-pulse" />
              <path d="M 350 200 Q 400 200 450 300" fill="none" className="animate-pulse" />
            </svg>
            <div className="absolute bottom-4 right-0 bg-slate-800 border border-slate-700 p-4 rounded-2xl w-64 float-fast shadow-2xl z-20">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
                <span class="text-[9px] font-bold text-primary uppercase tracking-widest">Rescue Ticket</span>
                <span className="text-alert text-[10px]">
                  <i className="fa-solid fa-triangle-exclamation"></i> L1
                </span>
              </div>
              <div className="space-y-2 font-mono text-[10px] text-gray-300">
                <div className="flex justify-between">
                  <span>LOC:</span> <span className="text-white font-semibold">2nd Ave.</span>
                </div>
                <div className="flex justify-between">
                  <span>SUBJ:</span> <span className="text-white font-semibold">3 Civilians</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>SEND:</span>{' '}
                  <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full text-[9px] font-bold">
                    SWIFT BOAT
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Under The Hood Running Items Ticker */}
      <div className="border-y border-white/5 bg-black/40 backdrop-blur-md overflow-hidden py-3 relative z-10">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#070C14] to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#070C14] to-transparent z-10"></div>
        <div className="flex items-center gap-4 px-6 max-w-7xl mx-auto">
          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest shrink-0 border-r border-gray-700 pr-4">
            What's running under the hood
          </span>
          <div className="overflow-hidden w-full relative">
            <div className="api-ticker flex gap-12 items-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <i className="fa-solid fa-map text-gray-600"></i> Live Map
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <i className="fa-solid fa-brain text-gray-600"></i> Smart Sorting
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <i className="fa-solid fa-bolt text-gray-600"></i> Instant Updates
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <i className="fa-solid fa-shield-halved text-gray-600"></i> Secure Sign-In
              </div>
              {/* Duplicate for infinite effect */}
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <i className="fa-solid fa-map text-gray-600"></i> Live Map
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <i className="fa-solid fa-brain text-gray-600"></i> Smart Sorting
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <i className="fa-solid fa-bolt text-gray-600"></i> Instant Updates
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <i className="fa-solid fa-shield-halved text-gray-600"></i> Secure Sign-In
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6 reveal">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-3">From message to mission</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">How CrisisGrid works</h2>
            <p class="text-xs md:text-sm text-gray-400">Three steps, no manual sorting required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px step-line"></div>

            <div className="relative text-center md:text-left">
              <div className="w-16 h-16 mx-auto md:mx-0 rounded-full glass-panel border-primary/30 flex items-center justify-center mb-5 text-primary font-bold text-lg">
                01
              </div>
              <h3 className="text-base md:text-lg font-bold text-white mb-2">A message comes in</h3>
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                Someone texts, calls, or reports an emergency &mdash; often rushed, misspelled, or unclear.
              </p>
            </div>
            <div className="relative text-center md:text-left">
              <div className="w-16 h-16 mx-auto md:mx-0 rounded-full glass-panel border-primary/30 flex items-center justify-center mb-5 text-primary font-bold text-lg">
                02
              </div>
              <h3 className="text-base md:text-lg font-bold text-white mb-2">CrisisGrid sorts it instantly</h3>
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                The system figures out where it is, how serious it is, and what kind of help is needed.
              </p>
            </div>
            <div className="relative text-center md:text-left">
              <div className="w-16 h-16 mx-auto md:mx-0 rounded-full glass-panel border-primary/30 flex items-center justify-center mb-5 text-primary font-bold text-lg">
                03
              </div>
              <h3 className="text-base md:text-lg font-bold text-white mb-2">Help gets on its way</h3>
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                The right team sees the location and details on a live map, ready to respond.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-slate-900/50 backdrop-blur-sm relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6 reveal">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">How CrisisGrid helps</h2>
            <p className="text-xs md:text-sm text-gray-400">
              Our platform simplifies emergency management so dispatchers can focus on saving lives instead of organizing data.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="glass-panel p-6 md:p-8 rounded-[2rem] hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 border-t border-t-white/10 group">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-5 border border-white/10 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-brain text-white text-lg"></i>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">Smart Text Processing</h3>
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                Instantly reads confusing or misspelled SOS messages and turns them into clear rescue tickets with exact map locations.
              </p>
            </div>
            <div className="glass-panel p-6 md:p-8 rounded-[2rem] hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 border-t border-t-primary/30 group">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-5 border border-primary/20 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-truck-medical text-primary text-lg"></i>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">Smart Dispatch Matching</h3>
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                Automatically finds the right rescue team (like medics, firefighters, or boats) and sends them exactly where they need to go.
              </p>
            </div>
            <div className="glass-panel p-6 md:p-8 rounded-[2rem] hover:bg-slate-800/80 transition-all duration-300 hover:-translate-y-1 border-t border-t-alert/30 group">
              <div className="w-12 h-12 bg-alert/10 rounded-full flex items-center justify-center mb-5 border border-alert/20 group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-map-location-dot text-alert text-lg"></i>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">Live Command Dashboard</h3>
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                A simple, real-time board that helps dispatchers see everything at a glance and manage multiple emergencies without the stress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who-its-for" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6 reveal">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-3">Built for the people on the ground</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Who CrisisGrid is for</h2>
            <p className="text-xs md:text-sm text-gray-400">Anyone who has to make fast decisions when every minute matters.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="p-6 md:p-8 rounded-[2rem] border border-white/10 hover:border-primary/30 transition-colors">
              <i className="fa-solid fa-people-carry-box text-primary text-xl mb-4"></i>
              <h3 className="text-base md:text-lg font-bold text-white mb-2">Volunteer rescue teams</h3>
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                Get a clear, prioritized job to do instead of trying to make sense of confusing radio chatter.
              </p>
            </div>
            <div className="p-6 md:p-8 rounded-[2rem] border border-white/10 hover:border-primary/30 transition-colors">
              <i className="fa-solid fa-headset text-primary text-xl mb-4"></i>
              <h3 className="text-base md:text-lg font-bold text-white mb-2">Community dispatchers</h3>
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                Run an entire response from one simple screen, even without years of dispatcher training.
              </p>
            </div>
            <div className="p-6 md:p-8 rounded-[2rem] border border-white/10 hover:border-primary/30 transition-colors">
              <i className="fa-solid fa-people-group text-primary text-xl mb-4"></i>
              <h3 className="text-base md:text-lg font-bold text-white mb-2">Local organizers</h3>
              <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
                See everything happening across your area in real time, and know where help is still needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 py-16">
        <div className="max-w-5xl mx-auto px-6 reveal">
          <div className="glass-panel rounded-[2.5rem] p-10 md:p-14 text-center border-primary/20 shadow-[0_0_60px_rgba(163,230,53,0.06)]">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to see it in action?</h2>
            <p className="text-xs md:text-sm text-gray-400 mb-8 max-w-md mx-auto">
              Sign in to open the live Operations Center and watch a message turn into a dispatched rescue mission.
            </p>
            <button
              onClick={handleActionClick}
              className="bg-primary text-slate-900 px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(163,230,53,0.25)] hover:bg-[#bef264] inline-flex items-center gap-2"
            >
              Open Operations Center <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#070C14] py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <i className="fa-solid fa-satellite-dish"></i> CrisisGrid OS &copy; 2026
          </div>
          <div className="flex items-center gap-5 text-gray-500 text-xs">
            <a href="https://github.com/immanuel-thomas-j/CrisisGrid" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <i className="fa-brands fa-github"></i> View Source
            </a>
            <span className="hidden sm:inline w-px h-3 bg-white/10"></span>
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-trophy text-primary"></i> Built for NextGenHacks 2026
            </span>
          </div>
          <div className="font-mono text-[9px] text-gray-600 tracking-widest uppercase">Secure System Active</div>
        </div>
      </footer>

      {/* Modal Integration */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
