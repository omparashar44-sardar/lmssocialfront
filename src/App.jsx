import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Courses from './pages/Courses.jsx';
import CoursePlayer from './pages/CoursePlayer.jsx';
import Quiz from './pages/Quiz.jsx';
import Users from './pages/Users.jsx';
import Certificates from './pages/Certificates.jsx';
import ComplianceTracker from './pages/ComplianceTracker.jsx';
import Settings from './pages/Settings.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:courseId" element={<CoursePlayer />} />
          <Route path="courses/:courseId/quiz" element={<Quiz />} />
          <Route path="users" element={<Users />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="compliance" element={<ComplianceTracker />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
