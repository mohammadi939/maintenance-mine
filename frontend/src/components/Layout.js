import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'داشبورد', emoji: '📊' },
  { to: '/forms/exit', label: 'خروج دستگاه/کالا', emoji: '🚚' },
  { to: '/forms/repair', label: 'درخواست تعمیرات', emoji: '🛠️' },
  { to: '/forms/entry', label: 'تأیید ورود پس از تعمیر', emoji: '✅' },
  { to: '/board', label: 'تابلوی وضعیت', emoji: '📌' },
  { to: '/inventory', label: 'مدیریت موجودی', emoji: '📦' },
];

const roleLabels = {
  manager: 'مدیر',
  storekeeper: 'انبار',
  unit: 'واحد بهره‌بردار',
  workshop: 'تعمیرگاه',
};

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const activeLink = links.find((link) =>
    location.pathname === link.to || location.pathname.startsWith(`${link.to}/`)
  );

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__logo">CMMS</span>
          <span>مدیریت تعمیرات معدن</span>
        </div>
        <nav className="sidebar__nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              <span aria-hidden>{link.emoji}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="app-layout__main">
        <header className="topbar">
          <div className="topbar__breadcrumb">{activeLink ? activeLink.label : 'داشبورد'}</div>
          <div className="topbar__actions">
            {user && (
              <div className="topbar__user" aria-live="polite">
                <span className="topbar__user-name">{user.username}</span>
                <span className="topbar__user-role">{roleLabels[user.role] || user.role}</span>
              </div>
            )}
            <button type="button" className="btn btn--ghost" onClick={handleLogout}>
              خروج
            </button>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
