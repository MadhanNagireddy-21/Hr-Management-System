'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMyOnboarding, getMyDocuments } from '@/lib/employeeApi';
import toast from 'react-hot-toast';
import { ClipboardList, Clock, FileText, CheckCircle, Hand, ChevronRight } from 'lucide-react';

const CHECKLIST_ITEMS = [
    { key: 'offerLetterSigned', label: 'Offer Letter Signed' },
    { key: 'idProofSubmitted', label: 'ID Proof Submitted' },
    { key: 'educationDocsSubmitted', label: 'Education Docs Submitted' },
    { key: 'bankDetailsSubmitted', label: 'Bank Details Submitted' },
    { key: 'emailCreated', label: 'Email Created' },
    { key: 'systemAccessGiven', label: 'System Access Given' },
];

const DOC_KEY_LABELS = {
    OFFER_LETTER: 'Offer Letter',
    AADHAR_CARD: 'Aadhar Card',
    PAN_CARD: 'PAN Card',
    SSC_CERTIFICATE: 'SSC Certificate',
    INTER_DIPLOMA_CERTIFICATE: 'Inter / Diploma Certificate',
    DEGREE_CERTIFICATE: 'Degree Certificate',
    BANK_PASSBOOK: 'Bank Passbook',
};

/* ============================================================
   CSS
============================================================ */

const onboardingCSS = `
.ob-root { width: 100%; max-width: 100%; min-width: 0; color: var(--text-primary); }
.ob-root *, .ob-root *::before, .ob-root *::after { box-sizing: border-box; }

/* ---------- banner ---------- */
.ob-banner {
  position: relative; overflow: hidden; margin-bottom: 20px; padding: 24px 28px; border-radius: 18px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff;
  box-shadow: 0 10px 30px rgba(79,70,229,.25);
}
.ob-banner::after {
  content: ''; position: absolute; width: 260px; height: 260px; border-radius: 50%;
  right: -90px; top: -130px; background: radial-gradient(circle, rgba(255,255,255,.18), transparent 70%); pointer-events: none;
}
.ob-banner-row { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
.ob-welcome { font-size: 22px; font-weight: 800; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ob-role { font-size: 13px; color: rgba(255,255,255,.8); }
.ob-nums { display: flex; gap: 28px; flex-shrink: 0; }
.ob-num { text-align: right; }
.ob-num + .ob-num { border-left: 1px solid rgba(255,255,255,.3); padding-left: 28px; }
.ob-num-value { font-size: 26px; font-weight: 900; line-height: 1.1; }
.ob-num-label { font-size: 11px; color: rgba(255,255,255,.75); margin-top: 2px; }
.ob-progress { position: relative; z-index: 1; margin-top: 18px; height: 8px; background: rgba(255,255,255,.25); border-radius: 999px; overflow: hidden; }
.ob-progress > span { display: block; height: 100%; background: #fff; border-radius: 999px; transition: width .5s; }

/* ---------- stats ---------- */
.ob-stats { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; margin-bottom: 20px; }
.ob-stat { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 18px; box-shadow: var(--card-shadow); min-width: 0; }
.ob-stat-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px; }
.ob-stat-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
.ob-stat-icon { width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.ob-stat-value { font-size: 28px; font-weight: 800; line-height: 1.1; margin-bottom: 4px; }
.ob-stat-sub { font-size: 12px; color: var(--text-muted, var(--text-secondary)); }

/* ---------- two columns ---------- */
.ob-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 20px; }
.ob-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; padding: 20px; box-shadow: var(--card-shadow); min-width: 0; }
.ob-card-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
.ob-card-title { font-size: 15px; font-weight: 700; margin: 0; }
.ob-link { display: inline-flex; align-items: center; gap: 2px; background: none; border: none; color: #6366f1; font-size: 13px; font-weight: 600; cursor: pointer; padding: 6px 0 6px 8px; white-space: nowrap; }
html.dark .ob-link { color: #818cf8; }

.ob-row {
  display: flex; align-items: center; gap: 12px; padding: 13px 14px; margin-bottom: 8px;
  border-radius: 12px; background: var(--bg-primary); border: 1px solid var(--card-border); min-width: 0;
}
.ob-row:last-child { margin-bottom: 0; }
.ob-row-icon { width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(99,102,241,.12); color: #6366f1; }
.ob-row-label { flex: 1; min-width: 0; font-size: 13px; font-weight: 600; }
.ob-row-label.clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ob-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 999px; font-size: 12px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
.ob-pill i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: block; }
.ob-pill.pending  { background: rgba(100,116,139,.15); color: var(--text-secondary); }
.ob-pill.approved { background: rgba(22,163,74,.15);  color: #16a34a; }
.ob-pill.rejected { background: rgba(220,38,38,.14);  color: #dc2626; }
html.dark .ob-pill.approved { color: #4ade80; }
html.dark .ob-pill.rejected { color: #f87171; }

.ob-empty { padding: 60px 20px; text-align: center; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; box-shadow: var(--card-shadow); }
.ob-empty-small { padding: 30px 10px; text-align: center; color: var(--text-muted, var(--text-secondary)); font-size: 13px; }
.ob-loading { padding: 60px 20px; text-align: center; color: var(--text-muted, var(--text-secondary)); }

/* =========================================================
   TABLET (<= 900px)
   ========================================================= */
@media (max-width: 900px) {
  .ob-grid { grid-template-columns: minmax(0,1fr); gap: 16px; }
}

/* =========================================================
   PHONE (<= 600px)
   ========================================================= */
@media (max-width: 600px) {
  .ob-banner { padding: 18px 16px; border-radius: 16px; margin-bottom: 14px; }
  .ob-banner-row { flex-direction: column; gap: 16px; }
  .ob-welcome { font-size: 19px; }

  /* two key numbers become a tidy split strip */
  .ob-nums { width: 100%; gap: 0; background: rgba(255,255,255,.14); border-radius: 12px; padding: 12px 0; }
  .ob-num { flex: 1; text-align: center; }
  .ob-num + .ob-num { padding-left: 0; }
  .ob-num-value { font-size: 24px; }

  .ob-progress { margin-top: 14px; }

  /* 3 compact stat cards in one row */
  .ob-stats { gap: 8px; margin-bottom: 14px; }
  .ob-stat { padding: 12px 10px; }
  .ob-stat-top { flex-direction: column-reverse; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
  .ob-stat-label { font-size: 11px; line-height: 1.25; font-weight: 600; }
  .ob-stat-icon { width: 30px; height: 30px; border-radius: 8px; }
  .ob-stat-value { font-size: 22px; }
  .ob-stat-sub { font-size: 10.5px; line-height: 1.25; }

  .ob-card { padding: 16px; }
  .ob-row { padding: 12px; gap: 10px; }
  .ob-row-label { font-size: 12.5px; }
  .ob-pill { padding: 4px 9px; font-size: 11px; }
}
`;

