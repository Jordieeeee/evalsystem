import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import LandingPage from './pages/landingpage/LandingPage.jsx';
import LoginPage from './pages/login/LoginPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import { NotFound } from './pages/error/NotFound.jsx';


// Import your newly separated pages
import AdminDashboardView from './pages/admin/dashboard/index.jsx';
import AdminStudentsView from './pages/admin/students/index.jsx';
import AdminSubjectsView from './pages/admin/subjects/index.jsx';
import AdminEvaluationView from './pages/admin/evaluation/index.jsx';
import AdminReportsView from './pages/admin/reports/index.jsx';
import AdminSettingsView from './pages/admin/settings/index.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin layout with structural sub-routes nested inside */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            {/* These render exactly inside the <Outlet /> layout of AdminDashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardView />} />
            <Route path="students" element={<AdminStudentsView />} />
            <Route path="subjects" element={<AdminSubjectsView />} />
            <Route path="evaluation" element={<AdminEvaluationView />} />
            <Route path="reports" element={<AdminReportsView />} />
            <Route path="settings" element={<AdminSettingsView />} />
          </Route>

          {/* Student dashboard route */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/error/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;