import { normalizeSemester } from '../../../../services/curriculumConfig'; 

export function runTransfereeEvaluation(
  catalog = [],               // Master BSU target course curriculum requirements load
  studentSubjectsCollection = [], // Integrated raw student data payload pool
  selectedSemester,           
  selectedAcadYear,           
  minUnits = 15,              
  maxUnits = 21,              
  manualOverrides = {}        
) {
  let deficiencies = []; 
  let alerts = []; 
  let creditedList = []; 
  let rejectedList = []; 
  let remainingSubjects = []; 

  alerts.push("Transferee Sequence Hub Active: Recalculating enrollment map milestones based on encoded history profiles.");

  const safePastSubjects = Array.isArray(studentSubjectsCollection) ? studentSubjectsCollection : []; 
  
  // Separate pure transcript entries vs pre-loaded default system courses[cite: 1]
  const manualTranscripts = safePastSubjects.filter(s => s.isManualEntry === true);

  const passedAndCreditedCodes = new Set(); 

  // 1. EVALUATE MANUALLY ENCODED EXTERNAL CREDENTIALS
  manualTranscripts.forEach(subject => {
    const extCode = String(subject.subjectCode || '').toUpperCase().trim();
    const targetBsuCode = String(subject.bsuEquivalentCode || '').toUpperCase().trim();
    const gradeVal = parseFloat(subject.grade);
    const unitVal = parseInt(subject.units, 10) || 3;

    const isPassingGrade = (!isNaN(gradeVal) && gradeVal <= 3.0 && gradeVal >= 1.0) || subject.grade === 'In Progress';
    const hasValidMapping = targetBsuCode && targetBsuCode !== 'UNMAPPED';

    if (isPassingGrade && hasValidMapping) {
      creditedList.push({
        originalSubject: extCode,
        code: targetBsuCode,
        title: subject.bsuEquivalentTitle || 'Approved Transfer Credit',
        units: unitVal,
        grade: subject.grade,
        status: 'Credited',
        reason: "Transcript analysis mapping confirmed."
      });
      passedAndCreditedCodes.add(targetBsuCode);
    } else {
      rejectedList.push({
        code: extCode,
        title: subject.subjectTitle,
        units: unitVal,
        grade: subject.grade,
        status: 'Rejected',
        reason: subject.grade === '5.0' || subject.grade === 'DRP' ? "Failed/Withdrawn external course mark." : "No explicit curriculum mapping assigned."
      });
    }
  });

  // 2. CURRICULUM BASE CHECK: Evaluate what core target loads remain outstanding[cite: 1]
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
             
      // Trace broken prerequisite sequences among missing gaps[cite: 1]
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

  // 3. UNIT LOAD OPTIMIZER (SMART PROGRESSION TIMELINE)[cite: 1]
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

    let eligibleForTerm = remainingPool.filter(subject => {
      const prereqsCleared = subject.missingPrereqs.every(p => tempClearedCodes.has(p)); 
      const rawOffers = subject.semestersOffered || [];
      const arrayOffers = Array.isArray(rawOffers) ? rawOffers : [rawOffers];
      
      const normOffers = arrayOffers.map(s => normalizeSemester(s)); 
      const targetNorm = normalizeSemester(currentSimulatingTerm); 
      const isAvailable = normOffers.includes(targetNorm); 
      return prereqsCleared && isAvailable; 
    });

    eligibleForTerm.forEach(subject => {
      if (termSchedule.totalUnits + subject.units <= maxUnits) {
        termSchedule.subjects.push(subject); 
        termSchedule.totalUnits += subject.units; 
      }
    });

    if (termSchedule.totalUnits < minUnits && termSchedule.subjects.length > 0) {
      alerts.push(`optimizer-alert: ${termSchedule.term} is scheduled under minimum unit recommendations.`); 
    }

    termSchedule.subjects.forEach(scheduled => {
      tempClearedCodes.add(scheduled.code); 
      remainingPool = remainingPool.filter(r => r.code !== scheduled.code); 
    });

    recommendedRoadmap.push(termSchedule); 

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

  const totalSemestersRequired = recommendedRoadmap.filter(r => r.subjects.length > 0).length; 
  const estimatedYears = (totalSemestersRequired / 2).toFixed(1); 
  const completionPercentage = catalog.length > 0       
      ? ((creditedList.length / catalog.length) * 100).toFixed(1)      
      : '0.0'; 

  const requiresManualReview = rejectedList.length > 3 || deficiencies.length > 4; 
  const overallEligibility = requiresManualReview      
    ? "Requires Registrar Manual Review"      
    : "Transferee Checked & Approved"; 

  return {
    unitsEarned,
    unitsRemaining,
    creditedList,
    obsoleteList: rejectedList, 
    missingSubjects: remainingSubjects, 
    subjectList, 
    deficiencies, 
    alerts, 
    recommendedRoadmap, 
    completionPercentage, 
    overallEligibility, 
    totalSemestersRequired, 
    estimatedYears, 
    manualOverrideAudits: []
  };
}