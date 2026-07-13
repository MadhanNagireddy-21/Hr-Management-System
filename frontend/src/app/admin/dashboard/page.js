'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  getAllEmployees,
  getPendingLeaves,
  getAttendanceByDate,
  hrAction,
  managerAction,
} from '@/lib/adminApi';
import { getUnreadCount } from '@/lib/employeeApi';
import toast from 'react-hot-toast';

function StatCard({ label, value, sub, color, bg, icon }) {
  return (
    <div style={{
      background: 'white', borderRadius: '12px', padding: '20px',
      border: '1px solid #e2e8f0', flex: 1,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{label}</span>
        <div style={{ width: '40px', height: '40px', background: bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '32px', fontWeight: '900', color, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{sub}</div>
    </div>
  );
}

function Badge({ status }) {
  const map = {
    APPROVED:        { bg: '#dcfce7', color: '#16a34a' },
    PENDING:         { bg: '#fef9c3', color: '#ca8a04' },
    REJECTED:        { bg: '#fee2e2', color: '#dc2626' },
    HR_PENDING:      { bg: '#fff7ed', color: '#f59e0b' },
    MANAGER_PENDING: { bg: '#eff6ff', color: '#3b82f6' },
    CANCELLATION_PENDING: { bg: '#fdf4ff', color: '#9333ea' },
    ACTIVE:          { bg: '#dcfce7', color: '#16a34a' },
    INACTIVE:        { bg: '#fee2e2', color: '#dc2626' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
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

export default function AdminDashboard() {
  const { user } = useSelector(s => s.auth);
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const [empRes, leaveRes, attRes, unreadRes] = await Promise.allSettled([
        getAllEmployees(0, 100),
        getPendingLeaves(0, 5),
        getAttendanceByDate(today),
        getUnreadCount(),
      ]);

      if (empRes.status === 'fulfilled') {
        setEmployees(empRes.value.data?.data?.content || []);
      }
     if (leaveRes.status === 'fulfilled') {
  const allLeaves = leaveRes.value.data?.data?.content || [];
  // Show ALL pending leaves regardless of stage
  setPendingLeaves(allLeaves);
}
      if (attRes.status === 'fulfilled') {
        setTodayAttendance(attRes.value.data?.data?.content || []);
      }
      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(unreadRes.value.data?.data || 0);
      }
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

const handleLeaveAction = async (id, action) => {
  setActioning(id + action);
  try {
    // Find the leave to check its current stage
    const leave = pendingLeaves.find(l => l.id === id);
    const stage = leave?.approvalStage || leave?.status;

    console.log('Leave stage:', stage);

    if (stage === 'MANAGER_PENDING' || stage === 'PENDING') {
      // Stage 1 — Manager action → forwards to HR
      await managerAction(
        id, action,
        action === 'APPROVED'
          ? 'Approved by Manager'
          : 'Rejected by Manager'
      );
      toast.success(
        action === 'APPROVED'
          ? '✅ Forwarded to HR for verification!'
          : '❌ Leave rejected!'
      );
    } else if (stage === 'HR_PENDING') {
      // Stage 2 — HR action → final approval
      await hrAction(
        id, action,
        action === 'APPROVED'
          ? 'Approved by HR'
          : 'Rejected by HR'
      );
      toast.success(
        action === 'APPROVED'
          ? '✅ Leave approved successfully!'
          : '❌ Leave rejected!'
      );
    } else {
      toast.error('Invalid leave stage: ' + stage);
    }
    fetchAll();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Action failed');
  } finally {
    setActioning(null);
  }
};

  const activeEmployees = employees.filter(e => e.active);
  const presentToday = todayAttendance.filter(a => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Welcome back, {user?.name}! Here's your system overview.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading...</div>
      ) : (
        <>
          {/* Stats Row */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <StatCard
              label="Total Employees"
              value={employees.length}
              sub={`${activeEmployees.length} active`}
              color="#1e3a5f" bg="#eff6ff" icon="👥"
            />
            <StatCard
              label="Present Today"
              value={presentToday}
              sub={`of ${todayAttendance.length} checked in`}
              color="#16a34a" bg="#dcfce7" icon="✅"
            />
            <StatCard
              label="Pending Leaves"
              value={pendingLeaves.length}
              sub="Awaiting approval"
              color="#f59e0b" bg="#fff7ed" icon="⏳"
            />
            <StatCard
              label="Notifications"
              value={unreadCount}
              sub="Unread alerts"
              color="#8b5cf6" bg="#fdf4ff" icon="🔔"
            />
          </div>

          {/* Main Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* Pending Leave Approvals */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>⏳ Pending Approvals</h3>
                <button
                  onClick={() => router.push('/admin/leave')}
                  style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  View All →
                </button>
              </div>

              {pendingLeaves.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
                  No pending approvals
                </div>
              ) : (
                pendingLeaves.map((l, i) => (
                  <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>
                          {l.employeeName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {l.leaveType} · {l.startDate} to {l.endDate} · {l.totalDays} day(s)
                        </div>
                      </div>
                      <Badge status={l.status}/>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', fontStyle: 'italic' }}>
                      "{l.reason}"
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                     <button
  onClick={() => handleLeaveAction(l.id, 'APPROVED')}
  disabled={actioning === l.id + 'APPROVED'}
  style={{
    padding: '6px 16px', background: '#dcfce7',
    color: '#16a34a', border: '1px solid #bbf7d0',
    borderRadius: '6px', fontSize: '12px', fontWeight: '700',
    cursor: 'pointer',
  }}
>
  {actioning === l.id + 'APPROVED' ? '⏳' :
    (l.approvalStage === 'MANAGER_PENDING' || l.status === 'PENDING')
      ? '✓ Forward to HR'
      : '✓ Approve'
  }
</button>
                      <button
                        onClick={() => handleLeaveAction(l.id, 'REJECTED')}
                        disabled={actioning === l.id + 'REJECTED'}
                        style={{
                          padding: '6px 16px', background: '#fee2e2',
                          color: '#dc2626', border: '1px solid #fecaca',
                          borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        {actioning === l.id + 'REJECTED' ? '⏳' : '✗ Reject'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Today's Attendance */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                  📅 Today's Attendance
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {todayAttendance.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                  No attendance records for today
                </div>
              ) : (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {todayAttendance.map((a, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 20px', borderBottom: '1px solid #f1f5f9',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px',
                          background: '#eff6ff', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '700', color: '#3b82f6',
                        }}>
                          {a.employeeName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                            {a.employeeName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            In: {a.checkIn?.substring(0, 5) || '--'} · Out: {a.checkOut?.substring(0, 5) || '--'}
                          </div>
                        </div>
                      </div>
                      <Badge status={a.status}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Employees Table */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>👥 Employees</h3>
              <button
                onClick={() => router.push('/admin/employees')}
                style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View All →
              </button>
            </div>

            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 2fr 1.5fr 1.5fr 1fr 1fr', padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['ID', 'Name', 'Department', 'Designation', 'Role', 'Status'].map(h => (
                <div key={h} style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {h}
                </div>
              ))}
            </div>

            {employees.slice(0, 6).map((e, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '0.5fr 2fr 1.5fr 1.5fr 1fr 1fr',
                padding: '12px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center',
              }}
                onMouseEnter={ev => ev.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'white'}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                  {e.employeeCode}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '700', color: 'white', flexShrink: 0,
                  }}>
                    {e.firstName?.[0]}{e.lastName?.[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                      {e.firstName} {e.lastName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{e.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{e.department || '—'}</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{e.designation || '—'}</div>
                <div>
                  <span style={{
                    background: e.role === 'ADMIN' ? '#dbeafe' : e.role === 'HR' ? '#fdf4ff' : '#f1f5f9',
                    color: e.role === 'ADMIN' ? '#1d4ed8' : e.role === 'HR' ? '#9333ea' : '#374151',
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                  }}>
                    {e.role}
                  </span>
                </div>
                <div>
                  <Badge status={e.active ? 'ACTIVE' : 'INACTIVE'}/>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '20px' }}>
            {[
              { label: 'Add Employee', icon: '👤', color: '#1e3a5f', route: '/admin/employees' },
              { label: 'Leave Approvals', icon: '✅', color: '#16a34a', route: '/admin/leave' },
              { label: 'Generate Payroll', icon: '💰', color: '#f59e0b', route: '/admin/payroll' },
              { label: 'Recruitment', icon: '💼', color: '#8b5cf6', route: '/admin/recruitment' },
            ].map((a, i) => (
              <button
                key={i}
                onClick={() => router.push(a.route)}
                style={{
                  background: 'white', border: '1px solid #e2e8f0',
                  borderRadius: '12px', padding: '16px',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: '40px', height: '40px',
                  background: a.color + '15',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '20px', flexShrink: 0,
                }}>
                  {a.icon}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                  {a.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}