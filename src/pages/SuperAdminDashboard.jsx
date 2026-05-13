import { useEffect, useMemo, useState } from 'react';
import {
  createSuperAdminAdmin,
  createSuperAdminCompany,
  getSuperAdminAdmins,
  getSuperAdminCompanies,
  getSuperAdminDashboard,
  updateSuperAdminCompany,
} from '../services/lms.js';

const defaultCompanyForm = {
  name: '',
  code: '',
  status: 'active',
};

const defaultAdminForm = {
  name: '',
  email: '',
  password: '',
  company_id: '',
};

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  inactive: 'bg-stone-100 text-stone-600 border-stone-200',
  suspended: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalAdmins: 0,
    totalEmployees: 0,
  });
  const [companies, setCompanies] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [companyForm, setCompanyForm] = useState(defaultCompanyForm);
  const [adminForm, setAdminForm] = useState(defaultAdminForm);
  const [companyFilter, setCompanyFilter] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingCompany, setSubmittingCompany] = useState(false);
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  const loadSuperAdminData = async () => {
    setLoading(true);
    setError('');

    try {
      const [dashboard, companyRows, adminRows] = await Promise.all([
        getSuperAdminDashboard(),
        getSuperAdminCompanies(),
        getSuperAdminAdmins(companyFilter),
      ]);

      setStats(dashboard);
      setCompanies(companyRows);
      setAdmins(adminRows);

      if (!adminForm.company_id && companyRows.length > 0) {
        setAdminForm((current) => ({
          ...current,
          company_id: String(companyRows[0].id),
        }));
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load super admin workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuperAdminData();
    // companyFilter intentionally reloads the admin list when changed.
  }, [companyFilter]);

  const companyHealth = useMemo(() => {
    const activeCompanies = companies.filter((company) => company.status === 'active').length;
    const withoutAdmins = companies.filter((company) => Number(company.admin_count || 0) === 0).length;

    return {
      activeCompanies,
      withoutAdmins,
    };
  }, [companies]);

  const submitCompany = async (event) => {
    event.preventDefault();
    setSubmittingCompany(true);
    setError('');
    setNotice('');

    try {
      await createSuperAdminCompany(companyForm);
      setCompanyForm(defaultCompanyForm);
      setNotice('Company created successfully.');
      await loadSuperAdminData();
    } catch (createError) {
      setError(createError.message || 'Unable to create company.');
    } finally {
      setSubmittingCompany(false);
    }
  };

  const submitAdmin = async (event) => {
    event.preventDefault();
    setSubmittingAdmin(true);
    setError('');
    setNotice('');

    try {
      await createSuperAdminAdmin(adminForm);
      setAdminForm((current) => ({
        ...defaultAdminForm,
        company_id: current.company_id,
      }));
      setNotice('Admin created successfully.');
      await loadSuperAdminData();
    } catch (createError) {
      setError(createError.message || 'Unable to create admin.');
    } finally {
      setSubmittingAdmin(false);
    }
  };

  const toggleCompanyStatus = async (company) => {
    const nextStatus = company.status === 'active' ? 'inactive' : 'active';
    setError('');
    setNotice('');

    try {
      await updateSuperAdminCompany(company.id, { status: nextStatus });
      setNotice(`${company.name} marked ${nextStatus}.`);
      await loadSuperAdminData();
    } catch (updateError) {
      setError(updateError.message || 'Unable to update company status.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="float-in">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#556b2f]">
          Super admin
        </p>
        <h1 className="mt-2 text-5xl font-bold text-[#26331a]">
          Organization Control
        </h1>
        <p className="mt-3 max-w-3xl text-lg text-gray-600">
          Manage companies, assign administrators, and monitor platform coverage across every tenant.
        </p>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {[
          ['Total Companies', stats.totalCompanies],
          ['Total Admins', stats.totalAdmins],
          ['Total Employees', stats.totalEmployees],
        ].map(([label, value], index) => (
          <div key={label} className={`glass rounded-3xl p-8 lift float-in-d${index + 1}`}>
            <p className="text-sm text-gray-500">{label}</p>
            <h2 className="mt-4 text-5xl font-bold text-[#26331a]">
              {loading ? '...' : value}
            </h2>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={submitCompany} className="glass rounded-3xl p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-[#26331a]">Create Company</h2>
            <p className="mt-1 text-sm text-gray-600">Add a tenant that admins and learners can belong to.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={companyForm.name}
              onChange={(event) => setCompanyForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Company name"
              required
              className="rounded-2xl border border-[#556b2f]/15 bg-white/70 px-4 py-3 text-sm text-[#26331a] focus:outline-none focus:ring-2 focus:ring-[#556b2f]/30"
            />
            <input
              value={companyForm.code}
              onChange={(event) => setCompanyForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="Company code"
              required
              className="rounded-2xl border border-[#556b2f]/15 bg-white/70 px-4 py-3 text-sm uppercase text-[#26331a] focus:outline-none focus:ring-2 focus:ring-[#556b2f]/30"
            />
            <select
              value={companyForm.status}
              onChange={(event) => setCompanyForm((current) => ({ ...current, status: event.target.value }))}
              className="rounded-2xl border border-[#556b2f]/15 bg-white/70 px-4 py-3 text-sm text-[#26331a] focus:outline-none focus:ring-2 focus:ring-[#556b2f]/30"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <button
              type="submit"
              disabled={submittingCompany}
              className="rounded-2xl bg-[#26331a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#334524] disabled:opacity-60"
            >
              {submittingCompany ? 'Creating...' : 'Create company'}
            </button>
          </div>
        </form>

        <form onSubmit={submitAdmin} className="glass rounded-3xl p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-[#26331a]">Create Admin</h2>
            <p className="mt-1 text-sm text-gray-600">Give a company its administrator account.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={adminForm.name}
              onChange={(event) => setAdminForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Admin name"
              required
              className="rounded-2xl border border-[#556b2f]/15 bg-white/70 px-4 py-3 text-sm text-[#26331a] focus:outline-none focus:ring-2 focus:ring-[#556b2f]/30"
            />
            <input
              type="email"
              value={adminForm.email}
              onChange={(event) => setAdminForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email address"
              required
              className="rounded-2xl border border-[#556b2f]/15 bg-white/70 px-4 py-3 text-sm text-[#26331a] focus:outline-none focus:ring-2 focus:ring-[#556b2f]/30"
            />
            <input
              type="password"
              value={adminForm.password}
              onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Temporary password"
              required
              className="rounded-2xl border border-[#556b2f]/15 bg-white/70 px-4 py-3 text-sm text-[#26331a] focus:outline-none focus:ring-2 focus:ring-[#556b2f]/30"
            />
            <select
              value={adminForm.company_id}
              onChange={(event) => setAdminForm((current) => ({ ...current, company_id: event.target.value }))}
              required
              className="rounded-2xl border border-[#556b2f]/15 bg-white/70 px-4 py-3 text-sm text-[#26331a] focus:outline-none focus:ring-2 focus:ring-[#556b2f]/30"
            >
              <option value="" disabled>Select company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submittingAdmin || companies.length === 0}
              className="rounded-2xl bg-[#26331a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#334524] disabled:opacity-60 md:col-span-2"
            >
              {submittingAdmin ? 'Creating...' : 'Create admin'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-strong rounded-3xl p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#26331a]">Companies</h2>
              <p className="mt-1 text-sm text-gray-600">
                {companyHealth.activeCompanies} active, {companyHealth.withoutAdmins} without admins
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/45">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/50 text-xs uppercase text-[#26331a]/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Admins</th>
                  <th className="px-4 py-3 font-semibold">Employees</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-t border-white/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#26331a]">{company.name}</p>
                      <p className="text-xs text-gray-500">{company.code}</p>
                    </td>
                    <td className="px-4 py-3 text-[#26331a]">{company.admin_count || 0}</td>
                    <td className="px-4 py-3 text-[#26331a]">{company.employee_count || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[company.status] || statusStyles.inactive}`}>
                        {company.status || 'inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleCompanyStatus(company)}
                        className="rounded-xl border border-[#556b2f]/20 px-3 py-2 text-xs font-semibold text-[#26331a] transition-colors hover:bg-white/70"
                      >
                        {company.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && companies.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-gray-500">
                No companies have been created yet.
              </div>
            )}
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6">
          <div className="mb-5 flex flex-col gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#26331a]">Company Admins</h2>
              <p className="mt-1 text-sm text-gray-600">Filter admins by company and audit ownership.</p>
            </div>
            <select
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className="rounded-2xl border border-[#556b2f]/15 bg-white/70 px-4 py-3 text-sm text-[#26331a] focus:outline-none focus:ring-2 focus:ring-[#556b2f]/30"
            >
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {admins.map((admin) => (
              <div key={admin.id} className="rounded-3xl border border-white/50 bg-white/45 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#26331a]">{admin.name}</p>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                  </div>
                  <span className="rounded-full bg-[#26331a]/10 px-3 py-1 text-xs font-semibold text-[#26331a]">
                    Admin
                  </span>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {admin.company_name || 'No company assigned'}
                </p>
              </div>
            ))}

            {!loading && admins.length === 0 && (
              <div className="rounded-3xl border border-white/50 bg-white/45 px-4 py-10 text-center text-sm text-gray-500">
                No admins match this company filter.
              </div>
            )}

            {loading && (
              <div className="rounded-3xl border border-white/50 bg-white/45 px-4 py-10 text-center text-sm text-gray-500">
                Loading super admin data...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
