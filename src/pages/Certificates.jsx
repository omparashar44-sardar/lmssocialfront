import { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader.jsx';
import { downloadCertificate, getCertificates } from '../services/lms.js';

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

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const getCertificateStatus = (expiryDate) => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;

  if (expiry < now) {
    return 'Expired';
  }

  if (expiry.getTime() - now.getTime() <= thirtyDays) {
    return 'Expiring soon';
  }

  return 'Valid';
};

const formatDuration = (seconds) => {
  const totalSeconds = Math.max(0, Number(seconds || 0));

  if (!totalSeconds) {
    return 'Not recorded';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }

  return `${Math.max(1, minutes)} min`;
};

const formatQuizMarks = (certificate) => {
  if (!certificate.quizTotal) {
    return 'Not recorded';
  }

  return `${certificate.quizScore}/${certificate.quizTotal} (${Math.round(Number(certificate.quizPercentage || 0))}%)`;
};

const statusStyle = {
  Valid: 'bg-emerald-100 text-emerald-700',
  'Expiring soon': 'bg-amber-100 text-amber-700',
  Expired: 'bg-rose-100 text-rose-700',
};

export default function Certificates() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCertificates = async () => {
      setLoading(true);
      setError('');

      try {
        const rows = await getCertificates();
        setCertificates(
          rows.map((row) => ({
            id: `${row.course_id}-${row.holder_email}`,
            courseId: row.course_id,
            name: row.title,
            holder: row.holder_name,
            site: row.holder_email,
            company: row.company_name,
            quizScore: row.quiz_score,
            quizTotal: row.quiz_total_questions,
            quizPercentage: row.quiz_percentage,
            timeTakenSeconds: row.time_taken_seconds,
            status: getCertificateStatus(row.expiry_date),
            issued: row.completed_at,
            expiry: row.expiry_date,
          }))
        );
      } catch (loadError) {
        setError(loadError.message || 'Unable to load certificates.');
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, []);

  const filtered = certificates.filter((certificate) => {
    const matchStatus = filter === 'All' || certificate.status === filter;
    const matchSearch =
      certificate.name.toLowerCase().includes(search.toLowerCase()) ||
      certificate.holder.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    All: certificates.length,
    Valid: certificates.filter((certificate) => certificate.status === 'Valid').length,
    'Expiring soon': certificates.filter((certificate) => certificate.status === 'Expiring soon').length,
    Expired: certificates.filter((certificate) => certificate.status === 'Expired').length,
  };

  const handleDownload = async (certificate) => {
    try {
      const blob = await downloadCertificate(certificate.courseId);
      downloadBlob(blob, `${certificate.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_certificate.pdf`);
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to download certificate.');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Certificates"
        subtitle="Proof of training"
      />

      {error && (
        <div className="rounded-xl2 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {['All', 'Valid', 'Expiring soon', 'Expired'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === tab
                ? 'bg-olive text-beige'
                : 'bg-off-white border border-olive/15 text-olive-dark hover:border-olive/40'
            }`}
          >
            {tab} <span className="opacity-70">({counts[tab]})</span>
          </button>
        ))}
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by course or holder..."
          className="ml-auto px-3 py-1.5 rounded-xl2 border border-olive/15 bg-beige/40 text-olive-dark text-xs focus:outline-none focus:ring-2 focus:ring-olive/30"
        />
      </div>

      {loading ? (
        <div className="rounded-[28px] glass p-8 text-sm text-olive/70">
          Loading certificates...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((certificate) => (
            <div
              key={certificate.id}
              className="bg-off-white rounded-xl2 p-4 border border-olive/10 shadow-soft hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl2 bg-accent/10 flex items-center justify-center text-accent text-lg flex-shrink-0">
                  *
                </div>
                <div>
                  <p className="text-sm font-semibold text-olive-dark">{certificate.name}</p>
                  <p className="text-xs text-olive/70 mt-0.5">
                    {certificate.holder} • {certificate.company || certificate.site}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-beige/60 rounded-xl2 px-3 py-2">
                  <p className="text-olive/50 text-[11px]">Issued</p>
                  <p className="font-medium text-olive-dark">{formatDate(certificate.issued)}</p>
                </div>
                <div className="bg-beige/60 rounded-xl2 px-3 py-2">
                  <p className="text-olive/50 text-[11px]">Expiry</p>
                  <p className="font-medium text-olive-dark">{formatDate(certificate.expiry)}</p>
                </div>
                <div className="bg-beige/60 rounded-xl2 px-3 py-2">
                  <p className="text-olive/50 text-[11px]">Quiz marks</p>
                  <p className="font-medium text-olive-dark">{formatQuizMarks(certificate)}</p>
                </div>
                <div className="bg-beige/60 rounded-xl2 px-3 py-2">
                  <p className="text-olive/50 text-[11px]">Time taken</p>
                  <p className="font-medium text-olive-dark">{formatDuration(certificate.timeTakenSeconds)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusStyle[certificate.status]}`}>
                  {certificate.status}
                </span>
                <button
                  onClick={() => handleDownload(certificate)}
                  className="text-[11px] px-3 py-1 rounded-full border border-olive/30 text-olive-dark hover:bg-olive hover:text-beige transition-colors"
                >
                  Download PDF
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-olive/40 text-sm">
              No certificates match your filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
