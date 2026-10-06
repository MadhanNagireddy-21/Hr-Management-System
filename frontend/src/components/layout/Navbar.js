'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { getUnreadCount } from '@/lib/employeeApi';
import { getAdminUnreadCount } from '@/lib/adminApi';
import HRChatbot from '../chatbot/HRChatbot';
import {
  Home,
  Calendar,
  ClipboardList,
  Wallet,
  TrendingUp,
  Bell,
  Settings,
  Users,
  GraduationCap,
  Briefcase,
  FolderOpen,
  Menu,
  Search,
  X,
  Clock3,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';

import DashboardThemeSwitcher from './DashboardThemeSwitcher';
import SessionManager, {
  useSessionTimer,
  formatSessionTime,
} from './SessionManager';

/* ============================================================
   SEARCH ITEMS
============================================================ */

const EMP_SEARCH_ITEMS = [
  { label: 'Dashboard', path: '/employee/dashboard', icon: Home },
  { label: 'Attendance', path: '/employee/attendance', icon: Calendar },
  { label: 'Leave Management', path: '/employee/leave', icon: ClipboardList },
  { label: 'Payslips', path: '/employee/payslips', icon: Wallet },
  { label: 'Performance', path: '/employee/performance', icon: TrendingUp },
  { label: 'Notifications', path: '/employee/notifications', icon: Bell },
  { label: 'Settings', path: '/employee/settings', icon: Settings },
];

const ADMIN_SEARCH_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: Home },
  { label: 'Employees', path: '/admin/employees', icon: Users },
  { label: 'Leave Approvals', path: '/admin/leave', icon: ClipboardList },
  { label: 'Payroll', path: '/admin/payroll', icon: Wallet },
  { label: 'Performance', path: '/admin/performance', icon: TrendingUp },
  { label: 'Training', path: '/admin/training', icon: GraduationCap },
  { label: 'Recruitment', path: '/admin/recruitment', icon: Briefcase },
  { label: 'Onboarding', path: '/admin/onboarding', icon: FolderOpen },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

/* ============================================================
   CSS
   (positioning of .app-navbar itself stays in globals.css)
============================================================ */

