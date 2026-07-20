export function runShifteeEvaluation(catalog, subjectStatuses, passedCodes, currentStudentData, newShifteeProgram) {
  let subjectList = [], deficiencies = [], alerts = [];
  let unitsEarned = 0, unitsRemaining = 0;
  let obsoleteList = [], creditedList = [], missingSubjects = [];

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

 const courseObj = {
      code: codeClean,
      originalSubject: codeClean,
      title: course.courseTitle || course.title,
      units: unitsValue,
      status: info.status,
      grade: info.grade,
      missingPrereqs: [],
      prereqsCleared: true
    };

    if (['Completed', 'Credited'].includes(info.status)) {
      unitsEarned += unitsValue;
      if (info.status === 'Credited') creditedList.push(courseObj);
    } else {
      unitsRemaining += unitsValue;
      missingSubjects.push(courseObj);
      // Only genuinely blocked subjects (failed, or an active prerequisite
      // lock) belong in "deficiencies" — a subject simply not yet reached
      // in the normal course sequence is NOT a deficiency, it's just
      // upcoming coursework and belongs in the roadmap instead.
      if (info.status === 'Failed') {
        deficiencies.push(`Failed Subject: [${codeClean}] ${course.courseTitle || course.title} — requires retake.`);
      }
    }

    subjectList.push(courseObj);
  });

  const totalRequired = unitsEarned + unitsRemaining;

return {
    unitsEarned,
    unitsRemaining,
    totalRequired,
    subjectList,
    obsoleteList,
    missingSubjects,
    deficiencies,
    alerts,
    overallEligibility: deficiencies.length > 3 ? "Requires Registrar Review" : "Curriculum Transition Complete",
    creditedList,
    // recommendedRoadmap is deliberately left empty here — the index file's
    // central dispatcher builds shiftee's roadmap itself (grouped by catalog
    // year/semester, same as returning & regular) and overrides this field.
    recommendedRoadmap: []
  };
}