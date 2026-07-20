/* eslint-disable */
import { normalizeYear } from '../../../../services/curriculumConfig';

const PASSING_MIN = 1.0;
const PASSING_MAX = 3.0;

// Local, self-contained term-key canonicalizer used ONLY for comparing
// "which term is this course offered in" against "what term is the
// scheduler currently on". Previously both sides ran through the shared
// normalizeSemester() import — if that function produced even slightly
// different output depending on how it was called (casing, wording like
// "1st Semester" vs "First Semester", trimming), the comparison silently
// failed for every term, forever. A course that never matches can only
// ever enter the plan through the "force one subject after 4 stagnant
// terms" fallback, which is why the roadmap crawled forward one course at
// a time and years ballooned into double digits. This function is simple,
// forgiving, and used identically on both sides, so it can't mismatch.
function canonicalTermKey(raw) {
  const s = String(raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!s) return '1st'; // no data — default to 1st Semester rather than never matching
  if (s.includes('sum') || s.includes('mid')) return 'summer';
  if (s.includes('2nd') || s.includes('second') || s === '2') return '2nd';
  return '1st';
}

function normalizeCode(code) {
  return String(code || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().trim();
}

// This catalog's course objects only ever populate the `id` field — never
// `courseCode` or `code`. Every place in this file that resolved a course's
// identifying code using only `course.courseCode || course.code` silently
// collapsed to an empty string for the ENTIRE catalog, which broke credit
// mapping (catalogByCode had only one key: ""), isCredited detection, and
// autoMapExternal's direct lookup. This is now the single source of truth
// for resolving a course's code, used everywhere instead of the old
// inconsistent inline pattern.
function getCatalogCode(course) {
  return course?.courseCode || course?.code || course?.id || '';
}

// Produces "1st", "2nd", "3rd", "4th", "11th", "21st", etc. Used to build
// human-readable term labels like "2nd Year - 2nd Semester" — previously
// termLabel was assembled as `Year ${curYear} Semester ${...}`, which is
// both the wrong word order and never gave curYear an ordinal suffix at
// all, so the roadmap UI's "SCHEDULE: Nth YEAR - Nth SEMESTER" header had
// nothing it could parse out of it and rendered blank.
function ordinal(n) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
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

// Some catalogs carry a stray "group header" row alongside the real
// courses — e.g. a code of just "CC" with title "CC" and an aggregated
// unit count — left over from however the data was assembled. It isn't
// a real subject a student can take, but nothing else in this file
// distinguishes it from an actual course, so once it clears the track
// filter it gets scheduled like any other subject. A real course code
// always contains a number (CC_100, BAT_401, ...); a bare category
// label doesn't, so that's the signal used to drop it here.
function isPlaceholderCourseEntry(course) {
  const code = String(getCatalogCode(course) || '').trim();
  if (!code) return true;
  if (!/\d/.test(code)) return true;
  const title = String(course.courseTitle || course.title || '').trim();
  if (title && title.toLowerCase() === code.toLowerCase()) return true;
  return false;
}

function isFailingGrade(grade) {
  const g = String(grade || "").trim().toUpperCase();
  if (g === "INC" || g === "5" || g === "5.0" || g === "5.00") return true;
  const num = parseFloat(g);
  return !Number.isNaN(num) && num > PASSING_MAX;
}

// Some catalog entries list a "prerequisite" that isn't an actual course
// code at all — it's a year-standing gate like "YEAR_3" or
// "4TH YEAR STANDING". Those can never appear in a completed-codes set
// (they're not subjects a student takes), so treating them the same as a
// real course prerequisite made every such subject permanently locked
// forever, only ever resolved through forced enlistment one at a time.
const STANDING_TOKEN_PATTERN = /^(?:YEAR_?(\d+)|(\d+)(?:ST|ND|RD|TH)\s*YEAR(?:\s*STANDING)?|STANDING)$/i;

function parseStandingRequirement(token) {
  const match = STANDING_TOKEN_PATTERN.exec(String(token || '').trim());
  if (!match) return null;
  const num = parseInt(match[1] || match[2], 10);
  if (Number.isNaN(num)) return 0;
  return num; // 1-based year threshold (YEAR_3 / "3rd Year" -> 3)
}

function splitPrereqs(prereqs) {
  const courseCodePrereqs = [];
  const standingRequirements = [];
  (prereqs || []).forEach((p) => {
    const standingYear = parseStandingRequirement(p);
    if (standingYear !== null) {
      standingRequirements.push(standingYear);
    } else {
      courseCodePrereqs.push(p);
    }
  });
  return { courseCodePrereqs, standingRequirements };
}

function autoMapExternal(extCode, extTitle, catalog) {
  const cleanExt = normalizeCode(extCode);
  const direct = catalog.find((s) => normalizeCode(getCatalogCode(s)) === cleanExt);
  if (direct) return getCatalogCode(direct);
  const cleanTitle = String(extTitle || '').trim().toLowerCase();
  if (cleanTitle.length >= 2) {
    const titleHit = catalog.find((s) => {
      const sTitle = String(s.courseTitle || s.title || '').toLowerCase();
      return sTitle === cleanTitle || sTitle.includes(cleanTitle) || cleanTitle.includes(sTitle);
    });
    if (titleHit) return getCatalogCode(titleHit);
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
  studentTrack = "", // Pinasa ang track ng estudyante rito
  studentYearLevel = "" // The student's ACTUAL current assigned standing
) {
  let deficiencies = [];
  let alerts = [];
  let creditedList = [];
  let rejectedList = [];
  let subjectList = [];

  const safePastSubjects = Array.isArray(studentSubjectsCollection) ? studentSubjectsCollection : [];
  const manualTranscripts = safePastSubjects.filter(s => s.isManualEntry === true);
  const creditedCodes = new Set();
  const catalogByCode = new Map(catalog.map((s) => [normalizeCode(getCatalogCode(s)), s]));

  let hasFailedSubject = false;
  const failedBacklogCodes = new Set();

  // Process Transcripts
  manualTranscripts.forEach(subject => {
    console.log('CHECKING SUBJECT:', subject.subjectCode, '| bsuEquivalentCode:', subject.bsuEquivalentCode, '| grade:', subject.grade);
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
      code: getCatalogCode(target),
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
  // Use the student's ACTUAL current assigned standing as the roadmap's
  // starting point — not the year level of whichever manual transcript
  // happens to be first in the array (that was only ever a placeholder
  // default and doesn't reflect where the student is standing today).
  const targetYearLevel = studentYearLevel || manualTranscripts[0]?.yearLevelTaken || 'First Year';
  const startYear = getYearIdx(targetYearLevel);
  const startSemester = getSemIdx(startSemesterText);
  const remainingPool = [];

  // Standardized helper to clean track text formatting
  const cleanTrackName = String(studentTrack || "").toLowerCase();

  catalog.forEach(course => {
    if (isPlaceholderCourseEntry(course)) return;
    const codeClean = normalizeCode(getCatalogCode(course));
    const isCredited = creditedCodes.has(codeClean);
    const unitsValue = parseInt(course.creditUnits || course.units || 3, 10);
    const courseYearIdx = getYearIdx(course.yearLevel);
    const rawSemArray = Array.isArray(course.semesterOffered) ? course.semesterOffered : [course.semesterOffered];
    const courseSemIdx = getSemIdx(rawSemArray[0] || course.semester || '1st Semester');

if (isCredited) {
      subjectList.push({
        code: getCatalogCode(course),
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

      // A course only counts as track-restricted if its `track` field
      // actually names one of the three known tracks. The old check —
      // `|| !!course.track` — flagged ANY course with a non-empty track
      // field, so a core/general subject like CC_100 with an unrelated
      // truthy track value (e.g. "Core", "CC", a stray placeholder) got
      // silently excluded from remainingPool even though it was never
      // meant to be track-exclusive. That dropped course then permanently
      // blocked every subject that listed it as a prerequisite (see the
      // "PHANTOM PREREQUISITES DETECTED" diagnostic below — CC_100 was
      // required by CC_102, CC_103, NET_101, SIP_101, none of which could
      // ever unlock).
      const courseTrackLower = String(course.track || '').trim().toLowerCase();
      const hasRecognizedTrackField =
        courseTrackLower.includes('analytics') ||
        courseTrackLower.includes('network') ||
        courseTrackLower.includes('service') ||
        courseTrackLower.includes('bat') ||
        courseTrackLower.includes('ntt') ||
        courseTrackLower.includes('smt');
      let isTrackSubject = isBAT || isNTT || isSMT || hasRecognizedTrackField;
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
        // Targeted diagnostic: confirms exactly why this course was dropped.
        // Safe to remove once the CC_100 case is confirmed/resolved.
        console.warn(
          `=== DROPPED BY TRACK FILTER === ${getCatalogCode(course)} — course.track="${course.track}", ` +
          `studentTrack="${studentTrack}", isBAT=${isBAT}, isNTT=${isNTT}, isSMT=${isSMT}`
        );
        return;
      }

        const remainingSub = {
        code: getCatalogCode(course),
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

    let stagnantTerms = 0;
    while (pool.length > 0 && safety < 100) {
      safety++;
      // Both the current term and each course's offered terms now go
      // through the SAME local canonicalTermKey() — guaranteed identical
      // output on both sides, so a course offered in "1st Semester" always
      // matches curSem === 1, regardless of exact wording/casing in the
      // catalog data.
      const currentTermKey = canonicalTermKey(
        curSem === 1 ? '1st Semester' : curSem === 2 ? '2nd Semester' : 'Summer'
      );
      const plan = {
        // "Nth Year - Nth Semester" / "Nth Year - Summer" — matches the
        // format the roadmap UI's "SCHEDULE:" header expects. The old
        // `Year ${curYear} Semester ${...}` shape was both the wrong word
        // order and never gave curYear an ordinal suffix, so the header
        // rendered blank.
        //
        // Exposed under BOTH `termLabel` and `term`: PrintReportModal's
        // transferee/default report reads `term.term` (the key the
        // returning-student roadmap builder in index.jsx happens to use),
        // not `term.termLabel` — without this alias the header prints as
        // "Schedule: " with nothing after it, since `term.term` was
        // simply undefined on every plan object this function returned.
        termLabel: curSem === 3
          ? `${ordinal(curYear)} Year - Summer`
          : `${ordinal(curYear)} Year - ${ordinal(curSem)} Semester`,
        year: curYear,
        semester: curSem,
        subjects: [],
        totalUnits: 0
      };
      plan.term = plan.termLabel;

      const termAddedSubjects = [];
      for (let i = 0; i < pool.length; ) {
        const s = pool[i];
        const allowedOffers = (s.semestersOffered || []).map(o => canonicalTermKey(o));
        const isOfferedThisTerm = allowedOffers.includes(currentTermKey);

        // Check prerequisites — split real course-code prereqs from
        // year-standing gates (YEAR_3, "4th Year Standing", etc). A standing
        // gate is satisfied once the scheduler's own simulated curYear has
        // reached it — it can never appear in currentlyPassed since it's
        // not an actual subject the student completes.
        const rawPre = Array.isArray(s.prerequisites) ? s.prerequisites : [s.prerequisites];
        const { courseCodePrereqs, standingRequirements } = splitPrereqs(rawPre);
        const satisfiesCoursePrereqs = courseCodePrereqs.every(p => {
          if (!p || p === '-' || p === 'NONE' || p === '') return true;
          return currentlyPassed.has(normalizeCode(p));
        });
        const satisfiesStanding = standingRequirements.every(reqYear => curYear >= reqYear);
        const satisfiesPrereqs = satisfiesCoursePrereqs && satisfiesStanding;

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
        stagnantTerms = 0;
      } else if (termAddedSubjects.length === 0 && pool.length > 0) {
        stagnantTerms++;
        if (stagnantTerms === 1) {
          console.log('=== STUCK AT TERM ===', 'Year', curYear, 'Sem', curSem);
          console.log('First 3 stuck subjects:', JSON.stringify(pool.slice(0, 3), null, 2));
        }
        // Only force-enlist after several consecutive terms with zero
        // progress (a real stuck deadlock/circular prereq) — not on the
        // first stalled term, which is usually just normal sequencing
        // (a subject waiting for its correct offered semester or year).
        if (stagnantTerms >= 4) {
          const forcedSubject = pool.shift();
          plan.subjects.push(forcedSubject);
          plan.totalUnits += forcedSubject.units;
          currentlyPassed.add(normalizeCode(forcedSubject.code));
          plans.push(plan);
          alerts.push(`Progression Override: Forced placement of [${forcedSubject.code}] due to prerequisite/backlog resolution.`);
          stagnantTerms = 0;
        }
      }

      // Cycle through 1st Semester -> 2nd Semester -> Summer -> next year's
      // 1st Semester. Previously this only alternated between 1 and 2,
      // so any subject offered ONLY in "Summer Term" (CSAI_100, ITPM_101,
      // QM_101, SQA_101, etc.) could never be naturally scheduled at all.
      if (curSem === 1) {
        curSem = 2;
      } else if (curSem === 2) {
        curSem = 3;
      } else {
        curSem = 1;
        curYear++;
      }
    }
    return plans;
  };

  const recommendedRoadmap = simulateTimeline(remainingPool);

  // --- DIAGNOSTIC: detect "phantom" prerequisites — a code that some
  // course lists as a prerequisite but that never actually made it into
  // either creditedCodes or remainingPool. If a subject is silently
  // dropped (e.g. by the track filter above, or because it's missing from
  // whatever catalog array was actually passed in), anything requiring it
  // becomes permanently unsolvable and this will show exactly which code
  // and which course triggered it. Safe to remove once the root cause is
  // confirmed. ---
  {
    const catalogCodeOf = (c) => normalizeCode(c.courseCode || c.code || c.id);
    const knownCodes = new Set([
      ...Array.from(creditedCodes),
      ...remainingPool.map((r) => normalizeCode(r.code)),
    ]);
    const catalogCodes = new Set(catalog.map(catalogCodeOf));
    const phantomPrereqs = new Map(); // missingCode -> [courses that need it]

    catalog.forEach((course) => {
      const rawPre = course.prerequisites || course.prerequisite || [];
      const preArr = Array.isArray(rawPre) ? rawPre : [rawPre];
      const { courseCodePrereqs } = splitPrereqs(preArr);
      courseCodePrereqs.forEach((p) => {
        if (!p || p === '-' || p === 'NONE') return;
        const pClean = normalizeCode(p);
        if (!knownCodes.has(pClean)) {
          const label = catalogCodes.has(pClean)
            ? `${p} (EXISTS in catalog but was excluded from credited/remaining — check track filter)`
            : `${p} (DOES NOT EXIST anywhere in the catalog passed to this evaluator)`;
          if (!phantomPrereqs.has(label)) phantomPrereqs.set(label, []);
          phantomPrereqs.get(label).push(course.courseCode || course.code || course.id || '(no code/id on this course object)');
        }
      });
    });

    if (phantomPrereqs.size > 0) {
      console.warn('=== PHANTOM PREREQUISITES DETECTED ===');
      phantomPrereqs.forEach((requiredBy, label) => {
        console.warn(`Missing: ${label} — required by: ${requiredBy.join(', ')}`);
      });
      const ccEntries = catalog
        .filter((c) => catalogCodeOf(c).startsWith('CC'))
        .map((c) => `courseCode="${c.courseCode}" code="${c.code}" id="${c.id}"`);
      console.warn(
        `=== DIAGNOSTIC CONTEXT === catalog.length received by this evaluator: ${catalog.length}. ` +
        `Raw entries whose normalized code starts with "CC": ${ccEntries.length > 0 ? '\n' + ccEntries.join('\n') : '(none found)'}`
      );
    }
  }

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