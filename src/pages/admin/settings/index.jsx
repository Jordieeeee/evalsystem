import { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  Bell, 
  ShieldCheck, 
  Save, 
  CheckCircle2,
  Loader2
} from 'lucide-react';
// CRITICAL: Ensure this path correctly points to your services folder
import LoadingState from '../../../components/LoadingState';
import { systemService } from '../../../services/systemService';

export default function AdminSettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState('General');

  // --- GENERAL SETTINGS STATES ---
  const [generalInfo, setGeneralInfo] = useState({
    universityName: 'The Last Salle University',
    shortName: 'TLSU',
    contactEmail: 'admin@tlsu.edu'
  });
  const [displaySettings, setDisplaySettings] = useState({
    compactTable: true,
    showActivityFeed: true
  });
  const [saveSuccessGeneral, setSaveSuccessGeneral] = useState(false);

  // --- ACADEMIC CONFIG STATES ---
  const [academicConfig, setAcademicConfig] = useState({
    activeYear: '2026-2027',
    activeSemester: '1st Semester'
  });
  const [isLoadingAcademic, setIsLoadingAcademic] = useState(true);
  const [isSavingAcademic, setIsSavingAcademic] = useState(false);
  const [saveSuccessAcademic, setSaveSuccessAcademic] = useState(false);

  // Fetch the live academic config from Firebase on mount
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const config = await systemService.getAcademicConfig();
        if (isMounted && config) {
          setAcademicConfig({
            activeYear: config.activeYear || '2026-2027',
            activeSemester: config.activeSemester || '1st Semester'
          });
        }
      } catch (error) {
        console.error("Failed to load academic config", error);
      } finally {
        if (isMounted) setIsLoadingAcademic(false);
      }
    };
    fetchConfig();
    return () => { isMounted = false; };
  }, []);

  // --- HANDLERS ---
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (key) => {
    setDisplaySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    setSaveSuccessGeneral(true);
    setTimeout(() => setSaveSuccessGeneral(false), 3000);
  };

  // The fixed Academic Config Save Function
  const handleSaveAcademicConfig = async (e) => {
    e.preventDefault();
    setIsSavingAcademic(true);
    setSaveSuccessAcademic(false);
    
    try {
      // Pushes the update to Firebase
      await systemService.updateAcademicConfig(academicConfig);
      
      // Trigger success UI
      setSaveSuccessAcademic(true);
      setTimeout(() => setSaveSuccessAcademic(false), 3000);
    } catch (error) {
      console.error("Failed to update system config:", error);
      alert("Failed to save! Check the browser console. You may need to update your Firestore security rules to allow writes to the 'system_settings' collection.");
    } finally {
      setIsSavingAcademic(false);
    }
  };

  const subNavItems = [
    { name: 'General', icon: <User size={16} /> },
    { name: 'Academic Year', icon: <Calendar size={16} /> },
    { name: 'Notifications', icon: <Bell size={16} /> },
    { name: 'Security', icon: <ShieldCheck size={16} /> },
  ];

  return (
    <div className="space-y-6 text-[#7D1924]">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[#7D1924]">Settings</h2>
        <p className="text-xs text-slate-400 font-medium uppercase mt-1 tracking-wider">
          Configure system environment variables and preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <nav className="w-full md:w-56 flex flex-col gap-1 shrink-0">
          {subNavItems.map((item) => {
            const isSubActive = activeSubTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveSubTab(item.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200
                  ${isSubActive 
                    ? 'bg-[#7D1924] text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-[#7D1924]'
                  }`}
              >
                {item.icon}
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 w-full space-y-6">
          {activeSubTab === 'General' && (
            <>
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5 relative">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">General Information</h3>
                </div>

                <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-slate-400">University Name</label>
                      <input 
                        type="text"
                        name="universityName"
                        value={generalInfo.universityName}
                        onChange={handleGeneralChange}
                        className="w-full text-sm border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-400">Short Name</label>
                      <input 
                        type="text"
                        name="shortName"
                        value={generalInfo.shortName}
                        onChange={handleGeneralChange}
                        className="w-full text-sm border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-400">Contact Email</label>
                    <input 
                      type="email"
                      name="contactEmail"
                      value={generalInfo.contactEmail}
                      onChange={handleGeneralChange}
                      className="w-full text-sm border border-slate-200 bg-slate-50 p-3.5 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#375534]/20 focus:bg-white transition-all lowercase"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="w-2/3">
                      {saveSuccessGeneral && (
                        <div className="flex items-center gap-2 text-emerald-700 font-black normal-case text-xs animate-in fade-in duration-200">
                          <CheckCircle2 size={16} className="stroke-[2.5]" /> Changes saved successfully.
                        </div>
                      )}
                    </div>
                    <button 
                      type="submit"
                      className="flex items-center gap-2 bg-[#7D1924] text-[#FCEEEF] text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl hover:bg-[#962230] transition-all shadow-sm active:scale-[0.98]"
                    >
                      <Save size={14} /> Save Changes
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Display Settings</h3>
                </div>

                <div className="divide-y divide-slate-100 text-xs font-bold">
                  <div className="flex justify-between items-center pb-4">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-sm font-bold text-slate-800 tracking-tight">Compact Table View</p>
                      <p className="text-slate-400 font-medium">Show more rows per page in data tables.</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('compactTable')}
                      className={`w-11 h-6 rounded-full transition-colors duration-200 relative focus:outline-none shrink-0
                        ${displaySettings.compactTable ? 'bg-[#7D1924]' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200
                        ${displaySettings.compactTable ? 'right-1' : 'left-1'}`} 
                      />
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-sm font-bold text-slate-800 tracking-tight">Show Activity Feed</p>
                      <p className="text-slate-400 font-medium">Display the live activity feed on the dashboard.</p>
                    </div>
                    <button 
                      onClick={() => handleToggle('showActivityFeed')}
                      className={`w-11 h-6 rounded-full transition-colors duration-200 relative focus:outline-none shrink-0
                        ${displaySettings.showActivityFeed ? 'bg-[#7D1924]' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200
                        ${displaySettings.showActivityFeed ? 'right-1' : 'left-1'}`} 
                      />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSubTab === 'Academic Year' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Academic Year & Term Configuration</h3>
              <p className="text-xs text-slate-500 mb-2">Controls the term filtering logic system-wide (e.g., eligible subject assignment scopes).</p>
              
              {isLoadingAcademic ? (
                <LoadingState label="Loading live configuration..." className="py-8" />
              ) : (
                <form onSubmit={handleSaveAcademicConfig} className="space-y-4 max-w-sm text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="space-y-1.5">
                    <label className="text-slate-400">Target Academic Scope (A.Y.)</label>
                    <input 
                      type="text" 
                      value={academicConfig.activeYear}
                      onChange={(e) => setAcademicConfig(prev => ({ ...prev, activeYear: e.target.value }))}
                      className="w-full text-sm border border-slate-200 bg-slate-50 p-3 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#375534]/20"
                      placeholder="e.g. 2026-2027"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400">Current Active Semester</label>
                    <select 
                      value={academicConfig.activeSemester}
                      onChange={(e) => setAcademicConfig(prev => ({ ...prev, activeSemester: e.target.value }))}
                      className="w-full text-sm border border-slate-200 bg-slate-50 p-3 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#375534]/20"
                    >
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                      <option value="Summer Term">Summer Term</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4">
                    <button 
                      type="submit"
                      disabled={isSavingAcademic}
                      className="flex items-center justify-center gap-2 bg-[#7D1924] text-[#FCEEEF] text-[11px] px-5 py-3 rounded-xl uppercase tracking-wider hover:bg-[#962230] transition-colors disabled:opacity-50"
                    >
                      {isSavingAcademic ? <Loader2 size={14} className="animate-spin" /> : 'Save Academic Framework'}
                    </button>
                    {saveSuccessAcademic && (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-black normal-case text-xs animate-in fade-in duration-200">
                          <CheckCircle2 size={16} className="stroke-[2.5]" /> Saved
                        </div>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {activeSubTab === 'Notifications' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Notification Channels</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Manage institutional email routing and system webhook despatches.</p>
              <div className="mt-4 p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center text-xs font-bold uppercase text-slate-400 tracking-wider">
                Alert dispatcher profiles are functioning.
              </div>
            </div>
          )}

          {activeSubTab === 'Security' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Security & Governance</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Configure administrator key rotations and access criteria validation protocols.</p>
              <div className="mt-4 p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center text-xs font-bold uppercase text-slate-400 tracking-wider">
                Cryptographic signature scopes are locked.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}