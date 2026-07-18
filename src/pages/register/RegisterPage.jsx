import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { claimStudentAccount, ClaimRejectedError } from '../../services/registrationService.js';
import { isValidSrCode, isPasswordLongEnough, deriveEmail } from '../../utils/studentAuth.js';
import { Button } from '../../components/ui/Button.jsx';
import { ErrorMessage } from '../../components/ui/ErrorMessage.jsx';
import logoImg from '../../assets/logo/logo.png';
import tlsuschool from '../../assets/landingpage/tlsuschool.png';

// Maps Firebase Auth error codes and our own ClaimRejectedError codes to the
// copy a student should see. Kept out of the JSX so the reject-case wording
// required by spec ("No admitted record — contact the registrar.",
// "Account already claimed.") lives in exactly one place.
const describeClaimError = (err) => {
  if (err instanceof ClaimRejectedError) {
    return err.message;
  }
  switch (err?.code) {
    case 'auth/email-already-in-use':
      // Could mean genuinely already claimed, OR an orphaned Auth account left
      // behind by a previous claim attempt whose Firestore write failed — see
      // the KNOWN LIMITATIONS note in registrationService.js. Either way the
      // student can't self-serve past this; the registrar has to look.
      return 'This account already exists. If you already claimed it, try signing in. Otherwise, contact the registrar.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'Something went wrong while creating your account. Please try again.';
  }
};

