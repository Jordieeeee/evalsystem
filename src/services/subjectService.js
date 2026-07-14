import { db } from './firebase';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export const subjectService = {
  // Fetch all new curriculum subjects
  getAllSubjects: async () => {
    const subjectsRef = collection(db, 'new_subjects');
    const snapshot = await getDocs(subjectsRef);
    console.log("=== FIRESTORE SNAPSHOT DEBUG ===");
    console.log("Snapshot size:", snapshot.size);
    console.log("Snapshot docs:", snapshot.docs);
    console.log("Snapshot empty:", snapshot.empty);
    const subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Mapped subjects:", subjects);
    return subjects;
  },

  // Fetch a single subject's details
  getSubject: async (courseCode) => {
    const docRef = doc(db, 'new_subjects', courseCode);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  // Fetch the crosswalk mapping dictionary (Translates Old Code -> New Code)
  getCrosswalkMappings: async () => {
    const mappingsRef = collection(db, 'curriculum_mappings');
    const snapshot = await getDocs(mappingsRef);
    
    // Build a simple key-value object: { "IT_111": "CC_100", "CS_111": "CC_101" }
    const mappingDict = {};
    snapshot.docs.forEach(doc => {
      // doc.id is the old code (e.g., 'IT_111')
      mappingDict[doc.id] = doc.data().newCourseCode; 
    });
    
    return mappingDict;
  },

  // Add a new subject to Firestore
  addSubject: async (subjectData) => {
    const { id, ...data } = subjectData;
    const docRef = doc(db, 'new_subjects', id.toUpperCase());
    await setDoc(docRef, data);
    return { id: id.toUpperCase(), ...data };
  },

  deleteSubject: async (subjectId) => {
    try {
      const docRef = doc(db, 'new_subjects', subjectId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting subject:", error);
      throw error;
    }
  }
};