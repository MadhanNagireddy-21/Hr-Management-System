'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

import {
  Coffee,
  HeartPulse,
  Sun,
  Baby,
  PersonStanding,
  ClipboardList,
  PartyPopper,
  Loader2,
  Check,
  X,
  Trash2,
  MessageSquare,
} from 'lucide-react';

/* ============================================================
   CSS  (everything prefixed "al-")
============================================================ */

const leaveCSS = `
.al-root { width: 100%; max-width: 100%; min-width: 0; color: var(--text-primary); }
.al-root *, .al-root *::before, .al-root *::after { box-sizing: border-box; }
.al-root button { font: inherit; }

/* ---------- header bar ---------- */
.al-bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 24px; border-radius: 12px 12px 0 0; background: #1e3a5f; color: #fff; }
html.dark .al-bar { background: #172a45; }
.al-bar h1 { margin: 0 0 3px; font-size: 17px; font-weight: 700; letter-spacing: -.01em; }
.al-bar p { margin: 0; font-size: 12.5px; color: rgba(255,255,255,.62); }
.al-clear { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; min-height: 38px; padding: 0 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.07); color: rgba(255,255,255,.92); font-size: 12.5px; font-weight: 600; cursor: pointer; transition: background .15s; }
.al-clear:hover:not(:disabled) { background: rgba(255,255,255,.14); }
.al-clear:disabled { opacity: .4; cursor: not-allowed; }

/* ---------- tabs ---------- */
.al-tabs { display: flex; background: var(--card-bg); border-left: 1px solid var(--card-border); border-right: 1px solid var(--card-border); overflow-x: auto; scrollbar-width: none; }
.al-tabs::-webkit-scrollbar { display: none; }
.al-tab { flex: 1 0 auto; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 16px; min-height: 46px; background: transparent; color: var(--text-muted, var(--text-secondary)); border: none; border-bottom: 2px solid transparent; font-size: 13px; font-weight: 600; white-space: nowrap; cursor: pointer; transition: color .15s; }
.al-tab:hover { color: var(--text-primary); }
.al-tab.active { color: var(--text-primary); border-bottom-color: var(--primary, #6366f1); }
.al-tab b { font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 10px; background: var(--bg-secondary); color: var(--text-muted, var(--text-secondary)); }
.al-tab.active b { background: rgba(99,102,241,.14); color: var(--primary, #6366f1); }

/* ---------- table ---------- */
.al-table { border: 1px solid var(--card-border); border-top: none; border-radius: 0 0 12px 12px; overflow: hidden; background: var(--card-bg); box-shadow: var(--card-shadow); }
.al-cols { display: grid; grid-template-columns: 2fr 1.1fr 1fr 1fr .5fr 1.2fr 2fr 44px; align-items: center; }
.al-head { background: var(--bg-secondary); border-bottom: 1px solid var(--card-border); }
.al-th { padding: 11px 14px; font-size: 11.5px; font-weight: 600; color: var(--text-muted, var(--text-secondary)); }
.al-item { border-bottom: 1px solid var(--card-border); transition: background .3s; }
.al-item:hover { background: var(--bg-secondary); }
.al-item.flash { background: rgba(99,102,241,.10); }
.al-row { cursor: pointer; }
.al-cells { display: contents; }
.al-cell { padding: 13px 14px; min-width: 0; font-size: 12.5px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.al-cell::before { display: none; }
.al-emp { display: flex; align-items: center; gap: 11px; padding: 13px 14px; min-width: 0; }
.al-avatar { width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; background: #1e3a5f; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
html.dark .al-avatar { background: #2f4f7f; }
.al-emp-text { min-width: 0; }
.al-name { font-size: 13px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.al-reason { font-size: 11.5px; color: var(--text-muted, var(--text-secondary)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.al-type { display: flex; align-items: center; gap: 7px; font-weight: 500; }
.al-days { font-size: 13px; font-weight: 700; color: var(--text-primary); }

.al-tag { display: inline-block; padding: 4px 11px; border-radius: 999px; font-size: 11.5px; font-weight: 600; white-space: nowrap; }
.al-tag.approved { color: #1b7a43; background: rgba(27,122,67,.12); }
.al-tag.pending { color: #b7791f; background: rgba(183,121,31,.14); }
.al-tag.rejected { color: #b42318; background: rgba(180,35,24,.11); }
.al-tag.cancel_pending { color: #5b3fa0; background: rgba(91,63,160,.12); }
.al-tag.cancelled { color: var(--text-muted, var(--text-secondary)); background: var(--bg-secondary); }
html.dark .al-tag.approved { color: #4ade80; background: rgba(74,222,128,.13); }
html.dark .al-tag.pending { color: #fbbf24; background: rgba(251,191,36,.13); }
html.dark .al-tag.rejected { color: #f87171; background: rgba(248,113,113,.13); }
html.dark .al-tag.cancel_pending { color: #c4b5fd; background: rgba(167,139,250,.15); }

.al-act { padding: 13px 14px; min-width: 0; }
.al-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.al-btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: 32px; padding: 6px 12px; border: none; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background .15s, color .15s, opacity .15s; }
.al-btn:disabled { cursor: not-allowed; opacity: .6; }
.al-btn.ok { color: #1b7a43; background: rgba(27,122,67,.12); }
.al-btn.ok:hover:not(:disabled) { background: #1b7a43; color: #fff; }
.al-btn.no { color: #b42318; background: rgba(180,35,24,.1); }
.al-btn.no:hover:not(:disabled) { background: #b42318; color: #fff; }
html.dark .al-btn.ok { color: #4ade80; background: rgba(74,222,128,.13); }
html.dark .al-btn.no { color: #f87171; background: rgba(248,113,113,.13); }
.al-reviewer { font-size: 12.5px; font-weight: 600; color: var(--text-primary); }
.al-reviewer::before { display: none; }
.al-remarks { font-size: 11.5px; color: var(--text-muted, var(--text-secondary)); }

.al-del-cell { display: flex; justify-content: center; padding: 13px 8px; }
.al-del { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 7px; border: 1px solid var(--card-border); background: transparent; color: var(--text-muted, var(--text-secondary)); cursor: pointer; transition: background .15s, color .15s, border-color .15s; }
.al-del:hover:not(:disabled) { background: rgba(180,35,24,.1); color: #b42318; border-color: rgba(180,35,24,.3); }
html.dark .al-del:hover:not(:disabled) { color: #f87171; }
.al-del:disabled { opacity: .4; cursor: not-allowed; }

.al-expand { display: flex; flex-direction: column; gap: 8px; padding: 4px 20px 20px; }
.al-expand-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text-muted, var(--text-secondary)); }
.al-expand-text { padding: 12px 14px; border-radius: 8px; background: var(--bg-secondary); font-size: 13px; line-height: 1.55; color: var(--text-secondary); white-space: pre-wrap; word-break: break-word; }

.al-empty { padding: 64px 20px; text-align: center; }
.al-empty-icon { display: flex; justify-content: center; margin-bottom: 14px; color: var(--text-muted, var(--text-secondary)); }
.al-empty strong { display: block; margin-bottom: 4px; font-size: 14px; }
.al-empty span { font-size: 12.5px; color: var(--text-muted, var(--text-secondary)); }
.al-loading { padding: 60px; text-align: center; font-size: 13px; color: var(--text-muted, var(--text-secondary)); }

.al-pager { display: flex; justify-content: center; align-items: center; gap: 12px; padding: 14px 20px; border-top: 1px solid var(--card-border); background: var(--bg-secondary); }
.al-pager button { min-height: 38px; padding: 0 16px; border-radius: 8px; border: 1px solid var(--card-border); background: var(--card-bg); color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer; }
.al-pager button:disabled { color: var(--text-muted, var(--text-secondary)); cursor: not-allowed; }
.al-pager span { font-size: 12px; color: var(--text-muted, var(--text-secondary)); font-variant-numeric: tabular-nums; }

/* ---------- confirm modal ---------- */
.al-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,.6); backdrop-filter: blur(4px); }
.al-modal { width: 100%; max-width: 420px; padding: 24px; border-radius: 18px; background: var(--card-bg); border: 1px solid var(--card-border); box-shadow: 0 25px 60px rgba(0,0,0,.35); }
.al-modal-icon { width: 44px; height: 44px; margin-bottom: 14px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(180,35,24,.12); color: #dc2626; }
.al-modal h3 { margin: 0 0 8px; font-size: 18px; font-weight: 800; }
.al-modal p { margin: 0 0 22px; font-size: 13px; line-height: 1.6; color: var(--text-secondary); }
.al-modal-btns { display: flex; gap: 10px; }
.al-modal-btns button { flex: 1; min-height: 46px; display: flex; align-items: center; justify-content: center; gap: 6px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; }
.al-modal-btns button:disabled { opacity: .6; cursor: not-allowed; }
.al-m-cancel { border: 1px solid var(--card-border); background: var(--bg-primary); color: var(--text-primary); }
.al-m-danger { border: none; background: #dc2626; color: #fff; }

/* =========================================================
   TABLE -> CARDS  (<= 900px)
   ========================================================= */
@media (max-width: 900px) {
  .al-head { display: none; }

  .al-cols { grid-template-columns: minmax(0,1fr) auto; grid-template-areas: "emp del" "meta meta" "act act"; gap: 10px 8px; padding: 14px 16px; align-items: start; }
  .al-emp { grid-area: emp; padding: 0; align-items: flex-start; }
  .al-del-cell { grid-area: del; padding: 0; }
  .al-cells { display: flex; flex-wrap: wrap; gap: 8px; grid-area: meta; }
  .al-act { grid-area: act; padding: 0; }

  .al-name { font-size: 14.5px; white-space: normal; }
  .al-reason { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-size: 12.5px; margin-top: 2px; }

  .al-cell { padding: 6px 10px; border-radius: 10px; background: var(--bg-secondary); font-size: 12.5px; }
  .al-cell[data-label]::before { display: inline; content: attr(data-label) ' '; font-weight: 600; color: var(--text-muted, var(--text-secondary)); }
  .al-cell.al-status { padding: 0; background: transparent; }

  .al-act:empty { display: none; }
  .al-reviewer[data-label]::before { display: inline; content: attr(data-label) ' '; font-weight: 500; color: var(--text-muted, var(--text-secondary)); }
  .al-btns { gap: 10px; }
  .al-btn { flex: 1; min-height: 44px; border-radius: 10px; font-size: 13.5px; }
  .al-del { width: 44px; height: 44px; border-radius: 10px; }

  .al-expand { padding: 0 16px 16px; }
}

/* =========================================================
   PHONE (<= 600px)
   ========================================================= */
@media (max-width: 600px) {
  .al-bar { padding: 16px; border-radius: 12px 12px 0 0; }
  .al-bar h1 { font-size: 16px; }
  .al-tab { padding: 12px 14px; }

  .al-overlay { align-items: flex-end; padding: 0; }
  .al-modal { max-width: 100%; border-radius: 20px 20px 0 0; padding: 22px 16px calc(22px + env(safe-area-inset-bottom, 0px)); }
}
`;

