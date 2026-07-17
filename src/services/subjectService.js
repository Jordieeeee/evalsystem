import { db } from './firebase'; // Verifies relative pathing from src/services/
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';

export const subjectService = {
  // =========================================================================
  // A. SUBJECT MANAGEMENT (Get, Add, Edit, Archive, Restore, Search, Filter)
  // =========================================================================

  // Dynamically fetch from the correct collection path
  getAllSubjects: async (curriculum) => {
    const collectionName = curriculum === "Old Curriculum" ? "old_subjects" : "new_subjects";
    const subjectsRef = collection(db, collectionName);
    const snapshot = await getDocs(subjectsRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      
      // --- Defensive handling for semesterOffered ---
      let rawSemester = data.semesterOffered;
      let semesterArray = [];
      if (Array.isArray(rawSemester)) {
        semesterArray = rawSemester;
      } else if (typeof rawSemester === 'string' && rawSemester.trim() !== '') {
        semesterArray = [rawSemester]; 
      } else {
        semesterArray = ['First Semester']; // Standardized matching fallback
      }

      return {
        id: doc.id,
        courseCode: data.courseCode || doc.id, 
        courseTitle: data.courseTitle || '',
        creditUnits: Number(data.creditUnits) || 0,
        lectureUnits: Number(data.lectureUnits) || Number(data.creditUnits) || 0,
        labUnits: Number(data.labUnits) || 0,
        description: data.description || '',
        isArchived: data.isArchived || false,
        archivedAt: data.archivedAt || null,
        category: data.category || 'Major', 
        prerequisites: Array.isArray(data.prerequisites) ? data.prerequisites : [],
        corequisites: Array.isArray(data.corequisites) ? data.corequisites : [],
        constraints: {
          minGradeRequirement: data.constraints?.minGradeRequirement || '3.00',
          minGpaRequirement: data.constraints?.minGpaRequirement || '',
          maxEnrollees: Number(data.constraints?.maxEnrollees) || null,
          minEnrollees: Number(data.constraints?.minEnrollees) || null,
        },
        semesterOffered: semesterArray, 
        track: data.track || 'Common',
        yearLevel: data.yearLevel || 'First Year'
      };
    });
  },

  // ADD SUBJECT
  addSubject: async (curriculum, subjectData) => {
    const collectionName = curriculum === "Old Curriculum" ? "old_subjects" : "new_subjects";
    const courseCode = subjectData.courseCode.toUpperCase().trim();
    const docRef = doc(db, collectionName, courseCode);

    const payload = {
      courseCode: courseCode,
      courseTitle: subjectData.courseTitle,
      creditUnits: Number(subjectData.creditUnits),
      lectureUnits: Number(subjectData.lectureUnits || subjectData.creditUnits),
      labUnits: Number(subjectData.labUnits || 0),
      description: subjectData.description || '',
      category: subjectData.category || 'Major',
      prerequisites: subjectData.prerequisites || [],
      corequisites: subjectData.corequisites || [],
      semesterOffered: subjectData.semesterOffered || [],
      yearLevel: subjectData.yearLevel || 'First Year',
      track: subjectData.track || 'Common',
      isArchived: false,
      archivedAt: null,
      constraints: {
        minGradeRequirement: subjectData.minGradeRequirement || '3.00',
        minGpaRequirement: subjectData.minGpaRequirement || null,
        maxEnrollees: subjectData.maxEnrollees ? Number(subjectData.maxEnrollees) : null,
        minEnrollees: subjectData.minEnrollees ? Number(subjectData.minEnrollees) : null,
      }
    };

    await setDoc(docRef, payload);
    await subjectService.logAudit('SUBJECT_CREATED', courseCode, { payload }, subjectData.actionBy || 'Admin');
    return { id: courseCode, ...payload };
  },

  // EDIT SUBJECT
  editSubject: async (curriculum, subjectId, updatedData) => {
    const collectionName = curriculum === "Old Curriculum" ? "old_subjects" : "new_subjects";
    const docRef = doc(db, collectionName, subjectId);

    const payload = {
      courseTitle: updatedData.courseTitle,
      creditUnits: Number(updatedData.creditUnits),
      lectureUnits: Number(updatedData.lectureUnits || updatedData.creditUnits),
      labUnits: Number(updatedData.labUnits || 0),
      description: updatedData.description || '',
      category: updatedData.category,
      prerequisites: updatedData.prerequisites || [],
      corequisites: updatedData.corequisites || [],
      semesterOffered: updatedData.semesterOffered || [],
      yearLevel: updatedData.yearLevel,
      track: updatedData.track || 'Common',
      constraints: {
        minGradeRequirement: updatedData.minGradeRequirement || '3.00',
        minGpaRequirement: updatedData.minGpaRequirement || null,
        maxEnrollees: updatedData.maxEnrollees ? Number(updatedData.maxEnrollees) : null,
        minEnrollees: updatedData.minEnrollees ? Number(updatedData.minEnrollees) : null,
      }
    };

    await updateDoc(docRef, payload);
    await subjectService.logAudit('SUBJECT_UPDATED', subjectId, { payload }, updatedData.actionBy || 'Admin');
  },

  // ARCHIVE SUBJECT
  archiveSubject: async (curriculum, subjectId, actionBy = 'Admin') => {
    const collectionName = curriculum === "Old Curriculum" ? "old_subjects" : "new_subjects";
    const docRef = doc(db, collectionName, subjectId);

    await updateDoc(docRef, {
      isArchived: true,
      archivedAt: new Date().toISOString()
    });

    await subjectService.logAudit('SUBJECT_ARCHIVED', subjectId, { isArchived: true }, actionBy);
  },

  // RESTORE ARCHIVED SUBJECT
  restoreSubject: async (curriculum, subjectId, actionBy = 'Admin') => {
    const collectionName = curriculum === "Old Curriculum" ? "old_subjects" : "new_subjects";
    const docRef = doc(db, collectionName, subjectId);

    await updateDoc(docRef, {
      isArchived: false,
      archivedAt: null
    });

    await subjectService.logAudit('SUBJECT_RESTORED', subjectId, { isArchived: false }, actionBy);
  },

  // =========================================================================
  // B. CURRICULUM MANAGEMENT
  // =========================================================================

  // Pull active curriculum mappings (Old -> New legacy structures)
  getCurriculumMappings: async () => {
    try {
      const mappingsRef = collection(db, "curriculum_mappings");
      const snapshot = await getDocs(mappingsRef);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          oldCourseCode: data.oldCourseCode || doc.id,
          courseTitle: data.courseTitle || '',
          newCourseCode: data.newCourseCode || '',
          isCreditable: data.isCreditable !== undefined ? data.isCreditable : true,
          effectiveDate: data.effectiveDate || null,
          curriculumVersion: data.curriculumVersion || 'v1.0',
          // Mappings authored before plan bridging carry no type; they are full equivalencies.
          equivalencyType: data.equivalencyType === 'partial' ? 'partial' : 'full',
          bridgeCourseCode: data.bridgeCourseCode || null,
          notes: data.notes || ''
        };
      });
    } catch (error) {
      console.error("Error fetching curriculum mappings:", error);
      throw error;
    }
  },

  // Add Curriculum Map Link (Equivalency Linking)
  addCurriculumMapping: async (mappingData) => {
    const docRef = doc(db, "curriculum_mappings", mappingData.oldCourseCode);
    const payload = {
      oldCourseCode: mappingData.oldCourseCode,
      courseTitle: mappingData.courseTitle,
      newCourseCode: mappingData.newCourseCode,
      isCreditable: mappingData.isCreditable ?? true,
      curriculumVersion: mappingData.curriculumVersion || 'v1.0',
      effectiveDate: mappingData.effectiveDate || new Date().toISOString(),
      // 'partial' routes the course into the Bridge bucket for registrar review.
      equivalencyType: mappingData.equivalencyType === 'partial' ? 'partial' : 'full',
      bridgeCourseCode: mappingData.bridgeCourseCode || null,
      notes: mappingData.notes || ''
    };
    await setDoc(docRef, payload);
    await subjectService.logAudit('CURRICULUM_UPDATED', mappingData.oldCourseCode, { payload }, mappingData.actionBy || 'Admin');
  },

  // =========================================================================
  // F. SUBJECT OFFERINGS
  // =========================================================================

  getOfferings: async (academicYear, term) => {
    const offeringsRef = collection(db, "subject_offerings");
    const q = query(
      offeringsRef, 
      where("academicYear", "==", academicYear), 
      where("term", "==", term)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  toggleOffering: async (offeringData) => {
    const offeringId = `${offeringData.subjectCode}_${offeringData.academicYear}_${offeringData.term}`.replace(/\s+/g, '');
    const offeringRef = doc(db, "subject_offerings", offeringId);

    const payload = {
      subjectCode: offeringData.subjectCode,
      academicYear: offeringData.academicYear,
      term: offeringData.term, 
      isActive: offeringData.isActive
    };

    await setDoc(offeringRef, payload, { merge: true });
  },

  // =========================================================================
  // I. AUDIT TRAIL WRITER
  // =========================================================================
  logAudit: async (actionType, entityId, details, performedBy) => {
    try {
      const logsRef = collection(db, "audit_logs");
      await addDoc(logsRef, {
        actionType,  
        entityId,    
        details,     
        performedBy, 
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to write to Audit Trail: ", err);
    }
  }
};