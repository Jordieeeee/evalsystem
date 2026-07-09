import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Evaluation System</h1>
        <p className="text-gray-600 mb-8">Welcome to the school evaluation management system.</p>
        <Link to="/login">
          <Button className="w-full">Login</Button>
        </Link>
      </div>
    </div>
  );
};