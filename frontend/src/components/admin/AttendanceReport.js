'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    Download, Loader2, Search, CalendarDays, ChevronLeft, ChevronRight, ChevronDown,
    Eye, Coffee, X, SearchX, RefreshCw, CheckCircle2, Clock3, XCircle,
} from 'lucide-react';
import { getAttendanceSummaryByDate, exportAttendanceRange } from '@/lib/adminApi';
import { downloadBlob } from '@/lib/downloadFile';
import EmployeeAttendanceModal from './EmployeeAttendanceModal';
import toast from 'react-hot-toast';

/* ---------- constants ---------- */

const PAGE_SIZE = 50;

const STATUSES = [
    { key: 'PRESENT', label: 'Present', cls: 'present', Icon: CheckCircle2 },
    { key: 'HALF_DAY', label: 'Half day', cls: 'half', Icon: Clock3 },
    { key: 'ON_LEAVE', label: 'On leave', cls: 'leave', Icon: CalendarDays },
    { key: 'ABSENT', label: 'Absent', cls: 'absent', Icon: XCircle },
];

/* ---------- helpers ---------- */

const statusMeta = (key) =>
    STATUSES.find((s) => s.key === key) || { key, label: key || 'Unknown', cls: 'unknown' };

const todayIST = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

const time5 = (v) => (v ? String(v).slice(0, 5) : null);

function longDate(iso) {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(d);
}

