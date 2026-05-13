import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader.jsx';
import { getCourse } from '../services/lms.js';

export default function Quiz() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const data = await getCourse(courseId);
        setCourse(data);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load course assessment.');
      }
    };

    loadCourse();
  }, [courseId]);

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader
        title={`Assessment: ${course?.title || 'Course'}`}
        subtitle="Backend status"
        action={
          <button
            onClick={() => navigate(`/app/courses/${courseId}`)}
            className="px-3 py-2 text-xs rounded-xl2 border border-olive/30 text-olive-dark hover:bg-olive hover:text-beige transition-colors"
          >
            Back to course
          </button>
        }
      />

      <div className="rounded-[28px] glass p-6 text-sm text-olive-dark">
        {error ? (
          <p className="text-rose-700">{error}</p>
        ) : (
          <>
            <p className="font-semibold">This course is loaded from the backend.</p>
            <p className="mt-2 text-olive/70">
              The current backend includes live course, module, lesson, progress, compliance, employee,
              certificate, and LayerLearn functionality. A dedicated quiz API has not been added yet, so this
              screen no longer uses hardcoded quiz data.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
