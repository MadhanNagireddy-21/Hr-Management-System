'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/lib/axios';
import toast from 'react-hot-toast';

import {
  Trash2,
  X,
  Check,
  Loader2,
  Bell,
  BellOff,
  Palmtree,
  Banknote,
  Star,
  BookOpen,
  CalendarDays,
  ClipboardList,
  BriefcaseBusiness,
  CheckCircle2,
  XCircle,
  Ban,
  PartyPopper,
  Megaphone,
} from 'lucide-react';

/* ============================================================
   HELPERS
============================================================ */

function formatTimeAgo(dateStr, now) {
  if (!dateStr) return '';

  const diff = now - new Date(dateStr).getTime();

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return `${days}d ago`;
}

/* icon + colour per notification category */
function getNotifMeta(title) {
  const t = (title || '').toLowerCase();

  if (t.includes('leave')) return { icon: Palmtree, color: '#8b5cf6' };
  if (t.includes('payroll') || t.includes('salary')) return { icon: Banknote, color: '#16a34a' };
  if (t.includes('performance')) return { icon: Star, color: '#f59e0b' };
  if (t.includes('training')) return { icon: BookOpen, color: '#0ea5e9' };
  if (t.includes('attendance')) return { icon: CalendarDays, color: '#10b981' };
  if (t.includes('onboarding')) return { icon: ClipboardList, color: '#6366f1' };
  if (t.includes('recruitment') || t.includes('job')) return { icon: BriefcaseBusiness, color: '#3b82f6' };
  if (t.includes('approved')) return { icon: CheckCircle2, color: '#16a34a' };
  if (t.includes('rejected')) return { icon: XCircle, color: '#ef4444' };
  if (t.includes('cancelled')) return { icon: Ban, color: '#64748b' };
  if (t.includes('festival')) return { icon: PartyPopper, color: '#ec4899' };
  if (t.includes('circular') || t.includes('announcement')) return { icon: Megaphone, color: '#f97316' };

  return { icon: Bell, color: '#6366f1' };
}

/* ============================================================
   CSS
============================================================ */

