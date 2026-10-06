'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

import {
  Check,
  Clock,
  X,
  Undo2,
  Circle,
  Palmtree,
  Thermometer,
  Sun,
  Baby,
  ClipboardList,
  Lightbulb,
  Sparkles,
  Loader2,
  Calendar,
  FileText,
  Trash2,
} from 'lucide-react';

/* ============================================================
   CSS  (layout + responsive rules live here)
============================================================ */

const leaveCSS = `
.lm-root { width: 100%; max-width: 100%; min-width: 0; color: var(--text-primary); }
.lm-root *, .lm-root *::before, .lm-root *::after { box-sizing: border-box; }

/* ---------- header ---------- */
.lm-head { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 14px; margin-bottom: 24px; }
.lm-title { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
.lm-subtitle { font-size: 13px; color: var(--text-secondary); margin: 0; }
.lm-btn-primary {
  padding: 12px 22px; min-height: 44px; background: var(--primary); color: #fff; border: none;
  border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  box-shadow: 0 4px 12px rgba(99,102,241,.3);
}

/* ---------- stats ---------- */
.lm-stats { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; margin-bottom: 24px; }
.lm-stat { border-radius: 14px; padding: 20px; position: relative; overflow: hidden; min-width: 0; }
.lm-stat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; position: relative; z-index: 2; }
.lm-stat-label { font-size: 13px; font-weight: 600; letter-spacing: .3px; color: var(--text-secondary); }
.lm-stat-icon { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.lm-stat-value { font-size: 28px; font-weight: 800; margin-bottom: 4px; position: relative; z-index: 2; }
.lm-stat-sub { font-size: 12px; color: var(--text-secondary); position: relative; z-index: 2; }
.lm-spark {
  position: absolute; bottom: 20px; right: 20px; width: 45%; height: 35px; z-index: 1; opacity: .9;
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 25%);
  mask-image: linear-gradient(to right, transparent 0%, black 25%);
}

/* ---------- balance ---------- */
.lm-bal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; margin-bottom: 24px; }
.lm-bal {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; min-width: 0;
  background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px;
  padding: 16px; box-shadow: var(--card-shadow); transition: transform .15s;
}
.lm-bal:hover { transform: translateY(-2px); }
.lm-bal-text { text-align: right; min-width: 0; }
.lm-bal-type { display: flex; align-items: center; justify-content: flex-end; gap: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 2px; }
.lm-bal-value { font-size: 18px; font-weight: 800; white-space: nowrap; }
.lm-bal-value small { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.lm-empty-wide { grid-column: 1 / -1; padding: 30px; text-align: center; color: var(--text-secondary); }

/* ---------- history panel ---------- */
.lm-panel { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; box-shadow: var(--card-shadow); overflow: hidden; }
.lm-panel-head { padding: 16px 20px; border-bottom: 1px solid var(--card-border); display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.lm-panel-title { font-size: 15px; font-weight: 700; margin: 0; }
.lm-panel-count { font-size: 12px; color: var(--text-secondary); }
.lm-clear {
  padding: 9px 16px; min-height: 38px; background: rgba(239,68,68,.06); color: #ef4444;
  border: 1px solid rgba(239,68,68,.45); border-radius: 8px; font-size: 12px; font-weight: 700;
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
}
.lm-clear:hover { background: rgba(239,68,68,.12); }
.lm-clear:disabled { opacity: .5; cursor: not-allowed; }

/* ---------- table (desktop) ---------- */
.lm-cols { display: grid; grid-template-columns: 1.4fr 1fr 1fr .6fr 1.4fr 1.3fr 1.1fr; gap: 8px; align-items: center; padding: 14px 20px; }
.lm-thead { background: var(--bg-primary); border-bottom: 1px solid var(--card-border); padding: 12px 20px; }
.lm-th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--text-secondary); }
.lm-row { border-bottom: 1px solid var(--card-border); transition: background .2s; }
.lm-row:hover { background: var(--bg-primary); }
.lm-cell { min-width: 0; font-size: 13px; color: var(--text-secondary); }
.lm-cell::before { display: none; }
.lm-type { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-primary); }
.lm-type-icon { width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.lm-days { font-weight: 800; color: var(--text-primary); }
.lm-actions { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.lm-act-cancel { padding: 6px 10px; min-height: 32px; background: transparent; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.lm-act-delete { width: 34px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; color: #ef4444; border: 1px solid rgba(239,68,68,.35); border-radius: 7px; cursor: pointer; flex-shrink: 0; }
.lm-act-delete:hover { background: rgba(239,68,68,.10); }

.lm-empty { padding: 60px 20px; text-align: center; }
.lm-pager { padding: 14px 20px; display: flex; justify-content: center; align-items: center; gap: 8px; border-top: 1px solid var(--card-border); }
.lm-pager button { padding: 8px 14px; min-height: 36px; border: 1px solid var(--card-border); border-radius: 6px; font-size: 12px; font-weight: 700; background: var(--bg-primary); color: var(--text-primary); cursor: pointer; }
.lm-pager button:disabled { color: var(--text-secondary); cursor: not-allowed; }
.lm-pager span { font-size: 12px; color: var(--text-secondary); }

/* ---------- modals ---------- */
.lm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 100; backdrop-filter: blur(4px); }
.lm-overlay.confirm { background: rgba(0,0,0,.65); z-index: 200; }
.lm-sheet {
  width: 100%; max-width: 500px; max-height: calc(100dvh - 40px); overflow-y: auto; overscroll-behavior: contain;
  background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 22px;
  padding: 28px; box-shadow: 0 24px 70px rgba(0,0,0,.5);
}
.lm-confirm { max-width: 420px; border-radius: 16px; padding: 24px; }
.lm-sheet-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.lm-sheet-title { font-size: 19px; font-weight: 800; display: flex; align-items: center; gap: 6px; margin: 0; }
.lm-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--card-border); background: var(--bg-primary); color: var(--text-secondary); font-size: 15px; cursor: pointer; }
.lm-field { margin-bottom: 18px; }
.lm-label { display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--text-secondary); margin-bottom: 8px; }
.lm-types { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
.lm-type-btn { padding: 10px 6px; min-height: 64px; border-radius: 10px; font-size: 12px; font-weight: 700; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer; }
.lm-dates { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin-bottom: 18px; }
.lm-date-wrap { position: relative; width: 100%; }
.lm-input {
  width: 100%; padding: 11px 40px 11px 12px; min-height: 44px; border: 1px solid var(--card-border);
  background: var(--bg-primary); color: var(--text-primary); border-radius: 10px; font-size: 13px; outline: none; font-family: inherit;
}
html.dark .lm-input { color-scheme: dark; }
.lm-input::-webkit-calendar-picker-indicator { opacity: 0; cursor: pointer; position: absolute; right: 8px; width: 25px; height: 25px; z-index: 3; }
.lm-cal-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none; z-index: 2; }
.lm-textarea { width: 100%; padding: 11px 12px; border: 1px solid var(--card-border); border-radius: 10px; font-size: 13px; outline: none; resize: vertical; font-family: inherit; background: var(--bg-primary); color: var(--text-primary); }
.lm-textarea::placeholder { color: var(--text-secondary); }
.lm-note { background: rgba(99,102,241,.1); color: var(--primary); border-radius: 10px; padding: 10px 14px; margin-bottom: 18px; font-size: 12px; display: flex; gap: 8px; align-items: center; }
.lm-btn-row { display: flex; gap: 10px; }
.lm-btn-row button { flex: 1; padding: 12px; min-height: 46px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
.lm-btn-ghost { background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--card-border); }
.lm-btn-solid { background: var(--primary); color: #fff; border: none; }
.lm-btn-danger { background: #ef4444; color: #fff; border: none; }
.lm-btn-row button:disabled { opacity: .7; cursor: not-allowed; }
.lm-warn-icon { width: 46px; height: 46px; border-radius: 12px; background: rgba(239,68,68,.12); color: #ef4444; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
.lm-confirm h3 { font-size: 18px; font-weight: 800; margin: 0 0 8px; }
.lm-confirm p { font-size: 13px; line-height: 1.6; color: var(--text-secondary); margin: 0 0 22px; }

/* =========================================================
   TABLET (<= 1024px)
   ========================================================= */
@media (max-width: 1024px) {
  .lm-stats { grid-template-columns: repeat(2, minmax(0,1fr)); }
}

/* =========================================================
   TABLE -> CARDS  (<= 900px)
   ========================================================= */
@media (max-width: 900px) {
  .lm-thead { display: none; }

  .lm-row.lm-cols {
    grid-template-columns: repeat(2, minmax(0,1fr));
    grid-template-areas:
      "type   status"
      "from   to"
      "days   rev"
      "act    act";
    gap: 12px 10px; padding: 16px;
  }
  .lm-c-type   { grid-area: type; }
  .lm-c-status { grid-area: status; justify-self: end; }
  .lm-c-from   { grid-area: from; }
  .lm-c-to     { grid-area: to; }
  .lm-c-days   { grid-area: days; }
  .lm-c-rev    { grid-area: rev; }
  .lm-c-act    { grid-area: act; }

  .lm-cell[data-label]::before {
    display: block; content: attr(data-label); font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .5px; color: var(--text-muted, var(--text-secondary)); margin-bottom: 3px;
  }
  .lm-c-act { padding-top: 12px; border-top: 1px dashed var(--card-border); }
  .lm-actions .lm-act-cancel { flex: 1; min-height: 40px; font-size: 12px; }
  .lm-act-delete { width: 44px; height: 40px; }
}

/* =========================================================
   PHONE (<= 600px)
   ========================================================= */
@media (max-width: 600px) {
  .lm-head { align-items: stretch; margin-bottom: 16px; }
  .lm-head > div { width: 100%; }
  .lm-title { font-size: 20px; }
  .lm-btn-primary { width: 100%; }

  .lm-stats { gap: 10px; margin-bottom: 14px; }
  .lm-stat { padding: 14px; }
  .lm-stat-top { margin-bottom: 10px; }
  .lm-stat-label { font-size: 12px; }
  .lm-stat-icon { width: 32px; height: 32px; }
  .lm-stat-value { font-size: 24px; }
  .lm-spark { display: none; }

  .lm-bal-grid { grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; margin-bottom: 16px; }
  .lm-bal { padding: 12px; gap: 8px; flex-direction: column; align-items: flex-start; }
  .lm-bal-text { text-align: left; width: 100%; }
  .lm-bal-type { justify-content: flex-start; }

  .lm-panel-head { padding: 14px 16px; }

  .lm-overlay { align-items: flex-end; padding: 0; }
  .lm-sheet { max-width: 100%; max-height: 92dvh; border-radius: 20px 20px 0 0; padding: 20px 16px calc(20px + env(safe-area-inset-bottom, 0px)); }
  .lm-overlay.confirm { align-items: center; padding: 16px; }
  .lm-overlay.confirm .lm-sheet { border-radius: 16px; padding: 20px; }

  .lm-dates { grid-template-columns: minmax(0,1fr); gap: 14px; margin-bottom: 14px; }
  .lm-input, .lm-textarea { font-size: 16px; } /* stops iOS auto-zoom on focus */
}
`;

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({ label, value, sub, color, icon, sparklineId, sparklinePath }) {
  return (
    <div
      className="lm-stat"
      style={{
        background: `linear-gradient(145deg, ${color}10, var(--card-bg))`,
        border: `1px solid ${color}25`,
        boxShadow: `0 4px 20px -2px ${color}15`,
      }}
    >
      <div className="lm-stat-top">
        <span className="lm-stat-label">{label}</span>
        <div
          className="lm-stat-icon"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}40`,
            color,
            boxShadow: `inset 0 0 10px ${color}10`,
          }}
        >
          {icon}
        </div>
      </div>

      <div className="lm-stat-value">{value}</div>
      <div className="lm-stat-sub">{sub}</div>

      {sparklinePath && (
        <div className="lm-spark">
          <svg viewBox="0 0 200 45" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id={`grad-${sparklineId}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${sparklinePath} L 200 45 L 0 45 Z`} fill={`url(#grad-${sparklineId})`} />
            <path
              d={sparklinePath}
              stroke={color}
              strokeWidth="2"
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STATUS PILL
============================================================ */

function StatusPill({ status }) {
  const map = {
    APPROVED: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', icon: <Check size={12} strokeWidth={3} /> },
    PENDING: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', icon: <Clock size={12} strokeWidth={3} /> },
    REJECTED: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', icon: <X size={12} strokeWidth={3} /> },
    CANCELLATION_PENDING: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', icon: <Undo2 size={12} strokeWidth={3} /> },
    CANCELLED: { bg: 'rgba(148,163,184,0.12)', color: 'var(--text-secondary)', icon: <Circle size={8} fill="currentColor" /> },
  };

  const s = map[status] || map.PENDING;

  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        border: `1px solid ${s.color}`,
        whiteSpace: 'nowrap',
      }}
    >
      {s.icon}
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

/* ============================================================
   CONSTANTS
============================================================ */

const LEAVE_TYPES = [
  { value: 'SICK', label: 'Sick', icon: <Thermometer size={18} /> },
  { value: 'CASUAL', label: 'Casual', icon: <Sun size={18} /> },
  { value: 'PATERNITY', label: 'Paternity', icon: <Baby size={18} /> },
  { value: 'MATERNITY', label: 'Maternity', icon: <Baby size={18} /> },
  { value: 'UNPAID', label: 'Unpaid', icon: <ClipboardList size={18} /> },
];

const balanceStyle = {
  ANNUAL: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', icon: <Palmtree size={14} /> },
  SICK: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: <Thermometer size={14} /> },
  CASUAL: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: <Sun size={14} /> },
  PATERNITY: { color: '#c084fc', bg: 'rgba(192,132,252,0.15)', icon: <Baby size={14} /> },
  MATERNITY: { color: '#ec4899', bg: 'rgba(236,72,153,0.15)', icon: <Baby size={14} /> },
  UNPAID: { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', icon: <ClipboardList size={14} /> },
};

