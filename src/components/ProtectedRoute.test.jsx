import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }) => <div data-testid="navigate">redirect:{to}</div>,
}));

const useAuth = vi.fn();
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => useAuth() }));

import { ProtectedRoute } from './ProtectedRoute.jsx';

const Child = () => <div>secret content</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while auth is resolving', () => {
    useAuth.mockReturnValue({ user: null, role: null, loading: true });
    render(<ProtectedRoute><Child /></ProtectedRoute>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
  });

  it('redirects to /login when there is no user', () => {
    useAuth.mockReturnValue({ user: null, role: null, loading: false });
    render(<ProtectedRoute><Child /></ProtectedRoute>);
    expect(screen.getByTestId('navigate')).toHaveTextContent('redirect:/login');
  });

  it('redirects to /login when the role does not match requiredRole', () => {
    useAuth.mockReturnValue({ user: { uid: '1' }, role: 'student', loading: false });
    render(<ProtectedRoute requiredRole="admin"><Child /></ProtectedRoute>);
    expect(screen.getByTestId('navigate')).toHaveTextContent('redirect:/login');
  });

  it('renders children when authenticated with the required role', () => {
    useAuth.mockReturnValue({ user: { uid: '1' }, role: 'admin', loading: false });
    render(<ProtectedRoute requiredRole="admin"><Child /></ProtectedRoute>);
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });

  it('renders children when authenticated and no role is required', () => {
    useAuth.mockReturnValue({ user: { uid: '1' }, role: 'student', loading: false });
    render(<ProtectedRoute><Child /></ProtectedRoute>);
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });
});
