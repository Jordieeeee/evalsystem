// curriculumConfig.js

// --- SHARED ACADEMIC ENUMERATIONS ---
// Single definition shared by Student Management and the evaluation pipelines so
// the option lists cannot drift apart.
export const BATSTATEU_GRADES = ['1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00', '5.00', 'Inc', 'Drop', 'W'];
export const SEMESTER_LIST = ['1st Semester', '2nd Semester', 'Summer'];
export const YEAR_LEVELS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

// Grades that do not earn credit toward a curriculum requirement.
export const NON_PASSING_GRADES = ['5.00', 'INC', 'DROP', 'DRP', 'W'];

// --- CURRICULUM SELECTION BY TERM ---
// The single threshold deciding which subject catalog a term belongs to. Terms
// starting on or after this year are NEW curriculum; earlier terms are OLD.
// Change this one value to move the boundary.
export const CURRICULUM_CUTOFF_YEAR = 2026;

// Terms are '<start>-<end>' (e.g. '2026-2027'). Always compare the parsed start
// year as an integer -- string comparison breaks as soon as the format changes.
export const parseTermStartYear = (term) => parseInt(String(term ?? '').split('-')[0], 10);

// Returns 'NEW' | 'OLD'. An unparseable term falls back to OLD so a malformed
// value can never silently pull from the current catalog.
export const getCurriculumForTerm = (term) => {
  const startYear = parseTermStartYear(term);
  if (!Number.isFinite(startYear)) return 'OLD';
  return startYear >= CURRICULUM_CUTOFF_YEAR ? 'NEW' : 'OLD';
};

// --- TOTAL DEGREE-REQUIRED UNITS ---
// The denominator for every completion computation (Profile bar, Academic
// Overview %, unit counts). Derived per student from their academicYear
// field, never a single hardcoded constant across all students.
export const TOTAL_REQUIRED_UNITS = { NEW: 204, OLD: 137 };

export const getTotalRequiredUnits = (academicYear) => {
  const curriculum = getCurriculumForTerm(academicYear);
  return TOTAL_REQUIRED_UNITS[curriculum];
};

// Generate academic year range from 2020-2021 through 2050-2051 (reversed: newest first)
export const generateAcademicYears = () => {
  const startYear = 2020;
  const endYear = 2050;
  const years = [];
  for (let year = endYear; year >= startYear; year--) {
    years.push(`${year}-${year + 1}`);
  }
  return years;
};

export const ACADEMIC_YEARS_LIST = generateAcademicYears();

// --- MAXIMUM UNITS CONFIGURATION MATRIX ---
// Per year level and semester. `_mid` is the midyear/summer term.
// y4_s2 is capped at 6 for thesis/capstone/OJT — a full slot there is 6u, not 21u.
// Also read by checkEnrollmentLimit() for student enrollment validation.
export const MAX_UNITS_CONFIG = {
  new_curriculum: {
    y1_s1: 24, y1_s2: 24, y1_mid: 12, y2_s1: 23, y2_s2: 23, y2_mid: 6,
    y3_s1: 21, y3_s2: 21, y3_mid: 6, y4_s1: 21, y4_s2: 6
  },
  old_curriculum: {
    y1_s1: 23, y1_s2: 23, y2_s1: 23, y2_s2: 23, y3_s1: 21, 
    y3_s2: 21, y3_mid: 6, y4_s1: 21, y4_s2: 6   
  }
};

// --- HELPER SYSTEM NORMALIZERS ---
export const normalizeYear = (yearString) => {
  const y = String(yearString).toLowerCase().trim();
  if (y.includes('1') || y.includes('first')) return '1';
  if (y.includes('2') || y.includes('second')) return '2';
  if (y.includes('3') || y.includes('third')) return '3';
  if (y.includes('4') || y.includes('fourth')) return '4';
  return y.replace(/\D/g, '') || '1';
};

export const normalizeSemester = (semString) => {
  const s = String(semString).toLowerCase().trim();
  if (s.includes('1st') || s.includes('first')) return '1st';
  if (s.includes('2nd') || s.includes('second')) return '2nd';
  if (s.includes('summer') || s.includes('mid')) return 'summer';
  return '1st';
};

// --- VALIDATION HELPER ---
export function checkEnrollmentLimit(curriculumType, year, semester, totalEnrolledUnits) {
  const curriculumKey = curriculumType.toLowerCase() === 'new' ? 'new_curriculum' : 'old_curriculum';
  const cleanYear = normalizeYear(year);
  const cleanSem = normalizeSemester(semester);
  
  const semKey = cleanSem === '2nd' ? '2' : cleanSem === 'summer' ? 'mid' : '1';
  const semesterKey = semKey === 'mid' ? `y${cleanYear}_mid` : `y${cleanYear}_s${semKey}`;
  
  const config = MAX_UNITS_CONFIG[curriculumKey];
  if (!config) return { success: false, message: "Invalid curriculum profile catalog." };

  const maxAllowed = config[semesterKey] || 21; // fallback threshold if unmapped
  if (totalEnrolledUnits > maxAllowed) {
    return { success: false, message: `Limit exceeded. Maximum allowed is ${maxAllowed} units. (Attempted: ${totalEnrolledUnits} units)` };
  }
  return { success: true, maxAllowed };
}

// --- DYNAMIC DATABASE CURRICULUM FALLBACKS ---
export const getFallbackSubjects = (course, yearLevel, semester) => {
  const cleanYear = normalizeYear(yearLevel);
  const cleanSem = normalizeSemester(semester);
  
  const curriculumMap = {
    '1': {
      '1st': [
        { code: 'GEd-101', title: 'Understanding the Self', units: 3 },
        { code: 'GEd-102', title: 'Purposive Communication', units: 3 },
        { code: 'MATH-111', title: 'Mathematics in the Modern World', units: 3 },
        { code: 'IT-101', title: 'Introduction to Computing', units: 3 },
        { code: 'IT-102', title: 'Computer Programming 1', units: 3 },
        { code: 'PE-101', title: 'Physical Education 1', units: 2 }
      ],
      '2nd': [{ code: 'IT-103', title: 'Computer Programming 2', units: 3 }]
    },
    '3': {
      '1st': [
        { code: 'IT-311', title: 'Systems Administration and Maintenance', units: 3 },
        { code: 'IT-312', title: 'System Integration and Architecture', units: 3 },
        { code: 'IT-313', title: 'System Analysis and Design', units: 3 },
        { code: 'IT-314', title: 'Web Systems and Technologies', units: 3 }
      ]
    }
  };

  const yearConfig = curriculumMap[cleanYear] || curriculumMap['1'];
  const subjects = yearConfig[cleanSem === '2nd' ? '2nd' : cleanSem === 'summer' ? 'summer' : '1st'] || yearConfig['1st'];

  return subjects.map(sub => ({
    code: `${course}-${sub.code}`,
    title: sub.title,
    units: sub.units
  }));
};