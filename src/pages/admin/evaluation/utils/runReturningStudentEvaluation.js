export function runReturningStudentEvaluation(catalog, subjectStatuses) {
  let subjectList = [], deficiencies = [], alerts = [];
  let unitsEarned = 0, unitsRemaining = 0;

  alerts.push("LOA Returnee Resume Profile Strategy: Recalculating remaining sequences from last active semester record.");

  catalog.forEach(course => {
    const codeClean = (course.courseCode || course.code || '').toUpperCase();
    const info = subjectStatuses[codeClean] || { status: 'Not Taken', grade: '-', source: 'BSU' };
    const unitsValue = parseInt(course.creditUnits || course.units || 3, 10);

    if (['Completed', 'Credited'].includes(info.status)) {
      unitsEarned += unitsValue;
    } else {
      unitsRemaining += unitsValue;
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
    overallEligibility: "ELIGIBLE"
  };
}