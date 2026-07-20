import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { path: '/', label: 'Case Files' },
    { path: '/movements', label: 'Movements' },
    { path: '/gazettement', label: 'Gazettement' },
    { path: '/new', label: '+ New File' },
  ];

  return (
    <nav style={styles.nav}>
      <div className="navbar-inner" style={styles.inner}>
        <div style={styles.brand} onClick={() => navigate('/')}>
          <span style={styles.icons}>⚖️ 🇰🇪</span>
          <div>
            <div style={styles.brandName}>Judiciary File Tracker</div>
            <div style={styles.brandSub}>Engineer Law Courts</div>
          </div>
        </div>

        <div className="navbar-links" style={styles.links}>
          {links.map(l => (
            <button key={l.path} onClick={() => navigate(l.path)}
              style={{ ...styles.link, ...(location.pathname === l.path ? styles.linkActive : {}) }}>
              {l.label}
            </button>
          ))}
        </div>

        <div className="navbar-user" style={styles.userArea}>
          <NotificationBell />
          <span className="navbar-username" style={styles.userName}>👤 {user?.username}</span>
          <button onClick={logout} className="btn btn-outline" style={{ padding:'6px 14px', fontSize:'0.85em' }}>
            Sign Out
          </button>
        </div>
      </div>
      {/* Kenya flag underline */}
      <div style={styles.flagBar}>
        <div style={{ flex:1, background:'#006600' }} />
        <div style={{ flex:1, background:'#ffffff' }} />
        <div style={{ flex:1, background:'#bb0000' }} />
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: { background:'#111', color:'#fff', position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.3)' },
  inner: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 24px', gap:16 },
  brand: { display:'flex', alignItems:'center', gap:10, cursor:'pointer' },
  icons: { fontSize:26 },
  brandName: { fontWeight:800, fontSize:'1.05em', color:'#fff', letterSpacing:'-0.3px' },
  brandSub: { fontSize:'0.72em', color:'#c8a951', letterSpacing:'0.5px' },
  links: { display:'flex', gap:8 },
  link: { background:'transparent', border:'none', color:'#ccc', cursor:'pointer', padding:'7px 14px', borderRadius:8, fontWeight:600, fontSize:'0.92em', transition:'all 0.2s' },
  linkActive: { background:'#006600', color:'#fff' },
  userArea: { display:'flex', alignItems:'center', gap:12 },
  userName: { color:'#c8a951', fontWeight:600, fontSize:'0.9em' },
  flagBar: { height:4, display:'flex' },
};
