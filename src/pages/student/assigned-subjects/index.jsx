import { useMemo, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useStudent, useStudentSubjects } from '../../../context/StudentDataContext';
import { getSubjectRemarks, REMARKS } from '../../../utils/studentGrading';
import { groupSubjectsByTerm } from '../../../utils/studentMetrics';
import { YEAR_LEVELS, SEMESTER_LIST } from '../../../services/curriculumConfig';
import LoadingState from '../../../components/LoadingState';

const REMARKS_STYLES = {
  [REMARKS.PASSED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  [REMARKS.FAILED]: 'bg-rose-50 text-rose-700 border-rose-100',
  [REMARKS.INCOMPLETE]: 'bg-amber-50 text-amber-700 border-amber-100',
  [REMARKS.NOT_YET_GRADED]: 'bg-blue-50/60 text-blue-700 border-blue-100/40'
};

export default function StudentAssignedSubjectsPage() {
  const { student, loading: studentLoading, error: studentError } = useStudent();
  const { subjects, loading: subjectsLoading, error: subjectsError } = useStudentSubjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // Defaults to the student's current standing — "current semester" — but can
  // be widened via the Filter panel.
  const [yearFilter, setYearFilter] = useState(null);
  const [semesterFilter, setSemesterFilter] = useState(null);

  const effectiveYearFilter = yearFilter ?? student?.yearLevel ?? 'All';
  const effectiveSemesterFilter = semesterFilter ?? student?.semester ?? 'All';

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return subjects.filter((subject) => {
      const matchesYear = effectiveYearFilter === 'All' || subject.yearLevel === effectiveYearFilter;
      const matchesSemester = effectiveSemesterFilter === 'All' || subject.semester === effectiveSemesterFilter;
      const matchesQuery =
        !q ||
        (subject.subjectTitle || '').toLowerCase().includes(q) ||
        (subject.subjectCode || '').toLowerCase().includes(q);
      return matchesYear && matchesSemester && matchesQuery;
    });
  }, [subjects, effectiveYearFilter, effectiveSemesterFilter, searchQuery]);

  const groupedSubjects = useMemo(() => groupSubjectsByTerm(filteredSubjects), [filteredSubjects]);

  const isFiltered = effectiveYearFilter !== 'All' || effectiveSemesterFilter !== 'All';
  const resetFilters = () => {
    setYearFilter('All');
    setSemesterFilter('All');
  };
  const useCurrentSemester = () => {
    setYearFilter(student?.yearLevel ?? 'All');
    setSemesterFilter(student?.semester ?? 'All');
  };

  if (studentLoading || subjectsLoading) {
    return (
      <LoadingState label="Loading Assigned Subjects..." accent="#375534" />
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
    <div className="space-y-6 text-[#0F2A1D]">

      {/* Page Title & Description Header Layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-black tracking-tight text-slate-900">Assigned Subjects</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            {isFiltered
              ? `Showing ${effectiveYearFilter} • ${effectiveSemesterFilter}`
              : 'Showing your current semester course load.'}
          </p>
        </div>

        {/* Action Controls Search & Filter Strip */}
        <div className="relative flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects..."
              className="w-full bg-slate-50 border border-slate-200/70 text-xs pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#375534]/30 focus:bg-white transition-all font-medium text-slate-800 placeholder-slate-400"
            />
          </div>
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`flex items-center gap-1.5 border text-xs font-bold px-4 py-2.5 rounded-xl transition-all
              ${isFiltered ? 'bg-[#7D1924] text-white border-[#7D1924]' : 'bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50'}`}
          >
            <Filter size={14} /> Filter
          </button>

          {showFilter && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-lg p-4 z-20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Filter Subjects</span>
                <button onClick={() => setShowFilter(false)} className="text-slate-400 hover:text-slate-700">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Year Level</label>
                <select
                  value={effectiveYearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#375534]/30"
                >
                  <option value="All">All Years</option>
                  {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Semester</label>
                <select
                  value={effectiveSemesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#375534]/30"
                >
                  <option value="All">All Semesters</option>
                  {SEMESTER_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={useCurrentSemester}
                  className="flex-1 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg bg-[#f4f7f3] text-slate-600 hover:bg-slate-100"
                >
                  Current Semester
                </button>
                <button
                  onClick={resetFilters}
                  className="flex-1 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100"
                >
                  Show All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grouped Table Sections — one per Year Level / Semester */}
      {groupedSubjects.length > 0 ? (
        <div className="space-y-6">
          {groupedSubjects.map((group) => (
            <div key={group.label} className="bg-white rounded-3xl border border-slate-200/50 shadow-xs overflow-hidden">
              <div className="px-6 py-3.5 bg-slate-50/60 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">{group.label}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                      <th className="p-4 pl-6 font-semibold">Code</th>
                      <th className="p-4 font-semibold">Subject Name</th>
                      <th className="p-4 font-semibold">Units</th>
                      <th className="p-4 pr-6 text-right font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-50">
                    {group.subjects.map((subject) => {
                      const remarks = getSubjectRemarks(subject.grade);
                      return (
                        <tr key={subject.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 pl-6 font-mono font-black text-slate-400 tracking-tight">{subject.subjectCode}</td>
                          <td className="p-4 font-extrabold text-slate-900">{subject.subjectTitle}</td>
                          <td className="p-4 text-slate-500 font-mono">{subject.units ?? '—'}</td>
                          <td className="p-4 pr-6 text-right">
                            <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border inline-block min-w-[100px] text-center ${REMARKS_STYLES[remarks]}`}>
                              {remarks}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xs p-8 text-center text-slate-400 font-bold uppercase tracking-wider text-xs">
          No active subject assignments
        </div>
      )}

    </div>
  );
}
