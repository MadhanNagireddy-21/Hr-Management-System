'use client';
import { useState, useEffect } from 'react';
import { getMyPayslips } from '@/lib/employeeApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchPayslips();
  }, [page]);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const res = await getMyPayslips(page, 10);
      const data = res.data?.data;
      setPayslips(data?.content || []);
      setTotalPages(data?.totalPages || 0);
    } catch (err) {
      toast.error('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (payslipNumber) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/api/payslips/${payslipNumber}`);
      setSelected(res.data?.data);
    } catch (err) {
      toast.error('Failed to load payslip details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>
          My Payslips
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>
          View and download your monthly payslips
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap: '20px' }}>

        {/* Payslip List */}
        <div style={{
          background: 'white', borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Payslip History</h3>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
          ) : payslips.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💰</div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                No payslips yet
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                Payslips will appear here once HR generates them
              </div>
            </div>
          ) : (
            <>
              {payslips.map((p, i) => (
                <div
                  key={i}
                  onClick={() => fetchDetail(p.payslipNumber)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: selected?.payslipNumber === p.payslipNumber ? '#eff6ff' : 'white',
                    borderLeft: selected?.payslipNumber === p.payslipNumber ? '3px solid #3b82f6' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (selected?.payslipNumber !== p.payslipNumber)
                      e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={e => {
                    if (selected?.payslipNumber !== p.payslipNumber)
                      e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                        {MONTHS[(p.month || 1) - 1]} {p.year}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {p.payslipNumber}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a', marginBottom: '4px' }}>
                        {formatCurrency(p.netSalary)}
                      </div>
                      <span style={{
                        background: p.paid ? '#dcfce7' : '#fef9c3',
                        color: p.paid ? '#16a34a' : '#ca8a04',
                        padding: '2px 8px', borderRadius: '20px',
                        fontSize: '10px', fontWeight: '700',
                      }}>
                        {p.paid ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
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
                  >← Prev</button>
                  <span style={{ padding: '6px 14px', fontSize: '12px', color: '#64748b' }}>
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page >= totalPages - 1 ? '#cbd5e1' : '#374151', background: 'white', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
                  >Next →</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Payslip Detail */}
        {selected && (
          <div style={{
            background: 'white', borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}>
            {loadingDetail ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading details...</div>
            ) : (
              <>
                {/* Payslip Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                  padding: '20px 24px', color: 'white',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', letterSpacing: '1px' }}>
                        PAYSLIP
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>
                        {MONTHS[(selected.month || 1) - 1]} {selected.year}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                        {selected.payslipNumber}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>NET SALARY</div>
                      <div style={{ fontSize: '28px', fontWeight: '900' }}>
                        {formatCurrency(selected.netSalary)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                        {selected.paid ? `Paid on ${selected.payDate}` : 'Payment Pending'}
                      </div>
                    </div>
                  </div>

                  {/* Employee info */}
                  <div style={{
                    marginTop: '16px', paddingTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.2)',
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                  }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>EMPLOYEE</div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{selected.employeeName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>EMPLOYEE CODE</div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{selected.employeeCode}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>PRESENT DAYS</div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{selected.presentDays} days</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>LOP DAYS</div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{selected.lopDays} days</div>
                    </div>
                  </div>
                </div>

                {/* Earnings & Deductions */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                    {/* Earnings */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                        Earnings
                      </div>
                      {[
                        { label: 'Basic Salary', value: selected.basicSalary },
                        { label: 'HRA (40%)', value: selected.hra },
                        { label: 'DA (10%)', value: selected.da },
                        { label: 'Special Allowance', value: selected.specialAllowance },
                      ].map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '8px 0', borderBottom: '1px solid #f1f5f9',
                          fontSize: '13px',
                        }}>
                          <span style={{ color: '#64748b' }}>{item.label}</span>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '10px 0', fontSize: '14px', fontWeight: '800',
                        color: '#1e293b', borderTop: '2px solid #e2e8f0', marginTop: '4px',
                      }}>
                        <span>Gross Salary</span>
                        <span style={{ color: '#16a34a' }}>{formatCurrency(selected.grossSalary)}</span>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                        Deductions
                      </div>
                      {[
                        { label: 'PF (12%)', value: selected.pf },
                        { label: 'ESI (0.75%)', value: selected.esi },
                        { label: 'Professional Tax', value: selected.pt },
                        { label: 'TDS', value: selected.tds },
                      ].map((item, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '8px 0', borderBottom: '1px solid #f1f5f9',
                          fontSize: '13px',
                        }}>
                          <span style={{ color: '#64748b' }}>{item.label}</span>
                          <span style={{ fontWeight: '600', color: '#dc2626' }}>{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '10px 0', fontSize: '14px', fontWeight: '800',
                        color: '#1e293b', borderTop: '2px solid #e2e8f0', marginTop: '4px',
                      }}>
                        <span>Total Deductions</span>
                        <span style={{ color: '#dc2626' }}>{formatCurrency(selected.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Salary */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px', padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '16px',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>NET SALARY</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Gross - Total Deductions</div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#16a34a' }}>
                      {formatCurrency(selected.netSalary)}
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => toast.success('Download feature coming soon!')}
                    style={{
                      width: '100%', padding: '12px',
                      background: '#1e3a5f', color: 'white',
                      border: 'none', borderRadius: '10px',
                      fontSize: '14px', fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '8px',
                    }}
                  >
                    ⬇ Download Payslip PDF
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}