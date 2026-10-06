'use client';
import { useState, useEffect } from 'react';
import { getMyPayslips, downloadPayslipPdf } from '@/lib/employeeApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Banknote, Download, Loader2, ChevronLeft } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* ============================================================
   CSS
============================================================ */

const payslipCSS = `
.ps-root { width: 100%; max-width: 100%; min-width: 0; color: var(--text-primary); }
.ps-root *, .ps-root *::before, .ps-root *::after { box-sizing: border-box; }

.ps-head { margin-bottom: 24px; }
.ps-title { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
.ps-subtitle { font-size: 13px; color: var(--text-muted); margin: 0; }

/* ---------- layout ---------- */
.ps-layout { display: grid; grid-template-columns: minmax(0,1fr); gap: 20px; align-items: start; }
.ps-layout.has-selected { grid-template-columns: minmax(0,1fr) minmax(0,1.4fr); }

.ps-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; box-shadow: var(--card-shadow); overflow: hidden; min-width: 0; }
.ps-card-head { padding: 16px 20px; border-bottom: 1px solid var(--card-border); }
.ps-card-title { font-size: 15px; font-weight: 700; margin: 0; }
.ps-state { padding: 40px 20px; text-align: center; color: var(--text-muted); }

/* ---------- list item ---------- */
.ps-item {
  width: 100%; display: block; text-align: left; border: none; cursor: pointer; color: inherit;
  padding: 16px 20px; min-height: 64px; background: transparent;
  border-bottom: 1px solid var(--card-border); border-left: 3px solid transparent;
  transition: background .15s;
}
.ps-item:hover, .ps-item:focus-visible { background: rgba(148,163,184,.10); outline: none; }
.ps-item.active { background: rgba(59,130,246,.10); border-left-color: #3b82f6; }
.ps-item-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.ps-item-main { min-width: 0; }
.ps-item-month { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
.ps-item-no { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ps-item-side { text-align: right; flex-shrink: 0; }
.ps-item-net { font-size: 16px; font-weight: 800; color: #16a34a; margin-bottom: 4px; }
.ps-pill { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
.ps-pill.paid { background: rgba(22,163,74,.15); color: #16a34a; }
.ps-pill.pending { background: rgba(234,179,8,.18); color: #ca8a04; }
html.dark .ps-pill.paid { color: #4ade80; }
html.dark .ps-pill.pending { color: #facc15; }
html.dark .ps-item-net, html.dark .ps-net-value, html.dark .ps-gross-value { color: #4ade80; }

/* ---------- pager ---------- */
.ps-pager { padding: 14px 20px; display: flex; justify-content: center; align-items: center; gap: 8px; border-top: 1px solid var(--card-border); }
.ps-pager button { padding: 8px 14px; min-height: 38px; border: 1px solid var(--card-border); border-radius: 6px; font-size: 12px; font-weight: 600; background: var(--bg-primary); color: var(--text-primary); cursor: pointer; }
.ps-pager button:disabled { color: var(--text-muted); cursor: not-allowed; opacity: .6; }
.ps-pager span { font-size: 12px; color: var(--text-secondary); padding: 0 6px; }

/* ---------- detail ---------- */
.ps-back { display: none; align-items: center; gap: 4px; margin-bottom: 12px; padding: 8px 12px 8px 6px; min-height: 40px; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 10px; color: var(--text-primary); font-size: 13px; font-weight: 700; cursor: pointer; }

.ps-hero { background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 20px 24px; color: #fff; }
.ps-hero-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.ps-hero-tag { font-size: 11px; color: rgba(255,255,255,.7); margin-bottom: 4px; letter-spacing: 1px; }
.ps-hero-month { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
.ps-hero-no { font-size: 12px; color: rgba(255,255,255,.7); word-break: break-all; }
.ps-hero-net { text-align: right; }
.ps-hero-amount { font-size: 28px; font-weight: 900; line-height: 1.1; }
.ps-hero-paid { font-size: 11px; color: rgba(255,255,255,.7); margin-top: 4px; }
.ps-info { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.2); display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px 8px; }
.ps-info-label { font-size: 10px; color: rgba(255,255,255,.6); letter-spacing: .4px; }
.ps-info-value { font-size: 13px; font-weight: 600; word-break: break-word; }

.ps-body { padding: 20px 24px; }
.ps-section-title { font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.ps-line { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--card-border); font-size: 13px; }
.ps-line span:first-child { color: var(--text-secondary); }
.ps-line span:last-child { font-weight: 600; white-space: nowrap; }
.ps-gross { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; margin-top: 4px; border-top: 2px solid var(--card-border); font-size: 14px; font-weight: 800; }
.ps-gross-value { color: #16a34a; }
.ps-net { margin: 20px 0 16px; padding: 16px 20px; border-radius: 10px; background: rgba(22,163,74,.10); border: 1px solid rgba(22,163,74,.30); display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.ps-net-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
.ps-net-hint { font-size: 11px; color: var(--text-muted); }
.ps-net-value { font-size: 28px; font-weight: 900; color: #16a34a; white-space: nowrap; }
.ps-download { width: 100%; padding: 13px; min-height: 48px; background: #1e3a5f; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
.ps-download:disabled { opacity: .7; cursor: not-allowed; }
html.dark .ps-download { background: #2563eb; }

/* =========================================================
   TABLET / PHONE (<= 900px): one panel at a time
   ========================================================= */
@media (max-width: 900px) {
  .ps-layout.has-selected { grid-template-columns: minmax(0,1fr); }
  .ps-layout.has-selected .ps-list { display: none; }
  .ps-back { display: inline-flex; }
}

/* =========================================================
   PHONE (<= 600px)
   ========================================================= */
@media (max-width: 600px) {
  .ps-head { margin-bottom: 16px; }
  .ps-title { font-size: 20px; }
  .ps-card-head { padding: 14px 16px; }
  .ps-item { padding: 14px 16px; }

  .ps-hero { padding: 18px 16px; }
  .ps-hero-top { flex-direction: column; gap: 14px; }
  .ps-hero-net { text-align: left; width: 100%; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.2); }
  .ps-hero-amount { font-size: 30px; }

  .ps-body { padding: 16px; }
  .ps-net { padding: 14px 16px; }
  .ps-net-value { font-size: 24px; }
}
`;

