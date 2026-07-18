import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export const studentService = {
  getProfile: async (studentId) => {
    const docRef = doc(db, 'students', studentId);
    const snap = await getDoc(docRef);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  // Self-registered students are keyed by SR-Code (students/{srCode}), not by
  // their Firebase Auth uid, so looking a profile up after sign-in means querying
  // for the doc whose `uid` field matches the signed-in user rather than doc-id
  // lookup. This exact `uid == request.auth.uid` shape is what firestore.rules
  // allows a signed-in student to read, so the query is rule-compatible.
  getProfileByUid: async (uid) => {
    const q = query(collection(db, 'students'), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const match = snapshot.docs[0];
    return { id: match.id, ...match.data() };
  },

  createStudentProfile: async (studentId, payload = {}) => {
    const docId = payload.docId || studentId;
    const docRef = doc(db, 'students', docId);
    const profile = {
      id: payload.id || payload.studentId || studentId,
      studentId: payload.studentId || payload.id || studentId,
      name: payload.name || '',
      email: payload.email || '',
      course: payload.course || payload.program || 'BSIT',
      program: payload.program || payload.course || 'BSIT',
      year: payload.year || '1',
      status: 'active',
      createdAt: serverTimestamp(),
      ...payload
    };
    await setDoc(docRef, profile, { merge: true });
    return { id: docId, ...profile };
  },

  updateStudentProfile: async (studentId, updates) => {
    const docRef = doc(db, 'students', studentId);
    const normalizedUpdates = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, normalizedUpdates);
    return { id: studentId, ...normalizedUpdates };
  },

  deleteStudentProfile: async (studentId) => {
    const docRef = doc(db, 'students', studentId);
    await deleteDoc(docRef);
  },

  getAcademicRecords: async (studentId) => {
    const recordsRef = collection(db, 'evaluations');
    const q = query(recordsRef, where('studentId', '==', studentId));
    const snapshot = await getDocs(q);

    const allRecords = snapshot.docs
      .map((recordDoc) => ({ id: recordDoc.id, ...recordDoc.data() }))
      .sort((a, b) => new Date(b.assignedDate || 0) - new Date(a.assignedDate || 0));

    const currentSubjects = allRecords.filter((r) =>
      ['Assigned', 'Pending Pre-req', 'Pending'].includes(r.status)
    );

    const completedHistory = allRecords.filter((r) =>
      ['Passed', 'Failed', 'Excellent', 'Completed'].includes(r.status)
    );

    return { currentSubjects, completedHistory };
  },

  getAllStudents: async () => {
    const studentsRef = collection(db, 'students');
    const snapshot = await getDocs(studentsRef);
    return snapshot.docs.map((studentDoc) => ({ id: studentDoc.id, ...studentDoc.data() }));
  }
};