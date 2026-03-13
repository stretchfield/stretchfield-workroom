module.exports = (req, res) => {
  res.json({
    client_id_set: !!process.env.ZOHO_CLIENT_ID,
    client_id_prefix: process.env.ZOHO_CLIENT_ID ? process.env.ZOHO_CLIENT_ID.slice(0, 8) : "NOT SET",
    redirect_uri: process.env.ZOHO_REDIRECT_URI || "NOT SET",
    org_id_set: !!process.env.ZOHO_ORG_ID,
  });
};