function initials(name) {
    const p = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return '?';
    return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function hueFor(seed) {
    let h = 0;
    for (const c of String(seed || 'x')) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
}

function formatBreaks(breaks) {
    return breaks
        .map((b) => `${time5(b?.breakStart) || '—'}–${time5(b?.breakEnd) || '…'}`)
        .join(', ');
}

/* ---------- page ---------- */

export default function AttendanceReportPage() {
    const maxDate = useMemo(() => todayIST(), []);
    const [fromDate, setFromDate] = useState(maxDate);
    const [toDate, setToDate] = useState(maxDate);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            try {
                const res = await getAttendanceSummaryByDate(toDate, page, PAGE_SIZE);
                if (!active) return;
                const content = res?.data?.data?.content || res?.data?.content || [];
                const pages = res?.data?.data?.totalPages ?? res?.data?.totalPages ?? 1;
                setRows(Array.isArray(content) ? content : []);
                setTotalPages(Math.max(Number(pages) || 1, 1));
            } catch (error) {
                console.error('Failed to load attendance:', error);
                if (active) {
                    setRows([]);
                    setTotalPages(1);
                    toast.error(error?.response?.data?.message || 'Could not load attendance');
                }
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [toDate, page, refreshKey]);

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((row) => {
            const hit = !q || [row?.employeeName, row?.employeeCode, row?.employeeId]
                .some((v) => String(v || '').toLowerCase().includes(q));
            return hit && (statusFilter === 'ALL' || row?.status === statusFilter);
        });
    }, [rows, search, statusFilter]);

    const counts = useMemo(() => {
        const c = { total: rows.length, PRESENT: 0, HALF_DAY: 0, ON_LEAVE: 0, ABSENT: 0, onBreak: 0 };
        rows.forEach((r) => {
            if (c[r?.status] !== undefined) c[r.status] += 1;
            if (r?.onBreak) c.onBreak += 1;
        });
        return c;
    }, [rows]);

    const hasFilters = search.trim() !== '' || statusFilter !== 'ALL';

    const changeFrom = (v) => {
        if (!v) return;
        if (v > maxDate) return toast.error('Future dates are not allowed');
        setFromDate(v);
        if (toDate < v) setToDate(v);
        setPage(0);
    };

    const changeTo = (v) => {
        if (!v) return;
        if (v > maxDate) return toast.error('Future dates are not allowed');
        if (v < fromDate) return toast.error('To date cannot be before From date');
        setToDate(v);
        setPage(0);
    };

    const toggleStatus = (key) => {
        setStatusFilter((cur) => (cur === key ? 'ALL' : key));
        setPage(0);
    };

    const clearFilters = () => { setSearch(''); setStatusFilter('ALL'); setPage(0); };

    async function handleExport() {
        if (exporting) return;
        setExporting(true);
        try {
            const res = await exportAttendanceRange(fromDate, toDate, statusFilter, search);
            downloadBlob(res, `attendance_${fromDate}_to_${toDate}.xlsx`);
            toast.success('Attendance exported');
        } catch (error) {
            console.error('Attendance export failed:', error);
            toast.error(error?.response?.data?.message || 'Export failed');
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="att">
            <div className="wrap">

                {/* header */}
                <header className="head">
                    <div>
                        <h1>Attendance report</h1>
                        <p>{longDate(toDate)}</p>
                    </div>

                    <div className="head-actions">
                        <label className="date">
                            <CalendarDays size={16} />
                            <span>From</span>
                            <input type="date" value={fromDate} max={maxDate} onChange={(e) => changeFrom(e.target.value)} />
                        </label>
                        <label className="date">
                            <CalendarDays size={16} />
                            <span>To</span>
                            <input type="date" value={toDate} min={fromDate} max={maxDate} onChange={(e) => changeTo(e.target.value)} />
                        </label>
                        <button type="button" className="btn icon" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading} aria-label="Refresh">
                            {loading ? <Loader2 size={17} className="spin" /> : <RefreshCw size={17} />}
                        </button>
                        <button type="button" className="btn primary" onClick={handleExport} disabled={exporting}>
                            {exporting ? <Loader2 size={17} className="spin" /> : <Download size={17} />}
                            {exporting ? 'Exporting…' : 'Export Excel'}
                        </button>
                    </div>
                </header>

                {/* status cards (click to filter) */}
                <section className="cards" aria-label="Summary">
                    {STATUSES.map(({ key, label, cls, Icon }) => {
                        const share = counts.total ? Math.round((counts[key] / counts.total) * 100) : 0;
                        return (
                            <button key={key} type="button" className={`card ${cls} ${statusFilter === key ? 'on' : ''}`}
                                onClick={() => toggleStatus(key)} aria-pressed={statusFilter === key}>
                                <span className="card-icon"><Icon size={22} /></span>
                                <span className="card-text">
                                    <span className="card-num">{counts[key]}</span>
                                    <span className="card-label">{label}</span>
                                </span>
                                <span className="card-share">{share}%</span>
                            </button>
                        );
                    })}
                </section>

                {/* table card */}
                <section className="panel">
                    <div className="tools">
                        <div className="search">
                            <Search size={17} />
                            <input type="text" value={search} placeholder="Search by name, code or ID" aria-label="Search employees"
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
                            {search && (
                                <button type="button" className="x" aria-label="Clear search" onClick={() => setSearch('')}><X size={14} /></button>
                            )}
                        </div>

                        <div className="select">
                            <select value={statusFilter} aria-label="Status"
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                                <option value="ALL">All statuses</option>
                                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                            <ChevronDown size={16} />
                        </div>

                        {counts.onBreak > 0 && (
                            <span className="break-note"><Coffee size={14} /> {counts.onBreak} on break now</span>
                        )}

                        {hasFilters && (
                            <button type="button" className="link" onClick={clearFilters}>Clear filters</button>
                        )}
                    </div>

                    <div className="scroll">
                        <div className="table">
                            <div className="tr th">
                                <div className="sticky">Employee</div>
                                <div>Department</div>
                                <div>Status</div>
                                <div>Check in</div>
                                <div>Check out</div>
                                <div>Breaks</div>
                                <div />
                            </div>

                            {loading ? (
                                Array.from({ length: 7 }).map((_, i) => <div key={i} className="skel" />)
                            ) : filteredRows.length === 0 ? (
                                <div className="empty">
                                    <div className="empty-icon"><SearchX size={24} /></div>
                                    <h3>No records found</h3>
                                    <p>{hasFilters ? 'No employee matches this search and status.' : 'No attendance has been recorded for this date.'}</p>
                                    {hasFilters && <button type="button" className="btn" onClick={clearFilters}>Clear filters</button>}
                                </div>
                            ) : (
                                filteredRows.map((row, i) => {
                                    const meta = statusMeta(row?.status);
                                    const name = row?.employeeName || 'Unknown employee';
                                    const breaks = Array.isArray(row?.breaks) ? row.breaks : [];
                                    const hue = hueFor(row?.employeeId || name);
                                    return (
                                        <div key={`${row?.employeeId}-${i}`} className="tr row" onClick={() => setSelectedEmployeeId(row?.employeeId)}>
                                            <div className="sticky emp">
                                                <span className="avatar" style={{ '--h': hue }}>{initials(name)}</span>
                                                <span className="emp-text">
                                                    <b>{name}</b>
                                                    <small>{row?.employeeCode || `ID ${row?.employeeId}`}</small>
                                                </span>
                                            </div>
                                            <div className="dept">{row?.departmentName || row?.department || '—'}</div>
                                            <div><span className={`pill ${meta.cls}`}>{meta.label}</span></div>
                                            <div className="mono">{time5(row?.checkIn) || <span className="faint">—</span>}</div>
                                            <div className="mono">{time5(row?.checkOut) || <span className="faint">—</span>}</div>
                                            <div className="brk">
                                                {row?.onBreak ? (
                                                    <span className="live"><i />On break</span>
                                                ) : breaks.length === 0 ? (
                                                    <span className="faint">—</span>
                                                ) : (
                                                    <>
                                                        {breaks.length} {breaks.length === 1 ? 'break' : 'breaks'}
                                                        <small>{formatBreaks(breaks)}</small>
                                                    </>
                                                )}
                                            </div>
                                            <div className="end">
                                                <button type="button" className="view" aria-label={`View ${name}`}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedEmployeeId(row?.employeeId); }}>
                                                    <Eye size={16} /> View
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {!loading && totalPages > 1 && (
                        <div className="pager">
                            <span>Page <b>{page + 1}</b> of <b>{totalPages}</b></span>
                            <div className="pager-btns">
                                <button type="button" className="btn" disabled={page === 0} onClick={() => setPage((p) => Math.max(p - 1, 0))}>
                                    <ChevronLeft size={16} /> Previous
                                </button>
                                <button type="button" className="btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}>
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {selectedEmployeeId && (
                <EmployeeAttendanceModal
                    employeeId={selectedEmployeeId}
                    asOfDate={toDate}
                    onClose={() => setSelectedEmployeeId(null)}
                />
            )}

            {/* global + prefixed with .att so it is safe and reaches every element */}
            <style jsx global>{`
                .att {
                    --bg:#f4f6fb; --surface:#fff; --soft:#f8f9fd; --hover:#f6f8fe; --line:#e8ebf4; --line2:#eef0f6; --input:#e1e5f0;
                    --text:#151a30; --text2:#475069; --muted:#7b84a0; --faint:#99a1ba;
                    --primary:#2f5bea; --primary2:#2549cf; --primary-soft:#eaf0ff; --primary-line:#c9d6ff;
                    --present:#0f9d6e; --present-bg:#e4f6ee; --half:#c8700f; --half-bg:#fdf0dc;
                    --leave:#2f6fd0; --leave-bg:#e7f0fd; --absent:#cf4037; --absent-bg:#fdeae8;
                    min-height:100vh; padding:28px 40px 56px; background:var(--bg); color:var(--text);
                    font-family:'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
                    font-size:14px; line-height:1.45; font-variant-numeric:tabular-nums;
                }
                .dark .att {
                    --bg:#0a0d16; --surface:#11151f; --soft:#151a27; --hover:#171d2c; --line:#232b3c; --line2:#1b2230; --input:#2a3347;
                    --text:#f1f3f9; --text2:#c3cad9; --muted:#8e98ad; --faint:#667086;
                    --primary:#6d8dff; --primary2:#839dff; --primary-soft:rgba(109,141,255,.13); --primary-line:rgba(109,141,255,.32);
                    --present:#45c89c; --present-bg:rgba(69,200,156,.13); --half:#f0ab4d; --half-bg:rgba(240,171,77,.13);
                    --leave:#6aa7ef; --leave-bg:rgba(106,167,239,.13); --absent:#ee766e; --absent-bg:rgba(238,118,110,.13);
                }
                .att .wrap { width:min(100%,1320px); margin:0 auto; }
                .att button, .att input, .att select { font-family:inherit; }
                .att button:focus-visible, .att input:focus-visible, .att select:focus-visible { outline:2px solid var(--primary); outline-offset:2px; }
                .att .faint { color:var(--faint); }
                .att .spin { animation:att-spin .9s linear infinite; }

                /* header */
                .att .head { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:22px; }
                .att .head h1 { margin:0; font-size:28px; line-height:1.15; font-weight:800; letter-spacing:-.03em; }
                .att .head p { margin:5px 0 0; color:var(--muted); font-size:14px; }
                .att .head-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
                .att .date { display:flex; align-items:center; gap:8px; height:44px; padding:0 14px; border:1px solid var(--input); border-radius:12px; background:var(--surface); color:var(--muted); font-size:13px; font-weight:600; }
                .att .date input { border:0; outline:0; background:transparent; color:var(--text); font-size:14px; font-weight:600; color-scheme:light; }
                .dark .att .date input { color-scheme:dark; }

                .att .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:44px; padding:0 18px; border:1px solid var(--input); border-radius:12px;
                    background:var(--surface); color:var(--text2); font-size:14px; font-weight:700; cursor:pointer; transition:background .15s, border-color .15s, color .15s, transform .15s; }
                .att .btn:hover:not(:disabled) { border-color:var(--primary-line); background:var(--primary-soft); color:var(--primary); }
                .att .btn:active:not(:disabled) { transform:translateY(1px); }
                .att .btn:disabled { opacity:.5; cursor:not-allowed; }
                .att .btn.icon { width:44px; padding:0; }
                .att .btn.primary { background:var(--primary); border-color:var(--primary); color:#fff; }
                .dark .att .btn.primary { color:#0a0d16; }
                .att .btn.primary:hover:not(:disabled) { background:var(--primary2); border-color:var(--primary2); color:#fff; }
                .dark .att .btn.primary:hover:not(:disabled) { color:#0a0d16; }

                /* status cards */
                .att .cards { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; margin-bottom:20px; }
                .att .card { position:relative; display:flex; align-items:center; gap:14px; padding:20px; text-align:left; border:1px solid var(--line); border-radius:16px;
                    background:var(--surface); color:var(--text); cursor:pointer; transition:transform .18s, border-color .18s, box-shadow .18s; }
                .att .card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(21,26,48,.07); }
                .att .card.on { border-color:var(--primary); box-shadow:0 0 0 3px var(--primary-soft); }
                .att .card-icon { width:48px; height:48px; flex:0 0 auto; display:grid; place-items:center; border-radius:14px; }
                .att .card-text { display:flex; flex-direction:column; }
                .att .card-num { font-size:30px; line-height:1; font-weight:800; letter-spacing:-.03em; }
                .att .card-label { margin-top:6px; font-size:13.5px; color:var(--muted); font-weight:600; }
                .att .card-share { margin-left:auto; align-self:flex-start; font-size:12.5px; font-weight:700; color:var(--faint); }
                .att .card.present .card-icon { background:var(--present-bg); color:var(--present); }
                .att .card.half .card-icon { background:var(--half-bg); color:var(--half); }
                .att .card.leave .card-icon { background:var(--leave-bg); color:var(--leave); }
                .att .card.absent .card-icon { background:var(--absent-bg); color:var(--absent); }

                /* panel + toolbar */
                .att .panel { background:var(--surface); border:1px solid var(--line); border-radius:18px; overflow:hidden; }
                .att .tools { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:16px 18px; border-bottom:1px solid var(--line2); }
                .att .search { position:relative; flex:1 1 300px; min-width:220px; }
                .att .search svg { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--faint); pointer-events:none; }
                .att .search input { width:100%; height:44px; padding:0 40px 0 42px; border:1px solid var(--input); border-radius:11px; background:var(--soft); color:var(--text); font-size:14px; }
                .att .search input::placeholder { color:var(--faint); }
                .att .search input:focus { border-color:var(--primary); background:var(--surface); }
                .att .x { position:absolute; right:8px; top:50%; transform:translateY(-50%); width:26px; height:26px; display:grid; place-items:center; border:0; border-radius:7px; background:transparent; color:var(--muted); cursor:pointer; }
                .att .x:hover { background:var(--line2); }
                .att .select { position:relative; }
                .att .select select { appearance:none; height:44px; padding:0 40px 0 16px; border:1px solid var(--input); border-radius:11px; background:var(--surface); color:var(--text); font-size:14px; font-weight:600; cursor:pointer; }
                .att .select select:focus { border-color:var(--primary); }
                .att .select svg { position:absolute; right:13px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; }
                .att .break-note { display:inline-flex; align-items:center; gap:6px; height:34px; padding:0 12px; border-radius:99px; background:var(--half-bg); color:var(--half); font-size:13px; font-weight:700; }
                .att .link { border:0; background:transparent; color:var(--primary); font-size:13.5px; font-weight:700; cursor:pointer; padding:8px; }
                .att .link:hover { text-decoration:underline; }

                /* table */
                .att .scroll { overflow-x:auto; }
                .att .table { min-width:980px; }
                .att .tr { display:grid; grid-template-columns:minmax(250px,2fr) minmax(130px,1fr) 130px 100px 100px minmax(140px,1.1fr) 100px; align-items:center; gap:14px; padding:0 22px; }
                .att .th { min-height:46px; background:var(--soft); border-bottom:1px solid var(--line2); color:var(--muted); font-size:13px; font-weight:600; }
                .att .row { min-height:72px; border-bottom:1px solid var(--line2); cursor:pointer; color:var(--text2); transition:background .12s; }
                .att .row:last-child { border-bottom:0; }
                .att .row:hover, .att .row:hover .sticky { background:var(--hover); }
                .att .sticky { position:sticky; left:0; z-index:2; align-self:stretch; display:flex; align-items:center; margin-left:-22px; padding-left:22px; background:var(--surface); }
                .att .th .sticky { background:var(--soft); }

                .att .emp { gap:13px; min-width:0; }
                .att .avatar { width:40px; height:40px; flex:0 0 auto; display:grid; place-items:center; border-radius:50%; font-size:13px; font-weight:800;
                    background:hsl(var(--h) 80% 93%); color:hsl(var(--h) 55% 33%); }
                .dark .att .avatar { background:hsl(var(--h) 35% 21%); color:hsl(var(--h) 75% 80%); }
                .att .emp-text { min-width:0; display:flex; flex-direction:column; }
                .att .emp-text b { color:var(--text); font-size:15px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
                .att .emp-text small, .att .brk small { font-size:13px; color:var(--faint); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
                .att .dept { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
                .att .mono { font-weight:650; color:var(--text); }
                .att .brk { display:flex; flex-direction:column; min-width:0; }

                .att .pill { display:inline-flex; align-items:center; height:29px; padding:0 13px; border-radius:99px; font-size:13px; font-weight:700; white-space:nowrap; }
                .att .pill.present { background:var(--present-bg); color:var(--present); }
                .att .pill.half { background:var(--half-bg); color:var(--half); }
                .att .pill.leave { background:var(--leave-bg); color:var(--leave); }
                .att .pill.absent { background:var(--absent-bg); color:var(--absent); }
                .att .pill.unknown { background:var(--line2); color:var(--muted); }
                .att .live { display:inline-flex; align-items:center; gap:7px; width:fit-content; padding:4px 11px; border-radius:99px; background:var(--half-bg); color:var(--half); font-size:13px; font-weight:700; }
                .att .live i { width:7px; height:7px; border-radius:50%; background:currentColor; animation:att-pulse 1.6s infinite; }
                .att .end { text-align:right; }
                .att .view { display:inline-flex; align-items:center; gap:6px; height:36px; padding:0 13px; border:1px solid var(--input); border-radius:10px; background:var(--surface); color:var(--text2); font-size:13px; font-weight:700; cursor:pointer; transition:all .15s; }
                .att .view:hover { border-color:var(--primary-line); background:var(--primary-soft); color:var(--primary); }

                /* states */
                .att .skel { height:72px; border-bottom:1px solid var(--line2); background:linear-gradient(90deg,transparent,var(--hover),transparent); background-size:200% 100%; animation:att-shimmer 1.4s infinite; }
                .att .empty { display:flex; flex-direction:column; align-items:center; gap:6px; padding:68px 24px; text-align:center; color:var(--muted); }
                .att .empty-icon { width:56px; height:56px; display:grid; place-items:center; border-radius:16px; background:var(--primary-soft); color:var(--primary); margin-bottom:8px; }
                .att .empty h3 { margin:0; font-size:18px; color:var(--text); }
                .att .empty p { margin:0 0 12px; }
                .att .pager { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 22px; border-top:1px solid var(--line2); color:var(--muted); }
                .att .pager b { color:var(--text); }
                .att .pager-btns { display:flex; gap:8px; }
                .att .pager .btn { height:38px; padding:0 14px; font-size:13px; }

                @keyframes att-spin { to { transform:rotate(360deg); } }
                @keyframes att-shimmer { from { background-position:200% 0; } to { background-position:-200% 0; } }
                @keyframes att-pulse { 50% { opacity:.35; } }
                @media (prefers-reduced-motion: reduce) { .att .spin, .att .skel, .att .live i { animation:none; } .att .card { transition:none; } }

                @media (max-width:1100px) { .att .cards { grid-template-columns:repeat(2,minmax(0,1fr)); } }
                @media (max-width:700px) {
                    .att { padding:18px 14px 40px; }
                    .att .head h1 { font-size:24px; }
                    .att .head-actions { width:100%; }
                    .att .date { flex:1; } .att .date input { min-width:0; width:100%; }
                    .att .btn.primary { flex:1; }
                    .att .cards { gap:10px; }
                    .att .card { padding:14px; gap:10px; } .att .card-icon { width:40px; height:40px; } .att .card-num { font-size:24px; } .att .card-share { display:none; }
                    .att .pager { flex-direction:column; }
                }
            `}</style>
        </div>
    );
}