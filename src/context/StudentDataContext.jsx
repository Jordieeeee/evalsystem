import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { computeStudentMetrics } from '../utils/studentMetrics';

const StudentDataContext = createContext(null);

export const StudentDataProvider = ({ children }) => {
  // Reuses the exact SR-Code resolution Profile already relies on: AuthContext
  // resolves students/{srCode} once via studentService.getProfileByUid at
  // login. This provider does not add a second way to identify the user.
  const { user, profile, loading: studentLoading, authError: studentError } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(null);

  useEffect(() => {
    if (!profile?.id) {
      setSubjects([]);
      setSubjectsLoading(false);
      return;
    }

    setSubjectsLoading(true);
    // studentSubjects is one document per subject assignment (matches the
    // admin panel's query shape), not an array/map nested on the student doc.
    const q = query(collection(db, 'studentSubjects'), where('studentId', '==', profile.id));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSubjects(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setSubjectsError(null);
        setSubjectsLoading(false);
      },
      (err) => {
        console.error('Failed to load student subjects', err);
        setSubjectsError('Failed to load your subjects. Please try again later.');
        setSubjectsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.id]);

  const displayName = useMemo(() => {
    if (profile) {
      const composed = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
      return composed || user?.displayName || user?.email?.split('@')[0] || 'Student';
    }
    return user?.displayName || user?.email?.split('@')[0] || 'Student';
  }, [profile, user]);

  const metrics = useMemo(
    () => computeStudentMetrics(subjects, profile?.academicYear),
    [subjects, profile?.academicYear]
  );

  const value = {
    student: profile,
    displayName,
    studentLoading,
    studentError,
    subjects,
    subjectsLoading,
    subjectsError,
    metrics
  };

  return (
    <StudentDataContext.Provider value={value}>
      {children}
    </StudentDataContext.Provider>
  );
};

export const useStudentData = () => {
  const context = useContext(StudentDataContext);
  if (!context) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
};

export const useStudent = () => {
  const { student, displayName, studentLoading, studentError } = useStudentData();
  return { student, displayName, loading: studentLoading, error: studentError };
};

export const useStudentSubjects = () => {
  const { subjects, subjectsLoading, subjectsError, metrics } = useStudentData();
  return { subjects, loading: subjectsLoading, error: subjectsError, metrics };
};