const RegisterPage = () => {
  const [srCode, setSrCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'student') {
      navigate('/student/dashboard', { replace: true });
    }
  }, [role, navigate]);

  const validate = () => {
    const errors = {};
    if (!isValidSrCode(srCode)) {
      errors.srCode = 'Enter a valid SR-Code, e.g. 23-08214.';
    }
    if (!isPasswordLongEnough(password)) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleClaim = async () => {
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await claimStudentAccount(srCode.trim(), password);
      // Success routes through AuthContext: createUserWithEmailAndPassword signs
      // the new user in, onAuthStateChanged picks it up, resolves role: 'student'
      // from the just-claimed students/{srCode} doc, and the effect above navigates.
    } catch (err) {
      setFormError(describeClaimError(err));
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleClaim();
    }
  };

  const trimmedSrCode = srCode.trim();
  const emailPreview = isValidSrCode(trimmedSrCode) ? deriveEmail(trimmedSrCode) : null;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800"
            alt="The Last Salle University campus quad and main building lobby"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-cream-100/80" />
        </div>
        <div className="font-serif text-lg font-bold tracking-tight block leading-tight text-forest-950 animate-pulse relative z-10">Loading System...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
        <img
          src={tlsuschool}
          alt="The Last Salle University campus quad and main building lobby"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-cream-100/80" />
      </div>
      <style>{`
        @keyframes fadeInScaleUp {
          from { opacity: 0; transform: scale(0.97) skewY(-12deg) scaleY(1.5); }
          to { opacity: 1; transform: scale(1) skewY(-12deg) scaleY(1.5); }
        }
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInSimple {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-scale-up { animation: fadeInScaleUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 50ms forwards; }
        .animate-fade-in-slide-up { animation: fadeInSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) 150ms forwards; }
        .animate-fade-in-simple { animation: fadeInSimple 400ms cubic-bezier(0.16, 1, 0.3, 1) 400ms forwards; }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-scale-up, .animate-fade-in-slide-up, .animate-fade-in-simple, .transition-all, .transition-transform {
            animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important;
          }
          .animate-fade-in-scale-up { transform: skewY(-12deg) scaleY(1.5) !important; }
        }
      `}</style>

      {/* Decorative Brand Textures */}
      <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-br from-forest-700/10 via-sage-300/10 to-transparent pointer-events-none transform -skew-y-12 origin-top-right scale-y-150 opacity-0 animate-fade-in-scale-up z-10" />
      <div className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-sage-500/10 blur-3xl pointer-events-none opacity-0 animate-fade-in-simple z-10" />
      <div className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-forest-950/10 blur-3xl pointer-events-none opacity-0 animate-fade-in-simple z-10" />

      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px] relative z-20 border border-sage-300/20 opacity-0 animate-fade-in-slide-up">

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
            <div className="flex items-center space-x-3">
              <img src={logoImg} alt="The Last Salle University Crest" className="h-28 w-28 object-contain" />
              <div>
                <span className="font-serif text-lg font-bold tracking-tight block leading-tight">
                  The Last Salle University
                </span>
                <span className="font-serif text-lg font-bold tracking-tight block leading-tight text-sage-300">
                  Evaluation System
                </span>
              </div>
            </div>

            <div className="mt-8 md:mt-0">
              <h2 className="font-serif text-lg font-bold tracking-tight block leading-tight">
                Claim Your Student Account
              </h2>
              <p className="font-serif text-lg font-bold tracking-tight block leading-tight text-sage-300/90 mt-2 max-w-xs leading-relaxed">
                Your record was admitted by the Registrar. Set a password once to activate self-service access to your evaluation records.
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Form Panel */}
        <div className="relative w-full md:w-1/2 bg-white flex flex-col justify-center p-8 md:p-12">
          <div className="hidden md:block absolute top-0 bottom-0 -left-12 w-12 overflow-hidden pointer-events-none">
            <svg className="h-full w-full text-white fill-current" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M100,0 Q 0,25 50,50 T 100,100 Z" />
            </svg>
          </div>

          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex items-center space-x-2 text-forest-700 hover:text-forest-950 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-serif text-lg font-bold tracking-tight block leading-tight">Back</span>
          </button>

          <div className="relative z-10 max-w-sm w-full mx-auto" onKeyDown={handleKeyDown}>
            <div className="text-center md:text-left mb-8">
              <h3 className="font-serif text-3xl font-bold tracking-tight block leading-tight text-forest-950">
                Claim Your Account
              </h3>
              <p className="font-serif text-md font-bold tracking-tight block leading-tight text-forest-700/70 mt-1">
                First time here? Set your password to activate access.
              </p>
            </div>

            <div className="space-y-5">
              {/* SR-Code Input */}
              <div className="flex flex-col">
                <label htmlFor="srCode" className="mb-1.5 font-serif text-sm font-bold tracking-tight block leading-tight text-forest-700">
                  SR-Code
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sage-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="srCode"
                    placeholder="23-08214"
                    value={srCode}
                    onChange={(e) => {
                      setSrCode(e.target.value);
                      setFormError(null);
                      setFieldErrors((prev) => ({ ...prev, srCode: undefined }));
                    }}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-sage-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-sm bg-cream-100/20 text-forest-950 placeholder-forest-950/30 transition-all duration-200"
                  />
                </div>
                {fieldErrors.srCode ? (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors.srCode}</p>
                ) : emailPreview ? (
                  <p className="mt-1.5 text-xs text-forest-700/60">Account email: <span className="font-semibold text-forest-700">{emailPreview}</span></p>
                ) : null}
              </div>

              {/* Password Input */}
              <div className="flex flex-col">
                <label htmlFor="password" className="mb-1.5 font-serif text-sm font-bold tracking-tight block leading-tight text-forest-700">
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
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormError(null);
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
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
                {fieldErrors.password && <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors.password}</p>}
              </div>

              {/* Confirm Password Input */}
              <div className="flex flex-col">
                <label htmlFor="confirmPassword" className="mb-1.5 font-serif text-sm font-bold tracking-tight block leading-tight text-forest-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sage-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFormError(null);
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    required
                    className="w-full pl-10 pr-10 py-3 border border-sage-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 text-sm bg-cream-100/20 text-forest-950 placeholder-forest-950/30 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-sage-500 hover:text-forest-700 focus:outline-none"
                  >
                    {showConfirmPassword ? (
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
                {fieldErrors.confirmPassword && <p className="mt-1.5 text-xs font-semibold text-red-600">{fieldErrors.confirmPassword}</p>}
              </div>

              <ErrorMessage message={formError} />

              <Button
                type="button"
                onClick={handleClaim}
                disabled={loading}
                className="w-full !bg-sage-500 hover:!bg-forest-700 text-white font-serif text-lg font-bold tracking-tight block leading-tight py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 ease-in-out hover:-translate-y-0.5 active:scale-[0.98] active:duration-100 border-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500/50 focus-visible:ring-offset-2"
              >
                {loading ? 'Creating account...' : 'Claim Account'}
              </Button>

              <p className="text-center text-xs text-forest-700/60 pt-1">
                Already claimed your account?{' '}
                <Link to="/login" className="font-bold text-sage-500 hover:text-forest-700 transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
