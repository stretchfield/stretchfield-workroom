module.exports = (req, res) => {
  // Check all possible env var names
  res.json({
    ZOHO_CLIENT_ID: process.env.ZOHO_CLIENT_ID ? "SET" : "NOT SET",
    REACT_APP_ZOHO_CLIENT_ID: process.env.REACT_APP_ZOHO_CLIENT_ID ? "SET" : "NOT SET",
    ZOHO_REDIRECT_URI: process.env.ZOHO_REDIRECT_URI ? "SET" : "NOT SET",
    ZOHO_ORG_ID: process.env.ZOHO_ORG_ID ? "SET" : "NOT SET",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "NOT SET",
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL ? "SET" : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
};
