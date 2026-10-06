'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  MessageSquare,
  FileText,
  Loader2,
  Check,
  CheckCircle,
  MessageCircle,
  Star,
  Dumbbell,
  Target,
  Award,
  ClipboardCheck,
  Clock3,
  BarChart3,
} from 'lucide-react';

/* ============================================================
   CSS
============================================================ */

const perfCSS = `
.pf-root { width: 100%; max-width: 1100px; margin: 0 auto; min-width: 0; color: var(--text-primary); }
.pf-root *, .pf-root *::before, .pf-root *::after { box-sizing: border-box; }

/* ---------- page header ---------- */
.pf-head { margin-bottom: 22px; }
.pf-title { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 26px; font-weight: 800; margin: 0 0 6px; }
.pf-pending-pill { background: #f59e0b; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; }
.pf-subtitle { font-size: 14px; color: var(--text-secondary); margin: 0; }

/* ---------- summary ---------- */
.pf-summary { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; margin-bottom: 24px; }
.pf-sum {
  position: relative; overflow: hidden; display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; border-radius: 16px; background: var(--card-bg);
  border: 1px solid var(--card-border); box-shadow: var(--card-shadow); min-width: 0;
}
.pf-sum-icon { width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.pf-sum-value { font-size: 22px; font-weight: 800; line-height: 1.1; }
.pf-sum-label { font-size: 12px; color: var(--text-secondary); margin-top: 3px; }

/* ---------- review card ---------- */
.pf-list { display: flex; flex-direction: column; gap: 22px; }
.pf-card {
  background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 20px;
  box-shadow: var(--card-shadow); overflow: hidden; min-width: 0; transition: box-shadow .3s;
}
.pf-card.st-ACKNOWLEDGED { border-color: rgba(16,185,129,.35); }
.pf-card.st-SUBMITTED   { border-color: rgba(59,130,246,.35); }
.pf-card.highlight { box-shadow: 0 0 0 4px rgba(99,102,241,.28); }

.pf-card-head {
  display: flex; align-items: center; justify-content: space-between; gap: 20px;
  padding: 20px 24px; border-bottom: 1px solid var(--card-border);
  background: linear-gradient(135deg, rgba(100,116,139,.07), transparent);
}
.pf-card.st-ACKNOWLEDGED .pf-card-head { background: linear-gradient(135deg, rgba(16,185,129,.10), transparent); }
.pf-card.st-SUBMITTED   .pf-card-head { background: linear-gradient(135deg, rgba(59,130,246,.10), transparent); }
.pf-period { font-size: 19px; font-weight: 800; margin: 0 0 4px; }
.pf-meta { font-size: 13px; color: var(--text-secondary); }
.pf-meta strong { color: var(--text-primary); font-weight: 600; }

.pf-score { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
.pf-score-text { text-align: right; }
.pf-score-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--text-muted, var(--text-secondary)); margin-bottom: 4px; }
.pf-stars { display: flex; gap: 2px; justify-content: flex-end; }

.pf-badge { display: inline-block; margin-top: 8px; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: .3px; white-space: nowrap; border: 1px solid transparent; }
.pf-badge.DRAFT        { background: rgba(100,116,139,.14); color: var(--text-secondary); border-color: rgba(100,116,139,.3); }
.pf-badge.SUBMITTED    { background: rgba(59,130,246,.12);  color: #3b82f6; border-color: rgba(59,130,246,.3); }
.pf-badge.ACKNOWLEDGED { background: rgba(16,185,129,.12);  color: #10b981; border-color: rgba(16,185,129,.3); }
.pf-badge.IN_PROGRESS  { background: rgba(245,158,11,.14);  color: #d97706; border-color: rgba(245,158,11,.3); }
html.dark .pf-badge.IN_PROGRESS { color: #fbbf24; }

.pf-body { padding: 24px; display: flex; flex-direction: column; gap: 22px; }

/* ---------- skill ratings ---------- */
.pf-section-title { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 12px; }
.pf-skills { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 12px; }
.pf-skill { background: var(--bg-primary); border: 1px solid var(--card-border); border-radius: 14px; padding: 14px 12px; text-align: center; }
.pf-skill-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
.pf-skill-value { font-size: 26px; font-weight: 900; line-height: 1; margin-bottom: 10px; }
.pf-skill-value small { font-size: 12px; font-weight: 600; color: var(--text-muted, var(--text-secondary)); }
.pf-bar { height: 6px; border-radius: 999px; background: var(--card-border); overflow: hidden; }
.pf-bar > span { display: block; height: 100%; border-radius: 999px; transition: width .4s ease; }

/* ---------- feedback ---------- */
.pf-feedback { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }
.pf-fb { border-radius: 14px; padding: 16px; border: 1px solid; }
.pf-fb-title { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.pf-fb p { font-size: 13px; line-height: 1.65; margin: 0; color: var(--text-primary); white-space: pre-wrap; word-break: break-word; }
.pf-fb.green { background: rgba(16,185,129,.07); border-color: rgba(16,185,129,.28); } .pf-fb.green .pf-fb-title { color: #059669; }
.pf-fb.amber { background: rgba(245,158,11,.07); border-color: rgba(245,158,11,.30); } .pf-fb.amber .pf-fb-title { color: #d97706; }
.pf-fb.blue  { background: rgba(59,130,246,.07); border-color: rgba(59,130,246,.28); } .pf-fb.blue .pf-fb-title  { color: #2563eb; }
html.dark .pf-fb.green .pf-fb-title { color: #34d399; }
html.dark .pf-fb.amber .pf-fb-title { color: #fbbf24; }
html.dark .pf-fb.blue  .pf-fb-title { color: #60a5fa; }

/* ---------- comments + acknowledge ---------- */
.pf-comment { border-radius: 14px; padding: 16px; background: rgba(99,102,241,.07); border: 1px solid rgba(99,102,241,.28); }
.pf-comment .pf-fb-title { color: var(--primary); }
.pf-comment p { font-size: 13px; line-height: 1.65; margin: 0; white-space: pre-wrap; word-break: break-word; }

.pf-ack { border-radius: 16px; padding: 18px; background: rgba(59,130,246,.07); border: 1px solid rgba(59,130,246,.3); display: flex; flex-direction: column; gap: 14px; }
.pf-ack-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; margin: 0 0 3px; }
.pf-ack-sub { font-size: 12px; color: var(--text-secondary); margin: 0; }
.pf-textarea { width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--card-border); background: var(--card-bg); color: var(--text-primary); font-size: 13px; font-family: inherit; line-height: 1.6; resize: vertical; outline: none; transition: border-color .2s, box-shadow .2s; }
.pf-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.2); }
.pf-textarea::placeholder { color: var(--text-secondary); }
.pf-btns { display: flex; gap: 10px; }
.pf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; padding: 11px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1px solid transparent; transition: opacity .2s, transform .1s; }
.pf-btn:active { transform: scale(.98); }
.pf-btn:disabled { opacity: .55; cursor: not-allowed; }
.pf-btn.primary { background: var(--primary); color: #fff; box-shadow: 0 4px 12px rgba(99,102,241,.3); }
.pf-btn.ghost { background: var(--card-bg); color: var(--text-primary); border-color: var(--card-border); }
.pf-btns .pf-btn.primary { flex: 1; }

.pf-done { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: 14px; background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.3); color: #059669; font-size: 13px; font-weight: 600; }
html.dark .pf-done { color: #34d399; }

/* ---------- empty / loading ---------- */
.pf-empty { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 20px; padding: 64px 20px; text-align: center; box-shadow: var(--card-shadow); }
.pf-empty-icon { width: 64px; height: 64px; border-radius: 20px; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; background: rgba(245,158,11,.12); color: #f59e0b; }
.pf-empty h3 { font-size: 17px; font-weight: 700; margin: 0 0 6px; }
.pf-empty p { font-size: 13px; color: var(--text-secondary); margin: 0; }
.pf-loading { padding: 64px 20px; text-align: center; font-size: 14px; color: var(--text-secondary); }

/* =========================================================
   TABLET (<= 1024px)
   ========================================================= */
@media (max-width: 1024px) {
  .pf-summary { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .pf-skills  { grid-template-columns: repeat(3, minmax(0,1fr)); }
  .pf-feedback { grid-template-columns: minmax(0,1fr); }
}

/* =========================================================
   PHONE (<= 640px)
   ========================================================= */
@media (max-width: 640px) {
  .pf-title { font-size: 21px; }
  .pf-subtitle { font-size: 13px; }
  .pf-head { margin-bottom: 16px; }

  .pf-summary { gap: 10px; margin-bottom: 18px; }
  .pf-sum { padding: 12px; gap: 10px; }
  .pf-sum-icon { width: 36px; height: 36px; border-radius: 10px; }
  .pf-sum-value { font-size: 19px; }
  .pf-sum-label { font-size: 11px; }

  .pf-list { gap: 16px; }
  .pf-card { border-radius: 16px; }

  .pf-card-head { flex-direction: column; align-items: stretch; gap: 14px; padding: 16px; }
  .pf-period { font-size: 17px; }
  .pf-score { justify-content: space-between; padding-top: 14px; border-top: 1px dashed var(--card-border); }
  .pf-score-text { text-align: left; order: 2; flex: 1; }
  .pf-stars { justify-content: flex-start; }
  .pf-score-badge { order: 3; }

  .pf-body { padding: 16px; gap: 18px; }

  /* skills become compact rows */
  .pf-skills { grid-template-columns: minmax(0,1fr); gap: 8px; }
  .pf-skill { display: grid; grid-template-columns: 104px minmax(0,1fr) 38px; align-items: center; gap: 10px; text-align: left; padding: 11px 14px; }
  .pf-skill-label { margin: 0; font-size: 12.5px; }
  .pf-skill-value { margin: 0; order: 3; font-size: 18px; text-align: right; }
  .pf-skill-value small { display: none; }
  .pf-skill .pf-bar { order: 2; }

  .pf-ack { padding: 14px; }
  .pf-btns { flex-direction: column-reverse; }
  .pf-btn { width: 100%; }
  .pf-textarea { font-size: 16px; } /* prevents iOS zoom on focus */
}

@media (max-width: 380px) {
  .pf-skill { grid-template-columns: 90px minmax(0,1fr) 34px; }
}
`;

