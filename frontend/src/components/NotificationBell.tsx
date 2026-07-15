import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

interface Notification {
  id: number;
  reference_number: string;
  message: string;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get('/api/notifications/');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleToggle = async () => {
    const opening = !open;
    setOpen(opening);
    if (opening && unreadCount > 0) {
      try {
        await axios.post('/api/notifications/mark-read/');
        setUnreadCount(0);
      } catch (err) {
        console.error('Failed to mark notifications read', err);
      }
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <button onClick={handleToggle} style={styles.bellButton} aria-label="Notifications">
        <span style={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>Notifications</div>
          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>No notifications yet.</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={styles.item}>
                  <div style={styles.itemRef}>{n.reference_number}</div>
                  <div style={styles.itemMessage}>{n.message}</div>
                  <div style={styles.itemTime}>{formatTime(n.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { position: 'relative' },
  bellButton: {
    position: 'relative',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
  },
  bellIcon: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    background: '#bb0000',
    color: '#fff',
    borderRadius: 10,
    fontSize: '0.65em',
    fontWeight: 700,
    padding: '1px 5px',
    minWidth: 16,
    textAlign: 'center',
    lineHeight: '14px',
  },
  dropdown: {
    position: 'absolute',
    top: '120%',
    right: 0,
    width: 340,
    maxHeight: 420,
    background: '#fff',
    color: '#222',
    borderRadius: 10,
    boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
    overflow: 'hidden',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownHeader: {
    padding: '12px 16px',
    fontWeight: 700,
    borderBottom: '1px solid #eee',
    background: '#f7f7f7',
  },
  list: { overflowY: 'auto', maxHeight: 370 },
  empty: { padding: '24px 16px', textAlign: 'center', color: '#888', fontSize: '0.9em' },
  item: { padding: '10px 16px', borderBottom: '1px solid #f0f0f0' },
  itemRef: { fontWeight: 700, fontSize: '0.85em', color: '#006600' },
  itemMessage: { fontSize: '0.88em', margin: '2px 0', color: '#333' },
  itemTime: { fontSize: '0.75em', color: '#999' },
};
