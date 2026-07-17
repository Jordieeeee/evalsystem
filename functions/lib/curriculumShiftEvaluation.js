"use strict";
/**
 * CURRICULUM SHIFT EVALUATION (PLAN BRIDGING) — Cloud Function v2 callable.
 *
 * Decides how many units a shiftee student is credited when moving from the old
 * curriculum to the new one. Deterministic: pure function of (transcript, Firestore
 * state). No randomness, no external calls, no LLM in this path.
 *
 * Firestore is NoSQL, so the old->new equivalency "join" is performed in memory:
 * we read each collection exactly once and build a Map keyed by old code. This is
 * the app-layer replacement for a SQL JOIN, and it is why read count stays at 3
 * regardless of transcript length.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.curriculumShiftEvaluation = exports.termKey = void 0;
exports.classify = classify;
exports.evaluate = evaluate;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
if ((0, app_1.getApps)().length === 0)
    (0, app_1.initializeApp)();
// ============================================================================
// GRADE SCALE — Philippine scale. LOWER IS BETTER. 1.00 is the BEST grade.
// ============================================================================
// This is inverted relative to a 0-100 or 4.0-GPA scale, and inverting it here
// would silently credit failures and reject honor students. Do not "fix" the
// comparison direction: 1.00 <= g <= 3.00 PASSES, 5.00 FAILS.
const BEST_PASSING_GRADE = 1.0;
const LOWEST_PASSING_GRADE = 3.0;
const INC_GRADE = 4.0;
const FAILING_GRADE = 5.0;
/**
 * Grades arrive from an admin-keyed form and may be strings ("1.75") or numbers.
 * Coerce once, then classify. Anything not on the scale is INVALID — never
 * assumed passing, but reported separately so the registrar can correct it
 * rather than have it disappear into the failed bucket.
 */
function classify(grade) {
    if (grade === null || grade === undefined || grade === "")
        return "INVALID";
    if (typeof grade === "boolean")
        return "INVALID";
    const n = Number(grade);
    if (Number.isNaN(n) || !Number.isFinite(n))
        return "INVALID";
    if (n >= BEST_PASSING_GRADE && n <= LOWEST_PASSING_GRADE)
        return "PASSED";
    if (n === INC_GRADE)
        return "INC";
    if (n === FAILING_GRADE)
        return "FAILED";
    // On-scale-but-unrecognized (0.5, 3.5, 6.0, negative). Not creditable, and
    // not a clean fail either — surface it rather than guessing.
    return "INVALID";
}
// ============================================================================
// NORMALIZERS
// ============================================================================
/**
 * Course codes are authored inconsistently across catalogs (CS_111 / CS-111 /
 * cs 111). Every lookup key passes through here so the two registries agree on
 * identity. Mirrors `canonical()` in the existing client pipeline.
 */
