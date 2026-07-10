import { Link } from 'react-router-dom';

const Footer = ({ scrollToSection, logoImg }) => {
  return (
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
  );
};

export default Footer;
