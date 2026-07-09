import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';

export const StudentDashboard = () => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600 text-lg">Coming Soon</p>
        </div>
      </div>
    </div>
  );
};