import { normalizeSemester } from '../../../../services/curriculumConfig';

// System Equivalency Maps (Fallback Rule Database)
const systemEquivalencyRules = {
  "MATH 101": "MATH101",
  "CS 101": "CS101",
  "ENG 101": "ENG101",
  "PROG 111": "IT111"
};

export function runTransfereeEvaluation(
  catalog = [],               // BSU Curriculum Catalog
  encodedPastSubjects = [],   // Raw Transcript Records from external institution
  selectedSemester,           // Starting Semester
  selectedAcadYear,           // Starting Academic Year
  minUnits = 15,              // Minimum Load constraint
  maxUnits = 21,              // Maximum Load constraint
  manualOverrides = {}        // Key: externalSubjectCode -> { action: 'approve'|'reject', bsuCode: string, reason: string }
) {
  let deficiencies = [];
  let alerts = [];
  let creditedList = [];
  let rejectedList = [];
  let remainingSubjects = [];
  let manualOverrideAudits = [];

  alerts.push("Transferee Processing Pipeline Active: Cross-crediting parameters using system equivalency maps.");

  const safePastSubjects = Array.isArray(encodedPastSubjects) ? encodedPastSubjects : [];
  const passedAndCreditedCodes = new Set();
  const creditedExternalCodes = new Set();

  // 1. SUBJECT EQUIVALENCY VALIDATION & MANUAL OVERRIDES
  safePastSubjects.forEach(subject => {
    const inputCode = String(subject.subjectCode || '').toUpperCase().trim();
    const inputTitle = String(subject.subjectTitle || '').toUpperCase().trim();
    const gradeVal = parseFloat(subject.grade);
    const unitVal = parseInt(subject.units, 10) || 0;

    // Check if there is an active manual override for this external subject
    const override = manualOverrides[inputCode];
    let targetBsuCode = null;
    let overrideReason = "";
    let isManuallyOverridden = false;

    if (override) {
      isManuallyOverridden = true;
      overrideReason = override.reason || "Registrar manual decision.";
      if (override.action === 'approve') {
        targetBsuCode = String(override.bsuCode || '').toUpperCase().trim();
        manualOverrideAudits.push(`Manual Approval: ${inputCode} mapped to BSU equivalent ${targetBsuCode}.`);
      } else {
        targetBsuCode = null; // Explicitly rejected
        manualOverrideAudits.push(`Manual Rejection: ${inputCode} equivalency was denied.`);
      }
    } else {
      // Default Automated Mapping Process
      if (systemEquivalencyRules[inputCode]) {
        targetBsuCode = systemEquivalencyRules[inputCode];
      } else if (systemEquivalencyRules[inputTitle]) {
        targetBsuCode = systemEquivalencyRules[inputTitle];
      } else {
        // Direct exact match fallback
        const directMatch = catalog.find(c => (c.courseCode || c.code || '').toUpperCase().trim() === inputCode);
        if (directMatch) targetBsuCode = directMatch.courseCode || directMatch.code;
      }
    }

    // Safety Validation: Prevent duplicate crediting
    if (targetBsuCode && passedAndCreditedCodes.has(targetBsuCode.toUpperCase())) {
      rejectedList.push({
        code: inputCode,
        title: subject.subjectTitle,
        units: unitVal,
        grade: subject.grade,
        status: 'Duplicate Rejected',
        reason: `Equivalent BSU course [${targetBsuCode.toUpperCase()}] is already credited or completed.`
      });
      return;
    }

    // Policies Check
    const isPassingGrade = !isNaN(gradeVal) && gradeVal <= 3.0 && gradeVal >= 1.0;
    const hasApprovedEquivalent = targetBsuCode !== null;
    const hasValidUnits = unitVal > 0;

    // Verify target course exists in the active BSU Curriculum Catalog
    const bsuCourse = targetBsuCode 
      ? catalog.find(c => (c.courseCode || c.code || '').toUpperCase().trim() === targetBsuCode.toUpperCase())
      : null;

    if (!isManuallyOverridden && targetBsuCode && !bsuCourse) {
      rejectedList.push({
        code: inputCode,
        title: subject.subjectTitle,
        units: unitVal,
        grade: subject.grade,
        status: 'Curriculum Mismatch',
        reason: `Mapped target code [${targetBsuCode}] does not exist in the active curriculum.`
      });
      return;
    }

    if ((isPassingGrade && hasApprovedEquivalent && hasValidUnits) || (isManuallyOverridden && override?.action === 'approve')) {
      const finalTitle = bsuCourse ? (bsuCourse.courseTitle || bsuCourse.title) : (subject.subjectTitle || 'Credited Equivalency');
      const finalUnits = bsuCourse ? parseInt(bsuCourse.creditUnits || bsuCourse.units || 3, 10) : unitVal;
      
      const creditObj = {
        originalSubject: inputCode,
        code: targetBsuCode.toUpperCase(),
        title: finalTitle,
        units: finalUnits,
        grade: subject.grade,
        status: 'Credited',
        reason: isManuallyOverridden ? `Manual Override: ${overrideReason}` : "Automated rule matching approved."
      };
      creditedList.push(creditObj);
      passedAndCreditedCodes.add(targetBsuCode.toUpperCase());
      creditedExternalCodes.add(inputCode);
    } else {
      let reasons = [];
      if (!isPassingGrade) reasons.push("Below minimum passing grade of 3.0");
      if (!hasApprovedEquivalent) reasons.push("No approved equivalency mapping exists");
      if (!hasValidUnits) reasons.push("Invalid units entry");
      
      rejectedList.push({
        code: inputCode,
        title: subject.subjectTitle,
        units: unitVal,
        grade: subject.grade,
        status: 'Rejected',
        reason: overrideReason || reasons.join(', ')
      });
    }
  });

  // 2. REMAINING CURRICULUM EVALUATION
  let unitsEarned = 0;
  let unitsRemaining = 0;
  let subjectList = [];

  catalog.forEach(course => {
    const codeClean = (course.courseCode || course.code || '').toUpperCase().trim();
    const isCredited = passedAndCreditedCodes.has(codeClean);
    const unitsValue = parseInt(course.creditUnits || course.units || 3, 10);

    if (isCredited) {
      unitsEarned += unitsValue;
      subjectList.push({
        code: codeClean,
        title: course.courseTitle || course.title,
        units: unitsValue,
        status: 'Credited',
        grade: creditedList.find(c => c.code === codeClean)?.grade || '3.0'
      });
    } else {
      unitsRemaining += unitsValue;
      
      // Analyze Prerequisites
      let missingPrereqs = [];
      const reqs = course.prerequisites || [];
      reqs.forEach(p => {
        if (p && p !== '-' && !passedAndCreditedCodes.has(p.toUpperCase().trim())) {
          missingPrereqs.push(p.toUpperCase().trim());
        }
      });

      if (missingPrereqs.length > 0) {
        deficiencies.push(`Prerequisite Deficiency: ${codeClean} requires unmet [${missingPrereqs.join(', ')}]`);
      }

      const remainingSub = {
        code: codeClean,
        title: course.courseTitle || course.title,
        units: unitsValue,
        missingPrereqs: missingPrereqs,
        prereqsCleared: missingPrereqs.length === 0,
        semestersOffered: course.semesterOffered || ['First Semester', 'Second Semester'],
        status: 'Not Taken'
      };
      
      remainingSubjects.push(remainingSub);
      subjectList.push(remainingSub);
    }
  });

  // 3. UNIT LOAD OPTIMIZER (SMART SCHEDULING PLAN)
  let currentSimulatingTerm = selectedSemester;
  let currentSimulatingYearStr = selectedAcadYear;
  let remainingPool = [...remainingSubjects];
  let recommendedRoadmap = []; 
  let loopProtection = 0;
  const tempClearedCodes = new Set(passedAndCreditedCodes);

  while (remainingPool.length > 0 && loopProtection < 16) {
    loopProtection++;
    let termSchedule = {
      term: `${currentSimulatingTerm}, A.Y. ${currentSimulatingYearStr}`,
      subjects: [],
      totalUnits: 0
    };

    // Filter by availability & prerequisites cleared
    let eligibleForTerm = remainingPool.filter(subject => {
      const prereqsCleared = subject.missingPrereqs.every(p => tempClearedCodes.has(p));
      const normOffers = (subject.semestersOffered || []).map(s => normalizeSemester(s));
      const targetNorm = normalizeSemester(currentSimulatingTerm);
      const isAvailable = normOffers.includes(targetNorm);

      return prereqsCleared && isAvailable;
    });

    // Respect Maximum unit configurations
    eligibleForTerm.forEach(subject => {
      if (termSchedule.totalUnits + subject.units <= maxUnits) {
        termSchedule.subjects.push(subject);
        termSchedule.totalUnits += subject.units;
      }
    });

    // Flag underloaded scheduled semesters
    if (termSchedule.totalUnits < minUnits && termSchedule.subjects.length > 0) {
      alerts.push(`optimizer-alert: ${termSchedule.term} is underloaded at ${termSchedule.totalUnits} units.`);
    }

    // Progress schedules
    termSchedule.subjects.forEach(scheduled => {
      tempClearedCodes.add(scheduled.code);
      remainingPool = remainingPool.filter(r => r.code !== scheduled.code);
    });

    recommendedRoadmap.push(termSchedule);

    // Rotate semesters
    if (normalizeSemester(currentSimulatingTerm) === '1st') {
      currentSimulatingTerm = 'Second Semester';
    } else if (normalizeSemester(currentSimulatingTerm) === '2nd') {
      currentSimulatingTerm = 'Summer Term';
    } else {
      currentSimulatingTerm = 'First Semester';
      const startYear = parseInt(currentSimulatingYearStr.split('-')[0]) + 1;
      currentSimulatingYearStr = `${startYear}-${startYear + 1}`;
    }
  }

  // 4. ESTIMATED GRADUATION TIMELINE CALCULATION
  const totalSemestersRequired = recommendedRoadmap.filter(r => r.subjects.length > 0).length;
  const estimatedYears = (totalSemestersRequired / 2).toFixed(1);

  const completionPercentage = catalog.length > 0  
    ? ((creditedList.length / catalog.length) * 100).toFixed(1) 
    : '0.0';

  // Overall Decision Evaluation
  const requiresManualReview = rejectedList.some(r => r.status === 'Curriculum Mismatch') || deficiencies.length > 3;
  const overallEligibility = requiresManualReview 
    ? "Requires Registrar Manual Review" 
    : "Transferee Checked & Approved";

  return {
    unitsEarned,
    unitsRemaining,
    creditedList,
    obsoleteList: rejectedList, // Backwards compatibility
    missingSubjects: remainingSubjects,
    subjectList,
    deficiencies,
    alerts,
    recommendedRoadmap,
    completionPercentage,
    overallEligibility,
    totalSemestersRequired,
    estimatedYears,
    manualOverrideAudits
  };
}