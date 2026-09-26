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
  {
    key: '/employee/dashboard',
    label: 'Dashboard',
    icon: <Home size={18} strokeWidth={2} />
  },
  {
    key: '/employee/attendance',
    label: 'Attendance',
    icon: <Calendar size={18} strokeWidth={2} />
  },
  {
    key: '/employee/leave',
    label: 'Leave Management',
    icon: <ClipboardList size={18} strokeWidth={2} />
  },
  {
    key: '/employee/payslips',
    label: 'Payslips',
    icon: <CircleDollarSign size={18} strokeWidth={2} />
  },
  {
    key: '/employee/performance',
    label: 'Performance',
    icon: <Star size={18} strokeWidth={2} />
  },
  {
    key: '/employee/onboarding',
    label: 'Onboarding',
    icon: <BadgeCheck size={18} strokeWidth={2} />
  },
  {
    key: '/employee/training',
    label: 'Training',
    icon: <GraduationCap size={18} strokeWidth={2} />
  },
  {
    key: '/employee/jobs',
    label: 'Job Openings',
    icon: <Briefcase size={18} strokeWidth={2} />
  },
  {
    key: '/employee/referrals',
    label: 'My Referrals',
    icon: <Users size={18} strokeWidth={2} />
  },
  {
    key: '/employee/notifications',
    label: 'Notifications',
    icon: <Bell size={18} strokeWidth={2} />
  },

  /* Holiday Calendar stays available for Employee */
  
];


/* =========================================================
   ADMIN / HR MENU
========================================================= */

