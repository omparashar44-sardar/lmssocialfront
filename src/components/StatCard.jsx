export default function StatCard({ label, value, sub, trend }) {
  return (
    <div className="bg-off-white rounded-xl2 p-4 shadow-soft border border-olive/5 hover:-translate-y-1 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-[0.18em] text-olive/60">{label}</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-olive/5 text-olive/70">
          {trend}
        </span>
      </div>
      <p className="text-2xl font-semibold text-olive-dark">{value}</p>
      <p className="text-xs text-olive/70 mt-1">{sub}</p>
    </div>
  );
}