/* ============================================================
   LIST ITEM
============================================================ */

function PayslipListItem({ p, selected, loadingNumber, onSelect, formatCurrency }) {
  const isSelected = selected?.payslipNumber === p.payslipNumber;
  const isLoading = loadingNumber === p.payslipNumber;

  return (
    <button
      type="button"
      className={'ps-item' + (isSelected ? ' active' : '')}
      onClick={() => onSelect(p.payslipNumber)}
    >
      <div className="ps-item-row">
        <div className="ps-item-main">
          <div className="ps-item-month">
            {MONTHS[(p.month || 1) - 1]} {p.year}
          </div>
          <div className="ps-item-no">{p.payslipNumber}</div>
        </div>

        <div className="ps-item-side">
          <div className="ps-item-net">
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            ) : (
              formatCurrency(p.netSalary)
            )}
          </div>
          <span className={'ps-pill ' + (p.paid ? 'paid' : 'pending')}>
            {p.paid ? 'PAID' : 'PENDING'}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ============================================================
   LIST VIEW
============================================================ */

function PayslipListView({
  loading,
  payslips,
  selected,
  loadingNumber,
  onSelect,
  page,
  totalPages,
  setPage,
  formatCurrency,
}) {
  const renderContent = () => {
    if (loading) {
      return <div className="ps-state">Loading...</div>;
    }

    if (payslips.length === 0) {
      return (
        <div className="ps-state" style={{ padding: '60px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#4f46e5' }}>
            <Banknote size={40} strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            No payslips yet
          </div>
          <div style={{ fontSize: 13 }}>Payslips will appear here once HR generates them</div>
        </div>
      );
    }

    return (
      <>
        {payslips.map((p) => (
          <PayslipListItem
            key={p.payslipNumber || p.id}
            p={p}
            selected={selected}
            loadingNumber={loadingNumber}
            onSelect={onSelect}
            formatCurrency={formatCurrency}
          />
        ))}

        {totalPages > 1 && (
          <div className="ps-pager">
            <button type="button" onClick={() => setPage((prev) => Math.max(0, prev - 1))} disabled={page === 0}>
              ← Prev
            </button>

            <span>
              {page + 1} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={page >= totalPages - 1}
            >
              Next →
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="ps-card ps-list">
      <div className="ps-card-head">
        <h3 className="ps-card-title">Payslip History</h3>
      </div>
      {renderContent()}
    </div>
  );
}

/* ============================================================
   DETAIL VIEW
============================================================ */

function PayslipDetailView({ selected, loadingDetail, formatCurrency, onBack }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);

    try {
      const res = await downloadPayslipPdf(selected.payslipNumber);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selected.payslipNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Payslip downloaded');
    } catch (err) {
      console.error('Error downloading payslip:', err);
      toast.error('Failed to download payslip');
    } finally {
      setDownloading(false);
    }
  };

  const back = (
    <button type="button" className="ps-back" onClick={onBack}>
      <ChevronLeft size={18} />
      All payslips
    </button>
  );

  if (loadingDetail) {
    return (
      <div>
        {back}
        <div className="ps-card ps-state">Loading details...</div>
      </div>
    );
  }

  const earningsList = [
    { label: 'Basic Salary', value: selected.basicSalary },
    { label: 'HRA (40%)', value: selected.hra },
    { label: 'DA (10%)', value: selected.da },
    { label: 'Special Allowance', value: selected.specialAllowance },
  ];

  return (
    <div id="ps-detail">
      {back}

      <div className="ps-card">
        {/* Hero */}
        <div className="ps-hero">
          <div className="ps-hero-top">
            <div style={{ minWidth: 0 }}>
              <div className="ps-hero-tag">PAYSLIP</div>
              <div className="ps-hero-month">
                {MONTHS[(selected.month || 1) - 1]} {selected.year}
              </div>
              <div className="ps-hero-no">{selected.payslipNumber}</div>
            </div>

            <div className="ps-hero-net">
              <div className="ps-hero-tag">NET SALARY</div>
              <div className="ps-hero-amount">{formatCurrency(selected.netSalary)}</div>
              <div className="ps-hero-paid">
                {selected.paid ? `Paid on ${selected.payDate}` : 'Payment Pending'}
              </div>
            </div>
          </div>

          <div className="ps-info">
            <div>
              <div className="ps-info-label">EMPLOYEE</div>
              <div className="ps-info-value">{selected.employeeName}</div>
            </div>
            <div>
              <div className="ps-info-label">EMPLOYEE CODE</div>
              <div className="ps-info-value">{selected.employeeCode}</div>
            </div>
            <div>
              <div className="ps-info-label">PRESENT DAYS</div>
              <div className="ps-info-value">{selected.presentDays} days</div>
            </div>
            <div>
              <div className="ps-info-label">LOP DAYS</div>
              <div className="ps-info-value">{selected.lopDays} days</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="ps-body">
          <div className="ps-section-title">Earnings</div>

          {earningsList.map((item) => (
            <div key={item.label} className="ps-line">
              <span>{item.label}</span>
              <span>{formatCurrency(item.value)}</span>
            </div>
          ))}

          <div className="ps-gross">
            <span>Gross Salary</span>
            <span className="ps-gross-value">{formatCurrency(selected.grossSalary)}</span>
          </div>

          <div className="ps-net">
            <div>
              <div className="ps-net-label">NET SALARY</div>
              <div className="ps-net-hint">Equal to Gross Salary</div>
            </div>
            <div className="ps-net-value">{formatCurrency(selected.netSalary)}</div>
          </div>

          <button type="button" className="ps-download" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Downloading...
              </>
            ) : (
              <>
                <Download size={16} /> Download Payslip PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [loadingNumber, setLoadingNumber] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchPayslips = async () => {
      try {
        const res = await getMyPayslips(page, 10);

        if (active) {
          const data = res.data?.data;
          setPayslips(data?.content || []);
          setTotalPages(data?.totalPages || 0);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching payslips:', err);

        if (active) {
          toast.error(err?.response?.data?.message || 'Failed to load payslips');
          setLoading(false);
        }
      }
    };

    fetchPayslips();

    return () => {
      active = false;
    };
  }, [page]);

  const fetchDetail = async (payslipNumber) => {
    setLoadingNumber(payslipNumber);

    try {
      const res = await api.get(`/api/payslips/${payslipNumber}`);
      setSelected(res.data?.data);

      // On phones the detail replaces the list, so bring it to the top
      if (typeof window !== 'undefined' && window.innerWidth <= 900) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Error fetching payslip details:', err);
      toast.error(err?.response?.data?.message || 'Failed to load payslip details');
    } finally {
      setLoadingNumber(null);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '—';

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="ps-root">
      <style dangerouslySetInnerHTML={{ __html: payslipCSS }} />

      <div className="ps-head">
        <h1 className="ps-title">My Payslips</h1>
        <p className="ps-subtitle">View and download your monthly payslips</p>
      </div>

      <div className={'ps-layout' + (selected ? ' has-selected' : '')}>
        <PayslipListView
          loading={loading}
          payslips={payslips}
          selected={selected}
          loadingNumber={loadingNumber}
          onSelect={fetchDetail}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          formatCurrency={formatCurrency}
        />

        {selected && (
          <PayslipDetailView
            selected={selected}
            loadingDetail={loadingNumber !== null}
            formatCurrency={formatCurrency}
            onBack={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}