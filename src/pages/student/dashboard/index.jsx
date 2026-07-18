import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Clock, Award } from 'lucide-react';
import { studentService } from '../../../services/studentService';
import { useAuth } from '../../../context/AuthContext';
import LoadingState from '../../../components/LoadingState';

export default function StudentDashboardTab() {
  const { user, profile } = useAuth();

  const [currentSubjects, setCurrentSubjects] = useState([]);
  const [completedHistory, setCompletedHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      // Academic records are keyed by SR-Code (profile.id), not the Firebase
      // uid — self-registered students only get a `profile` once AuthContext
      // resolves their claimed students/{srCode} doc.
      if (!profile?.id) return;

      try {
        setLoading(true);
        const { currentSubjects: active, completedHistory: history } =
          await studentService.getAcademicRecords(profile.id);

        setCurrentSubjects(active);
        setCompletedHistory(history);
      } catch (error) {
        console.error('Failed to load student data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [profile]);

  if (loading) {
    return (
      <LoadingState label="Loading Your Dashboard..." accent="#375534" />
    );
  }

  const totalEarnedUnits = completedHistory.length * 3;
  const completionPercentage = Math.min(Math.round((totalEarnedUnits / 180) * 100), 100);

  return (
    <div className="space-y-6 text-[#0F2A1D] max-w-[1400px] mx-auto">
      
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-4xl font-serif font-black text-[#0F2A1D] tracking-tight">Academic Overview</h2>
          <p className="text-xs text-slate-400 font-bold mt-1.5 flex items-center gap-2">
            {profile?.name || user?.displayName || 'Student'} • {profile?.program || profile?.course || 'BSIT'} • {profile?.yearSection || `${profile?.year || '1'}st Year`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 flex justify-between items-center group hover:shadow-xs transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400">Assigned Subjects</p>
            <div className="pt-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{currentSubjects.length}</span>
            </div>
          </div>
          <div className="p-3 bg-[#f4f7f3] text-slate-500 rounded-xl group-hover:scale-105 transition-transform"><BookOpen size={18} /></div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 flex justify-between items-center group hover:shadow-xs transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400">Completed Subjects</p>
            <div className="pt-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{completedHistory.length}</span>
            </div>
          </div>
          <div className="p-3 bg-[#f4f7f3] text-slate-500 rounded-xl group-hover:scale-105 transition-transform"><CheckCircle2 size={18} /></div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 flex justify-between items-center group hover:shadow-xs transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400">Pending Prerequisites</p>
            <div className="pt-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {currentSubjects.filter(sub => sub.status === 'Pending Pre-req').length}
              </span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-105 transition-transform"><Clock size={18} /></div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 flex justify-between items-center group hover:shadow-xs transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400">Completion</p>
            <div className="pt-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{completionPercentage}%</span>
            </div>
          </div>
          <div className="p-3 bg-[#f4f7f3] text-slate-500 rounded-xl group-hover:scale-105 transition-transform"><Award size={18} /></div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-serif font-black text-slate-900 tracking-tight">Current Academic Load</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Code</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 text-right font-semibold">Date Assigned</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-50">
              {currentSubjects.length > 0 ? (
                currentSubjects.map((subject, index) => (
                  <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 font-mono font-black text-slate-900 tracking-tight">{subject.subjectCode}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border
                        ${subject.status === 'Pending Pre-req' 
                            ? 'bg-amber-50/60 text-amber-700 border-amber-100/40'
                            : 'bg-blue-50/60 text-blue-700 border-blue-100/40'
                        }`}
                      >
                        {subject.status}
                      </span>
                    </td>
                    <td className="py-4 text-right text-slate-400 font-medium">
                      {new Date(subject.assignedDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-slate-400 uppercase tracking-wider text-xs font-bold">
                    No active subject assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}