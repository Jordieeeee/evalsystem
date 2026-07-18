import { useMemo, useState } from 'react';
import {
  Filter,
  Mail,
  Phone,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { useStudent, useStudentSubjects } from '../../../context/StudentDataContext';
import { computeStudentMetrics } from '../../../utils/studentMetrics';
import { YEAR_LEVELS, SEMESTER_LIST } from '../../../services/curriculumConfig';
import LoadingState from '../../../components/LoadingState';

export default function StudentProfilePage() {
  // Records are keyed by SR-Code (students/{srCode}), not the Firebase uid.
  // StudentDataContext resolves this through the same AuthContext profile
  // Profile always relied on — no second identity lookup is introduced here.
  const { student: profile, displayName, loading: studentLoading, error: studentError } = useStudent();
  const { subjects, loading: subjectsLoading, error: subjectsError, metrics } = useStudentSubjects();

  const [yearFilter, setYearFilter] = useState('All');
  const [semesterFilter, setSemesterFilter] = useState('All');
  const isFiltered = yearFilter !== 'All' || semesterFilter !== 'All';

  // Filter Profile recomputes Degree Completion for a selected term using the
  // exact same shared function Dashboard uses — never a second implementation.
  const filteredMetrics = useMemo(() => {
    if (!isFiltered) return metrics;
    const filteredSubjects = subjects.filter((s) => {
      const matchesYear = yearFilter === 'All' || s.yearLevel === yearFilter;
      const matchesSemester = semesterFilter === 'All' || s.semester === semesterFilter;
      return matchesYear && matchesSemester;
    });
    return computeStudentMetrics(filteredSubjects, profile?.academicYear);
  }, [isFiltered, subjects, yearFilter, semesterFilter, metrics, profile?.academicYear]);

  const studentInfo = useMemo(() => {
    if (!profile) return null;
    return {
      name: displayName,
      id: profile.id || profile.studentId,
      classification: profile.classification || '—',
      program: profile.course || '—',
      yearSection: `${profile.yearLevel || '—'}${profile.section ? ` - ${profile.section}` : ''}`,
      academicYear: profile.academicYear || '—',
      semester: profile.semester || '—',
      email: profile.email || '',
      contactNumber: profile.phoneNumber || '-',
      address: '-'
    };
  }, [profile, displayName]);

  if (studentLoading || subjectsLoading || !studentInfo) {
    return (
      <LoadingState label="Loading Your Profile..." accent="#375534" />
    );
  }

  if (studentError || subjectsError) {
    return (
      <div className="h-[65vh] flex items-center justify-center text-xs font-bold text-rose-600 uppercase tracking-wider">
        {studentError || subjectsError}
      </div>
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
      </div>

      {/* Main Structural Asymmetric Split Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT COLUMN: Identity Profile Card & Filter Profile */}
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
                <p className="text-xs font-mono font-bold text-slate-400 mt-1">{studentInfo.id}</p>
              </div>
              <div className="pt-1">
                <span className="bg-[#801818] text-[#FCEEEF] px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-[#cbe6bf]/30">
                  {studentInfo.classification.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Filter Profile Card — recomputes Degree Completion below for a term */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-serif font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Filter size={15} className="text-slate-400" /> Filter Profile
            </h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Year</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#375534]/30"
                >
                  <option value="All">All Years</option>
                  {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Semester</label>
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#375534]/30"
                >
                  <option value="All">All Semesters</option>
                  {SEMESTER_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {isFiltered && (
                <button
                  onClick={() => { setYearFilter('All'); setSemesterFilter('All'); }}
                  className="w-full text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100"
                >
                  Clear Filter
                </button>
              )}
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
                <p className="text-sm font-extrabold text-slate-800 pt-0.5">{studentInfo.program}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Year & Section</p>
                <p className="text-sm font-extrabold text-slate-800 pt-0.5">{studentInfo.yearSection}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Current Academic Year</p>
                <p className="text-sm font-extrabold text-slate-800 pt-0.5">{studentInfo.academicYear}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Current Semester</p>
                <p className="text-sm font-extrabold text-slate-800 pt-0.5">{studentInfo.semester}</p>
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
                <h4 className="text-sm font-serif font-black text-slate-900 tracking-tight">
                  Degree Completion{isFiltered ? ` — ${yearFilter !== 'All' ? yearFilter : 'All Years'} • ${semesterFilter !== 'All' ? semesterFilter : 'All Semesters'}` : ''}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium normal-case mt-0.5">
                  {filteredMetrics.totalAssigned > 0 ? 'You are making steady progress.' : 'No active subject assignments'}
                </p>
              </div>
              {/* Progress track */}
              <div className="space-y-2">
                <div className="w-full bg-white/60 p-0.5 h-3 rounded-full overflow-hidden border border-slate-200/30">
                  <div
                    className="bg-[#7D1924] h-full rounded-full transition-all duration-500"
                    style={{ width: `${filteredMetrics.completionPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 px-0.5">
                  <span>{filteredMetrics.completionPercentage}% Completed</span>
                  <span className="font-mono">{filteredMetrics.earnedCredits} / {filteredMetrics.totalRequiredUnits} Units</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
