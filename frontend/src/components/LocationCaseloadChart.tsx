import { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface LocationCount {
  id: number | null;
  name: string;
  file_count: number;
}

const COLORS = ['#006600', '#c8a951', '#bb0000', '#1f4e2c', '#8a6d3b', '#4a7c59', '#a3333d', '#555'];

export default function LocationCaseloadChart() {
  const [data, setData] = useState<LocationCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/locations/caseload/')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load caseload data.'))
      .finally(() => setLoading(false));
  }, []);

  const total = data.reduce((sum, d) => sum + d.file_count, 0);

  if (loading) {
    return (
      <div className="card" style={{ marginBottom: 20, textAlign: 'center', color: '#888', padding: 24 }}>
        Loading caseload…
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ marginBottom: 20, color: '#cc0000', padding: 24 }}>
        {error}
      </div>
    );
  }

  if (total === 0) {
    return null; // no files yet, don't clutter the page
  }

  return (
    <div className="card" style={{ marginBottom: 20, padding: '20px 24px' }}>
      <h3 style={{ fontWeight: 700, color: '#006600', marginBottom: 4, fontSize: '1.1em' }}>
        📍 Caseload by Location
      </h3>
      <p style={{ color: '#888', fontSize: '0.85em', marginBottom: 12 }}>
        {total} file{total !== 1 ? 's' : ''} across {data.length} location{data.length !== 1 ? 's' : ''}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 260, height: 240 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="file_count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} file${Number(value) !== 1 ? 's' : ''}`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          {data.map((d, i) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.9em', color: '#333' }}>{d.name}</span>
              <span style={{ fontWeight: 700, fontSize: '0.9em', color: '#006600' }}>{d.file_count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
