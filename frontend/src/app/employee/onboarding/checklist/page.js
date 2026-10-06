'use client';
import { useState, useEffect, useCallback } from 'react';
import { getMyOnboarding } from '@/lib/employeeApi';
import toast from 'react-hot-toast';
import {
    FileText,
    IdCard,
    GraduationCap,
    Landmark,
    Mail,
    Lock,
    Clock,
    CheckCircle,
    PartyPopper,
    ClipboardList,
} from 'lucide-react';

const CHECKLIST_ITEMS = [
    { key: 'offerLetterSigned', label: 'Offer Letter Signed', icon: FileText },
    { key: 'idProofSubmitted', label: 'ID Proof Submitted', icon: IdCard },
    { key: 'educationDocsSubmitted', label: 'Education Docs Submitted', icon: GraduationCap },
    { key: 'bankDetailsSubmitted', label: 'Bank Details Submitted', icon: Landmark },
    { key: 'emailCreated', label: 'Email Created', icon: Mail },
    { key: 'systemAccessGiven', label: 'System Access Given', icon: Lock },
];

/* ============================================================
   CSS
============================================================ */

const checklistCSS = `
.cl-root { width: 100%; max-width: 100%; min-width: 0; color: var(--text-primary); }
.cl-root *, .cl-root *::before, .cl-root *::after { box-sizing: border-box; }

.cl-head { margin-bottom: 20px; }
.cl-title { font-size: 24px; font-weight: 800; margin: 0 0 4px; }
.cl-subtitle { font-size: 14px; color: var(--text-muted, var(--text-secondary)); margin: 0; }

/* ---------- progress ---------- */
.cl-progress-card {
  display: flex; align-items: center; gap: 20px; margin-bottom: 20px; padding: 20px 22px;
  background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; box-shadow: var(--card-shadow);
}
.cl-ring { position: relative; width: 76px; height: 76px; flex-shrink: 0; }
.cl-ring svg { display: block; transform: rotate(-90deg); }
.cl-ring-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; }
.cl-progress-main { flex: 1; min-width: 0; }
.cl-progress-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.cl-progress-sub { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }
.cl-bar { height: 8px; border-radius: 999px; background: var(--card-border); overflow: hidden; }
.cl-bar > span { display: block; height: 100%; border-radius: 999px; transition: width .5s; }

/* ---------- columns ---------- */
.cl-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 20px; align-items: start; }
.cl-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; padding: 20px; box-shadow: var(--card-shadow); min-width: 0; }
.cl-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.cl-card-icon { width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.cl-card-title { font-size: 16px; font-weight: 700; margin: 0; }

.cl-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; margin-bottom: 10px; border-radius: 12px; border: 1px solid; min-width: 0; }
.cl-item:last-child { margin-bottom: 0; }
.cl-item-icon { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.cl-item-label { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; line-height: 1.3; }
.cl-tag { padding: 4px 11px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }

.cl-item.todo { background: rgba(245,158,11,.08); border-color: rgba(245,158,11,.30); }
.cl-item.todo .cl-item-icon { background: rgba(245,158,11,.16); color: #d97706; }
.cl-item.todo .cl-tag { background: rgba(245,158,11,.18); color: #b45309; }
.cl-item.done { background: rgba(22,163,74,.08); border-color: rgba(22,163,74,.28); }
.cl-item.done .cl-item-icon { background: rgba(22,163,74,.16); color: #16a34a; }
.cl-item.done .cl-tag { background: rgba(22,163,74,.18); color: #15803d; }
html.dark .cl-item.todo .cl-item-icon { color: #fbbf24; }
html.dark .cl-item.todo .cl-tag { color: #fbbf24; }
html.dark .cl-item.done .cl-item-icon { color: #4ade80; }
html.dark .cl-item.done .cl-tag { color: #4ade80; }

.cl-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px 10px; text-align: center; color: var(--text-muted, var(--text-secondary)); font-size: 13px; }
.cl-state { padding: 60px 20px; text-align: center; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 14px; }
.cl-loading { padding: 60px 20px; text-align: center; color: var(--text-muted, var(--text-secondary)); }

/* =========================================================
   TABLET (<= 900px)
   ========================================================= */
@media (max-width: 900px) {
  .cl-grid { grid-template-columns: minmax(0,1fr); gap: 16px; }
}

/* =========================================================
   PHONE (<= 600px)
   ========================================================= */
@media (max-width: 600px) {
  .cl-head { margin-bottom: 14px; }
  .cl-title { font-size: 21px; }
  .cl-subtitle { font-size: 13px; }

  .cl-progress-card { padding: 16px; gap: 14px; margin-bottom: 14px; border-radius: 14px; }
  .cl-ring { width: 64px; height: 64px; }
  .cl-ring-text { font-size: 15px; }

  .cl-card { padding: 16px; border-radius: 14px; }
  .cl-card-head { margin-bottom: 12px; }
  .cl-item { padding: 12px; gap: 10px; }
  .cl-item-icon { width: 34px; height: 34px; }
  .cl-item-label { font-size: 13px; }
  .cl-tag { padding: 4px 9px; font-size: 10.5px; }
}
`;

