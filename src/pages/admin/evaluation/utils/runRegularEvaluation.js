/**
 * Core Evaluation Processor for Regular Tracks
 * Location: src/pages/admin/evaluation/utils/runRegularEvaluation.js
 */

function getCode(c) {
  return (c.courseCode || c.code || c.id || '').toUpperCase();
}
function getTitle(c) {
  return c.courseTitle || c.title || c.id;
}
function getUnits(c) {
  return parseInt(c.creditUnits || c.units || 3, 10);
}

export function runRegularEvaluation(catalog, subjectStatuses, passedCodes = []) {
  let deficiencies = [];
  let alerts = [];
  let unitsEarned = 0;
  let unitsRemaining = 0;

  alerts.push("Regular Evaluation Track Active: Standard semester-by-semester progression check.");

  const subjectList = (catalog || []).map((course) => {
    const codeClean = getCode(course);
    const info = subjectStatuses[codeClean] || { status: 'Not Taken', grade: '-', source: 'BSU' };
    const unitsValue = getUnits(course);

    if (['Completed', 'Credited'].includes(info.status)) {
      unitsEarned += unitsValue;
    } else {
      unitsRemaining += unitsValue;
      if (info.status === 'Failed') {
        deficiencies.push(`Failed Subject: [${codeClean}] ${getTitle(course)} — requires retake.`);
      }
    }

    return {
      code: codeClean,
      title: getTitle(course),
      units: unitsValue,
      status: info.status,
      grade: info.grade,
      missingPrereqs: [],
      prereqsCleared: true,
    };
  });

  const totalRequired = unitsEarned + unitsRemaining;
  const completionPercentage = totalRequired > 0 ? Math.round((unitsEarned / totalRequired) * 100) : 0;

  // "Eligible to advance" means: no failed subjects and no other deficiencies
  // blocking progression to the next semester/term.
  const isEligibleToAdvance = deficiencies.length === 0;

  if (deficiencies.length > 0) {
    alerts.push(`Academic Hold: ${deficiencies.length} deficiency(ies) found — student is NOT eligible to advance to the next term.`);
  }

  return {
    unitsEarned,
    unitsRemaining,
    totalRequired,
    completionPercentage,
    subjectList,
    deficiencies,
    alerts,
    isEligibleToAdvance,
    overallEligibility: isEligibleToAdvance ? "ELIGIBLE TO ADVANCE" : "NOT ELIGIBLE TO ADVANCE",
    recommendedRoadmap: [],
  };
}