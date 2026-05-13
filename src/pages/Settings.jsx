import { useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';

export default function Settings() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Wire to PUT /api/settings { orgName, primarySite, notifications, complianceRules }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionHeader
        title="Workspace settings"
        subtitle="Settings"
        action={
          <button
            onClick={handleSave}
            className={`px-3 py-2 text-xs rounded-xl2 transition-colors ${
              saved ? 'bg-emerald-500 text-white' : 'bg-olive text-beige hover:bg-olive-dark'
            }`}
          >
            {saved ? '✓ Saved' : 'Save changes'}
          </button>
        }
      />

      <div className="bg-off-white rounded-xl2 border border-olive/10 shadow-soft p-4 space-y-4 text-xs">
        {/* Organization */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-olive/60 mb-2">
            Organization
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-olive/70">Company name</label>
              <input
                type="text"
                defaultValue="NorthKargo Logistics"
                className="w-full px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark focus:outline-none focus:ring-2 focus:ring-olive/30 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-olive/70">Primary site</label>
              <input
                type="text"
                defaultValue="Bengaluru DC"
                className="w-full px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark focus:outline-none focus:ring-2 focus:ring-olive/30 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="border-t border-olive/10 pt-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-olive/60 mb-2">
            Notifications
          </p>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-4">
              <span className="text-olive/80">
                Email managers when certificates are 30 days from expiry
              </span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span className="text-olive/80">Weekly summary of overdue training</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span className="text-olive/80">Learner reminders 3 days before due date</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span className="text-olive/80">Notify admin when quiz is failed 3+ times</span>
              <input type="checkbox" className="h-4 w-4" />
            </label>
          </div>
        </div>

        {/* Compliance rules */}
        <div className="border-t border-olive/10 pt-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-olive/60 mb-2">
            Compliance rules
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-olive/70">Certificate renewal reminder (days before)</label>
              <input
                type="number"
                defaultValue={30}
                min={7}
                max={90}
                className="w-full px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark focus:outline-none focus:ring-2 focus:ring-olive/30 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-olive/70">Quiz pass mark (%)</label>
              <input
                type="number"
                defaultValue={80}
                min={50}
                max={100}
                className="w-full px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark focus:outline-none focus:ring-2 focus:ring-olive/30 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-olive/70">Max quiz retries</label>
              <select
                defaultValue="3"
                className="w-full px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark text-xs focus:outline-none"
              >
                <option>Unlimited</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>5</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-olive/70">Auto-issue certificate on pass</label>
              <select
                defaultValue="yes"
                className="w-full px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark text-xs focus:outline-none"
              >
                <option value="yes">Yes — auto-issue</option>
                <option value="no">No — manual approval</option>
              </select>
            </div>
          </div>
        </div>

        {/* Access & roles */}
        <div className="border-t border-olive/10 pt-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-olive/60 mb-2">
            Access & roles
          </p>
          <div className="bg-beige/60 rounded-xl2 p-3 space-y-2">
            {[
              { role: 'Admin', desc: 'Full access — manage users, courses, settings' },
              { role: 'Manager', desc: 'View team compliance, assign courses, export reports' },
              { role: 'Learner', desc: 'Access assigned courses, view own certificates' },
            ].map((r) => (
              <div key={r.role} className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-olive-dark">{r.role}</span>
                  <span className="text-olive/60 ml-2">{r.desc}</span>
                </div>
                <button className="text-[11px] px-2 py-0.5 rounded-full border border-olive/20 text-olive/60 hover:border-olive/40 transition-colors">
                  {/* TODO: Wire to GET /api/roles/:role/users */}
                  Manage
                </button>
              </div>
            ))}
          </div>
          <p className="text-olive/50 mt-2">
            Role‑based access control will be enforced when connected to your backend.
            {/* TODO: POST /api/settings/roles to save role assignments */}
          </p>
        </div>

        {/* Backend connection */}
        <div className="border-t border-olive/10 pt-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-olive/60 mb-2">
            Backend connection
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-olive/70">API base URL</label>
              <input
                type="text"
                placeholder="https://api.yourbackend.com/v1"
                className="w-full px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark focus:outline-none focus:ring-2 focus:ring-olive/30 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-olive/70">API key</label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                className="w-full px-3 py-2 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark focus:outline-none focus:ring-2 focus:ring-olive/30 text-xs font-mono"
              />
            </div>
          </div>
          <p className="text-olive/40 mt-2 text-[11px]">
            All API calls use Authorization: Bearer &lt;key&gt;. See comments in each page file for endpoint details.
          </p>
        </div>
      </div>
    </div>
  );
}
