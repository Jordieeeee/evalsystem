import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { signIn } from '../services/authService.js';
import { Button } from '../components/ui/Button.jsx';
import { ErrorMessage } from '../components/ui/ErrorMessage.jsx';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { role, authError, loading: authLoading, clearAuthError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'student') {
      navigate('/student/dashboard', { replace: true });
    }
  }, [role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    clearAuthError();
    setLoading(true);

    try {
      await signIn(email, password);
      // After successful sign-in, AuthContext will handle role fetching and redirect
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleInputChange = () => {
    setError(null);
    clearAuthError();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="text-forest-950 font-semibold animate-pulse">Loading System...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 p-4 md:p-8 relative overflow-hidden font-sans">
      <style>{`
        @keyframes fadeInScaleUp {
          from {
            opacity: 0;
            transform: scale(0.97) skewY(-12deg) scaleY(1.5);
          }
          to {
            opacity: 1;
            transform: scale(1) skewY(-12deg) scaleY(1.5);
          }
        }
        @keyframes fadeInSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
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
        
        .animate-fade-in-scale-up {
          animation: fadeInScaleUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 50ms forwards;
        }
        .animate-fade-in-slide-up {
          animation: fadeInSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 150ms forwards;
        }
        .animate-fade-in-simple {
          animation: fadeInSimple 400ms cubic-bezier(0.16, 1, 0.3, 1) 400ms forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-scale-up,
          .animate-fade-in-slide-up,
          .animate-fade-in-simple,
          .transition-all,
          .transition-transform {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .animate-fade-in-scale-up {
            transform: skewY(-12deg) scaleY(1.5) !important;
          }
        }
      `}</style>

      {/* Decorative Brand Textures */}
      <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-br from-forest-700/10 via-sage-300/10 to-transparent pointer-events-none transform -skew-y-12 origin-top-right scale-y-150 opacity-0 animate-fade-in-scale-up" />
      <div className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-sage-500/10 blur-3xl pointer-events-none opacity-0 animate-fade-in-simple" />
      <div className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-forest-950/10 blur-3xl pointer-events-none opacity-0 animate-fade-in-simple" />

      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px] relative z-10 border border-sage-300/20 opacity-0 animate-fade-in-slide-up">
        
        {/* Left Panel: Image Panel (Collapses on Mobile) */}
        <div className="relative md:w-1/2 bg-forest-950 flex flex-col justify-between p-8 text-white min-h-[200px] md:min-h-full">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800"
              alt="The Last Salle University Campus"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-sage-500/60 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/20 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Institutional Branding */}
            <div>
              <span className="font-serif text-lg font-bold tracking-tight block">
                The Last Salle University
              </span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-sage-300">
                Evaluation System
              </span>
            </div>

            <div className="mt-8 md:mt-0">
              <h2 className="text-xl md:text-3xl font-serif font-bold leading-tight">
                Fostering Academic Excellence
              </h2>
              <p className="text-xs md:text-sm text-sage-300/90 mt-2 max-w-xs leading-relaxed">
                Secure portal for role-based academic evaluations, administrative reviews, and institutional feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Form Panel */}
        <div className="relative w-full md:w-1/2 bg-white flex flex-col justify-center p-8 md:p-12">
          {/* Wavy Divider - visible only on medium screens and up */}
          <div className="hidden md:block absolute top-0 bottom-0 -left-12 w-12 overflow-hidden pointer-events-none">
            <svg
              className="h-full w-full text-white fill-current"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path d="M100,0 Q 0,25 50,50 T 100,100 Z" />
            </svg>
          </div>

          <div className="relative z-10 max-w-sm w-full mx-auto">
            <div className="text-center md:text-left mb-8">
              <span className="text-[11px] font-bold text-forest-700 uppercase tracking-widest block mb-2">
                Internal Access Only
              </span>
              <h3 className="text-3xl font-extrabold text-forest-950 tracking-tight">
                Welcome Back
              </h3>
              <p className="text-sm text-forest-700/70 mt-1">
                Sign in to access the Evaluation System
              </p>
            </div>

            {authError && <ErrorMessage message={authError} />}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="flex flex-col">
                <label htmlFor="email" className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
                  School Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sage-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v2a3 3 0 003 3m0-0V9a2 2 0 00-2-2h-2m-9-5H9M5 8h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="email"
                    placeholder="username@tlsu.edu.ph"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      handleInputChange();
                    }}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-sage-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-sm bg-cream-100/20 text-forest-950 placeholder-forest-950/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col">
                <label htmlFor="password" className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sage-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      handleInputChange();
                    }}
                    required
                    className="w-full pl-10 pr-10 py-3 border border-sage-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-sm bg-cream-100/20 text-forest-950 placeholder-forest-950/30 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-sage-500 hover:text-forest-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <ErrorMessage message={error} />

              <Button
                type="submit"
                disabled={loading}
                className="w-full !bg-sage-500 hover:!bg-forest-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 ease-in-out hover:-translate-y-0.5 active:scale-[0.98] active:duration-100 text-base border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/50 focus-visible:ring-offset-2"
              >
                {loading ? 'Signing in...' : 'Log In'}
              </Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
