'use client';
import { useState, useEffect, useCallback } from 'react';
import { getMyOnboarding } from '@/lib/employeeApi';
import toast from 'react-hot-toast';
import { Mail, Phone, Building2, Briefcase, Calendar, Cake } from 'lucide-react';

function StatusPill({ status }) {
    const map = {
        PENDING: { bg: '#f1f5f9', color: 'var(--text-secondary)', label: 'Pending' },
        IN_PROGRESS: { bg: '#eff6ff', color: '#3b82f6', label: 'In Progress' },
        COMPLETED: { bg: '#dcfce7', color: '#16a34a', label: 'Completed' },
    };
    const s = map[status] || map.PENDING;
    return (
        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
            {s.label}
        </span>
    );
}

function InfoField({ icon, label, value }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '20px', minWidth: 0 }}>
            <span style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }}>{icon}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500', overflowWrap: 'anywhere' }}>{value || '—'}</div>
            </div>
        </div>
    );
}

const PAGE_STYLES = `
    .profile-grid { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 20px; align-items: start; }
    .profile-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }

    @media (max-width: 900px) {
        .profile-grid { grid-template-columns: 220px minmax(0, 1fr); }
        .profile-info-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 640px) {
        .profile-grid { grid-template-columns: minmax(0, 1fr); gap: 16px; }
        .profile-info-grid { grid-template-columns: 1fr; }
        .profile-card { padding: 20px 16px !important; }
        .profile-title { font-size: 20px !important; }
    }
`;

export default function EmployeeOnboardingProfilePage() {
    const [onboarding, setOnboarding] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyOnboarding();
            setOnboarding(res.data?.data);
        } catch (err) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    if (!onboarding) {
        return (
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '60px 20px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Profile not available yet</div>
            </div>
        );
    }

    const initials = (onboarding.employeeName || '')
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div>
            <style>{PAGE_STYLES}</style>

            <div style={{ marginBottom: '24px' }}>
                <h1 className="profile-title" style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    My Profile
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    View your personal information.
                </p>
            </div>

            <div className="profile-grid">
                {/* Left card */}
                <div className="profile-card" style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '28px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center', minWidth: 0 }}>
                    <div style={{
                        width: '90px', height: '90px', borderRadius: '18px', margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '30px', fontWeight: '800', color: 'white',
                    }}>
                        {initials}
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '2px', overflowWrap: 'anywhere' }}>
                        {onboarding.employeeName}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', overflowWrap: 'anywhere' }}>
                        {onboarding.employeeDesignation || '—'}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <StatusPill status={onboarding.status} />
                    </div>
                    <span style={{ display: 'inline-block', background: 'var(--card-border)', color: 'var(--text-secondary)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', overflowWrap: 'anywhere' }}>
                        {onboarding.employeeCode}
                    </span>
                </div>

                {/* Right info panel */}
                <div className="profile-card" style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                        Contact & Personal Information
                    </div>
                    <div className="profile-info-grid">
                        <InfoField icon={<Mail size={18} />} label="Email" value={onboarding.employeeEmail} />
                        <InfoField icon={<Phone size={18} />} label="Phone" value={onboarding.employeePhone} />
                        <InfoField icon={<Building2 size={18} />} label="Department" value={onboarding.department} />
                        <InfoField icon={<Briefcase size={18} />} label="Designation" value={onboarding.employeeDesignation} />
                        <InfoField icon={<Calendar size={18} />} label="Joining Date" value={onboarding.joiningDate} />
                        <InfoField icon={<Cake size={18} />} label="Date of Birth" value={onboarding.employeeDateOfBirth} />
                    </div>
                </div>
            </div>
        </div>
    );
}