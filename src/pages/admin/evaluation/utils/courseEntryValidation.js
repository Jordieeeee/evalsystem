// --- PHASE 1: TRANSCRIPT ENTRY VALIDATION ---
// Gates the Curriculum Shift evaluation: blocking errors stop the run, warnings
// are surfaced on the row but do not gate it.

import { isPassingGrade, canonical } from './runCurriculumShiftEvaluation';

export const createEntryRow = () => ({
  rowId: `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  courseCode: '',
  courseTitle: '',
  grade: '',
  units: '',
  academicYear: '',
  semester: ''
});

export function validateEntries(entries, newSubjectsCatalog = [], oldSubjectsCatalog = []) {
  const errors = [];
  const rowErrors = {};
  const rowWarnings = {};

  const flagRow = (rowId, message) => {
    rowErrors[rowId] = [...(rowErrors[rowId] || []), message];
  };

  if (entries.length === 0) {
    errors.push('Add at least one completed course from the transcript before running the evaluation.');
  }

  const newCodes = new Set(newSubjectsCatalog.map((c) => canonical(c.courseCode || c.id)));
  const oldCodes = new Set(oldSubjectsCatalog.map((c) => canonical(c.courseCode || c.id)));
  const seen = new Map();

  entries.forEach((entry, index) => {
    const label = entry.courseCode?.trim() || `Row ${index + 1}`;
    const code = canonical(entry.courseCode);

    // Required fields
    if (!entry.courseCode?.trim()) flagRow(entry.rowId, 'Course code is required');
    if (!entry.courseTitle?.trim()) flagRow(entry.rowId, 'Course title is required');
    if (!entry.grade) flagRow(entry.rowId, 'Grade is required');
    if (!entry.academicYear) flagRow(entry.rowId, 'Academic year taken is required');
    if (!entry.semester) flagRow(entry.rowId, 'Semester taken is required');

    const units = Number(entry.units);
    if (entry.units === '' || entry.units === null || entry.units === undefined) flagRow(entry.rowId, 'Units are required');
    else if (!Number.isFinite(units) || units <= 0) flagRow(entry.rowId, 'Units must be greater than zero');

    // Duplicate course codes are rejected outright.
    if (code) {
      if (seen.has(code)) {
        flagRow(entry.rowId, `Duplicate of row ${seen.get(code) + 1}`);
        errors.push(`Duplicate course code "${label}" — each course may be entered only once.`);
      } else {
        seen.set(code, index);
      }
    }

    // Not-passed grades are excluded from credit mapping, not rejected.
    if (entry.grade && !isPassingGrade(entry.grade)) {
      rowWarnings[entry.rowId] = `Grade ${entry.grade} is not passing — logged but excluded from credit mapping.`;
    }

    // The admin keyed a New Curriculum code for an Old Curriculum student.
    if (code && newCodes.has(code) && !oldCodes.has(code)) {
      rowWarnings[entry.rowId] = `${entry.courseCode} is a New Curriculum code. An Old Curriculum student should not have this on their transcript — verify the entry.`;
    }
  });

  const rowsWithErrors = Object.keys(rowErrors).length;
  if (rowsWithErrors > 0) {
    errors.push(`${rowsWithErrors} row(s) have missing or invalid required fields.`);
  }

  // At least one course must actually be creditable for the engine to do work.
  if (entries.length > 0 && rowsWithErrors === 0 && !entries.some((e) => isPassingGrade(e.grade))) {
    errors.push('No passed courses entered — at least one course with a passing grade is required to map credits.');
  }

  return { isValid: errors.length === 0, errors: [...new Set(errors)], rowErrors, rowWarnings };
}
