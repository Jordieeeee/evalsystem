import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { signIn } from '../services/authService.js';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorMessage } from '../components/ui/ErrorMessage.jsx';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { role, authError, loading: authLoading, clearAuthError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'student') {
      navigate('/student/dashboard', { replace: true });
    }
  }, [role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    clearAuthError();
    setLoading(true);

    try {
      await signIn(email, password);
      // After successful sign-in, AuthContext will handle role fetching and redirect
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleInputChange = () => {
    setError(null);
    clearAuthError();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h1>
        
        {authError && <ErrorMessage message={authError} />}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              handleInputChange();
            }}
            required
          />
          
          <Input
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              handleInputChange();
            }}
            required
          />
          
          <ErrorMessage message={error} />
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
};