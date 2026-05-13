import { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import UserRow from '../components/UserRow.jsx';
import { createEmployee, getEmployeeTrainingSummary, getEmployees } from '../services/lms.js';

const defaultForm = {
  name: '',
  email: '',
  password: '',
};

const getStatusFromSummary = (summary) => {
  if (Number(summary.overdue_courses) > 0) {
    return 'At risk';
  }

  if (Number(summary.expiring_soon_courses) > 0) {
    return 'Attention';
  }

  return 'Compliant';
};

export default function Users() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const employees = await getEmployees();
      const summaries = await Promise.all(
        employees.map(async (employee) => {
          const training = await getEmployeeTrainingSummary(employee.id);
          return { employee, training };
        })
      );

      setUsers(
        summaries.map(({ employee, training }) => {
          const summary = training.summary || {};
          const assignedCourses = Number(summary.assigned_courses || 0);
          const completedCourses = Number(summary.completed_courses || 0);
          const overdueCourses = Number(summary.overdue_courses || 0);
          const completionRate = assignedCourses
            ? Math.round((completedCourses / assignedCourses) * 100)
            : 0;

          return {
            id: employee.id,
            name: employee.name,
            role: employee.email,
            status: getStatusFromSummary(summary),
            courses: `${assignedCourses} assigned • ${overdueCourses} overdue`,
            completionRate,
          };
        })
      );
    } catch (loadError) {
      setError(loadError.message || 'Unable to load learners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInvite = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await createEmployee(form);
      setForm(defaultForm);
      setShowInviteForm(false);
      await loadUsers();
    } catch (inviteError) {
      setError(inviteError.message || 'Unable to create learner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = users.filter((user) => {
    const matchSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.role.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All statuses' || user.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Learners & teams"
        subtitle="Users"
        action={
          <button
            onClick={() => setShowInviteForm((current) => !current)}
            className="px-3 py-2 text-xs rounded-xl2 bg-olive text-beige hover:bg-olive-dark transition-colors"
          >
            {showInviteForm ? 'Close form' : 'Invite learner'}
          </button>
        }
      />

      {error && (
        <div className="rounded-xl2 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {showInviteForm && (
        <form
          onSubmit={handleInvite}
          className="grid gap-3 rounded-[28px] glass p-5 md:grid-cols-3"
        >
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Learner name"
            required
            className="rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 text-sm text-olive-dark focus:outline-none"
          />
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="Email address"
            required
            className="rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 text-sm text-olive-dark focus:outline-none"
          />
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Temporary password"
            required
            className="rounded-xl2 border border-olive/15 bg-white/70 px-4 py-3 text-sm text-olive-dark focus:outline-none"
          />
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl2 bg-olive px-4 py-2 text-xs font-semibold text-beige transition-colors hover:bg-olive-dark disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create learner'}
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-3 flex-wrap text-xs">
        <div className="px-3 py-2 rounded-xl2 bg-off-white border border-olive/10 shadow-soft flex items-center gap-2">
          <span className="text-olive/60">Total learners:</span>
          <span className="font-semibold text-olive-dark">{users.length}</span>
        </div>
        <div className="px-3 py-2 rounded-xl2 bg-emerald-50 border border-emerald-100 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-emerald-700 font-medium">
            {users.filter((user) => user.status === 'Compliant').length} compliant
          </span>
        </div>
        <div className="px-3 py-2 rounded-xl2 bg-amber-50 border border-amber-100 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-amber-700 font-medium">
            {users.filter((user) => user.status === 'At risk').length} at risk
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by learner name or email..."
          className="px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark focus:outline-none focus:ring-2 focus:ring-olive/30 text-xs"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark text-xs focus:outline-none"
        >
          <option>All statuses</option>
          <option>Compliant</option>
          <option>At risk</option>
          <option>Attention</option>
        </select>
      </div>

      <div className="bg-off-white rounded-xl2 border border-olive/10 shadow-soft overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-beige/70 text-olive/70">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Role / Site</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Courses</th>
              <th className="px-3 py-2 font-medium">Time spent</th>
              <th className="px-3 py-2 font-medium">Completion</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <UserRow key={user.id} {...user} />
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-10 text-olive/40 text-sm">
            No learners match your search.
          </div>
        )}
        {loading && (
          <div className="text-center py-10 text-olive/40 text-sm">
            Loading learners...
          </div>
        )}
      </div>
    </div>
  );
}
