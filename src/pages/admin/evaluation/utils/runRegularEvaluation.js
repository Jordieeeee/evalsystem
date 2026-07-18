/**
 * Core Evaluation Processor for Regular Tracks
 * Location: src/pages/admin/evaluation/utils/runRegularEvaluation.js
 */

export function runRegularEvaluation(studentData, catalogData, config = {}) {
  // --- AGGRESSIVE DATA STRIPPING ---
  // Forcefully mutate and delete properties to stop the UI from rendering these cards
  if (studentData) {
    // Kill Recommended Schedule & Curriculum Progress data targets
    delete studentData.recommendedSchedule;
    delete studentData.curriculumProgress;
    delete studentData.progress;
    delete studentData.curriculum;
    
    // Fallbacks to blank arrays so the cards collapse/have nothing to loop over
    studentData.recommendedSchedule = [];
    studentData.curriculumProgress = {};
    studentData.plannedSchedules = [];
  }

  if (catalogData) {
    // Kill Catalog Registry Browser data targets
    delete catalogData.subjects;
    delete catalogData.courses;
    delete catalogData.tree;
    
    catalogData.subjects = [];
    catalogData.courses = [];
  }

  // --- SAFE FALLBACK TRACKING ---
  if (!studentData || !catalogData) {
    return {
      success: false,
      auditOutput: null,
      studentSubjectsHistory: []
    };
  }

  const activeTerm = studentData.currentTerm || "2026-2027";

  // Process ONLY the core Course Load data array
  const processedCourseLoad = (studentData.enrolledSubjects || []).map((subject) => {
    return {
      academicTerm: subject.academicTerm || activeTerm,
      subjectCode: (subject.subjectCode || "").toUpperCase(),
      descriptiveTitle: subject.descriptiveTitle || subject.subjectTitle || "No Title Provided",
      units: Number(subject.units || 3),
      grade: subject.grade || "In Progress"
    };
  });

  // --- RETURN OBLITERATED PAYLOAD ---
  return {
    success: true,
    evaluationStrategy: "Regular Evaluation Model",
    minAllowedUnits: config.minAllowedUnits || 15,
    maxAllowedUnits: config.maxAllowedUnits || 24,
    
    // Explicitly kill the return keys just in case
    curriculumProgress: null,
    recommendedSchedule: null,
    catalogBrowser: null,
    catalog: null,

    auditOutput: {
      generatedAt: new Date().toISOString(),
      summary: {
        status: "Active Regular Matrix Review"
      }
    },
    studentSubjectsHistory: processedCourseLoad
  };
}