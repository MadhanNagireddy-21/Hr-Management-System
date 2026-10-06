'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Lock, Info, Loader2, UserRound, Eye, EyeOff, Check, Circle } from 'lucide-react';

/* ============================================================
   CSS
============================================================ */

const settingsCSS = `
.st-root { width: 100%; max-width: 1100px; margin: 0 auto; min-width: 0; color: var(--text-primary); }
.st-root *, .st-root *::before, .st-root *::after { box-sizing: border-box; }

.st-head { margin-bottom: 22px; }
.st-title { font-size: 24px; font-weight: 800; margin: 0 0 4px; }
.st-subtitle { font-size: 14px; color: var(--text-muted, var(--text-secondary)); margin: 0; }

.st-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 20px; align-items: start; }

.st-card { background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; box-shadow: var(--card-shadow); overflow: hidden; min-width: 0; }
.st-card-head { display: flex; align-items: center; gap: 8px; padding: 16px 20px; background: linear-gradient(135deg, #1e3a5f, #2563eb); color: #fff; }
.st-card-head h3 { font-size: 15px; font-weight: 700; margin: 0; }
.st-card-body { padding: 20px; }

/* ---------- profile ---------- */
.st-profile { display: flex; align-items: center; gap: 16px; padding: 16px; margin-bottom: 20px; border-radius: 14px; background: var(--bg-primary); border: 1px solid var(--card-border); min-width: 0; }
.st-avatar { width: 64px; height: 64px; flex-shrink: 0; border-radius: 50%; background: linear-gradient(135deg, #1e3a5f, #3b82f6); color: #fff; font-size: 22px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.st-profile-text { min-width: 0; }
.st-name { font-size: 18px; font-weight: 800; word-break: break-word; }
.st-email { font-size: 13px; color: var(--text-secondary); word-break: break-all; margin-top: 2px; }
.st-code { font-size: 12px; color: var(--text-muted, var(--text-secondary)); margin-top: 3px; }

.st-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--card-border); }
.st-row-label { font-size: 13px; color: var(--text-secondary); flex-shrink: 0; }
.st-row-value { font-size: 13px; font-weight: 600; text-align: right; min-width: 0; word-break: break-all; }

.st-note { display: flex; align-items: flex-start; gap: 10px; margin-top: 20px; padding: 12px 14px; border-radius: 12px; background: rgba(99,102,241,.10); border: 1px solid rgba(99,102,241,.25); color: #4f46e5; font-size: 13px; line-height: 1.5; }
html.dark .st-note { color: #a5b4fc; }
.st-note svg { flex-shrink: 0; margin-top: 2px; }

/* ---------- password form ---------- */
.st-field { margin-bottom: 16px; }
.st-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.st-input-wrap { position: relative; }
.st-input {
  width: 100%; height: 48px; padding: 0 48px 0 14px; border-radius: 12px; font-size: 14px; font-family: inherit; outline: none;
  border: 1.5px solid var(--card-border); background: var(--bg-primary); color: var(--text-primary); transition: border-color .2s, box-shadow .2s;
}
.st-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.18); background: var(--card-bg); }
.st-input::placeholder { color: var(--text-secondary); }
.st-input.error { border-color: #ef4444; }
.st-eye { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: 10px; }
.st-eye:hover { color: var(--text-primary); }
.st-hint { font-size: 12px; margin-top: 6px; }
.st-hint.bad { color: #ef4444; }
.st-hint.good { color: #16a34a; }
html.dark .st-hint.good { color: #4ade80; }

/* strength */
.st-strength { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.st-strength-bar { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.st-strength-bar span { height: 5px; border-radius: 999px; background: var(--card-border); transition: background .2s; }
.st-strength-label { font-size: 12px; font-weight: 700; min-width: 48px; text-align: right; }

/* requirements */
.st-reqs { padding: 14px; margin-bottom: 20px; border-radius: 12px; background: var(--bg-primary); border: 1px solid var(--card-border); }
.st-reqs-title { font-size: 12px; font-weight: 700; margin-bottom: 10px; }
.st-reqs-list { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px 12px; }
.st-req { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); }
.st-req.met { color: #16a34a; }
html.dark .st-req.met { color: #4ade80; }
.st-req-dot { width: 18px; height: 18px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--card-border); color: transparent; }
.st-req.met .st-req-dot { background: #16a34a; border-color: #16a34a; color: #fff; }

.st-submit { width: 100%; min-height: 50px; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 12px; background: #1e3a5f; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity .2s, background .2s; }
html.dark .st-submit { background: #2563eb; }
.st-submit:disabled { cursor: not-allowed; background: rgba(100,116,139,.35); color: var(--text-secondary); }
html.dark .st-submit:disabled { background: rgba(100,116,139,.25); }

/* =========================================================
   TABLET (<= 900px)
   ========================================================= */
@media (max-width: 900px) {
  .st-grid { grid-template-columns: minmax(0,1fr); gap: 16px; }
}

/* =========================================================
   PHONE (<= 600px)
   ========================================================= */
@media (max-width: 600px) {
  .st-head { margin-bottom: 16px; }
  .st-title { font-size: 21px; }
  .st-subtitle { font-size: 13px; }

  .st-card { border-radius: 14px; }
  .st-card-head { padding: 14px 16px; }
  .st-card-body { padding: 16px; }

  .st-profile { flex-direction: column; text-align: center; gap: 12px; padding: 18px 14px; }
  .st-avatar { width: 72px; height: 72px; font-size: 24px; }

  /* label above value so long emails get the whole width */
  .st-row { flex-direction: column; gap: 3px; padding: 11px 0; }
  .st-row-value { text-align: left; font-size: 14px; }

  .st-input { font-size: 16px; } /* stops iOS zoom on focus */
  .st-reqs-list { grid-template-columns: minmax(0,1fr); }
}
`;

