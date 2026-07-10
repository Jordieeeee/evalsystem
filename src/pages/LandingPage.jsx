import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';

export const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // TODO: replace with real database-driven data
  const stats = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sage-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      value: '12,450',
      label: 'Enrolled Students'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sage-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      value: '45+',
      label: 'Degree Programs'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sage-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      value: '620+',
      label: 'Distinguished Faculty'
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sage-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      value: '180+',
      label: 'Student Organizations'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 font-sans relative overflow-hidden">
      <style>{`
        @keyframes fadeInSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInSimple {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-scroll-in {
          animation: fadeInSlideUp 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-simple-in {
          animation: fadeInSimple 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-in,
          .animate-simple-in,
          .transition-all,
          .transition-transform {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Top Nav Bar */}
      <nav className="w-full bg-forest-950 text-white relative z-50 border-b border-sage-300/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Crest Left */}
            <div className="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-sage-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.496 2.132a1 1 0 00-.992 0L3.583 5.54a1 1 0 000 1.72l5.92 3.407a1 1 0 00.993 0l5.92-3.407a1 1 0 000-1.72l-5.92-3.408zM4.75 8.943-.943 5.672a1 1 0 00-.992 0l-5.92 3.408a1 1 0 000 1.72l5.92 3.407a1 1 0 00.993 0l5.92-3.407a1 1 0 000-1.72L4.75 8.943zm9.333 1.015v4.293a1 1 0 01-.496.866l-6 3.45a1 1 0 01-.992 0l-6-3.45A1 1 0 011 14.25v-4.293l4.504 2.593a3 3 0 002.992 0l4.504-2.593z" clipRule="evenodd" />
              </svg>
              <div className="flex flex-col">
                <span className="font-serif text-lg md:text-xl font-bold tracking-tight text-white leading-tight">
                  The Last Salle University
                </span>
                <span className="text-[9px] uppercase tracking-widest text-sage-300 font-semibold">
                  Academic Portal
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            {/* TODO: route not yet implemented for placeholder links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-sm font-semibold text-white hover:text-sage-300 transition-colors duration-150">Home</Link>
              <Link to="/about" className="text-sm font-semibold text-white/80 hover:text-sage-300 transition-colors duration-150">About</Link>
              <Link to="/academics" className="text-sm font-semibold text-white/80 hover:text-sage-300 transition-colors duration-150">Academics</Link>
              <Link to="/admissions" className="text-sm font-semibold text-white/80 hover:text-sage-300 transition-colors duration-150">Admissions</Link>
              <Link to="/campus-life" className="text-sm font-semibold text-white/80 hover:text-sage-300 transition-colors duration-150">Campus Life</Link>
              <Link to="/contact" className="text-sm font-semibold text-white/80 hover:text-sage-300 transition-colors duration-150">Contact</Link>
            </div>

            {/* Desktop CTA Button */}
            <div className="hidden md:block">
              <Link to="/login">
                <Button className="!bg-sage-500 hover:!bg-forest-700 text-white text-sm font-bold py-2.5 px-5 rounded-lg border-0 shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150">
                  Login to System
                </Button>
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-sage-300 focus:outline-none focus:ring-2 focus:ring-sage-300/40 rounded-lg p-2"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-forest-950 border-t border-sage-300/10 px-4 pt-2 pb-4 space-y-2 animate-simple-in">
            {/* TODO: route not yet implemented for placeholder links */}
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-forest-700">Home</Link>
            <Link to="/about" className="block px-3 py-2 rounded-md text-base font-medium text-white/80 hover:bg-forest-700">About</Link>
            <Link to="/academics" className="block px-3 py-2 rounded-md text-base font-medium text-white/80 hover:bg-forest-700">Academics</Link>
            <Link to="/admissions" className="block px-3 py-2 rounded-md text-base font-medium text-white/80 hover:bg-forest-700">Admissions</Link>
            <Link to="/campus-life" className="block px-3 py-2 rounded-md text-base font-medium text-white/80 hover:bg-forest-700">Campus Life</Link>
            <Link to="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-white/80 hover:bg-forest-700">Contact</Link>
            <div className="pt-2">
              <Link to="/login" className="block w-full">
                <Button className="w-full !bg-sage-500 hover:!bg-forest-700 text-white font-bold py-2.5 px-4 rounded-lg border-0 shadow-md">
                  Login to System
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Left Column */}
          <div className="space-y-8 animate-scroll-in">
            <div>
              <span className="text-[11px] font-bold text-forest-700 uppercase tracking-widest block mb-3">
                SYSTEM CORE GATEWAY
              </span>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-extrabold text-forest-950 tracking-tight leading-[1.1] mb-6">
                Evaluating Today’s Campus,<br />
                Shaping Tomorrow’s Leaders
              </h1>
              <p className="text-base md:text-lg text-forest-700/85 leading-relaxed max-w-xl">
                Welcome to the central portal for role-based evaluations, course assessments, and educational quality insights at TLSU. Login with your credential to provide feedback or configure program metrics.
              </p>
            </div>

            {/* <div>
              <Link to="/login">
                <Button className="!bg-sage-500 hover:!bg-forest-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out hover:-translate-y-0.5 active:scale-[0.98] text-base border-0 flex items-center space-x-2">
                  <span>Login to System</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </Link>
            </div> */}

            <div className="rounded-2xl overflow-hidden shadow-xl border border-sage-300/20 aspect-video md:aspect-[16/10] relative">
              <img
                src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800"
                alt="The Last Salle University campus quad and main building lobby"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-forest-950/10 pointer-events-none" />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8 lg:mt-2 animate-scroll-in [animation-delay:150ms] opacity-0 [animation-fill-mode:forwards]">
            <div>
              <span className="text-[11px] font-bold text-forest-700 uppercase tracking-widest block mb-3">
                SYSTEM FOCUS
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-forest-950 tracking-tight mb-4">
                Fostering Quality Through Honest Feedback
              </h2>
              <p className="text-sm md:text-base text-forest-700/80 leading-relaxed">
                The Evaluation System provides students and administrators alike with an intuitive interface to review academic programs and assess performance metrics securely.
              </p>
            </div>

            {/* Feature Rows */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-sage-300/30 p-3 rounded-full text-forest-950 border border-sage-300/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-forest-950">Role-Based Control</h3>
                  <p className="text-sm text-forest-700/80 mt-1">Secure student and administrative dashboard views with customized RBAC controls.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-sage-300/30 p-3 rounded-full text-forest-950 border border-sage-300/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-forest-950">Anonymous Evaluations</h3>
                  <p className="text-sm text-forest-700/80 mt-1">Ensuring absolute candor and privacy for all course and faculty assessments.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-sage-300/30 p-3 rounded-full text-forest-950 border border-sage-300/40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 00-2 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-forest-950">Actionable Insights</h3>
                  <p className="text-sm text-forest-700/80 mt-1">Automated metrics and reporting structures to guide institutional development.</p>
                </div>
              </div>
            </div>

            {/* Highlighted Support Card */}
            {/* TODO: route not yet implemented for contact */}
            <div className="bg-forest-950 text-white p-6 rounded-2xl border border-sage-300/25 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sage-500/10 rounded-full blur-2xl" />
              <h3 className="text-lg font-bold font-serif text-white">Need System Support?</h3>
              <p className="text-xs text-sage-300/90 mt-2 leading-relaxed">
                For account provisioning, credential retrieval, or technical evaluation issues, contact the system administrator office.
              </p>
              <div className="mt-4">
                <Link to="/contact">
                  <Button className="!bg-sage-500 hover:!bg-forest-700 text-white text-xs font-bold py-2 px-4 rounded-lg border-0 transition-transform duration-150 hover:-translate-y-0.5 shadow">
                    Contact Admin Office
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* 4-Column Card Row */}
        <section className="mt-20 md:mt-28 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-scroll-in [animation-delay:300ms] opacity-0 [animation-fill-mode:forwards]">
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-sage-300/30 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="bg-forest-950/10 p-3 rounded-full text-forest-950 w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-forest-950">Academic Quality</h4>
            <p className="text-xs text-forest-700/80 mt-2 leading-relaxed">Maintaining rigorous academic and institutional standards across all colleges.</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-sage-300/30 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="bg-forest-950/10 p-3 rounded-full text-forest-950 w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-forest-950">Holistic Assessment</h4>
            <p className="text-xs text-forest-700/80 mt-2 leading-relaxed">Evaluating curriculum design, facilities, and teaching effectiveness.</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-sage-300/30 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="bg-forest-950/10 p-3 rounded-full text-forest-950 w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-forest-950">Unified Community</h4>
            <p className="text-xs text-forest-700/80 mt-2 leading-relaxed">Bridging the gap between student feedback and administrative strategies.</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-sage-300/30 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="bg-forest-950/10 p-3 rounded-full text-forest-950 w-12 h-12 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-forest-950">Future Readiness</h4>
            <p className="text-xs text-forest-700/80 mt-2 leading-relaxed">Adapting institutional actions to match modern educational standards.</p>
          </div>
        </section>

        {/* Bottom Stat Band */}
        <section className="mt-20 md:mt-28 bg-forest-700 text-white rounded-3xl p-8 md:p-12 border border-sage-300/10 shadow-2xl animate-scroll-in [animation-delay:450ms] opacity-0 [animation-fill-mode:forwards]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center space-y-3">
                <div className="bg-white/10 p-3 rounded-full border border-white/5">
                  {stat.icon}
                </div>
                <div className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-widest text-sage-300 font-bold">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full bg-forest-950 text-white/60 py-6 border-t border-sage-300/10 text-center text-xs mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} The Last Salle University. All rights reserved.</p>
          <p className="text-[10px] text-sage-300/40 mt-1">Internal School Evaluation and RBAC Portal</p>
        </div>
      </footer>
    </div>
  );
};