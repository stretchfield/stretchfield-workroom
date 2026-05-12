export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: "https://workroom.stretchfield.com/" }
  });

  if (error || !data?.properties?.action_link) {
    return res.status(500).json({ error: error?.message || "Failed to generate link" });
  }

  res.json({ action_link: data.properties.action_link, name });
}
