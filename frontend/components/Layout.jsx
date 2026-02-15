/**
 * Layout Component
 * App shell with header, nav, notifications
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from '../services/notificationService';
import './Layout.css';

/* row 1 = primary nav (logo, notif, Dashboard … Cab Share); row 2 = secondary (Facilities, Map, Profile, Admin, user) */
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '◉', row: 1 },
  { to: '/create', label: 'New Grievance', icon: '+', roles: ['user', 'author'], row: 1 },
  { to: '/faculty', label: 'Faculty Panel', icon: '📋', roles: ['faculty'], row: 1 },
  { to: '/notes', label: 'Academic Vault', icon: '📚', row: 1 },
  { to: '/opportunities', label: 'Internships & Research', icon: '💼', row: 1 },
  { to: '/forum', label: 'Campus Forum', icon: '💬', row: 1 },
  { to: '/announcements', label: 'Notice Board', icon: '📢', row: 1 },
  { to: '/events', label: 'Events', icon: '📅', row: 1 },
  { to: '/academic-calendar', label: 'Academic Calendar', icon: '📆', row: 1 },
  { to: '/cabshare', label: 'Cab Share', icon: '🚗', row: 1 },
  { to: '/facilities', label: 'Facilities', icon: '🏢', row: 2 },
  { to: '/map', label: 'Campus Map', icon: '🗺', row: 2 },
  { to: '/profile', label: 'Profile', icon: '👤', row: 2 },
];

export const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (_) {}
    };
    load();
  }, [user]);

  const openNotifPanel = async () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) {
      try {
        const list = await getNotifications();
        setNotifications(Array.isArray(list) ? list : []);
      } catch (_) {}
    }
  };

  const handleNotifClick = async (n) => {
    if (!n.read) {
      try {
        await markNotificationRead(n._id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      } catch (_) {}
    }
    if (n.link) {
      setNotifOpen(false);
      navigate(n.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((list) => list.map((x) => ({ ...x, read: true })));
    } catch (_) {}
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const primaryItems = visibleNavItems.filter((item) => item.row === 1);
  const secondaryItems = visibleNavItems.filter((item) => item.row === 2);

  return (
    <div className="layout">
      <header className={`header ${mobileMenuOpen ? 'header-mobile-open' : ''}`}>
        <div className="header-row header-row-1">
          <Link to="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
            <span className="logo-icon">◈</span>
            <span>Campus Portal</span>
          </Link>

          <nav className={`nav nav-row-1 ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <div className="nav-notif-wrap">
              <button
                type="button"
                className="notif-trigger"
                onClick={openNotifPanel}
                aria-label="Notifications"
              >
                <span className="notif-icon">🔔</span>
                {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>
              {notifOpen && (
                <>
                  <div className="notif-backdrop" onClick={() => setNotifOpen(false)} />
                  <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                      <strong>Notifications</strong>
                      {unreadCount > 0 && (
                        <button type="button" className="notif-mark-all" onClick={handleMarkAllRead}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <p className="notif-empty">No notifications</p>
                      ) : (
                        notifications.slice(0, 15).map((n) => (
                          <button
                            key={n._id}
                            type="button"
                            className={`notif-item ${n.read ? 'read' : ''}`}
                            onClick={() => handleNotifClick(n)}
                          >
                            <strong>{n.title}</strong>
                            <span className="notif-msg">{n.message}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {primaryItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={mobileMenuOpen ? 'open' : ''} />
            <span className={mobileMenuOpen ? 'open' : ''} />
            <span className={mobileMenuOpen ? 'open' : ''} />
          </button>
        </div>

        <div className="header-row header-row-2">
          <nav className="nav nav-row-2">
            {secondaryItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <>
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `nav-link nav-admin ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon">⚙</span>
                  Admin
                </NavLink>
                <NavLink
                  to="/analytics"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon">📊</span>
                  Analytics
                </NavLink>
              </>
            )}

            <div className="user-menu-wrap">
              <button
                className="user-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
              >
                <span className="user-avatar">{user?.name?.[0]?.toUpperCase() || '?'}</span>
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role}</span>
              </button>
              {userMenuOpen && (
                <>
                  <div className="user-menu-backdrop" onClick={() => setUserMenuOpen(false)} />
                  <div className="user-menu">
                    <div className="user-menu-header">
                      <strong>{user?.name}</strong>
                      <span className="text-muted text-small">{user?.email}</span>
                    </div>
                    <button className="user-menu-item btn-logout" onClick={handleLogout}>
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
};
