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
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotificationClick = async (id: number) => {
    try {
      const res = await axios.post(`/api/notifications/${id}/mark-read/`);
      setUnreadCount(res.data.unread_count);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to mark notification read', err);
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
      <button onClick={() => setOpen(o => !o)} style={styles.bellButton} aria-label="Notifications">
        <span style={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            Notifications
            {unreadCount > 0 && <span style={styles.headerCount}>{unreadCount} new</span>}
          </div>
          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>You're all caught up.</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={styles.item}
                  onClick={() => handleNotificationClick(n.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={styles.itemDot} />
                  <div style={styles.itemBody}>
                    <div style={styles.itemRef}>{n.reference_number}</div>
                    <div style={styles.itemMessage}>{n.message}</div>
                    <div style={styles.itemTime}>{formatTime(n.created_at)}</div>
                  </div>
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
    width: 360,
    maxHeight: 440,
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.95em',
  },
  headerCount: {
    fontSize: '0.75em',
    fontWeight: 700,
    color: '#006600',
    background: '#e8f5e9',
    borderRadius: 12,
    padding: '2px 9px',
  },
  list: { overflowY: 'auto', maxHeight: 390 },
  empty: { padding: '28px 16px', textAlign: 'center', color: '#888', fontSize: '0.9em' },
  item: {
    display: 'flex',
    gap: 10,
    padding: '11px 16px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#006600',
    marginTop: 6,
    flexShrink: 0,
  },
  itemBody: { flex: 1, minWidth: 0 },
  itemRef: { fontWeight: 700, fontSize: '0.85em', color: '#006600' },
  itemMessage: { fontSize: '0.88em', margin: '2px 0', color: '#333' },
  itemTime: { fontSize: '0.75em', color: '#999' },
};
