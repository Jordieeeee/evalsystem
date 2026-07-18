import { useState, useEffect } from 'react';
import { User, Calendar, Save, CheckCircle2, Loader2 } from 'lucide-react';
import LoadingState from '../../../components/LoadingState';
import { systemService } from '../../../services/systemService';

export default function AdminSettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState('General');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // --- FORM DATA REGISTRIES ---
  const [generalInfo, setGeneralInfo] = useState({
    universityName: '',
    shortName: '',
    contactEmail: ''
  });

  const [displaySettings, setDisplaySettings] = useState({
    compactTable: true,
    showActivityFeed: true
  });

  const [academicConfig, setAcademicConfig] = useState({
    activeYear: '',
    activeSemester: ''
  });

  // --- SAFELY PRELOAD ALL SYSTEM VARIABLES ON MOUNT ---
  useEffect(() => {
    let isMounted = true;
    const loadSystemPreferences = async () => {
      try {
        setIsLoading(true);
        const [general, academic] = await Promise.all([
          systemService.getGeneralSettings(),
          systemService.getAcademicConfig()
        ]);

        if (isMounted) {
          if (general) {
            setGeneralInfo({
              universityName: general.universityName || 'The Last Salle University',
              shortName: general.shortName || 'TLSU',
              contactEmail: general.contactEmail || 'admin@tlsu.edu'
            });
            setDisplaySettings({
              compactTable: general.compactTable ?? true,
              showActivityFeed: general.showActivityFeed ?? true
            });
          }
          if (academic) {
            setAcademicConfig({
              activeYear: academic.activeYear || '2026-2027',
              activeSemester: academic.activeSemester || '1st Semester'
            });
          }
        }
      } catch (error) {
        console.error("Critical failure resolving settings architecture bounds:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadSystemPreferences();
    return () => { isMounted = false; };
  }, []);

  // --- PERSISTENCE HANDLERS ---
  const handleInputChange = (e, stateSetter) => {
    const { name, value } = e.target;
    stateSetter(prev => ({ ...prev, [name]: value }));
  };

  const handleDisplayToggle = async (key) => {
    const nextValue = !displaySettings[key];
    setDisplaySettings(prev => ({ ...prev, [key]: nextValue }));
    try {
      await systemService.updateGeneralSettings({ [key]: nextValue });
    } catch (error) {
      console.error("Failed to commit live layout setting change:", error);
      setDisplaySettings(prev => ({ ...prev, [key]: !nextValue }));
    }
  };

  const handleFormSubmit = async (e, updateFn, payload) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateFn(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Strategic settings rewrite transaction failed:", error);
      alert("Strategic matrix write rejected. Confirm firestore collection write rule parameters.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState label="Resolving System Environment Matrix..." className="py-20" />;
  }

  const subNavItems = [
    { id: 'General', label: 'General Framework', icon: <User size={16} /> },
    { id: 'Academic', label: 'Academic Term', icon: <Calendar size={16} /> }
  ];

  return (
    <div className="space-y-6 text-[#7D1924]">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-[#7D1924]">Settings</h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mt-1 tracking-wider">
          Configure runtime environment variables and core database preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Minimal Nav Toolbar Selection Strip */}
        <nav className="w-full md:w-56 flex flex-col gap-1 shrink-0">
          {subNavItems.map((item) => {
            const isSubActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveSubTab(item.id); setSaveSuccess(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer
                  ${isSubActive 
                    ? 'bg-[#7D1924] text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-[#7D1924]'
                  }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Primary Functional Area Workspace Panel */}
        <div className="flex-1 w-full space-y-6">
          
          {/* --- VIEW: GENERAL BLOCK CONFIG --- */}
          {activeSubTab === 'General' && (
            <>
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xs text-left space-y-5">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Institutional Architecture Identifiers</h3>
                
                <form 
                  onSubmit={(e) => handleFormSubmit(e, systemService.updateGeneralSettings, generalInfo)} 
                  className="space-y-4 text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-slate-400 font-semibold text-[10px]">University Institutional Wordmark</label>
                      <input 
                        type="text"
                        name="universityName"
                        value={generalInfo.universityName}
                        onChange={(e) => handleInputChange(e, setGeneralInfo)}
                        className="w-full text-sm font-bold border border-slate-200 bg-slate-50/50 p-3 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all normal-case"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-400 font-semibold text-[10px]">Short Codename</label>
                      <input 
                        type="text"
                        name="shortName"
                        value={generalInfo.shortName}
                        onChange={(e) => handleInputChange(e, setGeneralInfo)}
                        className="w-full text-sm font-bold border border-slate-200 bg-slate-50/50 p-3 rounded-xl text-slate-800 text-center focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-400 font-semibold text-[10px]">Primary Contact Hub Inbound Email</label>
                    <input 
                      type="email"
                      name="contactEmail"
                      value={generalInfo.contactEmail}
                      onChange={(e) => handleInputChange(e, setGeneralInfo)}
                      className="w-full text-sm font-bold border border-slate-200 bg-slate-50/50 p-3 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all lowercase"
                      required
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <div className="w-2/3">
                      {saveSuccess && (
                        <div className="flex items-center gap-2 text-emerald-600 font-black normal-case text-xs animate-in fade-in duration-200">
                          <CheckCircle2 size={15} className="stroke-[2.5]" /> General framework options mapped successfully.
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-[#7D1924] hover:bg-[#60121a] text-white text-xs font-black px-5 py-3 rounded-xl shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                      <span>Save Framework Changes</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Display Table Control Options */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xs text-left space-y-5">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Interface Experience Configuration</h3>
                
                <div className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  <div className="flex justify-between items-center pb-4">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-sm font-bold text-slate-800 tracking-tight">Compact Table Row Sizing</p>
                      <p className="text-slate-400 text-[11px] font-medium normal-case">Densely render cell margins inside evaluation sheets to display maximum student data metrics.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleDisplayToggle('compactTable')}
                      className={`w-11 h-6 rounded-full transition-colors relative outline-none shrink-0 cursor-pointer ${displaySettings.compactTable ? 'bg-[#7D1924]' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${displaySettings.compactTable ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-sm font-bold text-slate-800 tracking-tight">Dashboard Activity Logging Feed</p>
                      <p className="text-slate-400 text-[11px] font-medium normal-case">Stream and process dynamic user mutation parameters live on the admin overview panel.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleDisplayToggle('showActivityFeed')}
                      className={`w-11 h-6 rounded-full transition-colors relative outline-none shrink-0 cursor-pointer ${displaySettings.showActivityFeed ? 'bg-[#7D1924]' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${displaySettings.showActivityFeed ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* --- VIEW: ACADEMIC CALENDAR MODEL GATING --- */}
          {activeSubTab === 'Academic' && (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xs text-left space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Academic Year Lifecycle Bounds</h3>
                <p className="text-slate-400 text-[11px] font-medium mt-0.5 normal-case">Controls scheduling checks, prerequisites evaluations, and system fallback limits campus-wide.</p>
              </div>

              <form 
                onSubmit={(e) => handleFormSubmit(e, systemService.updateAcademicConfig, academicConfig)} 
                className="space-y-4 max-w-sm text-xs font-bold text-slate-500 uppercase tracking-wider pt-2"
              >
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold text-[10px]">Active Academic Term Scope (A.Y.)</label>
                  <input 
                    type="text"
                    name="activeYear"
                    value={academicConfig.activeYear}
                    onChange={(e) => handleInputChange(e, setAcademicConfig)}
                    className="w-full text-sm font-bold border border-slate-200 bg-slate-50/50 p-3 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all"
                    placeholder="e.g. 2026-2027"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold text-[10px]">Active Operational Term Semester</label>
                  <select 
                    name="activeSemester"
                    value={academicConfig.activeSemester}
                    onChange={(e) => handleInputChange(e, setAcademicConfig)}
                    className="w-full text-sm font-bold border border-slate-200 bg-slate-50/50 p-3 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-200 transition-all cursor-pointer"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer Term">Summer Term</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-4 pt-2">
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 bg-[#7D1924] hover:bg-[#60121a] text-white text-xs font-black px-5 py-3 rounded-xl shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                    <span>Commit Academic Framework</span>
                  </button>
                  {saveSuccess && (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-black normal-case text-xs animate-in fade-in duration-200">
                      <CheckCircle2 size={15} className="stroke-[2.5]" /> Configurations Persisted
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}