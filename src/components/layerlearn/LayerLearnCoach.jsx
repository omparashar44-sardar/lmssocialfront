import { useState } from 'react';
import { askLayerLearnCoach } from '../../services/layerlearn.js';

export default function LayerLearnCoach({ course, selectedTopic, onJumpToTopic }) {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async (nextMessage) => {
    if (!nextMessage.trim()) {
      return;
    }

    const trimmedMessage = nextMessage.trim();
    setError('');
    setHistory((current) => [
      ...current,
      { role: 'user', message: trimmedMessage },
    ]);
    setLoading(true);

    try {
      const reply = await askLayerLearnCoach(course.id, {
        message: trimmedMessage,
        topicId: selectedTopic?.id || null,
      });

      setHistory((current) => [
        ...current,
        {
          role: 'assistant',
          message: reply.answer,
          citations: reply.citations || [],
          mode: reply.mode || 'backend',
        },
      ]);

      if (reply.recommendedTopicId) {
        onJumpToTopic(reply.recommendedTopicId);
      }

      setMessage('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to get a response right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col glass-subtle rounded-[24px] border border-white/25 p-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#26331a]/60">AI support</p>
        <h3 className="mt-1 text-lg font-semibold text-[#26331a]">Ask your doubt</h3>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-[20px] bg-white/18 p-3">
        {history.length ? (
          history.map((entry, index) => (
            <div
              key={`${entry.role}-${index}`}
              className={`rounded-[20px] px-4 py-3 text-sm ${
                entry.role === 'user'
                  ? 'ml-8 bg-[#26331a]/85 text-white'
                  : 'bg-white/65 text-[#26331a] border border-white/30'
              }`}
            >
              <p className="leading-6">{entry.message}</p>
              {entry.role === 'assistant' && entry.mode ? (
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#26331a]/45">
                  {entry.mode === 'gemini' ? 'Gemini response' : 'Backend response'}
                </p>
              ) : null}
              {entry.citations?.length ? (
                <div className="mt-3 border-t border-[#26331a]/10 pt-3 text-xs text-[#26331a]/70">
                  {entry.citations.map((citation) => (
                    <div key={citation.label}>
                      <strong>{citation.label}:</strong> {citation.summary}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-[20px] border border-dashed border-white/30 bg-white/35 px-4 py-4 text-sm text-[#26331a]/70">
            Ask about the current topic, a prerequisite, or what to learn next. Replies come from the backend course coach.
          </div>
        )}
      </div>

      {error ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(message);
        }}
      >
        <input
          className="flex-1 rounded-2xl border border-white/30 bg-white/35 px-4 py-3 text-sm text-[#26331a] focus:outline-none focus:ring-2 focus:ring-[#556b2f]/30"
          placeholder={`Ask about ${selectedTopic?.title || 'this course'}`}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button
          className="rounded-2xl bg-[#26331a]/90 px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#334524] disabled:bg-[#26331a]/40"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
