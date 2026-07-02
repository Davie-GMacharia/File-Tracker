import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ username: '', password: '', email: '', first_name: '', last_name: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.username, form.password);
      else await register(form);
      navigate('/');
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) setError(Object.values(data).flat().join(' '));
      else setError('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      {/* Kenya flag strip */}
      <div style={styles.flagStrip}>
        <div style={{ flex:1, background:'#006600' }} />
        <div style={{ flex:1, background:'#ffffff' }} />
        <div style={{ flex:1, background:'#bb0000' }} />
      </div>

      <div style={styles.container} className="animate-fadeInUp">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconRow}>
            <span style={styles.icon}>⚖️</span>
            <span style={styles.icon}>🔨</span>
          </div>
          <h1 style={styles.title}>Judiciary File Tracker</h1>
          <p style={styles.subtitle}>Engineer Law Courts · Republic of Kenya</p>
        </div>

        {/* Toggle tabs */}
        <div style={styles.tabs}>
          {(['login','signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={submit} style={styles.form}>
          {mode === 'signup' && (
            <>
              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>First Name</label>
                  <input name="first_name" placeholder="First name" value={form.first_name} onChange={handle} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Last Name</label>
                  <input name="last_name" placeholder="Last name" value={form.last_name} onChange={handle} required />
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email Address</label>
                <input name="email" type="email" placeholder="you@court.go.ke" value={form.email} onChange={handle} required />
              </div>
            </>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input name="username" placeholder="Username" value={form.username} onChange={handle} required autoFocus />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.passWrap}>
              <input
                name="password" type={showPass ? 'text' : 'password'}
                placeholder="Password" value={form.password} onChange={handle} required
                style={{ paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} style={styles.eyeBtn}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, padding: '13px' }} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={styles.flagBottom}>
          <span style={{ color:'#006600', fontWeight:700 }}>■</span>{' '}
          <span style={{ color:'#cc0000', fontWeight:700 }}>■</span>{' '}
          <span style={{ color:'#111', fontWeight:700 }}>■</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#e8f5e9 0%,#f5f5f0 50%,#ffebee 100%)' },
  flagStrip: { position:'fixed', top:0, left:0, right:0, height:6, display:'flex', zIndex:100 },
  container: { width:'100%', maxWidth:460, padding:'0 16px' },
  header: { textAlign:'center', marginBottom:28 },
  iconRow: { fontSize:40, marginBottom:8, display:'flex', justifyContent:'center', gap:12 },
  icon: { display:'inline-block', animation:'fadeInUp 0.6s both' },
  title: { fontSize:'1.7em', fontWeight:800, color:'#006600', letterSpacing:'-0.5px' },
  subtitle: { color:'#555', fontSize:'0.88em', marginTop:4 },
  tabs: { display:'flex', background:'#f0f0f0', borderRadius:10, padding:4, marginBottom:20 },
  tab: { flex:1, padding:'9px 0', border:'none', background:'transparent', borderRadius:8, cursor:'pointer', fontWeight:600, color:'#666', transition:'all 0.25s' },
  tabActive: { background:'#006600', color:'#fff', boxShadow:'0 2px 8px rgba(0,102,0,0.3)' },
  error: { background:'#fff0f0', border:'1px solid #ffcccc', color:'#cc0000', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:'0.9em' },
  form: { display:'flex', flexDirection:'column', gap:14, background:'#fff', padding:28, borderRadius:14, boxShadow:'0 4px 24px rgba(0,0,0,0.10)' },
  row: { display:'flex', gap:12 },
  field: { display:'flex', flexDirection:'column', gap:5, flex:1 },
  label: { fontSize:'0.85em', fontWeight:600, color:'#444' },
  passWrap: { position:'relative' },
  eyeBtn: { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:18, padding:0 },
  flagBottom: { textAlign:'center', marginTop:20, fontSize:22, letterSpacing:8 },
};
