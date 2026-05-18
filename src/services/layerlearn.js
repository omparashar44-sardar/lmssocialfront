const API_BASE = 'https://lmssocialbackend.onrender.com';

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(data.message || 'Request failed.');
    error.response = { data, status: response.status };
    throw error;
  }

  return data;
};

export const getLayerLearnCourses = () => request('/courses');
export const getLayerLearnCourse = (courseId) => request(`/courses/${courseId}`);

export const findLayerLearnCourseByTitle = async (title) => {
  const courses = await getLayerLearnCourses();
  const normalized = title.trim().toLowerCase();
  return courses.find((course) => course.title.trim().toLowerCase() === normalized) || null;
};

export const uploadLayerLearnCourse = async ({ title, focusArea, notes, sourceFile }) => {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('focusArea', focusArea);
  formData.append('notes', notes);

  if (sourceFile) {
    formData.append('sourceFile', sourceFile);
  }

  return request('/upload', {
    method: 'POST',
    body: formData,
  });
};

export const ensureLayerLearnCourse = async ({ title, focusArea, notes }) => {
  const existing = await findLayerLearnCourseByTitle(title);

  if (existing) {
    return getLayerLearnCourse(existing.id);
  }

  const created = await uploadLayerLearnCourse({
    title,
    focusArea,
    notes,
    sourceFile: null,
  });

  return created.course;
};

export const askLayerLearnCoach = (courseId, payload) =>
  request(`/courses/${courseId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

export const generateLessonQuiz = (payload) =>
  request('/generate-quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