const navCSS = `
.nb-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.nb-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }

.nb-icon-btn {
  position: relative; width: 40px; height: 40px; flex-shrink: 0; align-items: center; justify-content: center;
  border: 1px solid var(--card-border); border-radius: 10px; background: var(--bg-primary); color: var(--text-primary); cursor: pointer;
}
.nb-icon-btn.plain { border-color: transparent; background: transparent; color: var(--text-secondary); display: inline-flex; }
.nb-icon-btn.plain:hover { background: var(--bg-primary); }

/* ---------- search ---------- */
.nb-search-trigger { display: none; }
.nb-search { position: relative; flex: 1; width: 100%; max-width: 280px; min-width: 0; }
.nb-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none; z-index: 1; }
.nb-search-input {
  width: 100%; height: 38px; padding: 0 12px 0 36px; border-radius: 8px; font-size: 13px; font-family: inherit; outline: none;
  border: 1.5px solid var(--card-border); background: var(--bg-primary); color: var(--text-primary); transition: border-color .2s, background .2s;
}
.nb-search-input:focus { border-color: #10b981; background: var(--card-bg); }
html.dark .nb-search-input:focus { border-color: #334155; }
.nb-search-input::placeholder { color: var(--text-secondary); }
.nb-icon-btn.nb-search-close { display: none; }
.nb-icon-btn.nb-theme-btn { display: none; }

.nb-results {
  position: absolute; top: 44px; left: 0; right: 0; z-index: 100; overflow: hidden; border-radius: 12px;
  background: var(--card-bg); border: 1px solid var(--card-border); box-shadow: 0 8px 24px rgba(0,0,0,.14);
}
html.dark .nb-results { box-shadow: 0 8px 24px rgba(0,0,0,.45); }
.nb-result { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 16px; border: none; border-bottom: 1px solid var(--card-border); background: transparent; color: inherit; text-align: left; cursor: pointer; font-family: inherit; }
.nb-result:last-child { border-bottom: none; }
.nb-result:hover, .nb-result.current { background: var(--bg-primary); }
.nb-result-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.nb-result-path { font-size: 11px; color: var(--text-secondary); }
.nb-current { margin-left: auto; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: var(--bg-primary); }
.nb-quick-title { padding: 12px 16px 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--text-secondary); }
.nb-none { padding: 14px 16px; font-size: 13px; color: var(--text-secondary); text-align: center; }

/* ---------- right side ---------- */
.nb-session { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; background: var(--bg-primary); border: 1px solid var(--card-border); color: var(--text-primary); font-size: 12px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
.nb-session.warn { color: #ef4444; border-color: rgba(239,68,68,.4); background: rgba(239,68,68,.08); }
.nb-session .short { display: none; }

.nb-bell-badge { position: absolute; top: 3px; right: 3px; min-width: 16px; height: 16px; padding: 0 3px; border-radius: 999px; background: #8b5cf6; color: #fff; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(139,92,246,.4); }
.nb-divider { width: 1px; height: 28px; background: var(--card-border); }

.nb-role { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.nb-role.admin { background: #dbeafe; color: #1d4ed8; } .nb-role.hr { background: #fdf4ff; color: #9333ea; } .nb-role.emp { background: #f0fdf4; color: #16a34a; }
html.dark .nb-role.admin { background: rgba(59,130,246,.15); color: #60a5fa; }
html.dark .nb-role.hr { background: rgba(168,85,247,.15); color: #c084fc; }
html.dark .nb-role.emp { background: rgba(16,185,129,.15); color: #34d399; }

.nb-user { display: flex; align-items: center; gap: 10px; }
.nb-avatar { width: 36px; height: 36px; flex-shrink: 0; border: none; border-radius: 50%; background: linear-gradient(135deg, #1e3a5f, #3b82f6); color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: default; padding: 0; }
.nb-user-name { font-size: 13px; font-weight: 600; white-space: nowrap; color: var(--text-primary); }
.nb-user-sub { font-size: 11px; white-space: nowrap; color: var(--text-secondary); }

/* ---------- mobile profile menu ---------- */
.nb-backdrop, .nb-menu { display: none; }

/* =========================================================
   SMALL DESKTOP / TABLET (<= 1100px)
   ========================================================= */
@media (max-width: 1100px) {
  .nb-role { display: none; }
  .nb-right { gap: 10px; }
}
@media (max-width: 960px) {
  .nb-user-text, .nb-divider { display: none; }
}

/* =========================================================
   MOBILE (<= 768px)
   ========================================================= */
@media (max-width: 768px) {
  .nb-left { flex: 0 0 auto; gap: 8px; }
  .nb-right { gap: 6px; }
  .nb-theme, .nb-role, .nb-user-text, .nb-divider { display: none; }
  .nb-icon-btn.nb-theme-btn { display: inline-flex; }

  .nb-search-trigger { display: inline-flex; }

  /* search becomes a full-width bar over the navbar */
  .nb-search { display: none; }
  .nb-search.open {
    display: flex; align-items: center; gap: 8px; position: fixed; top: 0; left: 0; right: 0; height: 60px; max-width: none;
    padding: 0 12px; z-index: 60; background: var(--card-bg); border-bottom: 1px solid var(--card-border);
  }
  .nb-search.open .nb-search-field { position: relative; flex: 1; min-width: 0; }
  .nb-search.open .nb-search-input { height: 42px; font-size: 16px; border-radius: 12px; } /* stops iOS zoom */
  .nb-search.open .nb-icon-btn.nb-search-close { display: inline-flex; }
  .nb-search.open .nb-results { position: fixed; top: 66px; left: 12px; right: 12px; max-height: calc(100dvh - 90px); overflow-y: auto; }
  .nb-result { padding: 13px 16px; }

  /* session -> compact chip */
  .nb-session { padding: 6px 9px; font-size: 12px; }
  .nb-session .long { display: none; }
  .nb-session .short { display: inline; }

  /* avatar opens profile menu */
  .nb-avatar { cursor: pointer; width: 38px; height: 38px; }

  .nb-backdrop { display: block; position: fixed; inset: 0; z-index: 69; background: rgba(0,0,0,.35); }
  .nb-menu {
    display: block; position: fixed; top: 66px; right: 12px; z-index: 70; width: min(320px, calc(100vw - 24px)); max-height: calc(100dvh - 80px); overflow-y: auto;
    border-radius: 16px; background: var(--card-bg); border: 1px solid var(--card-border); box-shadow: 0 20px 50px rgba(0,0,0,.3);
  }
  .nb-menu-head { display: flex; align-items: center; gap: 12px; padding: 16px; border-bottom: 1px solid var(--card-border); }
  .nb-menu-head .nb-avatar { width: 44px; height: 44px; cursor: default; font-size: 15px; }
  .nb-menu-name { font-size: 15px; font-weight: 700; color: var(--text-primary); word-break: break-word; }
  .nb-menu-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
  .nb-menu-section { padding: 12px 16px; border-bottom: 1px solid var(--card-border); }
  .nb-menu-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--text-secondary); margin-bottom: 8px; }
  .nb-menu-hint { font-size: 11px; color: var(--text-secondary); margin-top: 6px; }
  .nb-menu-link { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 48px; padding: 0 16px; border: none; border-bottom: 1px solid var(--card-border); background: transparent; color: var(--text-primary); font-size: 14px; font-weight: 600; font-family: inherit; text-align: left; cursor: pointer; }
  .nb-menu-link:last-child { border-bottom: none; }
  .nb-menu-link svg:first-child { color: var(--text-secondary); flex-shrink: 0; }
  .nb-menu-link .chev { margin-left: auto; color: var(--text-secondary); }
  .nb-menu-count { margin-left: auto; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px; background: #8b5cf6; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
}

@media (max-width: 380px) {
  .nb-right { gap: 4px; }
  .nb-icon-btn { width: 38px; height: 38px; }
  /* the countdown stays in the profile menu; it only shows here when time is almost up */
  .nb-right > .nb-session:not(.warn) { display: none; }
}
`;

