import { useEffect, useState } from 'react';
import {
  Edit2,
  ShieldAlert,
  MailWarning,
  Mail,
  Phone,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import LoadingState from '../../../components/LoadingState';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      try {
        setLoading(true);
        const profile = await studentService.getProfile(user.uid);
        if (profile) {
          setStudentInfo({
            ...profile,
            name: profile.name || user.displayName || user.email?.split('@')[0] || 'Student',
            id: profile.studentId || profile.id || user.uid,
            classification: profile.classification || 'REGULAR',
            program: profile.program || profile.course || 'BSIT',
            yearSection: profile.yearSection || `${profile.year || '1'}${profile.year ? 'st' : ''} Year`,
            academicYear: profile.academicYear || '2025–2026',
            semester: profile.semester || '1st Semester',
            email: profile.email || user.email || '',
            contactNumber: profile.contactNumber || '-',
            address: profile.address || '-',
            completionPercentage: profile.completionPercentage || 0,
            earnedUnits: profile.earnedUnits || 0,
            requiredUnits: profile.requiredUnits || 180
          });
        } else {
          setStudentInfo({
            name: user.displayName || user.email?.split('@')[0] || 'Student',
            id: user.uid,
            classification: 'REGULAR',
            program: 'BSIT',
            yearSection: '1st Year',
            academicYear: '2025–2026',
            semester: '1st Semester',
            email: user.email || '',
            contactNumber: '-',
            address: '-',
            completionPercentage: 0,
            earnedUnits: 0,
            requiredUnits: 180
          });
        }
      } catch (error) {
        console.error('Failed to load student profile', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading || !studentInfo) {
    return (
      <LoadingState label="Loading Your Profile..." accent="#375534" />
    );
  }

  return (
    <div className="space-y-6 text-[#0F2A1D] max-w-[1400px] mx-auto antialiased">
      
      {/* Page Header Title Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-black tracking-tight text-slate-900">Student Profile</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Manage your personal information and academic settings.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-2xs active:scale-[0.98]">
          <Edit2 size={13} /> Edit Profile
        </button>
      </div>

      {/* Main Structural Asymmetric Split Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Identity Profile Card & Account Settings */}
        <div className="space-y-6">
          
          {/* Main Avatar Profile Information Block Card */}
          <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-xs text-center flex flex-col items-center">
            {/* Ambient Background Top Header Panel strip */}
            <div className="h-24 w-full bg-gradient-to-br from-[#eaf0eb] to-[#f4f7f4]" />
            
            {/* Floating Profile Initial Circle Badge element */}
            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white text-slate-600 font-serif font-black text-3xl flex items-center justify-center shadow-xs -mt-12">
              {studentInfo.name[0]}
            </div>

            <div className="p-6 pt-4 space-y-3.5 w-full">
              <div>
                <h3 className="text-lg font-serif font-black text-slate-900 leading-tight">{studentInfo.name}</h3>
                <p className="text-xs font-mono font-bold text-slate-400 mt-1">{studentInfo.studentId || studentInfo.id}</p>
              </div>
              <div className="pt-1">
                <span className="bg-[#801818] text-[#FCEEEF] px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-[#cbe6bf]/30">
                  {studentInfo.classification || 'REGULAR'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Settings Secondary Navigation Panel Card */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-serif font-black text-slate-900 tracking-tight flex items-center gap-2">
              Account Settings
            </h4>
            <div className="space-y-1 text-xs font-bold text-slate-500">
              <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 hover:text-slate-900 text-left transition-all group">
                <ShieldAlert size={16} className="text-slate-400 group-hover:text-[#375534]" />
                <span>Security & Password</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 hover:text-slate-900 text-left transition-all group">
                <MailWarning size={16} className="text-slate-400 group-hover:text-[#375534]" />
                <span>Email Preferences</span>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Academic Info, Contact Details, and Completion Tracker */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Academic Information Grid Matrix Card Container */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-5">
            <h4 className="text-sm font-serif font-black text-slate-900 tracking-tight border-b border-slate-50 pb-3">
              Academic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-xs font-bold">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Degree Program</p>
                <p className="text-sm font-extrabold text-slate-800 pt-0.5">{studentInfo.program || studentInfo.course || 'BSIT'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Year & Section</p>
                <p className="text-sm font-extrabold text-slate-800 pt-0.5">{studentInfo.yearSection || `${studentInfo.year || '1'}st Year`}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Current Academic Year</p>
                <p className="text-sm font-extrabold text-slate-800 pt-0.5">{studentInfo.academicYear || '2025–2026'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Current Semester</p>
                <p className="text-sm font-extrabold text-slate-800 pt-0.5">{studentInfo.semester || '1st Semester'}</p>
              </div>
            </div>
          </div>

          {/* Contact Details Informational List Card Container */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-5">
            <h4 className="text-sm font-serif font-black text-slate-900 tracking-tight border-b border-slate-50 pb-3">
              Contact Details
            </h4>
            <div className="space-y-4 text-xs font-bold">
              {/* Email Entry row */}
              <div className="flex gap-4 items-center">
                <div className="p-2.5 bg-[#f4f7f3] text-slate-500 rounded-xl shrink-0"><Mail size={16} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">University Email</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5 lowercase">{studentInfo.email}</p>
                </div>
              </div>
              {/* Phone Entry row */}
              <div className="flex gap-4 items-center">
                <div className="p-2.5 bg-[#f4f7f3] text-slate-500 rounded-xl shrink-0"><Phone size={16} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Contact Number</p>
                  <p className="text-sm font-mono font-extrabold text-slate-800 mt-0.5">{studentInfo.contactNumber || '-'}</p>
                </div>
              </div>
              {/* Address Entry row */}
              <div className="flex gap-4 items-center">
                <div className="p-2.5 bg-[#f4f7f3] text-slate-500 rounded-xl shrink-0"><MapPin size={16} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Current Address</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5 normal-case">{studentInfo.address || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Degree Completion Horizontal Tracking Linear Gauge Banner */}
          <div className="bg-[#eaf0eb] border border-[#cbe6bf]/40 rounded-3xl p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3.5 bg-white border border-slate-200/60 rounded-2xl text-[#7D1924] shrink-0">
              <GraduationCap size={20} />
            </div>
            <div className="space-y-3 flex-1 w-full text-xs font-bold">
              <div>
                <h4 className="text-sm font-serif font-black text-slate-900 tracking-tight">Degree Completion</h4>
                <p className="text-[11px] text-slate-400 font-medium normal-case mt-0.5">You are making steady progress.</p>
              </div>
              {/* Progress track */}
              <div className="space-y-2">
                <div className="w-full bg-white/60 p-0.5 h-3 rounded-full overflow-hidden border border-slate-200/30">
                  <div 
                    className="bg-[#7D1924] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${studentInfo.completionPercentage || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 px-0.5">
                  <span>{studentInfo.completionPercentage || 0}% Completed</span>
                  <span className="font-mono">{studentInfo.earnedUnits || 0} / {studentInfo.requiredUnits || 180} Units</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}