/* ============================================================
   HELPERS
============================================================ */

const num = (v) => Math.max(0, Math.min(5, Number(v) || 0));

const SKILLS = [
  { key: 'technicalSkills', label: 'Technical', color: '#3b82f6' },
  { key: 'communication', label: 'Communication', color: '#8b5cf6' },
  { key: 'teamwork', label: 'Teamwork', color: '#16a34a' },
  { key: 'productivity', label: 'Productivity', color: '#f59e0b' },
  { key: 'leadership', label: 'Leadership', color: '#ec4899' },
];

function ScoreRing({ value }) {
  const size = 64;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (num(value) / 5) * circumference;

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--card-border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 17,
          fontWeight: 900,
        }}
      >
        {num(value).toFixed(1)}
      </div>
    </div>
  );
}

function Stars({ value, size = 16 }) {
  const rounded = Math.round(num(value));

  return (
    <div className="pf-stars" aria-label={`${num(value)} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          strokeWidth={1.5}
          fill={s <= rounded ? '#fbbf24' : 'none'}
          color={s <= rounded ? '#fbbf24' : 'var(--card-border)'}
        />
      ))}
    </div>
  );
}

function SummaryTile({ icon: Icon, color, value, label }) {
  return (
    <div className="pf-sum">
      <div className="pf-sum-icon" style={{ background: color + '1f', color }}>
        <Icon size={20} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="pf-sum-value">{value}</div>
        <div className="pf-sum-label">{label}</div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN CONTENT
============================================================ */

function PerformanceContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [acknowledging, setAcknowledging] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/api/performance/my');
      setReviews(res.data?.data?.content || []);
    } catch {
      toast.error('Failed to load performance reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Scroll the highlighted review into view once it's loaded
  useEffect(() => {
    if (!highlightId || loading) return;
    const el = document.getElementById(`review-${highlightId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId, loading, reviews]);

  const handleAcknowledge = async (reviewId) => {
    if (!comment.trim()) {
      toast.error('Please add your comments before acknowledging');
      return;
    }

    setAcknowledging(true);

    try {
      await api.put(`/api/performance/${reviewId}/acknowledge`, {
        employeeComments: comment,
      });
      toast.success('Review acknowledged successfully!');
      setComment('');
      setSelected(null);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to acknowledge');
    } finally {
      setAcknowledging(false);
    }
  };

  /* ---------- derived ---------- */

  const pendingCount = reviews.filter((r) => r.status !== 'ACKNOWLEDGED').length;
  const rated = reviews.filter((r) => Number(r.overallRating) > 0);
  const average = rated.length
    ? (rated.reduce((sum, r) => sum + Number(r.overallRating), 0) / rated.length).toFixed(1)
    : '—';
  const latest = reviews[0]?.overallRating ? num(reviews[0].overallRating).toFixed(1) : '—';

  /* ---------- content ---------- */

  const renderContent = () => {
    if (loading) {
      return <div className="pf-loading">Loading performance reviews...</div>;
    }

    if (reviews.length === 0) {
      return (
        <div className="pf-empty">
          <div className="pf-empty-icon">
            <Star size={30} />
          </div>
          <h3>No performance reviews yet</h3>
          <p>Your manager will create a review for you</p>
        </div>
      );
    }

    return (
      <>
        <div className="pf-summary">
          <SummaryTile icon={ClipboardCheck} color="#6366f1" value={reviews.length} label="Total reviews" />
          <SummaryTile icon={Award} color="#f59e0b" value={latest} label="Latest rating" />
          <SummaryTile icon={BarChart3} color="#10b981" value={average} label="Average rating" />
          <SummaryTile icon={Clock3} color="#3b82f6" value={pendingCount} label="Awaiting you" />
        </div>

        <div className="pf-list">
          {reviews.map((r) => {
            const isHighlighted = highlightId != null && String(r.id) === String(highlightId);

            return (
              <div
                key={r.id}
                id={`review-${r.id}`}
                className={`pf-card st-${r.status}${isHighlighted ? ' highlight' : ''}`}
              >
                {/* Header */}
                <div className="pf-card-head">
                  <div style={{ minWidth: 0 }}>
                    <h3 className="pf-period">{r.reviewPeriod}</h3>
                    <div className="pf-meta">
                      Reviewed by <strong>{r.reviewerName}</strong> · {r.reviewDate}
                    </div>
                  </div>

                  <div className="pf-score">
                    <ScoreRing value={r.overallRating} />

                    <div className="pf-score-text">
                      <div className="pf-score-label">Overall rating</div>
                      <Stars value={r.overallRating} />
                    </div>

                    <span className={`pf-badge pf-score-badge ${r.status}`} style={{ marginTop: 0 }}>
                      {r.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="pf-body">
                  {/* Skills */}
                  <div>
                    <div className="pf-section-title">
                      <BarChart3 size={14} /> Skill ratings
                    </div>

                    <div className="pf-skills">
                      {SKILLS.map((s) => {
                        const v = num(r[s.key]);

                        return (
                          <div key={s.key} className="pf-skill">
                            <div className="pf-skill-label">{s.label}</div>
                            <div className="pf-skill-value" style={{ color: s.color }}>
                              {v}
                              <small>/5</small>
                            </div>
                            <div className="pf-bar">
                              <span style={{ width: `${(v / 5) * 100}%`, background: s.color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback */}
                  {(r.strengths || r.improvements || r.goals) && (
                    <div className="pf-feedback">
                      {r.strengths && (
                        <div className="pf-fb green">
                          <div className="pf-fb-title">
                            <Dumbbell size={16} /> Strengths
                          </div>
                          <p>{r.strengths}</p>
                        </div>
                      )}

                      {r.improvements && (
                        <div className="pf-fb amber">
                          <div className="pf-fb-title">
                            <TrendingUp size={16} /> Improvements
                          </div>
                          <p>{r.improvements}</p>
                        </div>
                      )}

                      {r.goals && (
                        <div className="pf-fb blue">
                          <div className="pf-fb-title">
                            <Target size={16} /> Goals
                          </div>
                          <p>{r.goals}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Employee comments */}
                  {r.employeeComments && (
                    <div className="pf-comment">
                      <div className="pf-fb-title">
                        <MessageSquare size={16} /> Your comments
                      </div>
                      <p>{r.employeeComments}</p>
                    </div>
                  )}

                  {/* Acknowledge */}
                  {r.status === 'SUBMITTED' && (
                    <div className="pf-ack">
                      <div>
                        <h4 className="pf-ack-title">
                          <FileText size={17} color="#3b82f6" /> Acknowledge this review
                        </h4>
                        <p className="pf-ack-sub">
                          Add your comments and acknowledge to complete the review process
                        </p>
                      </div>

                      {selected === r.id ? (
                        <>
                          <textarea
                            className="pf-textarea"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add your comments about this review... (e.g. Thank you for the feedback, I will work on improving my communication skills)"
                            rows={4}
                          />

                          <div className="pf-btns">
                            <button
                              type="button"
                              className="pf-btn ghost"
                              onClick={() => {
                                setSelected(null);
                                setComment('');
                              }}
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              className="pf-btn primary"
                              onClick={() => handleAcknowledge(r.id)}
                              disabled={acknowledging}
                            >
                              {acknowledging ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" /> Acknowledging...
                                </>
                              ) : (
                                <>
                                  <Check size={16} /> Acknowledge review
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div>
                          <button type="button" className="pf-btn primary" onClick={() => setSelected(r.id)}>
                            <MessageCircle size={16} /> Add comments &amp; acknowledge
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {r.status === 'ACKNOWLEDGED' && (
                    <div className="pf-done">
                      <CheckCircle size={19} style={{ flexShrink: 0 }} />
                      You have acknowledged this review
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="pf-root">
      <style dangerouslySetInnerHTML={{ __html: perfCSS }} />

      <div className="pf-head">
        <h1 className="pf-title">
          My Performance Reviews
          {pendingCount > 0 && <span className="pf-pending-pill">{pendingCount} pending</span>}
        </h1>
        <p className="pf-subtitle">View your performance reviews and acknowledge them</p>
      </div>

      {renderContent()}
    </div>
  );
}

/* useSearchParams must sit inside <Suspense> in the Next.js App Router */
export default function EmployeePerformancePage() {
  return (
    <Suspense fallback={null}>
      <PerformanceContent />
    </Suspense>
  );
}