/* ============================================================
   STATUS PILL
============================================================ */

function StatusPill({ status }) {
    const map = {
        UNDER_REVIEW: { cls: 'pending', label: 'Pending' },
        APPROVED: { cls: 'approved', label: 'Approved' },
        REJECTED: { cls: 'rejected', label: 'Rejected' },
    };
    const s = map[status] || map.UNDER_REVIEW;

    return (
        <span className={'ob-pill ' + s.cls}>
            <i />
            {s.label}
        </span>
    );
}

/* ============================================================
   PAGE
============================================================ */

export default function EmployeeOnboardingDashboardPage() {
    const router = useRouter();
    const [onboarding, setOnboarding] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);

        try {
            const res = await getMyOnboarding();
            const onb = res.data?.data;
            setOnboarding(onb);

            if (onb?.id) {
                const docRes = await getMyDocuments(onb.id);
                setDocuments(docRes.data?.data || []);
            }
        } catch (err) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="ob-loading">Loading...</div>;
    }

    if (!onboarding) {
        return (
            <div className="ob-root">
                <style dangerouslySetInnerHTML={{ __html: onboardingCSS }} />
                <div className="ob-empty">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#94a3b8' }}>
                        <ClipboardList size={40} strokeWidth={1.5} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                        No onboarding checklist yet
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted, var(--text-secondary))' }}>
                        Your HR team hasn't set this up for you yet.
                    </div>
                </div>
            </div>
        );
    }

    const pendingTasksCount = CHECKLIST_ITEMS.filter((item) => !onboarding[item.key]).length;
    const approvedDocsCount = documents.filter((d) => d.status === 'APPROVED').length;
    const firstName = onboarding.employeeName?.split(' ')[0] || 'there';
    const completion = Math.max(0, Math.min(100, Number(onboarding.completionPercent) || 0));

    const STATS = [
        {
            label: 'Pending Tasks',
            value: pendingTasksCount,
            sub: 'To be completed',
            color: '#ca8a04',
            bg: 'rgba(234,179,8,.16)',
            icon: <Clock size={16} />,
        },
        {
            label: 'Documents Uploaded',
            value: documents.length,
            sub: 'Total uploaded',
            color: '#3b82f6',
            bg: 'rgba(59,130,246,.14)',
            icon: <FileText size={16} />,
        },
        {
            label: 'Approved Docs',
            value: approvedDocsCount,
            sub: 'Verified by HR',
            color: '#16a34a',
            bg: 'rgba(22,163,74,.15)',
            icon: <CheckCircle size={16} />,
        },
    ];

    return (
        <div className="ob-root">
            <style dangerouslySetInnerHTML={{ __html: onboardingCSS }} />

            {/* Welcome banner */}
            <div className="ob-banner">
                <div className="ob-banner-row">
                    <div style={{ minWidth: 0 }}>
                        <div className="ob-welcome">
                            Welcome, {firstName}! <Hand size={22} color="#fbbf24" />
                        </div>
                        <div className="ob-role">
                            {onboarding.employeeDesignation || '—'} · {onboarding.department || '—'}
                        </div>
                    </div>

                    <div className="ob-nums">
                        <div className="ob-num">
                            <div className="ob-num-value">{completion}%</div>
                            <div className="ob-num-label">Onboarding</div>
                        </div>

                        <div className="ob-num">
                            <div className="ob-num-value">{approvedDocsCount}</div>
                            <div className="ob-num-label">Docs Approved</div>
                        </div>
                    </div>
                </div>

                <div className="ob-progress">
                    <span style={{ width: `${completion}%` }} />
                </div>
            </div>

            {/* Stat cards */}
            <div className="ob-stats">
                {STATS.map((s) => (
                    <div key={s.label} className="ob-stat">
                        <div className="ob-stat-top">
                            <span className="ob-stat-label">{s.label}</span>
                            <div className="ob-stat-icon" style={{ background: s.bg, color: s.color }}>
                                {s.icon}
                            </div>
                        </div>

                        <div className="ob-stat-value">{s.value}</div>
                        <div className="ob-stat-sub">{s.sub}</div>
                    </div>
                ))}
            </div>

            <div className="ob-grid">
                {/* Onboarding Checklist preview */}
                <div className="ob-card">
                    <div className="ob-card-head">
                        <h3 className="ob-card-title">Onboarding Checklist</h3>
                        <button type="button" className="ob-link" onClick={() => router.push('/employee/onboarding/checklist')}>
                            View all <ChevronRight size={14} />
                        </button>
                    </div>

                    {CHECKLIST_ITEMS.map((item) => (
                        <div key={item.key} className="ob-row">
                            <span className="ob-row-label">{item.label}</span>
                            <StatusPill status={onboarding[item.key] ? 'APPROVED' : 'UNDER_REVIEW'} />
                        </div>
                    ))}
                </div>

                {/* Recent Documents preview */}
                <div className="ob-card">
                    <div className="ob-card-head">
                        <h3 className="ob-card-title">Recent Documents</h3>
                        <button type="button" className="ob-link" onClick={() => router.push('/employee/onboarding/documents')}>
                            View all <ChevronRight size={14} />
                        </button>
                    </div>

                    {documents.length === 0 ? (
                        <div className="ob-empty-small">No documents uploaded yet.</div>
                    ) : (
                        documents.slice(0, 5).map((doc) => (
                            <div key={doc.id} className="ob-row">
                                <div className="ob-row-icon">
                                    <FileText size={16} />
                                </div>
                                <span className="ob-row-label clip">
                                    {DOC_KEY_LABELS[doc.documentKey] || doc.documentKey}
                                </span>
                                <StatusPill status={doc.status} />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}