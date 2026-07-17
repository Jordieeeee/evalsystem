const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const SEMESTER_CYCLE = ['1st Semester', '2nd Semester'];
const LOA_LIMIT_YEARS = 3;

function getCode(c) {
  return (c.courseCode || c.code || c.id || '').toUpperCase();
}
function getTitle(c) {
  return c.courseTitle || c.title || c.id;
}
function getUnits(c) {
  return parseInt(c.creditUnits || c.units || 3, 10);
}
function getPrereqs(c) {
  return (c.prerequisites || []).map((p) => String(p).toUpperCase().trim());
}
function getOfferedTerms(c) {
  if (Array.isArray(c.semesterOffered)) return c.semesterOffered;
  if (c.semesterOffered) return [c.semesterOffered];
  return [];
}

// Some catalog entries list a "prerequisite" that isn't an actual course
// code at all — it's a year-standing gate like "YEAR_3" or
// "4TH YEAR STANDING". Those can never appear in a completed-codes set
// (they're not subjects a student takes), so treating them the same as a
// real course prerequisite made every such subject permanently "locked"
// forever, and flooded the deficiencies list with normal future sequencing
// instead of genuine problems. This detects those tokens and converts them
// to a numeric year threshold instead.
const STANDING_TOKEN_PATTERN = /^(?:YEAR_(\d+)|(\d+)(?:ST|ND|RD|TH)\s*YEAR(?:\s*STANDING)?|STANDING)$/i;

function parseStandingRequirement(token) {
  const match = STANDING_TOKEN_PATTERN.exec(token);
  if (!match) return null;
  const num = parseInt(match[1] || match[2], 10);
  if (Number.isNaN(num)) return 0; // bare "STANDING" with no number — treat as always satisfied
  return num - 1; // convert to 0-based yearIndex (YEAR_3 / "3rd Year" -> index 2)
}

function splitPrereqs(prereqs) {
  const courseCodePrereqs = [];
  const standingRequirements = [];
  prereqs.forEach((p) => {
    const standingYearIndex = parseStandingRequirement(p);
    if (standingYearIndex !== null) {
      standingRequirements.push(standingYearIndex);
    } else {
      courseCodePrereqs.push(p);
    }
  });
  return { courseCodePrereqs, standingRequirements };
}

// Simulates term-by-term registration, unlocking subjects once their
// prerequisites are actually satisfied (not just assumed) and packing each
// term up to maxUnits. The year/semester label is a forward-only counter
// (yearIndex/termIndex) that the scheduler itself advances — it is never
// inferred after the fact from a course's own yearLevel metadata, so it
// can't repeat or jump backward the way the previous flat list did.
function buildRecommendedRoadmap(catalog, completedCodesSet, maxUnits, startYearIndex, startTermIndex) {
  const scheduledCodes = new Set();
  const roadmap = [];
  let remaining = (catalog || []).filter((c) => !completedCodesSet.has(getCode(c)));

  let yearIndex = Math.max(0, startYearIndex);
  let termIndex = Math.max(0, startTermIndex) % SEMESTER_CYCLE.length;
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
      const { courseCodePrereqs, standingRequirements } = splitPrereqs(getPrereqs(c));
      const coursePrereqsMet = courseCodePrereqs.every((p) => completedCodesSet.has(p) || scheduledCodes.has(p));
      // A standing gate (e.g. YEAR_3) is satisfied once the scheduler's own
      // simulated yearIndex has reached it — not by looking it up as a
      // completed subject, which it can never be.
      const standingMet = standingRequirements.every((requiredYearIndex) => yearIndex >= requiredYearIndex);
      const offered = getOfferedTerms(c);
      const offeredMatches =
        offered.length === 0 || offered.some((o) => String(o).trim().toLowerCase() === termLabel.toLowerCase());
      return coursePrereqsMet && standingMet && offeredMatches;
    });

    eligible.sort((a, b) => {
      const yearA = String(a.yearLevel || '').localeCompare(String(b.yearLevel || ''));
      if (yearA !== 0) return yearA;
      return (a.courseCode || a.code || '').localeCompare(b.courseCode || b.code || '');
    });

    let bucketUnits = 0;
    const bucketItems = [];
    eligible.forEach((c) => {
      const units = getUnits(c);
      if (bucketUnits + units <= maxUnits) {
        bucketItems.push(c);
        bucketUnits += units;
      }
    });

    if (bucketItems.length === 0) {
      // Nothing takeable this term (locked by prereqs) — advance the term
      // counter forward and try again. This can never move backward.
      advanceTerm();
      if (yearIndex > maxIterations) break;
      continue;
    }

    bucketItems.forEach((c) => scheduledCodes.add(getCode(c)));
    remaining = remaining.filter((c) => !scheduledCodes.has(getCode(c)));

    roadmap.push({
      term: `${yearLabel} - ${termLabel}`,
      yearLabel,
      termLabel,
      totalUnits: bucketUnits,
      subjects: bucketItems.map((c) => ({
        code: getCode(c),
        title: getTitle(c),
        units: getUnits(c),
      })),
    });

    advanceTerm();
  }

  // Flat, fully-sequenced fallback list (all terms concatenated in order),
  // kept for any caller that still expects a single recommendedStudyPlan
  // array (e.g. re-bucketing when the full catalog isn't available).
  const recommendedStudyPlan = roadmap.flatMap((t) => t.subjects);

  return { recommendedRoadmap: roadmap, recommendedStudyPlan };
}

