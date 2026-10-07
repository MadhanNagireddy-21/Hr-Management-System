'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Users, CheckCircle, FileText, AlertTriangle } from 'lucide-react';

const DEPT_COLORS = ['#4f46e5', '#3b82f6', '#eda100', '#1baf7a', '#e34948', '#e87ba4'];

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

export default function OnboardingReportsPage() {
    const isMobile = useIsMobile();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/onboarding/reports');
            setData(res.data?.data);
        } catch (err) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    if (loading || !data) {
        return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    const STATS = [
        { label: 'Total Employees', value: data.totalEmployees, bg: '#eef2ff', color: '#4f46e5', icon: <Users size={16} color="#4f46e5" /> },
        { label: 'Approved Docs', value: data.approvedDocs, bg: '#dcfce7', color: '#16a34a', icon: <CheckCircle size={16} color="#16a34a" /> },
        { label: 'Pending Docs', value: data.pendingDocs, bg: '#fef9c3', color: '#ca8a04', icon: <FileText size={16} color="#ca8a04" /> },
        { label: 'Rejected Docs', value: data.rejectedDocs, bg: '#fee2e2', color: '#dc2626', icon: <AlertTriangle size={16} color="#dc2626" /> },
    ];

    const deptEntries = Object.entries(data.employeesByDepartment || {});
    const maxDeptCount = Math.max(...deptEntries.map(([, v]) => v), 1);

    const statusTotal = data.notStarted + data.inProgress + data.completed || 1;
    const statusSegments = [
        { label: 'Not Started', value: data.notStarted, color: 'var(--text-muted)' },
        { label: 'In Progress', value: data.inProgress, color: '#4f46e5' },
        { label: 'Completed', value: data.completed, color: '#16a34a' },
    ];

    // Build conic-gradient stops for the donut
    let cumulative = 0;
    const gradientStops = statusSegments.map(seg => {
        const start = (cumulative / statusTotal) * 360;
        cumulative += seg.value;
        const end = (cumulative / statusTotal) * 360;
        return `${seg.color} ${start}deg ${end}deg`;
    }).join(', ');

    const cardStyle = {
        background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)',
        padding: isMobile ? '16px' : '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', minWidth: 0,
    };

    return (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                <h1 style={{ fontSize: isMobile ? '19px' : '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Reports & Analytics
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Insights into your onboarding pipeline.
                </p>
            </div>

            {/* Stat cards: 2x2 on mobile, 4 across on desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: isMobile ? '10px' : '14px', marginBottom: '20px' }}>
                {STATS.map((s, i) => (
                    <div key={i} style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: isMobile ? '12px' : '18px', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', marginBottom: '10px' }}>
                            <span style={{ fontSize: isMobile ? '12px' : '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{s.label}</span>
                            <div style={{ width: '30px', height: '30px', background: s.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
                        </div>
                        <div style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '800', color: 'var(--text-primary)' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Charts: stacked on mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))', gap: '20px' }}>
                {/* Employees by department */}
                <div style={cardStyle}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '18px' }}>
                        Employees by Department
                    </div>

                    {deptEntries.length === 0 ? (
                        <div style={{ padding: '30px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>No data yet</div>
                    ) : isMobile ? (
                        /* Mobile: horizontal bars, so many departments never get squashed */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {deptEntries.map(([dept, count], i) => (
                                <div key={dept}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{dept}</span>
                                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{count}</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--card-border)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: '4px',
                                            width: `${(count / maxDeptCount) * 100}%`,
                                            minWidth: '4px',
                                            background: DEPT_COLORS[i % DEPT_COLORS.length],
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Desktop: vertical bars */
                        <>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '160px', paddingBottom: '4px' }}>
                                {deptEntries.map(([dept, count], i) => (
                                    <div key={dept} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{count}</span>
                                        <div style={{
                                            width: '100%', maxWidth: '48px',
                                            height: `${(count / maxDeptCount) * 100}%`,
                                            minHeight: '6px',
                                            background: DEPT_COLORS[i % DEPT_COLORS.length],
                                            borderRadius: '6px 6px 0 0',
                                        }} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                {deptEntries.map(([dept]) => (
                                    <div key={dept} style={{ flex: 1, fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', wordBreak: 'break-word' }}>{dept}</div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Onboarding status donut */}
                <div style={cardStyle}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '18px' }}>
                        Onboarding Status
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
                        <div style={{
                            width: '160px', height: '160px', borderRadius: '50%',
                            background: `conic-gradient(${gradientStops})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--card-bg)' }} />
                        </div>
                    </div>
                    {/* Legend wraps on narrow screens and now shows counts */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 16px' }}>
                        {statusSegments.map(seg => (
                            <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: seg.color, flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{seg.label} ({seg.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}