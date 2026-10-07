'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

import {
  Users,
  CheckCircle2,
  Clock3,
  PartyPopper,
  XCircle,
  Loader2,
  Check,
  X,
  CalendarDays,
  UserPlus,
  Banknote,
  BriefcaseBusiness,
  ArrowUpRight,
  ArrowRight,
  UserCheck,
  Activity,
  Search,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Hand,
} from 'lucide-react';

/* =========================================================
   HELPERS
========================================================= */

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'NA'
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function toList(d) {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.content)) return d.content;
  return [];
}

/* =========================================================
   STYLES  (everything is prefixed "ad-" so nothing leaks)
========================================================= */

const adminCSS = `
.ad-root {
  --c-blue: #4f46e5; --c-green: #059669; --c-amber: #b45309; --c-purple: #7c3aed; --c-red: #dc2626; --c-gray: #64748b;
  --b-blue: rgba(99,102,241,.12); --b-green: rgba(16,185,129,.13); --b-amber: rgba(245,158,11,.14);
  --b-purple: rgba(139,92,246,.12); --b-red: rgba(239,68,68,.11); --b-gray: rgba(148,163,184,.15);
  --soft: rgba(100,116,139,.07); --hover: rgba(100,116,139,.09); --body: #334155; --faint: #64748b; --link: #4f46e5;
  --p-border: var(--card-border); --p-text: var(--text-primary); --p-muted: var(--text-secondary);

  position: relative; width: 100%; max-width: 100%; min-width: 0; color: var(--p-text);
}
html.dark .ad-root {
  --c-blue: #818cf8; --c-green: #34d399; --c-amber: #fbbf24; --c-purple: #a78bfa; --c-red: #f87171; --c-gray: #94a3b8;
  --soft: rgba(255,255,255,.035); --hover: rgba(255,255,255,.05); --body: #cbd5e1; --link: #a5b4fc;
}
.ad-root *, .ad-root *::before, .ad-root *::after { box-sizing: border-box; }
.ad-root button, .ad-root input { font: inherit; }
.ad-root > *:not(.ad-orbs) { position: relative; z-index: 1; }

.t-blue { --tone: var(--c-blue); --tone-bg: var(--b-blue); }
.t-green { --tone: var(--c-green); --tone-bg: var(--b-green); }
.t-amber { --tone: var(--c-amber); --tone-bg: var(--b-amber); }
.t-purple { --tone: var(--c-purple); --tone-bg: var(--b-purple); }
.t-red { --tone: var(--c-red); --tone-bg: var(--b-red); }
.t-gray { --tone: var(--c-gray); --tone-bg: var(--b-gray); }
.ad-ico { color: var(--tone); background: var(--tone-bg); display: grid; place-items: center; flex-shrink: 0; }

/* soft background glow */
.ad-orbs { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; border-radius: 24px; }
.ad-orbs::before, .ad-orbs::after { content: ''; position: absolute; border-radius: 50%; filter: blur(80px); opacity: .5; }
.ad-orbs::before { width: 300px; height: 300px; right: -100px; top: -60px; background: rgba(99,102,241,.14); }
.ad-orbs::after { width: 240px; height: 240px; left: -100px; bottom: 140px; background: rgba(6,182,212,.09); }

/* ---------- header ---------- */
.ad-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 26px; }
.ad-eyebrow { display: flex; align-items: center; gap: 8px; color: var(--c-blue); font-size: 11px; font-weight: 800; letter-spacing: 1.4px; }
.ad-live { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.14); flex-shrink: 0; }
.ad-header h1 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 10px 0 6px; font-size: 28px; line-height: 1.15; letter-spacing: -.8px; font-weight: 800; }
.ad-header p { margin: 0; color: var(--p-muted); font-size: 13px; line-height: 1.6; }
.ad-date { display: flex; align-items: center; gap: 9px; height: 44px; padding: 0 16px; border-radius: 13px; border: 1px solid var(--p-border); background: var(--card-bg); color: var(--p-muted); font-size: 12px; font-weight: 600; white-space: nowrap; }

/* ---------- stats ---------- */
.ad-stats { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; margin-bottom: 20px; }
.ad-stat { position: relative; overflow: hidden; padding: 20px; border-radius: 20px; border: 1px solid var(--p-border); background: var(--card-bg); box-shadow: var(--card-shadow); transition: transform .25s, border-color .25s; }
.ad-stat:hover { transform: translateY(-3px); border-color: rgba(129,140,248,.35); }
.ad-stat .ad-ico { width: 44px; height: 44px; border-radius: 13px; }
.ad-stat-value { margin-top: 16px; font-size: 28px; line-height: 1; font-weight: 800; letter-spacing: -.8px; }
.ad-stat-title { margin-top: 8px; font-size: 13px; font-weight: 700; }
.ad-stat-sub { margin-top: 4px; color: var(--p-muted); font-size: 12px; line-height: 1.45; }
.ad-glow { position: absolute; width: 100px; height: 100px; right: -36px; bottom: -46px; border-radius: 50%; filter: blur(28px); opacity: .22; background: var(--tone); }

/* ---------- panels ---------- */
.ad-grid { display: grid; grid-template-columns: 1.08fr .92fr; gap: 20px; margin-bottom: 20px; }
.ad-panel { min-width: 0; overflow: hidden; border-radius: 20px; border: 1px solid var(--p-border); background: var(--card-bg); box-shadow: var(--card-shadow); }
.ad-panel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 22px; border-bottom: 1px solid var(--p-border); }
.ad-kicker { color: var(--c-blue); font-size: 10.5px; font-weight: 800; letter-spacing: 1.4px; }
.ad-panel-head h2 { margin: 7px 0 4px; font-size: 18px; line-height: 1.25; font-weight: 800; letter-spacing: -.3px; }
.ad-panel-head p { margin: 0; color: var(--p-muted); font-size: 12px; line-height: 1.5; }
.ad-link { display: inline-flex; align-items: center; gap: 6px; border: 0; background: transparent; color: var(--link); cursor: pointer; font-size: 12px; font-weight: 700; white-space: nowrap; transition: transform .2s; }
.ad-link:hover { transform: translateX(2px); }

/* ---------- attendance ---------- */
.ad-att { display: flex; align-items: center; gap: 36px; padding: 26px 26px 22px; }
.ad-ring { position: relative; width: 156px; height: 156px; flex-shrink: 0; }
.ad-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ad-ring-track { fill: none; stroke: var(--b-gray); stroke-width: 9; }
.ad-ring-bar { fill: none; stroke: #10b981; stroke-width: 9; stroke-linecap: round; filter: drop-shadow(0 0 8px rgba(16,185,129,.25)); transition: stroke-dashoffset .6s; }
.ad-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.ad-ring-center strong { font-size: 24px; line-height: 1; font-weight: 800; }
.ad-ring-center span { margin-top: 6px; color: var(--p-muted); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
.ad-att-stats { flex: 1; display: grid; gap: 16px; min-width: 0; }
.ad-att-stat { display: flex; align-items: center; gap: 12px; }
.ad-att-stat strong { display: block; font-size: 17px; line-height: 1.1; font-weight: 800; }
.ad-att-stat small { display: block; margin-top: 3px; color: var(--p-muted); font-size: 12px; }
.ad-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.ad-dot.present { background: #10b981; } .ad-dot.late { background: #8b5cf6; } .ad-dot.absent { background: #ef4444; }
.ad-health { margin: 0 22px 22px; padding: 15px; border-radius: 14px; background: var(--soft); border: 1px solid var(--p-border); }
.ad-health-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 9px; color: var(--p-muted); font-size: 12px; }
.ad-health-top strong { color: var(--p-text); font-size: 13px; }
.ad-bar { height: 7px; border-radius: 99px; background: var(--b-gray); overflow: hidden; }
.ad-bar span { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #10b981, #34d399); transition: width .5s; }

/* ---------- quick actions ---------- */
.ad-quick { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; padding: 14px 15px 16px; }
.ad-qa { display: flex; align-items: center; gap: 13px; min-height: 88px; padding: 13px; text-align: left; border-radius: 14px; border: 1px solid var(--p-border); background: var(--soft); color: var(--p-text); cursor: pointer; transition: transform .2s, border-color .2s, background .2s; }
.ad-qa:hover { transform: translateY(-2px); border-color: rgba(129,140,248,.4); background: var(--hover); }
.ad-qa .ad-ico { width: 42px; height: 42px; border-radius: 12px; }
.ad-qa .ad-ico svg { width: 21px; height: 21px; }
.ad-qa-text { flex: 1; min-width: 0; }
.ad-qa-text strong { display: block; font-size: 13px; line-height: 1.3; font-weight: 700; }
.ad-qa-text span { display: block; margin-top: 4px; color: var(--p-muted); font-size: 12px; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-qa > svg { flex-shrink: 0; color: var(--faint); }

/* ---------- list rows ---------- */
.ad-row { display: flex; align-items: center; gap: 13px; padding: 15px 22px; border-bottom: 1px solid var(--p-border); transition: background .18s; }
.ad-row:last-child { border-bottom: 0; }
.ad-row:hover { background: var(--soft); }
.ad-avatar { width: 40px; height: 40px; border-radius: 12px; font-size: 12px; font-weight: 800; }
.ad-row-main { flex: 1; min-width: 0; }
.ad-row-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ad-row-main strong { font-size: 13px; line-height: 1.35; font-weight: 800; }
.ad-row-main > span { display: block; margin-top: 4px; color: var(--p-muted); font-size: 12px; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-row-main em { display: block; margin-top: 5px; color: var(--faint); font-size: 11.5px; font-style: italic; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ad-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 9px; border-radius: 8px; font-size: 11px; line-height: 1.2; font-weight: 800; white-space: nowrap; color: var(--tone); background: var(--tone-bg); }
.ad-badge i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ad-role { display: inline-flex; padding: 5px 9px; border-radius: 7px; font-size: 11px; line-height: 1.2; font-weight: 800; color: var(--tone); background: var(--tone-bg); }

.ad-actions { display: flex; gap: 8px; flex-shrink: 0; }
.ad-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; padding: 7px 12px; border-radius: 9px; font-size: 12px; font-weight: 800; cursor: pointer; border: 1px solid; transition: transform .2s, opacity .2s; }
.ad-btn:hover { transform: translateY(-1px); }
.ad-btn:disabled { cursor: not-allowed; opacity: .6; }
.ad-btn.ok { color: var(--c-green); border-color: rgba(16,185,129,.3); background: var(--b-green); }
.ad-btn.no { color: var(--c-red); border-color: rgba(239,68,68,.28); background: var(--b-red); }
.ad-note { display: inline-flex; align-items: center; gap: 5px; color: var(--p-muted); font-size: 12px; font-weight: 600; white-space: nowrap; }

/* ---------- employees ---------- */
.ad-people { margin-bottom: 20px; }
.ad-people-head { align-items: center; }
.ad-tools { display: flex; align-items: center; gap: 9px; }
.ad-search { display: flex; align-items: center; gap: 9px; width: 280px; height: 44px; padding: 0 13px; border-radius: 12px; border: 1px solid var(--p-border); background: var(--soft); color: var(--faint); transition: border-color .2s, background .2s; }
.ad-search:focus-within { border-color: rgba(99,102,241,.5); background: var(--card-bg); }
.ad-search input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--p-text); font-size: 13px; }
.ad-search input::placeholder { color: var(--faint); }
.ad-more { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; border: 1px solid var(--p-border); background: var(--soft); color: var(--p-text); cursor: pointer; }
.ad-more:hover { background: var(--hover); }
.ad-table-wrap { overflow-x: auto; }
.ad-table { width: 100%; min-width: 820px; border-collapse: collapse; }
.ad-table th { padding: 13px 22px; color: var(--faint); background: var(--soft); border-bottom: 1px solid var(--p-border); text-align: left; font-size: 11px; letter-spacing: 1px; font-weight: 800; }
.ad-table td { padding: 15px 22px; border-bottom: 1px solid var(--p-border); color: var(--body); font-size: 13px; line-height: 1.5; }
.ad-table tbody tr { transition: background .18s; }
.ad-table tbody tr:hover { background: var(--soft); }
.ad-emp { display: flex; align-items: center; gap: 11px; min-width: 0; }
.ad-emp > div:last-child { min-width: 0; }
.ad-emp strong { display: block; color: var(--p-text); font-size: 13.5px; line-height: 1.35; font-weight: 700; }
.ad-emp span { display: block; margin-top: 3px; color: var(--faint); font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; }
.ad-arrow { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; border: 1px solid var(--p-border); background: transparent; color: var(--p-muted); cursor: pointer; transition: background .2s, color .2s, transform .2s; }
.ad-arrow:hover { background: var(--b-blue); color: var(--link); transform: translateY(-1px); }
.ad-foot { display: flex; justify-content: space-between; align-items: center; gap: 15px; padding: 15px 22px; color: var(--faint); font-size: 12px; }
.ad-foot button { display: inline-flex; align-items: center; gap: 6px; border: 0; background: transparent; color: var(--link); cursor: pointer; font-size: 12px; font-weight: 800; }
.ad-table-empty { padding: 36px 20px; text-align: center; color: var(--faint); font-size: 13px; }

/* ---------- empty / insight / loading ---------- */
.ad-empty { min-height: 210px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 30px; }
.ad-empty .ad-ico { width: 54px; height: 54px; margin-bottom: 12px; border-radius: 16px; }
.ad-empty strong { font-size: 14px; font-weight: 800; }
.ad-empty span { margin-top: 6px; color: var(--faint); font-size: 12.5px; line-height: 1.5; }

.ad-insight { display: flex; align-items: center; gap: 13px; padding: 16px 18px; border-radius: 16px; border: 1px solid rgba(129,140,248,.25); background: rgba(99,102,241,.07); }
.ad-insight .ad-ico { width: 40px; height: 40px; border-radius: 11px; }
.ad-insight-text { flex: 1; min-width: 0; }
.ad-insight-text strong { display: block; font-size: 13px; line-height: 1.3; font-weight: 800; }
.ad-insight-text span { display: block; margin-top: 3px; color: var(--p-muted); font-size: 12.5px; line-height: 1.5; }
.ad-insight > button { display: inline-flex; align-items: center; gap: 6px; border: 0; background: transparent; color: var(--link); cursor: pointer; font-size: 12.5px; font-weight: 800; white-space: nowrap; }

.ad-loading { min-height: 60vh; display: flex; align-items: center; justify-content: center; gap: 15px; }
.ad-loading .ad-ico { width: 48px; height: 48px; border-radius: 14px; }
.ad-loading strong { display: block; font-size: 14px; }
.ad-loading span { display: block; margin-top: 4px; color: var(--p-muted); font-size: 12px; }
.ad-spin { animation: ad-spin 1s linear infinite; }
@keyframes ad-spin { to { transform: rotate(360deg); } }

/* =========================================================
   TABLET
   ========================================================= */
@media (max-width: 1200px) {
  .ad-stats { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .ad-grid { grid-template-columns: minmax(0,1fr); }
}
@media (max-width: 850px) {
  .ad-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .ad-date { width: 100%; justify-content: center; }
  .ad-people-head { flex-direction: column; align-items: stretch; }
  .ad-tools { width: 100%; }
  .ad-search { flex: 1; width: auto; }
}

/* =========================================================
   PHONE (<= 700px)
   ========================================================= */
@media (max-width: 700px) {
  .ad-header { margin-bottom: 18px; }
  .ad-header h1 { font-size: 23px; letter-spacing: -.5px; }
  .ad-header p { font-size: 13.5px; }
  .ad-date { height: 46px; font-size: 13px; white-space: normal; text-align: center; }

  .ad-stats { gap: 10px; margin-bottom: 16px; }
  .ad-stat { padding: 14px; border-radius: 16px; }
  .ad-stat .ad-ico { width: 38px; height: 38px; border-radius: 11px; }
  .ad-stat-value { margin-top: 12px; font-size: 25px; }
  .ad-stat-title { font-size: 13px; line-height: 1.3; }
  .ad-stat-sub { font-size: 11.5px; }

  .ad-grid { gap: 16px; margin-bottom: 16px; }
  .ad-panel { border-radius: 16px; }
  .ad-panel-head { padding: 16px; gap: 12px; }
  .ad-panel-head h2 { font-size: 17px; }
  .ad-panel-head p { font-size: 12.5px; }
  .ad-link { min-height: 44px; margin: -8px -6px -8px 0; padding: 0 6px; font-size: 13px; }

  .ad-att { flex-direction: column; gap: 20px; padding: 22px 16px 18px; }
  .ad-ring { width: 144px; height: 144px; }
  .ad-att-stats { width: 100%; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
  .ad-att-stat { flex-direction: column; justify-content: center; gap: 7px; padding: 12px 6px; text-align: center; border: 1px solid var(--p-border); border-radius: 12px; background: var(--soft); }
  .ad-att-stat strong { font-size: 19px; }
  .ad-att-stat small { font-size: 11.5px; line-height: 1.25; }
  .ad-health { margin: 0 14px 16px; }

  .ad-quick { gap: 10px; padding: 12px; }
  .ad-qa { min-height: 112px; flex-direction: column; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px; }
  .ad-qa > svg { display: none; }
  .ad-qa-text { width: 100%; flex: none; }
  .ad-qa-text strong { font-size: 14px; }
  .ad-qa-text span { font-size: 12.5px; white-space: normal; }

  .ad-row { padding: 14px 16px; }
  .ad-row.leave { flex-wrap: wrap; align-items: flex-start; gap: 12px; }
  .ad-row.leave .ad-row-main { flex: 1 1 calc(100% - 56px); }
  .ad-row-top { flex-wrap: wrap; gap: 6px 10px; }
  .ad-row-main strong { font-size: 14px; }
  .ad-row-main > span, .ad-row-main em { white-space: normal; font-size: 12.5px; }
  .ad-actions { flex: 1 1 100%; width: 100%; gap: 10px; }
  .ad-btn { flex: 1; min-height: 44px; border-radius: 10px; font-size: 13.5px; }
  .ad-row.leave .ad-note { margin-left: 52px; }

  .ad-people-head { align-items: stretch; }
  .ad-search { height: 46px; }
  .ad-search input { font-size: 16px; } /* stops iOS zoom on focus */
  .ad-more { width: 46px; height: 46px; }

  /* table -> cards */
  .ad-table-wrap { overflow: visible; }
  .ad-table, .ad-table tbody { display: block; width: 100%; min-width: 0; }
  .ad-table thead { display: none; }
  .ad-table tbody tr { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: center; gap: 10px 12px; padding: 14px 16px; border-bottom: 1px solid var(--p-border); }
  .ad-table td { display: block; padding: 0; border: 0; }
  .ad-table td:first-child { grid-column: 1; grid-row: 1; }
  .ad-table td.arrow-cell { grid-column: 2; grid-row: 1; }
  .ad-table td[data-label] { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 10px; border-top: 1px dashed var(--p-border); text-align: right; }
  .ad-table td[data-label]::before { content: attr(data-label); color: var(--faint); font-size: 12px; font-weight: 700; text-align: left; }
  .ad-table td[colspan] { grid-column: 1 / -1; }
  .ad-emp strong { font-size: 14.5px; }
  .ad-arrow { width: 44px; height: 44px; border-radius: 12px; }

  .ad-foot { flex-direction: column; align-items: stretch; gap: 12px; padding: 16px; font-size: 12.5px; }
  .ad-foot button { justify-content: center; min-height: 46px; border: 1px solid rgba(129,140,248,.3); border-radius: 12px; font-size: 13.5px; }

  .ad-insight { flex-wrap: wrap; align-items: flex-start; padding: 16px; }
  .ad-insight-text { flex: 1 1 calc(100% - 56px); }
  .ad-insight > button { width: 100%; min-height: 46px; justify-content: center; border: 1px solid rgba(129,140,248,.3); border-radius: 12px; font-size: 13.5px; }

  .ad-loading { flex-direction: column; text-align: center; }

  .ad-stat:hover, .ad-qa:hover, .ad-btn:hover, .ad-arrow:hover, .ad-link:hover { transform: none; }
}

@media (max-width: 380px) {
  .ad-header h1 { font-size: 21px; }
  .ad-stats { gap: 8px; }
  .ad-stat { padding: 12px; }
  .ad-stat-value { font-size: 22px; }
  .ad-qa { min-height: 104px; padding: 12px; }
  .ad-actions { flex-direction: column; }
}
@media (max-width: 330px) {
  .ad-stats, .ad-quick { grid-template-columns: minmax(0,1fr); }
}
@media (prefers-reduced-motion: reduce) {
  .ad-stat, .ad-qa, .ad-bar span, .ad-ring-bar, .ad-spin { transition: none; animation: none; }
}
`;

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function StatCard({ title, value, subtitle, icon, tone }) {
  return (
    <div className={`ad-stat t-${tone}`}>
      <div className="ad-ico">{icon}</div>
      <div className="ad-stat-value">{formatNumber(value)}</div>
      <div className="ad-stat-title">{title}</div>
      <div className="ad-stat-sub">{subtitle}</div>
      <div className="ad-glow" />
    </div>
  );
}

