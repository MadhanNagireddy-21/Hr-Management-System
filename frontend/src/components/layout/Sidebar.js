'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { useTheme } from 'next-themes';
import { logout } from '@/store/authSlice';

import {
  Home,
  Calendar,
  CalendarDays,
  ClipboardList,
  CircleDollarSign,
  Star,
  BadgeCheck,
  Briefcase,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  Users,
  Wallet,
  GraduationCap,
  Send,
  FileText,
  ChevronDown
} from 'lucide-react';


/* =========================================================
   EMPLOYEE MENU
========================================================= */

const EMP_MENU = [
  { key: '/employee/dashboard', label: 'Dashboard', icon: <Home size={18} strokeWidth={2} /> },
  { key: '/employee/attendance', label: 'Attendance', icon: <Calendar size={18} strokeWidth={2} /> },
  { key: '/employee/leave', label: 'Leave Management', icon: <ClipboardList size={18} strokeWidth={2} /> },
  { key: '/employee/payslips', label: 'Payslips', icon: <CircleDollarSign size={18} strokeWidth={2} /> },
  { key: '/employee/performance', label: 'Performance', icon: <Star size={18} strokeWidth={2} /> },
  { key: '/employee/onboarding', label: 'Onboarding', icon: <BadgeCheck size={18} strokeWidth={2} /> },
  { key: '/employee/training', label: 'Training', icon: <GraduationCap size={18} strokeWidth={2} /> },
  { key: '/employee/my-team', label: 'My Team', icon: <Users size={18} strokeWidth={2} /> },
  { key: '/employee/jobs', label: 'Job Openings', icon: <Briefcase size={18} strokeWidth={2} /> },
  { key: '/employee/referrals', label: 'My Referrals', icon: <Users size={18} strokeWidth={2} /> },
  { key: '/employee/notifications', label: 'Notifications', icon: <Bell size={18} strokeWidth={2} /> }
];


/* =========================================================
   ADMIN / HR MENU
========================================================= */

const ADMIN_MENU = [
  { key: '/admin/dashboard', label: 'Dashboard', icon: <Home size={18} strokeWidth={2} /> },
  { key: '/admin/employees', label: 'Employees', icon: <Users size={18} strokeWidth={2} /> },
  { key: '/admin/leave', label: 'Leave Management', icon: <ClipboardList size={18} strokeWidth={2} /> },
  { key: '/admin/payroll', label: 'Payroll', icon: <Wallet size={18} strokeWidth={2} /> },
  { key: '/admin/my-team', label: 'My Team', icon: <Users size={18} strokeWidth={2} /> },
  { key: '/admin/performance', label: 'Performance', icon: <Star size={18} strokeWidth={2} /> },
  { key: '/admin/training', label: 'Training', icon: <GraduationCap size={18} strokeWidth={2} /> },
  { key: '/admin/recruitment', label: 'Recruitment', icon: <ShieldCheck size={18} strokeWidth={2} /> },
  { key: '/admin/onboarding', label: 'Onboarding', icon: <BadgeCheck size={18} strokeWidth={2} /> },
  { key: '/admin/onboarding/greetings', label: 'Send Greeting', icon: <Send size={18} strokeWidth={2} /> },
  { key: '/admin/onboarding/interview', label: 'Send Interview', icon: <Send size={18} strokeWidth={2} /> },
  { key: '/admin/onboarding/offerletter', label: 'Send Offer Letter', icon: <Send size={18} strokeWidth={2} /> },
  { key: '/admin/onboarding/document-request', label: 'Document Request', icon: <FileText size={18} strokeWidth={2} /> },
  { key: '/admin/notifications', label: 'Notifications', icon: <Bell size={18} strokeWidth={2} /> }
];


/* =========================================================
   SIDEBAR
========================================================= */

