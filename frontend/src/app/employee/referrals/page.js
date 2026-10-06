"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
    Users,
    Search,
    RefreshCw,
    Mail,
    Phone,
    BriefcaseBusiness,
    FileText,
    Clock3,
    CheckCircle2,
    XCircle,
    UserRound,
    ExternalLink,
    Loader2,
} from "lucide-react";

/* ============================================================
   CSS
============================================================ */

const referralsCSS = `
.rf-root { width: 100%; max-width: 1100px; margin: 0 auto; min-width: 0; color: var(--text-primary); }
.rf-root *, .rf-root *::before, .rf-root *::after { box-sizing: border-box; }

/* ---------- header ---------- */
.rf-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
.rf-crumb { font-size: 12px; font-weight: 500; color: var(--text-muted, var(--text-secondary)); margin-bottom: 6px; }
.rf-title { font-size: 26px; font-weight: 800; margin: 0 0 4px; letter-spacing: -.2px; }
.rf-subtitle { font-size: 14px; color: var(--text-secondary); margin: 0; }
.rf-refresh {
  width: 42px; height: 42px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  border-radius: 12px; border: 1px solid var(--card-border); background: var(--card-bg); color: var(--text-secondary); cursor: pointer;
  transition: color .2s, border-color .2s;
}
.rf-refresh:hover { color: #3b82f6; border-color: #3b82f6; }
.rf-refresh:disabled { cursor: wait; }

/* ---------- summary ---------- */
.rf-summary { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; margin-bottom: 20px; }
.rf-sum { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 16px 18px; border-radius: 16px; background: var(--card-bg); border: 1px solid var(--card-border); box-shadow: var(--card-shadow); min-width: 0; }
.rf-sum-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.rf-sum-value { font-size: 26px; font-weight: 800; line-height: 1.1; margin-top: 6px; }
.rf-sum-icon { width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }

/* ---------- filters ---------- */
.rf-filters { display: flex; gap: 12px; align-items: center; margin-bottom: 22px; padding: 12px; border-radius: 16px; background: var(--card-bg); border: 1px solid var(--card-border); }
.rf-search { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 12px; border-radius: 12px; background: var(--bg-primary); border: 1px solid var(--card-border); }
.rf-search:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.18); }
.rf-search input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: var(--text-primary); font-size: 14px; font-family: inherit; }
.rf-search input::placeholder { color: var(--text-secondary); }
.rf-clear { display: flex; border: none; background: none; color: var(--text-secondary); cursor: pointer; padding: 4px; }
.rf-chips { display: flex; gap: 8px; flex-shrink: 0; }
.rf-chip {
  display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 14px; border-radius: 999px; white-space: nowrap;
  border: 1px solid var(--card-border); background: var(--bg-primary); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
}
.rf-chip b { font-size: 11px; padding: 1px 7px; border-radius: 999px; background: rgba(148,163,184,.2); font-weight: 700; }
.rf-chip.active { background: rgba(59,130,246,.12); border-color: rgba(59,130,246,.45); color: #2563eb; }
.rf-chip.active b { background: rgba(59,130,246,.22); }
html.dark .rf-chip.active { color: #60a5fa; }

/* ---------- list header ---------- */
.rf-list-head { margin-bottom: 14px; }
.rf-list-title { font-size: 18px; font-weight: 700; margin: 0; }
.rf-list-sub { font-size: 12px; color: var(--text-secondary); margin-top: 3px; }

/* ---------- card ---------- */
.rf-list { display: flex; flex-direction: column; gap: 16px; }
.rf-card { padding: 22px; border-radius: 18px; background: var(--card-bg); border: 1px solid var(--card-border); box-shadow: var(--card-shadow); min-width: 0; transition: border-color .2s, transform .2s; }
.rf-card:hover { border-color: rgba(59,130,246,.4); transform: translateY(-1px); }
.rf-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
.rf-who { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
.rf-avatar { width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(59,130,246,.12); color: #3b82f6; }
.rf-name { font-size: 17px; font-weight: 700; margin: 0; word-break: break-word; }
.rf-job { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 13px; color: var(--text-secondary); }
.rf-job span { min-width: 0; word-break: break-word; }

.rf-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1px solid; white-space: nowrap; flex-shrink: 0; }
.rf-pill.pending  { background: rgba(245,158,11,.12); color: #b45309; border-color: rgba(245,158,11,.35); }
.rf-pill.approved { background: rgba(16,185,129,.12); color: #047857; border-color: rgba(16,185,129,.35); }
.rf-pill.rejected { background: rgba(239,68,68,.12);  color: #b91c1c; border-color: rgba(239,68,68,.35); }
html.dark .rf-pill.pending  { color: #fbbf24; }
html.dark .rf-pill.approved { color: #34d399; }
html.dark .rf-pill.rejected { color: #f87171; }

.rf-details { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--card-border); }
.rf-detail { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
.rf-detail svg { margin-top: 2px; color: var(--text-secondary); flex-shrink: 0; }
.rf-detail-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); }
.rf-detail-value { font-size: 13.5px; font-weight: 600; margin-top: 3px; word-break: break-all; }
.rf-detail-value.soft { word-break: normal; }

.rf-resume {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; margin-top: 18px; min-height: 42px; padding: 0 16px;
  border-radius: 10px; border: 1px solid rgba(59,130,246,.4); background: rgba(59,130,246,.08); color: #2563eb; font-size: 13px; font-weight: 700; cursor: pointer;
}
.rf-resume:disabled { opacity: .7; cursor: wait; }
html.dark .rf-resume { color: #60a5fa; }

.rf-msg { display: flex; align-items: center; gap: 10px; margin-top: 16px; padding: 12px 14px; border-radius: 12px; font-size: 13px; font-weight: 600; border: 1px solid; }
.rf-msg svg { flex-shrink: 0; }
.rf-msg.pending  { background: rgba(245,158,11,.09); color: #b45309; border-color: rgba(245,158,11,.28); }
.rf-msg.approved { background: rgba(16,185,129,.09); color: #047857; border-color: rgba(16,185,129,.28); }
.rf-msg.rejected { background: rgba(239,68,68,.09);  color: #b91c1c; border-color: rgba(239,68,68,.28); }
html.dark .rf-msg.pending  { color: #fbbf24; }
html.dark .rf-msg.approved { color: #34d399; }
html.dark .rf-msg.rejected { color: #f87171; }

/* ---------- empty / loading ---------- */
.rf-empty { padding: 56px 20px; text-align: center; border-radius: 18px; background: var(--card-bg); border: 1px solid var(--card-border); box-shadow: var(--card-shadow); }
.rf-empty-icon { width: 56px; height: 56px; border-radius: 16px; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; background: rgba(148,163,184,.15); color: var(--text-secondary); }
.rf-empty h3 { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
.rf-empty p { font-size: 13px; color: var(--text-secondary); margin: 0; }
.rf-empty button { margin-top: 14px; border: none; background: none; color: #3b82f6; font-size: 14px; font-weight: 700; cursor: pointer; }
.rf-loading { padding: 80px 20px; text-align: center; color: var(--text-secondary); font-size: 14px; }

/* =========================================================
   TABLET (<= 900px)
   ========================================================= */
@media (max-width: 900px) {
  .rf-summary { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .rf-filters { flex-direction: column; align-items: stretch; }
  .rf-chips { overflow-x: auto; scrollbar-width: none; margin: 0 -2px; padding: 0 2px; -webkit-overflow-scrolling: touch; }
  .rf-chips::-webkit-scrollbar { display: none; }
  .rf-details { grid-template-columns: repeat(2, minmax(0,1fr)); }
}

/* =========================================================
   PHONE (<= 600px)
   ========================================================= */
@media (max-width: 600px) {
  .rf-head { margin-bottom: 16px; }
  .rf-title { font-size: 21px; }
  .rf-subtitle { font-size: 13px; }

  .rf-summary { gap: 10px; margin-bottom: 14px; }
  .rf-sum { padding: 12px 14px; border-radius: 14px; }
  .rf-sum-value { font-size: 22px; margin-top: 4px; }
  .rf-sum-icon { width: 36px; height: 36px; border-radius: 10px; }

  .rf-filters { padding: 10px; gap: 10px; margin-bottom: 16px; border-radius: 14px; }
  .rf-search input { font-size: 16px; } /* stops iOS zoom on focus */

  .rf-card { padding: 16px; border-radius: 16px; }
  .rf-top { flex-direction: column; gap: 12px; }
  .rf-avatar { width: 42px; height: 42px; border-radius: 12px; }
  .rf-name { font-size: 16px; }

  .rf-details { grid-template-columns: minmax(0,1fr); gap: 12px; margin-top: 14px; padding-top: 14px; }
  .rf-detail { padding: 10px 12px; border-radius: 12px; background: var(--bg-primary); align-items: center; }
  .rf-detail svg { margin-top: 0; }

  .rf-resume { width: 100%; }
  .rf-msg { font-size: 12.5px; padding: 11px 12px; }
}
`;

