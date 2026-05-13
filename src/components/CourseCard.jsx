export default function CourseCard({ title, level, due, progress, completed, timeSpent, totalTime, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-off-white rounded-xl2 p-4 border shadow-soft transition-all flex flex-col gap-3 ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-olive/40' : ''
      } ${completed ? 'border-emerald-200' : 'border-olive/10'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-olive-dark">{title}</p>
          <p className="text-xs text-olive/70 mt-0.5">{level}</p>
        </div>
        {completed ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">
            ✓ Completed
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent whitespace-nowrap">
            Due {due}
          </span>
        )}
      </div>

      <div>
        <div className="flex justify-between text-[11px] text-olive/70 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-beige overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${completed ? 'bg-emerald-500' : 'bg-olive'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {(timeSpent !== undefined) && (
        <div className="flex items-center justify-between text-[11px] text-olive/60 border-t border-olive/5 pt-2">
          <span>⏱ {timeSpent} min spent</span>
          {totalTime && <span className="text-olive/40">of {totalTime} min</span>}
        </div>
      )}
    </div>
  );
}
