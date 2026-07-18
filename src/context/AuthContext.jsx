import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { getUserRole, signOut as firebaseSignOut } from '../services/authService.js';
import { studentService } from '../services/studentService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [profile, setProfile] = useState(null);

  const signOut = async () => {
    console.log('AuthContext signOut called');
    try {
      await firebaseSignOut();
      console.log('AuthContext: Firebase sign out completed');
      // Clear local state immediately
      setUser(null);
      setRole(null);
      setProfile(null);
      setAuthError(null);
      console.log('AuthContext: Local state cleared');
    } catch (error) {
      console.error('AuthContext: Error during sign out:', error);
      // Still clear local state even if sign out fails
      setUser(null);
      setRole(null);
      setProfile(null);
      setAuthError(null);
      throw error;
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          // Staff (registrars/admins) are provisioned manually via users/{uid}.
          const userRole = await getUserRole(firebaseUser.uid);
          if (userRole) {
            setRole(userRole);
            setAuthError(null);
          } else {
            // Not a staff account — check whether this uid has claimed a
            // registrar-admitted record. Self-registered students are keyed by
            // SR-Code (students/{srCode}), with `uid` as a field rather than the
            // doc id, so this is a query, not a doc-id lookup. There is no
            // auto-create fallback here: under firestore.rules, only a registrar
            // may create a students/* doc, and a legitimate student's doc must
            // already exist (written at admit time) before it can be claimed.
            const studentProfile = await studentService.getProfileByUid(firebaseUser.uid);
            if (studentProfile) {
              setRole('student');
              setProfile(studentProfile);
              setAuthError(null);
            } else {
              await firebaseSignOut();
              setUser(null);
              setRole(null);
              setProfile(null);
              setAuthError('Account not recognized. Contact your administrator.');
            }
          }
        } else {
          setUser(null);
          setRole(null);
          setProfile(null);
          setAuthError(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthError('Authentication error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, authError, profile, signOut, clearAuthError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};