const notifCSS = `
.nf-root { width: 100%; max-width: 100%; min-width: 0; color: var(--text-primary); }
.nf-root *, .nf-root *::before, .nf-root *::after { box-sizing: border-box; }

/* ---------- header ---------- */
.nf-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.nf-title-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 4px; }
.nf-title { font-size: 24px; font-weight: 800; margin: 0; }
.nf-unread-pill { background: #4f46e5; color: #fff; border-radius: 999px; padding: 3px 12px; font-size: 12px; font-weight: 700; }
.nf-subtitle { font-size: 14px; color: var(--text-muted, var(--text-secondary)); margin: 0; }

.nf-head-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.nf-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 42px; padding: 0 18px;
  border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap;
  border: 1.5px solid var(--card-border); background: var(--card-bg); color: var(--text-primary);
}
.nf-btn:disabled { opacity: .55; cursor: not-allowed; }
.nf-btn.danger { background: rgba(239,68,68,.08); color: #dc2626; border-color: rgba(239,68,68,.35); }
html.dark .nf-btn.danger { color: #f87171; }

/* ---------- filter tabs ---------- */
.nf-tabs { display: inline-flex; gap: 6px; padding: 5px; margin-bottom: 18px; border-radius: 12px; background: var(--card-bg); border: 1px solid var(--card-border); box-shadow: var(--card-shadow); }
.nf-tab { min-height: 38px; padding: 0 20px; border: none; border-radius: 8px; background: transparent; color: var(--text-secondary); font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; }
.nf-tab.active { background: #4f46e5; color: #fff; }

/* ---------- list ---------- */
.nf-panel { border-radius: 16px; background: var(--card-bg); border: 1px solid var(--card-border); box-shadow: var(--card-shadow); overflow: hidden; }
.nf-row {
  position: relative; display: grid; grid-template-columns: 46px minmax(0,1fr) auto; gap: 14px; align-items: start;
  padding: 16px 20px; border-bottom: 1px solid var(--card-border); border-left: 3px solid transparent;
  cursor: pointer; transition: background .15s;
}
.nf-row:last-of-type { border-bottom: none; }
.nf-row:hover, .nf-row:focus-visible { background: rgba(148,163,184,.08); outline: none; }
.nf-row.unread { background: rgba(79,70,229,.06); border-left-color: #4f46e5; }
.nf-row.unread:hover { background: rgba(79,70,229,.10); }

.nf-icon { position: relative; width: 46px; height: 46px; border-radius: 13px; display: flex; align-items: center; justify-content: center; }
.nf-dot { position: absolute; top: -3px; right: -3px; width: 12px; height: 12px; border-radius: 50%; background: #4f46e5; border: 2px solid var(--card-bg); }
.nf-body { min-width: 0; }
.nf-row-title { font-size: 14px; margin-bottom: 4px; word-break: break-word; }
.nf-row.unread .nf-row-title { font-weight: 800; }
.nf-row.read .nf-row-title { font-weight: 600; }
.nf-msg { font-size: 13px; line-height: 1.55; color: var(--text-secondary); margin-bottom: 6px; word-break: break-word; }
.nf-time { font-size: 12px; color: var(--text-muted, var(--text-secondary)); }

.nf-actions { display: flex; align-items: center; gap: 8px; }
.nf-mini { min-height: 34px; padding: 0 14px; border-radius: 8px; border: 1.5px solid var(--card-border); background: var(--card-bg); color: #4f46e5; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
html.dark .nf-mini { color: #818cf8; }
.nf-del { width: 36px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1.5px solid var(--card-border); background: var(--card-bg); color: #dc2626; cursor: pointer; flex-shrink: 0; transition: background .15s, border-color .15s; }
.nf-del:hover { background: rgba(239,68,68,.10); border-color: rgba(239,68,68,.4); }
html.dark .nf-del { color: #f87171; }
.nf-del:disabled { cursor: not-allowed; opacity: .6; }

.nf-pager { padding: 14px 20px; display: flex; justify-content: center; align-items: center; gap: 10px; border-top: 1px solid var(--card-border); }
.nf-pager button { min-height: 38px; padding: 0 16px; border: 1.5px solid var(--card-border); border-radius: 8px; background: var(--card-bg); color: var(--text-primary); font-size: 12px; font-weight: 700; cursor: pointer; }
.nf-pager button:disabled { color: var(--text-muted, var(--text-secondary)); cursor: not-allowed; }
.nf-pager span { font-size: 12px; font-weight: 600; color: var(--text-secondary); }

.nf-state { padding: 70px 20px; text-align: center; color: var(--text-muted, var(--text-secondary)); font-size: 14px; }
.nf-empty { padding: 70px 20px; text-align: center; }
.nf-empty-icon { width: 64px; height: 64px; border-radius: 20px; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; background: rgba(99,102,241,.12); color: #6366f1; }
.nf-empty h3 { font-size: 16px; font-weight: 700; margin: 0 0 6px; }
.nf-empty p { font-size: 13px; color: var(--text-secondary); margin: 0; }
.nf-empty button { margin-top: 16px; min-height: 42px; padding: 0 22px; border: none; border-radius: 10px; background: #4f46e5; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; }

/* ---------- modals ---------- */
.nf-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,.6); backdrop-filter: blur(4px); }
.nf-modal { width: 100%; max-width: 430px; max-height: calc(100dvh - 40px); overflow-y: auto; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 18px; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,.35); }
.nf-modal-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
.nf-modal-title-wrap { display: flex; align-items: center; gap: 10px; min-width: 0; }
.nf-modal-icon { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(239,68,68,.14); color: #dc2626; }
.nf-modal-title { font-size: 18px; font-weight: 800; margin: 0; }
.nf-x { width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: none; border-radius: 8px; background: transparent; color: var(--text-secondary); cursor: pointer; }
.nf-modal-text { font-size: 13px; line-height: 1.6; color: var(--text-secondary); margin: 0; }
.nf-preview { margin-top: 16px; padding: 12px; border-radius: 10px; background: var(--bg-primary); border: 1px solid var(--card-border); }
.nf-preview b { display: block; font-size: 13px; font-weight: 700; word-break: break-word; }
.nf-preview span { display: block; margin-top: 4px; font-size: 12px; line-height: 1.5; color: var(--text-secondary); word-break: break-word; }
.nf-modal-btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
.nf-modal-btns button { min-height: 44px; padding: 0 20px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.nf-modal-btns button:disabled { opacity: .55; cursor: not-allowed; }
.nf-b-cancel { border: 1px solid var(--card-border); background: var(--card-bg); color: var(--text-primary); }
.nf-b-delete { border: none; background: #dc2626; color: #fff; }
.nf-b-close { border: none; background: #4f46e5; color: #fff; }

/* letter / details modal */
.nf-letter { z-index: 10000; }
.nf-letter-box { width: 100%; max-width: 620px; max-height: calc(100dvh - 40px); display: flex; flex-direction: column; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 18px; box-shadow: 0 25px 70px rgba(0,0,0,.4); overflow: hidden; }
.nf-letter-top { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid var(--card-border); flex-shrink: 0; }
.nf-letter-top p { margin: 0; font-size: 14px; font-weight: 700; }
.nf-letter-scroll { flex: 1; overflow-y: auto; padding: 32px 36px 24px; overscroll-behavior: contain; }
.nf-brand { display: flex; align-items: center; gap: 12px; padding-bottom: 18px; margin-bottom: 24px; border-bottom: 1.5px solid var(--text-primary); }
.nf-logo { width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0; background: #eef2ff; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.nf-logo img { width: 100%; height: 100%; object-fit: contain; padding: 2px; }
.nf-brand-name { font-size: 15px; font-weight: 700; }
.nf-brand-sub { font-size: 12px; color: var(--text-muted, var(--text-secondary)); }
.nf-letter-meta { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--text-secondary); margin-bottom: 22px; }
.nf-letter-h { font-size: 20px; font-weight: 800; margin: 0 0 20px; word-break: break-word; }
.nf-letter-body { font-size: 15px; line-height: 1.8; white-space: pre-wrap; word-break: break-word; }
.nf-sign { margin-top: 28px; font-size: 15px; }
.nf-sign strong { display: block; margin-top: 4px; }
.nf-letter-foot { display: flex; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid var(--card-border); flex-shrink: 0; }

/* =========================================================
   PHONE (<= 640px)
   ========================================================= */
@media (max-width: 640px) {
  .nf-head { margin-bottom: 14px; }
  .nf-title { font-size: 21px; }
  .nf-subtitle { font-size: 13px; }
  .nf-head-actions { width: 100%; justify-content: stretch; }
  .nf-head-actions .nf-btn { flex: 1; }

  .nf-tabs { display: flex; width: 100%; margin-bottom: 14px; }
  .nf-tab { flex: 1; padding: 0 10px; }

  .nf-panel { border-radius: 14px; }
  .nf-row { grid-template-columns: 42px minmax(0,1fr); gap: 12px; padding: 14px; }
  .nf-icon { width: 42px; height: 42px; border-radius: 12px; }
  .nf-actions { grid-column: 2; justify-content: flex-end; padding-top: 2px; }
  .nf-mini { min-height: 38px; }
  .nf-del { width: 40px; height: 38px; }

  .nf-overlay { align-items: flex-end; padding: 0; }
  .nf-modal { max-width: 100%; border-radius: 20px 20px 0 0; padding: 20px 16px calc(20px + env(safe-area-inset-bottom, 0px)); }
  .nf-modal-btns button { flex: 1; }

  .nf-letter-box { max-width: 100%; max-height: 92dvh; border-radius: 20px 20px 0 0; }
  .nf-letter-scroll { padding: 22px 18px 18px; }
  .nf-letter-h { font-size: 18px; }
  .nf-letter-body, .nf-sign { font-size: 14.5px; }
  .nf-letter-meta { flex-direction: column; gap: 4px; }
  .nf-letter-foot { padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); }
  .nf-letter-foot button { width: 100%; }
}
`;