/* ============================================================
   PROGRESS RING
============================================================ */

function ProgressRing({ percent, color }) {
    const size = 76;
    const stroke = 7;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="cl-ring">
            <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--card-border)" strokeWidth={stroke} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset .5s' }}
                />
            </svg>
            <div className="cl-ring-text">{percent}%</div>
        </div>
    );
}

/* ============================================================
   ITEM ROW
============================================================ */

function ChecklistRow({ item, done }) {
    const Icon = item.icon;

    return (
        <div className={'cl-item ' + (done ? 'done' : 'todo')}>
            <div className="cl-item-icon">
                <Icon size={18} />
            </div>
            <span className="cl-item-label">{item.label}</span>
            <span className="cl-tag">{done ? 'Done' : 'Pending'}</span>
        </div>
    );
}

/* ============================================================
   PAGE
============================================================ */

export default function EmployeeOnboardingChecklistPage() {
    const [onboarding, setOnboarding] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);

        try {
            const res = await getMyOnboarding();
            setOnboarding(res.data?.data);
        } catch (err) {
            toast.error('Failed to load checklist');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="cl-loading">Loading...</div>;
    }

    if (!onboarding) {
        return (
            <div className="cl-root">
                <style dangerouslySetInnerHTML={{ __html: checklistCSS }} />
                <div className="cl-state">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#94a3b8' }}>
                        <ClipboardList size={40} strokeWidth={1.5} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>No onboarding checklist yet</div>
                </div>
            </div>
        );
    }

    const pendingItems = CHECKLIST_ITEMS.filter((item) => !onboarding[item.key]);
    const completedItems = CHECKLIST_ITEMS.filter((item) => onboarding[item.key]);
    const percent = Math.max(0, Math.min(100, Number(onboarding.completionPercent) || 0));
    const barColor = percent === 100 ? '#16a34a' : '#4f46e5';

    return (
        <div className="cl-root">
            <style dangerouslySetInnerHTML={{ __html: checklistCSS }} />

            <div className="cl-head">
                <h1 className="cl-title">Onboarding Checklist</h1>
                <p className="cl-subtitle">Track your onboarding progress</p>
            </div>

            {/* Progress */}
            <div className="cl-progress-card">
                <ProgressRing percent={percent} color={barColor} />

                <div className="cl-progress-main">
                    <div className="cl-progress-title">
                        {percent === 100 ? 'All done — welcome aboard!' : `${percent}% complete`}
                    </div>
                    <div className="cl-progress-sub">
                        {completedItems.length} of {CHECKLIST_ITEMS.length} steps finished
                    </div>
                    <div className="cl-bar">
                        <span style={{ width: `${percent}%`, background: barColor }} />
                    </div>
                </div>
            </div>

            <div className="cl-grid">
                {/* To Do */}
                <div className="cl-card">
                    <div className="cl-card-head">
                        <div className="cl-card-icon" style={{ background: 'rgba(245,158,11,.16)', color: '#d97706' }}>
                            <Clock size={17} strokeWidth={2.5} />
                        </div>
                        <h3 className="cl-card-title">To Do ({pendingItems.length})</h3>
                    </div>

                    {pendingItems.length === 0 ? (
                        <div className="cl-empty">
                            <PartyPopper size={28} color="#16a34a" />
                            Nothing pending — great job!
                        </div>
                    ) : (
                        pendingItems.map((item) => <ChecklistRow key={item.key} item={item} done={false} />)
                    )}
                </div>

                {/* Completed */}
                <div className="cl-card">
                    <div className="cl-card-head">
                        <div className="cl-card-icon" style={{ background: 'rgba(22,163,74,.16)', color: '#16a34a' }}>
                            <CheckCircle size={17} strokeWidth={2.5} />
                        </div>
                        <h3 className="cl-card-title">Completed ({completedItems.length})</h3>
                    </div>

                    {completedItems.length === 0 ? (
                        <div className="cl-empty">Nothing completed yet.</div>
                    ) : (
                        completedItems.map((item) => <ChecklistRow key={item.key} item={item} done />)
                    )}
                </div>
            </div>
        </div>
    );
}