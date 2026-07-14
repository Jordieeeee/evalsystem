import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let authCallback;
const unsubscribe = vi.fn();

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth, cb) => {
    authCallback = cb;
    return unsubscribe;
  }),
}));
vi.mock('../services/firebase.js', () => ({ auth: { __type: 'auth' } }));

const getUserRole = vi.fn();
const signOut = vi.fn();
vi.mock('../services/authService.js', () => ({
  getUserRole: (...a) => getUserRole(...a),
  signOut: (...a) => signOut(...a),
}));

const getProfile = vi.fn();
const createStudentProfile = vi.fn();
vi.mock('../services/studentService.js', () => ({
  studentService: {
    getProfile: (...a) => getProfile(...a),
    createStudentProfile: (...a) => createStudentProfile(...a),
  },
}));

import { AuthProvider, useAuth } from './AuthContext.jsx';

const Consumer = () => {
  const { user, role, loading, authError, profile, signOut: doSignOut, clearAuthError } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.uid : 'none'}</span>
      <span data-testid="role">{role || 'none'}</span>
      <span data-testid="error">{authError || 'none'}</span>
      <span data-testid="profile">{profile ? profile.id : 'none'}</span>
      <button type="button" onClick={doSignOut}>signout</button>
      <button type="button" onClick={clearAuthError}>clearerror</button>
    </div>
  );
};

const renderProvider = () =>
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authCallback = undefined;
  });

  it('useAuth throws when used outside an AuthProvider', () => {
    const Orphan = () => {
      useAuth();
      return null;
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });

  it('starts in a loading state and subscribes to auth changes', () => {
    renderProvider();
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(typeof authCallback).toBe('function');
  });

  it('sets role for a recognized admin user without creating a profile', async () => {
    getUserRole.mockResolvedValue('admin');
    renderProvider();

    await act(async () => {
      await authCallback({ uid: 'admin1' });
    });

    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('admin'));
    expect(screen.getByTestId('user')).toHaveTextContent('admin1');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(createStudentProfile).not.toHaveBeenCalled();
  });

  it('creates a student profile when one does not yet exist', async () => {
    getUserRole.mockResolvedValue('student');
    getProfile.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'stu1' });
    createStudentProfile.mockResolvedValue(undefined);

    renderProvider();
    await act(async () => {
      await authCallback({ uid: 'stu1', email: 'stu@e.com', displayName: 'Stu' });
    });

    await waitFor(() => expect(screen.getByTestId('profile')).toHaveTextContent('stu1'));
    expect(createStudentProfile).toHaveBeenCalledOnce();
  });

  it('signs out and sets an error for an unrecognized account', async () => {
    getUserRole.mockResolvedValue(null);
    signOut.mockResolvedValue(undefined);

    renderProvider();
    await act(async () => {
      await authCallback({ uid: 'ghost' });
    });

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Account not recognized')
    );
    expect(signOut).toHaveBeenCalled();
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('signout resets user/role/profile via the exposed signOut helper', async () => {
    const user = userEvent.setup();
    getUserRole.mockResolvedValue('admin');
    signOut.mockResolvedValue(undefined);

    renderProvider();
    await act(async () => {
      await authCallback({ uid: 'admin1' });
    });
    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('admin'));

    await user.click(screen.getByText('signout'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(signOut).toHaveBeenCalled();
    expect(screen.getByTestId('role')).toHaveTextContent('none');
  });

  it('clearAuthError resets the auth error message', async () => {
    const user = userEvent.setup();
    getUserRole.mockResolvedValue(null);
    signOut.mockResolvedValue(undefined);

    renderProvider();
    await act(async () => {
      await authCallback({ uid: 'ghost' });
    });
    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Account not recognized')
    );

    await user.click(screen.getByText('clearerror'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('none'));
  });

  it('clears state when there is no authenticated user', async () => {
    renderProvider();
    await act(async () => {
      await authCallback(null);
    });

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('role')).toHaveTextContent('none');
  });
});