/* ============================================================
   STATUS HELPERS
============================================================ */

const STATUS = {
    APPLIED: { cls: "pending", text: "Pending", icon: Clock3, msg: "Your referral is waiting for HR review." },
    SHORTLISTED: { cls: "approved", text: "Approved", icon: CheckCircle2, msg: "HR has approved this candidate." },
    REJECTED: { cls: "rejected", text: "Rejected", icon: XCircle, msg: "HR has rejected this candidate." },
};

const getStatus = (status) => STATUS[status] || { ...STATUS.APPLIED, text: status || "Pending" };

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/* ============================================================
   PAGE
============================================================ */

export default function MyReferrals() {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [openingId, setOpeningId] = useState(null);

    /* ---------- view resume ---------- */

    const handleViewResume = async (referral) => {
        // Open the tab synchronously so mobile browsers don't block it as a popup
        const win = window.open("", "_blank");

        setOpeningId(referral.id);

        try {
            const resumeUrl = referral.resumeUrl;
            const url = resumeUrl.startsWith("http") ? new URL(resumeUrl).pathname : resumeUrl;

            const res = await api.get(url, { responseType: "blob" });
            const contentType = res.headers["content-type"] || "application/pdf";
            const blob = new Blob([res.data], { type: contentType });
            const blobUrl = window.URL.createObjectURL(blob);

            if (win) {
                win.location.href = blobUrl;
            } else {
                window.location.href = blobUrl;
            }

            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
        } catch (err) {
            console.error(err);
            if (win) win.close();
            toast.error("Failed to open resume");
        } finally {
            setOpeningId(null);
        }
    };

    /* ---------- fetch ---------- */

    const fetchMyReferrals = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const res = await api.get("/api/recruitment/my-referrals");
            setReferrals(res.data?.data?.content || res.data?.data || []);
        } catch (error) {
            console.error("Error fetching referrals:", error);
            setReferrals([]);
            toast.error("Failed to load referrals");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMyReferrals();
    }, []);

    /* ---------- filter ---------- */

    const filteredReferrals = useMemo(() => {
        const value = search.trim().toLowerCase();

        return referrals.filter((r) => {
            const matchesSearch =
                !value ||
                [r?.candidateName, r?.candidateEmail, r?.candidatePhone, r?.jobTitle].some((f) =>
                    String(f || "").toLowerCase().includes(value)
                );

            const matchesStatus = statusFilter === "ALL" || r?.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [referrals, search, statusFilter]);

    /* ---------- counts ---------- */

    const pendingCount = referrals.filter((i) => i?.status === "APPLIED").length;
    const approvedCount = referrals.filter((i) => i?.status === "SHORTLISTED").length;
    const rejectedCount = referrals.filter((i) => i?.status === "REJECTED").length;

    const SUMMARY = [
        { label: "Total Referrals", value: referrals.length, icon: Users, color: "#3b82f6" },
        { label: "Pending", value: pendingCount, icon: Clock3, color: "#f59e0b" },
        { label: "Approved", value: approvedCount, icon: CheckCircle2, color: "#10b981" },
        { label: "Rejected", value: rejectedCount, icon: XCircle, color: "#ef4444" },
    ];

    const CHIPS = [
        { key: "ALL", label: "All", count: referrals.length },
        { key: "APPLIED", label: "Pending", count: pendingCount },
        { key: "SHORTLISTED", label: "Approved", count: approvedCount },
        { key: "REJECTED", label: "Rejected", count: rejectedCount },
    ];

    /* ---------- render ---------- */

    if (loading) {
        return (
            <div className="rf-root">
                <style dangerouslySetInnerHTML={{ __html: referralsCSS }} />
                <div className="rf-loading">
                    <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "#3b82f6" }} />
                    Loading referrals...
                </div>
            </div>
        );
    }

    return (
        <div className="rf-root">
            <style dangerouslySetInnerHTML={{ __html: referralsCSS }} />

            {/* Header */}
            <div className="rf-head">
                <div>
                    <div className="rf-crumb">Employee Portal / My Referrals</div>
                    <h1 className="rf-title">My Referrals</h1>
                    <p className="rf-subtitle">
                        Track candidates you have referred and monitor their application status.
                    </p>
                </div>

                <button
                    type="button"
                    className="rf-refresh"
                    onClick={() => fetchMyReferrals(true)}
                    disabled={refreshing}
                    title="Refresh referrals"
                    aria-label="Refresh referrals"
                >
                    <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Summary */}
            <div className="rf-summary">
                {SUMMARY.map((s) => {
                    const Icon = s.icon;

                    return (
                        <div key={s.label} className="rf-sum">
                            <div style={{ minWidth: 0 }}>
                                <div className="rf-sum-label">{s.label}</div>
                                <div className="rf-sum-value">{s.value}</div>
                            </div>

                            <div className="rf-sum-icon" style={{ background: s.color + "1f", color: s.color }}>
                                <Icon size={19} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Search + filter */}
            <div className="rf-filters">
                <div className="rf-search">
                    <Search size={18} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search candidate, email, phone or job..."
                    />

                    {search && (
                        <button type="button" className="rf-clear" onClick={() => setSearch("")} aria-label="Clear search">
                            <XCircle size={17} />
                        </button>
                    )}
                </div>

                <div className="rf-chips">
                    {CHIPS.map((c) => (
                        <button
                            key={c.key}
                            type="button"
                            className={"rf-chip" + (statusFilter === c.key ? " active" : "")}
                            onClick={() => setStatusFilter(c.key)}
                        >
                            {c.label}
                            <b>{c.count}</b>
                        </button>
                    ))}
                </div>
            </div>

            {/* List header */}
            <div className="rf-list-head">
                <h2 className="rf-list-title">Referral History</h2>
                <div className="rf-list-sub">
                    Showing {filteredReferrals.length} of {plural(referrals.length, "referral")}
                </div>
            </div>

            {/* List */}
            {filteredReferrals.length === 0 ? (
                <div className="rf-empty">
                    <div className="rf-empty-icon">
                        <Users size={24} />
                    </div>

                    <h3>{referrals.length === 0 ? "No referrals yet" : "No referrals found"}</h3>

                    <p>
                        {referrals.length === 0
                            ? "Candidates you refer will appear here."
                            : "Try adjusting your search or status filter."}
                    </p>

                    {(search || statusFilter !== "ALL") && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setStatusFilter("ALL");
                            }}
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="rf-list">
                    {filteredReferrals.map((referral) => {
                        const st = getStatus(referral.status);
                        const StatusIcon = st.icon;
                        const years = referral.experienceYears ?? 0;
                        const months = referral.experienceMonths ?? 0;

                        return (
                            <div key={referral.id} className="rf-card">
                                {/* Top */}
                                <div className="rf-top">
                                    <div className="rf-who">
                                        <div className="rf-avatar">
                                            <UserRound size={21} />
                                        </div>

                                        <div style={{ minWidth: 0 }}>
                                            <h3 className="rf-name">{referral.candidateName}</h3>

                                            <div className="rf-job">
                                                <BriefcaseBusiness size={14} style={{ flexShrink: 0 }} />
                                                <span>{referral.jobTitle || "Job not specified"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <span className={"rf-pill " + st.cls}>
                                        <StatusIcon size={14} />
                                        {st.text}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="rf-details">
                                    <div className="rf-detail">
                                        <Mail size={17} />
                                        <div style={{ minWidth: 0 }}>
                                            <div className="rf-detail-label">Email</div>
                                            <div className="rf-detail-value">{referral.candidateEmail || "—"}</div>
                                        </div>
                                    </div>

                                    <div className="rf-detail">
                                        <Phone size={17} />
                                        <div style={{ minWidth: 0 }}>
                                            <div className="rf-detail-label">Phone</div>
                                            <div className="rf-detail-value soft">{referral.candidatePhone || "—"}</div>
                                        </div>
                                    </div>

                                    <div className="rf-detail">
                                        <BriefcaseBusiness size={17} />
                                        <div style={{ minWidth: 0 }}>
                                            <div className="rf-detail-label">Experience</div>
                                            <div className="rf-detail-value soft">
                                                {plural(years, "year")} {plural(months, "month")}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resume */}
                                {referral.resumeUrl && (
                                    <button
                                        type="button"
                                        className="rf-resume"
                                        onClick={() => handleViewResume(referral)}
                                        disabled={openingId === referral.id}
                                    >
                                        {openingId === referral.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <FileText size={16} />
                                        )}
                                        View Resume
                                        <ExternalLink size={14} />
                                    </button>
                                )}

                                {/* Status message */}
                                {STATUS[referral.status] && (
                                    <div className={"rf-msg " + st.cls}>
                                        <StatusIcon size={16} />
                                        <span>{st.msg}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}