'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  MessageSquare
} from 'lucide-react';

function StatusTag({ status }) {
  const map = {
    APPROVED: { color: '#1B7A43', bg: 'rgba(27,122,67,0.1)', label: 'Approved' },
    PENDING: { color: '#B7791F', bg: 'rgba(183,121,31,0.12)', label: 'Pending' },
    REJECTED: { color: '#B42318', bg: 'rgba(180,35,24,0.1)', label: 'Rejected' },
    CANCELLATION_PENDING: { color: '#5B3FA0', bg: 'rgba(91,63,160,0.1)', label: 'Cancel pending' },
    CANCELLED: { color: 'var(--text-muted)', bg: 'var(--bg-secondary)', label: 'Cancelled' }
  };

  const s = map[status] || map.PENDING;

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '11.5px',
        fontWeight: 600,
        color: s.color,
        background: s.bg,
        borderRadius: '20px',
        padding: '4px 11px',
        justifySelf: 'start'
      }}
    >
      {s.label}
    </span>
  );
}

const typeMeta = {
  ANNUAL: { icon: <Coffee size={13} />, color: '#4F5B93' },
  SICK: { icon: <HeartPulse size={13} />, color: '#0D7A6E' },
  CASUAL: { icon: <Sun size={13} />, color: '#A16207' },
  PATERNITY: { icon: <Baby size={13} />, color: '#6D5AA8' },
  MATERNITY: { icon: <PersonStanding size={13} />, color: '#A6336B' },
  UNPAID: { icon: <ClipboardList size={13} />, color: 'var(--text-secondary)' }
};

