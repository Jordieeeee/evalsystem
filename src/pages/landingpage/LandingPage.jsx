import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import logoImg from '../../assets/logo/logo.png';
import flagceremony from '../../assets/landingpage/flagceremony.png';
import tlsuschool from '../../assets/landingpage/tlsuschool.png';


// Nav items mapped to section IDs
const NAV_ITEMS = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Admissions', id: 'admissions' },
  { label: 'FAQs', id: 'faqs' },
  { label: 'Contact', id: 'contact' },
];

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const observerRef = useRef(null);

  // Respect prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth scroll to section, accounting for sticky nav height (~80px)
  const scrollToSection = useCallback(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (prefersReducedMotion) {
        el.scrollIntoView({ block: 'start' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setMobileMenuOpen(false);
    },
    [prefersReducedMotion]
  );

  // IntersectionObserver — tracks which section is currently most visible
  useEffect(() => {
    const sectionEls = NAV_ITEMS.map(({ id }) => document.getElementById(id)).filter(Boolean);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If the section intersects our small trigger window near the top, it becomes active.
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        // Create a horizontal trigger line ~100px from the top (just below the sticky nav)
        rootMargin: '-100px 0px -80% 0px',
        threshold: 0,
      }
    );

    sectionEls.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  // TODO: replace with real database-driven data
  const stats = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sage-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      value: '12,450',
      label: 'Enrolled Students',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sage-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      value: '1',
      label: 'Degree Programs',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sage-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      value: '10',
      label: 'Distinguished Faculty',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sage-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      value: '5',
      label: 'Student Organizations',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 font-sans">
      <style>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeInSimple {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-scroll-in {
          animation: fadeInSlideUp 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-simple-in {
          animation: fadeInSimple 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        /* All sections offset so sticky nav doesn't obscure them */
        section[id] {
          scroll-margin-top: 80px;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll-in,
          .animate-simple-in,
          .transition-all,
          .transition-colors,
          .transition-transform {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* ─── Sticky Nav Bar ─────────────────────────────────────────────────── */}
      <nav className="w-full bg-forest-950 text-white sticky top-0 z-50 border-b border-sage-300/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo + Wordmark */}
            <button
              onClick={() => scrollToSection('home')}
              className="flex items-center space-x-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300/40 rounded-lg"
              aria-label="Scroll to top"
            >
              <img
                src={logoImg}
                alt="The Last Salle University Crest"
                className="h-18 w-18 object-contain"
              />
              <div className="flex flex-col text-left">
                <span className="font-serif text-lg md:text-xl font-bold tracking-tight text-white leading-tight">
                  The Last Salle University
                </span>
                <span className="text-[9px] uppercase tracking-widest text-sage-300 font-semibold">
                  Academic Portal
                </span>
              </div>
            </button>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
              {NAV_ITEMS.map(({ label, id }) => {
                const isActive = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`
                      px-3 py-2 rounded-lg text-sm transition-colors duration-150 ease-in-out
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300/40
                      ${isActive
                        ? 'font-bold text-cream-100'
                        : 'font-normal text-sage-300 hover:text-cream-100'
                      }
                    `}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:block">
              <Link to="/login">
                <Button className="!bg-sage-500 hover:!bg-forest-700 text-white text-sm font-bold py-2.5 px-5 rounded-lg border-0 shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150">
                  Login
                </Button>
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="text-white hover:text-sage-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300/40 rounded-lg p-2 transition-colors duration-150"
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

        {/* Mobile Nav Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-forest-950 border-t border-sage-300/10 px-4 pt-2 pb-4 space-y-1 animate-simple-in">
            {NAV_ITEMS.map(({ label, id }) => {
              const isActive = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`
                    block w-full text-left px-3 py-2.5 rounded-lg text-base transition-colors duration-150
                    ${isActive
                      ? 'font-bold text-cream-100 bg-forest-700/50'
                      : 'font-medium text-sage-300 hover:bg-forest-700 hover:text-cream-100'
                    }
                  `}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {label}
                </button>
              );
            })}
            <div className="pt-2">
              <Link to="/login" className="block w-full" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full !bg-sage-500 hover:!bg-forest-700 text-white font-bold py-2.5 px-4 rounded-lg border-0 shadow-md">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-grow">

        {/* ── SECTION: Home (Hero + Cards + Stats) ─────────────────────────── */}
        <section id="home">

          {/* Hero: 2-column layout */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

              {/* Left Column */}
              <div className="space-y-8 animate-scroll-in">
                <div>
                  <span className="text-[11px] font-bold text-forest-700 uppercase tracking-widest block mb-3">
                    SYSTEM CORE GATEWAY
                  </span>
                  <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-extrabold text-forest-900 tracking-tight leading-[1.1] mb-6">
                    Evaluating Today's Campus,<br />
                    Shaping Tomorrow's Leaders
                  </h1>
                  <p className="text-base md:text-lg text-forest-700/85 leading-relaxed max-w-xl">
                    Welcome to the central portal for role-based evaluations, course assessments,
                    and educational quality insights at TLSU. Login with your credential to provide
                    feedback or configure program metrics.
                  </p>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-sage-300/20 aspect-video md:aspect-[16/10] relative">
                  <img
                    src={tlsuschool}
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
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-forest-910 tracking-tight mb-4">
                    Fostering Quality Through Honest Feedback
                  </h2>
                  <p className="text-sm md:text-base text-forest-700/80 leading-relaxed">
                    The Evaluation System provides students and administrators alike with an intuitive
                    interface to review academic programs and assess performance metrics securely.
                  </p>
                </div>

                {/* Feature Rows */}
                <div className="space-y-6">
                  {[
                    {
                      title: 'Role-Based Control',
                      desc: 'Secure student and administrative dashboard views with customized RBAC controls.',
                      path: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                    },
                    {
                      title: 'Anonymous Evaluations',
                      desc: 'Ensuring absolute candor and privacy for all course and faculty assessments.',
                      path: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
                    },
                    {
                      title: 'Actionable Insights',
                      desc: 'Automated metrics and reporting structures to guide institutional development.',
                      path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                    },
                  ].map(({ title, desc, path }) => (
                    <div key={title} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 bg-sage-300/30 p-3 rounded-full text-forest-950 border border-sage-300/40">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-forest-910">{title}</h3>
                        <p className="text-sm text-forest-700/80 mt-1">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Support Card */}
                <div className="bg-forest-950 text-white p-6 rounded-2xl border border-sage-300/25 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sage-500/10 rounded-full blur-2xl" />
                  <h3 className="text-lg font-bold font-serif text-white">Need System Support?</h3>
                  <p className="text-xs text-sage-300/90 mt-2 leading-relaxed">
                    For account provisioning, credential retrieval, or technical evaluation issues,
                    contact the system administrator office.
                  </p>
                  <div className="mt-4">
                    {/* TODO: route not yet implemented for contact */}
                    <button
                      onClick={() => scrollToSection('contact')}
                      className="text-xs font-bold bg-sage-500 hover:bg-forest-700 text-white py-2 px-4 rounded-lg transition-colors duration-150 hover:-translate-y-0.5 shadow"
                    >
                      Contact Admin Office
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Card Row */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-scroll-in [animation-delay:300ms] opacity-0 [animation-fill-mode:forwards]">
              {[
                { title: 'Academic Quality', desc: 'Maintaining rigorous academic and institutional standards across all colleges.', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
                { title: 'Holistic Assessment', desc: 'Evaluating curriculum design, facilities, and teaching effectiveness.', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                { title: 'Unified Community', desc: 'Bridging the gap between student feedback and administrative strategies.', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                { title: 'Future Readiness', desc: 'Adapting institutional actions to match modern educational standards.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              ].map(({ title, desc, icon }) => (
                <div key={title} className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-sage-300/30 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <div className="bg-forest-950/10 p-3 rounded-full text-forest-950 w-12 h-12 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-forest-950">{title}</h4>
                  <p className="text-xs text-forest-700/80 mt-2 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stat Band */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="bg-forest-700 text-white rounded-3xl p-8 md:p-12 border border-sage-300/10 shadow-2xl animate-scroll-in [animation-delay:450ms] opacity-0 [animation-fill-mode:forwards]">
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
            </div>
          </div>
        </section>

        {/* ── SECTION: About ───────────────────────────────────────────────── */}
        <section id="about" className="bg-white/60 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-[10px] font-bold text-sage-500 uppercase tracking-widest block mb-3">
                ABOUT US
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-forest-950 leading-tight mb-4">
                The Last Salle University – Malvar
              </h2>
              <p className="text-lg md:text-xl font-serif text-forest-700/90 italic">
                Shaping Tomorrow's Leaders Through Excellence, Innovation, and Service
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-16">
              <div>
                <p className="text-sm md:text-base text-forest-700/80 leading-relaxed mb-4">
                  The Last Salle University – Malvar is a premier institution of higher learning committed to providing quality education that empowers students to become competent professionals, responsible citizens, and compassionate leaders. Founded on the principles of academic excellence, integrity, and lifelong learning, the university creates an environment where students are inspired to reach their full potential.
                </p>
                <p className="text-sm md:text-base text-forest-700/80 leading-relaxed mb-4">
                  With modern facilities, experienced faculty members, and industry-relevant programs, The Last Salle University prepares graduates to meet the challenges of a rapidly changing world. Through research, innovation, community engagement, and values-centered education, the university cultivates knowledge, leadership, and social responsibility.
                </p>
                <p className="text-sm md:text-base text-forest-700/80 leading-relaxed">
                  As a vibrant academic community, we encourage critical thinking, creativity, collaboration, and personal growth. Every student is equipped not only with professional expertise but also with the character and confidence to make meaningful contributions to society.
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-sage-300/20 aspect-[4/3] relative">
                <img
                  src={flagceremony}
                  alt="The Last Salle University campus"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-forest-950/10 pointer-events-none" />
              </div>
            </div>

            <div className="bg-forest-950 text-white rounded-3xl p-8 md:p-12 mb-16">
              <p className="text-center text-lg md:text-xl font-serif italic text-sage-300">
                "Empowering Minds. Transforming Futures. Inspiring Excellence."
              </p>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-cream-100 border border-sage-300/30 rounded-2xl p-6">
                <h3 className="font-serif text-xl font-bold text-forest-950 mb-4">Mission</h3>
                <p className="text-sm text-forest-700/80 leading-relaxed">
                  To provide accessible, high-quality, and values-driven education through innovative teaching, research, and community engagement, producing graduates who are globally competitive, socially responsible, and committed to lifelong learning.
                </p>
              </div>
              <div className="bg-cream-100 border border-sage-300/30 rounded-2xl p-6">
                <h3 className="font-serif text-xl font-bold text-forest-950 mb-4">Vision</h3>
                <p className="text-sm text-forest-700/80 leading-relaxed">
                  To be a leading university recognized for academic excellence, transformative education, innovative research, and sustainable community development, shaping future leaders who inspire positive change locally and globally.
                </p>
              </div>
            </div>

            {/* Core Values */}
            <div className="mb-16">
              <h3 className="font-serif text-2xl font-bold text-forest-950 text-center mb-8">Core Values</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Excellence', desc: 'Striving for the highest standards in education and service.' },
                  { title: 'Integrity', desc: 'Upholding honesty, accountability, and ethical leadership.' },
                  { title: 'Innovation', desc: 'Embracing creativity, technology, and continuous improvement.' },
                  { title: 'Compassion', desc: 'Serving others with respect, empathy, and inclusivity.' },
                  { title: 'Leadership', desc: 'Developing individuals who lead with competence and purpose.' },
                  { title: 'Community', desc: 'Building strong partnerships that create meaningful social impact.' },
                ].map(({ title, desc }) => (
                  <div key={title} className="bg-white/70 border border-sage-300/30 rounded-xl p-5 text-center">
                    <h4 className="font-bold text-forest-950 mb-2">{title}</h4>
                    <p className="text-xs text-forest-700/70 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Choose Us */}
            <div>
              <h3 className="font-serif text-2xl font-bold text-forest-950 text-center mb-8">Why Choose The Last Salle University?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  '🎓 Quality academic programs aligned with industry standards.',
                  '👨‍🏫 Highly qualified and dedicated faculty members.',
                  '🏫 Modern learning facilities and technology-enabled classrooms.',
                  '💼 Career-focused education with internship opportunities.',
                  '🌍 Strong commitment to research, innovation, and community service.',
                  '⭐ Holistic student development through leadership and extracurricular activities.',
                ].map((item, i) => (
                  <div key={i} className="bg-white/70 border border-sage-300/30 rounded-xl p-4 flex items-start space-x-3">
                    <span className="text-xl flex-shrink-0">{item.charAt(0)}</span>
                    <p className="text-sm text-forest-700/80 leading-relaxed">{item.slice(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>



        {/* ── SECTION: Admissions ──────────────────────────────────────────── */}
        {/* Copy invented for this section — institutional tone */}
        <section id="admissions" className="bg-forest-950 text-white py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="text-[10px] font-bold text-sage-300 uppercase tracking-widest block mb-3">
                  JOINING TLSU
                </span>
                <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-white leading-tight mb-5">
                  Your Path to<br />Enrollment
                </h2>
                <p className="text-sm text-white/70 leading-relaxed mb-6">
                  The admissions process at TLSU is designed to be transparent and accessible.
                  Prospective students undergo a comprehensive evaluation that considers academic
                  performance, character references, and alignment with our institutional values.
                </p>
                <p className="text-sm text-white/60 leading-relaxed mb-8">
                  For credential inquiries related to this Evaluation System portal, contact the
                  Office of the Registrar. Student accounts are provisioned exclusively by the IT
                  Systems team — no self-registration is available on this portal.
                </p>
                <div className="space-y-4">
                  {[
                    'Submit completed application form to the Registrar\'s Office',
                    'Present certified true copy of academic records',
                    'Pass the TLSU Entrance Examination',
                    'Complete the mandatory orientation and onboarding',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 bg-sage-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-white/70 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-sage-300/20 aspect-[4/3] relative">
                <img
                  src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800"
                  alt="Students at The Last Salle University campus"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-sage-500/30 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/60 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION: FAQs ────────────────────────────────────────────────── */}
        {/* Copy invented for this section — institutional tone */}
        <section id="faqs" className="bg-white/60 py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-[10px] font-bold text-sage-500 uppercase tracking-widest block mb-3">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-forest-950 leading-tight">
                Common Questions About<br />Admissions & Programs
              </h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  q: 'How do I apply for admission?',
                  a: 'You can apply by completing the online application form and submitting the required documents before the application deadline.',
                },
                {
                  q: 'What documents are required for admission?',
                  a: 'Typically, you need your academic records, a valid ID, birth certificate, passport-sized photos, and other documents required by the university.',
                },
                {
                  q: 'What courses or programs are offered?',
                  a: 'The university offers undergraduate, graduate, and certificate programs in fields such as Business, Education, Engineering, Information Technology, Nursing, and more.',
                },
                {
                  q: 'When does the school year start?',
                  a: 'The academic calendar varies each year. Check the university\'s official website or admissions office for the latest schedule.',
                },
                {
                  q: 'Are scholarships available?',
                  a: 'Yes. Many universities offer academic, athletic, and financial aid scholarships for qualified students.',
                },
                {
                  q: 'How much is the tuition fee?',
                  a: 'Tuition fees depend on the program and number of units enrolled. Contact the registrar or finance office for current rates.',
                },
                {
                  q: 'Can I transfer from another university?',
                  a: 'Yes. Transfer students are welcome, provided they meet the university\'s transfer admission requirements.',
                },
                {
                  q: 'Is there on-campus housing?',
                  a: 'Some universities provide dormitories or student residences. Availability may be limited, so early application is recommended.',
                },
                {
                  q: 'How can I contact the university?',
                  a: 'You can contact the admissions office by phone, email, or through the university\'s official website.',
                },
                {
                  q: 'What student services are available?',
                  a: 'Students have access to libraries, guidance and counseling, career services, health clinics, sports facilities, student organizations, and academic support.',
                },
              ].map(({ q, a }, i) => (
                <details key={i} className="group bg-cream-100 border border-sage-300/40 rounded-2xl px-6 py-4 cursor-pointer open:shadow-md transition-shadow duration-200">
                  <summary className="flex items-center justify-between text-sm font-bold text-forest-950 list-none select-none">
                    {q}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-sage-500 transition-transform duration-200 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-xs text-forest-700/75 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION: Contact ─────────────────────────────────────────────── */}
        {/* Copy invented for this section — institutional tone */}
        {/* TODO: replace with real support contact / help-desk route once finalized */}
        <section id="contact" className="bg-cream-100 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              <div>
                <span className="text-[10px] font-bold text-sage-500 uppercase tracking-widest block mb-3">
                  GET IN TOUCH
                </span>
                <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-forest-950 leading-tight mb-5">
                  We're Here to Help
                </h2>
                <p className="text-sm text-forest-700/75 leading-relaxed mb-8">
                  For technical issues related to the Evaluation System, reach the Office of
                  Institutional Technology. For academic record inquiries, contact the Registrar.
                  All correspondence should use your official TLSU institutional email address.
                </p>
                <div className="space-y-5">
                  {[
                    {
                      label: 'IT Support (System Access)',
                      value: 'itsupport@tlsu.edu.ph',
                      href: 'mailto:itsupport@tlsu.edu.ph',
                      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                    },
                    {
                      label: 'Office of the Registrar',
                      value: 'registrar@tlsu.edu.ph',
                      href: 'mailto:registrar@tlsu.edu.ph',
                      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                    },
                    {
                      label: 'Campus Address',
                      value: 'G. Leviste St., Poblacion, Malvar, Batangas, Philippines 4233',
                      href: null,
                      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
                    },
                  ].map(({ label, value, href, icon }) => (
                    <div key={label} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 bg-sage-300/25 border border-sage-300/40 p-2.5 rounded-xl text-forest-950">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-sage-500 mb-0.5">{label}</p>
                        {href ? (
                          <a href={href} className="text-sm text-forest-950 font-medium hover:text-sage-500 transition-colors duration-150 underline underline-offset-2">
                            {value}
                          </a>
                        ) : (
                          <p className="text-sm text-forest-700/80">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact CTA Card */}
              <div className="bg-forest-950 text-white rounded-3xl p-8 shadow-2xl border border-sage-300/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-sage-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-forest-700/30 rounded-full blur-2xl pointer-events-none" />
                <div className="relative">
                  <h3 className="font-serif text-2xl font-bold text-white mb-3">Can't Log In?</h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    If you've lost access to your institutional account or have never received
                    credentials, reach out to the IT Support Office. Include your student or
                    employee ID in your message for faster resolution.
                  </p>
                  <a
                    href="mailto:itsupport@tlsu.edu.ph"
                    className="inline-flex items-center space-x-2 bg-sage-500 hover:bg-forest-700 text-white text-sm font-bold py-3 px-6 rounded-xl transition-colors duration-150 hover:-translate-y-0.5 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email IT Support</span>
                  </a>
                  <p className="text-[10px] text-white/30 mt-4">
                    Response time: 1–2 business days during academic term.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-forest-950 relative z-10">

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-center md:text-left">

            {/* Column 1 — Identity */}
            <div className="flex flex-col items-center md:items-start space-y-4">
              <div className="flex items-center space-x-3">
                <img src={logoImg} alt="The Last Salle University Crest" className="h-11 w-11 object-contain flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-serif text-base font-bold tracking-tight text-white leading-tight">
                    The Last Salle University
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-sage-300 font-semibold mt-0.5">
                    Academic Portal
                  </span>
                </div>
              </div>
              <p className="text-xs text-white/45 leading-relaxed max-w-[220px]">
                Internal School Evaluation and RBAC Portal
              </p>
              <p className="text-[10px] text-white/30 leading-relaxed max-w-[220px]">
                Authorized personnel only. Unauthorized access is prohibited.
              </p>
            </div>

            {/* Column 2 — Quick Links (anchor scroll in footer) */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-sage-300 mb-5">
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => scrollToSection('home')}
                    className="text-xs text-white/55 hover:text-cream-100 transition-colors duration-150 ease-in-out"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="text-xs text-white/55 hover:text-cream-100 transition-colors duration-150 ease-in-out"
                  >
                    Login to System
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('faqs')}
                    className="text-xs text-white/55 hover:text-cream-100 transition-colors duration-150 ease-in-out"
                  >
                    FAQs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('contact')}
                    className="text-xs text-white/55 hover:text-cream-100 transition-colors duration-150 ease-in-out"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3 — Support */}
            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-sage-300 mb-5">
                Support
              </h3>
              <p className="text-xs text-white/45 leading-relaxed mb-4 max-w-[200px]">
                Having trouble accessing your account or the system?
              </p>
              {/* TODO: replace with real support contact / help-desk route */}
              <a
                href="mailto:itsupport@tlsu.edu.ph"
                className="inline-flex items-center space-x-2 text-xs text-sage-300 hover:text-cream-100 transition-colors duration-150 ease-in-out group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="group-hover:underline underline-offset-2">itsupport@tlsu.edu.ph</span>
              </a>
              <p className="text-[10px] text-white/30 mt-3 max-w-[200px] leading-relaxed">
                Office of Institutional Technology &amp; Assessment
              </p>
            </div>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-sage-300/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-white/35 text-center sm:text-left">
              © {new Date().getFullYear()} The Last Salle University. All rights reserved.
            </p>
            <p className="text-[10px] text-white/20 text-center sm:text-right">
              Evaluation System — Office of Institutional Quality &amp; Assessment
            </p>
          </div>
        </div>

      </footer>
    </div>
  );
};

export default LandingPage;