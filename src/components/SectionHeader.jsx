export default function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-olive/60">{subtitle}</p>
        <h1 className="text-xl md:text-2xl font-semibold text-olive-dark mt-1">
          {title}
        </h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}