const canonical = (code) => String(code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
/** "First Year" | "1st Year" | 1 | "1" -> 1. Returns null if unreadable. */
function normalizeYearLevel(raw) {
    if (typeof raw === "number" && Number.isFinite(raw))
        return Math.trunc(raw);
    const s = String(raw ?? "").toLowerCase().trim();
    if (!s)
        return null;
    if (s.includes("first") || s.includes("1"))
        return 1;
    if (s.includes("second") || s.includes("2"))
        return 2;
    if (s.includes("third") || s.includes("3"))
        return 3;
    if (s.includes("fourth") || s.includes("4"))
        return 4;
    if (s.includes("fifth") || s.includes("5"))
        return 5;
    const digits = s.replace(/\D/g, "");
    return digits ? Number(digits) : null;
}
/**
 * Canonical semester labels, matching the config keys exactly:
 * "1st Semester" | "2nd Semester" | "Midyear". Returns null if unreadable.
 */
function normalizeSemester(raw) {
    const s = String(raw ?? "").toLowerCase().trim();
    if (!s)
        return null;
    if (s.includes("1st") || s.includes("first"))
        return "1st Semester";
    if (s.includes("2nd") || s.includes("second"))
        return "2nd Semester";
    if (s.includes("summer") || s.includes("mid"))
        return "Midyear";
    return null;
}
/** Term key exactly as authored in config/unit_targets: `Y${year}-${semester}`. */
const termKey = (yearLevel, semester) => `Y${yearLevel}-${semester}`;
exports.termKey = termKey;
/**
 * Chronological rank of a term, for the "at or after assigned standing" filter.
 * Midyear follows 2nd Semester in the Philippine academic calendar.
 */
const SEMESTER_ORDER = {
    "1st Semester": 0,
    "2nd Semester": 1,
    Midyear: 2,
};
const termRank = (yearLevel, semester) => yearLevel * 10 + (SEMESTER_ORDER[semester] ?? 0);
// ============================================================================
// FIELD ADAPTERS
// ============================================================================
// The spec for this function names fields new_code/new_title/new_units/
// year_level/semester. The live collections written by subjectService.js use
// courseCode/courseTitle/creditUnits/yearLevel/semesterOffered. Both shapes are
// accepted here, spec-shape first.
//
// A doc matching NEITHER shape is REJECTED into warnings, never coerced. A
// missing units field would otherwise become Number(undefined) = NaN and credit
// a real student zero units while reporting success.
function readNewSubject(docId, d) {
    const code = d.new_code ?? d.courseCode ?? docId;
    const title = d.new_title ?? d.courseTitle;
    const rawUnits = d.new_units ?? d.creditUnits;
    const year = normalizeYearLevel(d.year_level ?? d.yearLevel);
    // semesterOffered is an array in the live schema; the spec assumes one string.
    const rawSem = d.semester ?? d.semesterOffered;
    const semCandidate = Array.isArray(rawSem) ? rawSem[0] : rawSem;
    const semester = normalizeSemester(semCandidate);
    const units = Number(rawUnits);
    if (!canonical(code))
        return `new_subjects/${docId}: unreadable course code — excluded from requirements.`;
    if (rawUnits === undefined || rawUnits === null || Number.isNaN(units)) {
        return `new_subjects/${docId}: missing or non-numeric units (expected new_units or creditUnits) — excluded from requirements so it cannot be credited or planned at 0 units.`;
    }
    if (year === null)
        return `new_subjects/${docId}: unreadable year level — excluded from requirements.`;
    if (semester === null)
        return `new_subjects/${docId}: unreadable semester — excluded from requirements.`;
    return {
        new_code: String(code),
        new_title: String(title ?? "Untitled"),
        new_units: units,
        year_level: year,
        semester,
        docId,
    };
}
function readMapping(docId, d) {
    const oldCode = d.old_code ?? d.oldCourseCode ?? docId;
    const newCode = d.new_code ?? d.newCourseCode;
    if (!canonical(oldCode))
        return `curriculum_mappings/${docId}: unreadable old_code — mapping ignored.`;
    if (!canonical(newCode))
        return `curriculum_mappings/${docId}: unreadable new_code — mapping ignored.`;
    // new_title/new_units may be absent (the live mapping docs carry only codes).
    // That is fine: title and units are authoritative from new_subjects anyway.
    const rawUnits = d.new_units;
    const units = rawUnits === undefined || rawUnits === null ? null : Number(rawUnits);
    return {
        old_code: String(oldCode),
        new_code: String(newCode),
        new_title: d.new_title === undefined ? null : String(d.new_title),
        new_units: units !== null && !Number.isNaN(units) ? units : null,
        docId,
    };
}
// ============================================================================
// INPUT VALIDATION
// ============================================================================
function validateInput(data) {
    if (typeof data !== "object" || data === null) {
        throw new https_1.HttpsError("invalid-argument", "Request body must be an object.");
    }
    const d = data;
    if (typeof d.studentId !== "string" || d.studentId.trim() === "") {
        throw new https_1.HttpsError("invalid-argument", "studentId is required and must be a non-empty string.");
    }
    const standing = d.assignedStanding;
    if (typeof standing !== "object" || standing === null) {
        throw new https_1.HttpsError("invalid-argument", "assignedStanding is required and must be an object.");
    }
    const year = Number(standing.year_level);
    if (!Number.isFinite(year) || year < 1) {
        throw new https_1.HttpsError("invalid-argument", "assignedStanding.year_level must be a positive number.");
    }
    const sem = normalizeSemester(standing.semester);
    if (sem === null) {
        throw new https_1.HttpsError("invalid-argument", `assignedStanding.semester is unreadable. Expected "1st Semester", "2nd Semester" or "Midyear".`);
    }
    if (!Array.isArray(d.transcript)) {
        throw new https_1.HttpsError("invalid-argument", "transcript must be an array.");
    }
    const transcript = d.transcript.map((row, i) => {
        if (typeof row !== "object" || row === null) {
            throw new https_1.HttpsError("invalid-argument", `transcript[${i}] must be an object.`);
        }
        const r = row;
        if (typeof r.old_code !== "string" || r.old_code.trim() === "") {
            throw new https_1.HttpsError("invalid-argument", `transcript[${i}].old_code is required and must be a non-empty string.`);
        }
        // grade is deliberately NOT type-checked here: classify() owns that, and an
        // unreadable grade must be reported as INVALID, not rejected as a 400.
        return {
            old_code: r.old_code,
            old_title: typeof r.old_title === "string" ? r.old_title : "Unknown Course",
            grade: r.grade,
            units: Number(r.units) || 0,
            ay_taken: typeof r.ay_taken === "string" ? r.ay_taken : "",
            semester_taken: typeof r.semester_taken === "string" ? r.semester_taken : "",
        };
    });
    return {
        studentId: d.studentId,
        assignedStanding: { year_level: Math.trunc(year), semester: sem },
        transcript,
    };
}
// ============================================================================
// RECONCILIATION
// ============================================================================
/**
 * The new curriculum's total units should agree with the sum of the per-term
 * unit targets. A mismatch means the catalog and the config have drifted — the
 * evaluation still runs (the catalog is the source of truth for crediting), but
 * every plan variance below is measured against a config we know is suspect.
 */
function reconcile(subjects, targets) {
    const warnings = [];
    const catalogTotal = subjects.reduce((sum, s) => sum + s.new_units, 0);
    const targetTotal = Object.values(targets).reduce((sum, v) => sum + (Number.isFinite(Number(v)) ? Number(v) : 0), 0);
    if (catalogTotal !== targetTotal) {
        warnings.push(`RECONCILIATION MISMATCH: config/unit_targets totals ${targetTotal} units across ${Object.keys(targets).length} terms, but new_subjects totals ${catalogTotal} units across ${subjects.length} courses ` +
            `(difference: ${catalogTotal - targetTotal}). Crediting used new_subjects as the source of truth; ` +
            `per-term variances below are measured against targets that do not sum to the catalog.`);
    }
    return warnings;
}
async function readAll() {
    const db = (0, firestore_1.getFirestore)();
    try {
        // One read per collection, issued in parallel. The in-memory join below is
        // what removes any need for per-transcript-row queries.
        const [mappingsSnap, subjectsSnap, targetsSnap] = await Promise.all([
            db.collection("curriculum_mappings").get(),
            db.collection("new_subjects").get(),
            db.collection("config").doc("unit_targets").get(),
        ]);
        return {
            mappingDocs: mappingsSnap.docs.map((d) => ({ id: d.id, data: d.data() })),
            subjectDocs: subjectsSnap.docs.map((d) => ({ id: d.id, data: d.data() })),
            targets: targetsSnap.exists ? (targetsSnap.data() ?? {}) : {},
        };
    }
    catch (err) {
        // Never leak Firestore internals to a registrar clerk's browser.
        console.error("curriculumShiftEvaluation: Firestore read failed", err);
        throw new https_1.HttpsError("internal", "Could not read curriculum data. Please retry; if this persists, contact the registrar system administrator.");
    }
}
// ============================================================================
// CORE EVALUATION — pure, given raw data + input. Exported for unit testing.
// ============================================================================
function evaluate(input, raw) {
    const warnings = [];
    // --- Normalize the catalog. Rejected docs are surfaced, never silently zeroed.
    const newSubjects = [];
    for (const { id, data } of raw.subjectDocs) {
        const result = readNewSubject(id, data);
        if (typeof result === "string")
            warnings.push(result);
        else if (data.isArchived !== true)
            newSubjects.push(result); // archived courses are not requirements
    }
    const mappings = [];
    for (const { id, data } of raw.mappingDocs) {
        const result = readMapping(id, data);
        if (typeof result === "string")
            warnings.push(result);
        else
            mappings.push(result);
    }
    if (Object.keys(raw.targets).length === 0) {
        warnings.push("config/unit_targets is missing or empty. Per-term targets and variances are reported as null; the plan itself is unaffected.");
    }
    // --- THE JOIN, IN MEMORY ---------------------------------------------------
    // Firestore cannot join curriculum_mappings to new_subjects, so we build the
    // lookup here: old_code -> mapping, and new_code -> requirement. Both keyed by
    // canonical() so CS_111 and CS-111 resolve to the same course. O(1) per row.
    const mappingByOldCode = new Map();
    for (const m of mappings) {
        const key = canonical(m.old_code);
        if (mappingByOldCode.has(key)) {
            warnings.push(`curriculum_mappings: duplicate equivalency for old code ${m.old_code} ` +
                `(docs ${mappingByOldCode.get(key).docId} and ${m.docId}). First was kept; verify the registry.`);
            continue;
        }
        mappingByOldCode.set(key, m);
    }
    const subjectByNewCode = new Map();
    for (const s of newSubjects) {
        const key = canonical(s.new_code);
        if (subjectByNewCode.has(key)) {
            warnings.push(`new_subjects: duplicate course code ${s.new_code} (docs ${subjectByNewCode.get(key).docId} and ${s.docId}). First was kept.`);
            continue;
        }
        subjectByNewCode.set(key, s);
    }
    // --- RECONCILIATION (before any crediting) ---------------------------------
    warnings.push(...reconcile(newSubjects, raw.targets));
    // --- CLASSIFY + BUCKET -----------------------------------------------------
    const credited = [];
    const unmapped = [];
    const incomplete = [];
    const excluded = [];
    // new_code -> the credit that satisfied it. A requirement can be satisfied once.
    const satisfiedByCredit = new Map();
    // new_code -> an unresolved INC that would satisfy it once the grade completes.
    const incBlockedNewCodes = new Set();
    let totalPassed = 0;
    for (const row of input.transcript) {
        const cls = classify(row.grade);
        const base = {
            old_code: row.old_code,
            old_title: row.old_title,
            old_units: row.units,
            ay_taken: row.ay_taken,
            semester_taken: row.semester_taken,
        };
        const oldKey = canonical(row.old_code);
        const mapping = mappingByOldCode.get(oldKey);
        if (cls === "FAILED") {
            excluded.push({ ...base, grade: row.grade, classification: "FAILED", reason: "Grade 5.00 — failed; not creditable." });
            continue;
        }
        if (cls === "INVALID") {
            excluded.push({
                ...base,
                grade: row.grade,
                classification: "INVALID",
                reason: `Grade "${String(row.grade)}" is not a value on the 1.00-5.00 scale. Not creditable — verify the transcript entry.`,
            });
            continue;
        }
        if (cls === "INC") {
            // An INC is NOT a fail and NOT a credit. The requirement is currently unmet
            // but may be satisfied when the grade is completed, so the registrar must
            // see which future requirement is hanging on it.
            const target = mapping ? subjectByNewCode.get(canonical(mapping.new_code)) : undefined;
            if (target)
                incBlockedNewCodes.add(canonical(target.new_code));
            if (mapping && !target) {
                warnings.push(`INC course ${row.old_code} maps to ${mapping.new_code} (curriculum_mappings/${mapping.docId}), but that code is not in new_subjects. Cannot flag the affected term.`);
            }
            incomplete.push({
                ...base,
                grade: Number(row.grade),
                wouldSatisfy: target
                    ? { new_code: target.new_code, new_title: target.new_title, new_units: target.new_units }
                    : null,
            });
            continue;
        }
        // --- PASSED: eligible for credit ---
        totalPassed += 1;
        const grade = Number(row.grade);
        if (!mapping) {
            // No equivalency on record. NEVER auto-credit: a human decides.
            unmapped.push({ ...base, grade, reason: "No equivalency found in curriculum_mappings — awaiting manual transfer decision." });
            continue;
        }
        const target = subjectByNewCode.get(canonical(mapping.new_code));
        if (!target) {
            unmapped.push({
                ...base,
                grade,
                reason: `Mapping target ${mapping.new_code} (curriculum_mappings/${mapping.docId}) is not present in new_subjects — awaiting manual transfer decision.`,
            });
            continue;
        }
        const targetKey = canonical(target.new_code);
        const holder = satisfiedByCredit.get(targetKey);
        if (holder) {
            // One requirement, one credit. The loser is not dropped: it goes back for a
            // manual decision so its units are never lost silently.
            unmapped.push({
                ...base,
                grade,
                reason: `${target.new_code} was already credited via ${holder.old_code}. No duplicate units awarded — available for manual transfer elsewhere.`,
            });
            continue;
        }
        // Title and units are read from the new_subjects record only — never copied
        // from the old course or the mapping doc, which may be stale.
        if (mapping.new_units !== null && mapping.new_units !== target.new_units) {
            warnings.push(`curriculum_mappings/${mapping.docId} states ${mapping.new_units} units for ${target.new_code}, but new_subjects/${target.docId} states ${target.new_units}. Credited ${target.new_units} (catalog is source of truth).`);
        }
        const credit = {
            ...base,
            grade,
            new_code: target.new_code,
            new_title: target.new_title,
            new_units: target.new_units,
            source: { mappingDocId: mapping.docId, newSubjectDocId: target.docId },
        };
        credited.push(credit);
        satisfiedByCredit.set(targetKey, credit);
    }
    // --- REMAINING REQUIREMENTS ------------------------------------------------
    // Everything in the catalog not satisfied by a credit. INC courses do NOT
    // remove a requirement: the grade is unresolved, so the course is still owed.
    const remaining = newSubjects.filter((s) => !satisfiedByCredit.has(canonical(s.new_code)));
    const unitsCredited = credited.reduce((sum, c) => sum + c.new_units, 0);
    const unitsRemaining = remaining.reduce((sum, s) => sum + s.new_units, 0);
    // --- FILTER TO TERMS AT OR AFTER THE ASSIGNED STANDING ---------------------
    const standingRank = termRank(input.assignedStanding.year_level, input.assignedStanding.semester);
    const plannable = remaining.filter((s) => termRank(s.year_level, s.semester) >= standingRank);
    // A remaining requirement sitting BEHIND the assigned standing is real debt the
    // plan cannot show. Silently dropping it is how a student graduates short, so
    // it is surfaced explicitly.
    const backlog = remaining.filter((s) => termRank(s.year_level, s.semester) < standingRank);
    if (backlog.length > 0) {
        const backlogUnits = backlog.reduce((sum, s) => sum + s.new_units, 0);
        warnings.push(`${backlog.length} uncredited requirement(s) totalling ${backlogUnits} units fall in terms BEFORE the assigned standing ` +
            `(${(0, exports.termKey)(input.assignedStanding.year_level, input.assignedStanding.semester)}) and are therefore not scheduled in the plan: ` +
            `${backlog.map((s) => `${s.new_code} (${(0, exports.termKey)(s.year_level, s.semester)}, ${s.new_units}u)`).join(", ")}. ` +
            `They remain counted in summary.unitsRemaining. Either the standing is too advanced or these need a back-subject decision.`);
    }
    // --- GROUP BY TERM ---------------------------------------------------------
    const byTerm = new Map();
    for (const s of plannable) {
        const key = (0, exports.termKey)(s.year_level, s.semester);
        const course = {
            new_code: s.new_code,
            new_title: s.new_title,
            new_units: s.new_units,
            year_level: s.year_level,
            semester: s.semester,
            incBlocked: incBlockedNewCodes.has(canonical(s.new_code)),
            newSubjectDocId: s.docId,
        };
        const list = byTerm.get(key);
        if (list)
            list.push(course);
        else
            byTerm.set(key, [course]);
    }
    const plan = Array.from(byTerm.entries())
        .map(([term, courses]) => {
        const plannedUnits = courses.reduce((sum, c) => sum + c.new_units, 0);
        const rawTarget = raw.targets[term];
        const target = Number.isFinite(Number(rawTarget)) ? Number(rawTarget) : null;
        if (target === null && Object.keys(raw.targets).length > 0) {
            warnings.push(`config/unit_targets has no entry for "${term}". Target and variance for that term are reported as null.`);
        }
        // Targets are for COMPARISON ONLY. The course list is never trimmed or
        // padded to hit one — variance is reported honestly, even when negative.
        return {
            term,
            targetUnits: target,
            plannedUnits,
            variance: target === null ? null : plannedUnits - target,
            hasIncBlockedCourse: courses.some((c) => c.incBlocked),
            courses: courses.sort((a, b) => a.new_code.localeCompare(b.new_code)),
        };
    })
        .sort((a, b) => {
        const ca = a.courses[0];
        const cb = b.courses[0];
        return termRank(ca.year_level, ca.semester) - termRank(cb.year_level, cb.semester);
    });
    // An INC whose requirement sits behind the standing (or is already credited by
    // another course) will not appear on any term — say so rather than let the flag
    // quietly not show up.
    const flaggedNewCodes = new Set(plan.flatMap((t) => t.courses.filter((c) => c.incBlocked).map((c) => canonical(c.new_code))));
    for (const code of incBlockedNewCodes) {
        if (!flaggedNewCodes.has(code)) {
            const subject = subjectByNewCode.get(code);
            warnings.push(`An unresolved INC would satisfy ${subject?.new_code ?? code}, but that requirement is not in the plan (already credited, or in a term before the assigned standing). No term is flagged for it.`);
        }
    }
    return {
        studentId: input.studentId,
        summary: {
            totalSubmitted: input.transcript.length,
            totalPassed,
            totalCredited: credited.length,
            totalUnmapped: unmapped.length,
            totalIncomplete: incomplete.length,
            totalExcluded: excluded.length,
            unitsCredited,
            unitsRemaining,
        },
        credited,
        unmapped,
        incomplete,
        excluded,
        plan,
        warnings,
    };
}
// ============================================================================
// CALLABLE EXPORT
// ============================================================================
exports.curriculumShiftEvaluation = (0, https_1.onCall)({ region: "asia-southeast1", memory: "256MiB", timeoutSeconds: 60 }, async (request) => {
    // This decides a real student's credited units — it is not a public endpoint.
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be signed in to run a curriculum shift evaluation.");
    }
    const input = validateInput(request.data);
    const raw = await readAll();
    return evaluate(input, raw);
});
//# sourceMappingURL=curriculumShiftEvaluation.js.map