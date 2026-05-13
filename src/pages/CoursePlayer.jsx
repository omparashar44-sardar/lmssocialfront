import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader.jsx';
import LayerLearnCoach from '../components/layerlearn/LayerLearnCoach.jsx';
import LayerLearnTree from '../components/layerlearn/LayerLearnTree.jsx';
import { ensureLayerLearnCourse, generateLessonQuiz } from '../services/layerlearn.js';
import {
  completeLesson,
  completeCourse,
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  downloadCertificate,
  getCourse,
  getCertificates,
  getLessonsByModule,
  getModuleProgress,
  getModulesByCourse,
  recordQuizAttempt,
  startLesson,
  updateCourse,
  updateLesson,
  updateModule,
} from '../services/lms.js';

const panelVariants = {
  closedLeft: { x: '-92%' },
  openLeft: { x: 0 },
  closedRight: { x: '92%' },
  openRight: { x: 0 },
};

const edgePanelClass =
  'bg-white border border-[#e7e0cf] shadow-[0_24px_60px_rgba(38,51,26,0.14)]';

const emptyCourseForm = {
  title: '',
  description: '',
  role_target: '',
  validity_months: 12,
  pass_score: 80,
  status: 'active',
};

const emptyModuleForm = {
  title: '',
  description: '',
  order_index: 1,
};

const emptyLessonForm = {
  title: '',
  content_type: 'video',
  content_url: '',
  duration_minutes: 10,
  order_index: 1,
};

const formatClock = (seconds) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

const compactTopicForQuiz = (topic) => ({
  id: topic.id,
  title: topic.title,
  summary: topic.summary,
  levelLabel: topic.levelLabel,
  prerequisites: (topic.prerequisites || []).map((item) => item.topic || item.topicTitle || item),
  nextTopics: (topic.nextTopics || []).map((item) => item.topic || item.topicTitle || item),
  weaknessType: topic.weaknessDiagnosis?.type,
  retrainingPlan: topic.weaknessDiagnosis?.retrainingPlan || [],
  scenarioPrompt: topic.scenarioChallenge?.prompt,
  practicalTask: topic.practicalTask?.instructions,
});

