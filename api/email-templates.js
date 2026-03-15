const BASE_URL = 'https://stretchfield-workroom.vercel.app';

const baseStyle = `
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
`;

const header = (title) => `
  <div style="background: #060B14; padding: 28px 32px; border-radius: 8px 8px 0 0;">
    <div style="color: #00C8FF; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 4px;">STRETCHFIELD</div>
    <div style="color: #E8F0FF; font-size: 20px; font-weight: 800;">${title}</div>
  </div>
`;

const footer = () => `
  <div style="background: #060B14; padding: 20px 32px; border-radius: 0 0 8px 8px; text-align: center;">
    <div style="color: #3D5478; font-size: 11px; font-style: italic; margin-bottom: 6px;">We don't plan events. We engineer impact.</div>
    <div style="color: #1A2E4A; font-size: 10px;">© ${new Date().getFullYear()} Stretchfield · www.stretchfield.com</div>
  </div>
`;

const btn = (text, url) => `
  <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #00C8FF, #00E5C8); color: #060B14; padding: 12px 28px; border-radius: 8px; font-weight: 800; font-size: 13px; text-decoration: none; margin: 16px 0;">${text}</a>
`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding: 8px 0; color: #5A6E8A; font-size: 12px; font-weight: 700; text-transform: uppercase; width: 140px;">${label}</td>
    <td style="padding: 8px 0; color: #0A1628; font-size: 13px; font-weight: 600;">${value}</td>
  </tr>
`;

module.exports = {

  // ── Welcome / Login Created ──
  welcomeEmail: ({ name, email, password, role, loginUrl = BASE_URL }) => ({
    subject: `Welcome to Stretchfield WorkRoom — Your Login Details`,
    html: `<div style="${baseStyle}">
      ${header(`Welcome, ${name}!`)}
      <div style="padding: 28px 32px; background: #F0F2FA;">
        <p style="color: #0A1628; font-size: 14px; margin: 0 0 16px;">Your Stretchfield WorkRoom account has been created. Use the details below to log in.</p>
        <div style="background: #ffffff; border: 1px solid #C2C9DC; border-radius: 8px; padding: 20px 24px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Portal", "Stretchfield WorkRoom")}
            ${infoRow("Role", role)}
            ${infoRow("Email", email)}
            ${infoRow("Password", `<code style="background:#E8EBF4;padding:2px 8px;border-radius:4px;font-size:13px;">${password}</code>`)}
          </table>
        </div>
        <div style="background: #FFF3CD; border: 1px solid #F59E0B; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; color: #A86000; font-size: 12px;">
          ⚠ Please change your password after your first login via Account Settings.
        </div>
        ${btn("Log In to WorkRoom", loginUrl)}
      </div>
      ${footer()}
    </div>`
  }),

  // ── General Notification Email ──
  notificationEmail: ({ name, title, message, actionUrl, actionLabel = "View in WorkRoom" }) => ({
    subject: `Stretchfield WorkRoom — ${title}`,
    html: `<div style="${baseStyle}">
      ${header(title)}
      <div style="padding: 28px 32px; background: #F0F2FA;">
        <p style="color: #0A1628; font-size: 14px; margin: 0 0 20px;">Hi ${name || "there"},</p>
        <div style="background: #ffffff; border: 1px solid #C2C9DC; border-left: 4px solid #00C8FF; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
          <p style="color: #0A1628; font-size: 14px; margin: 0; line-height: 1.6;">${message}</p>
        </div>
        ${actionUrl ? btn(actionLabel, actionUrl) : ''}
        <p style="color: #5A6E8A; font-size: 12px; margin-top: 20px;">You're receiving this because you have an active account on Stretchfield WorkRoom.</p>
      </div>
      ${footer()}
    </div>`
  }),

  // ── Vendor Application Status ──
  vendorAppEmail: ({ vendorName, status, ceoNotes, loginUrl }) => ({
    subject: `Vendor Application ${status === 'approved' ? 'Approved' : status === 'declined' ? 'Declined' : 'Update'} — Stretchfield`,
    html: `<div style="${baseStyle}">
      ${header(`Application ${status === 'approved' ? '✓ Approved' : status === 'login-created' ? '🔑 Portal Access Ready' : '✗ Declined'}`)}
      <div style="padding: 28px 32px; background: #F0F2FA;">
        <p style="color: #0A1628; font-size: 14px; margin: 0 0 16px;">Re: <strong>${vendorName}</strong> Vendor Application</p>
        ${status === 'approved' ? `<div style="background:#E6FAF5;border:1px solid #00E5C8;border-radius:8px;padding:14px 18px;margin-bottom:16px;color:#008870;font-size:13px;">✓ Your vendor application has been approved by the CEO. Portal login will be created shortly.</div>` : ''}
        ${status === 'login-created' ? `<div style="background:#E6FAF5;border:1px solid #00E5C8;border-radius:8px;padding:14px 18px;margin-bottom:16px;color:#008870;font-size:13px;">🔑 Your Stretchfield vendor portal access has been created. Check your email for login details.</div>` : ''}
        ${status === 'declined' ? `<div style="background:#FEE2E2;border:1px solid #C0192A;border-radius:8px;padding:14px 18px;margin-bottom:16px;color:#C0192A;font-size:13px;">✗ Your vendor application requires revision.<br><br><strong>CEO Feedback:</strong> ${ceoNotes || 'Please contact us for details.'}</div>` : ''}
        ${loginUrl ? btn("Log In to WorkRoom", loginUrl) : ''}
      </div>
      ${footer()}
    </div>`
  }),

  // ── PO Created for Vendor ──
  poEmail: ({ vendorName, poNumber, eventName, amount, currency, notes }) => ({
    subject: `Purchase Order ${poNumber} — Stretchfield`,
    html: `<div style="${baseStyle}">
      ${header(`Purchase Order — ${poNumber}`)}
      <div style="padding: 28px 32px; background: #F0F2FA;">
        <p style="color: #0A1628; font-size: 14px; margin: 0 0 16px;">Dear <strong>${vendorName}</strong>,</p>
        <p style="color: #0A1628; font-size: 14px; margin: 0 0 20px;">A Purchase Order has been raised for your services. Please review and submit your invoice upon completion.</p>
        <div style="background: #ffffff; border: 1px solid #C2C9DC; border-radius: 8px; padding: 20px 24px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("PO Number", `<strong style="color:#00C8FF;">${poNumber}</strong>`)}
            ${infoRow("Event", eventName || "—")}
            ${infoRow("Amount", `<strong>${currency} ${parseFloat(amount).toLocaleString()}</strong>`)}
            ${notes ? infoRow("Notes", notes) : ''}
          </table>
        </div>
        <p style="color: #5A6E8A; font-size: 12px;">Please log in to the WorkRoom to submit your invoice once services are completed.</p>
        ${btn("Submit Invoice in WorkRoom", BASE_URL)}
      </div>
      ${footer()}
    </div>`
  }),

};