/* ============================================================
   COMPONENT
============================================================ */

export default function Navbar() {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); // mobile full-width search
  const [menuOpen, setMenuOpen] = useState(false); // mobile profile menu
  const [unreadCount, setUnreadCount] = useState(0);

  const [mounted, setMounted] = useState(false);
  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);

  const sessionState = useSessionTimer();

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR';

  const accentColor = isDark ? (isAdmin ? '#c084fc' : '#ccf000') : '#10b981';

  /* ---------- unread count (role-aware) ---------- */

  useEffect(() => {
    let active = true;

    const fetchUnreadCount = async () => {
      try {
        const res = isAdmin ? await getAdminUnreadCount() : await getUnreadCount();

        if (active) {
          setUnreadCount(res.data?.data || 0);
        }
      } catch {
        // ignore notification count errors
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);
    const handleUpdate = () => fetchUnreadCount();

    window.addEventListener('notificationsUpdated', handleUpdate);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('notificationsUpdated', handleUpdate);
    };
  }, [isAdmin]);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* focus the input as soon as the mobile search bar opens */
  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  /* close results (and the mobile search bar) when tapping outside */
  useEffect(() => {
    const handleOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowResults(false);
        setSearchOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, []);

  /* close overlays when the page changes */
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setShowResults(false);
  }, [pathname]);

  /* ---------- search ---------- */

  const allItems = (isAdmin ? ADMIN_SEARCH_ITEMS : EMP_SEARCH_ITEMS)
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label));

  const filtered = search.trim()
    ? allItems.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleSearchSelect = (path) => {
    router.push(path);
    setSearch('');
    setShowResults(false);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const closeSearch = () => {
    setSearch('');
    setShowResults(false);
    setSearchOpen(false);
  };

  const notificationsPath = isAdmin ? '/admin/notifications' : '/employee/notifications';
  const settingsPath = isAdmin ? '/admin/settings' : '/employee/settings';

  /* ---------- session ---------- */

  const sessionTime = formatSessionTime(sessionState.remainingTime);
  const sessionSeconds = Math.ceil(sessionState.remainingTime / 1000);
  const isSessionWarning = sessionSeconds <= 60;

  /* ---------- user ---------- */

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleClass = user?.role === 'ADMIN' ? 'admin' : user?.role === 'HR' ? 'hr' : 'emp';
  const roleLabel = user?.role === 'ADMIN' ? 'Super Admin' : user?.role;

  const renderResultItem = (item, withPath) => {
    const Icon = item.icon;
    const current = pathname === item.path;

    return (
      <button
        key={item.path}
        type="button"
        className={'nb-result' + (current ? ' current' : '')}
        onClick={() => handleSearchSelect(item.path)}
      >
        <Icon size={18} strokeWidth={2} color={current ? accentColor : 'var(--text-secondary)'} />

        <div>
          <div className="nb-result-label">{item.label}</div>
          {withPath && <div className="nb-result-path">{item.path}</div>}
        </div>

        {current && (
          <span className="nb-current" style={{ color: accentColor }}>
            Current
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* SessionManager controls the inactivity timer */}
      <SessionManager />

      <style dangerouslySetInnerHTML={{ __html: navCSS }} />

      <div className="app-navbar">
        {/* ───────────── LEFT ───────────── */}
        <div className="nb-left">
          {/* Mobile hamburger (display is controlled by globals.css) */}
          <button
            type="button"
            className="mobile-hamburger nb-icon-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('toggleMobileSidebar'))}
            title="Toggle Menu"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          {/* Mobile search button */}
          <button
            type="button"
            className="nb-search-trigger nb-icon-btn"
            onClick={() => {
              setSearchOpen(true);
              setShowResults(true);
            }}
            aria-label="Search pages"
          >
            <Search size={18} />
          </button>

          {/* Search */}
          <div ref={searchWrapRef} className={'nb-search' + (searchOpen ? ' open' : '')}>
            <div className="nb-search-field" style={{ position: 'relative', width: '100%' }}>
              <Search size={15} className="nb-search-icon" />

              <input
                ref={searchInputRef}
                value={search}
                autoComplete="off"
                onChange={(e) => {
                  setSearch(e.target.value.replace(/[^a-zA-Z\s]/g, ''));
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                placeholder="Search pages..."
                className="nb-search-input"
              />

              {/* Results */}
              {showResults && search.trim() && (
                <div className="nb-results">
                  {filtered.length === 0 ? (
                    <div className="nb-none">No results for &quot;{search}&quot;</div>
                  ) : (
                    filtered.map((item) => renderResultItem(item, true))
                  )}
                </div>
              )}

              {/* Quick navigation */}
              {showResults && !search.trim() && (
                <div className="nb-results">
                  <div className="nb-quick-title">Quick Navigation</div>
                  {allItems.slice(0, 5).map((item) => renderResultItem(item, false))}
                </div>
              )}
            </div>

            <button type="button" className="nb-search-close nb-icon-btn plain" onClick={closeSearch} aria-label="Close search">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ───────────── RIGHT ───────────── */}
        <div className="nb-right">
          <div className="nb-theme">
            <DashboardThemeSwitcher />
          </div>

          {/* Mobile: one-tap theme toggle right in the bar */}
          <button
            type="button"
            className="nb-theme-btn nb-icon-btn plain"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {mounted && isDark ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {/* Session timer */}
          <div
            className={'nb-session' + (isSessionWarning ? ' warn' : '')}
            title="Automatic logout after 5 minutes of inactivity"
          >
            <Clock3 size={15} />
            <span className="long">Session: {sessionTime}</span>
            <span className="short">{sessionTime}</span>
          </div>

          {/* Bell */}
          <button
            type="button"
            className="nb-icon-btn plain"
            onClick={() => router.push(notificationsPath)}
            title="Go to Notifications"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={2} />

            {unreadCount > 0 && <span className="nb-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>

          <div className="nb-divider" />

          <span className={'nb-role ' + roleClass}>{user?.role}</span>

          {/* User */}
          <div className="nb-user">
            <button
              type="button"
              className="nb-avatar"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Open profile menu"
              aria-expanded={menuOpen}
            >
              {initials}
            </button>

            <div className="nb-user-text">
              <div className="nb-user-name">{user?.name}</div>
              <div className="nb-user-sub">
                {user?.employeeCode} · {roleLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────── MOBILE PROFILE MENU ───────────── */}
      {menuOpen && (
        <>
          <div className="nb-backdrop" onClick={() => setMenuOpen(false)} />

          <div className="nb-menu" role="menu">
            <div className="nb-menu-head">
              <div className="nb-avatar">{initials}</div>

              <div style={{ minWidth: 0 }}>
                <div className="nb-menu-name">{user?.name}</div>
                <div className="nb-menu-sub">
                  {user?.employeeCode} · {roleLabel}
                </div>
              </div>
            </div>

            <div className="nb-menu-section">
              <div className="nb-menu-label">Appearance</div>
              <DashboardThemeSwitcher />
            </div>

            <div className="nb-menu-section">
              <div className="nb-menu-label">Session</div>

              <div className={'nb-session' + (isSessionWarning ? ' warn' : '')} style={{ display: 'inline-flex' }}>
                <Clock3 size={15} />
                <span>Time left: {sessionTime}</span>
              </div>

              <div className="nb-menu-hint">Automatic logout after 5 minutes of inactivity.</div>
            </div>

            <button
              type="button"
              className="nb-menu-link"
              onClick={() => {
                setMenuOpen(false);
                router.push(notificationsPath);
              }}
            >
              <Bell size={18} />
              Notifications
              {unreadCount > 0 ? (
                <span className="nb-menu-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
              ) : (
                <ChevronRight size={16} className="chev" />
              )}
            </button>

            <button
              type="button"
              className="nb-menu-link"
              onClick={() => {
                setMenuOpen(false);
                router.push(settingsPath);
              }}
            >
              <Settings size={18} />
              Settings
              <ChevronRight size={16} className="chev" />
            </button>
          </div>
        </>
      )}

      <HRChatbot />
    </>
  );
}