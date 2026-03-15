module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Basic protection — only allow calls from same origin or with internal secret
  const secret = req.headers['x-internal-secret'];
  const allowedOrigin = req.headers['origin'] || req.headers['referer'] || '';
  const isInternal = allowedOrigin.includes('stretchfield-workroom.vercel.app') || 
                     allowedOrigin.includes('localhost') ||
                     secret === process.env.INTERNAL_SECRET;
  if (!isInternal) return res.status(403).json({ error: 'Forbidden' });

  const { to, subject, html, type } = req.body;
  if (!to || !subject || !html) return res.status(400).json({ error: 'Missing required fields' });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return res.status(500).json({ error: 'Email service not configured' });

  // Use verified domain if available, fallback to resend dev address
  const fromAddress = process.env.EMAIL_FROM || 'Stretchfield WorkRoom <noreply@stretchfield.com>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromAddress, to: Array.isArray(to) ? to : [to], subject, html }),
    });
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message || 'Send failed' });
    return res.json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