export function runReturningStudentEvaluation(catalog, subjectStatuses, studentInfo, curriculumOptions) {
  console.log('studentInfo:', studentInfo);

  let deficiencies = [];
  let alerts = [];
  let unitsEarned = 0;
  let unitsRemaining = 0;

  // --- determine years since student's last active semester ---
  const currentYear = new Date().getFullYear();
  const lastActiveYear = studentInfo?.lastActiveYear || currentYear;
  const yearsGap = currentYear - lastActiveYear;

  // curriculumOptions dapat may { oldCatalog, newCatalog, oldCurriculumYear, newCurriculumYear }
  let effectiveCatalog = catalog; // default: yung ibinigay na catalog (old)
  let curriculumShifted = false;

  if (yearsGap > LOA_LIMIT_YEARS && curriculumOptions?.newCatalog) {
    // Lumagpas na sa 3 years, at may bagong curriculum na -> ishift sa bagong curriculum
    effectiveCatalog = curriculumOptions.newCatalog;
    curriculumShifted = true;
    alerts.push(
      `Curriculum Shift Applied: Student was inactive for ${yearsGap} year(s) (exceeds ${LOA_LIMIT_YEARS}-year limit). ` +
      `Old curriculum (${curriculumOptions.oldCurriculumYear || 'N/A'}) is no longer available — evaluated under new curriculum (${curriculumOptions.newCurriculumYear || 'N/A'}).`
    );
  } else {
    alerts.push(
      "LOA Returnee Resume Profile Strategy: Recalculating remaining sequences from last active semester record."
    );
    if (yearsGap > 0) {
      alerts.push(`Student remains within the ${LOA_LIMIT_YEARS}-year allowance (${yearsGap} year(s) inactive, limit not yet exceeded) — old curriculum retained.`);
    }
  }

  // --- pass 1: units earned/remaining + build the completed-codes set ---
  const completedCodes = new Set();
  effectiveCatalog.forEach((course) => {
    const codeClean = getCode(course);
    const info = subjectStatuses[codeClean] || { status: 'Not Taken', grade: '-', source: 'BSU' };
    const unitsValue = getUnits(course);

    if (['Completed', 'Credited'].includes(info.status)) {
      unitsEarned += unitsValue;
      completedCodes.add(codeClean);
    } else {
      unitsRemaining += unitsValue;
    }
  });

  // --- pass 2: now that completedCodes is fully known, check REAL prerequisites ---
  // (previously this hardcoded missingPrereqs: [] and prereqsCleared: true for
  // every subject, so no returning-student subject was ever actually locked)
  // Cap how many "locked" lines the report will ever print — otherwise a
  // fresh returning student (who hasn't completed much yet) sees nearly the
  // entire remaining catalog dumped as "deficiencies", when most of that is
  // just normal future sequencing rather than an actual problem.
  const MAX_DEFICIENCY_LINES = 12;
  const rawDeficiencyLines = [];

  const subjectList = effectiveCatalog.map((course) => {
    const codeClean = getCode(course);
    const info = subjectStatuses[codeClean] || { status: 'Not Taken', grade: '-', source: 'BSU' };
    const unitsValue = getUnits(course);
    const { courseCodePrereqs } = splitPrereqs(getPrereqs(course));
    // Only real course-code prerequisites count as "missing" here — a
    // year-standing gate like YEAR_3 isn't a subject the student can
    // complete, so it's never reported as a deficiency.
    const missingPrereqs = courseCodePrereqs.filter((p) => !completedCodes.has(p));
    const prereqsCleared = missingPrereqs.length === 0;

    if (!['Completed', 'Credited'].includes(info.status) && !prereqsCleared) {
      rawDeficiencyLines.push(
        `${codeClean} (${getTitle(course)}) is locked — missing prerequisite(s): ${missingPrereqs.join(', ')}.`
      );
    }

    return {
      code: codeClean,
      title: getTitle(course),
      units: unitsValue,
      status: info.status,
      grade: info.grade,
      missingPrereqs,
      prereqsCleared,
    };
  });

  deficiencies = rawDeficiencyLines.slice(0, MAX_DEFICIENCY_LINES);
  if (rawDeficiencyLines.length > MAX_DEFICIENCY_LINES) {
    deficiencies.push(`+ ${rawDeficiencyLines.length - MAX_DEFICIENCY_LINES} more subject(s) currently locked by prerequisite chains.`);
  }

  const totalRequired = unitsEarned + unitsRemaining;
  const completionPercentage = totalRequired > 0 ? Math.round((unitsEarned / totalRequired) * 100) : 0;

  // --- build the term-bucketed recommended roadmap ---
  const maxUnitsPerSemester = studentInfo?.maxAllowedUnits || 21;

  // Seed the forward-only scheduler from the student's actual current
  // standing when available, instead of always starting at 1st Year.
let currentYearLevel =
  studentInfo?.currentYearLevel ||
  studentInfo?.assignedStanding ||
  studentInfo?.yearLevel ||
  studentInfo?.currentStanding ||
  '';

let currentSemester =
  studentInfo?.currentSemester ||
  studentInfo?.semester ||
  '';

currentYearLevel = String(currentYearLevel).trim();
currentSemester = String(currentSemester).trim();

let startYearIndex = YEAR_OPTIONS.findIndex(
  y => y.toLowerCase() === currentYearLevel.toLowerCase()
);

let startTermIndex = SEMESTER_CYCLE.findIndex(
  s => s.toLowerCase() === currentSemester.toLowerCase()
);

// Default safely
if (startYearIndex < 0) startYearIndex = 0;
if (startTermIndex < 0) startTermIndex = 0;

// Resume from NEXT semester
startTermIndex++;

if (startTermIndex >= SEMESTER_CYCLE.length) {
  startTermIndex = 0;
  startYearIndex++;
}

if (startYearIndex >= YEAR_OPTIONS.length) {
  startYearIndex = YEAR_OPTIONS.length - 1;
}

  const { recommendedRoadmap, recommendedStudyPlan } = buildRecommendedRoadmap(
    effectiveCatalog,
    completedCodes,
    maxUnitsPerSemester,
    startYearIndex,
    startTermIndex
  );

  if (recommendedRoadmap.length === 0 && unitsRemaining > 0) {
    alerts.push("No subjects could be scheduled this pass — all remaining subjects appear blocked by unmet prerequisites.");
  }

  return {
    unitsEarned,
    unitsRemaining,
    totalRequired,
    completionPercentage,
    subjectList,
    deficiencies,
    alerts,
    curriculumShifted,
    effectiveCurriculum: curriculumShifted ? 'NEW' : 'OLD',
    yearsSinceLastActive: yearsGap,
    recommendedRoadmap,
    recommendedStudyPlan,
    simulatedLoad: recommendedRoadmap[0]?.totalUnits || 0,
    overallEligibility: "ELIGIBLE",
  };
}