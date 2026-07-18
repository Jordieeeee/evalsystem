// Single source of truth for turning a raw studentSubjects.grade value into a
// remarks label. Every student-facing page must call getSubjectRemarks rather
// than re-deriving PASSED/FAILED/etc. locally, so the taxonomy can't drift
// between Dashboard, Assigned Subjects, Evaluation Results, Reports, Profile.
export const REMARKS = {
  PASSED: 'PASSED',
  INCOMPLETE: 'INCOMPLETE',
  FAILED: 'FAILED',
  NOT_YET_GRADED: 'NOT YET GRADED'
};

// Grades that never resolve to a numeric mark. 'Inc' is explicit in the spec;
// 'Drop'/'W' are the two other non-numeric options the grade dropdown allows
// (BATSTATEU_GRADES in curriculumConfig.js) and are treated as INCOMPLETE —
// a course that still needs to be retaken, same bucket as Inc/4.00.
const INCOMPLETE_TOKENS = ['INC', 'DROP', 'W'];

// BatStateU scale: 1.00 is the highest grade, 5.00 is failing.
export function getSubjectRemarks(grade) {
  const raw = grade === undefined || grade === null ? '' : String(grade).trim();
  if (!raw) return REMARKS.NOT_YET_GRADED;

  const normalized = raw.toUpperCase();
  if (INCOMPLETE_TOKENS.includes(normalized)) return REMARKS.INCOMPLETE;

  const numeric = parseFloat(raw);
  // Non-numeric placeholders such as 'In Progress' fall through here.
  if (!Number.isFinite(numeric)) return REMARKS.NOT_YET_GRADED;
  if (numeric === 4) return REMARKS.INCOMPLETE;
  if (numeric === 5) return REMARKS.FAILED;
  if (numeric >= 1 && numeric <= 3) return REMARKS.PASSED;

  return REMARKS.NOT_YET_GRADED;
}

// A subject is "completed/credited" only when its remarks resolve to PASSED.
export function isCreditedSubject(subject) {
  return getSubjectRemarks(subject?.grade) === REMARKS.PASSED;
}
