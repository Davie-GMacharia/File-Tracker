import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Location { id: number; name: string; }

export default function NewCaseFile() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState({
    reference_number: '', title: '', registry: '', status: 'ACTIVE',
    current_location: '', requires_gazettement: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/locations/').then(r => setLocations(r.data));
  }, []);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm(f => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await axios.post('/api/case-files/', form);
      navigate('/');
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) setError(Object.values(data).flat().join(' '));
      else setError('Failed to create case file.');
    } finally { setLoading(false); }
  };

  return (
    <div className="animate-fadeInUp" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontWeight: 800, fontSize: '1.5em', color: '#006600', marginBottom: 24 }}>
        ⚖️ Register New Case File
      </h2>
      <div className="card">
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000', borderRadius: 8, padding: '10px 14px', fontSize: '0.9em' }}>
              {error}
            </div>
          )}
          <div style={field}>
            <label style={label}>Reference Number *</label>
            <input name="reference_number" placeholder="e.g. MCSOE033/2022" value={form.reference_number} onChange={handle} required />
            <span style={hint}>Use the official court file reference format</span>
          </div>
          <div style={field}>
            <label style={label}>Case Title / Parties</label>
            <input name="title" placeholder="e.g. Republic v John Doe" value={form.title} onChange={handle} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...field, flex: 1 }}>
              <label style={label}>Registry *</label>
              <select name="registry" value={form.registry} onChange={handle} required>
                <option value="">Select registry…</option>
                <option value="CRIMINAL">Criminal</option>
                <option value="CIVIL">Civil</option>
                <option value="SUCCESSION">Succession</option>
              </select>
            </div>
            <div style={{ ...field, flex: 1 }}>
              <label style={label}>Status *</label>
              <select name="status" value={form.status} onChange={handle} required>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
          <div style={field}>
            <label style={label}>Current Location *</label>
            <select name="current_location" value={form.current_location} onChange={handle} required>
              <option value="">Select location…</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f5f5f0', borderRadius: 8, padding: '12px 14px' }}>
            <input
              type="checkbox"
              id="requires_gazettement"
              name="requires_gazettement"
              checked={form.requires_gazettement}
              onChange={handle}
              style={{ width: 'auto' }}
            />
            <label htmlFor="requires_gazettement" style={{ fontSize: '0.9em', fontWeight: 600, color: '#444', cursor: 'pointer' }}>
              📰 This case requires gazettement
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate('/')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Creating…' : '✓ Create Case File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const field: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 };
const label: React.CSSProperties = { fontSize: '0.85em', fontWeight: 600, color: '#444' };
const hint: React.CSSProperties = { fontSize: '0.78em', color: '#888' };
