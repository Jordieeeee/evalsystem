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
          const userRole = await getUserRole(firebaseUser.uid);
          if (userRole) {
            setRole(userRole);
            if (userRole === 'student') {
              const studentProfile = await studentService.getProfile(firebaseUser.uid);
              if (!studentProfile) {
                await studentService.createStudentProfile(firebaseUser.uid, {
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
                  email: firebaseUser.email || '',
                  studentId: firebaseUser.uid,
                  course: 'BSIT',
                  year: '1',
                  status: 'active'
                });
              }
              setProfile(await studentService.getProfile(firebaseUser.uid));
            }
            setAuthError(null);
          } else {
            await firebaseSignOut();
            setUser(null);
            setRole(null);
            setProfile(null);
            setAuthError('Account not recognized. Contact your administrator.');
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