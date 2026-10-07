'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAllEmployees } from '@/lib/adminApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

/* ---------- responsive hook ---------- */
function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, [breakpoint]);
    return isMobile;
}

function Badge({ status }) {
    const map = {
        PENDING: { bg: '#fef9c3', color: '#ca8a04' },
        IN_PROGRESS: { bg: '#eff6ff', color: '#3b82f6' },
        COMPLETED: { bg: '#dcfce7', color: '#16a34a' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: 'var(--text-secondary)' };
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {status?.replace('_', ' ')}
        </span>
    );
}

export default function AdminChecklistPage() {
    const router = useRouter();
    const isMobile = useIsMobile();
    const [onboardings, setOnboardings] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initEmpId, setInitEmpId] = useState('');
    const [initializing, setInitializing] = useState(false);
    const [tab, setTab] = useState('ALL');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [onbRes, empRes] = await Promise.allSettled([
                api.get('/api/onboarding'),
                getAllEmployees(0, 100),
            ]);
            if (onbRes.status === 'fulfilled') {
                setOnboardings(onbRes.value.data?.data?.content || []);
            }
            if (empRes.status === 'fulfilled') {
                setEmployees(empRes.value.data?.data?.content || []);
            }
        } catch { toast.error('Failed to load data'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { fetchAll(); }, 0);
        return () => clearTimeout(timer);
    }, [fetchAll]);

    const handleInit = async () => {
        if (!initEmpId) { toast.error('Select an employee'); return; }
        setInitializing(true);
        try {
            await api.post(`/api/onboarding/init/${initEmpId}`);
            toast.success('Onboarding initialized!');
            setInitEmpId('');
            fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to initialize');
        } finally { setInitializing(false); }
    };

    const filtered = tab === 'ALL' ? onboardings : onboardings.filter(o => o.status === tab);

    const completedCount = onboardings.filter(o => o.status === 'COMPLETED').length;
    const inProgressCount = onboardings.filter(o => o.status === 'IN_PROGRESS').length;
    const pendingCount = onboardings.filter(o => o.status === 'PENDING').length;

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                <h1 style={{ fontSize: isMobile ? '19px' : '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Onboarding Checklists
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Initialize and track employee onboarding checklists
                </p>
            </div>

            {/* Stat cards: 4 across on desktop, 2x2 on mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: isMobile ? '10px' : '14px', marginBottom: '20px' }}>
                {[
                    { label: 'Total', value: onboardings.length, color: '#1e3a5f', bg: '#eff6ff', icon: '📋' },
                    { label: 'Pending', value: pendingCount, color: '#ca8a04', bg: '#fef9c3', icon: '⏳' },
                    { label: 'In Progress', value: inProgressCount, color: '#3b82f6', bg: '#eff6ff', icon: '🔄' },
                    { label: 'Completed', value: completedCount, color: '#16a34a', bg: '#dcfce7', icon: '✅' },
                ].map((s, i) => (
                    <div key={i} style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: isMobile ? '12px' : '16px', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>{s.label}</span>
                            <div style={{ width: '28px', height: '28px', background: s.bg, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{s.icon}</div>
                        </div>
                        <div style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: '800', color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Initialize */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: isMobile ? '16px' : '20px', border: '1px solid var(--card-border)', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
                    🚀 Initialize New Onboarding
                </div>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', alignItems: isMobile ? 'stretch' : 'center' }}>
                    <select value={initEmpId} onChange={e => setInitEmpId(e.target.value)}
                        // 16px font stops iOS Safari zooming on focus
                        style={{ flex: 1, minWidth: 0, padding: '11px 14px', border: '1.5px solid var(--card-border)', borderRadius: '10px', fontSize: '16px', outline: 'none', background: 'var(--card-bg)', boxSizing: 'border-box' }}>
                        <option value="">Select employee to onboard...</option>
                        {employees
                            .filter(e => !onboardings.find(o => o.employeeId === e.id))
                            .map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.firstName} {e.lastName} — {e.employeeCode}
                                </option>
                            ))
                        }
                    </select>
                    <button onClick={handleInit} disabled={initializing || !initEmpId}
                        style={{
                            padding: '11px 24px',
                            background: initEmpId ? '#1e3a5f' : 'var(--bg-secondary)',
                            color: initEmpId ? 'white' : 'var(--text-muted)',
                            border: initEmpId ? '1px solid transparent' : '1px solid var(--card-border)',
                            borderRadius: '10px',
                            fontSize: '13px', fontWeight: '700',
                            cursor: initEmpId ? 'pointer' : 'not-allowed',
                            whiteSpace: 'nowrap',
                        }}>
                        {initializing ? '⏳ Initializing...' : '+ Initialize'}
                    </button>
                </div>
            </div>

            {/* List */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                {/* Tabs scroll sideways instead of overflowing the screen */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '4px', background: 'var(--bg-primary)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    {[
                        { key: 'ALL', label: 'All' },
                        { key: 'PENDING', label: 'Pending' },
                        { key: 'IN_PROGRESS', label: 'In Progress' },
                        { key: 'COMPLETED', label: 'Done' },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            style={{
                                padding: isMobile ? '7px 14px' : '5px 12px', borderRadius: '6px', fontSize: '12px',
                                fontWeight: tab === t.key ? '700' : '400',
                                background: tab === t.key ? 'var(--text-primary)' : 'transparent',
                                color: tab === t.key ? 'var(--bg-primary)' : 'var(--text-muted)',
                                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>No onboarding records</div>
                    </div>
                ) : (
                    filtered.map((onb) => (
                        <div key={onb.id} onClick={() => router.push(`/admin/onboarding/checklist/view?id=${onb.id}`)}
                            style={{
                                padding: isMobile ? '14px 16px' : '14px 20px', borderBottom: '1px solid var(--card-border)', cursor: 'pointer',
                                transition: 'all 0.15s', backgroundColor: 'transparent'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(128,128,128,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                                        {onb.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{onb.employeeName}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{onb.employeeCode} · {onb.department}</div>
                                    </div>
                                </div>
                                <Badge status={onb.status} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completion</span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: onb.completionPercent === 100 ? '#16a34a' : '#3b82f6' }}>
                                        {onb.completionPercent}%
                                    </span>
                                </div>
                                <div style={{ height: '6px', background: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: '3px',
                                        background: onb.completionPercent === 100 ? '#16a34a' : '#3b82f6',
                                        width: `${onb.completionPercent || 0}%`, transition: 'width 0.5s',
                                    }} />
                                </div>
                            </div>

                            {/* Stacks on mobile so long names don't run off-screen */}
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '2px' : '0' }}>
                                <span>Joining: {onb.joiningDate}</span>
                                {!isMobile && <span>&nbsp;·&nbsp;</span>}
                                <span>HR: {onb.assignedHrName}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}