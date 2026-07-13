'use client';
import { useState, useEffect } from 'react';
import { getMyAttendance, checkIn, checkOut } from '@/lib/employeeApi';
import toast from 'react-hot-toast';

function Badge({ status }) {
  const map = {
    PRESENT:  { bg: '#dcfce7', color: '#16a34a' },
    ABSENT:   { bg: '#fee2e2', color: '#dc2626' },
    HALF_DAY: { bg: '#fff7ed', color: '#f59e0b' },
    LATE:     { bg: '#fdf4ff', color: '#9333ea' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 12px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700',
    }}>
      {status?.replace('_', ' ')}
    </span>
  );
}

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchAttendance();
  }, [page]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await getMyAttendance(page, 10);
      const data = res.data?.data;
      const content = data?.content || [];
      setRecords(content);
      setTotalPages(data?.totalPages || 0);
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = content.find(r => r.date === today);
      setTodayAtt(todayRecord || null);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await checkIn();
      toast.success('Checked in successfully!');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await checkOut(remarks);
      toast.success('Checked out successfully!');
      setShowRemarks(false);
      setRemarks('');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const halfDayCount = records.filter(r => r.status === 'HALF_DAY').length;
  const absentCount = records.filter(r => r.status === 'ABSENT').length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          Attendance
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          Track your daily attendance and work hours
        </p>
      </div>

      {/* Today's Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
        borderRadius: '16px', padding: '24px',
        marginBottom: '24px', color: 'white',
      }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '16px', fontWeight: '600' }}>
          TODAY — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          {/* Check in / out times */}
          <div style={{ display: 'flex', gap: '40px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>CHECK IN</div>
              <div style={{ fontSize: '28px', fontWeight: '800' }}>
                {todayAtt?.checkIn ? todayAtt.checkIn.substring(0, 5) : '--:--'}
              </div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}/>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>CHECK OUT</div>
              <div style={{ fontSize: '28px', fontWeight: '800' }}>
                {todayAtt?.checkOut ? todayAtt.checkOut.substring(0, 5) : '--:--'}
              </div>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}/>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>WORK HOURS</div>
              <div style={{ fontSize: '28px', fontWeight: '800' }}>
                {todayAtt?.workHours ? `${todayAtt.workHours}h` : '--'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleCheckIn}
              disabled={!!todayAtt?.checkIn || checkingIn}
              style={{
                padding: '12px 24px',
                background: todayAtt?.checkIn ? 'rgba(255,255,255,0.1)' : 'white',
                color: todayAtt?.checkIn ? 'rgba(255,255,255,0.5)' : '#1e3a5f',
                border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '700',
                cursor: todayAtt?.checkIn ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {checkingIn ? '⏳ Checking in...' : todayAtt?.checkIn ? '✓ Checked In' : '→ Check In'}
            </button>

            {!showRemarks ? (
              <button
                onClick={() => {
                  if (!todayAtt?.checkIn || todayAtt?.checkOut) return;
                  setShowRemarks(true);
                }}
                disabled={!todayAtt?.checkIn || !!todayAtt?.checkOut || checkingOut}
                style={{
                  padding: '12px 24px',
                  background: (!todayAtt?.checkIn || todayAtt?.checkOut) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)',
                  color: (!todayAtt?.checkIn || todayAtt?.checkOut) ? 'rgba(255,255,255,0.4)' : 'white',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  borderRadius: '10px', fontSize: '14px', fontWeight: '700',
                  cursor: (!todayAtt?.checkIn || todayAtt?.checkOut) ? 'not-allowed' : 'pointer',
                }}
              >
                {todayAtt?.checkOut ? '✓ Checked Out' : '← Check Out'}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Add remarks (optional)"
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px', color: 'white',
                    fontSize: '13px', outline: 'none', width: '200px',
                  }}
                />
                <button
                  onClick={handleCheckOut}
                  disabled={checkingOut}
                  style={{
                    padding: '10px 18px', background: 'white',
                    color: '#1e3a5f', border: 'none',
                    borderRadius: '8px', fontSize: '13px',
                    fontWeight: '700', cursor: 'pointer',
                  }}
                >
                  {checkingOut ? '⏳' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowRemarks(false)}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white', border: 'none',
                    borderRadius: '8px', fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        {todayAtt && (
          <div style={{ marginTop: '16px' }}>
            <Badge status={todayAtt.status}/>
            {todayAtt.remarks && (
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginLeft: '10px' }}>
                Remarks: {todayAtt.remarks}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Monthly Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Present', value: presentCount, color: '#16a34a', bg: '#dcfce7', icon: '✅' },
          { label: 'Half Day', value: halfDayCount, color: '#f59e0b', bg: '#fff7ed', icon: '⚡' },
          { label: 'Absent', value: absentCount, color: '#dc2626', bg: '#fee2e2', icon: '❌' },
          { label: 'Total Records', value: records.length, color: '#3b82f6', bg: '#eff6ff', icon: '📊' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: '16px', border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{s.label}</span>
              <div style={{ width: '32px', height: '32px', background: s.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                {s.icon}
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Attendance History Table */}
      <div style={{
        background: 'white', borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Attendance History</h3>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{records.length} records</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No attendance records found
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.5fr',
              padding: '10px 20px', background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
            }}>
              {['Date', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Remarks'].map(h => (
                <div key={h} style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Table Rows */}
            {records.map((r, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1.5fr',
                padding: '12px 20px', borderBottom: '1px solid #f1f5f9',
                alignItems: 'center',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                  {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                  {r.checkIn ? r.checkIn.substring(0, 5) : '--'}
                </div>
                <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>
                  {r.checkOut ? r.checkOut.substring(0, 5) : '--'}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {r.workHours ? `${r.workHours}h` : '--'}
                </div>
                <div><Badge status={r.status}/></div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {r.remarks || '--'}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page === 0 ? '#cbd5e1' : '#374151', background: 'white', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
                >
                  ← Prev
                </button>
                <span style={{ padding: '6px 14px', fontSize: '12px', color: '#64748b' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page >= totalPages - 1 ? '#cbd5e1' : '#374151', background: 'white', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}