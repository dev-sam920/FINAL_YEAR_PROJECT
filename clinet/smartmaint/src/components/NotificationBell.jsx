import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications, getUnreadCount, markAllAsRead, markAsRead } from '../api/notifications';

const POLL_INTERVAL_MS = 60_000;

const relativeTime = (dateString) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const loadUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data?.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load unread notification count:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    loadNotifications();

    const interval = setInterval(() => {
      loadUnreadCount();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    if (!open) {
      await loadNotifications();
    }
    setOpen((prev) => !prev);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((item) => item._id === id ? { ...item, isRead: true } : item));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          position: 'relative',
          border: '1px solid #E5E7EB',
          background: '#FFFFFF',
          color: '#111111',
          width: 42,
          height: 42,
          borderRadius: '999px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {hasUnread && (
          <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18, borderRadius: 999, background: '#4285F4', color: '#FFFFFF', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 320, maxHeight: 420, overflowY: 'auto', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, boxShadow: '0 16px 40px rgba(17,17,17,0.14)', zIndex: 2000 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ fontWeight: 800, color: '#111111' }}>Notifications</div>
            {notifications.some((item) => !item.isRead) && (
              <button type="button" onClick={handleMarkAllAsRead} style={{ border: 'none', background: 'transparent', color: '#4285F4', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '1rem', color: '#6B7280' }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '1rem', color: '#6B7280' }}>No notifications yet.</div>
          ) : (
            <div>
              {notifications.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => handleMarkAsRead(item._id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.9rem 1rem',
                    border: 'none',
                    background: item.isRead ? '#FFFFFF' : '#FFF8E7',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ color: '#111111', fontWeight: item.isRead ? 500 : 700, fontSize: 14 }}>{item.message}</div>
                  <div style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>{relativeTime(item.createdAt)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
