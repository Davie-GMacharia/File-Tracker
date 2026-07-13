import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

interface Movement {
  id: number; from_location: string | null; to_location: number;
  to_location_name: string; handled_by: string; remarks: string; timestamp: string;
}
interface Gazettement {
  id: number; gazette_notice_number: string; gazette_date: string;
  volume_issue: string; remarks: string; logged_by: string; created_at: string;
}
interface CaseFileDetail {
  reference_number: string; title: string; registry: string;
  status: string; current_location: string | null;
  qr_code: string | null; created_at: string; movements: Movement[];
  requires_gazettement: boolean; gazettement_status: string; gazettements: Gazettement[];
}
interface Location { id: number; name: string; }

export default function FileDetail() {
  const { reference_number } = useParams<{ reference_number: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<CaseFileDetail | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState({ to_location: '', handled_by: '', remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const [gazForm, setGazForm] = useState({ gazette_notice_number: '', gazette_date: '', volume_issue: '', remarks: '', logged_by: '' });
  const [gazSubmitting, setGazSubmitting] = useState(false);
  const [gazSuccess, setGazSuccess] = useState('');
  const [gazError, setGazError] = useState('');

  const load = () => {
    axios.get(`/api/case-files/${reference_number}/`).then(r => setFile(r.data));
  };

  useEffect(() => {
    load();
    axios.get('/api/locations/').then(r => setLocations(r.data));
  }, [reference_number]);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleGaz = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setGazForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const logMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      await axios.post(`/api/case-files/${reference_number}/movements/`, form);
      setSuccess('Movement logged successfully!');
      setForm({ to_location: '', handled_by: '', remarks: '' });
      load();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) setError(Object.values(data).flat().join(' '));
      else setError('Failed to log movement.');
    } finally { setSubmitting(false); }
  };

  const logGazettement = async (e: React.FormEvent) => {
    e.preventDefault();
    setGazError(''); setGazSuccess(''); setGazSubmitting(true);
    try {
      await axios.post(`/api/case-files/${reference_number}/gazettements/`, gazForm);
      setGazSuccess('Gazettement logged successfully!');
      setGazForm({ gazette_notice_number: '', gazette_date: '', volume_issue: '', remarks: '', logged_by: '' });
      load();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) setGazError(Object.values(data).flat().join(' '));
      else setGazError('Failed to log gazettement.');
    } finally { setGazSubmitting(false); }
  };

  const downloadMovementHistory = async () => {
    setDownloading(true);
    try {
      const res = await axios.get(
        `/api/case-files/${reference_number}/movements/export/`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `movement_history_${reference_number}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download movement history.');
    } finally {
      setDownloading(false);
    }
  };

  const statusColor: Record<string, string> = {
    ACTIVE: '#006600', CLOSED: '#888', ARCHIVED: '#b5651d',
  };

  const gazStatusColor: Record<string, string> = {
    NOT_REQUIRED: '#888', PENDING: '#b5651d', GAZETTED: '#006600',
  };

  if (!file) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading…</div>;

  const availableLocations = locations.filter(l => l.name !== file.current_location);

  return (
    <div className="animate-fadeIn">
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#006600', cursor: 'pointer', fontWeight: 600, marginBottom: 16, fontSize: '0.95em' }}>
        ← Back to Case Files
      </button>
      <div className="file-detail-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* File info card */}
          <div className="card animate-fadeInUp">
            <div className="file-header-row">
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.5em', color: '#006600' }}>{file.reference_number}</h2>
                <p style={{ color: '#666', marginTop: 2 }}>{file.title || '—'}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ background: statusColor[file.status] || '#333', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.82em', fontWeight: 700 }}>
                  {file.status}
                </span>
                {file.requires_gazettement && (
                  <span style={{ background: gazStatusColor[file.gazettement_status] || '#333', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: '0.78em', fontWeight: 700 }}>
                    Gazettement: {file.gazettement_status.replace('_', ' ')}
                  </span>
                )}
                <button
                  onClick={downloadMovementHistory}
                  disabled={downloading}
                  className="btn btn-outline"
                  style={{ fontSize: '0.82em', padding: '6px 12px', whiteSpace: 'nowrap' }}
                >
                  {downloading ? 'Preparing…' : '📊 Download Movement History'}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { label: 'Registry', value: file.registry },
                { label: 'Current Location', value: file.current_location || 'Unknown' },
                { label: 'Created', value: new Date(file.created_at).toLocaleDateString('en-KE') },
              ].map(item => (
                <div key={item.label} style={{ background: '#f5f5f0', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.75em', color: '#888', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontWeight: 700, color: '#111' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Log Movement card */}
          <div className="card animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <h3 style={{ fontWeight: 700, color: '#006600', marginBottom: 16 }}>📋 Log a Movement</h3>
            {success && <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', color: '#006600', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: '0.9em' }}>{success}</div>}
            {error && <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: '0.9em' }}>{error}</div>}
            <form onSubmit={logMovement} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={field}>
                <label style={label}>Moving To *</label>
                <select name="to_location" value={form.to_location} onChange={handle} required>
                  <option value="">Select destination…</option>
                  {availableLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div style={field}>
                <label style={label}>Your Name *</label>
                <input name="handled_by" placeholder="Full name of staff handling this movement" value={form.handled_by} onChange={handle} required />
              </div>
              <div style={field}>
                <label style={label}>Remarks (optional)</label>
                <textarea name="remarks" rows={2} placeholder="Any notes about this movement…" value={form.remarks} onChange={handle}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #ccc', borderRadius: 8, fontSize: '1em', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Logging…' : '✓ Log Movement'}
              </button>
            </form>
          </div>

          {/* Gazettement card — only shown if this file requires it */}
          {file.requires_gazettement && (
            <div className="card animate-fadeInUp" style={{ animationDelay: '0.15s' }}>
              <h3 style={{ fontWeight: 700, color: '#006600', marginBottom: 16 }}>📰 Log Gazettement</h3>
              {gazSuccess && <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', color: '#006600', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: '0.9em' }}>{gazSuccess}</div>}
              {gazError && <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: '0.9em' }}>{gazError}</div>}
              <form onSubmit={logGazettement} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={field}>
                    <label style={label}>Gazette Notice Number *</label>
                    <input name="gazette_notice_number" placeholder="e.g. 1234" value={gazForm.gazette_notice_number} onChange={handleGaz} required />
                  </div>
                  <div style={field}>
                    <label style={label}>Gazette Date *</label>
                    <input name="gazette_date" type="date" value={gazForm.gazette_date} onChange={handleGaz} required />
                  </div>
                </div>
                <div style={field}>
                  <label style={label}>Volume / Issue (optional)</label>
                  <input name="volume_issue" placeholder="e.g. Vol. 45, Issue 12" value={gazForm.volume_issue} onChange={handleGaz} />
                </div>
                <div style={field}>
                  <label style={label}>Your Name *</label>
                  <input name="logged_by" placeholder="Full name of staff logging this" value={gazForm.logged_by} onChange={handleGaz} required />
                </div>
                <div style={field}>
                  <label style={label}>Remarks (optional)</label>
                  <textarea name="remarks" rows={2} placeholder="Any notes…" value={gazForm.remarks} onChange={handleGaz}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #ccc', borderRadius: 8, fontSize: '1em', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={gazSubmitting}>
                  {gazSubmitting ? 'Logging…' : '✓ Log Gazettement'}
                </button>
              </form>

              {file.gazettements.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: '0.9em', fontWeight: 700, color: '#444', marginBottom: 10 }}>Gazettement History</h4>
                  <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f0' }}>
                        {['Notice #', 'Date', 'Volume/Issue', 'Logged By'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.78em', fontWeight: 700, color: '#666' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {file.gazettements.map(g => (
                        <tr key={g.id} style={{ borderTop: '1px solid #eee' }}>
                          <td style={{ padding: '8px 12px', fontSize: '0.85em', fontWeight: 600 }}>{g.gazette_notice_number}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.85em' }}>{new Date(g.gazette_date).toLocaleDateString('en-KE')}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.85em' }}>{g.volume_issue || '—'}</td>
                          <td style={{ padding: '8px 12px', fontSize: '0.85em' }}>{g.logged_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Movement history */}
          <div className="card animate-fadeInUp" style={{ animationDelay: '0.2s', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ fontWeight: 700, color: '#006600' }}>📂 Movement History</h3>
            </div>
            <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#006600', color: '#fff' }}>
                  {['From', 'To', 'Handled By', 'Remarks', 'When'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.82em', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {file.movements.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#888' }}>No movements recorded yet.</td></tr>
                ) : file.movements.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td style={{ padding: '10px 14px', fontSize: '0.88em' }}>{m.from_location || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.88em', fontWeight: 600 }}>{m.to_location_name}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.88em' }}>{m.handled_by}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.88em', color: '#666' }}>{m.remarks || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.82em', color: '#888' }}>{new Date(m.timestamp).toLocaleString('en-KE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Right column — QR code */}
        <div className="card qr-sidebar animate-fadeInUp" style={{ animationDelay: '0.15s', textAlign: 'center' }}>
          <h3 style={{ fontWeight: 700, color: '#006600', marginBottom: 12 }}>📱 QR Code</h3>
          {file.qr_code ? (
            <>
              <img src={file.qr_code} alt="QR Code" style={{ width: '100%', maxWidth: 220, borderRadius: 8, border: '1px solid #eee' }} />
              <p style={{ fontSize: '0.78em', color: '#888', marginTop: 10 }}>Scan to open this file on any device</p>
              <a href={file.qr_code} download={`${file.reference_number}-qr.png`}
                className="btn btn-outline" style={{ marginTop: 12, width: '100%', display: 'block' }}>
                ⬇ Download QR
              </a>
            </>
          ) : (
            <p style={{ color: '#888', fontSize: '0.9em' }}>QR code not yet generated.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 };
const label: React.CSSProperties = { fontSize: '0.85em', fontWeight: 600, color: '#444' };
