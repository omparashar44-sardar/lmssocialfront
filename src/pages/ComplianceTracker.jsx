import { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import {
  downloadComplianceReport,
  getDashboardCompliance,
  getEmployeeTrainingSummary,
  getEmployees,
} from '../services/lms.js';

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const getRowStatus = (summary) => {
  if (Number(summary.overdue_courses) > 0) {
    return 'Overdue';
  }

  if (Number(summary.expiring_soon_courses) > 0) {
    return 'At risk';
  }

  return 'Compliant';
};

const statusStyle = {
  Compliant: 'bg-emerald-100 text-emerald-700',
  'At risk': 'bg-amber-100 text-amber-700',
  Overdue: 'bg-rose-100 text-rose-700',
};

const statusDot = {
  Compliant: 'bg-emerald-500',
  'At risk': 'bg-amber-400',
  Overdue: 'bg-rose-500',
};

export default function ComplianceTracker() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCompliance = async () => {
      setLoading(true);
      setError('');

      try {
        const [companySummary, employees] = await Promise.all([
          getDashboardCompliance(),
          getEmployees(),
        ]);

        const details = await Promise.all(
          employees.map(async (employee) => {
            const training = await getEmployeeTrainingSummary(employee.id);
            return {
              id: employee.id,
              name: employee.name,
              email: employee.email,
              summary: training.summary || {},
              courses: training.courses || [],
            };
          })
        );

        setSummary(companySummary);
        setRows(details);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load compliance data.');
      } finally {
        setLoading(false);
      }
    };

    loadCompliance();
  }, []);

  const filtered = rows.filter((row) => {
    const rowStatus = getRowStatus(row.summary);
    return statusFilter === 'All' || rowStatus === statusFilter;
  });

  const handleExport = async () => {
    try {
      const blob = await downloadComplianceReport();
      downloadBlob(blob, 'compliance_report.csv');
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to export compliance report.');
    }
  };

  const overallPct =
    summary && Number(summary.totalEmployees) > 0
      ? Math.round((Number(summary.compliant) / Number(summary.totalEmployees)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Compliance tracker"
        subtitle="Live learner compliance"
        action={
          <button
            onClick={handleExport}
            className="px-3 py-2 text-xs rounded-xl2 border border-olive/30 text-olive-dark hover:bg-olive hover:text-beige transition-colors"
          >
            Export CSV
          </button>
        }
      />

      {error && (
        <div className="rounded-xl2 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-off-white rounded-xl2 p-4 border border-olive/10 shadow-soft">
          <p className="text-xs text-olive/60 uppercase tracking-[0.15em]">Overall compliance</p>
          <p className="text-2xl font-semibold text-olive-dark mt-1">{overallPct}%</p>
        </div>
        <div className="bg-emerald-50 rounded-xl2 p-4 border border-emerald-100 shadow-soft">
          <p className="text-xs text-emerald-600 uppercase tracking-[0.15em]">Fully compliant</p>
          <p className="text-2xl font-semibold text-emerald-700 mt-1">
            {summary ? Number(summary.compliant) : 0}
          </p>
        </div>
        <div className="bg-amber-50 rounded-xl2 p-4 border border-amber-100 shadow-soft">
          <p className="text-xs text-amber-600 uppercase tracking-[0.15em]">At risk</p>
          <p className="text-2xl font-semibold text-amber-700 mt-1">
            {summary ? Number(summary.expiringSoon) : 0}
          </p>
        </div>
        <div className="bg-rose-50 rounded-xl2 p-4 border border-rose-100 shadow-soft">
          <p className="text-xs text-rose-600 uppercase tracking-[0.15em]">Overdue</p>
          <p className="text-2xl font-semibold text-rose-700 mt-1">
            {summary ? Number(summary.overdue) : 0}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {['All', 'Compliant', 'At risk', 'Overdue'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === status
                ? 'bg-olive text-beige'
                : 'bg-off-white border border-olive/15 text-olive-dark hover:border-olive/40'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-off-white rounded-xl2 border border-olive/10 shadow-soft overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-beige/70 text-olive/70">
            <tr>
              <th className="px-4 py-3 font-medium">Learner</th>
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 font-medium">Completed</th>
              <th className="px-4 py-3 font-medium">Expiring soon</th>
              <th className="px-4 py-3 font-medium">Overdue</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const rowStatus = getRowStatus(row.summary);

              return (
                <tr key={row.id} className="border-b border-olive/5 hover:bg-beige/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-olive-dark">{row.name}</p>
                    <p className="text-olive/60">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-olive-dark">{Number(row.summary.assigned_courses || 0)}</td>
                  <td className="px-4 py-3 text-olive-dark">{Number(row.summary.completed_courses || 0)}</td>
                  <td className="px-4 py-3 text-olive-dark">{Number(row.summary.expiring_soon_courses || 0)}</td>
                  <td className="px-4 py-3 text-olive-dark">{Number(row.summary.overdue_courses || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full w-fit ${statusStyle[rowStatus]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot[rowStatus]}`} />
                      {rowStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-olive/40">
            No learners match the selected compliance filter.
          </div>
        )}
        {loading && (
          <div className="py-10 text-center text-sm text-olive/40">
            Loading compliance data...
          </div>
        )}
      </div>
    </div>
  );
}
