import { useAuth } from '../../context/AuthContext.jsx';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  FileText,
  User,
  LogOut,
  Search,
  X
} from 'lucide-react';
// Imports the logo/seal image file dynamically from your direct subdirectory folder
import universityLogo from '../../assets/logo/logo.png';

const StudentDashboard = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSignOut = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Assigned Subjects', path: '/student/assigned-subjects', icon: <BookOpen size={18} /> },
    { name: 'Evaluation Results', path: '/student/evaluation-results', icon: <ClipboardCheck size={18} /> },
    { name: 'Reports', path: '/student/reports', icon: <FileText size={18} /> },
    { name: 'Profile', path: '/student/profile', icon: <User size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf7] flex flex-col font-sans antialiased text-slate-800">

      {/* Top Header Navigation */}
      <header className="h-16 bg-white border-b border-slate-100 sticky top-0 z-40 px-6 flex items-center justify-between shadow-xs">
        {/* Logo identity section linking to imported image asset */}
        <div className="flex items-center gap-3">
          <div className="w-15 h-15 flex items-center justify-center overflow-hidden">
            <img
              src={universityLogo}
              alt="The Last Salle University Seal"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<div class="text-xs font-black text-[#0F2A1D]">TLSU</div>`;
              }}
            />
          </div>
          <div className="leading-tight">
            <h1 className="font-serif text-lg font-bold tracking-tight block leading-tight text-[#0F2A1D]">The Last Salle</h1>
            <p className="font-serif text-lg font-bold tracking-tight block leading-tight text-slate-400 uppercase tracking-widest -mt-0.5">University</p>
          </div>
        </div>

        {/* Global Context Search Box */}
        <div className="hidden md:flex items-center relative w-80">
          <Search className="absolute left-3.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search resources..."
            className="w-full bg-[#f4f7f3] border border-transparent text-xs pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#375534]/30 focus:bg-white transition-all text-slate-800 font-medium placeholder-slate-400"
          />
        </div>

        {/* Operational Profile Utilities without the Notification Bell component */}
        <div className="flex items-center gap-3">
          <div className="text-right leading-none hidden sm:block">
            <p className="text-xs font-black text-slate-900">John Bautista</p>
            <p className="text-[10px] font-bold text-slate-400 font-mono tracking-tight mt-1">TLSU-2023-00147</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs flex items-center justify-center shadow-2xs">
            J
          </div>
        </div>
      </header>

      {/* Workspace Structure */}
      <div className="flex-1 flex w-full">
        <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-4 shrink-0">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold tracking-wide transition-all duration-150
                    ${isActive
                      ? 'bg-[#0F2A1D] text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all group"
            >
              <LogOut size={18} className="text-slate-400 group-hover:text-rose-500" />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 max-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#0F2A1D] text-[#E3EED4] p-5 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-wider">Confirm Logout</h3>
              <button onClick={cancelLogout} className="text-[#AEC3B0] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} className="text-rose-600" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Are you sure you want to logout?</h4>
              <p className="text-sm text-slate-600">You will need to sign in again to access your account.</p>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={cancelLogout}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-all shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;