/* ============================================================
   PAGE
============================================================ */

export default function EmployeeNotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* ---------- fetch ---------- */

  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const [notifRes, unreadRes] = await Promise.allSettled([
        filter === 'UNREAD'
          ? api.get(`/api/notifications/unread?page=${page}&size=10`)
          : api.get(`/api/notifications?page=${page}&size=10`),

        api.get('/api/notifications/unread-count'),
      ]);

      if (notifRes.status === 'fulfilled') {
        const data = notifRes.value.data?.data;
        setNotifications(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      }

      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(unreadRes.value.data?.data || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchNotifications(), 0);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  /* ---------- mark read ---------- */

  const handleMarkRead = async (id) => {
    const notification = notifications.find((n) => n.id === id);

    if (!notification || notification.isRead) return;

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.put(`/api/notifications/${id}/read`);
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);

    try {
      await api.put('/api/notifications/mark-all-read');

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      toast.success('All notifications marked as read!');
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  /*
   * Notification click navigation
   *   Leave                  -> Employee Leave
   *   Job                    -> Job Details
   *   Document / Onboarding  -> Onboarding
   *   General                -> Details modal
   */

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await handleMarkRead(notification.id);
      }

      const type = String(notification.referenceType || notification.type || '').toUpperCase();
      const referenceId = notification.referenceId ?? notification.reference_id;

      if (referenceId) {
        if (type.includes('LEAVE')) {
          router.push(`/employee/leave?highlightId=${encodeURIComponent(referenceId)}`);
          return;
        }

        if (type.includes('JOB_POSTED') || type.includes('JOBPOSTING') || type.includes('JOB')) {
          router.push(`/employee/jobs/details?id=${encodeURIComponent(referenceId)}`);
          return;
        }

        if (type.includes('DOCUMENT') || type.includes('ONBOARDING') || type.includes('DOC')) {
          router.push(`/employee/onboarding?highlightId=${encodeURIComponent(referenceId)}`);
          return;
        }
      }

      setSelectedNotification(notification);
    } catch (error) {
      console.error('Unable to open notification:', error);
      toast.error('Unable to open notification');
    }
  };

  /* ---------- delete ---------- */

  const openDeleteModal = (notification) => {
    setNotificationToDelete(notification);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setNotificationToDelete(null);
  };

  const handleDelete = async () => {
    if (!notificationToDelete) return;

    const id = notificationToDelete.id;
    setDeletingId(id);

    try {
      await api.delete(`/api/notifications/${id}`);

      if (!notificationToDelete.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));

      closeDeleteModal();
      toast.success('Notification deleted');
      window.dispatchEvent(new Event('notificationsUpdated'));

      if (notifications.length === 1 && page > 0) {
        setPage((prev) => Math.max(0, prev - 1));
      } else {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------- clear all ---------- */

  const openClearAllModal = () => {
    if (notifications.length === 0) return;
    setShowClearModal(true);
  };

  const handleClearAll = async () => {
    setClearingAll(true);

    try {
      await api.delete('/api/notifications/clear-all');

      setNotifications([]);
      setUnreadCount(0);
      setTotalPages(0);
      setPage(0);
      setShowClearModal(false);

      toast.success('All notifications cleared');
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      toast.error(error?.response?.data?.message || 'Failed to clear notifications');
    } finally {
      setClearingAll(false);
    }
  };

  /* ---------- render ---------- */

  return (
    <div className="nf-root">
      <style dangerouslySetInnerHTML={{ __html: notifCSS }} />

      {/* DETAILS MODAL */}
      {selectedNotification && (
        <div className="nf-overlay nf-letter" onClick={() => setSelectedNotification(null)}>
          <div className="nf-letter-box" onClick={(e) => e.stopPropagation()}>
            <div className="nf-letter-top">
              <p>Notification</p>
              <button type="button" className="nf-x" onClick={() => setSelectedNotification(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="nf-letter-scroll">
              <div className="nf-brand">
                <div className="nf-logo">
                  <img src="/removee.png" alt="Saiteja Infotech Private Limited" />
                </div>

                <div>
                  <div className="nf-brand-name">Saiteja Infotech Private Limited</div>
                  <div className="nf-brand-sub">Office circular</div>
                </div>
              </div>

              <div className="nf-letter-meta">
                <span>
                  To: <strong>You</strong>
                </span>

                <span>
                  {selectedNotification.createdAt
                    ? new Date(selectedNotification.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                    : ''}
                </span>
              </div>

              <h1 className="nf-letter-h">{selectedNotification.title}</h1>

              <div className="nf-letter-body">{selectedNotification.message}</div>

              <div className="nf-sign">
                Warm regards,
                <strong>Saiteja Infotech Private Limited</strong>
              </div>
            </div>

            <div className="nf-letter-foot">
              <div className="nf-modal-btns" style={{ margin: 0, width: '100%', justifyContent: 'flex-end' }}>
                <button type="button" className="nf-b-close" onClick={() => setSelectedNotification(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="nf-head">
        <div>
          <div className="nf-title-row">
            <h1 className="nf-title">Notifications</h1>
            {unreadCount > 0 && <span className="nf-unread-pill">{unreadCount} unread</span>}
          </div>

          <p className="nf-subtitle">Stay updated with your latest alerts and activities.</p>
        </div>

        <div className="nf-head-actions">
          {unreadCount > 0 && (
            <button type="button" className="nf-btn" onClick={handleMarkAllRead} disabled={markingAll}>
              {markingAll ? (
                'Marking...'
              ) : (
                <>
                  <Check size={14} /> Mark all as read
                </>
              )}
            </button>
          )}

          {notifications.length > 0 && (
            <button type="button" className="nf-btn danger" onClick={openClearAllModal} disabled={clearingAll}>
              <Trash2 size={14} />
              {clearingAll ? 'Clearing...' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {/* FILTER */}
      <div className="nf-tabs">
        {['ALL', 'UNREAD'].map((f) => (
          <button
            key={f}
            type="button"
            className={'nf-tab' + (filter === f ? ' active' : '')}
            onClick={() => {
              setFilter(f);
              setPage(0);
            }}
          >
            {f === 'ALL' ? 'All Notifications' : `Unread${unreadCount ? ` (${unreadCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="nf-panel">
        {loading ? (
          <div className="nf-state">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="nf-empty">
            <div className="nf-empty-icon">
              <BellOff size={28} />
            </div>

            <h3>{filter === 'UNREAD' ? "You're all caught up!" : 'No notifications yet'}</h3>

            <p>
              {filter === 'UNREAD'
                ? 'No unread notifications right now.'
                : 'Updates and alerts will appear here.'}
            </p>

            {filter === 'UNREAD' && (
              <button
                type="button"
                onClick={() => {
                  setFilter('ALL');
                  setPage(0);
                }}
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <>
            {notifications.map((n) => {
              const meta = getNotifMeta(n.title);
              const Icon = meta.icon;

              const shortMessage =
                n.message?.length > 160 ? `${n.message.substring(0, 160)}...` : n.message;

              return (
                <div
                  key={n.id}
                  className={`nf-row ${n.isRead ? 'read' : 'unread'}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(n);
                    }
                  }}
                >
                  <div className="nf-icon" style={{ background: meta.color + '1f', color: meta.color }}>
                    <Icon size={21} />
                    {!n.isRead && <span className="nf-dot" />}
                  </div>

                  <div className="nf-body">
                    <div className="nf-row-title">{n.title}</div>
                    {n.message && <div className="nf-msg">{shortMessage}</div>}
                    <div className="nf-time">{formatTimeAgo(n.createdAt, now)}</div>
                  </div>

                  <div className="nf-actions">
                    {!n.isRead && (
                      <button
                        type="button"
                        className="nf-mini"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n.id);
                        }}
                      >
                        Mark read
                      </button>
                    )}

                    <button
                      type="button"
                      className="nf-del"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(n);
                      }}
                      disabled={deletingId === n.id}
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      {deletingId === n.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="nf-pager">
                <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  ← Prev
                </button>

                <span>
                  Page {page + 1} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && notificationToDelete && (
        <div
          className="nf-overlay"
          onClick={() => {
            if (!deletingId) closeDeleteModal();
          }}
        >
          <div className="nf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-head">
              <div className="nf-modal-title-wrap">
                <div className="nf-modal-icon">
                  <Trash2 size={18} />
                </div>
                <h2 className="nf-modal-title">Delete Notification?</h2>
              </div>

              <button type="button" className="nf-x" onClick={closeDeleteModal} disabled={deletingId !== null} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <p className="nf-modal-text">Are you sure you want to delete this notification?</p>

            <div className="nf-preview">
              <b>{notificationToDelete.title}</b>
              {notificationToDelete.message && <span>{notificationToDelete.message}</span>}
            </div>

            <div className="nf-modal-btns">
              <button type="button" className="nf-b-cancel" onClick={closeDeleteModal} disabled={deletingId !== null}>
                Cancel
              </button>

              <button type="button" className="nf-b-delete" onClick={handleDelete} disabled={deletingId !== null}>
                {deletingId !== null ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL MODAL */}
      {showClearModal && (
        <div
          className="nf-overlay"
          onClick={() => {
            if (!clearingAll) setShowClearModal(false);
          }}
        >
          <div className="nf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="nf-modal-head">
              <div className="nf-modal-title-wrap">
                <div className="nf-modal-icon">
                  <Trash2 size={18} />
                </div>
                <h2 className="nf-modal-title">Clear All Notifications?</h2>
              </div>

              <button type="button" className="nf-x" onClick={() => setShowClearModal(false)} disabled={clearingAll} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <p className="nf-modal-text">
              Are you sure you want to clear all notifications? This action cannot be undone.
            </p>

            <div className="nf-modal-btns">
              <button type="button" className="nf-b-cancel" onClick={() => setShowClearModal(false)} disabled={clearingAll}>
                Cancel
              </button>

              <button type="button" className="nf-b-delete" onClick={handleClearAll} disabled={clearingAll}>
                {clearingAll ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Clearing...
                  </>
                ) : (
                  'Clear All'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}