export default function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const isLearner = role === 'employee';
  const canManage = role === 'admin' || role === 'super_admin';
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleLessons, setModuleLessons] = useState({});
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [earnedCertificate, setEarnedCertificate] = useState(null);
  const [secondsSpent, setSecondsSpent] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [aiCourse, setAiCourse] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [treeOpen, setTreeOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [quizError, setQuizError] = useState('');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScoreVisible, setQuizScoreVisible] = useState(false);
  const [quizSaving, setQuizSaving] = useState(false);
  const [quizSaved, setQuizSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [isSavingModule, setIsSavingModule] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsSpent((current) => current + 1);
      setSessionSeconds((current) => current + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const loadCourseWorkspace = async (preferredModuleId = null, preferredLessonId = null) => {
    setLoading(true);
    setError('');

    try {
      const courseData = await getCourse(courseId);
      const moduleData = await getModulesByCourse(courseId);
      const certificateRows = isLearner ? await getCertificates() : [];
      const lessonRequests = await Promise.all(
        moduleData.map(async (module) => {
          const lessons = isLearner
            ? await getModuleProgress(module.id)
            : await getLessonsByModule(module.id);

          return [module.id, lessons];
        })
      );

      const lessonsByModule = Object.fromEntries(lessonRequests);
      const selectedModule =
        moduleData.find((module) => module.id === preferredModuleId) ||
        moduleData[0] ||
        null;
      const selectedLessons = selectedModule ? lessonsByModule[selectedModule.id] || [] : [];
      const selectedLesson =
        selectedLessons.find((lesson) => lesson.id === preferredLessonId) ||
        selectedLessons[0] ||
        null;

      setCourse(courseData);
      setCourseForm({
        title: courseData.title || '',
        description: courseData.description || '',
        role_target: courseData.role_target || '',
        validity_months: courseData.validity_months || 12,
        pass_score: courseData.pass_score || 80,
        status: courseData.status || 'active',
      });
      setModules(moduleData);
      setModuleLessons(lessonsByModule);
      setActiveModuleId(selectedModule?.id || null);
      setActiveLessonId(selectedLesson?.id || null);
      setEarnedCertificate(
        isLearner
          ? certificateRows.find((certificate) => String(certificate.course_id) === String(courseId)) || null
          : null
      );

      const notes = [
        `Course title: ${courseData.title}`,
        `Role target: ${courseData.role_target || 'General'}`,
        `Description: ${courseData.description || 'No description provided'}`,
        'Module and lesson outline:',
        ...moduleData.flatMap((module, moduleIndex) => {
          const lessons = lessonsByModule[module.id] || [];
          return [
            `${moduleIndex + 1}. ${module.title} (${module.description || 'No description'})`,
            ...lessons.map((lesson, lessonIndex) =>
              `   ${moduleIndex + 1}.${lessonIndex + 1} ${lesson.title} (${lesson.duration_minutes || 0} min)`
            ),
          ];
        }),
      ].join('\n');

      const mappedCourse = await ensureLayerLearnCourse({
        title: courseData.title,
        focusArea: courseData.role_target || 'Operational learning path',
        notes,
      });

      setAiCourse(mappedCourse);
      setSelectedTopicId(
        mappedCourse.knowledgeTree?.recommendedNodeId ||
          mappedCourse.topicLibrary?.[0]?.id ||
          null
      );
    } catch (loadError) {
      setError(loadError.message || 'Unable to load this course.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseWorkspace();
  }, [courseId, isLearner]);

  const activeModule = modules.find((module) => module.id === activeModuleId) || null;
  const activeLessons = activeModule ? moduleLessons[activeModule.id] || [] : [];
  const activeLesson =
    activeLessons.find((lesson) => lesson.id === activeLessonId) || activeLessons[0] || null;

  useEffect(() => {
    if (activeModule && activeLessons.length > 0 && !activeLesson) {
      setActiveLessonId(activeLessons[0].id);
    }
  }, [activeLesson, activeLessons, activeModule]);

  const selectedTopic = useMemo(
    () => aiCourse?.topicLibrary?.find((topic) => topic.id === selectedTopicId) || null,
    [aiCourse, selectedTopicId]
  );

  const allLessons = Object.values(moduleLessons).flat();
  const completedLessons = allLessons.filter((lesson) => lesson.completed).length;
  const progressPct = allLessons.length
    ? Math.round((completedLessons / allLessons.length) * 100)
    : 0;
  const contentUrl = activeLesson?.content_url || '';
  const isVideoContent = /\.(mp4|webm|ogg)(\?.*)?$/i.test(contentUrl);

  const refreshModule = async (moduleId, nextActiveLessonId = null) => {
    const lessons = isLearner
      ? await getModuleProgress(moduleId)
      : await getLessonsByModule(moduleId);

    setModuleLessons((current) => ({
      ...current,
      [moduleId]: lessons,
    }));

    if (nextActiveLessonId) {
      setActiveLessonId(nextActiveLessonId);
    } else if (lessons.length > 0) {
      setActiveLessonId(lessons[0].id);
    }
  };

  const handleStartLesson = async () => {
    if (!activeLesson) {
      return;
    }

    try {
      await startLesson(activeLesson.id);
      await refreshModule(activeModule.id, activeLesson.id);
    } catch (startError) {
      setError(startError.message || 'Unable to start lesson.');
    }
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson) {
      return;
    }

    try {
      await completeLesson(activeLesson.id);
      await loadCourseWorkspace(activeModule.id, activeLesson.id);
    } catch (completeError) {
      setError(completeError.message || 'Unable to complete lesson.');
    }
  };

  const handleCompleteCourse = async () => {
    try {
      await completeCourse(courseId);
      await loadCourseWorkspace(activeModuleId, activeLessonId);
    } catch (completeError) {
      setError(completeError.message || 'Unable to complete course.');
    }
  };

  const handleGenerateQuiz = async () => {
    if (!activeLesson) return;
    setGeneratingQuiz(true);
    setQuizError('');
    setQuizData(null);
    setQuizAnswers({});
    setQuizScoreVisible(false);
    setQuizSaved(false);
    setQuizModalOpen(true);
    
    try {
      const focusTopic =
        selectedTopic ||
        aiCourse?.topicLibrary?.find((topicItem) =>
          activeLesson.title.toLowerCase().includes(topicItem.title.toLowerCase()) ||
          topicItem.title.toLowerCase().includes(activeLesson.title.toLowerCase())
        ) ||
        aiCourse?.topicLibrary?.find((topicItem) => topicItem.id === aiCourse?.knowledgeTree?.recommendedNodeId) ||
        aiCourse?.topicLibrary?.[0] ||
        null;
      const weakTopics = (aiCourse?.knowledgeTree?.weakNodeIds || [])
        .map((topicId) => aiCourse?.topicLibrary?.find((topicItem) => topicItem.id === topicId))
        .filter(Boolean);
      const relatedTopicIds = [
        focusTopic?.id,
        ...(focusTopic?.prerequisiteIds || []),
        ...(focusTopic?.childIds || []),
        ...(focusTopic?.nextTopicIds || []),
        ...(focusTopic?.relatedTopicIds || []),
        ...weakTopics.map((topicItem) => topicItem.id),
      ].filter(Boolean);
      const treeTopics = relatedTopicIds.length
        ? aiCourse?.topicLibrary?.filter((topicItem) => relatedTopicIds.includes(topicItem.id))
        : aiCourse?.topicLibrary?.slice(0, 6);

      const data = await generateLessonQuiz({
        topic: activeLesson.title,
        url: activeLesson.content_url || '',
        courseTitle: course?.title || '',
        treeContext: {
          focusTopic: focusTopic ? compactTopicForQuiz(focusTopic) : null,
          recommendedTopicId: aiCourse?.knowledgeTree?.recommendedNodeId || null,
          topics: (treeTopics || []).slice(0, 8).map(compactTopicForQuiz),
          weakTopics: weakTopics.slice(0, 5).map(compactTopicForQuiz),
        },
      });
      setQuizData(data);
    } catch (err) {
      setQuizError(err.message || 'Unable to generate quiz.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quizData?.questions?.length) {
      return;
    }

    const score = Object.keys(quizAnswers).filter(
      (key) => quizAnswers[key] === quizData.questions[key].answerIndex
    ).length;

    setQuizSaving(true);
    setQuizError('');

    try {
      await recordQuizAttempt({
        course_id: courseId,
        lesson_id: activeLesson?.id || null,
        score,
        total_questions: quizData.questions.length,
        time_spent_seconds: sessionSeconds,
      });
      setQuizSaved(true);
      setQuizScoreVisible(true);
    } catch (saveError) {
      setQuizError(saveError.message || 'Unable to save quiz result.');
    } finally {
      setQuizSaving(false);
    }
  };

  const handleDownloadCourseCertificate = async () => {
    if (!earnedCertificate) {
      return;
    }

    try {
      const blob = await downloadCertificate(courseId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(course?.title || 'certificate').replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to download certificate.');
    }
  };

  const handleSaveCourse = async (event) => {
    event.preventDefault();
    setIsSavingCourse(true);
    setError('');

    try {
      await updateCourse(courseId, {
        ...courseForm,
        validity_months: Number(courseForm.validity_months),
        pass_score: Number(courseForm.pass_score),
      });
      await loadCourseWorkspace(activeModuleId, activeLessonId);
    } catch (saveError) {
      setError(saveError.message || 'Unable to update course details.');
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleSaveModule = async (event) => {
    event.preventDefault();
    setIsSavingModule(true);
    setError('');

    try {
      if (editingModuleId) {
        await updateModule(editingModuleId, {
          title: moduleForm.title,
          description: moduleForm.description,
          order_index: Number(moduleForm.order_index),
        });
      } else {
        await createModule({
          course_id: Number(courseId),
          title: moduleForm.title,
          description: moduleForm.description,
          order_index: Number(moduleForm.order_index),
        });
      }

      setModuleForm(emptyModuleForm);
      setEditingModuleId(null);
      await loadCourseWorkspace(activeModuleId);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save module.');
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and its lessons?')) {
      return;
    }

    try {
      await deleteModule(moduleId);
      setModuleForm(emptyModuleForm);
      setEditingModuleId(null);
      await loadCourseWorkspace();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete module.');
    }
  };

  const handleSaveLesson = async (event) => {
    event.preventDefault();

    if (!activeModuleId) {
      setError('Select or create a module first before adding lessons.');
      return;
    }

    setIsSavingLesson(true);
    setError('');

    try {
      if (editingLessonId) {
        await updateLesson(editingLessonId, {
          title: lessonForm.title,
          content_type: lessonForm.content_type,
          content_url: lessonForm.content_url,
          duration_minutes: Number(lessonForm.duration_minutes),
          order_index: Number(lessonForm.order_index),
        });
      } else {
        await createLesson({
          module_id: activeModuleId,
          title: lessonForm.title,
          content_type: lessonForm.content_type,
          content_url: lessonForm.content_url,
          duration_minutes: Number(lessonForm.duration_minutes),
          order_index: Number(lessonForm.order_index),
        });
      }

      setLessonForm(emptyLessonForm);
      setEditingLessonId(null);
      await loadCourseWorkspace(activeModuleId, activeLessonId);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save lesson.');
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) {
      return;
    }

    try {
      await deleteLesson(lessonId);
      setLessonForm(emptyLessonForm);
      setEditingLessonId(null);
      await loadCourseWorkspace(activeModuleId);
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete lesson.');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title={course?.title || 'Course'}
        subtitle={course?.role_target || course?.status || 'Training'}
        action={
          <button
            onClick={() => navigate('/app/courses')}
            className="px-3 py-2 text-xs rounded-xl2 border border-olive/30 text-olive-dark hover:bg-olive hover:text-beige transition-colors"
          >
            Back to courses
          </button>
        }
      />

      {error && (
        <div className="rounded-xl2 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="glass rounded-[28px] p-4 border border-white/35 shadow-xl flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-olive/60">Session time:</span>
          <span className="font-semibold text-olive-dark">{formatClock(sessionSeconds)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-olive/60">Total spent:</span>
          <span className="font-semibold text-olive-dark">{formatClock(secondsSpent)}</span>
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className="flex justify-between text-[11px] text-olive/70 mb-1">
            <span>Overall lesson progress</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/35 overflow-hidden">
            <div
              className="h-full rounded-full bg-olive transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="relative min-h-[760px] overflow-hidden rounded-[32px] glass-strong p-4">
        <div
          className="absolute left-0 top-0 z-20 h-full w-10"
          onMouseEnter={() => setTreeOpen(true)}
        />
        <div
          className="absolute right-0 top-0 z-20 h-full w-10"
          onMouseEnter={() => setChatOpen(true)}
        />

        <motion.aside
          animate={treeOpen ? 'openLeft' : 'closedLeft'}
          className={`absolute left-0 top-0 z-30 h-full w-[28rem] rounded-r-[30px] p-4 ${edgePanelClass}`}
          initial={false}
          onMouseEnter={() => setTreeOpen(true)}
          onMouseLeave={() => setTreeOpen(false)}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          variants={panelVariants}
        >
          <div className="h-full flex flex-col">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#26331a]/60">Knowledge Tree</p>
              <h3 className="mt-1 text-lg font-semibold text-[#26331a]">Learning map</h3>
            </div>

            <div className="min-h-0 flex-1">
              {aiCourse ? (
                <LayerLearnTree
                  course={aiCourse}
                  selectedTopicId={selectedTopicId}
                  onSelectTopic={setSelectedTopicId}
                />
              ) : (
                <div className="glass-subtle rounded-[24px] h-full flex items-center justify-center text-sm text-[#26331a]/70">
                  {loading ? 'Generating course tree...' : 'No tree available yet.'}
                </div>
              )}
            </div>
          </div>
        </motion.aside>

        <motion.aside
          animate={chatOpen ? 'openRight' : 'closedRight'}
          className={`absolute right-0 top-0 z-30 h-full w-[26rem] rounded-l-[30px] p-4 ${edgePanelClass}`}
          initial={false}
          onMouseEnter={() => setChatOpen(true)}
          onMouseLeave={() => setChatOpen(false)}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          variants={panelVariants}
        >
          <div className="h-full">
            {aiCourse ? (
              <LayerLearnCoach
                course={aiCourse}
                selectedTopic={selectedTopic}
                onJumpToTopic={setSelectedTopicId}
              />
            ) : (
              <div className="glass-subtle rounded-[24px] h-full flex items-center justify-center text-sm text-[#26331a]/70">
                Loading AI coach...
              </div>
            )}
          </div>
        </motion.aside>

        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex justify-between items-center gap-4">
            <div className="glass-subtle rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#26331a]">
              Course workspace
            </div>
            <div className="hidden md:flex gap-2">
              <button
                className="glass-subtle rounded-full px-4 py-2 text-xs font-semibold text-[#26331a] hover:bg-white/30"
                onMouseEnter={() => setTreeOpen(true)}
                type="button"
              >
                Open tree
              </button>
              <button
                className="glass-subtle rounded-full px-4 py-2 text-xs font-semibold text-[#26331a] hover:bg-white/30"
                onMouseEnter={() => setChatOpen(true)}
                type="button"
              >
                Open chat
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[28px] glass p-8 text-sm text-olive/70">
              Loading course workspace...
            </div>
          ) : (
            <div className="grid lg:grid-cols-[280px,1fr] gap-6">
              <div className="glass rounded-[28px] overflow-hidden lift">
                <div className="px-4 py-3 border-b border-white/25 bg-white/12">
                  <p className="text-xs font-semibold text-olive-dark uppercase tracking-[0.15em]">
                    Modules ({modules.length})
                  </p>
                </div>
                <div className="divide-y divide-white/15">
                  {modules.map((module) => {
                    const lessons = moduleLessons[module.id] || [];
                    const moduleCompleted =
                      lessons.length > 0 && lessons.every((lesson) => lesson.completed);

                    return (
                      <button
                        key={module.id}
                        onClick={() => {
                          setActiveModuleId(module.id);
                          setActiveLessonId((lessons[0] || {}).id || null);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                          activeModuleId === module.id ? 'bg-white/20' : 'hover:bg-white/14'
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                            moduleCompleted
                              ? 'bg-emerald-500 text-white'
                              : activeModuleId === module.id
                                ? 'bg-olive text-white'
                                : 'bg-white/40 border border-olive/20 text-olive/50'
                          }`}
                        >
                          {moduleCompleted ? 'OK' : module.order_index || module.id}
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${moduleCompleted ? 'text-olive/60' : 'text-olive-dark'}`}>
                            {module.title}
                          </p>
                          <p className="text-[11px] text-olive/50 mt-0.5">
                            {lessons.length} lessons
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="glass rounded-[30px] flex flex-col">
                <div className="px-6 py-4 border-b border-white/20 bg-white/10">
                  <p className="text-sm font-semibold text-olive-dark">{activeModule?.title || 'Select a module'}</p>
                  <p className="text-xs text-olive/60 mt-0.5">
                    {activeLesson ? `${activeLesson.title} • ${activeLesson.duration_minutes || 0} min` : 'No lessons available'}
                  </p>
                </div>

                <div className="mx-4 mt-4 flex gap-2 overflow-x-auto pb-2">
                  {activeLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLessonId(lesson.id)}
                      className={`rounded-full px-3 py-2 text-xs transition-colors ${
                        activeLessonId === lesson.id
                          ? 'bg-olive text-beige'
                          : 'bg-white/55 text-olive-dark hover:bg-white/80'
                      }`}
                    >
                      {lesson.title}
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-h-[340px] flex flex-col gap-4 m-4 rounded-[26px] glass-subtle border border-white/20 p-6">
                  {activeLesson ? (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-olive-dark">{activeLesson.title}</p>
                        <p className="mt-1 text-xs text-olive/55">
                          Type: {activeLesson.content_type || 'Material'} • Duration: {activeLesson.duration_minutes || 0} min
                        </p>
                      </div>

                      {contentUrl ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs text-olive/60">
                              Lesson material is opened below inside this page.
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setMaterialModalOpen(true)}
                                className="inline-flex rounded-full border border-olive/20 bg-white px-4 py-2 text-xs font-semibold text-olive-dark shadow-sm hover:bg-olive/5"
                              >
                                Open in window within
                              </button>
                              <a
                                href={contentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded-full border border-olive/20 bg-white px-4 py-2 text-xs font-semibold text-olive-dark shadow-sm hover:bg-olive/5"
                              >
                                Open in new tab
                              </a>
                              <button
                                onClick={handleGenerateQuiz}
                                className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 shadow-sm hover:bg-violet-100 transition-colors"
                              >
                                ✦ Generate AI Quiz
                              </button>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-[22px] border border-white/30 bg-white/85 shadow-inner">
                            {isVideoContent ? (
                              <video
                                controls
                                src={contentUrl}
                                className="h-[360px] w-full bg-black"
                              />
                            ) : (
                              <iframe
                                key={contentUrl}
                                src={contentUrl}
                                title={activeLesson.title}
                                className="h-[420px] w-full bg-white"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-olive/60">
                          No content URL is attached to this lesson yet. Add one from the admin section below.
                        </p>
                      )}

                      {isLearner && (
                        <div className="grid gap-3 rounded-2xl bg-white/60 p-4 text-xs text-olive-dark md:grid-cols-3">
                          <div>
                            <p className="text-olive/50">Started</p>
                            <p className="font-semibold">{activeLesson.opened_at ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <p className="text-olive/50">Can complete</p>
                            <p className="font-semibold">{activeLesson.can_complete ? 'Yes' : 'Not yet'}</p>
                          </div>
                          <div>
                            <p className="text-olive/50">Remaining</p>
                            <p className="font-semibold">{activeLesson.remaining_seconds || 0}s</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-olive/60">
                      No lessons available for this module yet.
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-white/20 flex items-center justify-between gap-4">
                  <p className="text-xs text-olive/60">
                    {isLearner
                      ? 'Lesson progress is now tracked from the backend.'
                      : 'You are viewing the live course structure from the backend.'}
                  </p>
                  {isLearner && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCompleteCourse}
                        className="px-4 py-2 text-xs rounded-xl2 border border-olive/25 text-olive-dark hover:bg-white/60 transition-colors"
                      >
                        Complete Course
                      </button>
                      {activeLesson && (
                        <button
                          onClick={handleStartLesson}
                          className="px-4 py-2 text-xs rounded-xl2 border border-olive/25 text-olive-dark hover:bg-white/60 transition-colors"
                        >
                          Start lesson
                        </button>
                      )}
                      {activeLesson && !activeLesson.completed && (
                        <button
                          onClick={handleCompleteLesson}
                          className="px-4 py-2 text-xs rounded-xl2 bg-olive text-beige hover:bg-olive-dark transition-colors"
                        >
                          Mark complete
                        </button>
                      )}
                      {earnedCertificate && (
                        <button
                          onClick={handleDownloadCourseCertificate}
                          className="px-4 py-2 text-xs rounded-xl2 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        >
                          Download certificate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {materialModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 sm:p-8 backdrop-blur-sm">
          <div className="w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-olive-dark">{activeLesson?.title || 'Material'}</h3>
              <button 
                onClick={() => setMaterialModalOpen(false)} 
                className="px-4 py-2 text-xs rounded-xl2 bg-olive/10 text-olive hover:bg-olive/20 transition-colors font-semibold"
              >
                Close window
              </button>
            </div>
            <div className="flex-1 bg-gray-100 overflow-hidden relative">
              {isVideoContent ? (
                <video controls src={contentUrl} className="w-full h-full object-contain bg-black" />
              ) : (
                <iframe src={contentUrl} title="Material Window" className="w-full h-full border-none bg-white" />
              )}
            </div>
          </div>
        </div>
      )}

      {quizModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 sm:p-8 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden my-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-xl text-olive-dark">AI Lesson Quiz</h3>
              <button 
                onClick={() => setQuizModalOpen(false)} 
                className="px-4 py-2 text-xs rounded-xl2 bg-olive/10 text-olive hover:bg-olive/20 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {generatingQuiz ? (
                <div className="py-12 flex flex-col items-center justify-center text-olive/60">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive mb-4"></div>
                  <p>Generating an AI quiz for {activeLesson?.title}...</p>
                </div>
              ) : quizError ? (
                <div className="py-12 text-center text-rose-500">
                  <p className="font-semibold text-lg mb-2">Error Generating Quiz</p>
                  <p>{quizError}</p>
                </div>
              ) : quizData && quizData.questions ? (
                <div className="space-y-8">
                  {quizData.assessmentSummary && (
                    <div className="rounded-xl2 border border-olive/10 bg-olive/5 p-4 text-sm text-olive-dark">
                      <p className="font-semibold">Tree-based scenario assessment</p>
                      <p className="mt-1 text-olive/70">{quizData.assessmentSummary}</p>
                    </div>
                  )}
                  {quizData.questions.map((q, qIndex) => (
                    <div key={qIndex} className="space-y-3">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-olive/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-olive">
                            {q.questionType || 'scenario'}
                          </span>
                          {q.treeTopicTitle && (
                            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
                              Repeat: {q.treeTopicTitle}
                            </span>
                          )}
                        </div>
                        {q.scenario && (
                          <div className="mb-3 rounded-xl2 border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-900">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Scenario</p>
                            <p className="mt-1">{q.scenario}</p>
                          </div>
                        )}
                        <p className="font-semibold text-olive-dark">{qIndex + 1}. {q.question}</p>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, optIndex) => {
                          const isSelected = quizAnswers[qIndex] === optIndex;
                          const isCorrect = optIndex === q.answerIndex;
                          const showResult = quizScoreVisible;
                          
                          let bgClass = "bg-white border-gray-200 hover:border-olive/40";
                          if (isSelected) bgClass = "bg-olive/5 border-olive";
                          
                          if (showResult) {
                            if (isCorrect) bgClass = "bg-emerald-50 border-emerald-500 text-emerald-800";
                            else if (isSelected && !isCorrect) bgClass = "bg-rose-50 border-rose-500 text-rose-800";
                            else bgClass = "bg-white border-gray-200 opacity-60";
                          }
                          
                          return (
                            <button
                              key={optIndex}
                              disabled={showResult}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [qIndex]: optIndex }))}
                              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${bgClass}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {quizScoreVisible && (
                        <div className="mt-2 space-y-2">
                          <div className="p-3 bg-olive/5 rounded-xl text-xs text-olive-dark">
                            <span className="font-semibold">Explanation:</span> {q.explanation}
                          </div>
                          {quizAnswers[qIndex] !== q.answerIndex && q.remediation && (
                            <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800">
                              <p className="font-semibold">Where to repeat: {q.remediation.repeatTopicTitle || q.treeTopicTitle}</p>
                              <p className="mt-1">{q.remediation.whereLearnersGoWrong}</p>
                              {q.remediation.repeatPlan?.length > 0 && (
                                <ul className="mt-2 list-disc space-y-1 pl-4">
                                  {q.remediation.repeatPlan.slice(0, 3).map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {!quizScoreVisible ? (
                     <div className="pt-4 border-t border-gray-100">
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={quizSaving || Object.keys(quizAnswers).length < quizData.questions.length}
                        className="w-full py-3 rounded-xl2 bg-olive text-beige font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {quizSaving ? 'Saving score...' : 'Submit Answers'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 rounded-xl2 border border-emerald-200 bg-emerald-50 p-6 mt-6">
                      <p className="font-semibold text-emerald-800 text-xl">
                        Score: {Object.keys(quizAnswers).filter(k => quizAnswers[k] === quizData.questions[k].answerIndex).length} / {quizData.questions.length}
                      </p>
                      {quizSaved && (
                        <p className="mt-2 text-xs text-emerald-700">
                          Saved for your certificate.
                        </p>
                      )}
                      {quizData.repeatRecommendations?.length > 0 && (
                        <div className="rounded-xl bg-white/70 p-4 text-left text-sm text-olive-dark">
                          <p className="font-semibold">Recommended repeat areas</p>
                          <div className="mt-3 space-y-3">
                            {quizData.repeatRecommendations.slice(0, 3).map((item) => (
                              <div key={`${item.topicId || item.topicTitle}-${item.reason}`}>
                                <p className="font-semibold text-olive-dark">{item.topicTitle}</p>
                                <p className="text-xs text-olive/70">{item.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-rose-500">
                  <p>Failed to load quiz data.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {canManage && course && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
          <form onSubmit={handleSaveCourse} className="rounded-[30px] glass p-6 space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-olive/60">Admin</p>
              <h3 className="mt-1 text-xl font-semibold text-olive-dark">Course details</h3>
            </div>

            <label className="block space-y-2 text-sm text-olive-dark">
              <span className="font-semibold">Course title</span>
              <input
                value={courseForm.title}
                onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
              />
            </label>

            <label className="block space-y-2 text-sm text-olive-dark">
              <span className="font-semibold">Description</span>
              <textarea
                value={courseForm.description}
                onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[110px] w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 text-sm text-olive-dark">
                <span className="font-semibold">Role target</span>
                <input
                  value={courseForm.role_target}
                  onChange={(event) => setCourseForm((current) => ({ ...current, role_target: event.target.value }))}
                  className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                />
              </label>
              <label className="block space-y-2 text-sm text-olive-dark">
                <span className="font-semibold">Status</span>
                <select
                  value={courseForm.status}
                  onChange={(event) => setCourseForm((current) => ({ ...current, status: event.target.value }))}
                  className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                >
                  <option value="active">active</option>
                  <option value="draft">draft</option>
                  <option value="completed">completed</option>
                </select>
              </label>
              <label className="block space-y-2 text-sm text-olive-dark">
                <span className="font-semibold">Validity months</span>
                <input
                  type="number"
                  min="1"
                  value={courseForm.validity_months}
                  onChange={(event) => setCourseForm((current) => ({ ...current, validity_months: event.target.value }))}
                  className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                />
              </label>
              <label className="block space-y-2 text-sm text-olive-dark">
                <span className="font-semibold">Pass score</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={courseForm.pass_score}
                  onChange={(event) => setCourseForm((current) => ({ ...current, pass_score: event.target.value }))}
                  className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingCourse}
                className="rounded-xl2 bg-olive px-4 py-2 text-xs font-semibold text-beige transition-colors hover:bg-olive-dark disabled:opacity-60"
              >
                {isSavingCourse ? 'Saving...' : 'Save course'}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="rounded-[30px] glass p-6 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-olive/60">Admin</p>
                <h3 className="mt-1 text-xl font-semibold text-olive-dark">Manage modules</h3>
              </div>

              <div className="space-y-3">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="rounded-2xl border border-olive/10 bg-white/60 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-olive-dark">{module.title}</p>
                        <p className="mt-1 text-xs text-olive/60">{module.description || 'No description yet.'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingModuleId(module.id);
                            setModuleForm({
                              title: module.title,
                              description: module.description || '',
                              order_index: module.order_index || 1,
                            });
                          }}
                          className="rounded-full border border-olive/20 px-3 py-1 text-[11px] text-olive-dark"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(module.id)}
                          className="rounded-full border border-rose-200 px-3 py-1 text-[11px] text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSaveModule} className="grid gap-3">
                <label className="space-y-2 text-sm text-olive-dark">
                  <span className="font-semibold">Module title</span>
                  <input
                    value={moduleForm.title}
                    onChange={(event) => setModuleForm((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-olive-dark">
                  <span className="font-semibold">Module description</span>
                  <textarea
                    value={moduleForm.description}
                    onChange={(event) => setModuleForm((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-[90px] w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-olive-dark">
                  <span className="font-semibold">Module order</span>
                  <input
                    type="number"
                    min="1"
                    value={moduleForm.order_index}
                    onChange={(event) => setModuleForm((current) => ({ ...current, order_index: event.target.value }))}
                    className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                  />
                </label>
                <div className="flex items-center justify-end gap-3">
                  {editingModuleId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingModuleId(null);
                        setModuleForm(emptyModuleForm);
                      }}
                      className="rounded-xl2 border border-olive/20 px-4 py-2 text-xs text-olive-dark"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingModule}
                    className="rounded-xl2 bg-olive px-4 py-2 text-xs font-semibold text-beige transition-colors hover:bg-olive-dark disabled:opacity-60"
                  >
                    {isSavingModule
                      ? 'Saving...'
                      : editingModuleId
                        ? 'Update module'
                        : 'Add module'}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-[30px] glass p-6 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-olive/60">Admin</p>
                <h3 className="mt-1 text-xl font-semibold text-olive-dark">Manage lessons</h3>
                <p className="mt-1 text-xs text-olive/55">
                  {activeModule ? `Editing lessons for ${activeModule.title}` : 'Select a module first.'}
                </p>
              </div>

              <div className="space-y-3">
                {activeLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="rounded-2xl border border-olive/10 bg-white/60 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-olive-dark">{lesson.title}</p>
                        <p className="mt-1 text-xs text-olive/60">
                          {lesson.content_type || 'material'} • {lesson.duration_minutes || 0} min
                        </p>
                        <p className="mt-1 text-xs text-olive/45 break-all">
                          {lesson.content_url || 'No content URL yet.'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLessonId(lesson.id);
                            setLessonForm({
                              title: lesson.title,
                              content_type: lesson.content_type || 'video',
                              content_url: lesson.content_url || '',
                              duration_minutes: lesson.duration_minutes || 10,
                              order_index: lesson.order_index || 1,
                            });
                          }}
                          className="rounded-full border border-olive/20 px-3 py-1 text-[11px] text-olive-dark"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="rounded-full border border-rose-200 px-3 py-1 text-[11px] text-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSaveLesson} className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2 text-sm text-olive-dark md:col-span-2">
                  <span className="font-semibold">Lesson title</span>
                  <input
                    value={lessonForm.title}
                    onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-olive-dark">
                  <span className="font-semibold">Content type</span>
                  <input
                    value={lessonForm.content_type}
                    onChange={(event) => setLessonForm((current) => ({ ...current, content_type: event.target.value }))}
                    className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-olive-dark">
                  <span className="font-semibold">Duration minutes</span>
                  <input
                    type="number"
                    min="1"
                    value={lessonForm.duration_minutes}
                    onChange={(event) => setLessonForm((current) => ({ ...current, duration_minutes: event.target.value }))}
                    className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-olive-dark md:col-span-2">
                  <span className="font-semibold">Content URL</span>
                  <input
                    value={lessonForm.content_url}
                    onChange={(event) => setLessonForm((current) => ({ ...current, content_url: event.target.value }))}
                    className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                  />
                </label>
                <label className="space-y-2 text-sm text-olive-dark">
                  <span className="font-semibold">Lesson order</span>
                  <input
                    type="number"
                    min="1"
                    value={lessonForm.order_index}
                    onChange={(event) => setLessonForm((current) => ({ ...current, order_index: event.target.value }))}
                    className="w-full rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 focus:outline-none"
                  />
                </label>
                <div className="md:col-span-2 flex items-center justify-end gap-3">
                  {editingLessonId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLessonId(null);
                        setLessonForm(emptyLessonForm);
                      }}
                      className="rounded-xl2 border border-olive/20 px-4 py-2 text-xs text-olive-dark"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingLesson || !activeModule}
                    className="rounded-xl2 bg-olive px-4 py-2 text-xs font-semibold text-beige transition-colors hover:bg-olive-dark disabled:opacity-60"
                  >
                    {isSavingLesson
                      ? 'Saving...'
                      : editingLessonId
                        ? 'Update lesson'
                        : 'Add lesson'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
