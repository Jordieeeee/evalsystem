export function runCurriculumShiftEvaluation(catalog, subjectStatuses) {
  let subjectList = [], deficiencies = [], alerts = [];
  let unitsEarned = 0, unitsRemaining = 0;

  alerts.push("Curriculum Plan Version Switch Active: Tracing version shifts and added bridge paths.");

  catalog.forEach(course => {
    const codeClean = (course.courseCode || course.code || '').toUpperCase();
    const info = subjectStatuses[codeClean] || { status: 'Not Taken', grade: '-', source: 'BSU' };
    const unitsValue = parseInt(course.creditUnits || course.units || 3, 10);

    if (['Completed', 'Credited'].includes(info.status)) {
      unitsEarned += unitsValue;
    } else {
      unitsRemaining += unitsValue;
      // Identify potentially new framework items added to newer catalog structures
      if (course.effectiveCurriculum === '2026-2027' || course.yearLevel === 'First Year') {
        deficiencies.push(`New Curriculum Version Requirement: [${codeClean}] requires bridging verification.`);
      }
    }

    subjectList.push({
      code: codeClean,
      title: course.courseTitle || course.title,
      units: unitsValue,
      status: info.status,
      grade: info.grade,
      missingPrereqs: [],
      prereqsCleared: true
    });
  });

  return {
    unitsEarned,
    unitsRemaining,
    subjectList,
    deficiencies,
    alerts,
    overallEligibility: deficiencies.length > 0 ? "CONDITIONALLY ELIGIBLE" : "ELIGIBLE"
  };
}