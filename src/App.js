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

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#060B14", display: "flex", alignItems: "center", justifyContent: "center", color: "#00C8FF", fontFamily: "DM Sans, sans-serif", letterSpacing: "0.1em", fontSize: 12 }}>
      LOADING...
    </div>
  );

  if (!session) return <Login />;

  return <StretchfieldWorkRoom user={session.user} profile={profile} onLogout={handleLogout} />;
}

export default App;
