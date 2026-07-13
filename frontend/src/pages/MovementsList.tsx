import { useEffect, useState } from 'react';
import axios from 'axios';

interface Movement {
  id: number;
  reference_number: string;
  registry: string;
  from_location: string | null;
  to_location_name: string;
  handled_by: string;
  remarks: string;
  timestamp: string;
}

export default function MovementsList() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [referenceNumber, setReferenceNumber] = useState('');
  const [registry, setRegistry] = useState('');
  const [handledBy, setHandledBy] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const doFetch = () => {
    setLoading(true);
    setError('');
    axios.get('/api/movements/', {
      params: {
        reference_number: referenceNumber,
        registry,
        handled_by: handledBy,
        date_from: dateFrom,
        date_to: dateTo,
      },
    })
      .then(r => setMovements(r.data))
      .catch(() => setError('Failed to load movements.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { doFetch(); }, []);

  const clearFilters = () => {
    setReferenceNumber(''); setRegistry(''); setHandledBy('');
    setDateFrom(''); setDateTo('');
    setTimeout(doFetch, 0);
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.5em', color: '#006600' }}>🔄 File Movements</h2>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <input
            placeholder="Search reference number…"
            value={referenceNumber}
            onChange={e => setReferenceNumber(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doFetch()}
            style={{ flex: 2, minWidth: 180 }}
          />
          <select value={registry} onChange={e => setRegistry(e.target.value)} style={{ flex: 1, minWidth: 130 }}>
            <option value="">All Registries</option>
            <option value="CRIMINAL">Criminal</option>
            <option value="CIVIL">Civil</option>
            <option value="SUCCESSION">Succession</option>
          </select>
          <input
            placeholder="Handled by…"
            value={handledBy}
            onChange={e => setHandledBy(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doFetch()}
            style={{ flex: 1, minWidth: 140 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: '0.82em', fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: '0.82em', fontWeight: 600, color: '#444', display: 'block', marginBottom: 4 }}>To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={doFetch}>Search</button>
          <button className="btn btn-outline" onClick={clearFilters}>Clear</button>
        </div>
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
                {['Reference', 'Registry', 'From', 'To', 'Handled By', 'Remarks', 'When'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.88em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#888' }}>No movements found.</td></tr>
              ) : movements.map((m, i) => (
                <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ padding: '11px 16px', fontWeight: 700, color: '#006600' }}>{m.reference_number}</td>
                  <td style={{ padding: '11px 16px' }}>{m.registry}</td>
                  <td style={{ padding: '11px 16px' }}>{m.from_location || '—'}</td>
                  <td style={{ padding: '11px 16px', fontWeight: 600 }}>{m.to_location_name}</td>
                  <td style={{ padding: '11px 16px' }}>{m.handled_by}</td>
                  <td style={{ padding: '11px 16px', color: '#666' }}>{m.remarks || '—'}</td>
                  <td style={{ padding: '11px 16px', color: '#888', fontSize: '0.88em' }}>
                    {new Date(m.timestamp).toLocaleString('en-KE')}
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
