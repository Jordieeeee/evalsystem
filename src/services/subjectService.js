import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export const subjectService = {
  // Dynamically fetch from the correct collection path
  getAllSubjects: async (curriculum) => {
    const collectionName = curriculum === "Old Curriculum" ? "old_subjects" : "new_subjects";
    const subjectsRef = collection(db, collectionName);
    const snapshot = await getDocs(subjectsRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        // Fallback to doc.id if courseCode string is missing (like in old_subjects screenshot)
        courseCode: data.courseCode || doc.id, 
        courseTitle: data.courseTitle || '',
        creditUnits: Number(data.creditUnits) || 0,
        prerequisites: data.prerequisites || [],
        semesterOffered: data.semesterOffered || [],
        track: data.track || 'Common', // Defaults to 'Common' if the field doesn't exist
        yearLevel: data.yearLevel || 'Year 1'
      };
    });
  }
};