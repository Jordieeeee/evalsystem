import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signOut = async () => {
  console.log('Starting sign out process...');
  try {
    await firebaseSignOut(auth);
    console.log('Firebase sign out successful');
  } catch (error) {
    console.error('Sign out failed:', error);
    throw error;
  }
};

export const getUserRole = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) {
    return null;
  }
  return userDoc.data().role;
};