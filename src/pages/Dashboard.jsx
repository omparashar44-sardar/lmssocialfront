import { useEffect, useState } from 'react';
import {
  getCertificates,
  getCourses,
  getDashboardCompliance,
  getEmployees,
} from '../services/lms.js';
import SuperAdminDashboard from './SuperAdminDashboard.jsx';

const formatPercent = (value) => `${Math.max(0, Math.min(100, Math.round(value)))}%`;

export default function Dashboard() {
  const role = localStorage.getItem('role');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    activeLearners: 0,
    certificatesIssued: 0,
    trainingCompletion: 0,
    topCourses: [],
  });

  useEffect(() => {
    if (role === 'super_admin') {
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [courses, certificates, compliance, employees] = await Promise.all([
          getCourses(),
          getCertificates(),
          role === 'employee' ? Promise.resolve(null) : getDashboardCompliance(),
          role === 'employee' ? Promise.resolve([]) : getEmployees(),
        ]);

        const topCourses = courses.slice(0, 2);
        const trainingCompletion =
          role === 'employee'
            ? certificates.length && courses.length
              ? (certificates.length / courses.length) * 100
              : 0
            : compliance && Number(compliance.totalEmployees) > 0
              ? (Number(compliance.compliant) / Number(compliance.totalEmployees)) * 100
              : 0;

        setStats({
          activeLearners: role === 'employee' ? 1 : employees.length,
          certificatesIssued: certificates.length,
          trainingCompletion,
          topCourses,
        });
      } catch (loadError) {
        setError(loadError.message || 'Unable to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [role]);

  if (role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  return (
    <div>
      <div className="mb-10 float-in">
        <h1 className="text-5xl font-bold text-[#26331a]">
          Learning Dashboard
        </h1>

        <p className="text-gray-600 mt-3 text-lg">
          {role === 'employee'
            ? 'Track your training, lesson completion, and earned certificates.'
            : 'Manage employee learning, certifications, and operational readiness.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="glass rounded-3xl p-8 lift float-in-d1">
          <p className="text-sm text-gray-500">
            {role === 'employee' ? 'Assigned Courses' : 'Active Learners'}
          </p>

          <h2 className="text-5xl font-bold text-[#26331a] mt-4">
            {loading ? '...' : role === 'employee' ? stats.topCourses.length : stats.activeLearners}
          </h2>
        </div>

        <div className="glass rounded-3xl p-8 lift float-in-d2">
          <p className="text-sm text-gray-500">
            {role === 'employee' ? 'My Certificates' : 'Certifications Issued'}
          </p>

          <h2 className="text-5xl font-bold text-[#26331a] mt-4">
            {loading ? '...' : stats.certificatesIssued}
          </h2>
        </div>

        <div className="glass rounded-3xl p-8 lift float-in-d3">
          <p className="text-sm text-gray-500">
            {role === 'employee' ? 'My Completion' : 'Training Completion'}
          </p>

          <h2 className="text-5xl font-bold text-[#26331a] mt-4">
            {loading ? '...' : formatPercent(stats.trainingCompletion)}
          </h2>
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-8 float-in-d2">
        <h2 className="text-3xl font-bold text-[#26331a]">
          {role === 'employee' ? 'My Learning Queue' : 'Live Courses'}
        </h2>

        <p className="text-gray-600 mt-2">
          {role === 'employee'
            ? 'Your currently assigned courses coming directly from the backend.'
            : 'Top active courses coming directly from your backend.'}
        </p>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {stats.topCourses.length === 0 && !loading ? (
            <div className="glass rounded-3xl p-8 text-sm text-gray-600">
              No courses are available yet. Create one from the Courses page.
            </div>
          ) : (
            stats.topCourses.map((course, index) => (
              <div
                key={course.id}
                className={index === 0
                  ? 'bg-[#26331a] text-white rounded-3xl p-8 lift shadow-xl'
                  : 'glass rounded-3xl p-8 lift'}
              >
                <h3 className={`text-2xl font-bold ${index === 0 ? '' : 'text-[#26331a]'}`}>
                  {course.title}
                </h3>

                <p className={`mt-4 ${index === 0 ? 'text-[#d9e3c3]' : 'text-gray-600'}`}>
                  {course.description || 'Course description will appear here once added in the backend.'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
