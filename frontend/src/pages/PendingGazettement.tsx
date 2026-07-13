import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface CaseFile {
  reference_number: string;
  title: string;
  registry: string;
  status: string;
  current_location: string | null;
  created_at: string;
}

export default function PendingGazettement() {
  const navigate = useNavigate();
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [registry, setRegistry] = useState('');

  const doFetch = () => {
    setLoading(true);
    axios.get('/api/gazettements/pending/', { params: { q, registry } })
      .then(r => setCaseFiles(r.data))
      .catch(() => setError('Failed to load pending gazettements.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { doFetch(); }, []);

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.5em', color: '#006600' }}>📰 Pending Gazettement</h2>
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input placeholder="Search reference or title…" value={q} onChange={e => setQ(e.target.value)}
          style={{ flex: 2, minWidth: 180 }} onKeyDown={e => e.key === 'Enter' && doFetch()} />
        <select value={registry} onChange={e => setRegistry(e.target.value)} style={{ flex: 1, minWidth: 130 }}>
          <option value="">All Registries</option>
          <option value="CRIMINAL">Criminal</option>
          <option value="CIVIL">Civil</option>
          <option value="SUCCESSION">Succession</option>
        </select>
        <button className="btn btn-primary" onClick={doFetch}>Search</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading…</div>
        ) : error ? (
          <div style={{ padding: 24, color: '#cc0000' }}>{error}</div>
        ) : (
          <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#b5651d', color: '#fff' }}>
                {['Reference', 'Title', 'Registry', 'Status', 'Location', 'Created'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.88em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {caseFiles.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#888' }}>
                  🎉 No files pending gazettement.
                </td></tr>
              ) : caseFiles.map((cf, i) => (
                <tr key={cf.reference_number}
                  onClick={() => navigate(`/file/${encodeURIComponent(cf.reference_number)}`)}
                  style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fff3e0')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f9f9f9')}>
                  <td style={{ padding: '11px 16px', fontWeight: 700, color: '#006600' }}>{cf.reference_number}</td>
                  <td style={{ padding: '11px 16px' }}>{cf.title || '—'}</td>
                  <td style={{ padding: '11px 16px' }}>{cf.registry}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ background: '#b5651d', color: '#fff', padding: '3px 10px', borderRadius: 12, fontSize: '0.8em', fontWeight: 700 }}>PENDING</span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>{cf.current_location || 'Unknown'}</td>
                  <td style={{ padding: '11px 16px', color: '#888', fontSize: '0.88em' }}>
                    {new Date(cf.created_at).toLocaleDateString('en-KE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
