import React, { useState, useEffect } from 'react';
import { supabase, getUserProfile } from './supabase';
import Login from './Login';
import StretchfieldWorkRoom from './stretchfield-workroom-luxury';

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
  };

  if (loading || (session && !profile)) return (
    <div style={{ minHeight: "100vh", background: "#060B14", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ width: 44, height: 44, border: "3px solid #0a1628", borderTop: "3px solid #00C8FF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "#00C8FF", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>Loading WorkRoom...</div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!session) return <Login />;

  return <StretchfieldWorkRoom user={session.user} profile={profile} onLogout={handleLogout} />;
}

export default App;
