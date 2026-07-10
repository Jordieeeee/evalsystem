import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useState } from 'react';
import { LogOut, X } from 'lucide-react';

const StudentDashboard = () => {
  const { signOut } = useAuth();
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600 text-lg">Coming Soon</p>
        </div>
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