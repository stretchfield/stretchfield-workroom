const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getValidToken() {
  const { data } = await supabase.from("zoho_tokens").select("*").eq("id", 1).single();
  if (!data) throw new Error("No Zoho tokens found. Please reconnect.");

  const expiresAt = new Date(data.expires_at);
  const now = new Date();

  // Refresh if expires within 5 minutes
  if (expiresAt - now < 5 * 60 * 1000) {
    const params = new URLSearchParams({
      refresh_token: data.refresh_token,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token",
    });

    const refreshRes = await fetch("https://accounts.zoho.com/oauth/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const refreshed = await refreshRes.json();
    if (refreshed.error) throw new Error("Token refresh failed: " + refreshed.error);

    await supabase.from("zoho_tokens").update({
      access_token: refreshed.access_token,
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", 1);

    return refreshed.access_token;
  }

  return data.access_token;
}

module.exports = { getValidToken };
