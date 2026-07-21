'use client';
import { useState, useEffect, useCallback } from 'react';
import { getAllEmployees } from '@/lib/adminApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

function Badge({ status }) {
  const map = {
    PENDING:     { bg: '#fef9c3', color: '#ca8a04' },
    IN_PROGRESS: { bg: '#eff6ff', color: '#3b82f6' },
    COMPLETED:   { bg: '#dcfce7', color: '#16a34a' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
      {status?.replace('_', ' ')}
    </span>
  );
}

const CHECKLIST_ITEMS = [
  { key: 'offerLetterSigned',      label: 'Offer Letter Signed',       icon: '📄' },
  { key: 'idProofSubmitted',       label: 'ID Proof Submitted',        icon: '🪪' },
  { key: 'addressProofSubmitted',  label: 'Address Proof Submitted',   icon: '🏠' },
  { key: 'educationDocsSubmitted', label: 'Education Docs Submitted',  icon: '🎓' },
  { key: 'bankDetailsSubmitted',   label: 'Bank Details Submitted',    icon: '🏦' },
  { key: 'pfFormSubmitted',        label: 'PF Form Submitted',         icon: '📋' },
  { key: 'esiFormSubmitted',       label: 'ESI Form Submitted',        icon: '📋' },
  { key: 'ndaSigned',             label: 'NDA Signed',                icon: '✍️' },
  { key: 'laptopIssued',          label: 'Laptop Issued',             icon: '💻' },
  { key: 'emailCreated',          label: 'Email Created',             icon: '📧' },
  { key: 'systemAccessGiven',     label: 'System Access Given',       icon: '🔐' },
];

export default function OnboardingPage() {
  const [onboardings, setOnboardings]   = useState([]);
  const [employees, setEmployees]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [initEmpId, setInitEmpId]       = useState('');
  const [initializing, setInitializing] = useState(false);
  const [updating, setUpdating]         = useState(false);
  const [checklist, setChecklist]       = useState({});
  const [remarks, setRemarks]           = useState('');
  const [tab, setTab]                   = useState('ALL');

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

  const handleSelect = (onb) => {
    setSelected(onb);
    const cl = {};
    CHECKLIST_ITEMS.forEach(item => { cl[item.key] = onb[item.key] || false; });
    setChecklist(cl);
    setRemarks(onb.remarks || '');
  };

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

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const res = await api.put(`/api/onboarding/${selected.id}`, {
        ...checklist, remarks,
      });
      toast.success('Checklist updated!');
      const updated = res.data?.data;
      setSelected(updated);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(false); }
  };

  const toggleItem = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = tab === 'ALL'
    ? onboardings
    : tab === 'PENDING'
    ? onboardings.filter(o => o.status === 'PENDING')
    : tab === 'IN_PROGRESS'
    ? onboardings.filter(o => o.status === 'IN_PROGRESS')
    : onboardings.filter(o => o.status === 'COMPLETED');

  const completedCount  = onboardings.filter(o => o.status === 'COMPLETED').length;
  const inProgressCount = onboardings.filter(o => o.status === 'IN_PROGRESS').length;
  const pendingCount    = onboardings.filter(o => o.status === 'PENDING').length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          Onboarding Management
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Initialize and track employee onboarding checklists
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total', value: onboardings.length, color: '#1e3a5f', bg: '#eff6ff', icon: '📋' },
          { label: 'Pending', value: pendingCount, color: '#ca8a04', bg: '#fef9c3', icon: '⏳' },
          { label: 'In Progress', value: inProgressCount, color: '#3b82f6', bg: '#eff6ff', icon: '🔄' },
          { label: 'Completed', value: completedCount, color: '#16a34a', bg: '#dcfce7', icon: '✅' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{s.label}</span>
              <div style={{ width: '28px', height: '28px', background: s.bg, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Initialize New Onboarding */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '14px' }}>
          🚀 Initialize New Onboarding
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={initEmpId} onChange={e => setInitEmpId(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'white' }}>
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
              padding: '10px 24px', background: initEmpId ? '#1e3a5f' : '#cbd5e1',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: '700',
              cursor: initEmpId ? 'pointer' : 'not-allowed',
            }}>
            {initializing ? '⏳ Initializing...' : '+ Initialize'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '380px 1fr' : '1fr', gap: '20px' }}>

        {/* Onboarding List */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

          {/* Tabs */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '4px', background: '#f8fafc' }}>
            {[
              { key: 'ALL', label: 'All' },
              { key: 'PENDING', label: 'Pending' },
              { key: 'IN_PROGRESS', label: 'In Progress' },
              { key: 'COMPLETED', label: 'Done' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                  fontWeight: tab === t.key ? '700' : '400',
                  background: tab === t.key ? 'white' : 'transparent',
                  color: tab === t.key ? '#1e293b' : '#64748b',
                  border: 'none', cursor: 'pointer',
                  boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>No onboarding records</div>
            </div>
          ) : (
            filtered.map((onb) => (
              <div key={onb.id} onClick={() => handleSelect(onb)}
                style={{
                  padding: '14px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                  background: selected?.id === onb.id ? '#eff6ff' : 'white',
                  borderLeft: selected?.id === onb.id ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (selected?.id !== onb.id) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (selected?.id !== onb.id) e.currentTarget.style.background = 'white'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                      {onb.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{onb.employeeName}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{onb.employeeCode} · {onb.department}</div>
                    </div>
                  </div>
                  <Badge status={onb.status}/>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Completion</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: onb.completionPercent === 100 ? '#16a34a' : '#3b82f6' }}>
                      {onb.completionPercent}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      background: onb.completionPercent === 100 ? '#16a34a' : '#3b82f6',
                      width: `${onb.completionPercent}%`, transition: 'width 0.5s',
                    }}/>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  Joining: {onb.joiningDate} · HR: {onb.assignedHrName}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checklist Panel */}
        {selected && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', marginBottom: '2px' }}>{selected.employeeName}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
                    {selected.employeeCode} · {selected.department} · Joined: {selected.joiningDate}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '28px', fontWeight: '900' }}>{selected.completionPercent}%</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Complete</div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: '12px', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: selected.completionPercent === 100 ? '#86efac' : 'white',
                  width: `${selected.completionPercent}%`, transition: 'width 0.5s',
                }}/>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '14px' }}>
                Onboarding Checklist
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                {CHECKLIST_ITEMS.map(item => (
                  <div key={item.key}
                    onClick={() => toggleItem(item.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                      background: checklist[item.key] ? '#f0fdf4' : '#f8fafc',
                      border: `1.5px solid ${checklist[item.key] ? '#bbf7d0' : '#e2e8f0'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      background: checklist[item.key] ? '#16a34a' : '#e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', color: 'white', fontWeight: '700',
                      transition: 'all 0.2s',
                    }}>
                      {checklist[item.key] ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: '12px' }}>{item.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: checklist[item.key] ? '600' : '400', color: checklist[item.key] ? '#16a34a' : '#374151' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Remarks */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Remarks
                </label>
                <textarea
                  value={remarks} onChange={e => setRemarks(e.target.value)}
                  placeholder="Add any remarks about the onboarding..."
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              {/* Save Button */}
              <button onClick={handleUpdate} disabled={updating}
                style={{
                  width: '100%', padding: '12px', background: '#1e3a5f',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '700',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  opacity: updating ? 0.7 : 1,
                }}>
                {updating ? '⏳ Saving...' : '💾 Save Checklist'}
              </button>

              {/* Complete All Button */}
              {selected.completionPercent < 100 && (
                <button
                  onClick={() => {
                    const all = {};
                    CHECKLIST_ITEMS.forEach(item => { all[item.key] = true; });
                    setChecklist(all);
                    toast('All items checked! Click Save to confirm.', { icon: '✅' });
                  }}
                  style={{
                    width: '100%', marginTop: '8px', padding: '10px',
                    background: '#f0fdf4', color: '#16a34a',
                    border: '1px solid #bbf7d0', borderRadius: '10px',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  }}>
                  ✓ Mark All Complete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}