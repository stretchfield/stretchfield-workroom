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
      const { vendor_name, vendor_email, amount, currency, notes, rff_title, event_name, po_id } = req.body;

      // Find or create vendor contact in Zoho
      let vendorId = null;
      if (vendor_email) {
        const byEmail = await zohoGet(token, `/contacts?email=${encodeURIComponent(vendor_email)}&contact_type=vendor`);
        vendorId = byEmail.contacts?.[0]?.contact_id;
      }
      if (!vendorId) {
        const byName = await zohoGet(token, `/contacts?contact_name=${encodeURIComponent(vendor_name)}&contact_type=vendor`);
        vendorId = byName.contacts?.[0]?.contact_id;
      }
      if (!vendorId) {
        const newContact = await zohoPost(token, "/contacts", {
          contact_name: vendor_name,
          contact_type: "vendor",
          email: vendor_email || "",
        });
        vendorId = newContact.contact?.contact_id;
      }

      // Create PO in Zoho
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

      // Send PO to vendor email via Zoho if PO created successfully
      if (data.purchaseorder?.purchaseorder_id && vendor_email) {
        try {
          const poId = data.purchaseorder.purchaseorder_id;
          await fetch(`${BASE}/purchaseorders/${poId}/email?organization_id=${ORG_ID}`, {
            method: "POST",
            headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              to_mail_ids: [vendor_email],
              subject: `Purchase Order — ${rff_title || "Services"} | ${event_name || ""}`,
              body: `Dear ${vendor_name},

Please find attached your Purchase Order from Stretchfield for ${rff_title || "services"} at ${event_name || "the upcoming event"}.

Kindly review and submit your invoice upon completion of services.

Regards,
Stretchfield Finance Team`,
              send_from_org_email_id: true,
            }),
          });
        } catch (emailErr) {
          console.log("PO email send failed:", emailErr.message);
        }
      }

      return res.json(data);
    }

    res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// This file already has the handler — the create-po action needs to be added
