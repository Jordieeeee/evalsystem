import { useMemo } from 'react';
import { Download, Award, FileText, FileSpreadsheet } from 'lucide-react';
import { useStudent, useStudentSubjects } from '../../../context/StudentDataContext';
import { getSubjectRemarks, REMARKS } from '../../../utils/studentGrading';
import { formatSubjectTerm, groupSubjectsByTerm } from '../../../utils/studentMetrics';
import { generateEvaluationPdf } from '../../../utils/generateReportPdf';
import universitySeal from '../../../assets/logo/logo.png';
import LoadingState from '../../../components/LoadingState';

const REMARKS_STYLES = {
  [REMARKS.PASSED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  [REMARKS.FAILED]: 'bg-rose-50 text-rose-700 border-rose-100',
  [REMARKS.INCOMPLETE]: 'bg-amber-50 text-amber-700 border-amber-100',
  [REMARKS.NOT_YET_GRADED]: 'bg-blue-50/60 text-blue-700 border-blue-100/40'
};

const csvEscape = (value) => {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

function downloadCsv(displayName, student, subjects, metrics) {
  const rows = [
    ['Student Name', displayName],
    ['Student Number', student?.id || student?.studentId || ''],
    ['Program', student?.course || ''],
    ['Academic Year', student?.academicYear || ''],
    ['General Weighted Average', metrics.gwa],
    ['Total Credits Earned', metrics.earnedCredits],
    [],
    ['Date', 'Subject Code', 'Subject Name', 'Term', 'Units', 'Grade', 'Remarks']
  ];

  groupSubjectsByTerm(subjects).forEach((group) => {
    group.subjects.forEach((subject) => {
      rows.push([
        subject.dateAssigned || subject.createdAt || new Date().toLocaleDateString(),
        subject.subjectCode || '',
        subject.subjectTitle || '',
        formatSubjectTerm(subject),
        subject.units ?? '',
        subject.grade || '',
        getSubjectRemarks(subject.grade)
      ]);
    });
  });

  const csvContent = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `evaluation_${student?.id || student?.studentId || 'student'}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadPdf(displayName, student, subjects, metrics) {
  const groupedSubjects = groupSubjectsByTerm(subjects);
  generateEvaluationPdf({
    studentName: displayName,
    studentNumber: student?.id || student?.studentId || '—',
    program: student?.course || '—',
    yearSection: `${student?.yearLevel || '—'}${student?.section ? ` - ${student.section}` : ''}`,
    academicYear: student?.academicYear || '—',
    semester: student?.semester || '—',
    gwa: metrics.gwa,
    dateIssued: new Date().toLocaleDateString(),
    groupedSubjects,
    getRemarks: getSubjectRemarks,
    sealImageSrc: universitySeal,
    filename: `evaluation_report_${student?.id || student?.studentId || 'student'}.pdf`
  });
}

export default function StudentEvaluationResultsPage() {
  const { student, displayName, loading: studentLoading, error: studentError } = useStudent();
  const { subjects, loading: subjectsLoading, error: subjectsError, metrics } = useStudentSubjects();

  const groupedSubjects = useMemo(() => groupSubjectsByTerm(subjects), [subjects]);

  if (studentLoading || subjectsLoading) {
    return (
      <LoadingState label="Loading Evaluation Results..." accent="#375534" />
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
    <div className="space-y-6 text-[#7D1924]">

      {/* Page Title & Export Action Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-black tracking-tight text-slate-900">Evaluation Results</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Track your academic performance across all evaluated terms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv(displayName, student, subjects, metrics)}
            disabled={subjects.length === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-2xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={14} /> Export CSV
          </button>
          
        </div>
      </div>

      {/* Row 1: Summary Metric Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Cumulative GPA Highlights Card */}
        <div className="bg-[#7D1924] text-[#FCEEEF] rounded-3xl p-6 shadow-sm border border-white/5 flex items-center gap-5">
          <div className="p-4 bg-white/10 rounded-2xl text-white">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#FCEEEF] uppercase tracking-wider">General Weighted Average</p>
            <p className="text-4xl font-serif font-black text-white mt-1 tracking-tight">{metrics.gwa}</p>
          </div>
        </div>

        {/* Total Credits Earned Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex items-center gap-5">
          <div className="p-4 bg-[#f4f7f3] text-blue-600 rounded-2xl">
            <FileText size={24} className="text-[#375534]" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Credits Earned</p>
            <p className="text-4xl font-black text-slate-900 mt-1 tracking-tight">{metrics.earnedCredits}</p>
          </div>
        </div>

      </div>

      {/* Results grouped per semester */}
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
                      <th className="p-4 pl-6 font-semibold">Term</th>
                      <th className="p-4 font-semibold">Subject</th>
                      <th className="p-4 font-semibold">Grade</th>
                      <th className="p-4 pr-6 text-right font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-50">
                    {group.subjects.map((subject) => {
                      const remarks = getSubjectRemarks(subject.grade);
                      return (
                        <tr key={subject.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-4 pl-6 text-slate-400 font-medium whitespace-nowrap">{formatSubjectTerm(subject)}</td>
                          <td className="p-4 font-extrabold text-slate-900">{subject.subjectCode}</td>
                          <td className="p-4 font-serif font-black text-slate-900 text-sm">{subject.grade || '—'}</td>
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
