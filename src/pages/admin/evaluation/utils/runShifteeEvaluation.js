export function runShifteeEvaluation(catalog, subjectStatuses, passedCodes, currentStudentData, newShifteeProgram) {
  let subjectList = [], deficiencies = [], alerts = [];
  let unitsEarned = 0, unitsRemaining = 0;
  let obsoleteList = [];

  alerts.push("Shiftee Core Framework Active: Extracting common cross-credited general education paths.");

  // Pre-process and identify historical subjects not present inside new curriculum program target mapping
  Object.keys(subjectStatuses).forEach(code => {
    const existsInNewCatalog = catalog.some(c => (c.courseCode || c.code || '').toUpperCase() === code);
    if (!existsInNewCatalog && ['Completed', 'Credited'].includes(subjectStatuses[code].status)) {
      obsoleteList.push({
        code,
        title: 'Previous Program Specialization Requirement',
        reason: 'Not Mapped to New Selected Degree Curriculum'
      });
    }
  });

  catalog.forEach(course => {
    const codeClean = (course.courseCode || course.code || '').toUpperCase();
    const info = subjectStatuses[codeClean] || { status: 'Not Taken', grade: '-', source: 'BSU' };
    const unitsValue = parseInt(course.creditUnits || course.units || 3, 10);

    const isGeneralEducation = codeClean.startsWith("GE") || codeClean.startsWith("NSTP") || codeClean.startsWith("PATHFIT");

    if (['Completed', 'Credited'].includes(info.status)) {
      unitsEarned += unitsValue;
    } else {
      unitsRemaining += unitsValue;
      if (!isGeneralEducation) {
        deficiencies.push(`New Track Specific Deficiency: Missing required discipline course [${codeClean}]`);
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
    obsoleteList,
    deficiencies,
    alerts,
    overallEligibility: deficiencies.length > 3 ? "Requires Registrar Review" : "Curriculum Transition Complete",
    // --- SAFE FALLBACKS TO PREVENT UI CRASHES ---
    creditedList: [],
    recommendedRoadmap: []
  };
}