export default function Sidebar({ role }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';


  /* ---------------- MOBILE SIDEBAR ---------------- */

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);

    window.addEventListener('toggleMobileSidebar', handleToggle);

    return () => {
      window.removeEventListener('toggleMobileSidebar', handleToggle);
    };
  }, []);


  /* ---------------- ROLE ---------------- */

  const isAdminOrHR = role === 'ADMIN' || role === 'HR';

  const menu = isAdminOrHR ? ADMIN_MENU : EMP_MENU;


  /* ---------------- ONBOARDING ---------------- */

  const isOnboardingChildPage = pathname.startsWith('/admin/onboarding/');

  useEffect(() => {
    if (isOnboardingChildPage) {
      setIsOnboardingOpen(true);
    }
  }, [isOnboardingChildPage]);


  /* ---------------- LEAVE / CALENDAR PAGES ---------------- */

  const isLeaveChildPage =
    pathname.startsWith('/admin/leave/') ||
    pathname.startsWith('/admin/holiday') ||
    pathname.startsWith('/employee/leave/');

  useEffect(() => {
    if (isLeaveChildPage) {
      setIsLeaveOpen(true);
    }
  }, [isLeaveChildPage]);


  /* ---------------- SETTINGS ---------------- */

  const settingsRoute = isAdminOrHR ? '/admin/settings' : '/employee/settings';


  /* ---------------- LOGOUT (with confirmation) ---------------- */

  const handleLogout = () => setShowLogoutConfirm(true);

  const cancelLogout = () => setShowLogoutConfirm(false);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    dispatch(logout());
    router.push('/');
  };


  /* ---------------- ACTIVE ITEM ---------------- */

  const isItemActive = (key) => {
    if (pathname === key) return true;

    /* Employee Leave */
    if (key === '/employee/leave' && pathname.startsWith('/employee/leave/')) {
      return true;
    }

    /* Admin Leave */
    if (
      key === '/admin/leave' &&
      (pathname.startsWith('/admin/leave/') || pathname.startsWith('/admin/holiday'))
    ) {
      return true;
    }

    const allKeys = [
      ...menu.map((item) => item.key),
      settingsRoute,

      '/admin/holiday',
      '/admin/leave/holiday-calendar',

      '/employee/leave/holiday-calendar',
      '/employee/leave/company-calendar'
    ];

    const bestMatch = allKeys.reduce((best, k) => {
      if (pathname === k || pathname.startsWith(k + '/')) {
        if (!best || k.length > best.length) {
          return k;
        }
      }
      return best;
    }, null);

    return key === bestMatch;
  };


  /* ---------------- STYLE HELPERS ---------------- */

  const navItemStyle = (key) => {
    const active = isItemActive(key);

    return {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '12px 16px',
      borderRadius: '10px',
      cursor: 'pointer',
      marginBottom: '8px',

      background: active
        ? 'linear-gradient(90deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.02) 100%)'
        : 'transparent',

      color: active ? '#ffffff' : '#94a3b8',

      border: active
        ? '1px solid rgba(16,185,129,0.2)'
        : '1px solid transparent',

      fontSize: '13.5px',
      fontWeight: active ? '600' : '500',
      transition: 'all 0.2s ease',
      letterSpacing: '0.2px',
      textDecoration: 'none'
    };
  };

  const iconColor = (active) =>
    active ? '#34d399' : isDark ? '#cbd5e1' : '#64748b';

  const textColor = (active) =>
    active
      ? isDark ? '#ffffff' : '#0f172a'
      : isDark ? '#cbd5e1' : '#475569';

  const hoverIn = (active) => (e) => {
    if (!active) {
      e.currentTarget.style.background = isDark
        ? 'rgba(255,255,255,0.03)'
        : '#f8fafc';
    }
  };

  const hoverOut = (active) => (e) => {
    if (!active) {
      e.currentTarget.style.background = 'transparent';
    }
  };

  const sidebarBg = isDark ? '#0A0E17' : '#ffffff';

  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0';


  /* ---------------- SUB MENU ITEM ---------------- */

  const renderSubMenuItem = (sub, key) => {
    const active = isItemActive(key);

    return (
      <Link
        key={key}
        href={key}
        onClick={() => setIsMobileOpen(false)}
        style={{
          ...navItemStyle(key),
          paddingLeft: '32px',
          position: 'relative',
          marginBottom: '6px'
        }}
        onMouseEnter={hoverIn(active)}
        onMouseLeave={hoverOut(active)}
      >
        <div style={{ color: iconColor(active), display: 'flex' }}>
          {sub.icon}
        </div>

        <span style={{ color: textColor(active) }}>{sub.label}</span>
      </Link>
    );
  };


  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <>
      {/* MOBILE OVERLAY */}

      {isMobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}


      {/* SIDEBAR */}

      <div
        className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          backgroundColor: sidebarBg,
          borderRight: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}
      >

        {/* ---------------- LOGO ---------------- */}

        <div style={{ padding: '28px 24px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

            <div
              style={{
                width: '73px',
                height: '73px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden'
              }}
            >
              <img
                src="/removee.png"
                alt="Saiteja Infotech"
                style={{ width: '73px', height: '73px', objectFit: 'contain' }}
              />
            </div>

            <div>
              <div
                style={{
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '18px',
                  fontWeight: '800',
                  lineHeight: 1.1,
                  letterSpacing: '0.5px'
                }}
              >
                HRMS
              </div>

              <div
                style={{
                  color: '#64748b',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  marginTop: '3px',
                  fontWeight: '700'
                }}
              >
                HR MANAGEMENT
              </div>
            </div>

          </div>
        </div>


        {/* ---------------- SCROLLABLE MENU ---------------- */}

        <div
          className="hide-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0
          }}
        >
          <div style={{ padding: '16px 16px 0' }}>

            {menu.map((item) => {

              /* ---------- ADMIN ONBOARDING (dropdown) ---------- */

              const isAdminOnboarding =
                isAdminOrHR && item.key === '/admin/onboarding';

              if (isAdminOnboarding) {
                const isActive =
                  pathname === '/admin/onboarding' ||
                  pathname.startsWith('/admin/onboarding/');

                return (
                  <div key={item.key}>

                    <div
                      onClick={() => {
                        setIsOnboardingOpen((prev) => !prev);
                        setIsMobileOpen(false);
                        router.push('/admin/onboarding');
                      }}
                      style={{
                        ...navItemStyle(item.key),
                        position: 'relative'
                      }}
                      onMouseEnter={hoverIn(isActive)}
                      onMouseLeave={hoverOut(isActive)}
                    >
                      <div style={{ color: iconColor(isActive), display: 'flex' }}>
                        {item.icon}
                      </div>

                      <span style={{ color: textColor(isActive) }}>
                        {item.label}
                      </span>

                      <ChevronDown
                        size={14}
                        style={{
                          marginLeft: 'auto',
                          color: isActive ? '#34d399' : '#94a3b8',
                          transform: isOnboardingOpen
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}
                      />
                    </div>

                    {isOnboardingOpen &&
                      menu
                        .filter((m) => m.key.startsWith('/admin/onboarding/'))
                        .map((sub) => renderSubMenuItem(sub, sub.key))}

                  </div>
                );
              }


              /* ---------- LEAVE MANAGEMENT (dropdown) ---------- */

              const isLeaveMenu =
                item.key === '/admin/leave' ||
                item.key === '/employee/leave';

              if (isLeaveMenu) {
                const isLeaveActive = isItemActive(item.key);

                return (
                  <div key={item.key}>

                    <div
                      onClick={() => {
                        setIsLeaveOpen((prev) => !prev);
                        setIsMobileOpen(false);

                        router.push(
                          isAdminOrHR ? '/admin/leave' : '/employee/leave'
                        );
                      }}
                      style={{
                        ...navItemStyle(item.key),
                        position: 'relative'
                      }}
                      onMouseEnter={hoverIn(isLeaveActive)}
                      onMouseLeave={hoverOut(isLeaveActive)}
                    >
                      <div style={{ color: iconColor(isLeaveActive), display: 'flex' }}>
                        {item.icon}
                      </div>

                      <span style={{ color: textColor(isLeaveActive) }}>
                        {item.label}
                      </span>

                      <ChevronDown
                        size={14}
                        style={{
                          marginLeft: 'auto',
                          color: isLeaveActive ? '#34d399' : '#94a3b8',
                          transform: isLeaveOpen
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}
                      />
                    </div>

                    {isLeaveOpen && (
                      <>
                        {/* ADMIN / HR SUB MENU */}

                        {isAdminOrHR && (
                          <>
                            {renderSubMenuItem(
                              {
                                key: '/admin/holiday',
                                label: 'Holiday Management',
                                icon: <Calendar size={18} strokeWidth={2} />
                              },
                              '/admin/holiday'
                            )}

                            {renderSubMenuItem(
                              {
                                key: '/admin/leave/holiday-calendar',
                                label: 'Holiday Calendar',
                                icon: <Calendar size={18} strokeWidth={2} />
                              },
                              '/admin/leave/holiday-calendar'
                            )}
                          </>
                        )}

                        {/* EMPLOYEE SUB MENU */}

                        {!isAdminOrHR && (
                          <>
                            {renderSubMenuItem(
                              {
                                key: '/employee/leave/holiday-calendar',
                                label: 'Holiday Calendar',
                                icon: <Calendar size={18} strokeWidth={2} />
                              },
                              '/employee/leave/holiday-calendar'
                            )}

                            {renderSubMenuItem(
                              {
                                key: '/employee/leave/company-calendar',
                                label: 'Company Calendar',
                                icon: <CalendarDays size={18} strokeWidth={2} />
                              },
                              '/employee/leave/company-calendar'
                            )}
                          </>
                        )}
                      </>
                    )}

                  </div>
                );
              }


              /* ---------- HIDE ADMIN ONBOARDING CHILDREN ---------- */

              if (
                isAdminOrHR &&
                (item.key === '/admin/onboarding/greetings' ||
                  item.key === '/admin/onboarding/offerletter' ||
                  item.key === '/admin/onboarding/interview' ||
                  item.key === '/admin/onboarding/document-request')
              ) {
                return null;
              }


              /* ---------- NORMAL MENU ITEM ---------- */

              const active = isItemActive(item.key);

              return (
                <Link
                  key={item.key}
                  href={item.key}
                  onClick={() => setIsMobileOpen(false)}
                  style={{
                    ...navItemStyle(item.key),
                    position: 'relative'
                  }}
                  onMouseEnter={hoverIn(active)}
                  onMouseLeave={hoverOut(active)}
                >
                  <div style={{ color: iconColor(active), display: 'flex' }}>
                    {item.icon}
                  </div>

                  <span style={{ color: textColor(active) }}>
                    {item.label}
                  </span>

                  {item.badge && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: '#8b5cf6',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '700',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {item.badge}
                    </div>
                  )}
                </Link>
              );
            })}

          </div>

          <div style={{ minHeight: '20px' }} />
        </div>


        {/* ---------------- SETTINGS + LOGOUT ---------------- */}

        <div
          style={{
            padding: '16px 16px 20px',
            borderTop: `1px solid ${borderColor}`,
            background: sidebarBg,
            flexShrink: 0
          }}
        >

          {/* SETTINGS */}

          <Link
            href={settingsRoute}
            onClick={() => setIsMobileOpen(false)}
            style={{
              ...navItemStyle(settingsRoute),
              marginBottom: '8px'
            }}
            onMouseEnter={hoverIn(isItemActive(settingsRoute))}
            onMouseLeave={hoverOut(isItemActive(settingsRoute))}
          >
            <div
              style={{
                color: iconColor(isItemActive(settingsRoute)),
                display: 'flex'
              }}
            >
              <Settings size={18} strokeWidth={2} />
            </div>

            <span style={{ color: textColor(isItemActive(settingsRoute)) }}>
              Settings
            </span>
          </Link>


          {/* LOGOUT */}

          <div
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#ef4444',
              border: '1px solid transparent',
              fontSize: '13.5px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={18} strokeWidth={2} />
            Logout
          </div>

        </div>

      </div>


      {/* =====================================================
          LOGOUT CONFIRMATION MODAL
      ===================================================== */}

      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.48)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={cancelLogout}
        >
          <div
            style={{
              width: 'min(420px, 100%)',
              padding: '24px',
              borderRadius: '18px',
              background: isDark ? '#111827' : '#ffffff',
              border: isDark
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid #e2e8f0',
              boxShadow: '0 24px 70px rgba(15, 23, 42, 0.22)'
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                marginBottom: '14px',
                borderRadius: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444'
              }}
            >
              <LogOut size={21} />
            </div>

            <div
              style={{
                marginBottom: '7px',
                fontSize: '17px',
                fontWeight: '800',
                color: isDark ? '#ffffff' : '#0f172a'
              }}
            >
              Confirm Logout
            </div>

            <div
              style={{
                marginBottom: '22px',
                fontSize: '13px',
                lineHeight: '1.55',
                color: isDark ? '#94a3b8' : '#64748b'
              }}
            >
              Are you sure you want to logout?
              You will need to login again to access your account.
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px'
              }}
            >
              <button
                type="button"
                onClick={cancelLogout}
                style={{
                  minHeight: '44px',
                  padding: '11px 14px',
                  borderRadius: '11px',
                  border: isDark
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid #e2e8f0',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmLogout}
                style={{
                  minHeight: '44px',
                  padding: '11px 14px',
                  borderRadius: '11px',
                  border: '1px solid #ef4444',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}