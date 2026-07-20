// --- CURRICULUM SHIFT EVALUATION (PLAN BRIDGING) PIPELINE ---
// Compares an Old Curriculum transcript, keyed in by the admin, against the New
// Curriculum catalog: auto-matches equivalencies, applies the admin's manual
// transfer decisions, then sequences the remaining courses into a concrete
// semester-by-semester enrollment plan.
//
// The whole pipeline is a pure function of (transcript + overrides), so the
// Transfer Review panel can re-run it on every admin decision to preview results.

import { normalizeSemester, normalizeYear, NON_PASSING_GRADES, MAX_UNITS_CONFIG } from '../../../../services/curriculumConfig';

// Curriculum version boundary: an academic year starting 2025 or earlier is Old.
export const NEW_CURRICULUM_START_YEAR = 2026;

// A standard program runs 4 year levels x 2 regular semesters.
export const NORMAL_PROGRAM_YEARS = 4;

// Safety stop: a plan should never need this many terms. Guards against a
// prerequisite cycle spinning the scheduler forever.
const MAX_PLAN_SLOTS = 20;

const YEAR_LABELS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year', 'Sixth Year', 'Seventh Year'];
const YEAR_ORDER = { 'First Year': 1, 'Second Year': 2, 'Third Year': 3, 'Fourth Year': 4 };
const REGULAR_SEMESTERS = ['1st Semester', '2nd Semester'];

export const TRANSFER_NO_CREDIT = 'NO_CREDIT';

// Course codes are authored inconsistently across catalogs (CS_111 / CS-111 / cs 111).
// Every lookup key passes through here so the registries agree on identity.
export const canonical = (code) => String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const unitsOf = (course) => {
  const units = Number(course?.creditUnits ?? course?.units);
  return Number.isFinite(units) && units > 0 ? units : 0;
};

// --- CATALOG FIELD RESOLUTION ---
// new_subjects and old_subjects key the course code as the DOCUMENT ID; a
// `courseCode` field is optional and only present on docs written through
// subjectService. Always resolve through here rather than reading
// `course.courseCode` directly, which is undefined for doc-ID-keyed records.
// Returns the code as authored (CC_101), never the canonical form (CC101).
export const displayCodeOf = (course) => course?.courseCode || course?.id || '';

// Titles and units always come from the catalog record they belong to — never
// copied from the old course the credit originated from.
const titleOf = (course) => course?.courseTitle || 'Unknown';

const yearLabel = (yearNum) => YEAR_LABELS[yearNum - 1] || `Year ${yearNum}`;

// Universal minimum load. A slot whose own ceiling is lower than this floor
// (4th Year 2nd Sem at 6u, any midyear) is bounded by its ceiling instead —
// see getSlotFloor.
export const REGULAR_LOAD_FLOOR = 15;
export const SUMMER_LOAD_FLOOR = 3;

// Fallback ceilings for year levels the config does not enumerate. A midyear
// term must never inherit the regular-semester default: 21 units in a summer
// term is not a load the program permits.
const DEFAULT_REGULAR_CAP = 21;
const DEFAULT_MIDYEAR_CAP = 6;

// Per-slot unit ceiling, looked up by the slot's own year level and semester.
export function getSlotCap(yearNum, semesterLabel) {
  const sem = normalizeSemester(semesterLabel);
  const isMidyear = sem === 'summer';
  const key = isMidyear ? `y${yearNum}_mid` : `y${yearNum}_s${sem === '2nd' ? '2' : '1'}`;
  return MAX_UNITS_CONFIG.new_curriculum[key] || (isMidyear ? DEFAULT_MIDYEAR_CAP : DEFAULT_REGULAR_CAP);
}

// The minimum load for a slot can never exceed what that slot is allowed to
// hold: a 4th Year 2nd Sem filled to its 6u capstone ceiling is a complete
// semester, not an underloaded one.
export function getSlotFloor(yearNum, semesterLabel) {
  const base = normalizeSemester(semesterLabel) === 'summer' ? SUMMER_LOAD_FLOOR : REGULAR_LOAD_FLOOR;
  return Math.min(base, getSlotCap(yearNum, semesterLabel));
}

