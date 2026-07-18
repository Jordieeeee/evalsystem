import { useMemo } from 'react';
import { BookOpen, CheckCircle2, Clock, Award } from 'lucide-react';
import { useStudent, useStudentSubjects } from '../../../context/StudentDataContext';
import { getSubjectRemarks, REMARKS } from '../../../utils/studentGrading';
import { groupSubjectsByTerm } from '../../../utils/studentMetrics';
import LoadingState from '../../../components/LoadingState';

const REMARKS_STYLES = {
  [REMARKS.PASSED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  [REMARKS.FAILED]: 'bg-rose-50 text-rose-700 border-rose-100',
  [REMARKS.INCOMPLETE]: 'bg-amber-50 text-amber-700 border-amber-100',
  [REMARKS.NOT_YET_GRADED]: 'bg-blue-50/60 text-blue-700 border-blue-100/40'
};

export default function StudentDashboardTab() {
  const { student, displayName, loading: studentLoading, error: studentError } = useStudent();
  const { subjects, loading: subjectsLoading, error: subjectsError, metrics } = useStudentSubjects();

  const groupedSubjects = useMemo(() => groupSubjectsByTerm(subjects), [subjects]);

  if (studentLoading || subjectsLoading) {
    return (
      <LoadingState label="Loading Your Dashboard..." accent="#375534" />
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
    <div className="space-y-6 text-[#0F2A1D] max-w-[1400px] mx-auto">

      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-4xl font-serif font-black text-[#0F2A1D] tracking-tight">Academic Overview</h2>
          <p className="text-xs text-slate-400 font-bold mt-1.5 flex items-center gap-2">
            {displayName} • {student?.course || '—'} • {student?.yearLevel || '—'}{student?.section ? ` - ${student.section}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 flex justify-between items-center group hover:shadow-xs transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400">Assigned Subjects</p>
            <div className="pt-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{metrics.totalAssigned}</span>
            </div>
          </div>
          <div className="p-3 bg-[#f4f7f3] text-slate-500 rounded-xl group-hover:scale-105 transition-transform"><BookOpen size={18} /></div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 flex justify-between items-center group hover:shadow-xs transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400">Completed Subjects</p>
            <div className="pt-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{metrics.passedCount}</span>
            </div>
          </div>
          <div className="p-3 bg-[#f4f7f3] text-slate-500 rounded-xl group-hover:scale-105 transition-transform"><CheckCircle2 size={18} /></div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 flex justify-between items-center group hover:shadow-xs transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400">Pending / Incomplete</p>
            <div className="pt-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{metrics.nonCreditedCount}</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-105 transition-transform"><Clock size={18} /></div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/50 flex justify-between items-center group hover:shadow-xs transition-shadow">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400">Completion</p>
            <div className="pt-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{metrics.completionPercentage}%</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">{metrics.earnedCredits} / {metrics.totalRequiredUnits} units</p>
          </div>
          <div className="p-3 bg-[#f4f7f3] text-slate-500 rounded-xl group-hover:scale-105 transition-transform"><Award size={18} /></div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-serif font-black text-slate-900 tracking-tight">Current Academic Load</h3>

        {groupedSubjects.length > 0 ? (
          <div className="space-y-6">
            {groupedSubjects.map((group) => (
              <div key={group.label} className="bg-white border border-slate-200/50 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-3.5 bg-slate-50/60 border-b border-slate-100">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">{group.label}</h4>
                </div>
                <div className="overflow-x-auto p-6 pt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Code</th>
                        <th className="pb-3 text-right font-semibold">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-50">
                      {group.subjects.map((subject) => {
                        const remarks = getSubjectRemarks(subject.grade);
                        return (
                          <tr key={subject.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-4 font-mono font-black text-slate-900 tracking-tight">{subject.subjectCode}</td>
                            <td className="py-4 text-right">
                              <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border inline-block min-w-[100px] text-center ${REMARKS_STYLES[remarks]}`}>
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
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm text-center text-slate-400 uppercase tracking-wider text-xs font-bold">
            No active subject assignments
          </div>
        )}
      </div>
    </div>
  );
}