export default function AdminLeavePage() {
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

  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [cancellationsCount, setCancellationsCount] = useState(0);

  const loadedTabs = useRef(new Set());

  const fetchData = useCallback(async () => {
    const isFirstLoad = !loadedTabs.current.has(tab);
    if (isFirstLoad) setInitialLoading(true);

    try {
      if (tab === 'PENDING') {
        const res = await api.get(`/api/leaves/pending?page=${page}&size=20`);
        const data = res.data?.data;
        setPending(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      } else if (tab === 'CANCELLATIONS') {
        const res = await api.get(`/api/leaves/pending-cancellations?page=${page}&size=20`);
        const data = res.data?.data;
        setCancellations(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      } else {
        const res = await api.get(`/api/leaves?page=0&size=100`);
        const all = res.data?.data?.content || [];

        if (tab === 'APPROVED') {
          setApproved(all.filter((l) => l.status === 'APPROVED'));
        }
        if (tab === 'REJECTED') {
          setRejected(all.filter((l) => l.status === 'REJECTED'));
        }
        setTotalPages(0);
      }

      const [pendingRes, cancellationsRes, allRes] = await Promise.all([
        api.get(`/api/leaves/pending?page=0&size=1`),
        api.get(`/api/leaves/pending-cancellations?page=0&size=1`),
        api.get(`/api/leaves?page=0&size=100`)
      ]);

      setPendingCount(pendingRes.data?.data?.totalElements || 0);
      setCancellationsCount(cancellationsRes.data?.data?.totalElements || 0);

      const allList = allRes.data?.data?.content || [];
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

  useEffect(() => {
    if (!highlightId || initialLoading) return;

    const target = currentData.find((l) => String(l.id) === String(highlightId));
    if (!target) return;

    const element = document.getElementById(`leave-${highlightId}`);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.background = 'rgba(79,91,147,0.07)';

    const timer = setTimeout(() => {
      element.style.background = '';
    }, 4000);

    return () => clearTimeout(timer);
  }, [highlightId, initialLoading, currentData]);

  const handleAction = async (id, action) => {
    setActioning(id + action);
    try {
      await api.put(`/api/leaves/${id}/action`, {
        action,
        remarks: action === 'APPROVED' ? 'Approved' : 'Rejected'
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
        remarks: approve ? 'Cancellation confirmed' : 'Cancellation denied'
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
    const confirmed = window.confirm('Are you sure you want to delete this leave request?');
    if (!confirmed) return;

    setDeleting(leaveId);
    try {
      await api.delete(`/api/leaves/${leaveId}`);
      toast.success('Leave deleted');
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

  const handleClearAll = async () => {
    const deleteStatus = tab === 'CANCELLATIONS' ? 'CANCELLATION_PENDING' : tab;

    const tabLabel =
      tab === 'PENDING'
        ? 'Pending Approvals'
        : tab === 'APPROVED'
          ? 'Approved'
          : tab === 'REJECTED'
            ? 'Rejected'
            : 'Cancellations';

    const confirmed = window.confirm(`Are you sure you want to clear all ${tabLabel} leave requests?`);
    if (!confirmed) return;

    setClearingAll(true);
    try {
      await api.delete(`/api/leaves/clear/${deleteStatus}`);
      toast.success(`${tabLabel} cleared`);
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

  const tabs = [
    { key: 'PENDING', label: 'Pending', count: pendingCount },
    { key: 'APPROVED', label: 'Approved', count: approvedCount },
    { key: 'REJECTED', label: 'Rejected', count: rejectedCount },
    { key: 'CANCELLATIONS', label: 'Cancellations', count: cancellationsCount }
  ];

  const lastColumnLabel = tab === 'PENDING' || tab === 'CANCELLATIONS' ? 'Actions' : 'Reviewed by';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .leave-row:hover {
          background: var(--bg-secondary) !important;
        }

        .leave-delete-button:hover:not(:disabled) {
          background: rgba(180, 35, 24, 0.1) !important;
          color: #B42318 !important;
          border-color: rgba(180, 35, 24, 0.3) !important;
        }

        .clear-all-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.5) !important;
        }

        .approve-btn:hover:not(:disabled) {
          background: #1B7A43 !important;
          color: #fff !important;
        }

        .reject-btn:hover:not(:disabled) {
          background: #B42318 !important;
          color: #fff !important;
        }

        .tab-btn:hover:not(.tab-btn-active) {
          color: var(--text-primary) !important;
        }
      `}</style>

      {/* ============================================================
          HEADER BAR
          ============================================================ */}
      <div
        style={{
          background: '#1E3A5F',
          borderRadius: '10px 10px 0 0',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.01em',
              marginBottom: '3px'
            }}
          >
            Leave Requests
          </h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
            {currentData.length} record{currentData.length === 1 ? '' : 's'} in view
          </p>
        </div>

        <button
          className="clear-all-button"
          onClick={handleClearAll}
          disabled={clearingAll || !currentData || currentData.length === 0}
          title={`Clear all ${tab.toLowerCase()} leaves`}
          style={{
            padding: '8px 15px',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: clearingAll || !currentData || currentData.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: clearingAll || !currentData || currentData.length === 0 ? 0.4 : 1,
            transition: 'all 0.15s',
            flexShrink: 0
          }}
        >
          {clearingAll ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Clear all
        </button>
      </div>

      {/* ============================================================
          TABS — underline-style segmented strip
          ============================================================ */}
      <div
        style={{
          display: 'flex',
          background: 'var(--card-bg)',
          borderLeft: '1px solid var(--card-border)',
          borderRight: '1px solid var(--card-border)'
        }}
      >
        {tabs.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              className={`tab-btn ${isActive ? 'tab-btn-active' : ''}`}
              onClick={() => {
                setTab(t.key);
                setPage(0);
              }}
              style={{
                flex: 1,
                padding: '13px 12px',
                background: 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: isActive ? '2px solid #1E3A5F' : '2px solid transparent',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'color 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {t.label}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(30,58,95,0.1)' : 'var(--bg-secondary)',
                  color: isActive ? '#1E3A5F' : 'var(--text-muted)'
                }}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ============================================================
          TABLE
          ============================================================ */}
      <div
        style={{
          border: '1px solid var(--card-border)',
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.1fr 1fr 1fr 0.5fr 1.2fr 2fr 44px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--card-border)'
          }}
        >
          {['Employee', 'Type', 'From', 'To', 'Days', 'Status', lastColumnLabel, ''].map((h, index) => (
            <div
              key={index}
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                padding: '11px 14px'
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {initialLoading && currentData.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading…
          </div>
        ) : currentData.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px', color: 'var(--text-muted)' }}>
              <PartyPopper size={30} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              All clear
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              No{' '}
              {tab === 'PENDING'
                ? 'leaves waiting on a decision'
                : tab === 'APPROVED'
                  ? 'approved leaves yet'
                  : tab === 'REJECTED'
                    ? 'rejected leaves'
                    : 'pending cancellations'}{' '}
              right now
            </div>
          </div>
        ) : (
          <>
            {currentData.map((l) => {
              const m = typeMeta[l.leaveType] || typeMeta.UNPAID;
              const isHighlighted = String(l.id) === String(highlightId);
              const isExpanded = expandedId === l.id;

              return (
                <div
                  key={l.id}
                  id={`leave-${l.id}`}
                  className="leave-row"
                  style={{
                    borderBottom: '1px solid var(--card-border)',
                    background: isHighlighted ? 'rgba(79,91,147,0.07)' : 'transparent',
                    transition: 'background 0.15s'
                  }}
                >
                  <div
                    onClick={() => toggleExpand(l.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.1fr 1fr 1fr 0.5fr 1.2fr 2fr 44px',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {/* EMPLOYEE */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '11px',
                        minWidth: 0,
                        padding: '13px 14px'
                      }}
                    >
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: '#1E3A5F',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#fff',
                          flexShrink: 0
                        }}
                      >
                        {(l.employeeName || '').split(' ').map((n) => n[0] || '').join('').slice(0, 2)}
                      </div>

                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {l.employeeName}
                        </div>
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={l.reason}
                        >
                          {l.reason || 'No reason provided'}
                        </div>
                      </div>
                    </div>

                    {/* TYPE */}
                    <div
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '13px 14px'
                      }}
                    >
                      <span style={{ color: m.color, display: 'flex' }}>{m.icon}</span>
                      {l.leaveType}
                    </div>

                    {/* FROM */}
                    <div
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                        fontVariantNumeric: 'tabular-nums',
                        padding: '13px 14px'
                      }}
                    >
                      {l.startDate}
                    </div>

                    {/* TO */}
                    <div
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                        fontVariantNumeric: 'tabular-nums',
                        padding: '13px 14px'
                      }}
                    >
                      {l.endDate}
                    </div>

                    {/* DAYS */}
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontVariantNumeric: 'tabular-nums',
                        padding: '13px 14px'
                      }}
                    >
                      {l.totalDays}
                    </div>

                    {/* STATUS */}
                    <div style={{ padding: '13px 14px' }}>
                      <StatusTag status={l.status} />
                    </div>

                    {/* ACTIONS / REVIEWED BY */}
                    <div style={{ padding: '13px 14px' }}>
                      {tab === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            className="approve-btn"
                            onClick={() => handleAction(l.id, 'APPROVED')}
                            disabled={!!actioning || !!deleting || clearingAll}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(27,122,67,0.1)',
                              color: '#1B7A43',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              opacity: actioning ? 0.6 : 1,
                              transition: 'all 0.15s'
                            }}
                          >
                            {actioning === l.id + 'APPROVED' ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Check size={11} />
                            )}
                            Approve
                          </button>

                          <button
                            className="reject-btn"
                            onClick={() => handleAction(l.id, 'REJECTED')}
                            disabled={!!actioning || !!deleting || clearingAll}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(180,35,24,0.08)',
                              color: '#B42318',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              opacity: actioning ? 0.6 : 1,
                              transition: 'all 0.15s'
                            }}
                          >
                            {actioning === l.id + 'REJECTED' ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <X size={11} />
                            )}
                            Reject
                          </button>
                        </div>
                      )}

                      {tab === 'CANCELLATIONS' && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            className="approve-btn"
                            onClick={() => handleCancelAction(l.id, true)}
                            disabled={!!actioning || !!deleting || clearingAll}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(27,122,67,0.1)',
                              color: '#1B7A43',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              opacity: actioning ? 0.6 : 1,
                              transition: 'all 0.15s'
                            }}
                          >
                            {actioning === l.id + 'true' ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <Check size={11} />
                            )}
                            Confirm
                          </button>

                          <button
                            className="reject-btn"
                            onClick={() => handleCancelAction(l.id, false)}
                            disabled={!!actioning || !!deleting || clearingAll}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(180,35,24,0.08)',
                              color: '#B42318',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              opacity: actioning ? 0.6 : 1,
                              transition: 'all 0.15s'
                            }}
                          >
                            {actioning === l.id + 'false' ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <X size={11} />
                            )}
                            Deny
                          </button>
                        </div>
                      )}

                      {(tab === 'APPROVED' || tab === 'REJECTED') && (
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {l.reviewedByName || '—'}
                          </div>
                          {l.remarks && (
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{l.remarks}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* DELETE */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '13px 8px' }}>
                      <button
                        className="leave-delete-button"
                        onClick={() => handleDelete(l.id)}
                        disabled={deleting === l.id || !!actioning || clearingAll}
                        title="Delete leave"
                        style={{
                          width: '28px',
                          height: '28px',
                          border: '1px solid var(--card-border)',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          borderRadius: '6px',
                          cursor: deleting === l.id || !!actioning || clearingAll ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: deleting === l.id || !!actioning || clearingAll ? 0.4 : 1,
                          transition: 'all 0.15s'
                        }}
                      >
                        {deleting === l.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* EXPANDED DETAILS */}
                  {isExpanded && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '4px 20px 20px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--text-muted)'
                        }}
                      >
                        <MessageSquare size={12} />
                        Reason
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          lineHeight: '1.55',
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-secondary)',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {l.reason || 'No reason specified by employee.'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {(tab === 'PENDING' || tab === 'CANCELLATIONS') && totalPages > 1 && (
              <div
                style={{
                  padding: '14px 20px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '12px',
                  borderTop: '1px solid var(--card-border)',
                  background: 'var(--bg-secondary)'
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: '6px 14px',
                    border: '1px solid var(--card-border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: page === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                    background: 'var(--card-bg)',
                    cursor: page === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>

                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {page + 1} / {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: '6px 14px',
                    border: '1px solid var(--card-border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: page >= totalPages - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                    background: 'var(--card-bg)',
                    cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}