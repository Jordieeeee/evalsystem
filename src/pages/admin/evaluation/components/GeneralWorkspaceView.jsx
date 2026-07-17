import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, HelpCircle, BookOpen, Trash2, Check, X, Plus, FileSpreadsheet, Layers, FileText
} from 'lucide-react';
import { db } from '../../../../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { checkEnrollmentLimit, getFallbackSubjects } from '../../../../services/curriculumConfig';

const GRADES_LIST = ['1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00', '5.00', 'Inc', 'Drop', 'W'];
const SEMESTER_LIST = ['1st Semester', '2nd Semester', 'Summer'];
const YEAR_LEVELS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

export default function GeneralWorkspaceView({
  auditOutput,
  minAllowedUnits,
  maxAllowedUnits,
  evaluationStrategy,
  handleTriggerReportModalOpen,
  handleFinalizeEvaluationMatrix,
  isSubmitting,
  registrarRemarks,
  setRegistrarRemarks,
  selectedStudentData,
  studentSubjectsHistory,
  newSubjectsCatalog,
  oldSubjectsCatalog
}) {
  const [recordReviewTab, setRecordReviewTab] = useState('completed');
  const [gradingSubjectId, setGradingSubjectId] = useState(null);
  const [selectedInlineGrade, setSelectedInlineGrade] = useState('1.00');

  const [isSingleSubjectModalOpen, setIsSingleSubjectModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsPopulateModalOpen] = useState(false);

  const [newSubjectRecord, setNewSubjectRecord] = useState({
    subjectCode: '', subjectTitle: '', units: 3, term: '2026-2027', yearLevel: 'First Year', semester: '1st Semester', grade: 'In Progress'
  });

  if (!auditOutput || !selectedStudentData) return null;

  const activeSemesterSubjects = (studentSubjectsHistory || []).filter(sub => 
    sub.semester === selectedStudentData.semester && sub.yearLevel === selectedStudentData.yearLevel
  );
  
  const totalEnrolledUnits = activeSemesterSubjects.reduce((acc, curr) => acc + (parseInt(curr.units) || 0), 0);
  
  const hasFailedActiveSubjects = activeSemesterSubjects.some(sub => 
    sub.grade === '5.00' || ['failed', 'incomplete'].includes(String(sub.status).toLowerCase())
  );
  const isEligibleToAdvance = activeSemesterSubjects.length > 0 && !hasFailedActiveSubjects;

  const handleInputGradeSubmit = async (subjectId) => {
    const statusText = selectedInlineGrade === '5.00' ? 'failed' : ['Inc', 'Drop', 'W'].includes(selectedInlineGrade) ? 'incomplete' : 'passed';
    try {
      const docRef = doc(db, 'studentSubjects', subjectId);
      await updateDoc(docRef, { grade: selectedInlineGrade, status: statusText, recordedAt: new Date().toISOString() });
      setGradingSubjectId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddManualSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectRecord.subjectCode) return;
    try {
      await addDoc(collection(db, 'studentSubjects'), {
        studentId: selectedStudentData.studentId || selectedStudentData.id,
        subjectCode: newSubjectRecord.subjectCode.toUpperCase(),
        subjectTitle: newSubjectRecord.subjectTitle || 'Manual Evaluation Course',
        grade: newSubjectRecord.grade,
        status: newSubjectRecord.grade === 'In Progress' ? 'in progress' : 'passed',
        term: newSubjectRecord.term,
        yearLevel: selectedStudentData.yearLevel,
        semester: selectedStudentData.semester,
        units: parseInt(newSubjectRecord.units, 10) || 3,
        recordedAt: new Date().toISOString()
      });
      setIsSingleSubjectModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePopulateSemesterTemplate = async (e) => {
    e.preventDefault();
    const catalog = selectedStudentData.curriculum === 'NEW' ? newSubjectsCatalog : oldSubjectsCatalog;
    let matchingSubjects = (catalog || []).filter(sub => {
      const subYear = String(sub.yearLevel || sub.year).toLowerCase();
      const targetYear = String(selectedStudentData.yearLevel).toLowerCase();
      return subYear.includes(targetYear.split(' ')[0]);
    });

    try {
      for (const sub of matchingSubjects) {
        await addDoc(collection(db, 'studentSubjects'), {
          studentId: selectedStudentData.studentId || selectedStudentData.id,
          subjectCode: (sub.courseCode || sub.code || '').toUpperCase(),
          subjectTitle: sub.courseTitle || sub.title || 'Curriculum Course',
          grade: 'In Progress',
          status: 'in progress',
          term: '2026-2027',
          yearLevel: selectedStudentData.yearLevel,
          semester: selectedStudentData.semester,
          units: parseInt(sub.creditUnits || sub.units || 3, 10),
          recordedAt: new Date().toISOString()
        });
      }
      setIsPopulateModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

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

  console.log('=== DEBUG SCHEDULE START ===');
  console.log('studentYearLevel prop received:', studentYearLevel);
  console.log('studentSemester prop received:', studentSemester);
  console.log('computed startYearIndex:', startYearIndex);
  console.log('computed startTermIndex:', startTermIndex);

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
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Current Semester Course Load Sheet</h3>
            <p className="text-slate-400 text-[11px] font-medium mt-0.5">Click any grade rating below to mutate or clear marks.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => setIsPopulateModalOpen(true)} className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-3xs transition-all"><FileSpreadsheet size={13} /> Pre-Load Template</button>
            <button type="button" onClick={() => setIsSingleSubjectModalOpen(true)} className="px-3 py-1.5 bg-[#7D1924] text-white hover:bg-[#63121b] rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-3xs transition-all"><Plus size={13} /> Add Custom Subject</button>
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

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="p-3 pl-4 w-[20%]">Subject Code</th>
                <th className="p-3 w-[45%]">Descriptive Title</th>
                <th className="p-3 text-center w-[12%]">Units Weight</th>
                <th className="p-3 text-center w-[15%]">Grade Rating</th>
                <th className="p-3 pr-4 text-right w-[8%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
              {activeSemesterSubjects.length > 0 ? (
                activeSemesterSubjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 pl-4 font-black text-slate-900 tracking-tight">{sub.subjectCode}</td>
                    <td className="p-3 text-slate-500 font-medium truncate max-w-[280px]">{sub.subjectTitle}</td>
                    <td className="p-3 text-center text-slate-950 font-black">{sub.units} U</td>
                    <td className="p-3 text-center">
                      {gradingSubjectId === sub.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <select value={selectedInlineGrade} onChange={e => setSelectedInlineGrade(e.target.value)} className="border rounded bg-white p-1 text-[11px] font-bold text-slate-900 outline-none">
                            <option value="In Progress">In Progress</option>
                            {GRADES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                          <button onClick={() => handleInputGradeSubmit(sub.id)} className="bg-emerald-600 text-white rounded p-1"><Check size={10}/></button>
                          <button onClick={() => setGradingSubjectId(null)} className="bg-slate-100 border rounded p-1 text-slate-500"><X size={10}/></button>
                        </div>
                      ) : (
                        <span onClick={() => { setGradingSubjectId(sub.id); setSelectedInlineGrade(sub.grade || 'In Progress'); }} className={`cursor-pointer underline font-black ${sub.grade === '5.00' ? 'text-rose-600' : 'text-blue-600'}`}>{sub.grade || 'In Progress'}</span>
                      )}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <button type="button" onClick={() => handleDeleteRecord(sub.id)} className="text-slate-400 hover:text-rose-600 p-1"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium italic">No active course modules loaded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Academic Progress Requirements Blueprint</h3>
          <div className="flex bg-slate-100 p-0.5 rounded-xl border gap-0.5">
            {['completed', 'failed', 'remaining'].map(tab => (
              <button key={tab} type="button" onClick={() => setRecordReviewTab(tab)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${recordReviewTab === tab ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}>{tab}</button>
            ))}
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto">
          {recordReviewTab === 'completed' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-bold">
              {auditOutput.completedSubjectsList?.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-emerald-50/20 border border-emerald-100/40 rounded-xl">
                  <CheckCircle size={13} className="text-emerald-600 shrink-0 mr-2" />{s.subjectCode}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-5 border border-slate-200/60 rounded-2xl shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border ${isEligibleToAdvance ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><Layers size={20} /></div>
          <div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">Automated Transition Validation Check</h4>
            <p className="text-slate-400 text-xs font-medium mt-0.5">{isEligibleToAdvance ? 'All loaded subjects are passed. Ready to advance.' : 'Advancement Hold: Student requires passing marks.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button type="button" onClick={() => handleTriggerReportModalOpen(evaluationStrategy.toUpperCase())} className="flex items-center gap-1.5 px-4 py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider text-slate-700"><FileText size={14} /> Preview PDF</button>
          <button type="button" disabled={isSubmitting || !isEligibleToAdvance} onClick={handleFinalizeEvaluationMatrix} className="bg-slate-950 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-xl disabled:opacity-40">Commit Semester Advancement</button>
        </div>
      </div>
    </div>
  );
}