import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ShieldAlert, Printer, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const SEMESTER_OPTIONS = ['1st Semester', '2nd Semester', 'Summer'];
const GRADE_OPTIONS = ['1.0', '1.25', '1.5', '1.75', '2.0', '2.25', '2.5', '2.75', '3.0'];
const SEMESTER_CYCLE = ['1st Semester', '2nd Semester'];

export default function GeneralWorkspaceView({
  auditOutput, minAllowedUnits, maxAllowedUnits, evaluationStrategy, triggerReportModalOpen, handleFinalizeEvaluationMatrix, isSubmitting,
  catalog, studentSubjectsHistory, onAddManualSubject, onDeleteManualSubject,
  studentYearLevel, studentSemester
}) {
  const [selectedCodes, setSelectedCodes] = useState(new Set());
  const [gradesByCode, setGradesByCode] = useState({});
  const [selectedYear, setSelectedYear] = useState(YEAR_OPTIONS[0]);
  const [selectedSemester, setSelectedSemester] = useState(SEMESTER_OPTIONS[0]);
  const [isAdding, setIsAdding] = useState(false);

  if (!auditOutput) return null;

  const unitsRemaining = auditOutput.unitsRemaining || 0;
  const maxUnitsPerSemester = maxAllowedUnits || 21;
  const estimatedSemestersLeft = unitsRemaining > 0 ? Math.ceil(unitsRemaining / maxUnitsPerSemester) : 0;
  const estimatedYearsLeft = estimatedSemestersLeft > 0 ? Math.ceil(estimatedSemestersLeft / 2) : 0;

  const buildSemesterSchedule = (items, maxUnits) => {
    const semesters = [];
    let current = { items: [], totalUnits: 0 };
    (items || []).forEach((item) => {
      const units = parseInt(item.units || 3, 10);
      if (current.items.length > 0 && current.totalUnits + units > maxUnits) {
        semesters.push(current);
        current = { items: [], totalUnits: 0 };
      }
      current.items.push(item);
      current.totalUnits += units;
    });
    if (current.items.length > 0) semesters.push(current);
    return semesters;
  };

  const buildFullSemesterSchedule = (fullCatalog, completedCodesSet, maxUnits, startYearIndex = 0, startTermIndex = 0) => {
    const scheduledCodes = new Set();
    const semesters = [];
    let remaining = (fullCatalog || []).filter((c) => {
      const code = (c.courseCode || c.code || c.id || '').toUpperCase();
      return !completedCodesSet.has(code);
    });

    let yearIndex = Math.max(0, startYearIndex);
    let termIndex = Math.max(0, startTermIndex) % 2;

    let safetyGuard = 0;
    const maxIterations = remaining.length * 2 + 20;

    const advanceTerm = () => {
      termIndex++;
      if (termIndex >= SEMESTER_CYCLE.length) {
        termIndex = 0;
        yearIndex++;
      }
    };

    while (remaining.length > 0 && safetyGuard < maxIterations) {
      safetyGuard++;
      const termLabel = SEMESTER_CYCLE[termIndex];
      const yearLabel = YEAR_OPTIONS[Math.min(yearIndex, YEAR_OPTIONS.length - 1)];

      const eligible = remaining.filter((c) => {
        const code = (c.courseCode || c.code || c.id || '').toUpperCase();
        const prereqs = (c.prerequisites || []).map((p) => String(p).toUpperCase());
        const prereqsMet = prereqs.every((p) => completedCodesSet.has(p) || scheduledCodes.has(p));
        const offered = Array.isArray(c.semesterOffered) ? c.semesterOffered : (c.semesterOffered ? [c.semesterOffered] : []);
        const offeredMatches = offered.length === 0 || offered.some((o) => String(o).trim().toLowerCase() === termLabel.toLowerCase());
        return prereqsMet && offeredMatches;
      });

      eligible.sort((a, b) => {
        const yearA = String(a.yearLevel || '').localeCompare(String(b.yearLevel || ''));
        if (yearA !== 0) return yearA;
        return (a.courseCode || '').localeCompare(b.courseCode || '');
      });

      let bucketUnits = 0;
      const bucketItems = [];
      eligible.forEach((c) => {
        const units = parseInt(c.creditUnits || c.units || 3, 10);
        if (bucketUnits + units <= maxUnits) {
          bucketItems.push(c);
          bucketUnits += units;
        }
      });

      if (bucketItems.length === 0) {
        advanceTerm();
        if (yearIndex > maxIterations) break;
        continue;
      }

      bucketItems.forEach((c) => {
        const code = (c.courseCode || c.code || c.id || '').toUpperCase();
        scheduledCodes.add(code);
      });
      const scheduledSet = new Set(bucketItems.map((c) => (c.courseCode || c.code || c.id || '').toUpperCase()));
      remaining = remaining.filter((c) => !scheduledSet.has((c.courseCode || c.code || c.id || '').toUpperCase()));

      semesters.push({
        termLabel,
        yearLabel,
        totalUnits: bucketUnits,
        items: bucketItems.map((c) => ({
          code: c.courseCode || c.code || c.id,
          title: c.courseTitle || c.title || c.id,
          units: parseInt(c.creditUnits || c.units || 3, 10),
        })),
      });

      advanceTerm();
    }

    return semesters;
  };

  const completedCodesForSchedule = new Set(
    (studentSubjectsHistory || []).map((s) => String(s.subjectCode || '').toUpperCase())
  );

  // FIX: Seed the scheduler's starting year/term from the student's ACTUAL
  // assigned standing (studentYearLevel / studentSemester props) — NOT from
  // selectedYear/selectedSemester (those are just the filter dropdowns for
  // browsing which subjects to add as "previously taken").
  const normalizeYearLabel = (val) => {
    const s = String(val || '').trim().toLowerCase();
    if (s.includes('1st') || s.includes('first')) return 0;
    if (s.includes('2nd') || s.includes('second')) return 1;
    if (s.includes('3rd') || s.includes('third')) return 2;
    if (s.includes('4th') || s.includes('fourth')) return 3;
    if (s.includes('5th') || s.includes('fifth')) return 4;
    return 0;
  };
  const normalizeSemesterLabel = (val) => {
    const s = String(val || '').trim().toLowerCase();
    if (s.includes('2nd') || s.includes('second')) return 1;
    return 0;
  };

  const startYearIndex = normalizeYearLabel(studentYearLevel);
  const startTermIndex = normalizeSemesterLabel(studentSemester);



  const semesterSchedule = (catalog && catalog.length > 0)
    ? buildFullSemesterSchedule(catalog, completedCodesForSchedule, maxUnitsPerSemester, startYearIndex, startTermIndex)
    : buildSemesterSchedule(auditOutput.recommendedStudyPlan, maxUnitsPerSemester);

  const getCode = (course) => (course.courseCode || course.code || course.id || '').toUpperCase();
  const getTitle = (course) => course.courseTitle || course.title || course.id;
  const getUnits = (course) => parseInt(course.creditUnits || course.units || 3, 10);

  const getCourseYear = (course) => course.yearLevel || null;
  const getCourseSemesters = (course) => {
    if (Array.isArray(course.semesterOffered)) return course.semesterOffered;
    if (course.semesterOffered) return [course.semesterOffered];
    return [];
  };
  const getCourseCurriculum = (course) => course.effectiveCurriculum || course.curriculum || course.curriculumYear || null;

  const latestCurriculum = (catalog || []).reduce((latest, c) => {
    const cur = getCourseCurriculum(c);
    if (!cur) return latest;
    if (!latest) return cur;
    const curStart = parseInt(String(cur).match(/\d{4}/)?.[0] || '0', 10);
    const latestStart = parseInt(String(latest).match(/\d{4}/)?.[0] || '0', 10);
    return curStart > latestStart ? cur : latest;
  }, null);

  const normalizeYear = (val) => (val === null || val === undefined ? null : String(val).trim().toLowerCase());
  const normalizeSemester = (val) => (val === null || val === undefined ? null : String(val).trim().toLowerCase());

  const alreadyTakenCodes = new Set(
    (studentSubjectsHistory || []).map(s => String(s.subjectCode || '').toUpperCase())
  );

  const targetYear = normalizeYear(selectedYear);
  const targetSemester = normalizeSemester(selectedSemester);

  const availableToAdd = (catalog || []).filter((c) => {
    if (alreadyTakenCodes.has(getCode(c))) return false;

    const courseYear = normalizeYear(getCourseYear(c));
    const courseSemesters = getCourseSemesters(c).map(normalizeSemester);

    if (courseYear && targetYear && courseYear !== targetYear) return false;
    if (courseSemesters.length > 0 && targetSemester && !courseSemesters.includes(targetSemester)) return false;

    return true;
  });

  const toggleCode = (code) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const setGradeForCode = (code, grade) => {
    setGradesByCode((prev) => ({ ...prev, [code]: grade }));
  };

  const toggleAllVisible = (visibleCourses) => {
    setSelectedCodes((prev) => {
      const visibleCodes = visibleCourses.map(getCode);
      const allSelected = visibleCodes.every((code) => prev.has(code));
      const next = new Set(prev);
      if (allSelected) {
        visibleCodes.forEach((code) => next.delete(code));
      } else {
        visibleCodes.forEach((code) => next.add(code));
      }
      return next;
    });
  };

  const handleSubmitTakenSubjects = async () => {
    if (selectedCodes.size === 0) return;
    const coursesToAdd = (catalog || []).filter((c) => selectedCodes.has(getCode(c)));
    setIsAdding(true);
    try {
      for (const course of coursesToAdd) {
        const code = getCode(course);
        await onAddManualSubject({
          subjectCode: code,
          subjectTitle: getTitle(course),
          units: getUnits(course),
          grade: gradesByCode[code] || '1.0',
          status: 'passed',
          yearTaken: selectedYear,
          semesterTaken: selectedSemester,
          curriculumTrack: getCourseCurriculum(course),
          termSaved: `${selectedYear} - ${selectedSemester}`
        });
    }
      setSelectedCodes(new Set());
    setGradesByCode({});
  } finally {
    setIsAdding(false);
  }
};

return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 text-left animate-fadeIn">
    <div className="space-y-4 lg:col-span-1">
      <div className="bg-slate-50/60 border border-slate-200/60 p-4 rounded-2xl space-y-3.5 text-xs font-semibold">
        <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
          <span className="font-black text-slate-900">Curriculum Progress</span>
          <span className="text-blue-600 font-extrabold">{auditOutput.completionPercentage}%</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${auditOutput.completionPercentage}%` }} />
        </div>
        <div className="space-y-1.5 pt-1 text-slate-500 text-[11px]">
          <p className="flex justify-between"><span>Units Earned Mapped</span><span className="font-bold text-slate-900">{auditOutput.unitsEarned} Units</span></p>
          <p className="flex justify-between"><span>Units Deficient Remaining</span><span className="font-bold text-slate-900">{auditOutput.unitsRemaining} Units</span></p>
          <p className="flex justify-between"><span>Permitted Credit Boundary</span><span className="font-bold text-slate-900">{minAllowedUnits} – {maxAllowedUnits} Max Units</span></p>
        </div>
        {unitsRemaining > 0 && (
          <div className="pt-2 mt-1 border-t border-slate-200/60 flex justify-between items-center">
            <span className="text-slate-500 text-[11px]">Est. Remaining Duration</span>
            <span className="font-black text-blue-600 text-xs">
              {estimatedSemestersLeft} Sem{estimatedSemestersLeft !== 1 ? 's' : ''} (~{estimatedYearsLeft} Yr{estimatedYearsLeft !== 1 ? 's' : ''})
            </span>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-4 shadow-3xs space-y-3 text-xs">
        <div className="flex justify-between items-center border-b pb-2">
          <h4 className="text-xs font-black text-slate-900 uppercase">Recommended Schedule</h4>
          <span className="bg-slate-100 text-slate-800 text-[9px] px-2 py-0.5 rounded-full font-black">
            {semesterSchedule.length} Sem{semesterSchedule.length !== 1 ? 's' : ''} Planned
          </span>
        </div>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {semesterSchedule.length === 0 && (
            <p className="text-slate-400 text-[11px] font-semibold py-3 text-center">No recommended subjects to schedule.</p>
          )}
          {semesterSchedule.map((sem, semIdx) => (
            <div key={semIdx} className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-2.5 py-1.5 flex justify-between items-center">
                <span className="font-black text-slate-700 text-[10px] uppercase">{sem.yearLabel ? `${sem.yearLabel} · ${sem.termLabel}` : `Sem ${semIdx + 1} · ${sem.termLabel || `Semester ${semIdx + 1}`}`}</span>
                <span className="font-mono font-extrabold text-slate-500 text-[10px]">{sem.totalUnits}u / {maxUnitsPerSemester}u</span>
              </div>
              <div className="divide-y divide-slate-50">
                {sem.items.map((item, idx) => (
                  <div key={idx} className="px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                    <div className="space-y-0.5 max-w-[75%] text-left"><p className="font-bold text-slate-900 truncate">{item.code}</p><p className="text-slate-400 font-semibold truncate text-[10px]">{item.title}</p></div>
                    <span className="font-extrabold text-slate-500 bg-white border border-slate-100 px-1.5 py-0.5 rounded font-mono">{item.units}u</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="lg:col-span-2 space-y-4">

      {evaluationStrategy === 'returning' && (
        <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
            <span className="text-xs font-black text-slate-950 uppercase">Record Previously Taken Subjects</span>
            <span className="text-[10px] font-bold text-slate-400">{(studentSubjectsHistory || []).length} recorded</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full border border-slate-200 bg-white p-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    {YEAR_OPTIONS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full border border-slate-200 bg-white p-2.5 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    {SEMESTER_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr className="text-left text-slate-400 uppercase text-[9px] font-black">
                        <th className="p-2.5 w-8">
                          <input
                            type="checkbox"
                            checked={availableToAdd.length > 0 && availableToAdd.every(c => selectedCodes.has(getCode(c)))}
                            onChange={() => toggleAllVisible(availableToAdd)}
                            className="rounded"
                          />
                        </th>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Title</th>
                        <th className="p-2.5">Curriculum</th>
                        <th className="p-2.5 text-right">Units</th>
                        <th className="p-2.5 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableToAdd.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 font-semibold">
                            No subjects found for this Year / Semester.
                          </td>
                        </tr>
                      )}
                      {availableToAdd.map((c) => {
                        const code = getCode(c);
                        const checked = selectedCodes.has(code);
                        return (
                          <tr
                            key={code}
                            onClick={() => toggleCode(code)}
                            className={`cursor-pointer border-t border-slate-100 ${checked ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                          >
                            <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCode(code)}
                                className="rounded"
                              />
                            </td>
                            <td className="p-2.5 font-bold text-slate-900">{code}</td>
                            <td className="p-2.5 text-slate-500 font-semibold">{getTitle(c)}</td>
                            <td className="p-2.5">
                              {getCourseCurriculum(c) ? (
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getCourseCurriculum(c) === latestCurriculum
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                  {getCourseCurriculum(c) === latestCurriculum ? 'New' : 'Old'} • {getCourseCurriculum(c)}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-mono font-extrabold text-slate-500">{getUnits(c)}u</td>
                            <td className="p-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={gradesByCode[code] || '1.0'}
                                onChange={(e) => setGradeForCode(code, e.target.value)}
                                className="border border-slate-200 bg-white p-1.5 rounded-lg text-[11px] font-bold text-slate-800 outline-none"
                              >
                                {GRADE_OPTIONS.map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitTakenSubjects}
                  disabled={selectedCodes.size === 0 || isAdding}
                  className="bg-slate-950 hover:bg-slate-850 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold shadow-md disabled:opacity-40"
                >
                  <Plus size={14} /> {isAdding ? 'Adding...' : `Add Selected (${selectedCodes.size})`}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {(studentSubjectsHistory || []).length === 0 && (
                <p className="text-slate-400 text-[11px] font-semibold py-3 text-center">No previously taken subjects recorded yet.</p>
              )}
              {(studentSubjectsHistory || []).map((s) => (
                <div key={s.id} className="bg-emerald-50/40 border border-emerald-100 p-2.5 rounded-xl flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 max-w-[75%]">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <div className="space-y-0.5 text-left">
                      <p className="font-bold text-slate-900 truncate">{s.subjectCode}</p>
                      <p className="text-slate-400 font-semibold truncate text-[10px]">
                        {s.subjectTitle} • {s.termSaved || `${s.yearTaken || ''} ${s.semesterTaken || ''}`.trim()} • Grade: {s.grade}
                        {s.curriculumTrack ? ` • ${s.curriculumTrack}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteManualSubject(s.id)}
                    aria-label={`Remove ${s.subjectCode || 'manual entry'}`}
                    title="Remove entry"
                    className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="bg-slate-50 p-3 border-b flex justify-between items-center">
          <span className="text-xs font-black text-slate-950 uppercase">Analysis Logs & Rule Results</span>
          <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${auditOutput.overallEligibility === 'ELIGIBLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>{auditOutput.overallEligibility}</span>
        </div>

        <div className="p-4 space-y-4">
          {auditOutput.alerts?.length > 0 && (
            <div className="space-y-2">
              {auditOutput.alerts.map((alertText, index) => (
                <div key={index} className="bg-amber-50/50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" /><p className="font-semibold leading-relaxed">{alertText}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 font-semibold">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wide">Target Requirement Checksheet</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto text-left">
              {auditOutput.deficiencies?.map((def, idx) => (
                <div key={idx} className="bg-rose-50/20 border border-rose-100 p-2.5 rounded-xl flex items-start gap-2 text-[11px]">
                  <ShieldAlert size={14} className="text-rose-600 shrink-0 mt-0.5" /><p className="text-slate-700 font-semibold leading-relaxed">{def}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
            <button type="button" onClick={() => triggerReportModalOpen(evaluationStrategy)} className="border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-xl flex items-center gap-1.5"><Printer size={13} /> Preview Checksheet PDF</button>
            <button type="button" onClick={handleFinalizeEvaluationMatrix} disabled={isSubmitting} className="bg-slate-950 hover:bg-slate-850 text-white px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md">
              {isSubmitting ? "Finalizing Pipeline..." : "Finalize & Record Evaluation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}