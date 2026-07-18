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

const STANDING_TOKEN_PATTERN = /^(?:YEAR_(\d+)|(\d+)(?:ST|ND|RD|TH)\s*YEAR(?:\s*STANDING)?|STANDING)$/i;

function parseStandingRequirement(token) {
  const match = STANDING_TOKEN_PATTERN.exec(token);
  if (!match) return null;
  const num = parseInt(match[1] || match[2], 10);
  if (Number.isNaN(num)) return 0;
  return num - 1;
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

  const recommendedStudyPlan = roadmap.flatMap((t) => t.subjects);
  return { recommendedRoadmap: roadmap, recommendedStudyPlan };
}

export function runReturningStudentEvaluation(catalog, subjectStatuses, studentInfo, curriculumOptions) {
  console.log('studentInfo:', studentInfo);

  let deficiencies = [];
  let alerts = [];
  let unitsEarned = 0;
  let unitsRemaining = 0;

  // --- DETERMINE YEARS SINCE LAST ACTIVE (LOA) WITH EXPLICIT OVERRIDE LOGIC ---
  const currentYear = new Date().getFullYear();
  const lastActiveYear = studentInfo?.lastActiveYear || currentYear;
  const calculatedGap = currentYear - lastActiveYear;
  
  // Isolated Logic: Prioritize manualLoaYears front-end override state parameter
  const yearsGap = studentInfo?.manualLoaYears !== undefined && studentInfo?.manualLoaYears !== null
    ? parseInt(studentInfo.manualLoaYears, 10)
    : calculatedGap;

  let effectiveCatalog = catalog; 
  let curriculumShifted = false;

  if (yearsGap > LOA_LIMIT_YEARS && curriculumOptions?.newCatalog) {
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

  let effectiveSubjectStatuses = subjectStatuses;

  if (curriculumShifted) {
    const mappings = curriculumOptions?.mappings || curriculumOptions?.curriculumMappings || {};
    const mappingByOldCode = new Map(
      Object.entries(mappings).map(([key, value]) => [
        String(value?.oldCourseCode || key).toUpperCase(),
        value,
      ])
    );
    const newCatalogCodes = new Set(effectiveCatalog.map((c) => getCode(c)));
    const oldCatalog = curriculumOptions?.oldCatalog || catalog || [];

    const translated = {};
    let unmatchedCount = 0;

    oldCatalog.forEach((oldCourse) => {
      const oldCode = getCode(oldCourse);
      const oldInfo = subjectStatuses[oldCode];
      if (!oldInfo || !['Completed', 'Credited'].includes(oldInfo.status)) return;

      const mapping = mappingByOldCode.get(oldCode);
      const newCode = mapping?.newCourseCode ? String(mapping.newCourseCode).toUpperCase() : oldCode;

      if (newCatalogCodes.has(newCode)) {
        translated[newCode] = oldInfo;
      } else {
        unmatchedCount++;
      }
    });

    if (unmatchedCount > 0) {
      alerts.push(`${unmatchedCount} previously completed subject(s) have no equivalent in the New Curriculum and could not be carried over — verify curriculum mappings.`);
    }

    effectiveSubjectStatuses = translated;
  }

  const completedCodes = new Set();
  effectiveCatalog.forEach((course) => {
    const codeClean = getCode(course);
    const info = effectiveSubjectStatuses[codeClean] || { status: 'Not Taken', grade: '-', source: 'BSU' };
    const unitsValue = getUnits(course);

    if (['Completed', 'Credited'].includes(info.status)) {
      unitsEarned += unitsValue;
      completedCodes.add(codeClean);
    } else {
      unitsRemaining += unitsValue;
    }
  });

  const MAX_DEFICIENCY_LINES = 12;
  const rawDeficiencyLines = [];

  const subjectList = effectiveCatalog.map((course) => {
    const codeClean = getCode(course);
    const info = effectiveSubjectStatuses[codeClean] || { status: 'Not Taken', grade: '-', source: 'BSU' };
    const unitsValue = getUnits(course);
    const { courseCodePrereqs } = splitPrereqs(getPrereqs(course));
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

  const maxUnitsPerSemester = studentInfo?.maxAllowedUnits || 21;

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

  if (startYearIndex < 0) startYearIndex = 0;
  if (startTermIndex < 0) startTermIndex = 0;

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