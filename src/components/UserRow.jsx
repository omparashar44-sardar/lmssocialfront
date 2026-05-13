export default function UserRow({ name, role, status, courses, timeSpent, completionRate }) {
  const statusColor =
    status === 'Compliant'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'At risk'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-rose-100 text-rose-700';

  return (
    <tr className="border-b border-olive/5 hover:bg-beige/40 transition-colors">
      <td className="px-3 py-3 text-sm text-olive-dark font-medium">{name}</td>
      <td className="px-3 py-3 text-xs text-olive/80">{role}</td>
      <td className="px-3 py-3">
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusColor}`}>
          {status}
        </span>
      </td>
      <td className="px-3 py-3 text-xs text-olive/80">{courses}</td>
      <td className="px-3 py-3 text-xs text-olive-dark">{timeSpent || '—'}</td>
      <td className="px-3 py-3">
        {completionRate !== undefined ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 rounded-full bg-beige overflow-hidden w-16">
              <div
                className={`h-full rounded-full ${completionRate === 100 ? 'bg-emerald-500' : 'bg-olive'}`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-[11px] text-olive-dark">{completionRate}%</span>
          </div>
        ) : (
          <span className="text-olive/40">—</span>
        )}
      </td>
    </tr>
  );
}
