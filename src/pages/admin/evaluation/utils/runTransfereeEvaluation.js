/* eslint-disable */
import { normalizeSemester, normalizeYear } from '../../../../services/curriculumConfig';

const PASSING_MIN = 1.0;
const PASSING_MAX = 3.0;

function normalizeCode(code) {
  return String(code || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().trim();
}

function isPassingGrade(grade) {
  const g = String(grade || "").trim();
  if (!g) return false;
  const upper = g.toUpperCase();
  if (upper === "INC" || upper === "DRP" || upper === "DROPPED") return false;
  if (upper === "IN PROGRESS" || upper === "IP" || upper === "ONGOING") return true;
  const num = parseFloat(g);
  if (Number.isNaN(num)) return false;
  return num >= PASSING_MIN && num <= PASSING_MAX;
}

function isFailingGrade(grade) {
  const g = String(grade || "").trim().toUpperCase();
  if (g === "INC" || g === "5" || g === "5.0" || g === "5.00") return true;
  const num = parseFloat(g);
  return !Number.isNaN(num) && num > PASSING_MAX;
}

function autoMapExternal(extCode, extTitle, catalog) {
  const cleanExt = normalizeCode(extCode);
  const direct = catalog.find((s) => normalizeCode(s.courseCode || s.code) === cleanExt);
  if (direct) return direct.courseCode || direct.code;
  const cleanTitle = String(extTitle || '').trim().toLowerCase();
  if (cleanTitle.length >= 2) {
    const titleHit = catalog.find((s) => {
      const sTitle = String(s.courseTitle || s.title || '').toLowerCase();
      return sTitle === cleanTitle || sTitle.includes(cleanTitle) || cleanTitle.includes(sTitle);
    });
    if (titleHit) return titleHit.courseCode || titleHit.code;
  }
  return undefined;
}

export function runTransfereeEvaluation(
  catalog = [],
  studentSubjectsCollection = [],
  selectedSemester,
  selectedAcadYear,
  minUnits = 15,
  maxUnits = 21,
  manualOverrides = {},
  studentTrack = "" // Pinasa ang track ng estudyante rito
) {
  let deficiencies = [];
  let alerts = [];
  let creditedList = [];
  let rejectedList = [];
  let subjectList = [];

  const safePastSubjects = Array.isArray(studentSubjectsCollection) ? studentSubjectsCollection : [];
  const manualTranscripts = safePastSubjects.filter(s => s.isManualEntry === true);
  const creditedCodes = new Set();
  const catalogByCode = new Map(catalog.map((s) => [normalizeCode(s.courseCode || s.code), s]));

  let hasFailedSubject = false;
  const failedBacklogCodes = new Set();

  // Process Transcripts
  manualTranscripts.forEach(subject => {
    const extCodeClean = normalizeCode(subject.subjectCode);
    const override = manualOverrides[extCodeClean] || manualOverrides[subject.subjectCode];

    if (override?.action === "reject") {
      rejectedList.push({
        code: subject.subjectCode,
        title: subject.subjectTitle,
        units: parseInt(subject.units, 10) || 3,
        grade: subject.grade,
        status: "Rejected",
        reason: override.reason || "Manually rejected by evaluator."
      });
      return;
    }

    if (isFailingGrade(subject.grade)) {
      hasFailedSubject = true;
      const bsuCodeAttempt = subject.bsuEquivalentCode || autoMapExternal(subject.subjectCode, subject.subjectTitle, catalog);
      if (bsuCodeAttempt && bsuCodeAttempt !== 'UNMAPPED') {
        failedBacklogCodes.add(normalizeCode(bsuCodeAttempt));
      }
      rejectedList.push({
        code: subject.subjectCode,
        title: subject.subjectTitle,
        units: parseInt(subject.units, 10) || 3,
        grade: subject.grade,
        status: "Rejected",
        reason: `Failed / incomplete grade (${subject.grade}).`
      });
      deficiencies.push(`Backlog: ${subject.subjectCode} ${subject.subjectTitle} (grade ${subject.grade}).`);
      return;
    }

    if (!isPassingGrade(subject.grade)) {
      rejectedList.push({
        code: subject.subjectCode,
        title: subject.subjectTitle,
        units: parseInt(subject.units, 10) || 3,
        grade: subject.grade,
        status: "Rejected",
        reason: `Grade "${subject.grade}" not recognized as passing.`
      });
      return;
    }

    const bsuCode =
      (override?.action === "approve" && override.bsuCode) ||
      subject.bsuEquivalentCode ||
      autoMapExternal(subject.subjectCode, subject.subjectTitle, catalog);

    if (!bsuCode || bsuCode === 'UNMAPPED') {
      rejectedList.push({
        code: subject.subjectCode,
        title: subject.subjectTitle,
        units: parseInt(subject.units, 10) || 3,
        grade: subject.grade,
        status: "Rejected",
        reason: "No BSU equivalent found. Needs manual mapping."
      });
      alerts.push(`Unmapped: ${subject.subjectCode} ${subject.subjectTitle}. Assign a BSU equivalent manually.`);
      return;
    }

    const bsuCodeClean = normalizeCode(bsuCode);
    const target = catalogByCode.get(bsuCodeClean);

    if (!target) {
      rejectedList.push({
        code: subject.subjectCode,
        title: subject.subjectTitle,
        units: parseInt(subject.units, 10) || 3,
        grade: subject.grade,
        status: "Rejected",
        reason: `Mapped code ${bsuCode} is not in the curriculum catalog.`
      });
      alerts.push(`Invalid mapping target: ${bsuCode} for ${subject.subjectCode}.`);
      return;
    }

    if (creditedCodes.has(bsuCodeClean)) {
      rejectedList.push({
        code: subject.subjectCode,
        title: subject.subjectTitle,
        units: parseInt(subject.units, 10) || 3,
        grade: subject.grade,
        status: "Rejected",
        reason: `Duplicate credit ${bsuCode} already credited from a prior entry.`
      });
      return;
    }

    const targetUnits = parseInt(target.creditUnits || target.units || 3, 10);
    const extUnits = parseInt(subject.units, 10) || 3;

    if (extUnits && Math.abs(extUnits - targetUnits) >= 1) {
      alerts.push(`Unit mismatch on ${subject.subjectCode} ${bsuCode}: ${extUnits} vs ${targetUnits} units.`);
    }

    creditedList.push({
      originalSubject: subject.subjectCode,
      code: target.courseCode || target.code,
      title: target.courseTitle || target.title,
      units: targetUnits,
      grade: subject.grade,
      status: 'Credited',
      reason: override?.action === "approve" ? override.reason || "Approved by evaluator." : "Auto-matched from equivalents."
    });
    creditedCodes.add(bsuCodeClean);
  });

  const getYearIdx = (yr) => {
    const y = String(yr).toLowerCase();
    if (y.includes('second') || y.includes('2')) return 2;
    if (y.includes('third') || y.includes('3')) return 3;
    if (y.includes('fourth') || y.includes('4')) return 4;
    if (y.includes('fifth') || y.includes('5')) return 5;
    return 1;
  };

  const getSemIdx = (sm) => {
    const s = String(sm).toLowerCase();
    if (s.includes('2nd') || s.includes('second') || s.includes('2')) return 2;
    if (s.includes('summer') || s.includes('mid')) return 3;
    return 1;
  };

  const startSemesterText = typeof selectedSemester === 'string' ? selectedSemester : '2nd Semester';
  const targetYearLevel = manualTranscripts[0]?.yearLevelTaken || 'First Year';
  const startYear = getYearIdx(targetYearLevel);
  const startSemester = getSemIdx(startSemesterText);
  const remainingPool = [];

  // Standardized helper to clean track text formatting
  const cleanTrackName = String(studentTrack || "").toLowerCase();

  catalog.forEach(course => {
    const codeClean = normalizeCode(course.courseCode || course.code);
    const isCredited = creditedCodes.has(codeClean);
    const unitsValue = parseInt(course.creditUnits || course.units || 3, 10);
    const courseYearIdx = getYearIdx(course.yearLevel);
    const rawSemArray = Array.isArray(course.semesterOffered) ? course.semesterOffered : [course.semesterOffered];
    const courseSemIdx = getSemIdx(rawSemArray[0] || course.semester || '1st Semester');

if (isCredited) {
      subjectList.push({
        code: course.courseCode || course.code || course.id || '',
        title: course.courseTitle || course.title || course.id || '',
        units: unitsValue,
        status: 'Credited',
        grade: creditedList.find(c => normalizeCode(c.code) === codeClean)?.grade || '3.0'
      });
    } else {
      // --- INTEGRATED TRACK FILTER RULES ---
      const isBAT = codeClean.startsWith("BAT"); // Business Analytics Track
      const isNTT = codeClean.startsWith("NTT"); // Network Technology Track
      const isSMT = codeClean.startsWith("SMT"); // Service Management Track
      let isTrackSubject = isBAT || isNTT || isSMT || !!course.track;
      let matchesStudentTrack = false;

      if (isTrackSubject) {
        if (cleanTrackName.includes("analytics") && isBAT) matchesStudentTrack = true;
        if (cleanTrackName.includes("network") && isNTT) matchesStudentTrack = true;
        if (cleanTrackName.includes("service") && isSMT) matchesStudentTrack = true;

        // I-check din gamit ang track field ng kurso bilang fallback
        if (course.track && cleanTrackName.includes(String(course.track).toLowerCase())) {
          matchesStudentTrack = true;
        }
      }

      // Kung ito ay subject ng ibang track at hindi match sa track ng estudyante, HUWAG isama sa pool
      if (isTrackSubject && !matchesStudentTrack) {
        return;
      }

        const remainingSub = {
        code: course.courseCode || course.code || course.id || '',
        title: course.courseTitle || course.title || course.id || '',
        units: unitsValue,
        year: courseYearIdx,
        semester: courseSemIdx,
        semestersOffered: rawSemArray.length > 0 ? rawSemArray : [course.semester || '1st Semester'],
        prerequisites: course.prerequisites || course.prerequisite || [],
        track: course.track || null,
        category: course.category || '',
        status: 'Not Taken'
      };
      remainingPool.push(remainingSub);
      subjectList.push(remainingSub);
    }
  });

  // Timeline Simulator Engine
  const simulateTimeline = (poolData) => {
    if (poolData.length === 0) return [];
    const pool = JSON.parse(JSON.stringify(poolData));
    const currentlyPassed = new Set(creditedCodes);
    const plans = [];

    let curYear = startYear;
    let curSem = startSemester;
    let safety = 0;

    // Ayusin ang pagkakasunod-sunod ng catalog chronologically
    pool.sort((a, b) => {
      const weightA = a.year * 10 + a.semester;
      const weightB = b.year * 10 + b.semester;
      if (weightA !== weightB) return weightA - weightB;
      return String(a.code || '').localeCompare(String(b.code || ''));
    });

    while (pool.length > 0 && safety < 100) {
      safety++;
      const currentNormalizedTermLabel = curSem === 1 ? '1st' : curSem === 2 ? '2nd' : 'summer';
      const plan = {
        term: `Year ${curYear} Semester ${curSem === 1 ? '1st' : curSem === 2 ? '2nd' : 'Summer'}`,
        termLabel: `Year ${curYear} Semester ${curSem === 1 ? '1st' : curSem === 2 ? '2nd' : 'Summer'}`,
        year: curYear,
        semester: curSem,
        subjects: [],
        totalUnits: 0
      };

      const termAddedSubjects = [];
      for (let i = 0; i < pool.length; ) {
        const s = pool[i];
        const allowedOffers = (s.semestersOffered || []).map(o => normalizeSemester(o));
        const isOfferedThisTerm = allowedOffers.includes(currentNormalizedTermLabel);

        // Check prerequisites
        const rawPre = Array.isArray(s.prerequisites) ? s.prerequisites : [s.prerequisites];
        const satisfiesPrereqs = rawPre.every(p => {
          if (!p || p === '-' || p === 'NONE' || p === '') return true;
          return currentlyPassed.has(normalizeCode(p));
        });

        const satisfiesTimelineGuard = s.year <= curYear;

        if (isOfferedThisTerm && satisfiesPrereqs && satisfiesTimelineGuard && (plan.totalUnits + s.units <= maxUnits)) {
          plan.subjects.push(s);
          plan.totalUnits += s.units;
          termAddedSubjects.push(normalizeCode(s.code));
          pool.splice(i, 1);
        } else {
          i++;
        }
      }

      termAddedSubjects.forEach(code => {
        currentlyPassed.add(code);
        failedBacklogCodes.delete(code);
      });

      if (plan.subjects.length > 0) {
        plans.push(plan);
      } else if (termAddedSubjects.length === 0 && pool.length > 0) {
        // --- FIX: DETECT PROGRESSION LOCK & ENFORCE FORCE-ENLISTMENT ---
        // Instead of hard breaking and wiping out the timeline, let's take the very first blocked course
        // (usually the backlog itself, e.g. IT 111) and force-enlist it into the term.
        const forcedSubject = pool.shift();
        plan.subjects.push(forcedSubject);
        plan.totalUnits += forcedSubject.units;
        currentlyPassed.add(normalizeCode(forcedSubject.code));
        plans.push(plan);
        alerts.push(`Progression Override: Forced placement of [${forcedSubject.code}] due to prerequisite/backlog resolution.`);
      }

      if (curSem === 1) {
        curSem = 2;
      } else if (curSem === 2) {
        curSem = 1;
        curYear++;
      }
    }
    return plans;
  };

const recommendedRoadmap = simulateTimeline(remainingPool);



  const unitsEarned = creditedList.reduce((a, c) => a + c.units, 0);
  const unitsRemaining = remainingPool.reduce((a, r) => a + r.units, 0);
  const totalUnitsRequired = catalog.reduce((a, s) => a + parseInt(s.creditUnits || s.units || 3, 10), 0);
  const completionPercentage = totalUnitsRequired > 0
    ? ((unitsEarned / totalUnitsRequired) * 100).toFixed(1)
    : '0.0';

  const isIrregular = deficiencies.length > 0 || hasFailedSubject;

  return {
    unitsEarned,
    unitsRemaining,
    creditedList,
    obsoleteList: rejectedList,
    missingSubjects: remainingPool,
    subjectList,
    deficiencies,
    alerts,
    recommendedRoadmap,
    cascadedPlanTimeline: recommendedRoadmap,
    completionPercentage,
    overallEligibility: isIrregular ? "Irregular Pathway Model" : "Regular Pathway Approved",
    totalSemestersRequired: recommendedRoadmap.length,
    estimatedYears: (recommendedRoadmap.length / 2).toFixed(1),
    manualOverrideAudits: []
  };
}