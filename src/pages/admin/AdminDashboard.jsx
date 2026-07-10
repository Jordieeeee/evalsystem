import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Link, Outlet, useLocation } from 'react-router-dom';
import logo from '/src/assets/logo/logo.png';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  FileBarChart2,
  Settings,
  LogOut,
  Bell,
  Moon,
  ChevronDown,
  Search,
  X
} from 'lucide-react';

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSignOut = async () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
    { name: 'Students', path: '/admin/students', icon: <Users size={16} /> },
    { name: 'Subjects', path: '/admin/subjects', icon: <BookOpen size={16} /> },
    { name: 'Evaluation', path: '/admin/evaluation', icon: <ClipboardCheck size={16} /> },
    { name: 'Reports', path: '/admin/reports', icon: <FileBarChart2 size={16} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5e9] flex flex-col font-sans antialiased text-slate-800">

      {/* 1. Global High-End Top Navigation Bar (Matches Landing Page Layout Exactly) */}
      <header className="h-16 bg-white border-b border-slate-200/60 sticky top-0 z-40 px-6 flex items-center justify-between shadow-xs">
        {/* Left Side: Brand Logo and School Name Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-50 p-0.5 border border-slate-200 flex items-center justify-center overflow-hidden shadow-xs">
            <img
              src={logo}
              alt="The Last Salle University Seal"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<div class="text-[9px] font-black text-[#0F2A1D]">TLSU</div>`;
              }}
            />
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight block leading-tight text-sm font-black uppercase tracking-wider text-[#0F2A1D] leading-none">The Last Salle University</h1>
            <p className="font-serif text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Administrator Portal</p>
          </div>
        </div>

        {/* Middle: Integrated Global Context Search Bar */}
        <div className="hidden md:flex items-center relative w-80">
          <Search className="absolute left-3.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search students, subjects, evaluations..."
            className="w-full bg-slate-50 border border-slate-200 text-xs pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#375534]/15 focus:bg-white transition-all text-slate-800 font-semibold placeholder-slate-400"
          />
        </div>

        {/* Right Side: Operational Utilities & Profile Dropdown */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-500 hover:text-[#0F2A1D] hover:bg-slate-100 rounded-xl transition-all relative">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-600 rounded-full" />
          </button>
          <button className="p-2 text-slate-500 hover:text-[#0F2A1D] hover:bg-slate-100 rounded-xl transition-all">
            <Moon size={16} />
          </button>

          <div className="h-5 w-[1px] bg-slate-200 mx-1" />

          {/* Admin Avatar Identity Item */}
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-[#0F2A1D] text-[#E3EED4] font-black text-xs flex items-center justify-center shadow-inner">
              A
            </div>
            <div className="hidden sm:block text-left leading-none">
              <p className="font-serif text-lg font-bold tracking-tight block leading-tight text-xs font-black text-slate-800 flex items-center gap-1 group-hover:text-[#0F2A1D]">
                Administrator <ChevronDown size={12} className="text-slate-400" />
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Structure Frame Below Top Nav */}
      <div className="flex-1 flex p-4 gap-4 w-full mx-auto min-h-[calc(screen-4rem)]">

        {/* Left Sidebar Layout Panel */}
        <aside className="w-60 bg-[#0F2A1D] rounded-3xl flex flex-col justify-between shadow-lg border border-emerald-950/30 p-3 shrink-0 text-[#E3EED4]]">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 group
                    ${isActive
                      ? 'bg-[#E3EED4] text-[#0F2A1D] shadow-sm font-black'
                      : 'text-[#AEC3B0] hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span className={`transition-transform group-hover:scale-105 ${isActive ? 'text-[#0F2A1D]' : 'text-[#6B9071]'}`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Account Action Button */}
          <div className="pt-2 border-t border-emerald-900/40">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 bg-rose-950/20 hover:bg-rose-900/60 text-rose-200 text-xs font-bold tracking-wider uppercase py-3 rounded-xl border border-rose-900/30 transition-all"
            >
              <LogOut size={14} />
              Log Out
            </button>
          </div>
        </aside>

        {/* 3. Core Working Canvas Base Container */}
        <main className="flex-1 bg-white border border-slate-200/70 rounded-3xl shadow-xs overflow-y-auto max-h-[92vh] p-8">
          {/* Outlet seamlessly handles content switching inside child layouts without overriding dashboard sub-features */}
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

export default AdminDashboard;