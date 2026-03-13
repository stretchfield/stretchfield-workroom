module.exports = (req, res) => {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const redirectUri = process.env.ZOHO_REDIRECT_URI;
  const scope = [
    "ZohoBooks.contacts.CREATE",
    "ZohoBooks.contacts.UPDATE",
    "ZohoBooks.contacts.READ",
    "ZohoBooks.invoices.CREATE",
    "ZohoBooks.invoices.UPDATE",
    "ZohoBooks.invoices.READ",
    "ZohoBooks.expenses.CREATE",
    "ZohoBooks.expenses.READ",
    "ZohoBooks.vendorcredits.READ",
    "ZohoBooks.bills.CREATE",
    "ZohoBooks.bills.READ",
    "ZohoBooks.purchaseorders.CREATE",
    "ZohoBooks.purchaseorders.READ",
    "ZohoBooks.estimates.CREATE",
    "ZohoBooks.estimates.READ",
    "ZohoBooks.payments.READ",
    "ZohoBooks.settings.READ",
  ].join(",");

  const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${scope}&client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&access_type=offline&prompt=consent`;
  res.redirect(authUrl);
};
