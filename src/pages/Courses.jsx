import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader.jsx';
import CourseCard from '../components/CourseCard.jsx';
import { createCourse, getCourses } from '../services/lms.js';

const defaultForm = {
  title: '',
  description: '',
  role_target: '',
  validity_months: 12,
  pass_score: 80,
};

const toCourseCardModel = (course) => ({
  id: course.id,
  title: course.title,
  level: `${course.role_target || 'General'} • ${course.status || 'active'}`,
  due: course.validity_months ? `${course.validity_months} month validity` : 'No expiry',
  progress: course.status === 'completed' ? 100 : 0,
  completed: course.status === 'completed',
  timeSpent: undefined,
  totalTime: undefined,
});

export default function Courses() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const canManageCourses = role === 'admin' || role === 'super_admin';
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [sortBy, setSortBy] = useState('Newest first');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    setError('');

    try {
      const courseList = await getCourses();
      setCourses(courseList);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreateCourse = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await createCourse({
        ...form,
        validity_months: Number(form.validity_months),
        pass_score: Number(form.pass_score),
      });
      setForm(defaultForm);
      setShowCreateForm(false);
      await loadCourses();
    } catch (createError) {
      setError(createError.message || 'Unable to create course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = courses.filter((course) => {
    const matchSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      (course.description || '').toLowerCase().includes(search.toLowerCase());
    const matchType =
      typeFilter === 'All types' ||
      (course.role_target || '').toLowerCase().includes(typeFilter.toLowerCase());

    return matchSearch && matchType;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'Title') {
      return a.title.localeCompare(b.title);
    }

    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Courses"
        subtitle="Training catalog"
        action={
          canManageCourses ? (
            <button
              onClick={() => setShowCreateForm((current) => !current)}
              className="px-3 py-2 text-xs rounded-xl2 border border-olive/30 text-olive-dark hover:bg-olive hover:text-beige transition-colors"
            >
              {showCreateForm ? 'Close form' : 'Create course'}
            </button>
          ) : null
        }
      />

      {error && (
        <div className="rounded-xl2 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {showCreateForm && canManageCourses && (
        <form
          onSubmit={handleCreateCourse}
          className="grid gap-3 rounded-[28px] glass p-5 md:grid-cols-2"
        >
          <label className="space-y-2 text-sm text-olive-dark">
            <span className="font-semibold">Course title</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Example: Forklift Safety"
              required
              className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 text-sm text-olive-dark focus:outline-none"
            />
            <p className="text-xs text-olive/55">The learner-facing name for this course.</p>
          </label>
          <label className="space-y-2 text-sm text-olive-dark">
            <span className="font-semibold">Role target</span>
            <input
              value={form.role_target}
              onChange={(event) => setForm((current) => ({ ...current, role_target: event.target.value }))}
              placeholder="Example: Warehouse Associate"
              className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 text-sm text-olive-dark focus:outline-none"
            />
            <p className="text-xs text-olive/55">Which job role or learner group this course is meant for.</p>
          </label>
          <label className="space-y-2 text-sm text-olive-dark md:col-span-2">
            <span className="font-semibold">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe what this course teaches and why it matters."
              className="min-h-[100px] w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 text-sm text-olive-dark focus:outline-none"
            />
            <p className="text-xs text-olive/55">Shown in the course catalog and used in the course workspace.</p>
          </label>
          <label className="space-y-2 text-sm text-olive-dark">
            <span className="font-semibold">Validity months</span>
            <input
              type="number"
              min="1"
              value={form.validity_months}
              onChange={(event) => setForm((current) => ({ ...current, validity_months: event.target.value }))}
              className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 text-sm text-olive-dark focus:outline-none"
            />
            <p className="text-xs text-olive/55">How long the course completion stays valid before expiring.</p>
          </label>
          <label className="space-y-2 text-sm text-olive-dark">
            <span className="font-semibold">Pass score</span>
            <input
              type="number"
              min="1"
              max="100"
              value={form.pass_score}
              onChange={(event) => setForm((current) => ({ ...current, pass_score: event.target.value }))}
              className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 text-sm text-olive-dark focus:outline-none"
            />
            <p className="text-xs text-olive/55">Minimum score required for a learner to pass this course.</p>
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl2 bg-olive px-4 py-2 text-xs font-semibold text-beige transition-colors hover:bg-olive-dark disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Save course'}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl2 bg-off-white border border-olive/10 shadow-soft">
          <span className="text-olive/70">Total courses:</span>
          <span className="font-semibold text-olive-dark">{courses.length}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search courses..."
          className="px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark focus:outline-none focus:ring-2 focus:ring-olive/30 text-xs"
        />

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark text-xs focus:outline-none"
          >
            <option>All types</option>
            {Array.from(new Set(courses.map((course) => course.role_target).filter(Boolean))).map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark text-xs focus:outline-none"
          >
            <option>Newest first</option>
            <option>Title</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] glass p-8 text-sm text-olive/70">
          Loading courses...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((course) => (
            <CourseCard
              key={course.id}
              {...toCourseCardModel(course)}
              onClick={() => navigate(`/app/courses/${course.id}`)}
            />
          ))}
          {sorted.length === 0 && (
            <div className="col-span-3 text-center py-12 text-olive/50 text-sm">
              No courses match your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
