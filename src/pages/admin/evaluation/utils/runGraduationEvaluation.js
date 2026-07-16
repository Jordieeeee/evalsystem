export function runGraduationEvaluation(catalog, subjectStatuses) {
  let subjectList = [], deficiencies = [], alerts = [];
  let completed = [], missingSubjects = [];
  let unitsEarned = 0, unitsRemaining = 0, unitsRequired = 0;

  // Track values for GWA Calculation
  let totalGradePoints = 0;
  let totalGradedUnits = 0;

  catalog.forEach(course => {
    const codeClean = (course.courseCode || course.code || '').toUpperCase();
    const info = subjectStatuses[codeClean] || { status: 'Not Taken', grade: '-', source: 'BSU' };
    const unitsValue = parseInt(course.creditUnits || course.units || 3, 10);
    unitsRequired += unitsValue;

    const courseObj = {
      code: codeClean,
      courseCode: codeClean,
      title: course.courseTitle || course.title,
      courseTitle: course.courseTitle || course.title,
      units: unitsValue,
      creditUnits: unitsValue,
      status: info.status,
      grade: info.grade,
      missingPrereqs: [],
      prereqsCleared: true,
      yearLevel: course.yearLevel || course.year,
      semester: course.semester,
      semesterOffered: course.semesterOffered || [course.semester]
    };

    if (['Completed', 'Credited'].includes(info.status)) {
      unitsEarned += unitsValue;
      completed.push(courseObj);

      // Extract numeric grade (e.g., "1.25", "1.75", "2.0")
      const numericGrade = parseFloat(info.grade);
      if (!isNaN(numericGrade) && numericGrade > 0) {
        totalGradePoints += (numericGrade * unitsValue);
        totalGradedUnits += unitsValue;
      }
    } else {
      unitsRemaining += unitsValue;
      missingSubjects.push(courseObj);
      // Add all missing courses to the deficiency report directly
      deficiencies.push(`Missing Course: [${codeClean}] — ${course.courseTitle || course.title} (${unitsValue} Units)`);
    }

    subjectList.push(courseObj);
  });

  // Calculate final GWA
  const finalGwa = totalGradedUnits > 0 ? (totalGradePoints / totalGradedUnits).toFixed(2) : null;

  // Strict enforcement: If any deficiencies exist, block graduation eligibility completely.
  const isEligible = deficiencies.length === 0;
  
  // Determine Latin Honors Eligibility if all course subjects are completed
  let latinHonors = "None";
  if (isEligible && finalGwa) {
    const gwaNum = parseFloat(finalGwa);
    if (gwaNum >= 1.00 && gwaNum <= 1.25) {
      latinHonors = "Summa Cum Laude";
    } else if (gwaNum > 1.25 && gwaNum <= 1.45) {
      latinHonors = "Magna Cum Laude";
    } else if (gwaNum > 1.45 && gwaNum <= 1.75) {
      latinHonors = "Cum Laude";
    }
  }

  const overallEligibility = isEligible ? "ELIGIBLE FOR GRADUATION" : "NOT ELIGIBLE FOR GRADUATION";
  const decisionExplanation = isEligible 
    ? `The student has cleared all curriculum requirements with a GWA of ${finalGwa || 'N/A'}.${latinHonors !== 'None' ? ` Candidate for ${latinHonors}.` : ''}`
    : `Academic Audit Lock: Graduation blocked due to ${deficiencies.length} unfulfilled curriculum checkpoints.`;

  // Calculate completion percentage safely
  const completionPercentage = unitsRequired > 0 ? Math.round((unitsEarned / unitsRequired) * 100) : 0;

  return {
    unitsEarned,
    unitsRemaining,
    unitsRequired,
    subjectList,
    completed,
    missingSubjects,
    deficiencies,
    completionPercentage,
    alerts: deficiencies.length > 0 ? [`Deficiency Warning: ${deficiencies.length} courses require resolution.`] : [],
    overallEligibility,
    decisionExplanation,
    gwa: finalGwa,
    latinHonors, // Passed down to components & print previews
    // --- SAFE FALLBACKS TO PREVENT UI CRASHES ---
    creditedList: [],
    obsoleteList: [],
    recommendedRoadmap: []
  };
}