/* ============================================================
   SMALL PIECES
============================================================ */

const STATUS_LABEL = {
  APPROVED: 'Approved',
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  CANCELLATION_PENDING: 'Cancel pending',
  CANCELLED: 'Cancelled',
};

function StatusTag({ status }) {
  const key = STATUS_LABEL[status] ? status : 'PENDING';

  return <span className={`al-tag ${key === 'CANCELLATION_PENDING' ? 'cancel_pending' : key.toLowerCase()}`}>{STATUS_LABEL[key]}</span>;
}

const typeMeta = {
  ANNUAL: { icon: <Coffee size={13} />, color: '#6b7bd6' },
  SICK: { icon: <HeartPulse size={13} />, color: '#14a394' },
  CASUAL: { icon: <Sun size={13} />, color: '#d29a1e' },
  PATERNITY: { icon: <Baby size={13} />, color: '#8b78c9' },
  MATERNITY: { icon: <PersonStanding size={13} />, color: '#d1498f' },
  UNPAID: { icon: <ClipboardList size={13} />, color: 'var(--text-secondary)' },
};

/* ============================================================
   PAGE CONTENT
============================================================ */

function AdminLeaveContent() {
  const searchParams = useSearchParams();

  const highlightId = searchParams.get('highlightId');
  const queryTab = searchParams.get('tab');

  const [tab, setTab] = useState(queryTab || 'PENDING');

  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [cancellations, setCancellations] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  const [confirm, setConfirm] = useState(null); // { type: 'delete' | 'clear', id? }
  const [expandedId, setExpandedId] = useState(null);
  const [flash, setFlash] = useState(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [cancellationsCount, setCancellationsCount] = useState(0);

  const loadedTabs = useRef(new Set());

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  /* ---------- fetch ---------- */

  const fetchData = useCallback(async () => {
    const isFirstLoad = !loadedTabs.current.has(tab);
    if (isFirstLoad) setInitialLoading(true);

    try {
      const tabRequest =
        tab === 'PENDING'
          ? api.get(`/api/leaves/pending?page=${page}&size=20`)
          : tab === 'CANCELLATIONS'
            ? api.get(`/api/leaves/pending-cancellations?page=${page}&size=20`)
            : null;

      // one request for the full list serves both the tab data and the counts
      const [tabRes, pendingRes, cancellationsRes, allRes] = await Promise.all([
        tabRequest,
        api.get('/api/leaves/pending?page=0&size=1'),
        api.get('/api/leaves/pending-cancellations?page=0&size=1'),
        api.get('/api/leaves?page=0&size=100'),
      ]);

      const allList = allRes.data?.data?.content || [];

      if (tab === 'PENDING') {
        const data = tabRes.data?.data;
        setPending(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      } else if (tab === 'CANCELLATIONS') {
        const data = tabRes.data?.data;
        setCancellations(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      } else {
        if (tab === 'APPROVED') setApproved(allList.filter((l) => l.status === 'APPROVED'));
        if (tab === 'REJECTED') setRejected(allList.filter((l) => l.status === 'REJECTED'));
        setTotalPages(0);
      }

      setPendingCount(pendingRes.data?.data?.totalElements || 0);
      setCancellationsCount(cancellationsRes.data?.data?.totalElements || 0);
      setApprovedCount(allList.filter((l) => l.status === 'APPROVED').length);
      setRejectedCount(allList.filter((l) => l.status === 'REJECTED').length);

      loadedTabs.current.add(tab);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load requests");
    } finally {
      setInitialLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    if (highlightId) {
      setTab(queryTab || 'PENDING');
      setPage(0);
    }
  }, [highlightId, queryTab]);

  const currentData =
    tab === 'PENDING' ? pending : tab === 'APPROVED' ? approved : tab === 'REJECTED' ? rejected : cancellations;

  /* scroll to + flash the highlighted request */
  useEffect(() => {
    if (!highlightId || initialLoading) return;

    const target = currentData.find((l) => String(l.id) === String(highlightId));
    if (!target) return;

    const element = document.getElementById(`leave-${highlightId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlash(true);

    const timer = setTimeout(() => setFlash(false), 4000);
    return () => clearTimeout(timer);
  }, [highlightId, initialLoading, currentData]);

  /* ---------- actions ---------- */

  const handleAction = async (id, action) => {
    setActioning(id + action);

    try {
      await api.put(`/api/leaves/${id}/action`, {
        action,
        remarks: action === 'APPROVED' ? 'Approved' : 'Rejected',
      });

      toast.success(action === 'APPROVED' ? 'Leave approved' : 'Leave rejected');
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed';
      toast.error(msg.includes('already') ? 'Someone already actioned this one' : msg);
      await fetchData();
    } finally {
      setActioning(null);
    }
  };

  const handleCancelAction = async (id, approve) => {
    setActioning(id + approve);

    try {
      await api.put(`/api/leaves/${id}/cancel-action`, {
        approve,
        remarks: approve ? 'Cancellation confirmed' : 'Cancellation denied',
      });

      toast.success(approve ? 'Cancellation confirmed' : 'Cancellation denied');
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed';
      toast.error(msg.includes('already') ? 'Already resolved by someone else' : msg);
      await fetchData();
    } finally {
      setActioning(null);
    }
  };

  const handleDelete = async (leaveId) => {
    setDeleting(leaveId);

    try {
      await api.delete(`/api/leaves/${leaveId}`);
      toast.success('Leave deleted');
      setConfirm(null);
      setPage(0);
      loadedTabs.current.delete(tab);
      await fetchData();
    } catch (err) {
      console.error('Delete leave error:', err);
      const message = err.response?.data?.message;

      if (message?.includes('linked to payroll')) {
        toast.error('Cannot delete: leave is linked to payroll');
      } else if (message?.includes('balance')) {
        toast.error('Cannot delete: balance restoration failed');
      } else {
        toast.error(message || 'Failed to delete leave request');
      }
    } finally {
      setDeleting(null);
    }
  };

  const tabLabel =
    tab === 'PENDING'
      ? 'Pending Approvals'
      : tab === 'APPROVED'
        ? 'Approved'
        : tab === 'REJECTED'
          ? 'Rejected'
          : 'Cancellations';

  const handleClearAll = async () => {
    const deleteStatus = tab === 'CANCELLATIONS' ? 'CANCELLATION_PENDING' : tab;

    setClearingAll(true);

    try {
      await api.delete(`/api/leaves/clear/${deleteStatus}`);
      toast.success(`${tabLabel} cleared`);
      setConfirm(null);
      setPage(0);
      loadedTabs.current.delete(tab);
      await fetchData();
    } catch (err) {
      console.error('Clear all leaves error:', err);
      toast.error(err.response?.data?.message || `Failed to clear ${tabLabel}`);
    } finally {
      setClearingAll(false);
    }
  };

  const busy = !!actioning || !!deleting || clearingAll;
  const noData = !currentData || currentData.length === 0;

  const tabs = [
    { key: 'PENDING', label: 'Pending', count: pendingCount },
    { key: 'APPROVED', label: 'Approved', count: approvedCount },
    { key: 'REJECTED', label: 'Rejected', count: rejectedCount },
    { key: 'CANCELLATIONS', label: 'Cancellations', count: cancellationsCount },
  ];

  const lastColumnLabel = tab === 'PENDING' || tab === 'CANCELLATIONS' ? 'Actions' : 'Reviewed by';

  /* ---------- render ---------- */

  return (
    <div className="al-root">
      <style dangerouslySetInnerHTML={{ __html: leaveCSS }} />

      {/* Header bar */}
      <div className="al-bar">
        <div>
          <h1>Leave Requests</h1>
          <p>
            {currentData.length} record{currentData.length === 1 ? '' : 's'} in view
          </p>
        </div>

        <button
          type="button"
          className="al-clear"
          onClick={() => setConfirm({ type: 'clear' })}
          disabled={clearingAll || noData}
          title={`Clear all ${tab.toLowerCase()} leaves`}
        >
          {clearingAll ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Clear all
        </button>
      </div>

      {/* Tabs */}
      <div className="al-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={'al-tab' + (tab === t.key ? ' active' : '')}
            onClick={() => {
              setTab(t.key);
              setPage(0);
            }}
          >
            {t.label}
            <b>{t.count}</b>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="al-table">
        <div className="al-cols al-head">
          {['Employee', 'Type', 'From', 'To', 'Days', 'Status', lastColumnLabel, ''].map((h, index) => (
            <div key={index} className="al-th">
              {h}
            </div>
          ))}
        </div>

        {initialLoading && noData ? (
          <div className="al-loading">Loading…</div>
        ) : noData ? (
          <div className="al-empty">
            <div className="al-empty-icon">
              <PartyPopper size={30} strokeWidth={1.5} />
            </div>
            <strong>All clear</strong>
            <span>
              No{' '}
              {tab === 'PENDING'
                ? 'leaves waiting on a decision'
                : tab === 'APPROVED'
                  ? 'approved leaves yet'
                  : tab === 'REJECTED'
                    ? 'rejected leaves'
                    : 'pending cancellations'}{' '}
              right now
            </span>
          </div>
        ) : (
          <>
            {currentData.map((l) => {
              const m = typeMeta[l.leaveType] || typeMeta.UNPAID;
              const isHighlighted = flash && String(l.id) === String(highlightId);
              const isExpanded = expandedId === l.id;

              return (
                <div
                  key={l.id}
                  id={`leave-${l.id}`}
                  className={'al-item' + (isHighlighted ? ' flash' : '')}
                >
                  <div className="al-cols al-row" onClick={() => toggleExpand(l.id)}>
                    {/* Employee */}
                    <div className="al-emp">
                      <div className="al-avatar">
                        {(l.employeeName || '').split(' ').map((n) => n[0] || '').join('').slice(0, 2)}
                      </div>

                      <div className="al-emp-text">
                        <div className="al-name">{l.employeeName}</div>
                        <div className="al-reason" title={l.reason}>
                          {l.reason || 'No reason provided'}
                        </div>
                      </div>
                    </div>

                    {/* Type / dates / days / status (flows into the row grid on desktop) */}
                    <div className="al-cells">
                      <div className="al-cell al-type">
                        <span style={{ color: m.color, display: 'flex' }}>{m.icon}</span>
                        {l.leaveType}
                      </div>

                      <div className="al-cell" data-label="From">
                        {l.startDate}
                      </div>

                      <div className="al-cell" data-label="To">
                        {l.endDate}
                      </div>

                      <div className="al-cell al-days" data-label="Days">
                        {l.totalDays}
                      </div>

                      <div className="al-cell al-status">
                        <StatusTag status={l.status} />
                      </div>
                    </div>

                    {/* Actions / reviewed by */}
                    <div className="al-act" onClick={(e) => e.stopPropagation()}>
                      {tab === 'PENDING' && (
                        <div className="al-btns">
                          <button type="button" className="al-btn ok" onClick={() => handleAction(l.id, 'APPROVED')} disabled={busy}>
                            {actioning === l.id + 'APPROVED' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Approve
                          </button>

                          <button type="button" className="al-btn no" onClick={() => handleAction(l.id, 'REJECTED')} disabled={busy}>
                            {actioning === l.id + 'REJECTED' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                            Reject
                          </button>
                        </div>
                      )}

                      {tab === 'CANCELLATIONS' && (
                        <div className="al-btns">
                          <button type="button" className="al-btn ok" onClick={() => handleCancelAction(l.id, true)} disabled={busy}>
                            {actioning === l.id + 'true' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Confirm
                          </button>

                          <button type="button" className="al-btn no" onClick={() => handleCancelAction(l.id, false)} disabled={busy}>
                            {actioning === l.id + 'false' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                            Deny
                          </button>
                        </div>
                      )}

                      {(tab === 'APPROVED' || tab === 'REJECTED') && (
                        <div>
                          <div className="al-reviewer" data-label="Reviewed by">{l.reviewedByName || '—'}</div>
                          {l.remarks && <div className="al-remarks">{l.remarks}</div>}
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <div className="al-del-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="al-del"
                        onClick={() => setConfirm({ type: 'delete', id: l.id })}
                        disabled={deleting === l.id || !!actioning || clearingAll}
                        title="Delete leave"
                        aria-label="Delete leave"
                      >
                        {deleting === l.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded reason */}
                  {isExpanded && (
                    <div className="al-expand">
                      <div className="al-expand-label">
                        <MessageSquare size={12} />
                        Reason
                      </div>
                      <div className="al-expand-text">{l.reason || 'No reason specified by employee.'}</div>
                    </div>
                  )}
                </div>
              );
            })}

            {(tab === 'PENDING' || tab === 'CANCELLATIONS') && totalPages > 1 && (
              <div className="al-pager">
                <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  Previous
                </button>

                <span>
                  {page + 1} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div
          className="al-overlay"
          onClick={() => {
            if (!deleting && !clearingAll) setConfirm(null);
          }}
        >
          <div className="al-modal" onClick={(e) => e.stopPropagation()}>
            <div className="al-modal-icon">
              <Trash2 size={22} />
            </div>

            <h3>{confirm.type === 'delete' ? 'Delete leave request?' : `Clear all ${tabLabel}?`}</h3>

            <p>
              {confirm.type === 'delete'
                ? 'Are you sure you want to delete this leave request? This action cannot be undone.'
                : `Are you sure you want to clear all ${tabLabel} leave requests? This action cannot be undone.`}
            </p>

            <div className="al-modal-btns">
              <button type="button" className="al-m-cancel" onClick={() => setConfirm(null)} disabled={!!deleting || clearingAll}>
                Cancel
              </button>

              <button
                type="button"
                className="al-m-danger"
                disabled={!!deleting || clearingAll}
                onClick={() => (confirm.type === 'delete' ? handleDelete(confirm.id) : handleClearAll())}
              >
                {deleting || clearingAll ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={15} />
                    {confirm.type === 'delete' ? 'Delete' : 'Clear all'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* useSearchParams must sit inside <Suspense> in the Next.js App Router */
export default function AdminLeavePage() {
  return (
    <Suspense fallback={null}>
      <AdminLeaveContent />
    </Suspense>
  );
}