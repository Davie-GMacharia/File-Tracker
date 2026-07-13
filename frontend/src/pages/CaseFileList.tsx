import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import type { CaseFile } from '../types';

export default function CaseFileList() {
  const navigate = useNavigate();
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [registry, setRegistry] = useState('');
  const [status, setStatus] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [bulkForm, setBulkForm] = useState({ to_location: '', handled_by: '', remarks: '' });
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ succeeded: string[]; failed: any[] } | null>(null);

  const toggleSelect = (ref: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === caseFiles.length) setSelected(new Set());
    else setSelected(new Set(caseFiles.map(cf => cf.reference_number)));
  };

  const submitBulkMove = async () => {
    setBulkSubmitting(true);
    setBulkResult(null);
    try {
      const res = await axios.post('/api/case-files/bulk-movements/', {
        reference_numbers: Array.from(selected),
        to_location: bulkForm.to_location,
        handled_by: bulkForm.handled_by,
        remarks: bulkForm.remarks,
      });
      setBulkResult(res.data);
      setSelected(new Set());
      setBulkForm({ to_location: '', handled_by: '', remarks: '' });
      doFetch();
    } catch {
      setBulkResult({ succeeded: [], failed: [{ error: 'Request failed' }] });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const doFetch = () => {
    setLoading(true);
    axios.get('/api/case-files/', { params: { q, registry, status, location: locationFilter } })
      .then(r => setCaseFiles(r.data))
      .catch(() => setError('Failed to load case files.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    doFetch();
    axios.get('/api/locations/').then(r => setLocations(r.data));
  }, []);

  const statusColor: Record<string, string> = {
    ACTIVE: '#006600', CLOSED: '#888', ARCHIVED: '#b5651d',
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.5em', color: '#006600' }}>⚖️ Case Files</h2>
        <button className="btn btn-primary" onClick={() => navigate('/new')}>+ New File</button>
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
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ flex: 1, minWidth: 120 }}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
          <option value="">All Locations</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
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
              <tr style={{ background: '#006600', color: '#fff' }}>
                <th style={{ padding: '12px 16px', width: 36 }}>
                  <input type="checkbox" checked={caseFiles.length > 0 && selected.size === caseFiles.length} onChange={toggleSelectAll} />
                </th>
                {['Reference', 'Title', 'Registry', 'Status', 'Location', 'Created'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.88em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {caseFiles.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#888' }}>No case files found.</td></tr>
              ) : caseFiles.map((cf, i) => (
               <tr key={cf.reference_number}
                  style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e8f5e9')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#f9f9f9')}>
                  <td style={{ padding: '11px 16px' }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(cf.reference_number)} onChange={() => toggleSelect(cf.reference_number)} />
                  </td>
                  <td style={{ padding: '11px 16px', fontWeight: 700, color: '#006600', cursor: 'pointer' }}
                    onClick={() => navigate(`/file/${encodeURIComponent(cf.reference_number)}`)}>{cf.reference_number}</td>
                  <td style={{ padding: '11px 16px' }}>{cf.title || '—'}</td>
                  <td style={{ padding: '11px 16px' }}>{cf.registry}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ color: statusColor[cf.status] || '#333', fontWeight: 600 }}>{cf.status}</span>
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
      {selected.size > 0 && (
        <div className="card" style={{ marginTop: 20, background: '#f0f7f0', border: '2px solid #006600' }}>
          <h3 style={{ fontWeight: 700, color: '#006600', marginBottom: 12 }}>
            📦 Move {selected.size} Selected File{selected.size > 1 ? 's' : ''}
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: '0.85em', fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Moving To *</label>
              <select value={bulkForm.to_location} onChange={e => setBulkForm(f => ({ ...f, to_location: e.target.value }))} style={{ width: '100%' }}>
                <option value="">Select destination…</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: '0.85em', fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Your Name *</label>
              <input value={bulkForm.handled_by} onChange={e => setBulkForm(f => ({ ...f, handled_by: e.target.value }))} placeholder="Full name" style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={{ fontSize: '0.85em', fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>Remarks (optional)</label>
              <input value={bulkForm.remarks} onChange={e => setBulkForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Notes…" style={{ width: '100%' }} />
            </div>
            <button className="btn btn-primary" disabled={bulkSubmitting || !bulkForm.to_location || !bulkForm.handled_by} onClick={submitBulkMove}>
              {bulkSubmitting ? 'Moving…' : `✓ Move ${selected.size} File${selected.size > 1 ? 's' : ''}`}
            </button>
          </div>
          {bulkResult && (
            <div style={{ marginTop: 12, fontSize: '0.88em' }}>
              {bulkResult.succeeded.length > 0 && (
                <div style={{ color: '#006600' }}>✓ Moved: {bulkResult.succeeded.join(', ')}</div>
              )}
              {bulkResult.failed.length > 0 && (
                <div style={{ color: '#cc0000', marginTop: 4 }}>
                  ✗ Failed: {bulkResult.failed.map((f: any) => `${f.reference_number || ''} (${f.error})`).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
