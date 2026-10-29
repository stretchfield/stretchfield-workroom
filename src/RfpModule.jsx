// Stretchfield WorkRoom — RFP module (self-contained).
// Exports: default RfpModule (Vendor Manager / CEO / Country Manager), VendorRfpPortal (vendors).
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#060B14", surface: "#0C1525", border: "#1A2E4A", cyan: "#00C8FF", amber: "#F5A524",
  teal: "#14B8A6", red: "#EF4444", textPrimary: "#E8F0FF", textMuted: "#6B84A8", textSecondary: "#9DB2D6",
};
const UNITS = ["lot", "pcs", "units", "unit", "day", "days", "persons", "person-days", "sets", "set", "package", "pax", "room-nights", "trips", "car/day", "bus/day", "hr", "screens/day", "pcs/day", "videos"];
const COUNTRY = {
  Ghana: { cur: "GHS", curName: "Ghana Cedis (GHS)", prefix: "ST", tax: "VAT, NHIL and GETFUND", foot: "Stretchfield Ghana | K574 Tomato Avenue, Botwe-Accra | 0302 526 313 / 0242 877 371 | info@stretchfield.com", contact: "info@stretchfield.com | 0302 526 313 | 0242 877 371" },
  Nigeria: { cur: "NGN", curName: "Nigerian Naira (NGN)", prefix: "NG", tax: "VAT", foot: "Stretchfield Nigeria | Lagos | info@stretchfield.com", contact: "info@stretchfield.com" },
};
const cfg = (c) => COUNTRY[c] || COUNTRY.Ghana;
const money = (n, c) => `${cfg(c).cur} ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now());
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const defaultInstructions = (c, tax) => [
  "Review all line items carefully. This document defines the full scope of services required.",
  "Prepare your own quotation covering the items that fall within your area of expertise.",
  "You may quote for one section only or multiple sections — clearly indicate which items you are covering.",
  `All quoted prices must be in ${cfg(c).curName}, ${tax === "inclusive" ? "inclusive" : "exclusive"} of all applicable taxes (${cfg(c).tax}).`,
  "Enter your unit price against each line assigned to you on the WorkRoom platform and attach your formal quotation.",
  "Submitted quotations must be returned by the deadline stated above.",
];
const defaultDeclaration = (c, tax, days) => [
  `All prices are in ${cfg(c).curName} and ${tax === "inclusive" ? "inclusive" : "exclusive"} of taxes unless stated otherwise.`,
  "Equipment and services quoted meet or exceed the specifications described.",
  `The quotation remains valid for a minimum of ${days} days from submission.`,
  "The vendor has the capacity and personnel to deliver all items within the agreed timeline.",
  "The vendor has no undisclosed conflict of interest with the client or the event.",
];

/* ---------- document generator (vendor copy hides internal costs) ---------- */
export function buildRfpHTML(rfp, sections, items, opts = {}) {
  const { onlyItemIds, showCosts = false } = opts;
  const c = rfp.country || "Ghana";
  const vis = (it) => !onlyItemIds || onlyItemIds.has(it.id);
  const top = sections.filter((s) => !s.parent_id).sort((a, b) => a.sort - b.sort);
  let n = 0;
  const rowsFor = (sec) => {
    const its = items.filter((i) => i.section_id === sec.id && vis(i)).sort((a, b) => a.sort - b.sort);
    if (!its.length) return "";
    const body = its.map((i) => {
      n += 1;
      const unit = Number(i.days) > 1 ? `${esc(i.unit)} × ${i.days} days` : esc(i.unit);
      return `<tr><td class="c">${n}</td><td>${esc(i.description)}${i.spec ? `<div class="spec">${esc(i.spec)}</div>` : ""}</td><td class="c">${i.qty}</td><td class="c">${unit}</td>${showCosts ? `<td class="r">${money(i.projected_unit_cost, c)}</td><td class="r">${money(Number(i.projected_unit_cost || 0) * Number(i.qty) * Number(i.days || 1), c)}</td>` : ""}</tr>`;
    }).join("");
    return `<tr class="sub"><td colspan="${showCosts ? 6 : 4}">${esc(sec.code ? sec.code + " — " : "")}${esc(sec.title)}</td></tr>${body}`;
  };
  const sectionBlocks = top.map((s) => {
    const kids = sections.filter((k) => k.parent_id === s.id).sort((a, b) => a.sort - b.sort);
    const rows = rowsFor(s) + kids.map(rowsFor).join("");
    if (!rows) return "";
    const notes = [s, ...kids].filter((x) => x.notes).map((x) => `<p><b>${esc(x.title)}:</b> ${esc(x.notes)}</p>`).join("");
    return `<h2>SECTION ${esc(s.code || "")} — ${esc(s.title).toUpperCase()}</h2><table class="t"><tr class="h"><th>#</th><th>Item / Description</th><th>Qty</th><th>Unit</th>${showCosts ? "<th>Proj. Unit</th><th>Proj. Total</th>" : ""}</tr>${rows}</table>${notes ? `<div class="notes"><h3>Scope Notes & Clarifications</h3>${notes}</div>` : ""}`;
  }).join("");
  const li = (arr) => `<ol>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`;
  const ul = (arr) => `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const meta = [["RFP Reference", rfp.reference], ["Issued by", `Stretchfield ${c} on behalf of ${rfp.client || "the Client"}`], ["Issue Date", rfp.issue_date], ["Event", rfp.event_name], ["Venue", rfp.venue], ["Event Date(s)", rfp.event_dates], ["Submission Deadline", rfp.deadline], ["Currency", cfg(c).curName], ["Submission Contact", rfp.contact || cfg(c).contact]]
    .filter(([, v]) => v).map(([k, v]) => `<tr><td class="k">${k}</td><td>${esc(v)}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(rfp.reference)}</title><style>
  body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;margin:32px;font-size:12px}
  .head{text-align:center;border-bottom:3px solid #0a3d62;padding-bottom:10px;margin-bottom:16px}
  .head h1{margin:0;font-size:22px;letter-spacing:2px;color:#0a3d62}.head div{color:#555;margin-top:4px}
  table{width:100%;border-collapse:collapse}.meta td{padding:6px 8px;border:1px solid #d8dee6}.meta .k{background:#eef3f8;font-weight:bold;width:28%}
  h2{background:#0a3d62;color:#fff;padding:7px 10px;font-size:13px;margin:22px 0 0}h3{font-size:12px;color:#0a3d62}
  .t th{background:#eef3f8;border:1px solid #d8dee6;padding:6px;text-align:left}.t td{border:1px solid #d8dee6;padding:6px;vertical-align:top}
  .sub td{background:#f7f9fb;font-weight:bold;color:#0a3d62}.c{text-align:center}.r{text-align:right}.spec{color:#666;font-size:11px;margin-top:2px}
  .notes{border-left:3px solid #0a3d62;padding:4px 12px;margin-top:8px;background:#fafcfe}.sig{margin-top:40px;display:flex;gap:60px}.sig div{flex:1;border-top:1px solid #333;padding-top:4px}
  .foot{margin-top:30px;border-top:1px solid #ccc;padding-top:8px;text-align:center;color:#666;font-size:10px}tr{page-break-inside:avoid}
  </style></head><body>
  <div class="head"><h1>REQUEST FOR PROPOSAL</h1><div>Event Services — Itemized Quotation Schedule</div><div><b>${esc(rfp.event_name || rfp.title)}</b></div></div>
  <table class="meta">${meta}</table>
  <h2>INSTRUCTIONS TO VENDORS</h2>${li((rfp.instructions || "").split("\n").filter(Boolean))}
  ${sectionBlocks}
  <h2>VENDOR DECLARATION</h2><p>By submitting this quotation, the vendor confirms that:</p>${ul((rfp.declaration || "").split("\n").filter(Boolean))}
  <div class="sig"><div>Company Name &amp; Authorised Signatory</div><div>Date</div></div>
  <div class="foot">${esc(cfg(c).foot)}<br>Confidential — For Quotation Purposes Only</div></body></html>`;
}
const openPrint = (html) => { const w = window.open("", "_blank"); if (!w) return alert("Please allow pop-ups to view the document."); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); };

/* ---------- small UI helpers ---------- */
const inp = { width: "100%", padding: "8px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const Btn = ({ children, onClick, color = T.cyan, disabled, ghost, small }) => (
  <button onClick={onClick} disabled={disabled} style={{ background: ghost ? "none" : color, border: `1px solid ${ghost ? T.border : color}`, color: ghost ? T.textSecondary : "#04101c", padding: small ? "5px 10px" : "9px 16px", borderRadius: 8, fontWeight: 800, fontSize: small ? 11 : 13, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>{children}</button>
);
const Field = ({ label, children, span }) => (<div style={{ gridColumn: span ? "1/-1" : undefined }}><label style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>{label}</label>{children}</div>);
const STATUS = { draft: [T.textMuted, "Draft"], pending_ceo: [T.amber, "Pending CEO"], returned: [T.red, "Returned"], approved: [T.teal, "Approved"], closed: [T.textMuted, "Closed"] };
const Badge = ({ s }) => { const [c, l] = STATUS[s] || STATUS.draft; return <span style={{ background: c + "22", color: c, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{l}</span>; };

/* ---------- data loading ---------- */
async function loadFull(id) {
  const [{ data: rfp }, { data: sections }, { data: items }, { data: images }] = await Promise.all([
    supabase.from("rfp_documents").select("*").eq("id", id).single(),
    supabase.from("rfp_sections").select("*").eq("rfp_id", id).order("sort"),
    supabase.from("rfp_items").select("*").eq("rfp_id", id).order("sort"),
    supabase.from("rfp_images").select("*").eq("rfp_id", id),
  ]);
  return { rfp, sections: sections || [], items: items || [], images: images || [] };
}
const projectedTotal = (items) => items.reduce((a, i) => a + Number(i.projected_unit_cost || 0) * Number(i.qty || 0) * Number(i.days || 1), 0);

/* ============================== MAIN ============================== */
export default function RfpModule({ user, activeCountry = "Ghana" }) {
  const role = user?.role;
  const isVM = role === "Vendor Manager";
  const isApprover = role === "CEO" || role === "Country Manager";
  const [list, setList] = useState([]);
  const [view, setView] = useState({ mode: "list" }); // list | build | review
  const load = useCallback(async () => {
    let q = supabase.from("rfp_documents").select("*").order("created_at", { ascending: false });
    if (activeCountry && activeCountry !== "All") q = q.eq("country", activeCountry);
    const { data } = await q; setList(data || []);
  }, [activeCountry]);
  useEffect(() => { load(); }, [load]);

  if (view.mode === "build") return <RfpBuilder user={user} country={activeCountry} rfpId={view.id} onClose={() => { setView({ mode: "list" }); load(); }} />;
  if (view.mode === "review") return <RfpReview user={user} rfpId={view.id} canApprove={isApprover} isVM={isVM} onClose={() => { setView({ mode: "list" }); load(); }} />;

  return (
    <div style={{ padding: 24, color: T.textPrimary }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div><div style={{ fontSize: 22, fontWeight: 900 }}>Request for Proposals</div><div style={{ color: T.textMuted, fontSize: 13 }}>Build the RFP → CEO approves → assign vendors → vendors quote line by line</div></div>
        {isVM && <Btn onClick={() => setView({ mode: "build" })}>+ New RFP</Btn>}
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {list.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>No RFPs yet</div>}
        {list.map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{r.reference} <span style={{ color: T.textMuted, fontWeight: 600 }}>— {r.event_name || r.title}</span></div>
              <div style={{ color: T.textMuted, fontSize: 12 }}>{r.client} · {r.created_by_name} · {new Date(r.created_at).toLocaleDateString()}</div>
            </div>
            <Badge s={r.status} />
            {isVM && (r.status === "draft" || r.status === "returned") && <Btn small ghost onClick={() => setView({ mode: "build", id: r.id })}>Edit</Btn>}
            <Btn small onClick={() => setView({ mode: "review", id: r.id })}>{isApprover && r.status === "pending_ceo" ? "Review" : "Open"}</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== BUILDER ============================== */
function RfpBuilder({ user, country, rfpId, onClose }) {
  const c0 = country === "All" ? "Ghana" : country;
  const [step, setStep] = useState(1);
  const [lib, setLib] = useState([]);
  const [events, setEvents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [rfp, setRfp] = useState({ id: rfpId || null, country: c0, currency: cfg(c0).cur, tax_mode: "exclusive", validity_days: 14, issue_date: new Date().toISOString().slice(0, 10), deadline: "", contact: cfg(c0).contact, title: "", client: "", event_name: "", event_dates: "", venue: "", project_id: "", reference: "", tag: "AV", status: "draft" });
  const [instr, setInstr] = useState(defaultInstructions(c0, "exclusive").join("\n"));
  const [decl, setDecl] = useState(defaultDeclaration(c0, "exclusive", 14).join("\n"));
  const [secs, setSecs] = useState([]); // {key,parentKey,code,title,notes,items:[{key,description,spec,qty,unit,days,cost,checked}]}
  const [open, setOpen] = useState({});
  const set = (k, v) => setRfp((r) => ({ ...r, [k]: v }));

  useEffect(() => {
    (async () => {
      const { data: l } = await supabase.from("rfp_library_items").select("*").order("sort"); setLib(l || []);
      const { data: p } = await supabase.from("projects").select("*").order("created_at", { ascending: false }); setEvents((p || []).filter((x) => !c0 || !x.country || x.country === c0));
      if (rfpId) {
        const f = await loadFull(rfpId);
        if (f.rfp) { setRfp((r) => ({ ...r, ...f.rfp })); setInstr(f.rfp.instructions || ""); setDecl(f.rfp.declaration || ""); }
        const keyOf = {}; f.sections.forEach((s) => (keyOf[s.id] = s.id));
        setSecs(f.sections.map((s) => ({ key: s.id, parentKey: s.parent_id, code: s.code, title: s.title, notes: s.notes || "", items: f.items.filter((i) => i.section_id === s.id).sort((a, b) => a.sort - b.sort).map((i) => ({ key: i.id, description: i.description, spec: i.spec || "", qty: i.qty, unit: i.unit, days: i.days, cost: i.projected_unit_cost ?? "", checked: true })) })));
      }
    })();
  }, [rfpId, c0]);

  const libSections = useMemo(() => { const m = {}; lib.forEach((l) => { (m[l.section_code] ||= { code: l.section_code, title: l.section_title, subs: {} }); (m[l.section_code].subs[l.subsection] ||= []).push(l); }); return Object.values(m); }, [lib]);

  const libItems = (subTitle) => (lib.filter((l) => l.subsection === subTitle).map((l) => ({ key: uid(), description: l.description, spec: "", qty: 1, unit: l.default_unit || "lot", days: 1, cost: "", checked: false })));
  const addFromLibrary = (sectionCode, subTitle) => {
    const ls = libSections.find((s) => s.code === sectionCode);
    const key = uid();
    setSecs((s) => [...s, { key, parentKey: null, code: subTitle.split(" ")[0], title: subTitle.replace(/^\S+\s/, ""), notes: "", items: libItems(subTitle) }]);
    setOpen((o) => ({ ...o, [key]: true }));
  };
  const addBlank = () => { const key = uid(); setSecs((s) => [...s, { key, parentKey: null, code: "", title: "New section", notes: "", items: [] }]); setOpen((o) => ({ ...o, [key]: true })); };
  const addChild = (parent) => {
    const name = window.prompt("Sub-section name (e.g. Side Event Room 1):"); if (!name) return;
    const key = uid(); const lbs = lib.filter((l) => (l.subsection.split(" ")[0] === parent.code)).map((l) => l.subsection)[0];
    setSecs((s) => [...s, { key, parentKey: parent.key, code: "", title: name, notes: "", items: lbs ? libItems(lbs) : [] }]); setOpen((o) => ({ ...o, [key]: true }));
  };
  const patchSec = (key, p) => setSecs((s) => s.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const patchItem = (sk, ik, p) => setSecs((s) => s.map((x) => (x.key === sk ? { ...x, items: x.items.map((i) => (i.key === ik ? { ...i, ...p } : i)) } : x)));
  const addCustom = (sk) => setSecs((s) => s.map((x) => (x.key === sk ? { ...x, items: [...x.items, { key: uid(), description: "", spec: "", qty: 1, unit: "lot", days: 1, cost: "", checked: true }] } : x)));
  const removeSec = (key) => setSecs((s) => s.filter((x) => x.key !== key && x.parentKey !== key));

  const pickEvent = (id) => {
    const p = events.find((e) => String(e.id) === String(id)); set("project_id", id);
    if (p) setRfp((r) => ({ ...r, project_id: id, client: p.client || r.client, event_name: p.name || r.event_name, venue: p.venue || r.venue, event_dates: p.event_date || r.event_dates, title: p.name || r.title }));
  };

  const counts = useMemo(() => { const it = secs.flatMap((s) => s.items.filter((i) => i.checked && i.description)); return { n: it.length, total: it.reduce((a, i) => a + Number(i.cost || 0) * Number(i.qty || 0) * Number(i.days || 1), 0) }; }, [secs]);

  async function genRef() {
    const { count } = await supabase.from("rfp_documents").select("id", { count: "exact", head: true });
    const yy = String(new Date().getFullYear()).slice(2);
    return `RFP-${cfg(rfp.country).prefix}${yy}${String((count || 0) + 1).padStart(3, "0")}-${(rfp.tag || "EVT").toUpperCase()}`;
  }
  async function save(submit) {
    if (!rfp.event_name) return alert("Please enter the event name (step 1).");
    if (!counts.n) return alert("Tick at least one line item.");
    setSaving(true);
    try {
      const reference = rfp.reference || (await genRef());
      const doc = { reference, title: rfp.title || rfp.event_name, project_id: rfp.project_id || null, client: rfp.client, event_name: rfp.event_name, event_dates: rfp.event_dates, venue: rfp.venue, country: rfp.country, currency: cfg(rfp.country).cur, issue_date: rfp.issue_date || null, deadline: rfp.deadline || null, tax_mode: rfp.tax_mode, validity_days: rfp.validity_days, contact: rfp.contact, instructions: instr, declaration: decl, status: submit ? "pending_ceo" : "draft", created_by: user.id, created_by_name: user.name, return_reason: null, ...(submit ? { submitted_at: new Date().toISOString() } : {}) };
      let id = rfp.id;
      if (id) { const { error } = await supabase.from("rfp_documents").update(doc).eq("id", id); if (error) throw error; await supabase.from("rfp_sections").delete().eq("rfp_id", id); }
      else { const { data, error } = await supabase.from("rfp_documents").insert(doc).select().single(); if (error) throw error; id = data.id; }
      const idOf = {}; secs.forEach((s) => (idOf[s.key] = uid()));
      const secRows = secs.map((s, i) => ({ id: idOf[s.key], rfp_id: id, parent_id: s.parentKey ? idOf[s.parentKey] : null, code: s.code, title: s.title, notes: s.notes, sort: i }));
      if (secRows.length) { const { error } = await supabase.from("rfp_sections").insert(secRows); if (error) throw error; }
      let line = 0; const itemRows = [];
      secs.forEach((s) => s.items.filter((i) => i.checked && i.description).forEach((i, k) => { line += 1; itemRows.push({ rfp_id: id, section_id: idOf[s.key], line_no: line, description: i.description, spec: i.spec, qty: Number(i.qty) || 1, unit: i.unit, days: Number(i.days) || 1, projected_unit_cost: i.cost === "" ? null : Number(i.cost), sort: k }); }));
      if (itemRows.length) { const { error } = await supabase.from("rfp_items").insert(itemRows); if (error) throw error; }
      if (submit) {
        const { data: ceos } = await supabase.from("profiles").select("id").eq("role", "CEO");
        for (const c of ceos || []) await supabase.from("notifications").insert({ user_id: c.id, title: "RFP awaiting approval", message: `${reference} — ${rfp.event_name} was submitted by ${user.name}.`, type: "rff" });
      }
      onClose();
    } catch (e) { alert("Save failed: " + (e.message || e)); } finally { setSaving(false); }
  }
  const previewDoc = () => {
    const secRows = secs.map((s, i) => ({ id: s.key, parent_id: s.parentKey, code: s.code, title: s.title, notes: s.notes, sort: i }));
    const itemRows = secs.flatMap((s) => s.items.filter((i) => i.checked && i.description).map((i, k) => ({ id: i.key, section_id: s.key, description: i.description, spec: i.spec, qty: i.qty, unit: i.unit, days: i.days, sort: k })));
    openPrint(buildRfpHTML({ ...rfp, reference: rfp.reference || "RFP-DRAFT", instructions: instr, declaration: decl }, secRows, itemRows));
  };

  const steps = ["1 Header", "2 Checklist", "3 Terms", "4 Preview & Submit"];
  return (
    <div style={{ padding: 24, color: T.textPrimary }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>{rfpId ? "Edit RFP" : "New RFP"} <span style={{ color: T.textMuted, fontSize: 14 }}>{rfp.reference}</span></div>
        <Btn ghost onClick={onClose}>← Back</Btn>
      </div>
      {rfp.status === "returned" && rfp.return_reason && <div style={{ background: T.red + "18", border: `1px solid ${T.red}50`, borderRadius: 10, padding: 12, marginBottom: 12 }}><b>Returned by CEO:</b> {rfp.return_reason}</div>}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>{steps.map((s, i) => <div key={s} onClick={() => setStep(i + 1)} style={{ cursor: "pointer", padding: "8px 14px", borderRadius: 8, fontWeight: 800, fontSize: 12, background: step === i + 1 ? T.cyan : T.surface, color: step === i + 1 ? "#04101c" : T.textSecondary, border: `1px solid ${T.border}` }}>{s}</div>)}</div>

      {step === 1 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Link to event (optional)" span><select style={inp} value={rfp.project_id || ""} onChange={(e) => pickEvent(e.target.value)}><option value="">— select event —</option>{events.map((e) => <option key={e.id} value={e.id}>{e.name} {e.client ? `— ${e.client}` : ""}</option>)}</select></Field>
          <Field label="Event name"><input style={inp} value={rfp.event_name || ""} onChange={(e) => set("event_name", e.target.value)} /></Field>
          <Field label="Client / issued on behalf of"><input style={inp} value={rfp.client || ""} onChange={(e) => set("client", e.target.value)} /></Field>
          <Field label="Event date(s)"><input style={inp} value={rfp.event_dates || ""} onChange={(e) => set("event_dates", e.target.value)} placeholder="e.g. 11–12 June 2026" /></Field>
          <Field label="Venue"><input style={inp} value={rfp.venue || ""} onChange={(e) => set("venue", e.target.value)} /></Field>
          <Field label="Reference tag (e.g. AV, EVENT)"><input style={inp} value={rfp.tag || ""} onChange={(e) => set("tag", e.target.value)} disabled={!!rfp.reference} /></Field>
          <Field label="Issue date"><input type="date" style={inp} value={rfp.issue_date || ""} onChange={(e) => set("issue_date", e.target.value)} /></Field>
          <Field label="Submission deadline"><input type="date" style={inp} value={rfp.deadline || ""} onChange={(e) => set("deadline", e.target.value)} /></Field>
          <Field label="Tax treatment"><select style={inp} value={rfp.tax_mode} onChange={(e) => { set("tax_mode", e.target.value); setInstr(defaultInstructions(rfp.country, e.target.value).join("\n")); setDecl(defaultDeclaration(rfp.country, e.target.value, rfp.validity_days).join("\n")); }}><option value="exclusive">Exclusive of taxes</option><option value="inclusive">Inclusive of taxes</option></select></Field>
          <Field label="Price validity (days)"><input type="number" style={inp} value={rfp.validity_days} onChange={(e) => { set("validity_days", e.target.value); setDecl(defaultDeclaration(rfp.country, rfp.tax_mode, e.target.value).join("\n")); }} /></Field>
          <Field label="Submission contact" span><input style={inp} value={rfp.contact || ""} onChange={(e) => set("contact", e.target.value)} /></Field>
          <div style={{ gridColumn: "1/-1", color: T.textMuted, fontSize: 12 }}>Currency: <b style={{ color: T.cyan }}>{cfg(rfp.country).curName}</b> (set by country: {rfp.country})</div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Add a section from the library</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {libSections.flatMap((s) => Object.keys(s.subs).map((sub) => <button key={sub} onClick={() => addFromLibrary(s.code, sub)} style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.textSecondary, padding: "5px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer" }}>+ {sub}</button>))}
              <button onClick={addBlank} style={{ background: "none", border: `1px dashed ${T.cyan}`, color: T.cyan, padding: "5px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer" }}>+ Blank section</button>
            </div>
          </div>
          {secs.filter((s) => !s.parentKey).map((s) => (
            <React.Fragment key={s.key}>
              <SectionCard s={s} open={open[s.key]} toggle={() => setOpen((o) => ({ ...o, [s.key]: !o[s.key] }))} patchSec={patchSec} patchItem={patchItem} addCustom={addCustom} removeSec={removeSec} onChild={() => addChild(s)} cur={rfp.country} />
              {secs.filter((k) => k.parentKey === s.key).map((k) => <div key={k.key} style={{ marginLeft: 28 }}><SectionCard s={k} open={open[k.key]} toggle={() => setOpen((o) => ({ ...o, [k.key]: !o[k.key] }))} patchSec={patchSec} patchItem={patchItem} addCustom={addCustom} removeSec={removeSec} cur={rfp.country} /></div>)}
            </React.Fragment>
          ))}
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 8 }}>{counts.n} lines selected · internal projected total <b style={{ color: T.amber }}>{money(counts.total, rfp.country)}</b> (internal only, never shown to vendors)</div>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, display: "grid", gap: 14 }}>
          <Field label="Instructions to vendors (one per line)"><textarea style={{ ...inp, minHeight: 150 }} value={instr} onChange={(e) => setInstr(e.target.value)} /></Field>
          <Field label="Vendor declaration (one per line)"><textarea style={{ ...inp, minHeight: 130 }} value={decl} onChange={(e) => setDecl(e.target.value)} /></Field>
        </div>
      )}

      {step === 4 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ marginBottom: 12 }}><b>{rfp.event_name || "(no event name)"}</b> · {counts.n} line items · projected {money(counts.total, rfp.country)}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn ghost onClick={previewDoc}>Preview document</Btn>
            <Btn ghost disabled={saving} onClick={() => save(false)}>{saving ? "Saving…" : "Save draft"}</Btn>
            <Btn color={T.teal} disabled={saving} onClick={() => save(true)}>Submit to CEO for approval</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({ s, open, toggle, patchSec, patchItem, addCustom, removeSec, onChild, cur }) {
  const n = s.items.filter((i) => i.checked).length;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" }} onClick={toggle}>
        <span style={{ color: T.cyan }}>{open ? "▾" : "▸"}</span>
        <input onClick={(e) => e.stopPropagation()} value={s.code} onChange={(e) => patchSec(s.key, { code: e.target.value })} placeholder="Code" style={{ ...inp, width: 60 }} />
        <input onClick={(e) => e.stopPropagation()} value={s.title} onChange={(e) => patchSec(s.key, { title: e.target.value })} style={{ ...inp, flex: 1 }} />
        <span style={{ color: T.textMuted, fontSize: 12 }}>{n} selected</span>
        {onChild && <Btn small ghost onClick={(e) => { e.stopPropagation(); onChild(); }}>+ Sub-section</Btn>}
        <Btn small ghost color={T.red} onClick={(e) => { e.stopPropagation(); removeSec(s.key); }}>Remove</Btn>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "28px 1.6fr 1fr 70px 100px 60px 100px", gap: 6, color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", margin: "4px 0" }}><span /><span>Item</span><span>Spec / notes</span><span>Qty</span><span>Unit</span><span>Days</span><span>Proj. cost/unit</span></div>
          {s.items.map((i) => (
            <div key={i.key} style={{ display: "grid", gridTemplateColumns: "28px 1.6fr 1fr 70px 100px 60px 100px", gap: 6, marginBottom: 4, alignItems: "center", opacity: i.checked ? 1 : 0.55 }}>
              <input type="checkbox" checked={i.checked} onChange={(e) => patchItem(s.key, i.key, { checked: e.target.checked })} />
              <input style={inp} value={i.description} onChange={(e) => patchItem(s.key, i.key, { description: e.target.value })} />
              <input style={inp} value={i.spec} onChange={(e) => patchItem(s.key, i.key, { spec: e.target.value })} />
              <input style={inp} type="number" min="0" value={i.qty} onChange={(e) => patchItem(s.key, i.key, { qty: e.target.value, checked: true })} />
              <select style={inp} value={i.unit} onChange={(e) => patchItem(s.key, i.key, { unit: e.target.value })}>{[...new Set([i.unit, ...UNITS])].map((u) => <option key={u}>{u}</option>)}</select>
              <input style={inp} type="number" min="1" value={i.days} onChange={(e) => patchItem(s.key, i.key, { days: e.target.value })} />
              <input style={inp} type="number" min="0" value={i.cost} onChange={(e) => patchItem(s.key, i.key, { cost: e.target.value })} placeholder={cfg(cur).cur} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "flex-start" }}>
            <Btn small ghost onClick={() => addCustom(s.key)}>+ Custom line</Btn>
            <textarea style={{ ...inp, minHeight: 44 }} placeholder="Scope notes & clarifications for this section (printed on the document)" value={s.notes} onChange={(e) => patchSec(s.key, { notes: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== REVIEW / APPROVE / ASSIGN ============================== */
function RfpReview({ user, rfpId, canApprove, isVM, onClose }) {
  const [d, setD] = useState(null);
  const [reason, setReason] = useState("");
  const [vendors, setVendors] = useState([]);
  const [assign, setAssign] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [files, setFiles] = useState([]);
  const [pickVendor, setPickVendor] = useState("");
  const [pickSecs, setPickSecs] = useState({});
  const refresh = useCallback(async () => {
    const f = await loadFull(rfpId); setD(f);
    const [{ data: a }, { data: q }, { data: fl }] = await Promise.all([
      supabase.from("rfp_item_assignments").select("*").eq("rfp_id", rfpId),
      supabase.from("rfp_item_quotes").select("*").eq("rfp_id", rfpId),
      supabase.from("rfp_quote_files").select("*").eq("rfp_id", rfpId)]);
    setAssign(a || []); setQuotes(q || []); setFiles(fl || []);
  }, [rfpId]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { // Approved vendors come from vendor_applications (profile_id = vendor login).
    supabase.from("vendor_applications").select("vendor_name, profile_id, status, country").ilike("status", "approved").then(({ data }) =>
      setVendors((data || []).filter((v) => v.profile_id).map((v) => ({ id: v.profile_id, name: v.vendor_name, company_name: v.vendor_name }))));
  }, []);
  if (!d || !d.rfp) return <div style={{ padding: 24, color: T.textMuted }}>Loading…</div>;
  const { rfp, sections, items } = d;
  const approved = rfp.status === "approved";

  async function approve() {
    let rffId = rfp.rff_id;
    if (!rffId) {
      const { data: rff, error: e1 } = await supabase.from("rffs").insert({ title: rfp.title || rfp.event_name, project_id: rfp.project_id || null, status: "approved", deadline: rfp.deadline || null, quote_deadline: rfp.deadline || null, amount: projectedTotal(items), client_name: rfp.client, event_name: rfp.event_name, description: `Generated from ${rfp.reference}`, approved: true, submitted_for_approval: true, rff_code: rfp.reference, country: rfp.country }).select().single();
      if (e1) return alert("Could not create the RFF: " + e1.message);
      rffId = rff.id;
      const budgets = sections.filter((x) => !x.parent_id).map((x) => { const ids = [x.id, ...sections.filter((k) => k.parent_id === x.id).map((k) => k.id)]; return { rff_id: rffId, category: `${x.code || ""} ${x.title}`.trim(), proposed_amount: projectedTotal(items.filter((i) => ids.includes(i.section_id))) }; }).filter((b) => b.proposed_amount > 0);
      if (budgets.length) await supabase.from("rff_budgets").insert(budgets);
      try { await supabase.from("rffs").update({ approved_by: user.name }).eq("id", rffId); } catch (e) { /* column type may differ; non-critical */ }
    }
    await supabase.from("rfp_documents").update({ status: "approved", rff_id: rffId, approved_by: user.id, approved_by_name: user.name, approved_at: new Date().toISOString(), return_reason: null }).eq("id", rfp.id);
    const { data: vms } = await supabase.from("profiles").select("id").eq("role", "Vendor Manager");
    for (const v of vms || []) await supabase.from("notifications").insert({ user_id: v.id, title: "RFP approved", message: `${rfp.reference} was approved by ${user.name}. You can now assign vendors.`, type: "rff" });
    refresh();
  }
  async function sendBack() {
    if (!reason.trim()) return alert("Please give a reason.");
    await supabase.from("rfp_documents").update({ status: "returned", return_reason: reason }).eq("id", rfp.id);
    if (rfp.created_by) await supabase.from("notifications").insert({ user_id: rfp.created_by, title: "RFP returned", message: `${rfp.reference}: ${reason}`, type: "rff" });
    refresh();
  }
  async function doAssign() {
    const v = vendors.find((x) => x.id === pickVendor); if (!v) return alert("Choose a vendor.");
    const ids = items.filter((i) => pickSecs[i.section_id]).map((i) => i.id);
    if (!ids.length) return alert("Tick at least one section.");
    const rows = ids.map((item_id) => ({ rfp_id: rfp.id, item_id, vendor_id: v.id, vendor_name: v.company_name || v.name, assigned_by: user.id }));
    const { error } = await supabase.from("rfp_item_assignments").upsert(rows, { onConflict: "item_id,vendor_id" });
    if (error) return alert(error.message);
    await supabase.from("notifications").insert({ user_id: v.id, title: "New RFP assigned", message: `You have been invited to quote on ${rfp.reference} — ${rfp.event_name}.`, type: "rff" });
    if (rfp.rff_id) {
      const { data: ex } = await supabase.from("rff_vendor_assignments").select("id").eq("rff_id", rfp.rff_id).eq("vendor_id", v.id);
      if (!ex || !ex.length) await supabase.from("rff_vendor_assignments").insert({ rff_id: rfp.rff_id, vendor_id: v.id, vendor_name: v.company_name || v.name, assigned_by: user.id, notified: true });
      await supabase.from("rffs").update({ status: "vendor-assigned" }).eq("id", rfp.rff_id);
    }
    setPickSecs({}); refresh();
  }
  async function unassign(a) { await supabase.from("rfp_item_assignments").delete().eq("id", a.id); refresh(); }

  const byVendor = {}; assign.forEach((a) => { (byVendor[a.vendor_id] ||= { name: a.vendor_name, rows: [] }).rows.push(a); });
  const itemsOf = (sid) => items.filter((i) => i.section_id === sid);

  return (
    <div style={{ padding: 24, color: T.textPrimary }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div><div style={{ fontSize: 22, fontWeight: 900 }}>{rfp.reference} <Badge s={rfp.status} /></div><div style={{ color: T.textMuted, fontSize: 13 }}>{rfp.event_name} · {rfp.client} · by {rfp.created_by_name}</div></div>
        <div style={{ display: "flex", gap: 8 }}><Btn ghost onClick={() => openPrint(buildRfpHTML(rfp, sections, items))}>Vendor copy / PDF</Btn><Btn ghost onClick={onClose}>← Back</Btn></div>
      </div>

      {(canApprove) && <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Internal budget summary (not visible to vendors)</div>
        <div style={{ color: T.amber, fontSize: 18, fontWeight: 900 }}>{money(projectedTotal(items), rfp.country)} <span style={{ color: T.textMuted, fontSize: 12, fontWeight: 600 }}>projected, {items.length} lines</span></div>
        {sections.filter((s) => !s.parent_id).map((s) => { const ids = [s.id, ...sections.filter((k) => k.parent_id === s.id).map((k) => k.id)]; const its = items.filter((i) => ids.includes(i.section_id)); return its.length ? <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSecondary, padding: "3px 0" }}><span>{s.code} {s.title} ({its.length})</span><span>{money(projectedTotal(its), rfp.country)}</span></div> : null; })}
        <div style={{ color: T.textMuted, fontSize: 11, marginTop: 6 }}><Btn small ghost onClick={() => openPrint(buildRfpHTML(rfp, sections, items, { showCosts: true }))}>Internal copy with costs</Btn></div>
      </div>}

      {canApprove && rfp.status === "pending_ceo" && (
        <div style={{ background: T.surface, border: `1px solid ${T.amber}50`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Decision</div>
          <textarea style={{ ...inp, minHeight: 50, marginBottom: 8 }} placeholder="Reason (required if returning)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div style={{ display: "flex", gap: 10 }}><Btn color={T.teal} onClick={approve}>Approve RFP</Btn><Btn ghost color={T.red} onClick={sendBack}>Return to Vendor Manager</Btn></div>
        </div>
      )}
      {rfp.status === "returned" && <div style={{ background: T.red + "18", border: `1px solid ${T.red}50`, borderRadius: 10, padding: 12, marginBottom: 14 }}><b>Returned:</b> {rfp.return_reason}</div>}
      {approved && <div style={{ color: T.teal, fontSize: 12, marginBottom: 10 }}>Approved by {rfp.approved_by_name} on {new Date(rfp.approved_at).toLocaleDateString()}.</div>}

      {/* Assignment */}
      {isVM && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 14, opacity: approved ? 1 : 0.5 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Assign vendors {approved ? "" : "— locked until the CEO approves"}</div>
          {approved && <>
            <select style={{ ...inp, marginBottom: 8 }} value={pickVendor} onChange={(e) => setPickVendor(e.target.value)}><option value="">— choose vendor —</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.company_name || v.name}</option>)}</select>
            {sections.map((s) => itemsOf(s.id).length ? <label key={s.id} style={{ display: "flex", gap: 8, fontSize: 12, padding: "2px 0", color: T.textSecondary }}><input type="checkbox" checked={!!pickSecs[s.id]} onChange={(e) => setPickSecs((p) => ({ ...p, [s.id]: e.target.checked }))} />{s.code} {s.title} <span style={{ color: T.textMuted }}>({itemsOf(s.id).length} lines)</span></label> : null)}
            <div style={{ marginTop: 8 }}><Btn onClick={doAssign}>Assign selected sections</Btn></div>
            {Object.entries(byVendor).map(([vid, v]) => {
              const total = v.rows.reduce((a, r) => { const q = quotes.find((x) => x.item_id === r.item_id && x.vendor_id === vid); const it = items.find((i) => i.id === r.item_id); return a + (q && it ? Number(q.unit_price) * it.qty * (it.days || 1) : 0); }, 0);
              const f = files.filter((x) => x.vendor_id === vid);
              return <div key={vid} style={{ borderTop: `1px solid ${T.border}`, marginTop: 10, paddingTop: 8 }}>
                <b>{v.name}</b> — {v.rows.length} lines · quoted {money(total, rfp.country)} · {quotes.filter((q) => q.vendor_id === vid).length}/{v.rows.length} priced
                {f.map((x) => <a key={x.id} href={x.file_url} target="_blank" rel="noreferrer" style={{ color: T.cyan, marginLeft: 10, fontSize: 12 }}>📎 {x.file_name}</a>)}
                <button onClick={() => v.rows.forEach(unassign)} style={{ marginLeft: 10, background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 11 }}>unassign</button>
              </div>;
            })}
          </>}
        </div>
      )}

      {/* Line-by-line comparison */}
      {approved && assign.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Quote comparison (line by line)</div>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead><tr style={{ color: T.textMuted, textAlign: "left" }}><th>#</th><th>Item</th><th>Qty×Days</th>{canApprove && <th>Projected</th>}<th>Vendor</th><th>Unit price</th><th>Line total</th></tr></thead>
            <tbody>{[...items].sort((a, b) => a.line_no - b.line_no).flatMap((i) => assign.filter((a) => a.item_id === i.id).map((a) => { const q = quotes.find((x) => x.item_id === i.id && x.vendor_id === a.vendor_id); const lt = q ? Number(q.unit_price) * i.qty * (i.days || 1) : null; const proj = Number(i.projected_unit_cost || 0) * i.qty * (i.days || 1); return <tr key={a.id} style={{ borderTop: `1px solid ${T.border}` }}><td>{i.line_no}</td><td>{i.description}</td><td>{i.qty} {i.unit}{i.days > 1 ? ` × ${i.days}` : ""}</td>{canApprove && <td>{money(proj, rfp.country)}</td>}<td>{a.vendor_name}</td><td>{q ? money(q.unit_price, rfp.country) : "—"}</td><td style={{ color: lt != null && canApprove && proj && lt > proj ? T.red : T.textPrimary }}>{lt != null ? money(lt, rfp.country) : "—"}</td></tr>; }))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================== VENDOR PORTAL ============================== */
export function VendorRfpPortal({ user, activeCountry = "Ghana" }) {
  const [rows, setRows] = useState([]); // {rfp, items, sections}
  const [prices, setPrices] = useState({});
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState([]);
  const load = useCallback(async () => {
    const { data: a } = await supabase.from("rfp_item_assignments").select("*").eq("vendor_id", user.id);
    const rfpIds = [...new Set((a || []).map((x) => x.rfp_id))]; const out = [];
    for (const id of rfpIds) {
      const f = await loadFull(id); const mine = new Set((a || []).filter((x) => x.rfp_id === id).map((x) => x.item_id));
      out.push({ ...f, mine });
    }
    setRows(out);
    const { data: q } = await supabase.from("rfp_item_quotes").select("*").eq("vendor_id", user.id);
    const p = {}, n = {}; (q || []).forEach((x) => { p[x.item_id] = x.unit_price; n[x.item_id] = x.notes || ""; }); setPrices(p); setNotes(n);
    const { data: fl } = await supabase.from("rfp_quote_files").select("*").eq("vendor_id", user.id); setFiles(fl || []);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);

  async function saveQuotes(r) {
    setBusy(true);
    const upserts = [...r.mine].filter((id) => prices[id] !== undefined && prices[id] !== "").map((id) => ({ rfp_id: r.rfp.id, item_id: id, vendor_id: user.id, unit_price: Number(prices[id]), notes: notes[id] || null, submitted_at: new Date().toISOString() }));
    const { error } = await supabase.from("rfp_item_quotes").upsert(upserts, { onConflict: "item_id,vendor_id" });
    setBusy(false); if (error) return alert(error.message);
    if (r.rfp.rff_id) {
      const tot = r.items.filter((i) => r.mine.has(i.id)).reduce((a, i) => a + (prices[i.id] ? Number(prices[i.id]) * i.qty * (i.days || 1) : 0), 0);
      await supabase.from("rff_vendor_assignments").update({ quote_amount: tot, quote_submitted_at: new Date().toISOString() }).eq("rff_id", r.rfp.rff_id).eq("vendor_id", user.id);
    }
    const { data: vms } = await supabase.from("profiles").select("id").eq("role", "Vendor Manager");
    for (const v of vms || []) await supabase.from("notifications").insert({ user_id: v.id, title: "RFP quote submitted", message: `${user.company_name || user.name} priced ${upserts.length} lines on ${r.rfp.reference}.`, type: "rff" });
    alert("Prices saved."); load();
  }
  async function upload(r, file) {
    if (!file) return; setBusy(true);
    const path = `${r.rfp.id}/${user.id}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error } = await supabase.storage.from("rfp-files").upload(path, file);
    if (error) { setBusy(false); return alert(error.message); }
    const { data } = supabase.storage.from("rfp-files").getPublicUrl(path);
    await supabase.from("rfp_quote_files").insert({ rfp_id: r.rfp.id, vendor_id: user.id, file_name: file.name, file_url: data.publicUrl });
    if (r.rfp.rff_id) await supabase.from("rff_vendor_assignments").update({ quote_document_url: data.publicUrl, quote_submitted_at: new Date().toISOString() }).eq("rff_id", r.rfp.rff_id).eq("vendor_id", user.id);
    setBusy(false); load();
  }

  return (
    <div style={{ padding: 24, color: T.textPrimary }}>
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 14 }}>My RFPs</div>
      {rows.length === 0 && <div style={{ color: T.textMuted }}>No RFPs assigned to you yet.</div>}
      {rows.map((r) => {
        const mine = r.items.filter((i) => r.mine.has(i.id)).sort((a, b) => a.line_no - b.line_no);
        const total = mine.reduce((a, i) => a + (prices[i.id] ? Number(prices[i.id]) * i.qty * (i.days || 1) : 0), 0);
        const myFiles = files.filter((f) => f.rfp_id === r.rfp.id);
        return (
          <div key={r.rfp.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div><b>{r.rfp.reference}</b> — {r.rfp.event_name}<div style={{ color: T.textMuted, fontSize: 12 }}>Deadline: {r.rfp.deadline || "—"} · prices {r.rfp.tax_mode} of taxes · valid {r.rfp.validity_days} days</div></div>
              <Btn small ghost onClick={() => openPrint(buildRfpHTML(r.rfp, r.sections, r.items, { onlyItemIds: r.mine }))}>View RFP document</Btn>
            </div>
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginTop: 10 }}>
              <thead><tr style={{ color: T.textMuted, textAlign: "left" }}><th>#</th><th>Item</th><th>Qty</th><th>Unit</th><th style={{ width: 130 }}>Unit price ({cfg(r.rfp.country).cur})</th><th>Line total</th></tr></thead>
              <tbody>{mine.map((i) => <tr key={i.id} style={{ borderTop: `1px solid ${T.border}` }}>
                <td>{i.line_no}</td><td>{i.description}{i.spec && <div style={{ color: T.textMuted }}>{i.spec}</div>}</td><td>{i.qty}{i.days > 1 ? ` × ${i.days}d` : ""}</td><td>{i.unit}</td>
                <td><input style={inp} type="number" min="0" value={prices[i.id] ?? ""} onChange={(e) => setPrices((p) => ({ ...p, [i.id]: e.target.value }))} /></td>
                <td>{prices[i.id] ? money(Number(prices[i.id]) * i.qty * (i.days || 1), r.rfp.country) : "—"}</td></tr>)}</tbody>
            </table>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900, color: T.amber }}>Total: {money(total, r.rfp.country)}</div>
              <Btn disabled={busy} onClick={() => saveQuotes(r)}>Save prices</Btn>
              <label style={{ color: T.cyan, cursor: "pointer", fontSize: 13 }}>📎 Attach quotation<input type="file" style={{ display: "none" }} onChange={(e) => upload(r, e.target.files[0])} /></label>
              {myFiles.map((f) => <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" style={{ color: T.textSecondary, fontSize: 12 }}>{f.file_name}</a>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