const BADGES = {
  APPROVED: ['Approved', 'green'],
  PENDING: ['Pending', 'amber'],
  REJECTED: ['Rejected', 'red'],
  CANCELLED: ['Cancelled', 'gray'],
  CANCELED: ['Cancelled', 'gray'],
  CANCELLATION_PENDING: ['Cancellation pending', 'purple'],
  ACTIVE: ['Active', 'green'],
  INACTIVE: ['Inactive', 'gray'],
  PRESENT: ['Present', 'green'],
  ABSENT: ['Absent', 'red'],
  HALF_DAY: ['Half day', 'amber'],
  LATE: ['Late', 'purple'],
};

function StatusBadge({ status }) {
  const [label, tone] = BADGES[String(status || '').toUpperCase()] || [String(status || 'Unknown'), 'gray'];

  return (
    <span className={`ad-badge t-${tone}`}>
      <i />
      {label}
    </span>
  );
}

function AttendanceRing({ present, total }) {
  const percentage = Math.min(100, Math.round((present / Math.max(total || 0, 1)) * 100));
  const circumference = 2 * Math.PI * 46;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="ad-ring">
      <svg viewBox="0 0 120 120" aria-label={`${percentage}% attendance`}>
        <circle cx="60" cy="60" r="46" className="ad-ring-track" />
        <circle
          cx="60"
          cy="60"
          r="46"
          className="ad-ring-bar"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="ad-ring-center">
        <strong>{percentage}%</strong>
        <span>Present</span>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [search, setSearch] = useState('');

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  /* ---------- fetch ---------- */

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`;

      const [empRes, leaveRes, attRes] = await Promise.allSettled([
        api.get('/api/employees?size=1000'),
        api.get('/api/leaves/pending?size=1000'),
        api.get(`/api/attendance/date/${todayStr}?size=1000`),
      ]);

      if (empRes.status === 'fulfilled') setEmployees(toList(empRes.value.data?.data));
      if (leaveRes.status === 'fulfilled') setPendingLeaves(toList(leaveRes.value.data?.data));
      if (attRes.status === 'fulfilled') setTodayAttendance(toList(attRes.value.data?.data));
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /* ---------- leave action ---------- */

  const handleLeaveAction = async (id, status) => {
    setActioning(`${id}-${status}`);

    try {
      await api.put(`/api/leaves/${id}/action`, {
        action: status,
        remarks: 'Actioned from admin dashboard',
      });

      toast.success(`Leave ${status.toLowerCase()} successfully`);
      await fetchDashboardData(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update leave');
    } finally {
      setActioning(null);
    }
  };

  /* ---------- calculations ---------- */

  const activeEmployees = employees.filter((employee) => employee.active);
  const inactiveEmployees = employees.length - activeEmployees.length;

  const presentToday = todayAttendance.filter((a) =>
    ['PRESENT', 'LATE', 'HALF_DAY'].includes(String(a.status || '').toUpperCase())
  ).length;

  const absentToday = Math.max(0, employees.length - presentToday);
  const lateToday = todayAttendance.filter((a) => String(a.status || '').toUpperCase() === 'LATE').length;
  const pendingCount = pendingLeaves.filter((l) => String(l.status || '').toUpperCase() === 'PENDING').length;

  const filteredEmployees = employees
    .filter((employee) => {
      const text = `${employee.firstName || ''} ${employee.lastName || ''} ${employee.email || ''} ${employee.department || ''
        } ${employee.designation || ''}`.toLowerCase();

      return text.includes(search.toLowerCase());
    })
    .slice(0, 7);

  const visibleLeaves = pendingLeaves.slice(0, 5);
  const visibleAttendance = todayAttendance.slice(0, 7);

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const quickActions = [
    { label: 'Add employee', hint: 'Create a profile', icon: UserPlus, tone: 'blue', route: '/admin/employees' },
    { label: 'Approve leave', hint: `${pendingCount} awaiting action`, icon: CheckCircle2, tone: 'green', route: '/admin/leave' },
    { label: 'Run payroll', hint: 'Open payroll center', icon: Banknote, tone: 'amber', route: '/admin/payroll' },
    { label: 'Recruitment', hint: 'Manage hiring pipeline', icon: BriefcaseBusiness, tone: 'purple', route: '/admin/recruitment' },
  ];

  /* ---------- render ---------- */

  return (
    <div className="ad-root">
      <style dangerouslySetInnerHTML={{ __html: adminCSS }} />
      <div className="ad-orbs" />

      {loading ? (
        <div className="ad-loading">
          <div className="ad-ico t-purple">
            <Sparkles size={26} />
          </div>

          <div>
            <strong>Preparing your workspace</strong>
            <span>Loading HR intelligence...</span>
          </div>

          <Loader2 size={24} className="ad-spin" />
        </div>
      ) : (
        <>
          {/* HEADER */}
          <header className="ad-header">
            <div>
              <div className="ad-eyebrow">
                <span className="ad-live" />
                ADMIN CONTROL CENTER
              </div>

              <h1>
                {greeting}, Admin <Hand size={24} color="#fbbf24" />
              </h1>

              <p>Here&apos;s what&apos;s happening across your organization today.</p>
            </div>

            <div className="ad-date">
              <CalendarDays size={18} />
              {dateLabel}
            </div>
          </header>

          {/* KPI CARDS */}
          <section className="ad-stats">
            <StatCard
              title="Total Employees"
              value={employees.length}
              subtitle={`${activeEmployees.length} active employees`}
              icon={<Users size={22} />}
              tone="blue"
            />
            <StatCard
              title="Attendance Today"
              value={presentToday}
              subtitle={`${lateToday} late · ${absentToday} not checked in`}
              icon={<UserCheck size={22} />}
              tone="green"
            />
            <StatCard
              title="Pending Approvals"
              value={pendingCount}
              subtitle="Leave requests waiting"
              icon={<Clock3 size={22} />}
              tone="amber"
            />
            <StatCard
              title="Active Workforce"
              value={activeEmployees.length}
              subtitle={`${inactiveEmployees} inactive accounts`}
              icon={<Activity size={22} />}
              tone="purple"
            />
          </section>

          {/* ATTENDANCE + QUICK ACTIONS */}
          <section className="ad-grid">
            <div className="ad-panel">
              <div className="ad-panel-head">
                <div>
                  <div className="ad-kicker">LIVE OVERVIEW</div>
                  <h2>Today&apos;s workforce</h2>
                  <p>Real-time attendance snapshot</p>
                </div>

                <button type="button" className="ad-link" onClick={() => router.push('/admin/attendance')}>
                  Full report
                  <ArrowUpRight size={17} />
                </button>
              </div>

              <div className="ad-att">
                <AttendanceRing present={presentToday} total={employees.length} />

                <div className="ad-att-stats">
                  <div className="ad-att-stat">
                    <span className="ad-dot present" />
                    <div>
                      <strong>{presentToday}</strong>
                      <small>Present</small>
                    </div>
                  </div>

                  <div className="ad-att-stat">
                    <span className="ad-dot late" />
                    <div>
                      <strong>{lateToday}</strong>
                      <small>Late</small>
                    </div>
                  </div>

                  <div className="ad-att-stat">
                    <span className="ad-dot absent" />
                    <div>
                      <strong>{absentToday}</strong>
                      <small>Not checked in</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ad-health">
                <div className="ad-health-top">
                  <span>Workforce attendance health</span>
                  <strong>
                    {employees.length ? `${Math.round((presentToday / employees.length) * 100)}%` : '0%'}
                  </strong>
                </div>

                <div className="ad-bar">
                  <span
                    style={{
                      width: `${employees.length ? Math.min(100, (presentToday / employees.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="ad-panel">
              <div className="ad-panel-head">
                <div>
                  <div className="ad-kicker">COMMAND CENTER</div>
                  <h2>Quick actions</h2>
                  <p>Jump directly into daily operations</p>
                </div>

                <ShieldCheck size={25} color="var(--c-purple)" style={{ flexShrink: 0 }} />
              </div>

              <div className="ad-quick">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={action.label}
                      type="button"
                      className={`ad-qa t-${action.tone}`}
                      onClick={() => router.push(action.route)}
                    >
                      <div className="ad-ico">
                        <Icon />
                      </div>

                      <div className="ad-qa-text">
                        <strong>{action.label}</strong>
                        <span>{action.hint}</span>
                      </div>

                      <ChevronRight size={19} />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* LEAVES + ATTENDANCE FEED */}
          <section className="ad-grid">
            <div className="ad-panel">
              <div className="ad-panel-head">
                <div>
                  <div className="ad-kicker">ACTION REQUIRED</div>
                  <h2>Leave requests</h2>
                  <p>Review employee leave applications</p>
                </div>

                <button type="button" className="ad-link" onClick={() => router.push('/admin/leave')}>
                  View all
                  <ArrowRight size={17} />
                </button>
              </div>

              {visibleLeaves.length === 0 ? (
                <div className="ad-empty">
                  <div className="ad-ico t-purple">
                    <PartyPopper size={28} />
                  </div>
                  <strong>All clear</strong>
                  <span>No leave requests need your attention.</span>
                </div>
              ) : (
                <div>
                  {visibleLeaves.map((leave, index) => {
                    const cancelled = ['CANCELLED', 'CANCELED', 'CANCELLATION_PENDING'].includes(
                      String(leave.status || '').toUpperCase()
                    );

                    const approveKey = `${leave.id}-APPROVED`;
                    const rejectKey = `${leave.id}-REJECTED`;

                    return (
                      <div className="ad-row leave" key={leave.id || index}>
                        <div className="ad-ico ad-avatar t-blue">{initials(leave.employeeName)}</div>

                        <div className="ad-row-main">
                          <div className="ad-row-top">
                            <strong>{leave.employeeName || 'Employee'}</strong>
                            <StatusBadge status={leave.status} />
                          </div>

                          <span>
                            {leave.leaveType || 'Leave'} · {leave.startDate || '--'} → {leave.endDate || '--'} ·{' '}
                            {leave.totalDays || 0} day(s)
                          </span>

                          {leave.reason && <em>&quot;{leave.reason}&quot;</em>}
                        </div>

                        {cancelled ? (
                          <div className="ad-note">
                            <XCircle size={17} />
                            Cancelled
                          </div>
                        ) : leave.status === 'PENDING' ? (
                          <div className="ad-actions">
                            <button
                              type="button"
                              className="ad-btn ok"
                              disabled={actioning === approveKey}
                              onClick={() => handleLeaveAction(leave.id, 'APPROVED')}
                            >
                              {actioning === approveKey ? <Loader2 size={15} className="ad-spin" /> : <Check size={15} />}
                              Approve
                            </button>

                            <button
                              type="button"
                              className="ad-btn no"
                              disabled={actioning === rejectKey}
                              onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                            >
                              {actioning === rejectKey ? <Loader2 size={15} className="ad-spin" /> : <X size={15} />}
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="ad-note">Actioned</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="ad-panel">
              <div className="ad-panel-head">
                <div>
                  <div className="ad-kicker">LIVE ACTIVITY</div>
                  <h2>Attendance feed</h2>
                  <p>Latest employee check-ins</p>
                </div>

                <button type="button" className="ad-link" onClick={() => router.push('/admin/attendance')}>
                  View all
                  <ArrowRight size={17} />
                </button>
              </div>

              {visibleAttendance.length === 0 ? (
                <div className="ad-empty">
                  <div className="ad-ico t-green">
                    <CalendarDays size={28} />
                  </div>
                  <strong>No activity yet</strong>
                  <span>Attendance records will appear here.</span>
                </div>
              ) : (
                <div>
                  {visibleAttendance.map((attendance, index) => (
                    <div className="ad-row" key={attendance.id || attendance.employeeId || index}>
                      <div className="ad-ico ad-avatar t-green">{initials(attendance.employeeName)}</div>

                      <div className="ad-row-main">
                        <strong>{attendance.employeeName || 'Employee'}</strong>

                        <span>
                          Check-in {attendance.checkIn?.substring(0, 5) || '--:--'}
                          {attendance.checkOut ? ` · Check-out ${attendance.checkOut.substring(0, 5)}` : ''}
                        </span>
                      </div>

                      <StatusBadge status={attendance.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* EMPLOYEE DIRECTORY */}
          <section className="ad-panel ad-people">
            <div className="ad-panel-head ad-people-head">
              <div>
                <div className="ad-kicker">PEOPLE DIRECTORY</div>
                <h2>Employees</h2>
                <p>Your latest workforce records</p>
              </div>

              <div className="ad-tools">
                <div className="ad-search">
                  <Search size={18} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees..." />
                </div>

                <button
                  type="button"
                  className="ad-more"
                  onClick={() => router.push('/admin/employees')}
                  aria-label="Manage employees"
                >
                  <MoreHorizontal size={21} />
                </button>
              </div>
            </div>

            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>DEPARTMENT</th>
                    <th>DESIGNATION</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.map((employee, index) => {
                    const role = String(employee.role || 'EMPLOYEE').toUpperCase();
                    const roleTone = role === 'ADMIN' ? 'blue' : role === 'HR' ? 'purple' : 'gray';

                    return (
                      <tr key={employee.id || employee.employeeId || index}>
                        <td>
                          <div className="ad-emp">
                            <div className="ad-ico ad-avatar t-purple">
                              {initials(`${employee.firstName || ''} ${employee.lastName || ''}`)}
                            </div>

                            <div>
                              <strong>
                                {employee.firstName} {employee.lastName}
                              </strong>
                              <span>{employee.email || '—'}</span>
                            </div>
                          </div>
                        </td>

                        <td data-label="Department">{employee.department || '—'}</td>
                        <td data-label="Designation">{employee.designation || '—'}</td>

                        <td data-label="Role">
                          <span className={`ad-role t-${roleTone}`}>{role}</span>
                        </td>

                        <td data-label="Status">
                          <StatusBadge status={employee.active ? 'ACTIVE' : 'INACTIVE'} />
                        </td>

                        <td className="arrow-cell">
                          <button
                            type="button"
                            className="ad-arrow"
                            onClick={() => router.push('/admin/employees')}
                            aria-label="Open employee directory"
                          >
                            <ArrowUpRight size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        <div className="ad-table-empty">No employees match your search.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ad-foot">
              <span>
                Showing {filteredEmployees.length} of {employees.length} employees
              </span>

              <button type="button" onClick={() => router.push('/admin/employees')}>
                Manage directory
                <ArrowRight size={17} />
              </button>
            </div>
          </section>

          {/* ADMIN INSIGHT */}
          <div className="ad-insight">
            <div className="ad-ico t-purple">
              <Sparkles size={20} />
            </div>

            <div className="ad-insight-text">
              <strong>Admin insight</strong>

              <span>
                {pendingCount > 0
                  ? `You have ${pendingCount} leave ${pendingCount === 1 ? 'request' : 'requests'} requiring attention.`
                  : 'Your approval queue is clear. Great job keeping operations moving.'}
              </span>
            </div>

            <button type="button" onClick={() => router.push('/admin/leave')}>
              Review queue
              <ArrowRight size={17} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}