const { createClient } = require('@supabase/supabase-js');
const { getValidToken } = require('./zoho-token');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = process.env.ZOHO_ORG_ID;
const BASE = "https://www.zohoapis.com/books/v3";

async function zohoGet(token, path) {
  const res = await fetch(`${BASE}${path}?organization_id=${ORG_ID}`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  return res.json();
}

async function zohoPost(token, path, body) {
  const res = await fetch(`${BASE}${path}?organization_id=${ORG_ID}`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

module.exports = async (req, res) => {
  const { action } = req.query;

  try {
    const token = await getValidToken();

    // ── GET: fetch data from Zoho ──
    if (req.method === "GET") {
      if (action === "invoices") {
        const data = await zohoGet(token, "/invoices");
        return res.json(data);
      }
      if (action === "contacts") {
        const data = await zohoGet(token, "/contacts");
        return res.json(data);
      }
      if (action === "expenses") {
        const data = await zohoGet(token, "/expenses");
        return res.json(data);
      }
      if (action === "bills") {
        const data = await zohoGet(token, "/bills");
        return res.json(data);
      }
      if (action === "estimates") {
        const data = await zohoGet(token, "/estimates");
        return res.json(data);
      }
      if (action === "purchaseorders") {
        const data = await zohoGet(token, "/purchaseorders");
        return res.json(data);
      }
      if (action === "payments") {
        const data = await zohoGet(token, "/customerpayments");
        return res.json(data);
      }
      if (action === "status") {
        const data = await zohoGet(token, "/invoices");
        return res.json({ connected: true, org_id: ORG_ID });
      }
    }

    // ── POST: push data to Zoho ──
    if (req.method === "POST") {
      const body = req.body;

      if (action === "create-contact") {
        const data = await zohoPost(token, "/contacts", body);
        return res.json(data);
      }
      if (action === "create-invoice") {
        const data = await zohoPost(token, "/invoices", body);
        return res.json(data);
      }
      if (action === "create-expense") {
        const data = await zohoPost(token, "/expenses", body);
        return res.json(data);
      }
      if (action === "create-bill") {
        const data = await zohoPost(token, "/bills", body);
        return res.json(data);
      }
      if (action === "create-estimate") {
        const data = await zohoPost(token, "/estimates", body);
        return res.json(data);
      }
      if (action === "sync-client") {
        // Sync a WorkRoom client to Zoho as a customer contact
        const { client } = body;
        const zohoContact = {
          contact_name: client.name,
          contact_type: "customer",
          email: client.email || "",
          phone: client.phone || "",
          company_name: client.company || client.name,
        };
        const data = await zohoPost(token, "/contacts", zohoContact);
        if (data.contact) {
          await supabase.from("clients").update({ zoho_contact_id: data.contact.contact_id }).eq("id", client.id);
        }
        return res.json(data);
      }
      if (action === "sync-vendor") {
        // Sync a WorkRoom vendor to Zoho as a vendor contact
        const { vendor } = body;
        const zohoContact = {
          contact_name: vendor.name,
          contact_type: "vendor",
          email: vendor.email || "",
          phone: vendor.phone || "",
        };
        const data = await zohoPost(token, "/contacts", zohoContact);
        return res.json(data);
      }
    }

    if (action === "create-po") {
      const { vendor_name, amount, currency, notes, rff_title, event_name } = req.body;
      // Find or create vendor contact in Zoho
      const contactsData = await zohoGet(token, `/contacts?contact_name=${encodeURIComponent(vendor_name)}&contact_type=vendor`);
      let vendorId = contactsData.contacts?.[0]?.contact_id;
      if (!vendorId) {
        const newContact = await zohoPost(token, "/contacts", { contact_name: vendor_name, contact_type: "vendor" });
        vendorId = newContact.contact?.contact_id;
      }
      const poData = {
        vendor_id: vendorId,
        line_items: [{
          description: `${rff_title || "Services"} — ${event_name || ""}`,
          rate: amount,
          quantity: 1,
        }],
        notes: notes || "",
        currency_code: currency || "GHS",
      };
      const data = await zohoPost(token, "/purchaseorders", poData);
      return res.json(data);
    }

    res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// This file already has the handler — the create-po action needs to be added
