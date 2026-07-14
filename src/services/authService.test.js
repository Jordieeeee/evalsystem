import { describe, it, expect, beforeEach, vi } from 'vitest';
import { makeDocSnapshot } from '../test/firestoreMocks.js';

vi.mock('./firebase.js', () => ({ auth: { __type: 'auth' }, db: { __type: 'db' } }));
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args) => ({ __type: 'doc', args })),
  getDoc: vi.fn(),
}));

import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { signIn, signOut, getUserRole } from './authService.js';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signIn returns the authenticated user', async () => {
    const user = { uid: 'abc' };
    signInWithEmailAndPassword.mockResolvedValue({ user });

    const result = await signIn('a@b.com', 'secret');

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({ __type: 'auth' }, 'a@b.com', 'secret');
    expect(result).toBe(user);
  });

  it('signOut delegates to firebase signOut', async () => {
    firebaseSignOut.mockResolvedValue(undefined);

    await signOut();

    expect(firebaseSignOut).toHaveBeenCalledWith({ __type: 'auth' });
  });

  describe('getUserRole', () => {
    it('returns the role when the user document exists', async () => {
      getDoc.mockResolvedValue(makeDocSnapshot('u1', { role: 'admin' }));

      const role = await getUserRole('u1');

      expect(doc).toHaveBeenCalledWith({ __type: 'db' }, 'users', 'u1');
      expect(role).toBe('admin');
    });

    it('returns null when the user document does not exist', async () => {
      getDoc.mockResolvedValue(makeDocSnapshot('u1', null));

      const role = await getUserRole('u1');

      expect(role).toBeNull();
    });
  });
});
