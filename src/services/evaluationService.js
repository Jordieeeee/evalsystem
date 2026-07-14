import { db } from './firebase';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
// CRITICAL FIX: Imported the missing systemService
import { systemService } from './systemService';

export const evaluationService = {
  getAllEvaluations: async () => {
    const evalRef = collection(db, 'evaluations');
    const snapshot = await getDocs(evalRef);
    return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
  },

  getEligibleSubjectsForStudent: async (studentId) => {
    // 1. Fetch all subjects
    const subjectsSnap = await getDocs(collection(db, 'new_subjects'));
    const allSubjects = subjectsSnap.docs.map((document) => ({ id: document.id, ...document.data() }));

    // 2. Fetch student's evaluation history
    const evalsSnap = await getDocs(query(collection(db, 'evaluations'), where('studentId', '==', studentId)));
    const allEvals = evalsSnap.docs.map((document) => document.data());

    // 3. Fetch the ACTIVE ACADEMIC TERM safely
    let activeSemester = '1st Semester'; // Fallback
    try {
      const systemConfig = await systemService.getAcademicConfig();
      if (systemConfig && systemConfig.activeSemester) {
        activeSemester = systemConfig.activeSemester;
      }
    } catch (error) {
      console.warn("Could not fetch active semester from settings. Defaulting to 1st Semester.", error);
    }

    const passedCodes = allEvals.filter((entry) => entry.status === 'Passed').map((entry) => entry.subjectCode);
    const activeCodes = allEvals.filter((entry) => ['Assigned', 'Pending Pre-req', 'Pending'].includes(entry.status)).map((entry) => entry.subjectCode);

    const eligibleSubjects = allSubjects.filter((subject) => {
      // Rule A: Skip if already passed or currently active
      if (passedCodes.includes(subject.id) || activeCodes.includes(subject.id)) return false;

      // Rule B: TERM FILTERING - Skip if the subject is not offered this semester
      if (subject.semesterOffered) {
        // Handle if database stored it as an Array (e.g., ["1st Semester", "2nd Semester"])
        if (Array.isArray(subject.semesterOffered) && subject.semesterOffered.length > 0) {
          if (!subject.semesterOffered.includes(activeSemester)) {
            return false;
          }
        }
        // Handle if database stored it as a raw String (e.g., "1st Semester")
        else if (typeof subject.semesterOffered === 'string' && subject.semesterOffered.trim() !== '') {
          if (subject.semesterOffered !== activeSemester) {
            return false;
          }
        }
      }

      // Rule C: Check Prerequisites
      const reqs = subject.prerequisites || [];
      const missing = reqs.filter((req) => !passedCodes.includes(req));

      // If there are no missing prerequisites, it is eligible
      return missing.length === 0;
    });

    return {
      passed: passedCodes,
      eligible: eligibleSubjects
    };
  },

  dispatchMultipleAssignments: async (studentId, subjectCodes) => {
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();

    subjectCodes.forEach((code) => {
      const evalRef = doc(collection(db, 'evaluations'));
      batch.set(evalRef, {
        studentId,
        subjectCode: code,
        status: 'Assigned',
        assignedDate: timestamp,
        missingPrerequisites: [],
        isManualEntry: false,
        remarks: 'Assigned by admin'
      });
    });

    await batch.commit();
    return true;
  },

  addManualTORRecords: async (studentId, entries) => {
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();

    entries.forEach((entry) => {
      const normalizedEntry = typeof entry === 'string'
        ? { subjectCode: entry, grade: '', status: 'Passed', remarks: 'Manual TOR Entry' }
        : entry;

      const evalRef = doc(collection(db, 'evaluations'));
      batch.set(evalRef, {
        studentId,
        subjectCode: normalizedEntry.subjectCode,
        grade: normalizedEntry.grade || '',
        status: normalizedEntry.status === 'Failed' ? 'Failed' : 'Passed',
        assignedDate: timestamp,
        remarks: normalizedEntry.remarks || 'Manual TOR Entry',
        isManualEntry: true,
        missingPrerequisites: []
      });
    });

    await batch.commit();
    return true;
  }
};