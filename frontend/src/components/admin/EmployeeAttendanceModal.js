'use client';
import { useEffect, useState } from 'react';
import { getEmployeeDetailedReport } from '@/lib/adminApi';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    PRESENT: { bg: '#dcfce7', color: '#16a34a' },
    HALF_DAY: { bg: '#fff7ed', color: '#f59e0b' },
    ON_LEAVE: { bg: '#eff6ff', color: '#3b82f6' },
    ABSENT: { bg: '#fee2e2', color: '#dc2626' },
    WEEKEND: { bg: '#f1f5f9', color: '#94a3b8' },
    HOLIDAY: { bg: '#fdf4ff', color: '#9333ea' },
};

function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b' };
    return (
        <span style={{
            background: s.bg, color: s.color,
            padding: '3px 10px', borderRadius: '20px',
            fontSize: '11px', fontWeight: '700',
        }}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
}

function DayCell({ day }) {
    const s = STATUS_COLORS[day.status] || { bg: '#f1f5f9', color: '#64748b' };
    const shortLabel = day.status === 'PRESENT' ? 'P'
        : day.status === 'HALF_DAY' ? 'H'
            : day.status === 'ON_LEAVE' ? 'L'
                : day.status === 'WEEKEND' ? 'WK'
                    : day.status === 'HOLIDAY' ? 'HO'
                        : 'A';
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{day.dayName}</div>
            <div style={{
                width: '32px', height: '32px', borderRadius: '6px',
                background: s.bg, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '700', margin: '0 auto',
            }} title={`${day.date} · ${day.status}`}>
                {shortLabel}
            </div>
        </div>
    );
}

export default function EmployeeAttendanceModal({ employeeId, asOfDate, onClose }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        setLoading(true);
        getEmployeeDetailedReport(employeeId, asOfDate)
            .then((res) => {
                if (active) setReport(res.data?.data || null);
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || 'Failed to load employee report');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [employeeId, asOfDate]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '20px',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white', borderRadius: '14px', width: '460px',
                    maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto',
                    padding: '20px 24px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading...</div>
                ) : !report ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        No report available.
                        <div style={{ marginTop: '16px' }}>
                            <button onClick={onClose} style={closeBtnStyle}>Close</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
                                    {report.employeeName} <span style={{ color: '#94a3b8', fontWeight: '500' }}>({report.employeeCode})</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                    {report.departmentName}
                                </div>
                            </div>
                            <button onClick={onClose} aria-label="Close" style={{
                                border: 'none', background: 'none', cursor: 'pointer',
                                fontSize: '18px', color: '#94a3b8', lineHeight: 1,
                            }}>
                                ✕
                            </button>
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                                Yesterday ({report.yesterdayDate})
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                                <StatusBadge status={report.yesterdayStatus} />
                                <span>Hours: {report.yesterdayWorkHours ?? 0}</span>
                                {report.yesterdayCheckIn && (
                                    <span>In: {String(report.yesterdayCheckIn).slice(0, 5)} · Out: {report.yesterdayCheckOut ? String(report.yesterdayCheckOut).slice(0, 5) : '--'}</span>
                                )}
                            </div>
                            {report.yesterdayRemarks && (
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                                    &quot;{report.yesterdayRemarks}&quot;
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>
                                This week
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                                {report.weeklyRecords?.map((d) => <DayCell key={d.date} day={d} />)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
                                P: {report.weeklyStats?.presentCount ?? 0} &nbsp;
                                H: {report.weeklyStats?.halfDayCount ?? 0} &nbsp;
                                A: {report.weeklyStats?.absentCount ?? 0} &nbsp;
                                L: {report.weeklyStats?.leaveCount ?? 0} &nbsp;
                                Avg hrs: {report.weeklyStats?.avgWorkHours ?? 0}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>
                                This month
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px' }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Attendance</div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
                                        {report.monthlyStats?.attendancePercent ?? 0}%
                                    </div>
                                </div>
                                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px' }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total hours</div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
                                        {report.monthlyStats?.totalWorkHours ?? 0}
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                Present: {report.monthlyStats?.presentCount ?? 0} &nbsp;
                                Half: {report.monthlyStats?.halfDayCount ?? 0} &nbsp;
                                Absent: {report.monthlyStats?.absentCount ?? 0} &nbsp;
                                Leave: {report.monthlyStats?.leaveCount ?? 0} &nbsp;
                                Working days: {report.monthlyStats?.workingDays ?? 0}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const closeBtnStyle = {
    padding: '8px 20px', background: '#f1f5f9', border: 'none',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    color: '#334155', cursor: 'pointer',
};