// --- RESOLVE THE STUDENT'S ORIGINATING CURRICULUM VERSION ---
export function resolveCurriculumVersion(studentData) {
  const rawYear = String(studentData?.academicYear || studentData?.admissionYear || '');
  const startYear = parseInt(rawYear.match(/\d{4}/)?.[0], 10);

  if (Number.isFinite(startYear)) {
    return {
      version: startYear >= NEW_CURRICULUM_START_YEAR ? 'NEW' : 'OLD',
      startYear,
      source: 'admission record'
    };
  }

  const declared = String(studentData?.curriculum || '').toUpperCase() === 'NEW' ? 'NEW' : 'OLD';
  return { version: declared, startYear: null, source: 'student profile fallback' };
}

// Only passed courses earn credit. 5.00, Inc, Drop and W never count.
export function isPassingGrade(grade) {
  const normalized = String(grade ?? '').toUpperCase().trim();
  if (!normalized) return false;
  if (NON_PASSING_GRADES.includes(normalized)) return false;

  const numeric = parseFloat(normalized);
  return Number.isFinite(numeric) && numeric >= 1.0 && numeric <= 3.0;
}

export function runCurriculumShiftEvaluation({
  newSubjectsCatalog = [],
  oldSubjectsCatalog = [],
  curriculumMappings = {},
  enteredCourses = [],
  studentData = null,
  overrides = { rejectedMatches: [], manualTransfers: {} },
  creditBoundary = { min: 15, max: 21 }
} = {}) {
  const analysisLogs = [];
  const log = (level, message, detail = {}) => analysisLogs.push({ level, message, ...detail });

  const { version: originVersion, startYear, source } = resolveCurriculumVersion(studentData);
  const rejectedMatches = new Set((overrides?.rejectedMatches || []).map(canonical));
  const manualTransfers = overrides?.manualTransfers || {};

  const targetRequirements = newSubjectsCatalog.filter((course) => !course.isArchived);
  const newByCode = new Map(targetRequirements.map((c) => [canonical(displayCodeOf(c)), c]));
  const oldByCode = new Map(oldSubjectsCatalog.map((c) => [canonical(displayCodeOf(c)), c]));
  const mappingByCode = new Map(
    Object.entries(curriculumMappings).map(([key, value]) => [canonical(value?.oldCourseCode || key), value])
  );

  // ================= PHASE 2: AUTO-MATCHING =================
  const credited = new Map(); // canonical new code -> credit detail
  const bridges = new Map();  // canonical new code -> bridge detail
  const unmapped = [];        // old courses with no credit assigned
  const misfiled = [];        // new-curriculum codes the admin should not have entered

  const passedCourses = enteredCourses.filter((c) => isPassingGrade(c.grade));
  const excluded = enteredCourses.filter((c) => !isPassingGrade(c.grade));

  log('info', `Curriculum version resolved: ${originVersion === 'NEW' ? 'New' : 'Old'} Curriculum${startYear ? ` (A.Y. start ${startYear})` : ''} — via ${source}.`);
  log('info', `${enteredCourses.length} transcript entr(ies) submitted: ${passedCourses.length} passed and admitted for mapping, ${excluded.length} excluded as failed or incomplete.`);
  excluded.forEach((c) => log('warn', `${c.courseCode} (grade ${c.grade}): not passed — excluded from credit mapping.`, { oldCode: c.courseCode }));

  const describeOld = (entry) => {
    const code = canonical(entry.courseCode);
    const catalogOld = oldByCode.get(code);
    return {
      oldCode: entry.courseCode,
      canonicalOld: code,
      oldTitle: entry.courseTitle || catalogOld?.courseTitle || 'Unknown Course',
      oldUnits: Number(entry.units) || unitsOf(catalogOld) || 0,
      grade: entry.grade,
      academicYear: entry.academicYear,
      semester: entry.semester
    };
  };

  // Old courses that lost their claim on a requirement (a full credit superseded
  // their bridge). They earn nothing until reassigned, so they must never be
  // dropped silently — every passed course lands in exactly one bucket.
  const displaced = [];

  // A requirement may be claimed by only one old course. Returns { ok, reason }
  // so the caller can route a losing course back for a manual decision.
  const assignCredit = (target, old, kind, note, matchType = 'mapping') => {
    const code = canonical(displayCodeOf(target));
    // New code / title / units are read from the new_subjects record only.
    const newCode = displayCodeOf(target);
    const newTitle = titleOf(target);
    const newUnits = unitsOf(target);

    if (credited.has(code)) {
      const holder = credited.get(code).oldCode;
      log('info', `${old.oldCode} → ${newCode}: requirement already credited via ${holder}. No duplicate units awarded.`, { oldCode: old.oldCode });
      return { ok: false, reason: `${newCode} already credited via ${holder}` };
    }

    // A full credit outranks a bridge, but the displaced course keeps its units
    // in play: it goes back for a manual decision rather than disappearing.
    if (bridges.has(code)) {
      const superseded = bridges.get(code);
      bridges.delete(code);
      displaced.push({ old: superseded, reason: `${newCode} fully credited via ${old.oldCode}` });
      log('info', `${superseded.oldCode} → ${newCode}: bridge superseded by the full credit from ${old.oldCode}. ${superseded.oldCode} returns for a transfer decision.`, { oldCode: superseded.oldCode });
    }

    credited.set(code, { ...old, newCode, newTitle, units: newUnits, source: kind, matchType });
    log('pass', `${old.oldCode} (Old: ${old.oldTitle}, ${old.oldUnits}u) → ${newCode} (New: ${newTitle}, ${newUnits}u): ${note}`, { oldCode: old.oldCode, newCode, units: newUnits });
    return { ok: true };
  };

  const assignBridge = (target, old, kind, reason, matchType = 'mapping') => {
    const code = canonical(displayCodeOf(target));
    const newCode = displayCodeOf(target);
    const newTitle = titleOf(target);
    const newUnits = unitsOf(target);

    if (credited.has(code)) {
      return { ok: false, reason: `${newCode} already credited via ${credited.get(code).oldCode}` };
    }
    // Two old courses cannot both bridge the same requirement.
    if (bridges.has(code)) {
      return { ok: false, reason: `${newCode} already claimed as a bridge by ${bridges.get(code).oldCode}` };
    }

    const shortfallUnits = Math.max(0, newUnits - old.oldUnits);
    const bridgeCourseCode = mappingByCode.get(old.canonicalOld)?.bridgeCourseCode || null;

    bridges.set(code, {
      ...old,
      newCode,
      newTitle,
      units: newUnits,
      covered: old.oldUnits,
      shortfallUnits,
      bridgeCourseCode,
      requirement: bridgeCourseCode ? `Bridge course ${bridgeCourseCode}` : 'Manual admin decision required',
      source: kind,
      matchType,
      reason
    });

    log('bridge', `${old.oldCode} (Old: ${old.oldTitle}, ${old.oldUnits}u) → ${newCode} (New: ${newTitle}, ${newUnits}u): Bridge — ${reason}.`, { oldCode: old.oldCode, newCode });
    return { ok: true };
  };

  // Pass 1: automatic equivalency matching.
  const pendingManual = [];
  passedCourses.forEach((entry) => {
    const old = describeOld(entry);
    if (!old.canonicalOld) return;

    const mapping = mappingByCode.get(old.canonicalOld);

    // The registrar explicitly denied crediting this equivalency. No later tier
    // may override that: a direct code match must not resurrect a denied credit.
    if (mapping && mapping.isCreditable === false) {
      pendingManual.push(old);
      return;
    }

    let target;
    let matchType;

    if (mapping) {
      // --- TIER 1: registry mapping (curriculum_mappings -> new_subjects) ---
      target = newByCode.get(canonical(mapping.newCourseCode));
      matchType = 'mapping';
      if (!target) {
        pendingManual.push(old);
        log('warn', `${old.oldCode} → ${mapping.newCourseCode}: mapping target missing from new_subjects.`, { oldCode: old.oldCode });
        return;
      }
    } else {
      // --- TIER 2: direct code match — the course carried over unchanged ---
      target = newByCode.get(old.canonicalOld);
      matchType = 'direct';

      // --- TIER 3: in neither registry — hand to the admin ---
      if (!target) {
        pendingManual.push(old);
        return;
      }

      // The code is a new-curriculum requirement but absent from old_subjects, so
      // it may be the admin keying a new code by mistake rather than a genuine
      // carry-over. Credit it — the code match is unambiguous — but flag it.
      if (!oldByCode.has(old.canonicalOld)) {
        misfiled.push({ code: old.oldCode, title: old.oldTitle, units: old.oldUnits });
        log('warn', `${old.oldCode}: credited by direct code match, but this code is not in old_subjects. Verify the entry is an Old Curriculum course.`, { oldCode: old.oldCode });
      }
    }

    // The admin rejected this auto-match: the new course returns to Gap and the
    // old course becomes available for manual transfer instead.
    if (rejectedMatches.has(canonical(displayCodeOf(target)))) {
      const rejectedCode = displayCodeOf(target);
      pendingManual.push(old);
      log('warn', `${old.oldCode} → ${rejectedCode}: auto-match rejected by admin. ${rejectedCode} returns to Gap.`, { oldCode: old.oldCode, newCode: rejectedCode });
      return;
    }

    const newUnits = unitsOf(target);
    // No mapping doc on a Tier 2 direct match, so equivalencyType cannot be read
    // unguarded here.
    const isPartial = String(mapping?.equivalencyType || 'full').toLowerCase() === 'partial';

    // A carry-over whose unit value changed between curricula is still a bridge:
    // an identical code does not guarantee identical coverage.
    const outcome = (isPartial || (old.oldUnits > 0 && old.oldUnits < newUnits))
      ? assignBridge(target, old, 'auto', isPartial
        ? 'Registry marks this equivalency as partial coverage'
        : `Unit shortfall: old course is ${old.oldUnits}u against a ${newUnits}u requirement`, matchType)
      : assignCredit(target, old, 'auto',
        matchType === 'direct' ? 'Credited (direct match — carried over unchanged)' : 'Credited', matchType);

    // Lost the claim: offer it to the admin for a manual transfer elsewhere.
    if (!outcome.ok) {
      pendingManual.push(old);
      log('warn', `${old.oldCode}: ${outcome.reason} — available for manual transfer.`, { oldCode: old.oldCode });
    }
  });

  // Courses displaced during auto-matching get a manual decision too.
  displaced.splice(0).forEach(({ old }) => pendingManual.push(old));

  // ================= PHASE 3: MANUAL TRANSFER DECISIONS =================
  // Applied after auto-matching so a rejected match frees its target as a
  // transfer destination.
  pendingManual.forEach((old) => {
    const decision = manualTransfers[old.oldCode] ?? manualTransfers[old.canonicalOld];

    if (!decision || decision === TRANSFER_NO_CREDIT) {
      unmapped.push({
        ...old,
        reason: decision === TRANSFER_NO_CREDIT
          ? 'Admin marked as No Credit'
          : 'No mapping found in curriculum_mappings',
        decided: decision === TRANSFER_NO_CREDIT
      });
      log('warn', decision === TRANSFER_NO_CREDIT
        ? `${old.oldCode}: No mapping, admin marked as No Credit — unmapped.`
        : `${old.oldCode}: No mapping, no manual transfer — unmapped.`, { oldCode: old.oldCode });
      return;
    }

    const target = newByCode.get(canonical(decision));
    if (!target) {
      unmapped.push({ ...old, reason: `Transfer target ${decision} not found in new_subjects` });
      log('warn', `${old.oldCode}: manual transfer target ${decision} not found in new_subjects — unmapped.`, { oldCode: old.oldCode });
      return;
    }

    const newUnits = unitsOf(target);
    const targetCode = displayCodeOf(target);
    const outcome = old.oldUnits >= newUnits
      ? assignCredit(target, old, 'manual', `Manually transferred by admin to ${targetCode}: Credited`)
      : assignBridge(target, old, 'manual', `Manually transferred by admin — unit deficit: ${old.oldUnits}u against a ${newUnits}u requirement`);

    if (!outcome.ok) {
      unmapped.push({ ...old, reason: outcome.reason });
      log('warn', `${old.oldCode}: manual transfer to ${targetCode} rejected — ${outcome.reason}.`, { oldCode: old.oldCode });
    }
  });

  // A manual credit may have displaced an earlier bridge. Those courses earn
  // nothing and are surfaced as unmapped so their units are never lost silently.
  displaced.forEach(({ old, reason }) => {
    if (credited.has(canonical(old.newCode)) && credited.get(canonical(old.newCode)).oldCode === old.oldCode) return;
    unmapped.push({ ...old, reason });
    log('warn', `${old.oldCode}: ${reason} — earns no credit unless transferred elsewhere.`, { oldCode: old.oldCode });
  });

  // ================= GAPS =================
  const describeCourse = (course, status) => {
    const semesters = Array.isArray(course.semesterOffered)
      ? course.semesterOffered.filter(Boolean)
      : [course.semesterOffered || '1st Semester'];

    return {
      // As authored (CC_101), not canonical (CC101): this string is displayed and
      // is the value the manual-transfer dropdown stores.
      code: displayCodeOf(course),
      canonicalCode: canonical(displayCodeOf(course)),
      title: titleOf(course),
      units: unitsOf(course),
      status,
      yearLevel: course.yearLevel || 'First Year',
      semesterOffered: semesters.length > 0 ? semesters : ['1st Semester'],
      prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
      effectiveCurriculum: course.effectiveCurriculum || ''
    };
  };

  const gapCourses = [];
  targetRequirements.forEach((course) => {
    const code = canonical(displayCodeOf(course));
    if (credited.has(code) || bridges.has(code)) return;
    gapCourses.push(describeCourse(course, 'Gap'));
  });

  // ================= PHASE 5: PROGRESS METRICS =================
  const totalRequiredUnits = targetRequirements.reduce((sum, c) => sum + unitsOf(c), 0);
  const unitsEarnedMapped = Array.from(credited.values()).reduce((sum, c) => sum + c.units, 0);
  const unitsDeficientRemaining = Math.max(0, totalRequiredUnits - unitsEarnedMapped);
  const curriculumProgress = totalRequiredUnits > 0 ? (unitsEarnedMapped / totalRequiredUnits) * 100 : 0;

  log('info', `Progress: ${unitsEarnedMapped}u earned mapped of ${totalRequiredUnits}u required (${curriculumProgress.toFixed(1)}%). ${unitsDeficientRemaining}u deficient remaining.`);

  // ================= PHASE 4: SEMESTER-BY-SEMESTER ENROLLMENT PLAN =================
  // Bridge courses are scheduled in full: partial credit does not satisfy the
  // requirement, so the student still sits the new course.
  const bridgeCourses = Array.from(bridges.values());
  const toSchedule = [
    ...gapCourses,
    ...bridgeCourses.map((b) => {
      const src = targetRequirements.find((c) => canonical(displayCodeOf(c)) === canonical(b.newCode));
      return { ...describeCourse(src || {}, 'Bridge'), code: b.newCode, title: b.newTitle, units: b.units };
    })
  ];

  const startYearNum = parseInt(normalizeYear(studentData?.yearLevel), 10) || 1;
  const startSemRaw = normalizeSemester(studentData?.semester);
  const startSem = startSemRaw === '2nd' ? '2nd Semester' : startSemRaw === 'summer' ? 'Summer' : '1st Semester';

  const offeredIn = (course, semesterLabel) =>
    course.semesterOffered.some((s) => normalizeSemester(s) === normalizeSemester(semesterLabel));
  const summerOnly = (course) =>
    course.semesterOffered.every((s) => normalizeSemester(s) === 'summer');

  const satisfied = new Set(credited.keys());
  const semesterPlan = [];
  let pending = [...toSchedule];
  let unschedulable = [];

  let slotYear = startYearNum;
  let slotSem = startSem;
  let slotIndex = 0;

  while (pending.length > 0 && slotIndex < MAX_PLAN_SLOTS) {
    // The ceiling comes from THIS slot's year level and semester, not a global max.
    const cap = getSlotCap(slotYear, slotSem);
    // Snapshot before placing: prerequisite reporting must reflect what was
    // satisfied when the slot was filled, not what this slot went on to satisfy.
    const satisfiedBefore = new Set(satisfied);

    // Hard requirements to enter a slot:
    //  (1) every prerequisite already satisfied — credited, or scheduled earlier in this plan;
    //  (3) semesterOffered CONTAINS this slot's semester (a course offered in both
    //      terms is eligible for either; one offered only in 2nd Sem is never forced
    //      into a 1st Sem slot).
    // Year level is deliberately NOT a filter here — see the sort below.
    const eligible = pending
      .filter((c) => c.prerequisites.every((p) => satisfied.has(canonical(p))))
      .filter((c) => offeredIn(c, slotSem))
      .sort((a, b) => {
        // (2) lowest year level first.
        const yearDelta = (YEAR_ORDER[a.yearLevel] || 1) - (YEAR_ORDER[b.yearLevel] || 1);
        if (yearDelta !== 0) return yearDelta;
        // Then the scarcer offering: a course available only in this term must take
        // its seat now, ahead of one that both terms can accommodate.
        const scarcity = a.semesterOffered.length - b.semesterOffered.length;
        if (scarcity !== 0) return scarcity;
        return b.units - a.units;
      });

    // (4) Fill greedily to the cap. Because year level only orders the queue and
    // never excludes, leftover capacity is taken up by higher year-level courses
    // whose prerequisites are met, rather than left idle.
    const placed = [];
    let slotUnits = 0;
    eligible.forEach((course) => {
      if (slotUnits + course.units > cap) return;
      placed.push(course);
      slotUnits += course.units;
    });

    // --- SLOT DIAGNOSTICS ---
    // Why every course NOT placed in this slot was rejected. Note there is no
    // year-level rejection: year level only orders the queue, it never excludes.
    const placedCodes = new Set(placed.map((c) => canonical(c.code)));
    const skipped = pending
      .filter((c) => !placedCodes.has(canonical(c.code)))
      .map((c) => {
        const missingPrereqs = c.prerequisites.filter((p) => !satisfiedBefore.has(canonical(p)));
        const reason = missingPrereqs.length > 0 ? 'prerequisite'
          : !offeredIn(c, slotSem) ? 'semester'
          : 'capacity';
        return {
          code: c.code, title: c.title, units: c.units, yearLevel: c.yearLevel,
          semesterOffered: c.semesterOffered, prerequisites: c.prerequisites,
          missingPrereqs, reason
        };
      });

    if (placed.length > 0) {
      const scheduledCodes = new Set(placed.map((c) => canonical(c.code)));
      placed.forEach((c) => satisfied.add(canonical(c.code)));
      pending = pending.filter((c) => !scheduledCodes.has(canonical(c.code)));

      const min = getSlotFloor(slotYear, slotSem);
      semesterPlan.push({
        slotIndex,
        yearLevel: yearLabel(slotYear),
        semester: slotSem,
        label: `${yearLabel(slotYear)} — ${slotSem}${slotIndex === 0 ? ' (Current)' : ''}`,
        isCurrent: slotIndex === 0,
        totalUnits: slotUnits,
        maxUnits: cap,
        minUnits: min,
        isOverloaded: slotUnits > cap,
        isUnderloaded: slotUnits < min,
        spareUnits: Math.max(0, cap - slotUnits),
        skipped,
        courses: placed.map((c) => ({
          ...c,
          prereqStatus: c.prerequisites.map((p) => ({ code: p, satisfied: true }))
        }))
      });
    }

    // Nothing left can ever be scheduled: prerequisites are missing from the
    // catalog or form a cycle. Stop rather than spin.
    const anySchedulable = pending.some((c) => c.prerequisites.every((p) => satisfied.has(canonical(p))));
    if (!anySchedulable && pending.length > 0) {
      unschedulable = pending.map((c) => ({
        ...c,
        missingPrereqs: c.prerequisites.filter((p) => !satisfied.has(canonical(p)))
      }));
      break;
    }

    // Advance: 1st -> 2nd -> (Summer only if a summer-only course is waiting) -> next year.
    if (slotSem === '1st Semester') {
      slotSem = '2nd Semester';
    } else if (slotSem === '2nd Semester') {
      const summerPending = pending.some((c) => summerOnly(c) && c.prerequisites.every((p) => satisfied.has(canonical(p))));
      if (summerPending) slotSem = 'Summer';
      else { slotSem = '1st Semester'; slotYear += 1; }
    } else {
      slotSem = '1st Semester';
      slotYear += 1;
    }
    slotIndex += 1;
  }

  if (pending.length > 0 && unschedulable.length === 0) {
    unschedulable = pending.map((c) => ({ ...c, missingPrereqs: c.prerequisites.filter((p) => !satisfied.has(canonical(p))) }));
  }

  semesterPlan.forEach((slot) => {
    log('plan', `${slot.label}: ${slot.courses.length} course(s), ${slot.totalUnits}u of ${slot.maxUnits}u cap — ${slot.courses.map((c) => c.code).join(', ')}.`);

    // When a slot has capacity left, say exactly why it was not filled — this is
    // the difference between "the algorithm under-scheduled" and "nothing else
    // was takeable this term".
    if (slot.spareUnits > 0 && slot.skipped.length > 0) {
      const byReason = slot.skipped.reduce((acc, s) => { (acc[s.reason] = acc[s.reason] || []).push(s); return acc; }, {});
      const parts = [];
      if (byReason.prerequisite) parts.push(`${byReason.prerequisite.length} blocked by prerequisites`);
      if (byReason.semester) parts.push(`${byReason.semester.length} not offered this term`);
      if (byReason.capacity) parts.push(`${byReason.capacity.length} would exceed the ${slot.maxUnits}u cap`);
      log('info', `${slot.label}: ${slot.spareUnits}u spare — ${parts.join(', ')}.`);
      (byReason.prerequisite || []).forEach((s) => {
        log('info', `   ${s.code} (${s.yearLevel}, ${s.units}u, offered ${s.semesterOffered.join('/')}): needs ${s.missingPrereqs.join(', ')}.`);
      });
    }
  });
  unschedulable.forEach((c) => {
    log('warn', `${c.code} cannot be scheduled: prerequisite(s) ${c.missingPrereqs.join(', ') || '—'} unresolved, or not offered in any reachable term.`, { newCode: c.code });
  });

  const lastSlot = semesterPlan[semesterPlan.length - 1];
  const projectedGraduation = lastSlot ? `${lastSlot.yearLevel} — ${lastSlot.semester}` : 'No remaining requirements';
  const estimatedSemesters = semesterPlan.length;

  // Semesters remaining in the normal 4-year program from the current standing.
  const regularSlotsRemaining = Math.max(
    0,
    (NORMAL_PROGRAM_YEARS - startYearNum) * REGULAR_SEMESTERS.length + (startSem === '1st Semester' ? 2 : startSem === '2nd Semester' ? 1 : 0)
  );
  const exceedsNormalDuration = estimatedSemesters > regularSlotsRemaining;

  // ================= PHASE 6: ELIGIBILITY =================
  const overloadedSlots = semesterPlan.filter((s) => s.isOverloaded);
  const underloadedSlots = semesterPlan.filter((s) => s.isUnderloaded);
  const reviewReasons = [];

  if (bridgeCourses.length > 0) reviewReasons.push(`${bridgeCourses.length} bridge course(s) require completion of an additional requirement`);
  if (unmapped.length > 0) reviewReasons.push(`${unmapped.length} unmapped course(s) earn no credit`);
  if (misfiled.length > 0) reviewReasons.push(`${misfiled.length} entr(ies) use New Curriculum codes and need verification`);
  if (unschedulable.length > 0) reviewReasons.push(`${unschedulable.length} course(s) cannot be sequenced`);
  if (exceedsNormalDuration) reviewReasons.push(`plan needs ${estimatedSemesters} semester(s) but only ${regularSlotsRemaining} remain in normal program duration`);
  if (overloadedSlots.length > 0) reviewReasons.push(`${overloadedSlots.length} semester(s) exceed the permitted unit ceiling`);

  const overallEligibility = reviewReasons.length > 0 ? 'REVIEW REQUIRED' : 'ELIGIBLE';
  log(overallEligibility === 'ELIGIBLE' ? 'pass' : 'warn',
    overallEligibility === 'ELIGIBLE'
      ? `Eligibility: ELIGIBLE — all gaps fit within ${estimatedSemesters} of ${regularSlotsRemaining} remaining semester(s) at or below the permitted unit ceiling.`
      : `Eligibility: REVIEW REQUIRED — ${reviewReasons.join('; ')}.`);

  // ================= PHASE 7: TARGET REQUIREMENT CHECKSHEET =================
  const scheduledBySlot = new Map();
  semesterPlan.forEach((slot) => slot.courses.forEach((c) => scheduledBySlot.set(canonical(c.code), slot.label)));

  const subjectList = targetRequirements.map((course) => {
    const code = canonical(displayCodeOf(course));
    const creditEntry = credited.get(code);
    const bridgeEntry = bridges.get(code);
    const scheduledIn = scheduledBySlot.get(code) || null;

    // Credited outranks Bridge; an unsatisfied Gap that made the plan shows as
    // Scheduled so the admin can see it is accounted for.
    const status = creditEntry ? 'Credited'
      : bridgeEntry ? 'Bridge'
      : scheduledIn ? 'Scheduled'
      : 'Gap';

    return {
      ...describeCourse(course, status),
      grade: creditEntry ? 'CR' : '-',
      creditedFrom: creditEntry?.oldCode || bridgeEntry?.oldCode || null,
      creditSource: creditEntry?.source || bridgeEntry?.source || null,
      bridgeRequirement: bridgeEntry?.requirement || null,
      scheduledIn,
      needsReview: Boolean(bridgeEntry)
    };
  });

  const checksheetGroups = [];
  [...YEAR_LABELS].forEach((level) => {
    const yearCourses = subjectList.filter((c) => (c.yearLevel || 'First Year') === level);
    if (yearCourses.length === 0) return;

    const semesterGroups = [];
    ['1st Semester', '2nd Semester', 'Summer'].forEach((sem) => {
      const semCourses = yearCourses.filter((c) => c.semesterOffered.some((s) => normalizeSemester(s) === normalizeSemester(sem)));
      if (semCourses.length > 0) {
        semesterGroups.push({ semester: sem, courses: semCourses, totalUnits: semCourses.reduce((sum, c) => sum + c.units, 0) });
      }
    });

    checksheetGroups.push({ yearLevel: level, semesters: semesterGroups, totalUnits: yearCourses.reduce((sum, c) => sum + c.units, 0) });
  });

  // ================= ALERTS =================
  const alerts = ['Curriculum Plan Version Switch Active: Tracing version shifts and added bridge paths.'];
  if (originVersion === 'NEW') alerts.push('Student already originates from the New Curriculum — plan bridging may not be the applicable evaluation track.');
  if (misfiled.length > 0) alerts.push(`${misfiled.length} transcript entr(ies) use New Curriculum codes (${misfiled.map((m) => m.code).join(', ')}). An Old Curriculum student should not have these on record — verify before finalizing.`);
  if (bridgeCourses.length > 0) alerts.push(`${bridgeCourses.length} bridge course(s) carry partial credit and still require the full new course.`);
  if (unmapped.length > 0) alerts.push(`${unmapped.length} completed course(s) have no equivalency and earn no credit.`);
  if (gapCourses.length > 0) alerts.push(`${gapCourses.length} new curriculum course(s) identified as gaps requiring completion.`);
  if (exceedsNormalDuration) alerts.push(`The plan extends to ${projectedGraduation}, beyond the ${regularSlotsRemaining} semester(s) left in normal program duration.`);
  if (overloadedSlots.length > 0) alerts.push(`${overloadedSlots.length} semester(s) exceed the permitted unit ceiling.`);
  if (underloadedSlots.length > 0) alerts.push(`${underloadedSlots.length} semester(s) fall below the minimum load and may need adjustment.`);
  if (unschedulable.length > 0) alerts.push(`${unschedulable.length} course(s) could not be sequenced — prerequisites are missing from the catalog or form a cycle.`);

  const autoMatched = Array.from(credited.values()).filter((c) => c.source === 'auto');
  const manuallyTransferred = Array.from(credited.values()).filter((c) => c.source === 'manual');

  return {
    originCurriculum: originVersion,
    curriculumStartYear: startYear,
    currentStanding: { yearLevel: yearLabel(startYearNum), semester: startSem, label: `${yearLabel(startYearNum)} — ${startSem}` },

    // The exact transcript this result was computed from, so a finalized snapshot
    // can never disagree with the entries that produced it.
    enteredCourses: enteredCourses.map((c) => ({
      courseCode: c.courseCode, courseTitle: c.courseTitle, grade: c.grade,
      units: Number(c.units) || 0, academicYear: c.academicYear, semester: c.semester,
      counted: isPassingGrade(c.grade)
    })),
    overrides: { rejectedMatches: Array.from(rejectedMatches), manualTransfers: { ...manualTransfers } },

    // Metrics
    unitsEarned: unitsEarnedMapped,
    unitsRemaining: unitsDeficientRemaining,
    totalRequiredUnits,
    totalRequired: targetRequirements.length,
    curriculumProgress: Math.round(curriculumProgress),
    completionPercentage: curriculumProgress.toFixed(1),
    creditBoundary,
    estimatedSemesters,
    regularSlotsRemaining,
    projectedGraduation,
    exceedsNormalDuration,

    // Buckets
    creditedList: Array.from(credited.values()),
    autoMatchedList: autoMatched,
    manualTransferList: manuallyTransferred,
    bridgeCourses,
    gapCourses,
    unmappedList: unmapped,
    misfiledEntries: misfiled,
    excludedEntries: excluded,
    transferableTargets: gapCourses.map((g) => ({ code: g.code, title: g.title, units: g.units })),

    // Stats
    mappingStats: {
      autoMatched: autoMatched.length,
      manuallyTransferred: manuallyTransferred.length,
      bridge: bridgeCourses.length,
      unmapped: unmapped.length,
      totalOldUnitsEntered: enteredCourses.reduce((s, c) => s + (Number(c.units) || 0), 0),
      totalNewUnitsCredited: unitsEarnedMapped
    },

    // Checksheet + plan
    subjectList,
    checksheetGroups,
    semesterPlan,
    unschedulableCourses: unschedulable,
    simulatedLoad: semesterPlan[0]?.totalUnits || 0,

    // Audit
    analysisLogs,
    equivalencyLog: analysisLogs.filter((l) => ['pass', 'bridge', 'warn'].includes(l.level)),
    deficiencies: [
      ...gapCourses.map((g) => `Gap: ${g.code} — ${g.title} (${g.units}u)`),
      ...bridgeCourses.map((b) => `Bridge: ${b.newCode} — ${b.newTitle} (${b.units}u) — ${b.requirement}`)
    ],
    alerts,
    reviewReasons,
    overallEligibility
  };
}
