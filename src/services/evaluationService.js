import { db } from './firebase';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
// CRITICAL FIX: Imported the missing systemService
import { systemService } from './systemService';

// STABLE MASTER LIST OF CURRICULA FOR AUTOMATED & MANUAL BACKUP SEARCHES
export const MASTER_CURRICULA = [
  // --- BSIT Curriculum (AY 2025–2026) ---
  // Gen Ed
  { code: 'GEd 101', title: 'Understanding the Self', category: 'General Education', curriculum: '2025-2026' },
  { code: 'GEd 102', title: 'Mathematics in the Modern World', category: 'General Education', curriculum: '2025-2026' },
  { code: 'GEd 103', title: 'The Life and Works of Rizal', category: 'General Education', curriculum: '2025-2026' },
  { code: 'GEd 104', title: 'The Contemporary World', category: 'General Education', curriculum: '2025-2026' },
  { code: 'GEd 105', title: 'Readings in Philippine History', category: 'General Education', curriculum: '2025-2026' },
  { code: 'GEd 106', title: 'Purposive Communication', category: 'General Education', curriculum: '2025-2026' },
  { code: 'GEd 107', title: 'Ethics', category: 'General Education', curriculum: '2025-2026' },
  { code: 'GEd 108', title: 'Art Appreciation', category: 'General Education', curriculum: '2025-2026' },
  { code: 'GEd 109', title: 'Science, Technology and Society', category: 'General Education', curriculum: '2025-2026' },
  { code: 'GEd 110', title: 'Advanced Technical Writing', category: 'General Education', curriculum: '2025-2026' },
  { code: 'GEd 111', title: 'Advanced Oral Communication', category: 'General Education', curriculum: '2025-2026' },
  // Majors
  { code: 'CC 100', title: 'Introduction to Computing', category: 'Major', curriculum: '2025-2026' },
  { code: 'CC 101', title: 'Computer Programming', category: 'Major', curriculum: '2025-2026' },
  { code: 'CC 102', title: 'Advanced Computer Programming', category: 'Major', curriculum: '2025-2026' },
  { code: 'CC 103', title: 'Data Structures and Algorithms', category: 'Major', curriculum: '2025-2026' },
  { code: 'CC 104', title: 'Information Management', category: 'Major', curriculum: '2025-2026' },
  { code: 'CC 105', title: 'Application Development and Emerging Technologies', category: 'Major', curriculum: '2025-2026' },
  { code: 'OOP 101', title: 'Object-Oriented Programming', category: 'Major', curriculum: '2025-2026' },
  { code: 'SAD 101', title: 'Systems Analysis and Design', category: 'Major', curriculum: '2025-2026' },
  { code: 'IPT 101', title: 'Integrative Programming and Technologies', category: 'Major', curriculum: '2025-2026' },
  { code: 'WS 101', title: 'Web Systems and Technologies', category: 'Major', curriculum: '2025-2026' },
  { code: 'DB 101', title: 'Database Management System', category: 'Major', curriculum: '2025-2026' },
  { code: 'DB 102', title: 'Advanced Database Management System', category: 'Major', curriculum: '2025-2026' },
  { code: 'NET 101', title: 'Fundamentals of Computer Networking', category: 'Major', curriculum: '2025-2026' },
  { code: 'NET 102', title: 'Advanced Computer Networking', category: 'Major', curriculum: '2025-2026' },
  { code: 'SAM 101', title: 'System Administration and Maintenance', category: 'Major', curriculum: '2025-2026' },
  { code: 'SIA 101', title: 'System Integration and Architecture', category: 'Major', curriculum: '2025-2026' },
  { code: 'SIA 102', title: 'Advanced System Integration and Architecture', category: 'Major', curriculum: '2025-2026' },
  { code: 'IAS 101', title: 'Information Assurance and Security', category: 'Major', curriculum: '2025-2026' },
  { code: 'IAS 102', title: 'Advanced Information Assurance and Security', category: 'Major', curriculum: '2025-2026' },
  { code: 'HCI 101', title: 'Human-Computer Interaction', category: 'Major', curriculum: '2025-2026' },
  { code: 'ITPM 101', title: 'IT Project Management', category: 'Major', curriculum: '2025-2026' },
  { code: 'SQA 101', title: 'System Quality Assurance', category: 'Major', curriculum: '2025-2026' },
  { code: 'SIP 101', title: 'Social Issues and Professional Practice', category: 'Major', curriculum: '2025-2026' },
  { code: 'ENGG 105', title: 'Technopreneurship', category: 'Major', curriculum: '2025-2026' },
  { code: 'MATH 101', title: 'Differential Calculus', category: 'Major', curriculum: '2025-2026' },
  { code: 'MATH 102', title: 'Integral Calculus', category: 'Major', curriculum: '2025-2026' },
  { code: 'CpE 405', title: 'Discrete Mathematics', category: 'Major', curriculum: '2025-2026' },
  { code: 'PHYS 111', title: 'General Physics 1', category: 'Major', curriculum: '2025-2026' },
  { code: 'PHYS 112', title: 'General Physics 2', category: 'Major', curriculum: '2025-2026' },
  { code: 'AI 101', title: 'Linear Algebra for AI', category: 'Major', curriculum: '2025-2026' },
  { code: 'AI 102', title: 'Probability and Statistics for AI', category: 'Major', curriculum: '2025-2026' },
  { code: 'QM 101', title: 'Quantitative Methods', category: 'Major', curriculum: '2025-2026' },
  { code: 'CSAI 100', title: 'Artificial Intelligence', category: 'Major', curriculum: '2025-2026' },
  { code: 'AI 103', title: 'Machine Learning and Neural Networks', category: 'Major', curriculum: '2025-2026' },
  // PE
  { code: 'PATHFit 1', title: 'Physical Activities Toward Health and Fitness 1', category: 'PE', curriculum: '2025-2026' },
  { code: 'PATHFit 2', title: 'Physical Activities Toward Health and Fitness 2', category: 'PE', curriculum: '2025-2026' },
  { code: 'PATHFit 3', title: 'Physical Activities Toward Health and Fitness 3', category: 'PE', curriculum: '2025-2026' },
  { code: 'PATHFit 4', title: 'Physical Activities Toward Health and Fitness 4', category: 'PE', curriculum: '2025-2026' },
  // NSTP
  { code: 'NSTP 111', title: 'National Service Training Program 1', category: 'NSTP', curriculum: '2025-2026' },
  { code: 'NSTP 121', title: 'National Service Training Program 2', category: 'NSTP', curriculum: '2025-2026' },
  // Electives
  { code: 'ELEC 101', title: 'Professional Elective 1', category: 'Elective', curriculum: '2025-2026' },
  { code: 'ELEC 102', title: 'Professional Elective 2', category: 'Elective', curriculum: '2025-2026' },
  { code: 'ELEC 103', title: 'Professional Elective 3', category: 'Elective', curriculum: '2025-2026' },
  // Capstone
  { code: 'CP 101', title: 'Capstone Project 1', category: 'Capstone', curriculum: '2025-2026' },
  { code: 'CP 102', title: 'Capstone Project 2', category: 'Capstone', curriculum: '2025-2026' },
  { code: 'ITP 100', title: 'IT Internship', category: 'Capstone', curriculum: '2025-2026' },

  // --- BSIT Curriculum (AY 2018–2019) ---
  // Gen Ed
  { code: 'GEd 101', title: 'Understanding the Self', category: 'General Education', curriculum: '2018-2019' },
  { code: 'GEd 102', title: 'Mathematics in the Modern World', category: 'General Education', curriculum: '2018-2019' },
  { code: 'GEd 103', title: 'The Life and Works of Rizal', category: 'General Education', curriculum: '2018-2019' },
  { code: 'GEd 104', title: 'The Contemporary World', category: 'General Education', curriculum: '2018-2019' },
  { code: 'GEd 105', title: 'Readings in Philippine History', category: 'General Education', curriculum: '2018-2019' },
  { code: 'GEd 106', title: 'Purposive Communication', category: 'General Education', curriculum: '2018-2019' },
  { code: 'GEd 107', title: 'Ethics', category: 'General Education', curriculum: '2018-2019' },
  { code: 'GEd 108', title: 'Art Appreciation', category: 'General Education', curriculum: '2018-2019' },
  { code: 'GEd 109', title: 'Science, Technology and Society', category: 'General Education', curriculum: '2018-2019' },
  { code: 'FILI 101', title: 'Kontekstwalisadong Komunikasyon sa Filipino', category: 'General Education', curriculum: '2018-2019' },
  { code: 'FILI 102', title: 'Filipino sa Iba\'t Ibang Disiplina', category: 'General Education', curriculum: '2018-2019' },
  // Majors
  { code: 'IT 111', title: 'Introduction to Computing', category: 'Major', curriculum: '2018-2019' },
  { code: 'CS 111', title: 'Computer Programming', category: 'Major', curriculum: '2018-2019' },
  { code: 'CS 121', title: 'Advanced Computer Programming', category: 'Major', curriculum: '2018-2019' },
  { code: 'CS 131', title: 'Data Structures and Algorithms', category: 'Major', curriculum: '2018-2019' },
  { code: 'CS 211', title: 'Object-Oriented Programming', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 313', title: 'System Analysis and Design', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 331', title: 'Application Development and Emerging Technologies', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 332', title: 'Integrative Programming and Technologies', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 314', title: 'Web Systems and Technologies', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 211', title: 'Database Management System', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 222', title: 'Advanced Database Management System', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 221', title: 'Information Management', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 311', title: 'Systems Administration and Maintenance', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 312', title: 'System Integration and Architecture', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 322', title: 'Advanced System Integration and Architecture', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 323', title: 'Information Assurance and Security', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 413', title: 'Advanced Information Assurance and Security', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 321', title: 'Human-Computer Interaction', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 325', title: 'IT Project Management', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 414', title: 'System Quality Assurance', category: 'Major', curriculum: '2018-2019' },
  { code: 'CS 423', title: 'Social Issues and Professional Practice', category: 'Major', curriculum: '2018-2019' },
  { code: 'ENGG 405', title: 'Technopreneurship', category: 'Major', curriculum: '2018-2019' },
  { code: 'IT 412', title: 'Platform Technologies', category: 'Major', curriculum: '2018-2019' },
  { code: 'MATH 111', title: 'Linear Algebra', category: 'Major', curriculum: '2018-2019' },
  { code: 'CpE 405', title: 'Discrete Mathematics', category: 'Major', curriculum: '2018-2019' },
  { code: 'PHY 101', title: 'Calculus Based Physics', category: 'Major', curriculum: '2018-2019' },
  { code: 'MATH 408', title: 'Data Analysis', category: 'Major', curriculum: '2018-2019' },
  { code: 'ES 101', title: 'Environmental Sciences', category: 'Major', curriculum: '2018-2019' },
  { code: 'LITR 102', title: 'ASEAN Literature', category: 'Major', curriculum: '2018-2019' },
  // PE
  { code: 'PE 101', title: 'Physical Fitness, Gymnastics and Aerobics', category: 'PE', curriculum: '2018-2019' },
  { code: 'PE 102', title: 'Rhythmic Activities', category: 'PE', curriculum: '2018-2019' },
  { code: 'PE 103', title: 'Individual and Dual Sports', category: 'PE', curriculum: '2018-2019' },
  { code: 'PE 104', title: 'Team Sports', category: 'PE', curriculum: '2018-2019' },
  // NSTP
  { code: 'NSTP 111', title: 'National Service Training Program 1', category: 'NSTP', curriculum: '2018-2019' },
  { code: 'NSTP 121', title: 'National Service Training Program 2', category: 'NSTP', curriculum: '2018-2019' },
  // Electives
  { code: 'NTT 401', title: 'Computer Networking 3', category: 'Elective', curriculum: '2018-2019' },
  { code: 'NTT 402', title: 'Internet of Things (IoT)', category: 'Elective', curriculum: '2018-2019' },
  { code: 'NTT 403', title: 'Computer Networking 4', category: 'Elective', curriculum: '2018-2019' },
  { code: 'NTT 404', title: 'Cloud Computing', category: 'Elective', curriculum: '2018-2019' },
  { code: 'NTT 405', title: 'Cybersecurity', category: 'Elective', curriculum: '2018-2019' },
  { code: 'BAT 401', title: 'Fundamentals of Business Analytics', category: 'Elective', curriculum: '2018-2019' },
  { code: 'BAT 402', title: 'Fundamentals of Analytics Modeling', category: 'Elective', curriculum: '2018-2019' },
  { code: 'BAT 403', title: 'Fundamentals of Enterprise Data Management', category: 'Elective', curriculum: '2018-2019' },
  { code: 'BAT 404', title: 'Analytics Techniques & Tools', category: 'Elective', curriculum: '2018-2019' },
  { code: 'BAT 405', title: 'Analytics Application', category: 'Elective', curriculum: '2018-2019' },
  { code: 'SMT 401', title: 'Fundamentals of Business Process Outsourcing 101', category: 'Elective', curriculum: '2018-2019' },
  { code: 'SMT 402', title: 'Business Communication', category: 'Elective', curriculum: '2018-2019' },
  { code: 'SMT 403', title: 'Fundamentals of Business Process Outsourcing 102', category: 'Elective', curriculum: '2018-2019' },
  { code: 'SMT 404', title: 'Service Culture', category: 'Elective', curriculum: '2018-2019' },
  { code: 'SMT 405', title: 'Principles of System Thinking', category: 'Elective', curriculum: '2018-2019' },
  // Capstone
  { code: 'IT 324', title: 'Capstone Project 1', category: 'Capstone', curriculum: '2018-2019' },
  { code: 'IT 411', title: 'Capstone Project 2', category: 'Capstone', curriculum: '2018-2019' },
  { code: 'IT 421', title: 'Internship Training', category: 'Capstone', curriculum: '2018-2019' }
];

export const evaluationService = {
  getAllEvaluations: async () => {
    const evalRef = collection(db, 'evaluations');
    const snapshot = await getDocs(evalRef);
    return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
  },

  getEligibleSubjectsForStudent: async (studentId) => {
    // 1. Fetch all subjects
    const subjectsSnap = await getDocs(collection(db, 'new_subjects'));
    let allSubjects = subjectsSnap.docs.map((document) => ({ id: document.id, ...document.data() }));

    // Fallback: If DB is unseeded/empty, fall back to the MASTER_CURRICULA
    if (allSubjects.length === 0) {
      allSubjects = MASTER_CURRICULA.map(sub => ({
        id: sub.code,
        courseCode: sub.code,
        courseTitle: sub.title,
        category: sub.category,
        semesterOffered: ["1st Semester", "2nd Semester"] // fallback scheduling
      }));
    }

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
      const subjectId = subject.id || subject.courseCode;
      if (passedCodes.includes(subjectId) || activeCodes.includes(subjectId)) return false;

      // Rule B: TERM FILTERING - Skip if the subject is not offered this semester
      if (subject.semesterOffered) {
        if (Array.isArray(subject.semesterOffered) && subject.semesterOffered.length > 0) {
          if (!subject.semesterOffered.includes(activeSemester)) {
            return false;
          }
        }
        else if (typeof subject.semesterOffered === 'string' && subject.semesterOffered.trim() !== '') {
          if (subject.semesterOffered !== activeSemester) {
            return false;
          }
        }
      }

      // Rule C: Check Prerequisites
      const reqs = subject.prerequisites || [];
      const missing = reqs.filter((req) => !passedCodes.includes(req));

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