import { apiBaseUrl, apiRequest } from './api.js';

export const getCourses = () => apiRequest('/courses');
export const getCourse = (courseId) => apiRequest(`/courses/${courseId}`);
export const createCourse = (payload) =>
  apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
export const updateCourse = (courseId, payload) =>
  apiRequest(`/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
export const deleteCourse = (courseId) =>
  apiRequest(`/courses/${courseId}`, {
    method: 'DELETE',
  });

export const getModulesByCourse = (courseId) => apiRequest(`/modules/course/${courseId}`);
export const createModule = (payload) =>
  apiRequest('/modules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
export const updateModule = (moduleId, payload) =>
  apiRequest(`/modules/${moduleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
export const deleteModule = (moduleId) =>
  apiRequest(`/modules/${moduleId}`, {
    method: 'DELETE',
  });

export const getLessonsByModule = (moduleId) => apiRequest(`/lessons/module/${moduleId}`);
export const createLesson = (payload) =>
  apiRequest('/lessons', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
export const updateLesson = (lessonId, payload) =>
  apiRequest(`/lessons/${lessonId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
export const deleteLesson = (lessonId) =>
  apiRequest(`/lessons/${lessonId}`, {
    method: 'DELETE',
  });

export const getModuleProgress = (moduleId) => apiRequest(`/progress/module/${moduleId}`);
export const startLesson = (lessonId) =>
  apiRequest('/progress/start', {
    method: 'POST',
    body: JSON.stringify({ lesson_id: lessonId }),
  });
export const completeLesson = (lessonId) =>
  apiRequest('/progress/complete', {
    method: 'POST',
    body: JSON.stringify({ lesson_id: lessonId }),
  });

export const completeCourse = (courseId) =>
  apiRequest('/progress/complete-course', {
    method: 'POST',
    body: JSON.stringify({ course_id: courseId }),
  });
export const recordQuizAttempt = (payload) =>
  apiRequest('/progress/quiz-attempt', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getEmployees = () => apiRequest('/employees');
export const createEmployee = (payload) =>
  apiRequest('/employees', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
export const getEmployeeTrainingSummary = (employeeId) =>
  apiRequest(`/employees/${employeeId}/training-summary`);

export const getDashboardCompliance = () => apiRequest('/dashboard/compliance');
export const getDashboardSummary = () => apiRequest('/dashboard/summary');

export const getSuperAdminDashboard = () => apiRequest('/super-admin/dashboard');
export const getSuperAdminCompanies = () => apiRequest('/super-admin/companies');
export const createSuperAdminCompany = (payload) =>
  apiRequest('/super-admin/companies', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
export const updateSuperAdminCompany = (companyId, payload) =>
  apiRequest(`/super-admin/companies/${companyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
export const getSuperAdminAdmins = (companyId) => {
  const query = companyId ? `?company_id=${encodeURIComponent(companyId)}` : '';
  return apiRequest(`/super-admin/admins${query}`);
};
export const createSuperAdminAdmin = (payload) =>
  apiRequest('/super-admin/admins', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getCertificates = () => apiRequest('/certificates');
export const downloadCertificate = async (courseId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${apiBaseUrl}/certificates/${courseId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = 'Unable to download certificate.';
    try {
      const payload = await response.json();
      message = payload.message || payload.error || message;
    } catch {
      // noop
    }

    throw new Error(message);
  }

  return response.blob();
};

export const downloadComplianceReport = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${apiBaseUrl}/reports/compliance`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error('Unable to export compliance report.');
  }

  return response.blob();
};