const ADMIN_MENU = [
  {
    key: '/admin/dashboard',
    label: 'Dashboard',
    icon: <Home size={18} strokeWidth={2} />
  },
  {
    key: '/admin/employees',
    label: 'Employees',
    icon: <Users size={18} strokeWidth={2} />
  },
  {
    key: '/admin/leave',
    label: 'Leave Management',
    icon: <ClipboardList size={18} strokeWidth={2} />
  },

  /*
    IMPORTANT:
    Holiday Management and Holiday Calendar are NOT placed
    directly in the normal menu.

    They will be displayed ONLY inside Leave Management.
  */

  {
    key: '/admin/payroll',
    label: 'Payroll',
    icon: <Wallet size={18} strokeWidth={2} />
  },
  {
    key: '/admin/performance',
    label: 'Performance',
    icon: <Star size={18} strokeWidth={2} />
  },
  {
    key: '/admin/training',
    label: 'Training',
    icon: <GraduationCap size={18} strokeWidth={2} />
  },
  {
    key: '/admin/recruitment',
    label: 'Recruitment',
    icon: <ShieldCheck size={18} strokeWidth={2} />
  },
  {
    key: '/admin/onboarding',
    label: 'Onboarding',
    icon: <BadgeCheck size={18} strokeWidth={2} />
  },

  {
    key: '/admin/onboarding/greetings',
    label: 'Send Greeting',
    icon: <Send size={18} strokeWidth={2} />
  },
  {
    key: '/admin/onboarding/interview',
    label: 'Send Interview',
    icon: <Send size={18} strokeWidth={2} />
  },
  {
    key: '/admin/onboarding/offerletter',
    label: 'Send Offer Letter',
    icon: <Send size={18} strokeWidth={2} />
  },
  {
    key: '/admin/onboarding/document-request',
    label: 'Document Request',
    icon: <FileText size={18} strokeWidth={2} />
  },

  {
    key: '/admin/notifications',
    label: 'Notifications',
    icon: <Bell size={18} strokeWidth={2} />
  }
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

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';


  /* =========================================================
     MOBILE SIDEBAR
  ========================================================= */

  useEffect(() => {

    const handleToggle = () => {
      setIsMobileOpen((prev) => !prev);
    };

    window.addEventListener(
      'toggleMobileSidebar',
      handleToggle
    );

    return () => {
      window.removeEventListener(
        'toggleMobileSidebar',
        handleToggle
      );
    };

  }, []);


  /* =========================================================
     MENU
  ========================================================= */

  const isAdminOrHR =
    role === 'ADMIN' || role === 'HR';

  const menu = isAdminOrHR
    ? ADMIN_MENU
    : EMP_MENU;


  /* =========================================================
     ONBOARDING
  ========================================================= */

  const isOnboardingChildPage =
    pathname.startsWith('/admin/onboarding/');

  useEffect(() => {

    if (isOnboardingChildPage) {
      setIsOnboardingOpen(true);
    }

  }, [isOnboardingChildPage]);


  /* =========================================================
     LEAVE / HOLIDAY PAGES
  ========================================================= */

  const isLeaveChildPage =
    pathname.startsWith('/admin/leave/') ||
    pathname.startsWith('/admin/holiday') ||
    pathname.startsWith('/employee/leave/');


  useEffect(() => {

    if (isLeaveChildPage) {
      setIsLeaveOpen(true);
    }

  }, [isLeaveChildPage]);


  /* =========================================================
     SETTINGS
  ========================================================= */

  const settingsRoute = isAdminOrHR
    ? '/admin/settings'
    : '/employee/settings';


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {

    dispatch(logout());

    router.push('/');

  };


  /* =========================================================
     ACTIVE ITEM
  ========================================================= */

  const isItemActive = (key) => {

    if (pathname === key) {
      return true;
    }

    /* Leave parent */
    if (
      key === '/admin/leave' &&
      (
        pathname.startsWith('/admin/leave/') ||
        pathname.startsWith('/admin/holiday')
      )
    ) {
      return true;
    }

    if (
      key === '/employee/leave' &&
      pathname.startsWith('/employee/leave/')
    ) {
      return true;
    }

    const allKeys = [
      ...menu.map((m) => m.key),
      settingsRoute,
      '/admin/holiday',
      '/admin/leave/holiday-calendar',
      '/employee/leave/holiday-calendar'
    ];

    const bestMatch = allKeys.reduce(
      (best, k) => {

        if (
          pathname === k ||
          pathname.startsWith(k + '/')
        ) {

          if (!best || k.length > best.length) {
            return k;
          }

        }

        return best;

      },
      null
    );

    return key === bestMatch;
  };


  /* =========================================================
     NAV ITEM STYLE
  ========================================================= */

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
        ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.02) 100%)'
        : 'transparent',

      color: active
        ? '#ffffff'
        : '#94a3b8',

      border: active
        ? '1px solid rgba(16, 185, 129, 0.2)'
        : '1px solid transparent',

      fontSize: '13.5px',

      fontWeight: active
        ? '600'
        : '500',

      transition: 'all 0.2s ease',

      letterSpacing: '0.2px',

      textDecoration: 'none'
    };
  };


  /* =========================================================
     COLORS
  ========================================================= */

  const sidebarBg = isDark
    ? '#0A0E17'
    : '#ffffff';

  const borderColor = isDark
    ? 'rgba(255,255,255,0.05)'
    : '#e2e8f0';


  /* =========================================================
     SUB MENU ITEM
  ========================================================= */

  const renderSubMenuItem = (
    sub,
    key
  ) => {

    const active = isItemActive(key);

    return (

      <Link
        key={key}
        href={key}
        onClick={() => {
          setIsMobileOpen(false);
        }}
        style={{
          ...navItemStyle(key),

          paddingLeft: '32px',

          position: 'relative',

          marginBottom: '6px'
        }}

        onMouseEnter={(e) => {

          if (!active) {

            e.currentTarget.style.background =
              isDark
                ? 'rgba(255,255,255,0.03)'
                : '#f8fafc';

          }

        }}

        onMouseLeave={(e) => {

          if (!active) {

            e.currentTarget.style.background =
              'transparent';

          }

        }}
      >

        <div
          style={{
            color: active
              ? '#34d399'
              : isDark
                ? '#cbd5e1'
                : '#64748b',

            display: 'flex'
          }}
        >
          {sub.icon}
        </div>

        <span
          style={{
            color: active
              ? isDark
                ? '#ffffff'
                : '#0f172a'
              : isDark
                ? '#cbd5e1'
                : '#475569'
          }}
        >
          {sub.label}
        </span>

      </Link>

    );
  };


  /* =========================================================
     RETURN
  ========================================================= */

  return (

    <>

      {/* Mobile Overlay */}

      {isMobileOpen && (

        <div
          className="mobile-overlay"
          onClick={() =>
            setIsMobileOpen(false)
          }
        />

      )}


      {/* Sidebar */}

      <div
        className={`app-sidebar ${isMobileOpen
            ? 'mobile-open'
            : ''
          }`}

        style={{
          backgroundColor: sidebarBg,

          borderRight:
            `1px solid ${borderColor}`,

          display: 'flex',

          flexDirection: 'column',

          height: '100vh'
        }}
      >


        {/* =================================================
            LOGO
        ================================================= */}

        <div
          style={{
            padding:
              '28px 24px 20px',

            flexShrink: 0
          }}
        >

          <div
            style={{
              display: 'flex',

              alignItems: 'center',

              gap: '14px'
            }}
          >

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
                style={{
                  width: '73px',

                  height: '73px',

                  objectFit: 'contain'
                }}
              />

            </div>


            <div>

              <div
                style={{
                  color: isDark
                    ? '#ffffff'
                    : '#0f172a',

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


        {/* =================================================
            SCROLLABLE MENU
        ================================================= */}

        <div
          className="hide-scrollbar"

          style={{
            flex: 1,

            overflowY: 'auto',

            overflowX: 'hidden',

            minHeight: 0
          }}
        >

          <div
            style={{
              padding:
                '16px 16px 0'
            }}
          >


            {/* =================================================
                MAIN MENU
            ================================================= */}

            {menu.map((item) => {


              /* =================================================
                 ONBOARDING DROPDOWN
              ================================================= */

              const isAdminOnboarding =
                isAdminOrHR &&
                item.key ===
                '/admin/onboarding';


              if (
                isAdminOnboarding
              ) {

                const isActive =
                  pathname ===
                  '/admin/onboarding' ||
                  pathname.startsWith(
                    '/admin/onboarding/'
                  );

                return (

                  <div
                    key={item.key}
                  >

                    <div
                      onClick={() => {

                        setIsOnboardingOpen(
                          (prev) => !prev
                        );

                        setIsMobileOpen(
                          false
                        );

                        router.push(
                          '/admin/onboarding'
                        );

                      }}

                      style={{
                        ...navItemStyle(
                          item.key
                        ),

                        position:
                          'relative'
                      }}

                      onMouseEnter={(e) => {

                        if (!isActive) {

                          e.currentTarget.style.background =
                            isDark
                              ? 'rgba(255,255,255,0.03)'
                              : '#f8fafc';

                        }

                      }}

                      onMouseLeave={(e) => {

                        if (!isActive) {

                          e.currentTarget.style.background =
                            'transparent';

                        }

                      }}
                    >

                      <div
                        style={{
                          color:
                            isActive
                              ? '#34d399'
                              : isDark
                                ? '#cbd5e1'
                                : '#64748b',

                          display: 'flex'
                        }}
                      >
                        {item.icon}
                      </div>

                      <span>
                        {item.label}
                      </span>

                      <ChevronDown
                        size={14}
                        style={{
                          marginLeft:
                            'auto',

                          color:
                            isActive
                              ? '#34d399'
                              : '#94a3b8',

                          transform:
                            isOnboardingOpen
                              ? 'rotate(180deg)'
                              : 'rotate(0deg)',

                          transition:
                            'transform 0.2s'
                        }}
                      />

                    </div>


                    {/* ONBOARDING CHILDREN */}

                    {isOnboardingOpen &&

                      menu
                        .filter((m) =>
                          m.key.startsWith(
                            '/admin/onboarding/'
                          )
                        )
                        .map((sub) =>
                          renderSubMenuItem(
                            sub,
                            sub.key
                          )
                        )

                    }

                  </div>

                );

              }


              /* =================================================
                 LEAVE MANAGEMENT DROPDOWN
              ================================================= */

              const isLeaveMenu =
                item.key ===
                '/admin/leave' ||
                item.key ===
                '/employee/leave';


              if (isLeaveMenu) {

                const isLeaveActive =
                  isItemActive(
                    item.key
                  );


                return (

                  <div
                    key={item.key}
                  >

                    {/* LEAVE MANAGEMENT */}

                    <div
                      onClick={() => {

                        setIsLeaveOpen(
                          (prev) => !prev
                        );

                        setIsMobileOpen(
                          false
                        );

                        const targetRoute =
                          isAdminOrHR
                            ? '/admin/leave'
                            : '/employee/leave';

                        router.push(
                          targetRoute
                        );

                      }}

                      style={{
                        ...navItemStyle(
                          item.key
                        ),

                        position:
                          'relative'
                      }}

                      onMouseEnter={(e) => {

                        if (!isLeaveActive) {

                          e.currentTarget.style.background =
                            isDark
                              ? 'rgba(255,255,255,0.03)'
                              : '#f8fafc';

                        }

                      }}

                      onMouseLeave={(e) => {

                        if (!isLeaveActive) {

                          e.currentTarget.style.background =
                            'transparent';

                        }

                      }}
                    >

                      <div
                        style={{
                          color:
                            isLeaveActive
                              ? '#34d399'
                              : isDark
                                ? '#cbd5e1'
                                : '#64748b',

                          display: 'flex'
                        }}
                      >
                        {item.icon}
                      </div>


                      <span
                        style={{
                          color:
                            isLeaveActive
                              ? isDark
                                ? '#ffffff'
                                : '#0f172a'
                              : isDark
                                ? '#cbd5e1'
                                : '#475569'
                        }}
                      >
                        {item.label}
                      </span>


                      <ChevronDown
                        size={14}
                        style={{
                          marginLeft:
                            'auto',

                          color:
                            isLeaveActive
                              ? '#34d399'
                              : '#94a3b8',

                          transform:
                            isLeaveOpen
                              ? 'rotate(180deg)'
                              : 'rotate(0deg)',

                          transition:
                            'transform 0.2s'
                        }}
                      />

                    </div>


                    {/* =================================================
                        LEAVE SUB MENU
                    ================================================= */}

                    {isLeaveOpen && (

                      <>

                        {/* ADMIN / HR */}

                        {isAdminOrHR && (

                          <>

                            {/* Holiday Management */}

                            {renderSubMenuItem(
                              {
                                key:
                                  '/admin/holiday',

                                label:
                                  'Holiday Management',

                                icon:
                                  <Calendar
                                    size={18}
                                    strokeWidth={2}
                                  />
                              },

                              '/admin/holiday'
                            )}


                            {/* Holiday Calendar */}

                            {renderSubMenuItem(
                              {
                                key:
                                  '/admin/leave/holiday-calendar',

                                label:
                                  'Holiday Calendar',

                                icon:
                                  <Calendar
                                    size={18}
                                    strokeWidth={2}
                                  />
                              },

                              '/admin/leave/holiday-calendar'
                            )}

                          </>

                        )}


                        {/* EMPLOYEE */}

                        {!isAdminOrHR && (

                          renderSubMenuItem(
                            {
                              key:
                                '/employee/leave/holiday-calendar',

                              label:
                                'Holiday Calendar',

                              icon:
                                <Calendar
                                  size={18}
                                  strokeWidth={2}
                                />
                            },

                            '/employee/leave/holiday-calendar'
                          )

                        )}

                      </>

                    )}

                  </div>

                );

              }


              /* =================================================
                 HIDE ONBOARDING CHILDREN FROM MAIN MENU
              ================================================= */

              if (
                isAdminOrHR &&
                (
                  item.key ===
                  '/admin/onboarding/greetings' ||

                  item.key ===
                  '/admin/onboarding/offerletter' ||

                  item.key ===
                  '/admin/onboarding/interview' ||

                  item.key ===
                  '/admin/onboarding/document-request'
                )
              ) {

                return null;

              }


              /* =================================================
                 NORMAL MENU ITEM
              ================================================= */

              return (

                <Link
                  key={item.key}
                  href={item.key}

                  onClick={() =>
                    setIsMobileOpen(
                      false
                    )
                  }

                  style={{
                    ...navItemStyle(
                      item.key
                    ),

                    position:
                      'relative'
                  }}

                  onMouseEnter={(e) => {

                    if (
                      !isItemActive(
                        item.key
                      )
                    ) {

                      e.currentTarget.style.background =
                        isDark
                          ? 'rgba(255,255,255,0.03)'
                          : '#f8fafc';

                    }

                  }}

                  onMouseLeave={(e) => {

                    if (
                      !isItemActive(
                        item.key
                      )
                    ) {

                      e.currentTarget.style.background =
                        'transparent';

                    }

                  }}
                >

                  <div
                    style={{
                      color:
                        isItemActive(
                          item.key
                        )
                          ? '#34d399'
                          : isDark
                            ? '#cbd5e1'
                            : '#64748b',

                      display: 'flex'
                    }}
                  >
                    {item.icon}
                  </div>


                  <span
                    style={{
                      color:
                        isItemActive(
                          item.key
                        )
                          ? isDark
                            ? '#ffffff'
                            : '#0f172a'
                          : isDark
                            ? '#cbd5e1'
                            : '#475569'
                    }}
                  >
                    {item.label}
                  </span>


                  {item.badge && (

                    <div
                      style={{
                        position:
                          'absolute',

                        right: '12px',

                        background:
                          '#8b5cf6',

                        color:
                          'white',

                        fontSize:
                          '11px',

                        fontWeight:
                          '700',

                        width: '20px',

                        height: '20px',

                        borderRadius:
                          '50%',

                        display: 'flex',

                        alignItems:
                          'center',

                        justifyContent:
                          'center'
                      }}
                    >
                      {item.badge}
                    </div>

                  )}

                </Link>

              );

            })}

          </div>


          {/* Spacer */}

          <div
            style={{
              minHeight:
                '20px'
            }}
          />

        </div>


        {/* =================================================
            SETTINGS + LOGOUT
        ================================================= */}

        <div
          style={{
            padding:
              '16px 16px 20px',

            borderTop:
              `1px solid ${borderColor}`,

            background:
              sidebarBg,

            flexShrink: 0
          }}
        >

          {/* SETTINGS */}

          <Link
            href={
              settingsRoute
            }

            onClick={() =>
              setIsMobileOpen(
                false
              )
            }

            style={{
              ...navItemStyle(
                settingsRoute
              ),

              marginBottom:
                '8px'
            }}
          >

            <div
              style={{
                color:
                  isItemActive(
                    settingsRoute
                  )
                    ? '#34d399'
                    : isDark
                      ? '#cbd5e1'
                      : '#64748b',

                display: 'flex'
              }}
            >

              <Settings
                size={18}
                strokeWidth={2}
              />

            </div>

            Settings

          </Link>


          {/* LOGOUT */}

          <div
            onClick={
              handleLogout
            }

            style={{
              display: 'flex',

              alignItems:
                'center',

              gap: '14px',

              padding:
                '12px 16px',

              borderRadius:
                '10px',

              cursor:
                'pointer',

              color:
                '#ef4444',

              fontSize:
                '13.5px',

              fontWeight:
                '600'
            }}

            onMouseEnter={(e) => {

              e.currentTarget.style.background =
                'rgba(239,68,68,0.1)';

            }}

            onMouseLeave={(e) => {

              e.currentTarget.style.background =
                'transparent';

            }}
          >

            <LogOut
              size={18}
              strokeWidth={2}
            />

            Logout

          </div>

        </div>

      </div>

    </>
  );
}