/* Local date (not UTC) so "today" is correct in every timezone */
function localToday() {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/* ============================================================
   MINI RING
============================================================ */

function MiniRing({ pct, color }) {
  const size = 42;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, Number(pct) || 0));
  const dashoffset = circumference - (safe / 100) * circumference;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--card-border)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ fontSize: 10, fontWeight: 800, zIndex: 2 }}>{Math.round(safe)}%</div>
    </div>
  );
}

/* ============================================================
   CONFIRM MODAL (used for Delete + Clear All)
============================================================ */

function ConfirmModal({ title, text, confirmLabel, cancelLabel, busy, onConfirm, onCancel }) {
  return (
    <div className="lm-overlay confirm">
      <div className="lm-sheet lm-confirm">
        <div className="lm-warn-icon">
          <Trash2 size={22} />
        </div>

        <h3>{title}</h3>
        <p>{text}</p>

        <div className="lm-btn-row">
          <button type="button" className="lm-btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>

          <button type="button" className="lm-btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <Trash2 size={15} />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function LeavePage() {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const today = localToday();

  const [form, setForm] = useState({
    leaveType: 'SICK',
    startDate: '',
    endDate: '',
    reason: '',
  });

  /* ---------- fetch ---------- */

  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      const [leaveRes, balRes] = await Promise.allSettled([
        api.get(`/api/leaves/my?page=${page}&size=8`),
        api.get('/api/leaves/balance'),
      ]);

      if (leaveRes.status === 'fulfilled') {
        const data = leaveRes.value.data?.data;
        setLeaves(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      }

      if (balRes.status === 'fulfilled') {
        setBalance(balRes.value.data?.data || []);
      }
    } catch (err) {
      toast.error("Couldn't load your leave data — try refreshing");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchAll(), 0);
    return () => clearTimeout(timer);
  }, [fetchAll]);

  /* ---------- apply ---------- */

  const handleApply = async (e) => {
    e.preventDefault();

    if (!form.startDate || !form.endDate) {
      toast.error('Pick a start and end date');
      return;
    }

    if (form.startDate < today) {
      toast.error('Start date can’t be in the past');
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('End date needs to be after the start date');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/api/leaves/apply', {
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });

      toast.success('Leave request sent!');
      setShowForm(false);
      setForm({ leaveType: 'SICK', startDate: '', endDate: '', reason: '' });
      setPage(0);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit — try again');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- cancel ---------- */

  const handleCancel = async (id) => {
    setCancelling(id);

    try {
      await api.put(`/api/leaves/${id}/cancel`, { reason: 'Cancelled by employee' });
      toast.success('Cancellation processed');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel — try again');
    } finally {
      setCancelling(null);
    }
  };

  /* ---------- delete one ---------- */

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(deleteId);

    try {
      await api.delete(`/api/leaves/my/${deleteId}`);
      toast.success('Leave deleted successfully');
      closeDeleteModal();

      // If this page becomes empty, go to the previous page
      if (leaves.length === 1 && page > 0) {
        setPage((p) => Math.max(0, p - 1));
      } else {
        fetchAll();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete leave — try again');
    } finally {
      setDeleting(null);
    }
  };

  /* ---------- clear all ---------- */

  const openClearAllModal = () => {
    if (leaves.length === 0) {
      toast.error('There are no leave requests to clear');
      return;
    }
    setShowClearModal(true);
  };

  const handleClearAll = async () => {
    setClearingAll(true);

    try {
      await api.delete('/api/leaves/my');
      toast.success('All leave requests cleared');
      setShowClearModal(false);
      setPage(0);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not clear leaves — try again');
    } finally {
      setClearingAll(false);
    }
  };

  /* ---------- counts ---------- */

  const pendingLeavesCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedLeavesCount = leaves.filter((l) => l.status === 'APPROVED').length;
  const annualBalance = balance.find((b) => b.leaveType === 'ANNUAL')?.remaining || 0;

  /* ---------- render ---------- */

  return (
    <div className="lm-root">
      <style dangerouslySetInnerHTML={{ __html: leaveCSS }} />

      {/* HEADER */}
      <div className="lm-head">
        <div>
          <h1 className="lm-title">Leave Management</h1>
          <p className="lm-subtitle">
            Apply for leave, track your requests, and monitor your balance
          </p>
        </div>

        <button type="button" className="lm-btn-primary" onClick={() => setShowForm(true)}>
          <Sparkles size={16} />
          Apply for Leave
        </button>
      </div>

      {loading && page === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
          Loading...
        </div>
      ) : (
        <>
          {/* STATS */}
          <div className="lm-stats">
            <StatCard
              label="Annual Balance"
              value={`${annualBalance} days`}
              sub="Remaining"
              color="#8b5cf6"
              icon={<Palmtree size={18} />}
              sparklineId="annual"
              sparklinePath="M 0 40 Q 30 30, 70 35 T 130 25 T 200 20"
            />
            <StatCard
              label="Pending Approvals"
              value={pendingLeavesCount}
              sub="Awaiting action"
              color="#f59e0b"
              icon={<Clock size={18} />}
              sparklineId="pending"
              sparklinePath="M 0 30 Q 25 15, 60 25 T 120 15 T 180 20 T 200 10"
            />
            <StatCard
              label="Approved Requests"
              value={approvedLeavesCount}
              sub="This period"
              color="#10b981"
              icon={<Check size={18} />}
              sparklineId="approved"
              sparklinePath="M 0 35 Q 20 20, 50 30 T 100 25 T 150 20 T 200 15"
            />
            <StatCard
              label="Total Requests"
              value={leaves.length}
              sub="Fetched"
              color="#3b82f6"
              icon={<FileText size={18} />}
              sparklineId="requests"
              sparklinePath="M 0 25 Q 40 10, 80 20 T 150 15 T 200 5"
            />
          </div>

          {/* BALANCE CARDS */}
          <div className="lm-bal-grid">
            {balance.length === 0 ? (
              <div className="lm-empty-wide">No balance data available</div>
            ) : (
              balance.map((b, i) => {
                const c = balanceStyle[b.leaveType] || balanceStyle.UNPAID;
                const isUnpaid = b.leaveType === 'UNPAID';
                const displayValue = isUnpaid ? b.used : b.remaining;
                const pct = isUnpaid
                  ? 0
                  : b.totalAllotted > 0
                    ? (b.remaining / b.totalAllotted) * 100
                    : 0;

                return (
                  <div key={i} className="lm-bal">
                    <MiniRing pct={pct} color={c.color} />

                    <div className="lm-bal-text">
                      <div className="lm-bal-type" style={{ color: c.color }}>
                        {c.icon}
                        {b.leaveType}
                      </div>

                      <div className="lm-bal-value">
                        {displayValue}{' '}
                        <small>{isUnpaid ? '/∞' : `/${b.totalAllotted}d`}</small>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* APPLY MODAL */}
          {showForm && (
            <div className="lm-overlay">
              <div className="lm-sheet">
                <div className="lm-sheet-head">
                  <h2 className="lm-sheet-title">
                    <Sparkles size={19} color="#6366f1" />
                    Apply for Leave
                  </h2>

                  <button type="button" className="lm-close" onClick={() => setShowForm(false)} aria-label="Close">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleApply}>
                  {/* Leave type */}
                  <div className="lm-field">
                    <label className="lm-label">Leave Type</label>

                    <div className="lm-types">
                      {LEAVE_TYPES.map((t) => {
                        const active = form.leaveType === t.value;

                        return (
                          <button
                            type="button"
                            key={t.value}
                            className="lm-type-btn"
                            onClick={() => setForm({ ...form, leaveType: t.value })}
                            style={{
                              border: active ? '1.5px solid var(--primary)' : '1px solid var(--card-border)',
                              background: active ? 'rgba(99,102,241,0.1)' : 'var(--bg-primary)',
                              color: active ? 'var(--primary)' : 'var(--text-secondary)',
                            }}
                          >
                            {t.icon}
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="lm-dates">
                    <div>
                      <label className="lm-label">From</label>
                      <div className="lm-date-wrap">
                        <input
                          type="date"
                          className="lm-input"
                          value={form.startDate}
                          min={today}
                          required
                          onChange={(e) => {
                            const newStart = e.target.value;
                            setForm((prev) => ({
                              ...prev,
                              startDate: newStart,
                              endDate: prev.endDate && prev.endDate < newStart ? '' : prev.endDate,
                            }));
                          }}
                        />
                        <Calendar size={17} className="lm-cal-icon" />
                      </div>
                    </div>

                    <div>
                      <label className="lm-label">To</label>
                      <div className="lm-date-wrap">
                        <input
                          type="date"
                          className="lm-input"
                          value={form.endDate}
                          min={form.startDate || today}
                          required
                          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        />
                        <Calendar size={17} className="lm-cal-icon" />
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="lm-field" style={{ marginBottom: 22 }}>
                    <label className="lm-label">Reason*</label>
                    <textarea
                      className="lm-textarea"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      placeholder="e.g. Family function out of town"
                      required
                      rows={3}
                    />
                  </div>

                  <div className="lm-note">
                    <Lightbulb size={16} style={{ flexShrink: 0 }} />
                    Your request will be reviewed by Admin or HR.
                  </div>

                  <div className="lm-btn-row">
                    <button type="button" className="lm-btn-ghost" onClick={() => setShowForm(false)}>
                      Cancel
                    </button>

                    <button type="submit" className="lm-btn-solid" disabled={submitting}>
                      {submitting ? 'Sending...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* LEAVE HISTORY */}
          <div className="lm-panel">
            <div className="lm-panel-head">
              <div>
                <h3 className="lm-panel-title">Leave Requests</h3>
                <span className="lm-panel-count">{leaves.length} records</span>
              </div>

              <button
                type="button"
                className="lm-clear"
                onClick={openClearAllModal}
                disabled={clearingAll || leaves.length === 0}
              >
                <Trash2 size={15} />
                Clear All
              </button>
            </div>

            {/* table header (desktop only) */}
            <div className="lm-cols lm-thead">
              {['Type', 'From', 'To', 'Days', 'Status', 'Reviewed by', 'Action'].map((h) => (
                <div key={h} className="lm-th">
                  {h}
                </div>
              ))}
            </div>

            {leaves.length === 0 ? (
              <div className="lm-empty">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, color: '#10b981' }}>
                  <Palmtree size={42} strokeWidth={1.5} />
                </div>

                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No requests yet</div>

                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Apply for your first leave whenever you need a break
                </div>

                <button type="button" className="lm-btn-primary" onClick={() => setShowForm(true)}>
                  <Sparkles size={16} />
                  Apply for Leave
                </button>
              </div>
            ) : (
              <>
                {leaves.map((l, i) => {
                  const typeMeta = balanceStyle[l.leaveType] || balanceStyle.UNPAID;
                  const canCancel = ['PENDING', 'APPROVED'].includes(l.status);
                  const isApproved = l.status === 'APPROVED';

                  return (
                    <div key={l.id || i} className="lm-row lm-cols">
                      <div className="lm-cell lm-c-type lm-type">
                        <div className="lm-type-icon" style={{ background: typeMeta.bg, color: typeMeta.color }}>
                          {typeMeta.icon}
                        </div>
                        {l.leaveType}
                      </div>

                      <div className="lm-cell lm-c-from" data-label="From">
                        {l.startDate}
                      </div>

                      <div className="lm-cell lm-c-to" data-label="To">
                        {l.endDate}
                      </div>

                      <div className="lm-cell lm-c-days lm-days" data-label="Days">
                        {l.totalDays}
                      </div>

                      <div className="lm-cell lm-c-status">
                        <StatusPill status={l.status} />
                      </div>

                      <div className="lm-cell lm-c-rev" data-label="Reviewed by" style={{ fontSize: 12 }}>
                        {l.reviewedByName || '—'}
                      </div>

                      <div className="lm-cell lm-c-act lm-actions">
                        {canCancel && (
                          <button
                            type="button"
                            className="lm-act-cancel"
                            onClick={() => handleCancel(l.id)}
                            disabled={cancelling === l.id}
                            style={{
                              color: isApproved ? '#8b5cf6' : '#ef4444',
                              border: `1px solid ${isApproved ? '#8b5cf6' : '#ef4444'}`,
                            }}
                          >
                            {cancelling === l.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : isApproved ? (
                              'Request Cancel'
                            ) : (
                              'Cancel'
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          className="lm-act-delete"
                          onClick={() => openDeleteModal(l.id)}
                          disabled={deleting === l.id}
                          title="Delete leave"
                          aria-label="Delete leave"
                        >
                          {deleting === l.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {totalPages > 1 && (
                  <div className="lm-pager">
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

          {/* DELETE ONE */}
          {showDeleteModal && (
            <ConfirmModal
              title="Delete Leave?"
              text="Are you sure you want to delete this leave request? This action cannot be undone."
              confirmLabel="Delete"
              cancelLabel="Keep"
              busy={deleting !== null}
              onConfirm={handleDelete}
              onCancel={closeDeleteModal}
            />
          )}

          {/* CLEAR ALL */}
          {showClearModal && (
            <ConfirmModal
              title="Clear All Leaves?"
              text="This will permanently delete all of your leave requests. This action cannot be undone."
              confirmLabel="Clear All"
              cancelLabel="Cancel"
              busy={clearingAll}
              onConfirm={handleClearAll}
              onCancel={() => setShowClearModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
}