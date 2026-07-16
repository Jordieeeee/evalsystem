export function runRegularEvaluation(catalog, subjectStatuses, passedCodes) {
  let subjectList = [], deficiencies = [], alerts = [];
  let unitsEarned = 0, unitsRemaining = 0;

  catalog.forEach(course => {
    const codeClean = (course.courseCode || course.code || '').toUpperCase();
    const info = subjectStatuses[codeClean] || { status: 'Not Taken', grade: '-', source: 'BSU' };
    const unitsValue = parseInt(course.creditUnits || course.units || 3, 10);

    if (['Completed', 'Credited'].includes(info.status)) {
      unitsEarned += unitsValue;
    } else {
      unitsRemaining += unitsValue;
    }

    // Step-by-step Prerequisite & Co-requisite Validation
    let missingDeps = [];
    const reqs = course.prerequisites || [];
    reqs.forEach(p => {
      if (p && p !== '-') {
        const pInfo = subjectStatuses[p.toUpperCase()];
        if (!pInfo || !['Completed', 'Credited'].includes(pInfo.status)) {
          missingDeps.push(p.toUpperCase());
        }
      }
    });

    if (info.status === 'Failed') {
      deficiencies.push(`Regular Alert: Student has an active failed status on [${codeClean}]`);
    }
    if (missingDeps.length > 0 && !['Completed', 'Credited'].includes(info.status)) {
      deficiencies.push(`Prerequisite Unmet for ${codeClean}: Requires completed [${missingDeps.join(', ')}]`);
    }

    subjectList.push({
      code: codeClean,
      title: course.courseTitle || course.title,
      units: unitsValue,
      status: info.status,
      grade: info.grade,
      missingPrereqs: missingDeps,
      prereqsCleared: missingDeps.length === 0
    });
  });

  let overallEligibility = deficiencies.length > 0 ? (deficiencies.length > 3 ? "NOT ELIGIBLE" : "CONDITIONALLY ELIGIBLE") : "ELIGIBLE";
  
  return { 
    subjectList, 
    unitsEarned, 
    unitsRemaining, 
    deficiencies, 
    alerts, 
    overallEligibility,
    // --- SAFE FALLBACKS TO PREVENT UI CRASHES ---
    creditedList: [],
    obsoleteList: [],
    recommendedRoadmap: []
  };
}