import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export const studentService = {
  // Get main profile data
  getProfile: async (studentId) => {
    const docRef = doc(db, 'students', studentId);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  // Get active assignments and historical grades
  getAcademicRecords: async (studentId) => {
    const recordsRef = collection(db, 'evaluations');
    const q = query(recordsRef, where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    
    const allRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Group active assignments
    const currentSubjects = allRecords.filter(r => 
      r.status === 'Assigned' || r.status === 'Pending Pre-req' || r.status === 'Pending'
    );
    
    // Group historical completions
    const completedHistory = allRecords.filter(r => 
      r.status === 'Passed' || r.status === 'Failed' || r.status === 'Excellent' || r.status === 'Completed'
    );

    return { currentSubjects, completedHistory };
  },

  getAllStudents: async () => {
    const studentsRef = collection(db, 'students');
    const snapshot = await getDocs(studentsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};