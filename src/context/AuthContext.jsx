import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import { getUserRole, signOut as firebaseSignOut } from '../services/authService.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const signOut = async () => {
    await firebaseSignOut();
    setUser(null);
    setRole(null);
    setAuthError(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRole = await getUserRole(firebaseUser.uid);
        if (userRole) {
          setRole(userRole);
          setAuthError(null);
        } else {
          // User is authenticated but has no role document
          await firebaseSignOut();
          setUser(null);
          setRole(null);
          setAuthError('Account not recognized. Contact your administrator.');
        }
      } else {
        setUser(null);
        setRole(null);
        setAuthError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, authError, signOut, clearAuthError }}>
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