import React, { useState, useEffect } from 'react';
import { supabase, getUserProfile } from './supabase';
import Login from './Login';
import StretchfieldWorkRoom from './stretchfield-workroom-luxury';

const T = {
  bg: "#060B14", cyan: "#00C8FF", teal: "#00E5C8", border: "#0D1F36",
  textPrimary: "#E8F0FF", textMuted: "#5A6E8A", surface: "#0A1628", red: "#EF4444",
};

function SetPasswordForm({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!password || password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setSaving(false); return; }
    // Save password hash to profile
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('profiles').update({ password_hash: password }).eq('id', session.user.id);
    }
    setSuccess(true);
    setSaving(false);
    setTimeout(() => onDone(), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: T.surface, border: '1px solid ' + T.border, borderRadius: 16, width: '100%', maxWidth: 420, padding: 36 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <img src="/logo512.png" alt="Stretchfield" style={{ height: 36, width: 36 }} />
          <div>
            <div style={{ color: T.cyan, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Stretchfield WorkRoom</div>
          </div>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ color: T.teal, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Password Set Successfully</div>
            <div style={{ color: T.textMuted, fontSize: 13 }}>Redirecting to WorkRoom...</div>
          </div>
        ) : (
          <>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Set Your Password</div>
            <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 24 }}>Choose a secure password for your WorkRoom account.</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                style={{ width: '100%', padding: '11px 14px', background: T.bg, border: '1px solid ' + T.border, borderRadius: 8, color: T.textPrimary, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ width: '100%', padding: '11px 14px', background: T.bg, border: '1px solid ' + T.border, borderRadius: 8, color: T.textPrimary, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {error && <div style={{ background: '#EF444415', border: '1px solid #EF444430', borderRadius: 8, padding: '10px 14px', color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

            <button
              onClick={handleSubmit}
              disabled={saving || !password || !confirm}
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#00C8FF,#00E5C8)', border: 'none', borderRadius: 8, color: '#060B14', fontWeight: 800, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', opacity: (!password || !confirm) ? 0.6 : 1 }}
            >
              {saving ? 'Setting Password...' : 'Set Password & Log In →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        getUserProfile(session.user.id).then(p => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setSession(session);
        setLoading(false);
        return;
      }
      if (event === 'USER_UPDATED') {
        setIsPasswordRecovery(false);
      }
      setSession(session);
      if (session) {
        getUserProfile(session.user.id).then(p => {
          setProfile(p);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setIsPasswordRecovery(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#060B14", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ width: 44, height: 44, border: "3px solid #0a1628", borderTop: "3px solid #00C8FF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "#00C8FF", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>Loading WorkRoom...</div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // Show password reset form
  if (isPasswordRecovery && session) {
    return <SetPasswordForm onDone={() => {
      setIsPasswordRecovery(false);
      getUserProfile(session.user.id).then(p => setProfile(p));
    }} />;
  }

  if (!session) return <Login />;
  if (session && !profile) return (
    <div style={{ minHeight: "100vh", background: "#060B14", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 44, height: 44, border: "3px solid #0a1628", borderTop: "3px solid #00C8FF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "#00C8FF", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>Loading profile...</div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return <StretchfieldWorkRoom user={session.user} profile={profile} onLogout={handleLogout} />;
}

export default App;
