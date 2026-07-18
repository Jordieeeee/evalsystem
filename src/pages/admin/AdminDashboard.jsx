import { useAuth } from '../../context/AuthContext.jsx';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  Search
} from 'lucide-react';
import universitySeal from '../../assets/logo/logo.png';
import ConfirmLogoutModal from '../../components/ConfirmLogoutModal.jsx';

const AdminDashboard = () => {
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
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Students', path: '/admin/students', icon: <Users size={18} /> },
    { name: 'Subjects', path: '/admin/subjects', icon: <BookOpen size={18} /> },
    { name: 'Evaluation', path: '/admin/evaluation', icon: <ClipboardCheck size={18} /> },
    { name: 'Reports', path: '/admin/reports', icon: <FileBarChart2 size={18} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf7] flex flex-col font-sans antialiased text-slate-800">

      {/* Top Header Navigation */}
      <header className="h-16 bg-white border-b border-slate-100 sticky top-0 z-40 px-6 flex items-center justify-between shadow-xs">
        {/* Logo and Brand Title Identity */}
        <div className="flex items-center gap-3">
          <div className="w-15 h-15 flex items-center justify-center overflow-hidden">
            <img
              src={universitySeal}
              alt="The Last Salle University Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<div class="text-xs font-black text-[#7D1924]">TLSU</div>`;
              }}
            />
          </div>

          <div className="leading-tight">
            <h1 className="font-serif text-lg font-bold tracking-tight block leading-tight text-[#7D1924]">The Last Salle</h1>
            <p className="font-serif text-lg font-bold tracking-tight block leading-tight text-slate-400 uppercase tracking-widest -mt-0.5">University</p>
          </div>
        </div>

        {/* Operational Profile Utilities */}
        <div className="flex items-center gap-4">
          {/* Admin Account Information Box Element */}
          <div className="flex items-center gap-3">
            <div className="text-right leading-none hidden sm:block">
              <p className="text-xs font-black text-slate-900">Administrator</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Portal Management</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs flex items-center justify-center shadow-2xs">
              A
            </div>
          </div>
        </div>
      </header>

      {/* Workspace Frame Wrapper Section */}
      <div className="flex-1 flex w-full">

        {/* Left Side Sidebar Panel */}
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
                      ? 'bg-[#7D1924] text-white shadow-sm'
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

          {/* Sidebar Footer Log Out Element */}
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

        {/* Dynamic Inner Component Workspace Canvas Panel */}
        <main className="flex-1 overflow-y-auto p-8 max-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>

      </div>

      {/* Redesigned Logout Confirmation Modal */}
      <ConfirmLogoutModal
        isOpen={showLogoutModal}
        onCancel={cancelLogout}
        onConfirm={confirmLogout}
      />

    </div>
  );
};

export default AdminDashboard;