import { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { BATSTATEU_GRADES, SEMESTER_LIST, YEAR_LEVELS } from '../services/curriculumConfig';

// Groups a flat studentSubjects list into Year Level -> Semester buckets.
// Lifted verbatim from Student Management's getGroupedGrades so both callers
// bucket records identically, including the null-safety and the fallbacks.
const groupByYearAndSemester = (subjects, fallbackYearLevel) => {
  const groups = {};
  YEAR_LEVELS.forEach(y => {
    groups[y] = {};
    SEMESTER_LIST.forEach(s => { groups[y][s] = []; });
  });

  (subjects || []).filter(Boolean).forEach(sub => {
    const y = sub?.yearLevel || fallbackYearLevel || 'First Year';
    const s = sub?.semester || '1st Semester';
    if (!groups[y]) groups[y] = {};
    if (!groups[y][s]) groups[y][s] = [];
    groups[y][s].push(sub);
  });

  return groups;
};

/**
 * Copy of Grades matrix, shared by Student Management (editable) and the
 * Evaluation tracks (read-only).
 *
 * readOnly=true drops every mutation affordance: no header actions, no Actions
 * column, no inline grade editing -- Grade Rating renders as static text.
 * The edit-mode callbacks are only ever invoked when readOnly is false.
 */
export default function CopyOfGradesMatrix({
  subjects = [],
  fallbackYearLevel,
  readOnly = false,
  title = 'Copy of Grades Matrix',
  subtitle = 'Academic records grouped systematically by Year Level and Semester.',
  headerActions = null,
  emptyMessage = 'No course records found for this student.',
  // --- edit-mode only ---
  gradingSubjectId = null,
  selectedInlineGrade = '',
  onSelectedInlineGradeChange = () => {},
  onStartGrading = () => {},
  onSubmitGrade = () => {},
  onCancelGrading = () => {},
  onDeleteRecord = () => {}
}) {
  // Collapse state is presentation-only, so it lives here rather than in either page.
  const [expandedSections, setExpandedSections] = useState({});
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const groupedGrades = groupByYearAndSemester(subjects, fallbackYearLevel);
  const hasAnyRecords = YEAR_LEVELS.some(year =>
    SEMESTER_LIST.some(sem => groupedGrades[year]?.[sem]?.length > 0)
  );

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl border flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>
        </div>
        {!readOnly && headerActions && <div className="flex gap-2">{headerActions}</div>}
      </div>

      {!hasAnyRecords && (
        <div className="text-center py-16 text-slate-400 font-semibold text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p>{emptyMessage}</p>
        </div>
      )}

      {YEAR_LEVELS.map(year => {
        const hasSemesterData = SEMESTER_LIST.some(sem => groupedGrades[year]?.[sem]?.length > 0);
        if (!hasSemesterData) return null;

        return (
          <div key={year} className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b">
              <span className="w-1 h-3.5 bg-blue-600 rounded-xs" />
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">{year}</h4>
            </div>

            {SEMESTER_LIST.map(sem => {
              const subjectRows = groupedGrades[year]?.[sem] || [];
              if (subjectRows.length === 0) return null;

              const sectionKey = `${year}-${sem}`;
              const isCollapsed = expandedSections[sectionKey] || false;

              return (
                <div key={sem} className="bg-white border rounded-2xl overflow-hidden shadow-xs">
                  <div
                    onClick={() => toggleSection(sectionKey)}
                    className="px-5 py-3.5 bg-slate-50/70 border-b flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown size={16} className={`text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                      <span className="font-bold text-slate-800 text-xs">{sem}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
                      {subjectRows.length} Course{subjectRows.length > 1 ? 's' : ''} Record
                    </span>
                  </div>

                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50/20 text-slate-400 font-bold uppercase tracking-wider border-b text-[10px]">
                            <th className="px-6 py-3">Academic Term</th>
                            <th className="px-6 py-3">Subject Code</th>
                            <th className="px-6 py-3">Descriptive Title</th>
                            <th className="px-6 py-3 text-center">Units</th>
                            <th className="px-6 py-3 text-center">Grade Rating</th>
                            {!readOnly && <th className="px-6 py-3 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y font-semibold text-slate-600">
                          {subjectRows.map((sub) => {
                            if (!sub) return null;
                            return (
                              <tr key={sub.id} className="hover:bg-slate-50/20">
                                <td className="px-6 py-4 text-slate-400">{sub.term}</td>
                                <td className="px-6 py-4 font-bold text-slate-900">{sub.subjectCode}</td>
                                <td className="px-6 py-4 text-slate-500">{sub.subjectTitle}</td>
                                <td className="px-6 py-4 text-center font-bold text-slate-900">{sub.units}</td>
                                <td className="px-6 py-4 text-center">
                                  {readOnly ? (
                                    <span className="font-extrabold text-slate-900">{sub.grade}</span>
                                  ) : gradingSubjectId === sub.id ? (
                                    <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                                      <select value={selectedInlineGrade} onChange={e => onSelectedInlineGradeChange(e.target.value)} className="border rounded bg-white p-1 text-[11px] font-bold text-slate-900 outline-none"><option value="In Progress">In Progress</option>{BATSTATEU_GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select>
                                      <button onClick={() => onSubmitGrade(sub.id)} className="bg-emerald-600 text-white rounded p-1"><Check size={10} /></button>
                                      <button onClick={() => onCancelGrading()} className="bg-slate-100 rounded p-1 text-slate-500"><X size={10} /></button>
                                    </div>
                                  ) : (
                                    <span onClick={() => onStartGrading(sub)} className="cursor-pointer underline text-blue-600 font-extrabold">{sub.grade}</span>
                                  )}
                                </td>
                                {!readOnly && (
                                  <td className="px-6 py-4 text-right">
                                    <button onClick={() => onDeleteRecord(sub.id)} className="text-red-500 hover:text-red-700 text-[11px] font-bold">Remove</button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
