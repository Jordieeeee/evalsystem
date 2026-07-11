import { db } from './firebase';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';

export const evaluationService = {
  
  // 1. Fetch ALL evaluations for the table
  getAllEvaluations: async () => {
    const evalRef = collection(db, 'evaluations');
    const snapshot = await getDocs(evalRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // 2. NEW: Calculate what a student is allowed to take
  getEligibleSubjectsForStudent: async (studentId) => {
    // A. Get all subjects in the curriculum
    const subjectsSnap = await getDocs(collection(db, 'subjects'));
    const allSubjects = subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // B. Get student's current and past records
    const evalsSnap = await getDocs(query(collection(db, 'evaluations'), where("studentId", "==", studentId)));
    const allEvals = evalsSnap.docs.map(doc => doc.data());
    
    // C. Separate passed subjects from currently active/failed ones
    const passedCodes = allEvals.filter(e => e.status === 'Passed').map(e => e.subjectCode);
    const activeCodes = allEvals.filter(e => ['Assigned', 'Pending Pre-req'].includes(e.status)).map(e => e.subjectCode);

    // D. Filter down to ONLY eligible subjects
    const eligibleSubjects = allSubjects.filter(subject => {
      // Skip if they already passed it, or are currently taking it
      if (passedCodes.includes(subject.id) || activeCodes.includes(subject.id)) return false;
      
      // Check prerequisites
      const reqs = subject.prerequisites || [];
      const missing = reqs.filter(req => !passedCodes.includes(req));
      
      // They are eligible if they are missing ZERO prerequisites
      return missing.length === 0;
    });

    return {
      passed: passedCodes,
      eligible: eligibleSubjects
    };
  },

  // 3. NEW: Dispatch multiple eligible subjects at once
  dispatchMultipleAssignments: async (studentId, subjectCodes) => {
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();

    subjectCodes.forEach(code => {
      const evalRef = doc(collection(db, 'evaluations'));
      batch.set(evalRef, {
        studentId,
        subjectCode: code,
        status: 'Assigned',
        assignedDate: timestamp,
        missingPrerequisites: []
      });
    });

    await batch.commit();
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
  }
};