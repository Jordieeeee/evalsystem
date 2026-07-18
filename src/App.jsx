import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

import LandingPage from './pages/landingpage/LandingPage.jsx';
import LoginPage from './pages/login/LoginPage.jsx';
import RegisterPage from './pages/register/RegisterPage.jsx';
import NotFound from './pages/error/NotFound.jsx';

// Core Parent Dashboard Shell Layout Components
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';

// Administrative Sub-view Pages
import AdminDashboardView from './pages/admin/dashboard/index.jsx';
import AdminStudentsView from './pages/admin/students/index.jsx';
import AdminSubjectsView from './pages/admin/subjects/index.jsx';
import AdminEvaluationView from './pages/admin/evaluation/index.jsx';
import AdminReportsView from './pages/admin/reports/index.jsx';
import AdminSettingsView from './pages/admin/settings/index.jsx';

// Student Sub-view Pages
import StudentDashboardTab from './pages/student/dashboard/index.jsx';
import StudentAssignedSubjectsPage from './pages/student/assigned-subjects/index.jsx';
import StudentEvaluationResultsPage from './pages/student/evaluation-results/index.jsx';
import StudentReportsPage from './pages/student/reports/index.jsx';
import StudentProfilePage from './pages/student/profile/index.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing & Authentication Views */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

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


          {/* Student layout with structural sub-routes nested inside */}
          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }

          >
            {/* These render exactly inside the <Outlet /> layout of StudentDashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboardTab />} />
            <Route path="assigned-subjects" element={<StudentAssignedSubjectsPage />} />
            <Route path="evaluation-results" element={<StudentEvaluationResultsPage />} />
            <Route path="reports" element={<StudentReportsPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
          </Route>

          {/* Wildcard Fallback Error Handling Views */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes >
      </Router >
    </AuthProvider >
  );
}

export default App;