/* ============================================================
   PASSWORD FIELD
============================================================ */

function PasswordField({ label, value, onChange, show, onToggle, placeholder, autoComplete, maxLength, error, children }) {
  return (
    <div className="st-field">
      <label className="st-label">{label}</label>

      <div className="st-input-wrap">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required
          className={'st-input' + (error ? ' error' : '')}
        />

        <button
          type="button"
          className="st-eye"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>

      {children}
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function SettingsPage() {
  const { user } = useSelector((state) => state.auth);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [changing, setChanging] = useState(false);

  // Password requirements:
  // 8–20 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const validatePassword = (password) => {
    const checks = {
      minimum8: password.length >= 8,
      maximum20: password.length > 0 && password.length <= 20,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z\d\s]/.test(password),
    };

    return { valid: Object.values(checks).every(Boolean), checks };
  };

  const passwordValidation = validatePassword(newPassword);

  const passwordsMatch =
    newPassword !== '' && confirmPassword !== '' && newPassword === confirmPassword;

  const isPasswordValid = passwordValidation.valid && passwordsMatch;

  const metCount = Object.values(passwordValidation.checks).filter(Boolean).length;
  const strengthLevel = !newPassword ? 0 : metCount <= 3 ? 1 : metCount <= 4 ? 2 : metCount === 5 ? 3 : 4;
  const strengthMeta = [
    { label: '', color: 'var(--card-border)' },
    { label: 'Weak', color: '#ef4444' },
    { label: 'Fair', color: '#f59e0b' },
    { label: 'Good', color: '#3b82f6' },
    { label: 'Strong', color: '#16a34a' },
  ][strengthLevel];

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }

    if (newPassword === currentPassword) {
      toast.error('New password cannot be the same as the current password');
      return;
    }

    if (!passwordValidation.valid) {
      toast.error(
        'Password must be between 8 and 20 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
      return;
    }

    if (!passwordsMatch) {
      toast.error('New passwords do not match');
      return;
    }

    setChanging(true);

    try {
      await api.post('/api/auth/update-password', {
        email: user?.email,
        currentPassword,
        newPassword,
      });

      toast.success('Password changed successfully!');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const requirements = [
    { rule: 'Minimum 8 characters', met: passwordValidation.checks.minimum8 },
    { rule: 'Maximum 20 characters', met: passwordValidation.checks.maximum20 },
    { rule: 'At least 1 uppercase letter', met: passwordValidation.checks.uppercase },
    { rule: 'At least 1 lowercase letter', met: passwordValidation.checks.lowercase },
    { rule: 'At least 1 number', met: passwordValidation.checks.number },
    { rule: 'At least 1 special character', met: passwordValidation.checks.special },
  ];

  const profileRows = [
    { label: 'Full Name', value: user?.name },
    { label: 'Email Address', value: user?.email },
    { label: 'Employee Code', value: user?.employeeCode },
    { label: 'Role', value: user?.role },
  ];

  const showMismatch = confirmPassword !== '' && newPassword !== confirmPassword;

  return (
    <div className="st-root">
      <style dangerouslySetInnerHTML={{ __html: settingsCSS }} />

      <div className="st-head">
        <h1 className="st-title">Settings</h1>
        <p className="st-subtitle">Manage your account settings</p>
      </div>

      <div className="st-grid">
        {/* Profile Information */}
        <div className="st-card">
          <div className="st-card-head">
            <UserRound size={17} />
            <h3>Profile Information</h3>
          </div>

          <div className="st-card-body">
            <div className="st-profile">
              <div className="st-avatar">{initials}</div>

              <div className="st-profile-text">
                <div className="st-name">{user?.name}</div>
                <div className="st-email">{user?.email}</div>
                <div className="st-code">
                  {user?.employeeCode} · {user?.role}
                </div>
              </div>
            </div>

            {profileRows.map((item) => (
              <div key={item.label} className="st-row">
                <span className="st-row-label">{item.label}</span>
                <span className="st-row-value">{item.value || '—'}</span>
              </div>
            ))}

            <div className="st-note">
              <Info size={16} />
              To update profile info, contact your HR Admin
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="st-card">
          <div className="st-card-head">
            <Lock size={17} />
            <h3>Change Password</h3>
          </div>

          <div className="st-card-body">
            <form onSubmit={handleChangePassword}>
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showCurrent}
                onToggle={() => setShowCurrent(!showCurrent)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />

              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                show={showNew}
                onToggle={() => setShowNew(!showNew)}
                placeholder="Enter new password"
                autoComplete="new-password"
                maxLength={20}
              >
                {newPassword && (
                  <div className="st-strength">
                    <div className="st-strength-bar">
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} style={{ background: i <= strengthLevel ? strengthMeta.color : undefined }} />
                      ))}
                    </div>
                    <span className="st-strength-label" style={{ color: strengthMeta.color }}>
                      {strengthMeta.label}
                    </span>
                  </div>
                )}
              </PasswordField>

              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                maxLength={20}
                error={showMismatch}
              >
                {showMismatch && <div className="st-hint bad">Passwords do not match</div>}
                {passwordsMatch && <div className="st-hint good">Passwords match</div>}
              </PasswordField>

              {/* Requirements */}
              <div className="st-reqs">
                <div className="st-reqs-title">Password Requirements</div>

                <div className="st-reqs-list">
                  {requirements.map((r) => (
                    <div key={r.rule} className={'st-req' + (r.met ? ' met' : '')}>
                      <span className="st-req-dot">
                        {r.met ? <Check size={11} strokeWidth={3.5} /> : <Circle size={0} />}
                      </span>
                      {r.rule}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="st-submit" disabled={changing || !isPasswordValid}>
                {changing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Change Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}