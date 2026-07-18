import { getSubjectRemarks, REMARKS } from './studentGrading';
import { getTotalRequiredUnits, YEAR_LEVELS, SEMESTER_LIST } from '../services/curriculumConfig';

// Grades excluded from GWA (matches the existing admin-panel convention: only
// a resolved numeric mark counts toward the weighted average).
const NON_NUMERIC_GRADES = ['Inc', 'Drop', 'W', 'In Progress'];

// The one place completion math happens. Dashboard and Profile both call this
// with the same subjects/academicYear so they can never disagree.
export function computeStudentMetrics(subjects, academicYear) {
  const list = subjects || [];
  const totalRequiredUnits = getTotalRequiredUnits(academicYear);

  const remarksOf = (s) => getSubjectRemarks(s.grade);
  const passed = list.filter((s) => remarksOf(s) === REMARKS.PASSED);
  const incomplete = list.filter((s) => remarksOf(s) === REMARKS.INCOMPLETE);
  const failed = list.filter((s) => remarksOf(s) === REMARKS.FAILED);
  const notYetGraded = list.filter((s) => remarksOf(s) === REMARKS.NOT_YET_GRADED);

  const earnedCredits = passed.reduce((sum, s) => sum + (parseInt(s.units, 10) || 0), 0);
  const totalCredits = list.reduce((sum, s) => sum + (parseInt(s.units, 10) || 0), 0);

  const completionPercentage = totalRequiredUnits > 0
    ? Math.min(100, Math.round((earnedCredits / totalRequiredUnits) * 100))
    : 0;

  let gwa = '–';
  const evaluated = list.filter((s) => s.grade && !NON_NUMERIC_GRADES.includes(s.grade));
  if (evaluated.length > 0) {
    let totalWeightedGrades = 0;
    let totalUnits = 0;
    evaluated.forEach((s) => {
      const gradeVal = parseFloat(s.grade);
      const unitVal = parseFloat(s.units) || 0;
      if (!isNaN(gradeVal)) {
        totalWeightedGrades += gradeVal * unitVal;
        totalUnits += unitVal;
      }
    });
    if (totalUnits > 0) gwa = (totalWeightedGrades / totalUnits).toFixed(2);
  }

  return {
    totalAssigned: list.length,
    passedCount: passed.length,
    incompleteCount: incomplete.length,
    failedCount: failed.length,
    notYetGradedCount: notYetGraded.length,
    // Everything that isn't credited yet — the Dashboard "Pending / Incomplete" card.
    nonCreditedCount: incomplete.length + failed.length + notYetGraded.length,
    gwa,
    earnedCredits,
    totalCredits,
    totalRequiredUnits,
    completionPercentage
  };
}

const yearIndex = (yearLevel) => {
  const idx = YEAR_LEVELS.indexOf(yearLevel);
  return idx === -1 ? YEAR_LEVELS.length : idx;
};
const semesterIndex = (semester) => {
  const idx = SEMESTER_LIST.indexOf(semester);
  return idx === -1 ? SEMESTER_LIST.length : idx;
};

// Two admin write paths into studentSubjects don't use `semester`/`yearLevel`:
// - Transferee manual entries write `semesterTaken`/`yearLevelTaken` instead
//   (src/pages/admin/evaluation/index.jsx, handleAddManualSubjectFromTransferee).
// - Transferee credited-batch writes write neither — only a `termSaved` string
//   like "Transferred/Credited" (same file, handleFinalizeEvaluationMatrix).
// resolveTerm() reads across all three shapes so those subjects still show a
// real term instead of "—".
function resolveTerm(subject) {
  const yearLevel = subject?.yearLevel || subject?.yearLevelTaken || null;
  const semester = subject?.semester || subject?.semesterTaken || null;
  if (yearLevel || semester) {
    return { yearLevel: yearLevel || 'Unspecified Year', semester: semester || 'Unspecified Semester', hasStructuredTerm: true };
  }
  if (subject?.termSaved) {
    return { yearLevel: subject.termSaved, semester: subject.termSaved, hasStructuredTerm: false, label: subject.termSaved };
  }
  return { yearLevel: 'Unspecified Year', semester: 'Unspecified Semester', hasStructuredTerm: true };
}

// A subject's display term: "<semester> • <year level>", falling back to the
// *Taken/termSaved fields transferee-credited subjects actually carry.
export function formatSubjectTerm(subject) {
  const resolved = resolveTerm(subject);
  if (!resolved.hasStructuredTerm) return resolved.label;
  return `${resolved.semester} • ${resolved.yearLevel}`;
}

// Groups subjects into ordered { yearLevel, semester, label, subjects } buckets,
// sorted First Year → Fourth Year, then 1st Semester → 2nd Semester → Summer.
// Groups with no structured year/semester (e.g. transferred/credited batches)
// sort after every real term.
export function groupSubjectsByTerm(subjects) {
  const groups = new Map();
  (subjects || []).forEach((subject) => {
    const resolved = resolveTerm(subject);
    const key = resolved.hasStructuredTerm ? `${resolved.yearLevel}__${resolved.semester}` : `term-saved__${resolved.label}`;
    if (!groups.has(key)) {
      groups.set(key, {
        yearLevel: resolved.yearLevel,
        semester: resolved.semester,
        hasStructuredTerm: resolved.hasStructuredTerm,
        label: resolved.hasStructuredTerm ? `${resolved.yearLevel} • ${resolved.semester}` : resolved.label,
        subjects: []
      });
    }
    groups.get(key).subjects.push(subject);
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.hasStructuredTerm !== b.hasStructuredTerm) return a.hasStructuredTerm ? -1 : 1;
    if (!a.hasStructuredTerm) return a.label.localeCompare(b.label);
    const yearDiff = yearIndex(a.yearLevel) - yearIndex(b.yearLevel);
    if (yearDiff !== 0) return yearDiff;
    return semesterIndex(a.semester) - semesterIndex(b.semester);
  });
}

// Subjects matching the student's current standing (yearLevel + semester on
// the student doc) — the default view for Assigned Subjects.
export function getCurrentSemesterSubjects(subjects, student) {
  if (!student) return [];
  return (subjects || []).filter(
    (s) => s.yearLevel === student.yearLevel && s.semester === student.semester
  );
}
