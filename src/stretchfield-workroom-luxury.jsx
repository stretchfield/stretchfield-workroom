  const handleConvert = async (opp) => {
    if (!window.confirm(`Convert ${opp.company} to a Lead?`)) return;
    setSaving(true);
    const { data: newLead, error } = await supabase.from("leads").insert({
      company: opp.company,
      contact_name: opp.contact_name || "",
      email: opp.contact_email || opp.email || "",
      phone: opp.contact_phone || opp.phone || "",
      status: "new",
      value: 0,
      notes: `Converted from Opportunities.\n\nEvent Fit: ${opp.event_fit || ""}`,
      source: "Opportunities",
      created_by: user?.id,
      assigned_to: user?.id,
      assigned_name: user?.name || "",
    }).select().single();
    if (!error && newLead) {
      await supabase.from("opportunities").update({ status: "Converted", updated_at: new Date().toISOString() }).eq("id", opp.id);
      setSaving(false);
      load();
      if (onNavigate) onNavigate("crm");
    } else {
      console.error("Convert error:", error?.message);
      alert("Failed: " + (error?.message || "Unknown error"));
      setSaving(false);
    }
  };
  const inputStyle = { width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5, display: "block" };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>CEO · Finance</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Client Financials</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Set budgets, record spend and upload invoices per client event</div>
      </div>

      {/* Client + Event selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 24 }}>
        <div>
          <label style={labelStyle}>Select Client</label>
          <select value={selectedClient || ""} onChange={e => { setSelectedClient(e.target.value); setSelectedEvent(null); }}
            style={inputStyle}>
            <option value="">— Choose client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Select Event</label>
          <select value={selectedEvent || ""} onChange={e => setSelectedEvent(e.target.value)} style={inputStyle} disabled={!selectedClient}>
            <option value="">— Choose event —</option>
            {clientEvents.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {selectedEvent && (
        <>
          {/* Summary strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Agreed Budget", value: agreedBudget > 0 ? `GHS ${agreedBudget.toLocaleString()}` : "Not set", color: T.cyan },
              { label: "Total Recorded Spend", value: `GHS ${totalSpent.toLocaleString()}`, color: T.amber },
              { label: "Utilisation", value: agreedBudget > 0 ? spentPct + "%" : "—", color: spentPct > 90 ? T.red : T.teal },
            ].map((k, i) => (
              <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
                <div style={{ color: k.color, fontSize: 18, fontWeight: 900 }}>{k.value}</div>
                <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
            {["budget", "expenses", "invoices"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "9px 18px", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? T.cyan : "transparent"}`,
                color: tab === t ? T.cyan : T.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.06em", transition: "all 0.15s",
              }}>{t}</button>
            ))}
          </div>

          {/* Budget tab */}
          {tab === "budget" && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "22px 24px" }}>
              <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14, marginBottom: 18 }}>{currentBudget ? "Update Budget" : "Set Budget"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Agreed Budget (GHS)</label>
                  <input type="number" value={budgetForm.agreed_budget} onChange={e => setBudgetForm({ ...budgetForm, agreed_budget: e.target.value })} placeholder="e.g. 50000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Management Fee %</label>
                  <input type="number" min="15" max="30" value={budgetForm.management_fee_pct} onChange={e => setBudgetForm({ ...budgetForm, management_fee_pct: e.target.value })} placeholder="15–30" style={inputStyle} />
                </div>
              </div>
              {budgetForm.agreed_budget && (
                <div style={{ padding: "10px 14px", background: T.cyan + "10", border: `1px solid ${T.cyan}30`, borderRadius: 8, marginBottom: 16, fontSize: 12, color: T.cyan }}>
                  Management Fee: GHS {(parseFloat(budgetForm.agreed_budget) * parseFloat(budgetForm.management_fee_pct) / 100).toLocaleString()} ({budgetForm.management_fee_pct}%)
                </div>
              )}
              <button onClick={handleSaveBudget} disabled={saving || !budgetForm.agreed_budget} style={{
                background: T.cyan + "20", border: `1px solid ${T.cyan}40`, color: T.cyan,
                padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: !budgetForm.agreed_budget ? 0.5 : 1,
              }}>{saving ? "Saving..." : currentBudget ? "Update Budget" : "Save Budget"}</button>
            </div>
          )}

          {/* Expenses tab */}
          {tab === "expenses" && (
            <div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "22px 24px", marginBottom: 16 }}>
                <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Add Expense Entry</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} style={inputStyle}>
                      {["Venue","Catering","Production","Logistics","Management Fee","Other"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <input value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Brief description" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Amount (GHS)</label>
                    <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="0.00" style={inputStyle} />
                  </div>
                </div>
                <button onClick={handleAddExpense} disabled={saving || !expenseForm.amount} style={{
                  background: T.teal + "20", border: `1px solid ${T.teal}40`, color: T.teal,
                  padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: !expenseForm.amount ? 0.5 : 1,
                }}>+ Add Entry</button>
              </div>

              {/* Expense list */}
              {currentExpenses.length === 0 ? (
                <div style={{ color: T.textMuted, fontSize: 13, fontStyle: "italic", textAlign: "center", padding: 30 }}>No expenses recorded yet.</div>
              ) : (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        {["Category","Description","Amount",""].map((h, i) => (
                          <th key={i} style={{ padding: "12px 16px", textAlign: i === 2 ? "right" : "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentExpenses.map((e, i) => (
                        <tr key={e.id} style={{ borderBottom: i < currentExpenses.length - 1 ? `1px solid ${T.border}44` : "none" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ background: (categoryColors[e.category] || T.textMuted) + "20", color: categoryColors[e.category] || T.textMuted, border: `1px solid ${categoryColors[e.category] || T.textMuted}30`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700 }}>{e.category}</span>
                          </td>
                          <td style={{ padding: "12px 16px", color: T.textPrimary, fontSize: 13 }}>{e.description || "—"}</td>
                          <td style={{ padding: "12px 16px", color: T.amber, fontWeight: 700, fontSize: 13, textAlign: "right" }}>GHS {parseFloat(e.amount).toLocaleString()}</td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <button onClick={() => handleDeleteExpense(e.id)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16 }}
                              onMouseEnter={el => el.currentTarget.style.color = T.red}
                              onMouseLeave={el => el.currentTarget.style.color = T.textMuted}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: `1px solid ${T.border}` }}>
                        <td colSpan={2} style={{ padding: "12px 16px", color: T.textMuted, fontSize: 12, fontWeight: 700 }}>Total</td>
                        <td style={{ padding: "12px 16px", color: T.amber, fontWeight: 900, fontSize: 14, textAlign: "right" }}>GHS {totalSpent.toLocaleString()}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Invoices tab */}
          {tab === "invoices" && (
            <div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "22px 24px", marginBottom: 16 }}>
                <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Upload Invoice</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>Invoice Title</label>
                    <input value={invoiceForm.title} onChange={e => setInvoiceForm({ ...invoiceForm, title: e.target.value })} placeholder="e.g. Final Invoice — Brand Event 2025" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>File URL (Supabase Storage / Drive link)</label>
                    <input value={invoiceForm.file_url} onChange={e => setInvoiceForm({ ...invoiceForm, file_url: e.target.value })} placeholder="https://..." style={inputStyle} />
                  </div>
                </div>
                <button onClick={handleUploadInvoice} disabled={saving || !invoiceForm.title || !invoiceForm.file_url} style={{
                  background: T.cyan + "20", border: `1px solid ${T.cyan}40`, color: T.cyan,
                  padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, opacity: (!invoiceForm.title || !invoiceForm.file_url) ? 0.5 : 1,
                }}>Upload Invoice</button>
              </div>

              {currentInvoices.length === 0 ? (
                <div style={{ color: T.textMuted, fontSize: 13, fontStyle: "italic", textAlign: "center", padding: 30 }}>No invoices uploaded yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {currentInvoices.map(inv => (
                    <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ fontSize: 24 }}>📑</div>
                        <div>
                          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{inv.title}</div>
                          <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{new Date(inv.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <a href={inv.file_url} target="_blank" rel="noopener noreferrer" style={{ background: T.cyan + "18", border: `1px solid ${T.cyan}40`, color: T.cyan, padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>View</a>
                        <button onClick={() => handleDeleteInvoice(inv.id)} style={{ background: T.red + "18", border: `1px solid ${T.red}40`, color: T.red, padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {data.length > 0 && (
                <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, background: T.bg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: T.textMuted, fontSize: 11 }}>{data.length} records · Read-only view · Create and edit in Zoho Books</span>
                  <a href="https://books.zoho.com" target="_blank" rel="noopener noreferrer" style={{ color: "#E67E22", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Open Zoho Books ↗</a>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ClientFinanceView = ({ user }) => {
  const [clientInfo, setClientInfo] = useState(null);
  const [events, setEvents] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const load = async () => {
    let clientData = null;
    const { data: byProfile } = await supabase.from("clients").select("*").eq("profile_id", user.id).single();
    if (byProfile) { clientData = byProfile; }
    else {
      const { data: byEmail } = await supabase.from("clients").select("*").eq("email", user.email).single();
      if (byEmail) { clientData = byEmail; await supabase.from("clients").update({ profile_id: user.id }).eq("id", byEmail.id); }
    }
    if (!clientData) return;
    setClientInfo(clientData);
    const [ev, bud, exp, inv] = await Promise.all([
      supabase.from("projects").select("*").eq("client_id", clientData.id).eq("active_for_client", true),
      supabase.from("client_budgets").select("*").eq("client_id", clientData.id),
      supabase.from("client_expenses").select("*").eq("client_id", clientData.id),
      supabase.from("client_invoices").select("*").eq("client_id", clientData.id).order("created_at", { ascending: false }),
    ]);
    setEvents(ev.data || []);
    setBudgets(bud.data || []);
    setExpenses(exp.data || []);
    setInvoices(inv.data || []);
    if ((ev.data || []).length > 0 && !selectedEvent) setSelectedEvent((ev.data || [])[0].id);
  };

  useEffect(() => { load(); }, [user.id]);

  const currentBudget = budgets.find(b => b.project_id === selectedEvent);
  const currentExpenses = expenses.filter(e => e.project_id === selectedEvent);
  const currentInvoices = invoices.filter(i => i.project_id === selectedEvent);
  const currentEvent = events.find(e => e.id === selectedEvent);

  const agreedBudget = currentBudget?.agreed_budget || 0;
  const mgmtFeePct = currentBudget?.management_fee_pct || 15;
  const mgmtFee = agreedBudget * (mgmtFeePct / 100);
  const totalSpent = currentExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const remaining = agreedBudget - totalSpent;
  const spentPct = agreedBudget > 0 ? Math.min(100, Math.round((totalSpent / agreedBudget) * 100)) : 0;

  const categoryTotals = currentExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.amount || 0);
    return acc;
  }, {});

  const categoryColors = {
    "Venue": "#00C8FF", "Catering": "#00E5C8", "Production": "#C9A84C",
    "Logistics": "#3B7BFF", "Management Fee": "#E879F9", "Other": "#8BA3C7",
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Client Portal</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Budget & Financials</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Track your event spend and download invoices</div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>💰</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No financial data yet</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Budget information will appear here once your event is set up.</div>
        </div>
      ) : (
        <>
          {/* Event selector pills */}
          {events.length > 1 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
              {events.map(e => (
                <button key={e.id} onClick={() => setSelectedEvent(e.id)} style={{
                  padding: "6px 16px", borderRadius: 20, border: `1px solid ${selectedEvent === e.id ? T.cyan : T.border}`,
                  background: selectedEvent === e.id ? T.cyan + "20" : "none", color: selectedEvent === e.id ? T.cyan : T.textMuted,
                  cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", transition: "all 0.15s",
                }}>{e.name}</button>
              ))}
            </div>
          )}

          {currentEvent && (
            <>
              {/* Event title */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18 }}>{currentEvent.name}</div>
                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{currentEvent.phase} · Due {currentEvent.deadline || "TBD"}</div>
              </div>

              {/* KPI strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Agreed Budget", value: agreedBudget > 0 ? `GHS ${agreedBudget.toLocaleString()}` : "—", color: T.cyan },
                  { label: "Total Spent", value: totalSpent > 0 ? `GHS ${totalSpent.toLocaleString()}` : "—", color: T.amber },
                  { label: "Remaining", value: agreedBudget > 0 ? `GHS ${remaining.toLocaleString()}` : "—", color: remaining < 0 ? T.red : T.teal },
                  { label: "Mgmt Fee", value: agreedBudget > 0 ? `GHS ${mgmtFee.toLocaleString()} (${mgmtFeePct}%)` : "—", color: T.magenta },
                ].map((k, i) => (
                  <div key={i} style={{ padding: "16px 18px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
                    <div style={{ color: k.color, fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{k.value}</div>
                    <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Budget utilisation bar */}
              {agreedBudget > 0 && (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>Budget Utilisation</div>
                    <div style={{ color: spentPct > 90 ? T.red : spentPct > 70 ? T.amber : T.teal, fontWeight: 900, fontSize: 18 }}>{spentPct}%</div>
                  </div>
                  <div style={{ height: 12, background: T.border + "44", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: spentPct + "%", background: spentPct > 90 ? `linear-gradient(90deg,${T.amber},${T.red})` : `linear-gradient(90deg,${T.cyan},${T.teal})`, borderRadius: 6, transition: "width 0.6s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <div style={{ color: T.textMuted, fontSize: 11 }}>GHS {totalSpent.toLocaleString()} spent</div>
                    <div style={{ color: T.textMuted, fontSize: 11 }}>of GHS {agreedBudget.toLocaleString()}</div>
                  </div>
                </div>
              )}

              {/* Spend by category */}
              {Object.keys(categoryTotals).length > 0 && (
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 20 }}>
                  <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Spend by Category</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {Object.entries(categoryTotals).map(([cat, amt]) => {
                      const pct = agreedBudget > 0 ? Math.round((amt / agreedBudget) * 100) : 0;
                      const color = categoryColors[cat] || T.textMuted;
                      return (
                        <div key={cat}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                              <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600 }}>{cat}</span>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <span style={{ color: T.textMuted, fontSize: 11 }}>{pct}%</span>
                              <span style={{ color: color, fontWeight: 700, fontSize: 13 }}>GHS {amt.toLocaleString()}</span>
                            </div>
                          </div>
                          <div style={{ height: 5, background: T.border + "44", borderRadius: 3 }}>
                            <div style={{ height: "100%", width: pct + "%", background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Invoices */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 22px" }}>
                <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14, marginBottom: 16 }}>📄 Invoices</div>
                {currentInvoices.length === 0 ? (
                  <div style={{ color: T.textMuted, fontSize: 13, fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No invoices uploaded yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {currentInvoices.map(inv => (
                      <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: T.bg, border: `1px solid ${T.border}44`, borderRadius: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ fontSize: 22 }}>📑</div>
                          <div>
                            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{inv.title}</div>
                            <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{new Date(inv.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                          </div>
                        </div>
                        <a href={inv.file_url} target="_blank" rel="noopener noreferrer" style={{
                          background: T.cyan + "18", border: `1px solid ${T.cyan}40`, color: T.cyan,
                          padding: "7px 16px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                          textDecoration: "none", letterSpacing: "0.06em",
                        }}>Download</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

const ClientDashboard = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [clientInfo, setClientInfo] = useState(null);

  const [budgets, setBudgets] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    supabase.from('clients').select('*').eq('profile_id', user.id).single().then(({ data: clientData }) => {
      if (clientData) {
        setClientInfo(clientData);
        supabase.from('projects').select('*').eq('client_id', clientData.id).eq('active_for_client', true).then(({ data }) => setEvents(data || []));
        supabase.from('tasks').select('*').eq('visible_to_client', true).eq('client_id', clientData.id).then(({ data }) => setTasks(data || []));
        supabase.from('client_budgets').select('*').eq('client_id', clientData.id).then(({ data }) => setBudgets(data || []));
        supabase.from('client_invoices').select('*').eq('client_id', clientData.id).order('created_at', { ascending: false }).limit(3).then(({ data }) => setInvoices(data || []));
      } else {
        supabase.from('clients').select('*').eq('email', user.email).single().then(({ data: clientByEmail }) => {
          if (clientByEmail) {
            setClientInfo(clientByEmail);
            supabase.from('clients').update({ profile_id: user.id }).eq('id', clientByEmail.id);
            supabase.from('projects').select('*').eq('client_id', clientByEmail.id).eq('active_for_client', true).then(({ data }) => setEvents(data || []));
            supabase.from('tasks').select('*').eq('visible_to_client', true).eq('client_id', clientByEmail.id).then(({ data }) => setTasks(data || []));
            supabase.from('client_budgets').select('*').eq('client_id', clientByEmail.id).then(({ data }) => setBudgets(data || []));
            supabase.from('client_invoices').select('*').eq('client_id', clientByEmail.id).order('created_at', { ascending: false }).limit(3).then(({ data }) => setInvoices(data || []));
          }
        });
      }
    });
  }, [user.id]);

  const now3 = new Date();
  const greeting3 = now3.getHours() < 12 ? "Good Morning" : now3.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      {/* Client Header */}
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>{now3.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.02em" }}>{greeting3}, {user.name.split(" ")[0]}</h1>
        <div style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>{clientInfo?.company || "Track your event progress below."}</div>
      </div>
      {clientInfo?.company && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", background: T.cyan + "15", border: `1px solid ${T.cyan}30`, borderRadius: 20, marginBottom: 20 }}>
          <span style={{ fontSize: 13 }}>🏢</span>
          <span style={{ color: T.cyan, fontWeight: 700, fontSize: 12, letterSpacing: "0.04em" }}>{clientInfo.company}</span>
        </div>
      )}
      {events.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📁</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No events yet</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Your events will appear here once assigned.</div>
        </Card>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <Stat icon="📁" label="Your Events" value={events.length} color={T.accent} />
            <Stat icon="✅" label="Tasks Complete" value={tasks.filter(t => t.status === 'completed').length} color={T.blue} />
            <Stat icon="⏳" label="In Progress" value={tasks.filter(t => t.status === 'in-progress').length} color={T.orange} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {events.map(p => (
              <Card key={p.id} style={{ marginBottom: 0 }}>
                <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.name}</div>
                <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 12 }}>Deadline: {p.deadline}</div>
                <ProgressBar value={p.completion || 0} />
                <div style={{ color: T.textSecondary, fontSize: 12, marginTop: 6 }}>{p.completion || 0}% complete</div>
                {tasks.filter(t => t.project_id === p.id).length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Tasks</div>
                    {tasks.filter(t => t.project_id === p.id).map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
                        <div>
                          <div style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                          <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>Due {t.deadline}</div>
                        </div>
                        <Badge status={t.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Budget & Invoices Summary ── */}
      {(budgets.length > 0 || invoices.length > 0) && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15 }}>💰 Budget & Invoices</div>
            <span style={{ color: T.cyan, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>See full details in Budget & Invoices tab →</span>
          </div>

          {/* Budget summary per event */}
          {budgets.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 16 }}>
              {budgets.map(b => {
                const ev = events.find(e => e.id === b.project_id);
                if (!ev) return null;
                const agreedBudget = b.agreed_budget || 0;
                const mgmtFee = agreedBudget * ((b.management_fee_pct || 15) / 100);
                return (
                  <div key={b.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${T.cyan}`, borderRadius: 10, padding: "16px 18px" }}>
                    <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, marginBottom: 10 }}>{ev.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: T.textMuted, fontSize: 11 }}>Agreed Budget</span>
                      <span style={{ color: T.cyan, fontWeight: 700, fontSize: 12 }}>GHS {agreedBudget.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: T.textMuted, fontSize: 11 }}>Mgmt Fee ({b.management_fee_pct || 15}%)</span>
                      <span style={{ color: T.magenta, fontWeight: 700, fontSize: 12 }}>GHS {mgmtFee.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent invoices */}
          {invoices.length > 0 && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, marginBottom: 12 }}>📄 Recent Invoices</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {invoices.map(inv => (
                  <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}44`, borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>📑</span>
                      <div>
                        <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 12 }}>{inv.title}</div>
                        <div style={{ color: T.textMuted, fontSize: 10 }}>{new Date(inv.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </div>
                    </div>
                    <a href={inv.file_url} target="_blank" rel="noopener noreferrer" style={{ background: T.cyan + "18", border: `1px solid ${T.cyan}40`, color: T.cyan, padding: "5px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, textDecoration: "none" }}>Download</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


const ClientEventsView = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [clientInfo, setClientInfo] = useState(null);

  const load = async () => {
    if (!user?.id) return;
    let clientData = null;
    const { data: byProfile } = await supabase.from('clients').select('*').eq('profile_id', user.id).single();
    if (byProfile) {
      clientData = byProfile;
    } else {
      const { data: byEmail } = await supabase.from('clients').select('*').eq('email', user.email).single();
      if (byEmail) {
        clientData = byEmail;
        await supabase.from('clients').update({ profile_id: user.id }).eq('id', byEmail.id);
      }
    }
    if (clientData) {
      setClientInfo(clientData);
      const [ev, tk] = await Promise.all([
        supabase.from('projects').select('*').eq('client_id', clientData.id).eq('active_for_client', true),
        supabase.from('tasks').select('*').eq('client_id', clientData.id).eq('visible_to_client', true),
      ]);
      setEvents(ev.data || []);
      setTasks(tk.data || []);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  // Real-time updates
  useEffect(() => {
    const projectSub = supabase.channel('client-projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => load())
      .subscribe();
    const taskSub = supabase.channel('client-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(projectSub); supabase.removeChannel(taskSub); };
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}`, animation: "fadeUp 0.35s ease" }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Client Portal</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>My Events</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Your active engagements and task progress</div>
      </div>
      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📁</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No events assigned</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Events assigned to you will appear here.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {events.map(p => {
            const eventTasks = tasks.filter(t => t.project_id === p.id);
            const completedTasks = eventTasks.filter(t => t.status === 'completed').length;
            const inProgressTasks = eventTasks.filter(t => t.status === 'in-progress').length;
            return (
              <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 22px", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 24px ${T.cyan}10`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                {/* Event Header */}
                {(() => {
                  const daysLeft = p.deadline ? Math.ceil((new Date(p.deadline) - new Date()) / 86400000) : null;
                  const isOver = daysLeft !== null && daysLeft < 0;
                  const isToday = daysLeft === 0;
                  const isSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
                  const countdownColor = isOver ? T.red : isToday ? T.red : isSoon ? T.amber : T.teal;
                  const countdownBg = isOver ? T.red : isToday ? T.red : isSoon ? T.amber : T.teal;
                  const countdownLabel = isOver ? `${Math.abs(daysLeft)}d overdue` : isToday ? "Today!" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} to go`;
                  return (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: T.textPrimary, fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{p.name}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ background: T.cyan + "20", color: T.cyan, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{p.phase || "Planning"}</span>
                          {p.deadline && (
                            <span style={{ color: T.textMuted, fontSize: 11 }}>📅 {p.deadline}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                        {/* Completion */}
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 30, fontWeight: 900, color: p.completion >= 80 ? T.teal : p.completion >= 50 ? T.cyan : T.amber, lineHeight: 1 }}>{p.completion || 0}%</div>
                          <div style={{ color: T.textMuted, fontSize: 10 }}>Complete</div>
                        </div>
                        {/* Countdown pill */}
                        {daysLeft !== null && (
                          <div style={{ background: countdownBg + "18", border: `1px solid ${countdownBg}40`, borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: countdownColor, boxShadow: `0 0 5px ${countdownColor}`, flexShrink: 0 }} />
                            <span style={{ color: countdownColor, fontSize: 11, fontWeight: 800 }}>{countdownLabel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Event Progress Bar */}
                <ProgressBar value={p.completion || 0} height={10} color={p.completion >= 80 ? T.teal : p.completion >= 50 ? T.cyan : T.amber} />

                {/* Task Summary */}
                {eventTasks.length > 0 && (
                  <div style={{ display: "flex", gap: 12, marginTop: 12, marginBottom: 16 }}>
                    <div style={{ color: T.textMuted, fontSize: 12 }}>📋 {eventTasks.length} task{eventTasks.length > 1 ? "s" : ""}</div>
                    <div style={{ color: T.teal, fontSize: 12 }}>✅ {completedTasks} done</div>
                    <div style={{ color: T.cyan, fontSize: 12 }}>⚙️ {inProgressTasks} in progress</div>
                  </div>
                )}

                {/* Tasks Breakdown */}
                {eventTasks.length > 0 && (
                  <div style={{ borderTop: "1px solid " + T.border, paddingTop: 14 }}>
                    <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Task Breakdown</div>
                    {eventTasks.map(t => (
                      <div key={t.id} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div>
                            <div style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                            {t.deadline && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>Due {t.deadline}</div>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: T.cyan, fontWeight: 700, fontSize: 13 }}>{t.progress || 0}%</span>
                            <Badge status={t.status} />
                          </div>
                        </div>
                        <ProgressBar value={t.progress || 0} height={6} color={t.status === "completed" ? T.teal : t.status === "in-progress" ? T.cyan : T.amber} />
                      </div>
                    ))}
                  </div>
                )}

                {eventTasks.length === 0 && (
                  <div style={{ marginTop: 12, color: T.textMuted, fontSize: 13, fontStyle: "italic" }}>No tasks assigned yet.</div>
                )}
                <ClientFeedbackForm event={p} user={user} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


const TaskCommentCard = ({ task: t, user, canComment, barColor, statusColor, pct }) => {
  const [comments, setComments] = React.useState([]);
  const [newComment, setNewComment] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);

  const canSeeComments = ["CEO", "Strategy & Events Opportunity"].includes(user?.role) || user?.id === t.assignee_id;

  const loadComments = async () => {
    const { data } = await supabase.from("task_comments").select("*").eq("task_id", t.id).order("created_at", { ascending: true });
    setComments(data || []);
  };

  React.useEffect(() => {
    if (showComments) loadComments();
  }, [showComments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSaving(true);
    await supabase.from("task_comments").insert({
      task_id: t.id,
      author_id: user.id,
      author_name: user.name,
      author_role: user.role,
      message: newComment.trim(),
    });
    // notify assignee if commenter is CEO or Strategy Opportunity
    if (["CEO", "Strategy & Events Opportunity"].includes(user.role) && t.assignee_id && t.assignee_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: t.assignee_id,
        title: `${user.name} commented on your task`,
        message: `"${t.name}" — ${newComment.trim().slice(0, 80)}`,
        type: "task",
        resource_id: t.id,
      });
    }
    // notify CEO + Strategy Opportunity if assignee replies
    if (!["CEO", "Strategy & Events Opportunity"].includes(user.role)) {
      const recipients = await supabase.from("profiles").select("id").in("role", ["CEO", "Strategy & Events Opportunity"]);
      for (const r of (recipients.data || [])) {
        if (r.id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: r.id,
            title: `${user.name} replied on task`,
            message: `"${t.name}" — ${newComment.trim().slice(0, 80)}`,
            type: "task",
            resource_id: t.id,
          });
        }
      }
    }
    setNewComment("");
    setSaving(false);
    loadComments();
  };

  return (
    <div style={{ background: T.bg, border: `1px solid ${T.border}44`, borderLeft: `3px solid ${barColor}`, borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13 }}>{t.name}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
            {t.assignee_name && <span style={{ color: T.cyan, fontSize: 11, fontWeight: 600 }}>→ {t.assignee_name}</span>}
            {t.deadline && <span style={{ color: T.textMuted, fontSize: 11 }}>Due {t.deadline}</span>}
          </div>
        </div>
        <span style={{ background: statusColor + "18", color: statusColor, border: `1px solid ${statusColor}30`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, marginLeft: 10 }}>
          {t.status || "pending"}
        </span>
      </div>
      <div style={{ height: 4, background: T.border + "44", borderRadius: 2, marginBottom: 4 }}>
        <div style={{ height: "100%", width: pct + "%", background: barColor, borderRadius: 2, transition: "width 0.4s" }} />
      </div>
      <div style={{ color: T.textMuted, fontSize: 10, marginBottom: 6 }}>{pct}% complete</div>
      {t.notes && <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 8, fontStyle: "italic" }}>{t.notes}</div>}

      {/* Comments section — only for CEO, Strategy Opportunity, and assignee */}
      {canSeeComments && (
        <div style={{ marginTop: 10, borderTop: `1px solid ${T.border}44`, paddingTop: 10 }}>
          <button onClick={() => setShowComments(!showComments)} style={{
            background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: comments.length > 0 ? T.cyan : T.textMuted, boxShadow: comments.length > 0 ? `0 0 5px ${T.cyan}` : "none" }} />
            <span style={{ color: showComments ? T.cyan : T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {showComments ? "Hide" : "Comments"} {comments.length > 0 ? `(${comments.length})` : ""}
            </span>
          </button>

          {showComments && (
            <div style={{ marginTop: 10 }}>
              {/* Comment thread */}
              {comments.length === 0 ? (
                <div style={{ color: T.textMuted, fontSize: 11, fontStyle: "italic", marginBottom: 10 }}>No comments yet. Start the conversation.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                  {comments.map(c => {
                    const isMe = c.author_id === user.id;
                    const isCEO = c.author_role === "CEO";
                    const bubbleColor = isCEO ? T.cyan : c.author_role === "Strategy & Events Opportunity" ? T.teal : T.amber;
                    return (
                      <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: "85%", background: isMe ? bubbleColor + "20" : T.surface, border: `1px solid ${bubbleColor}30`, borderRadius: isMe ? "12px 12px 4px 12px" : "12px 12px 12px 4px", padding: "8px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 4 }}>
                            <span style={{ color: bubbleColor, fontSize: 10, fontWeight: 800 }}>{isMe ? "You" : c.author_name}</span>
                            <span style={{ color: T.textMuted, fontSize: 9 }}>{new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div style={{ color: T.textPrimary, fontSize: 12 }}>{c.message}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* New comment input */}
              {(canComment || user?.id === t.assignee_id) && (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
                    placeholder={canComment ? "Add a comment..." : "Reply..."}
                    rows={2}
                    style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", color: T.textPrimary, fontSize: 12, resize: "none", fontFamily: "inherit", outline: "none" }}
                  />
                  <button onClick={handleSubmit} disabled={saving || !newComment.trim()} style={{
                    background: T.cyan + "20", border: `1px solid ${T.cyan}40`, color: T.cyan,
                    padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                    opacity: !newComment.trim() ? 0.5 : 1,
                  }}>
                    {saving ? "..." : "Send"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ── Impact Intelligence — Event Type to Framework Mapping ──
const EVENT_ARCHETYPES = {
  "Conference/Seminar": {
    color: "#00C8FF",
    code: "CS",
    dimensions: [
      { key: "behavioural_change", label: "🎯 Behavioural Change", weight: 0.25, description: "Commitment durability — % opportunityers executing summit commitments", benchmark: ">80% recall + active execution at 30 days" },
      { key: "emotional_impact", label: "❤️ Emotional Impact", weight: 0.20, description: "Strategic alignment score — clarity on strategic priorities", benchmark: "+3 point improvement in clarity score" },
      { key: "data_engagement", label: "📊 Data & Engagement Quality", weight: 0.20, description: "Scientific engagement depth — avg dwell time on content", benchmark: ">5 min avg dwell time" },
      { key: "connection", label: "🔗 Connection & Community", weight: 0.15, description: "Cross-team collaboration — new cross-functional initiatives", benchmark: ">2 new cross-team initiatives per dept" },
      { key: "brand_visibility", label: "📣 Brand Visibility", weight: 0.10, description: "Knowledge lift — recall of key data points post-event", benchmark: ">60% correct answer rate post vs <30% pre" },
      { key: "commercial", label: "💼 Commercial Outcome", weight: 0.10, description: "Decision quality — speed and quality of post-summit decisions", benchmark: "Reduction in decision reversal rate" },
    ],
    kpiSuggestions: [
      { name: "Strategic Alignment Score", target: "+3 points on 10-point scale", method: "Pre/post alignment survey", timing: "Pre-event + event close" },
      { name: "Commitment Execution Rate", target: ">80% at 30 days", method: "Follow-up survey + manager confirmation", timing: "30 & 90 days post-event" },
      { name: "Cross-team Initiatives", target: ">2 per department", method: "HR/project management data", timing: "60 days post-event" },
    ],
    tools: { pre_survey: "Yes", digital_tracking: "No", live_monitoring: "Yes", post_survey: "Yes", day30_survey: "Yes", day90_tracking: "Yes", social_listening: "No", commercial_data: "Yes" },
    storyTemplate: { before: "struggled with strategic misalignment and siloed decision-making", design: "immersive opportunityership summit with structured commitment frameworks", outcome: "strategic alignment score improved and new cross-team initiatives launched" }
  },
  "Product Launch": {
    color: "#E879F9",
    code: "PL",
    dimensions: [
      { key: "behavioural_change", label: "🎯 Behavioural Change", weight: 0.25, description: "Intent to purchase/try — self-reported intent shift pre to post", benchmark: "+2 points on intent scale" },
      { key: "emotional_impact", label: "❤️ Emotional Impact", weight: 0.20, description: "Brand recall — % audience recalling 3+ product messages unaided", benchmark: ">65% unaided recall at 24hrs" },
      { key: "data_engagement", label: "📊 Data & Engagement", weight: 0.20, description: "Social amplification — organic content generated by attendees", benchmark: "≥3 organic posts per 10 attendees" },
      { key: "connection", label: "🔗 Connection & Community", weight: 0.15, description: "Opportunity conversion — commercial pipeline from event", benchmark: "≥15% of qualified attendees enter pipeline" },
      { key: "brand_visibility", label: "📣 Brand Visibility", weight: 0.10, description: "Media coverage — volume and quality of press/media mentions", benchmark: "≥3 earned media placements" },
      { key: "commercial", label: "💼 Commercial Outcome", weight: 0.10, description: "Revenue/sales pipeline generated within 30 days post-event", benchmark: "+15% pipeline contribution" },
    ],
    kpiSuggestions: [
      { name: "Brand Recall Score", target: ">65% unaided at 24hrs", method: "Post-event quiz/survey", timing: "24hrs & 7 days post-event" },
      { name: "Purchase Intent Shift", target: "+2 points on NPS-style scale", method: "Pre/post intent survey", timing: "Pre-event + immediately post" },
      { name: "Organic Social Posts", target: "≥3 per 10 attendees", method: "Social listening/hashtag tracking", timing: "Event day + 48hrs" },
    ],
    tools: { pre_survey: "Yes", digital_tracking: "Yes", live_monitoring: "Yes", post_survey: "Yes", day30_survey: "Yes", day90_tracking: "No", social_listening: "Yes", commercial_data: "Yes" },
    storyTemplate: { before: "needed to cut through market noise and generate genuine product excitement", design: "immersive brand activation with multi-sensory product experience zones", outcome: "brand recall exceeded targets and measurable pipeline was generated" }
  },
  "Awards Ceremony": {
    color: "#F59E0B",
    code: "AWD",
    dimensions: [
      { key: "behavioural_change", label: "🎯 Behavioural Change", weight: 0.25, description: "Behaviour change — discretionary effort & engagement shift post-event", benchmark: ">20% lift in discretionary effort markers" },
      { key: "emotional_impact", label: "❤️ Emotional Impact", weight: 0.20, description: "Emotional impact — how valued employees/partners feel post-event", benchmark: ">80% feel genuinely recognised" },
      { key: "data_engagement", label: "📊 Data & Engagement", weight: 0.20, description: "Award gravity — how proudly recipients display/share recognition", benchmark: ">60% of recipients share publicly" },
      { key: "connection", label: "🔗 Connection & Community", weight: 0.15, description: "Cultural adoption — brand values embodiment in daily behaviour", benchmark: ">70% peers observe values-aligned behaviour" },
      { key: "brand_visibility", label: "📣 Brand Visibility", weight: 0.10, description: "Social amplification — organic content from award recipients", benchmark: ">50% of attendees share event content" },
      { key: "commercial", label: "💼 Commercial Outcome", weight: 0.10, description: "Retention signal — staff/partner turnover trend post-event", benchmark: "10-30% reduction in voluntary exits" },
    ],
    kpiSuggestions: [
      { name: "Recognition Score", target: ">80% feel genuinely recognised", method: "Pulse survey (5-question, scored 1-10)", timing: "Event night + 2 weeks post" },
      { name: "Social Sharing Rate", target: ">60% of recipients share publicly", method: "Social media monitoring", timing: "Event night + 7 days" },
      { name: "Retention Signal", target: "10-30% reduction in voluntary exits", method: "HR attrition data", timing: "3 & 12 months post-event" },
    ],
    tools: { pre_survey: "No", digital_tracking: "No", live_monitoring: "Yes", post_survey: "Yes", day30_survey: "Yes", day90_tracking: "Yes", social_listening: "Yes", commercial_data: "Yes" },
    storyTemplate: { before: "struggled with staff/partner disengagement and recognition deficit", design: "precision-engineered awards experience with personalised recognition moments", outcome: "recognition scores exceeded target and retention signals improved" }
  },
  "Corporate Party": {
    color: "#10B981",
    code: "CP",
    dimensions: [
      { key: "behavioural_change", label: "🎯 Behavioural Change", weight: 0.25, description: "Pride index — self-reported pride in representing the brand", benchmark: ">85% score 8+/10 on pride" },
      { key: "emotional_impact", label: "❤️ Emotional Impact", weight: 0.20, description: "Inclusivity index — % attendees whose needs were fully met", benchmark: ">95% needs accommodated" },
      { key: "data_engagement", label: "📊 Data & Engagement", weight: 0.20, description: "Community sentiment — net sentiment in social posts about event", benchmark: ">80% positive sentiment" },
      { key: "connection", label: "🔗 Connection & Community", weight: 0.15, description: "Quality of connections — verified professional connections per attendee", benchmark: ">3 verified connections per attendee" },
      { key: "brand_visibility", label: "📣 Brand Visibility", weight: 0.10, description: "Brand advocacy — guest-generated content + word-of-mouth", benchmark: ">50% of attendees share event content" },
      { key: "commercial", label: "💼 Commercial Outcome", weight: 0.10, description: "Return intent — % delegates who would return / recommend brand", benchmark: ">70% would return" },
    ],
    kpiSuggestions: [
      { name: "Pride Index", target: ">85% score 8+/10", method: "3-question pride pulse on event night", timing: "Event night" },
      { name: "Positive Sentiment", target: ">80% positive", method: "Social listening — sentiment analysis", timing: "Event + 7 days" },
      { name: "Return Intent", target: ">70% would return", method: "Post-event NPS + would you return?", timing: "Post-event" },
    ],
    tools: { pre_survey: "No", digital_tracking: "No", live_monitoring: "Yes", post_survey: "Yes", day30_survey: "No", day90_tracking: "No", social_listening: "Yes", commercial_data: "No" },
    storyTemplate: { before: "needed to strengthen team cohesion and brand pride beyond the office", design: "curated corporate experience with intentional connection moments", outcome: "pride index and brand advocacy exceeded targets" }
  },
  "Other": {
    color: "#8B5CF6",
    code: "OTH",
    dimensions: [
      { key: "behavioural_change", label: "🎯 Behavioural Change", weight: 0.25, description: "Measurable change in attendee behaviour post-event", benchmark: ">60% demonstrate target behaviour change" },
      { key: "emotional_impact", label: "❤️ Emotional Impact", weight: 0.20, description: "Attendee sentiment and satisfaction score", benchmark: ">80% positive sentiment" },
      { key: "data_engagement", label: "📊 Data & Engagement", weight: 0.20, description: "Engagement metrics and dwell time", benchmark: ">70% active participation" },
      { key: "connection", label: "🔗 Connection & Community", weight: 0.15, description: "Connections and community building", benchmark: ">3 connections per attendee" },
      { key: "brand_visibility", label: "📣 Brand Visibility", weight: 0.10, description: "Brand reach and amplification", benchmark: ">50% of attendees share content" },
      { key: "commercial", label: "💼 Commercial Outcome", weight: 0.10, description: "Revenue or business outcome generated", benchmark: "Measurable commercial impact" },
    ],
    kpiSuggestions: [
      { name: "Attendee Satisfaction", target: ">8/10 satisfaction score", method: "Post-event survey", timing: "Event night + 48hrs" },
      { name: "Event Reach", target: ">50% of attendees share content", method: "Social listening", timing: "Event + 7 days" },
      { name: "Key Objective Achievement", target: "100% of stated objectives met", method: "Internal review", timing: "Post-event" },
    ],
    tools: { pre_survey: "No", digital_tracking: "No", live_monitoring: "Yes", post_survey: "Yes", day30_survey: "No", day90_tracking: "No", social_listening: "Yes", commercial_data: "No" },
    storyTemplate: { before: "needed a distinctive event experience beyond standard formats", design: "bespoke event concept tailored to specific objectives", outcome: "key objectives achieved and attendees exceeded expectations" }
  },
};

const BENCHMARKS = {
  attendance_rate: { industry: "72%", sf_target: "90%+" },
  no_show_rate: { industry: "28%", sf_target: "<10%" },
  avg_dwell_time: { industry: "90 sec", sf_target: "5+ min" },
  satisfaction_score: { industry: "7.1/10", sf_target: "8.5+/10" },
  nps_score: { industry: "+22", sf_target: "+50" },
  positive_sentiment: { industry: "64%", sf_target: "85%+" },
  knowledge_recall: { industry: "23%", sf_target: "65%+" },
  organic_posts: { industry: "0.8 per 10", sf_target: "3+ per 10" },
  earned_media: { industry: "1-2", sf_target: "5+" },
  opportunity_conversion: { industry: "9%", sf_target: "18%+" },
};

const getScoreLabel = (score) => {
  if (score >= 9) return { label: "Exceptional", color: "#10B981" };
  if (score >= 7) return { label: "Strong Impact", color: "#00E5C8" };
  if (score >= 5) return { label: "Partial", color: "#F59E0B" };
  if (score >= 3) return { label: "Needs Redesign", color: "#E67E22" };
  return { label: "Critical", color: "#C0192A" };
};

const EventImpactView = ({ user, project }) => {
  const [activeTab, setActiveTab] = useState("brief");
  const [brief, setBrief] = useState(null);
  const [postData, setPostData] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [report, setReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [briefForm, setBriefForm] = useState({
    impact_objective: "", target_audience: "", observable_signal: "",
    kpi1_name: "", kpi1_target: "", kpi1_method: "", kpi1_timing: "",
    kpi2_name: "", kpi2_target: "", kpi2_method: "", kpi2_timing: "",
    kpi3_name: "", kpi3_target: "", kpi3_method: "", kpi3_timing: "",
    tool_pre_survey: "No", tool_digital_tracking: "No", tool_live_monitoring: "No",
    tool_post_survey: "No", tool_30day_survey: "No", tool_90day_tracking: "No",
    tool_social_listening: "No", tool_commercial_data: "No",
    story_before: "", story_design: "", story_outcome: "",
  });
  const [postForm, setPostForm] = useState({
    total_attendees: "", target_audience_pct: "", no_show_rate: "",
    avg_dwell_time: "", digital_completion_pct: "", interactive_participation_pct: "",
    satisfaction_score: "", nps_score: "", positive_sentiment_pct: "",
    behaviour_30day: "", behaviour_90day: "", knowledge_recall_pct: "",
    retention_rate: "", revenue_shift_pct: "", opportunities_generated: "",
    organic_posts: "", organic_reach: "", earned_media: "",
  });
  const [scorecardForm, setScorecardForm] = useState({
    behavioural_change_target: "", behavioural_change_score: 0,
    emotional_impact_target: "", emotional_impact_score: 0,
    data_engagement_target: "", data_engagement_score: 0,
    connection_target: "", connection_score: 0,
    brand_visibility_target: "", brand_visibility_score: 0,
    commercial_target: "", commercial_score: 0,
    commentary: "",
  });
  const [reportForm, setReportForm] = useState({
    headline: "", problem_challenge: "", problem_previous: "", problem_inaction: "",
    design1_name: "", design1_intent: "", design2_name: "", design2_intent: "", design3_name: "", design3_intent: "",
    metric1_label: "", metric1_value: "", metric2_label: "", metric2_value: "",
    metric3_label: "", metric3_value: "", metric4_label: "", metric4_value: "",
    client_quote: "", quote_attribution: "", one_line_story: "",
  });

  const archetype = EVENT_ARCHETYPES[project?.event_category] || EVENT_ARCHETYPES["Conference/Seminar"];

  const load = async () => {
    const [{ data: b }, { data: pd }, { data: sc }, { data: rp }] = await Promise.all([
      supabase.from("event_impact_briefs").select("*").eq("project_id", project.id).single(),
      supabase.from("event_post_data").select("*").eq("project_id", project.id).single(),
      supabase.from("event_scorecards").select("*").eq("project_id", project.id).single(),
      supabase.from("event_impact_reports").select("*").eq("project_id", project.id).single(),
    ]);
    if (b) { setBrief(b); setBriefForm(b); }
    if (pd) { setPostData(pd); setPostForm(pd); }
    if (sc) { setScorecard(sc); setScorecardForm(sc); }
    if (rp) { setReport(rp); setReportForm(rp); }

    // Auto-fill KPI suggestions if no brief yet
    if (!b && archetype.kpiSuggestions) {
      const s = archetype.kpiSuggestions;
      setBriefForm(prev => ({
        ...prev,
        kpi1_name: s[0]?.name || "", kpi1_target: s[0]?.target || "", kpi1_method: s[0]?.method || "", kpi1_timing: s[0]?.timing || "",
        kpi2_name: s[1]?.name || "", kpi2_target: s[1]?.target || "", kpi2_method: s[1]?.method || "", kpi2_timing: s[1]?.timing || "",
        kpi3_name: s[2]?.name || "", kpi3_target: s[2]?.target || "", kpi3_method: s[2]?.method || "", kpi3_timing: s[2]?.timing || "",
        tool_pre_survey: archetype.tools.pre_survey,
        tool_digital_tracking: archetype.tools.digital_tracking,
        tool_live_monitoring: archetype.tools.live_monitoring,
        tool_post_survey: archetype.tools.post_survey,
        tool_30day_survey: archetype.tools.day30_survey,
        tool_90day_tracking: archetype.tools.day90_tracking,
        tool_social_listening: archetype.tools.social_listening,
        tool_commercial_data: archetype.tools.commercial_data,
        story_before: archetype.storyTemplate.before,
        story_design: archetype.storyTemplate.design,
        story_outcome: archetype.storyTemplate.outcome,
      }));
      setScorecardForm(prev => {
        const updated = { ...prev };
        archetype.dimensions.forEach(d => {
          updated[d.key + "_target"] = d.description;
        });
        return updated;
      });
    }
  };

  useEffect(() => { if (project?.id) load(); }, [project?.id]);

  const saveBrief = async () => {
    setSaving(true);
    if (brief) {
      await supabase.from("event_impact_briefs").update({ ...briefForm, updated_at: new Date().toISOString() }).eq("id", brief.id);
    } else {
      await supabase.from("event_impact_briefs").insert({ ...briefForm, project_id: project.id, event_type: project.event_category, created_by: user.id });
    }
    setSaving(false); load();
  };

  const savePostData = async () => {
    setSaving(true);
    if (postData) {
      await supabase.from("event_post_data").update({ ...postForm, updated_at: new Date().toISOString() }).eq("id", postData.id);
    } else {
      await supabase.from("event_post_data").insert({ ...postForm, project_id: project.id, created_by: user.id });
    }
    setSaving(false); load();
  };

  const calcOverallScore = () => {
    const dims = archetype.dimensions;
    let total = 0;
    dims.forEach(d => {
      const score = parseFloat(scorecardForm[d.key + "_score"]) || 0;
      total += score * d.weight;
    });
    return Math.round(total * 10) / 10;
  };

  const saveScorecard = async () => {
    setSaving(true);
    const overall = calcOverallScore();
    if (scorecard) {
      await supabase.from("event_scorecards").update({ ...scorecardForm, overall_score: overall }).eq("id", scorecard.id);
    } else {
      await supabase.from("event_scorecards").insert({ ...scorecardForm, overall_score: overall, project_id: project.id, created_by: user.id });
    }
    setSaving(false); load();
  };

  const saveReport = async () => {
    setSaving(true);
    if (report) {
      await supabase.from("event_impact_reports").update({ ...reportForm, updated_at: new Date().toISOString() }).eq("id", report.id);
    } else {
      await supabase.from("event_impact_reports").insert({ ...reportForm, project_id: project.id, created_by: user.id });
    }
    setSaving(false); load();
  };

  const overallScore = scorecard ? scorecard.overall_score : calcOverallScore();
  const scoreLabel = getScoreLabel(overallScore);

  const inputStyle = { width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 };
  const sectionStyle = { color: archetype.color, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 24, paddingBottom: 6, borderBottom: `1px solid ${archetype.color}30` };

  const tabs = [
    { id: "brief", label: "📝 Impact Brief", done: !!brief },
    { id: "scorecard", label: "📊 Scorecard", done: !!scorecard },
    { id: "post-data", label: "📈 Post-Event Data", done: !!postData },
    { id: "report", label: "🏆 Impact Report", done: !!report },
  ];

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", background: archetype.color+"12", borderBottom: `1px solid ${archetype.color}30`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: archetype.color, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Impact Intelligence — {project?.event_category}</div>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15 }}>{project?.name}</div>
        </div>
        {scorecard && (
          <div style={{ textAlign: "right" }}>
            <div style={{ color: scoreLabel.color, fontWeight: 900, fontSize: 28 }}>{overallScore}/10</div>
            <div style={{ color: scoreLabel.color, fontSize: 11, fontWeight: 700 }}>{scoreLabel.label}</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "10px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700,
            border: "none", borderBottom: `2px solid ${activeTab === t.id ? archetype.color : "transparent"}`,
            background: "none", color: activeTab === t.id ? archetype.color : T.textMuted,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.label}
            {t.done && <span style={{ background: "#10B98120", color: "#10B981", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>✓</span>}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 24px", maxHeight: 600, overflowY: "auto" }}>

        {/* ── IMPACT BRIEF TAB ── */}
        {activeTab === "brief" && (
          <div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 16 }}>Define what success looks like before the event. KPIs pre-filled based on {project?.event_category} archetype.</div>

            <div style={sectionStyle}>Impact Objective</div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>In one sentence, what must change as a result of this event?</label><textarea value={briefForm.impact_objective} onChange={e => setBriefForm({...briefForm, impact_objective: e.target.value})} rows={2} style={{...inputStyle, resize: "vertical"}} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>Who specifically should change?</label><input value={briefForm.target_audience} onChange={e => setBriefForm({...briefForm, target_audience: e.target.value})} style={inputStyle} placeholder="Target audience segment" /></div>
              <div><label style={labelStyle}>How will you know it changed?</label><input value={briefForm.observable_signal} onChange={e => setBriefForm({...briefForm, observable_signal: e.target.value})} style={inputStyle} placeholder="Observable signal" /></div>
            </div>

            <div style={sectionStyle}>Measurable KPIs</div>
            {[1,2,3].map(n => (
              <div key={n} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ color: archetype.color, fontSize: 11, fontWeight: 800, marginBottom: 8 }}>KPI {n}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 10, marginBottom: 8 }}>
                  <div><label style={labelStyle}>Name</label><input value={briefForm[`kpi${n}_name`]} onChange={e => setBriefForm({...briefForm, [`kpi${n}_name`]: e.target.value})} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Target</label><input value={briefForm[`kpi${n}_target`]} onChange={e => setBriefForm({...briefForm, [`kpi${n}_target`]: e.target.value})} style={inputStyle} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 10 }}>
                  <div><label style={labelStyle}>Measurement Method</label><input value={briefForm[`kpi${n}_method`]} onChange={e => setBriefForm({...briefForm, [`kpi${n}_method`]: e.target.value})} style={inputStyle} /></div>
                  <div><label style={labelStyle}>When Measured</label><input value={briefForm[`kpi${n}_timing`]} onChange={e => setBriefForm({...briefForm, [`kpi${n}_timing`]: e.target.value})} style={inputStyle} /></div>
                </div>
              </div>
            ))}

            <div style={sectionStyle}>Measurement Tools</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 8, marginBottom: 16 }}>
              {[
                ["tool_pre_survey", "Pre-Event Survey / Baseline"],
                ["tool_digital_tracking", "Digital Tracking System"],
                ["tool_live_monitoring", "Live Engagement Monitoring"],
                ["tool_post_survey", "Post-Event Pulse Survey"],
                ["tool_30day_survey", "30-Day Follow-Up Survey"],
                ["tool_90day_tracking", "90-Day Behaviour Tracking"],
                ["tool_social_listening", "Social Listening"],
                ["tool_commercial_data", "Commercial Data Pull"],
              ].map(([key, label]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6 }}>
                  <span style={{ color: T.textSecondary, fontSize: 12 }}>{label}</span>
                  <select value={briefForm[key]} onChange={e => setBriefForm({...briefForm, [key]: e.target.value})} style={{ padding: "3px 8px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, color: briefForm[key] === "Yes" ? archetype.color : T.textMuted, fontSize: 11, fontFamily: "inherit", outline: "none" }}>
                    <option>Yes</option><option>No</option><option>N/A</option>
                  </select>
                </div>
              ))}
            </div>

            <div style={sectionStyle}>Impact Story Intent</div>
            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 10, fontStyle: "italic" }}>Draft the story you intend to tell — complete with actuals after the event</div>
              <div style={{ marginBottom: 10 }}><label style={labelStyle}>Before Stretchfield, [CLIENT] struggled with...</label><input value={briefForm.story_before} onChange={e => setBriefForm({...briefForm, story_before: e.target.value})} style={inputStyle} /></div>
              <div style={{ marginBottom: 10 }}><label style={labelStyle}>We designed [ELEMENT] because...</label><input value={briefForm.story_design} onChange={e => setBriefForm({...briefForm, story_design: e.target.value})} style={inputStyle} /></div>
              <div><label style={labelStyle}>As a result, [OUTCOME] happened...</label><input value={briefForm.story_outcome} onChange={e => setBriefForm({...briefForm, story_outcome: e.target.value})} style={inputStyle} /></div>
            </div>

            <button onClick={saveBrief} disabled={saving} style={{ background: `linear-gradient(135deg, ${archetype.color}, ${archetype.color}99)`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Saving..." : "Save Impact Brief"}</button>
          </div>
        )}

        {/* ── SCORECARD TAB ── */}
        {activeTab === "scorecard" && (
          <div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 16 }}>Score each impact dimension 0–10. Weights are pre-set for {project?.event_category} events.</div>
            {archetype.dimensions.map(dim => (
              <div key={dim.key} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13 }}>{dim.label}</div>
                    <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{dim.description}</div>
                    <div style={{ color: archetype.color, fontSize: 10, marginTop: 2 }}>Benchmark: {dim.benchmark}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ color: T.textMuted, fontSize: 10, marginBottom: 3 }}>Weight: {Math.round(dim.weight*100)}%</div>
                    <input type="number" min="0" max="10" step="0.1" value={scorecardForm[dim.key+"_score"]} onChange={e => setScorecardForm({...scorecardForm, [dim.key+"_score"]: e.target.value})} style={{ width: 60, padding: "6px 8px", background: T.surface, border: `2px solid ${archetype.color}40`, borderRadius: 6, color: archetype.color, fontSize: 16, fontWeight: 900, textAlign: "center", fontFamily: "inherit", outline: "none" }} />
                    <div style={{ color: T.textMuted, fontSize: 9, textAlign: "center" }}>/10</div>
                  </div>
                </div>
                <div><label style={labelStyle}>Target Set</label><input value={scorecardForm[dim.key+"_target"]} onChange={e => setScorecardForm({...scorecardForm, [dim.key+"_target"]: e.target.value})} style={inputStyle} /></div>
              </div>
            ))}
            <div style={{ background: archetype.color+"15", border: `2px solid ${archetype.color}40`, borderRadius: 10, padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15 }}>Overall Impact Score</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: archetype.color, fontWeight: 900, fontSize: 32 }}>{calcOverallScore()}</div>
                <div style={{ color: getScoreLabel(calcOverallScore()).color, fontSize: 12, fontWeight: 700 }}>{getScoreLabel(calcOverallScore()).label}</div>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Commentary</label><textarea value={scorecardForm.commentary} onChange={e => setScorecardForm({...scorecardForm, commentary: e.target.value})} rows={3} style={{...inputStyle, resize: "vertical"}} placeholder="Overall notes on event performance..." /></div>
            <button onClick={saveScorecard} disabled={saving} style={{ background: `linear-gradient(135deg, ${archetype.color}, ${archetype.color}99)`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Saving..." : "Save Scorecard"}</button>
          </div>
        )}

        {/* ── POST-EVENT DATA TAB ── */}
        {activeTab === "post-data" && (
          <div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 16 }}>Enter actuals after the event. Compare against your pre-set targets from the Impact Brief.</div>

            {[
              { section: "Attendance & Reach", fields: [["total_attendees","Total Attendees","number"],["target_audience_pct","% Target Audience","number"],["no_show_rate","No-Show Rate (%)","number"]] },
              { section: "Engagement & Dwell", fields: [["avg_dwell_time","Average Dwell Time (mins)","number"],["digital_completion_pct","Digital Touchpoint Completion (%)","number"],["interactive_participation_pct","Interactive Feature Participation (%)","number"]] },
              { section: "Sentiment & Satisfaction", fields: [["satisfaction_score","Post-Event Satisfaction Score (/10)","number"],["nps_score","NPS Score","number"],["positive_sentiment_pct","Positive Sentiment % (social/survey)","number"]] },
              { section: "Behaviour Change", fields: [["behaviour_30day","30-Day Behaviour Signal","text"],["behaviour_90day","90-Day Behaviour Signal","text"],["knowledge_recall_pct","Knowledge/Recall Score (%)","number"]] },
              { section: "Commercial Outcomes", fields: [["retention_rate","Retention Rate (%)","number"],["revenue_shift_pct","Revenue Contribution Shift (%)","number"],["opportunities_generated","Pipeline/Opportunitys Generated","number"]] },
              { section: "Social & Brand", fields: [["organic_posts","Organic Social Posts Generated","number"],["organic_reach","Total Organic Reach (impressions)","number"],["earned_media","Earned Media Placements","number"]] },
            ].map(({ section, fields }) => (
              <div key={section}>
                <div style={sectionStyle}>{section}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12, marginBottom: 8 }}>
                  {fields.map(([key, label, type]) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input type={type} value={postForm[key]} onChange={e => setPostForm({...postForm, [key]: e.target.value})} style={inputStyle} placeholder="Enter actual" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Benchmark comparison */}
            {(postForm.satisfaction_score || postForm.nps_score) && (
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, marginBottom: 12 }}>vs. Industry Benchmarks</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 10 }}>
                  {[
                    ["Satisfaction", postForm.satisfaction_score, "7.1/10", "8.5+/10"],
                    ["NPS", postForm.nps_score, "+22", "+50"],
                    ["Sentiment", postForm.positive_sentiment_pct+"%", "64%", "85%+"],
                  ].filter(([,v]) => v && v !== "undefined%").map(([label, actual, industry, sfTarget]) => (
                    <div key={label} style={{ background: T.surface, borderRadius: 8, padding: "10px 12px", border: `1px solid ${T.border}` }}>
                      <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                      <div style={{ color: archetype.color, fontWeight: 900, fontSize: 18 }}>{actual}</div>
                      <div style={{ color: T.textMuted, fontSize: 10, marginTop: 4 }}>Industry: {industry}</div>
                      <div style={{ color: "#10B981", fontSize: 10 }}>SF Target: {sfTarget}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={savePostData} disabled={saving} style={{ background: `linear-gradient(135deg, ${archetype.color}, ${archetype.color}99)`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Saving..." : "Save Post-Event Data"}</button>
          </div>
        )}

        {/* ── IMPACT REPORT TAB ── */}
        {activeTab === "report" && (
          <div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 16 }}>Build your client impact story. This becomes your case study and pitch asset.</div>

            <div style={{ marginBottom: 12 }}><label style={labelStyle}>Headline Impact Statement</label><input value={reportForm.headline} onChange={e => setReportForm({...reportForm, headline: e.target.value})} style={inputStyle} placeholder="One powerful line that captures the entire impact" /></div>

            <div style={sectionStyle}>The Problem (Before Stretchfield)</div>
            <div style={{ marginBottom: 10 }}><label style={labelStyle}>What was the business challenge?</label><textarea value={reportForm.problem_challenge} onChange={e => setReportForm({...reportForm, problem_challenge: e.target.value})} rows={2} style={{...inputStyle, resize:"vertical"}} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>What wasn't working?</label><textarea value={reportForm.problem_previous} onChange={e => setReportForm({...reportForm, problem_previous: e.target.value})} rows={2} style={{...inputStyle, resize:"vertical"}} /></div>
              <div><label style={labelStyle}>Cost of inaction?</label><textarea value={reportForm.problem_inaction} onChange={e => setReportForm({...reportForm, problem_inaction: e.target.value})} rows={2} style={{...inputStyle, resize:"vertical"}} /></div>
            </div>

            <div style={sectionStyle}>What Stretchfield Engineered</div>
            {[1,2,3].map(n => (
              <div key={n} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 10 }}>
                <div><label style={labelStyle}>Design Element {n}</label><input value={reportForm[`design${n}_name`]} onChange={e => setReportForm({...reportForm, [`design${n}_name`]: e.target.value})} style={inputStyle} placeholder="Element name" /></div>
                <div><label style={labelStyle}>Intent (why this?)</label><input value={reportForm[`design${n}_intent`]} onChange={e => setReportForm({...reportForm, [`design${n}_intent`]: e.target.value})} style={inputStyle} placeholder="Strategic reason" /></div>
              </div>
            ))}

            <div style={sectionStyle}>Measured Outcomes</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 10, marginBottom: 16 }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 8, background: T.bg, padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <div><label style={labelStyle}>Metric {n}</label><input value={reportForm[`metric${n}_label`]} onChange={e => setReportForm({...reportForm, [`metric${n}_label`]: e.target.value})} style={inputStyle} placeholder="Label" /></div>
                  <div><label style={labelStyle}>Value</label><input value={reportForm[`metric${n}_value`]} onChange={e => setReportForm({...reportForm, [`metric${n}_value`]: e.target.value})} style={inputStyle} placeholder="e.g. 87%" /></div>
                </div>
              ))}
            </div>

            <div style={sectionStyle}>Client Voice</div>
            <div style={{ marginBottom: 10 }}><label style={labelStyle}>Client Quote</label><textarea value={reportForm.client_quote} onChange={e => setReportForm({...reportForm, client_quote: e.target.value})} rows={3} style={{...inputStyle, resize:"vertical"}} placeholder="Direct quote from client..." /></div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>Attribution</label><input value={reportForm.quote_attribution} onChange={e => setReportForm({...reportForm, quote_attribution: e.target.value})} style={inputStyle} placeholder="Name, Title, Company" /></div>

            <div style={sectionStyle}>The One-Line Story</div>
            <div style={{ background: T.bg, border: `1px solid ${archetype.color}30`, borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 8 }}>Complete this sentence:</div>
              <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 6, fontStyle: "italic" }}>"A [DESIGN ELEMENT] we placed into [EVENT NAME] because [STRATEGIC INTENT] resulted in [MEASURABLE OUTCOME] for [CLIENT], proving that [BUSINESS TRUTH]."</div>
              <textarea value={reportForm.one_line_story} onChange={e => setReportForm({...reportForm, one_line_story: e.target.value})} rows={3} style={{...inputStyle, resize:"vertical"}} placeholder="Write your one-line impact story..." />
            </div>

            {/* Score summary */}
            {scorecard && (
              <div style={{ background: archetype.color+"12", border: `1px solid ${archetype.color}30`, borderRadius: 10, padding: "14px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Overall Impact Score</div>
                  <div style={{ color: T.textMuted, fontSize: 11 }}>Benchmarked against: Industry avg {BENCHMARKS.satisfaction_score.industry} satisfaction | SF Target {BENCHMARKS.satisfaction_score.sf_target}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: archetype.color, fontWeight: 900, fontSize: 32 }}>{scorecard.overall_score}/10</div>
                  <div style={{ color: getScoreLabel(scorecard.overall_score).color, fontSize: 12, fontWeight: 700 }}>{getScoreLabel(scorecard.overall_score).label}</div>
                </div>
              </div>
            )}

            <button onClick={saveReport} disabled={saving} style={{ background: `linear-gradient(135deg, ${archetype.color}, ${archetype.color}99)`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13, marginRight: 10 }}>{saving ? "Saving..." : "Save Impact Report"}</button>
          </div>
        )}
      </div>
    </div>
  );
};

const EventsView = ({ user, userRole }) => {
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', client: '', client_id: '', event_date: '', deadline: '', phase: 'Planning', event_category: '', country: 'Ghana' });
  const [saving, setSaving] = useState(false);
  const [taskModalEvent, setTaskModalEvent] = useState(null);
  const [impactEvent, setImpactEvent] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [strategyOpportunitys, setStrategyOpportunitys] = useState([]);
  const [editEvent, setEditEvent] = useState(null);
  const [editForm, setEditForm] = useState({});

  const canManage = ['CEO','Country Manager'].includes(user?.role);
  const canSeeTasks = ['CEO','Country Manager','Strategy & Events Opportunity','Vendor Manager'].includes(user?.role);

  const load = async () => {
    const [p, c, t, sl] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name, email, avatar').eq('role', 'Strategy & Events Opportunity'),
    ]);
    setEvents(p.data || []);
    setClients(c.data || []);
    setTasks(t.data || []);
    setStrategyOpportunitys(sl.data || []);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name) { alert('Event name is required'); return; }
    setSaving(true);
    if (!form.event_category) { alert('Please select an event category.'); setSaving(false); return; }
    const { error } = await supabase.from('projects').insert({
      name: form.name,
      client: form.client || '',
      client_id: form.client_id || null,
      deadline: form.deadline || null,
      event_date: form.event_date || null,
      phase: form.phase,
      completion: 0,
      status: 'active',
      tasks: 0,
      completed: 0,
      event_category: form.event_category,
      country: form.country || 'Ghana',
    });
    if (error) { alert('Error: ' + error.message); setSaving(false); return; }
    setModal(false);
    setForm({ name: '', client: '', client_id: '', deadline: '', phase: 'Planning', event_category: '', country: 'Ghana' });
    setSaving(false);
    load();
  };

  const handleEdit = (p) => {
    setEditEvent(p);
    setEditForm({
      name: p.name || '',
      client_id: p.client_id || '',
      client: p.client || '',
      event_date: p.event_date || '',
      deadline: p.deadline || '',
      phase: p.phase || 'Planning',
      completion: p.completion || 0,
      status: p.status || 'active',
      event_category: p.event_category || '',
      country: p.country || 'Ghana',
    });
  };

  const handleUpdate = async () => {
    if (!editForm.name) return;
    setSaving(true);
    await supabase.from('projects').update({
      name: editForm.name,
      client: editForm.client,
      client_id: editForm.client_id || null,
      event_date: editForm.event_date || null,
      deadline: editForm.deadline || null,
      phase: editForm.phase,
      completion: parseInt(editForm.completion) || 0,
      status: editForm.status,
      event_category: editForm.event_category || null,
      country: editForm.country || 'Ghana',
    }).eq('id', editEvent.id);
    setSaving(false);
    setEditEvent(null);
    load();
  };

  const openEdit = (u) => {
    setEditModal(u);
    setEditForm({ name: u.name || '', role: u.role || '', country: u.country || 'Ghana', phone: u.phone || '', newPassword: '' });
    setError('');
  };

  const handleUserUpdate = async () => {
    if (!editForm.name) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    await supabase.from('profiles').update({
      name: editForm.name,
      role: editForm.role,
      country: editForm.role === 'Country Manager' ? editForm.country : null,
      phone: editForm.phone || null,
    }).eq('id', editModal.id);
    // Update password if provided
    if (editForm.newPassword) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch('https://okbduzenceoknkjqnrha.supabase.co/functions/v1/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ userId: editModal.id, action: 'reset-password', newPassword: editForm.newPassword }),
        });
      } catch (e) { console.error(e); }
    }
    setSaving(false);
    setEditModal(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      // Step 1 — delete task comments via task IDs
      const { data: taskList } = await supabase.from('tasks').select('id').eq('project_id', id);
      if (taskList?.length) {
        const taskIds = taskList.map(t => t.id);
        await supabase.from('task_comments').delete().in('task_id', taskIds);
      }
      // Step 2 — delete tasks
      await supabase.from('tasks').delete().eq('project_id', id);
      // Step 3 — delete impact data
      await Promise.all([
        supabase.from('event_impact_briefs').delete().eq('project_id', id),
        supabase.from('event_post_data').delete().eq('project_id', id),
        supabase.from('event_scorecards').delete().eq('project_id', id),
        supabase.from('event_impact_reports').delete().eq('project_id', id),
        supabase.from('vendor_scorecards').delete().eq('project_id', id),
        supabase.from('expenses').delete().eq('project_id', id),
        supabase.from('budgets').delete().eq('project_id', id),
        supabase.from('client_budgets').delete().eq('project_id', id),
        supabase.from('client_expenses').delete().eq('project_id', id),
        supabase.from('client_invoices').delete().eq('project_id', id),
        supabase.from('feedback').delete().eq('project_id', id),
      ]);
      // Step 4 — delete RFF chain
      const { data: rffList } = await supabase.from('rffs').select('id').eq('project_id', id);
      if (rffList?.length) {
        const rffIds = rffList.map(r => r.id);
        // Delete invoices referencing RFFs first
        await supabase.from('invoices').delete().in('rff_id', rffIds);
        await Promise.all([
          supabase.from('rff_vendor_assignments').delete().in('rff_id', rffIds),
          supabase.from('rff_budgets').delete().in('rff_id', rffIds),
          supabase.from('rff_awards').delete().in('rff_id', rffIds),
        ]);
        await supabase.from('rffs').delete().in('id', rffIds);
      }
      // Step 5 — delete POs and vendor invoices
      await supabase.from('vendor_invoices').delete().eq('event_id', id);
      await supabase.from('purchase_orders').delete().eq('event_id', id);
      // Step 6 — delete event
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) { alert('Delete failed: ' + error.message); return; }
      load();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Portfolio</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Events</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{events.length} active engagement{events.length !== 1 ? "s" : ""}</div>
        </div>
        {canManage && <Btn onClick={() => setModal(true)}>+ New Event</Btn>}
      </div>
      {events.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📁</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No events yet</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Click "+ New Event" to get started.</div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {(userRole === "Strategy & Events Opportunity" ? events.filter(e => e.assigned_to === user?.id) : userRole === "Country Manager" ? events.filter(e => (e.country || 'Ghana') === (user?.country || 'Ghana')) : events).map((p, idx) => (
            <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", transition: "box-shadow 0.2s, border-color 0.2s", animationDelay: idx * 0.04 + "s" }}>
              {/* Card header — always visible */}
              <div style={{ padding: "20px 22px" }}
                onMouseEnter={e => { e.currentTarget.parentElement.style.boxShadow = `0 4px 28px ${T.cyan}10`; e.currentTarget.parentElement.style.borderColor = T.cyan + "40"; }}
                onMouseLeave={e => { e.currentTarget.parentElement.style.boxShadow = "none"; e.currentTarget.parentElement.style.borderColor = T.border; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{p.client}</div>
                    {p.assigned_to_name && <div style={{ color: T.amber, fontSize: 10, fontWeight: 700, marginTop: 2 }}>👤 {p.assigned_to_name}</div>}
                  </div>
                  <Badge status={p.status} />
                </div>

                {/* Category badge + Phase row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ background: T.cyan + "18", color: T.cyan, padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{p.phase}</div>
                    {p.event_category && (
                      <div style={{ background: (EVENT_ARCHETYPES[p.event_category]?.color||T.teal)+"18", color: EVENT_ARCHETYPES[p.event_category]?.color||T.teal, border: `1px solid ${(EVENT_ARCHETYPES[p.event_category]?.color||T.teal)}30`, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>{p.event_category}</div>
                    )}
                  </div>
                  {p.deadline && <div style={{ color: T.textMuted, fontSize: 11 }}>Due {p.deadline}</div>}
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, background: T.border + "44", borderRadius: 2, marginBottom: 6 }}>
                  <div style={{ height: "100%", width: (p.completion || 0) + "%", background: `linear-gradient(90deg, ${T.cyan}, ${T.teal})`, borderRadius: 2, transition: "width 0.4s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: T.textMuted, fontSize: 10 }}>{p.completion || 0}% complete</div>
                  {canManage ? (
                    <button onClick={async (e) => {
                      e.stopPropagation();
                      await supabase.from("projects").update({ active_for_client: !p.active_for_client }).eq("id", p.id);
                      load();
                    }} style={{
                      background: p.active_for_client ? T.teal + "18" : "none",
                      border: `1px solid ${p.active_for_client ? T.teal + "60" : T.border}`,
                      color: p.active_for_client ? T.teal : T.textMuted,
                      padding: "3px 10px", borderRadius: 20, cursor: "pointer", fontSize: 10, fontWeight: 700,
                    }}>
                      {p.active_for_client ? "✓ Client Visible" : "○ Hidden"}
                    </button>
                  ) : (
                    <span style={{ color: p.active_for_client ? T.teal : T.textMuted, fontSize: 10, fontWeight: 600 }}>
                      {p.active_for_client ? "✓ Visible" : "○ Hidden"}
                    </span>
                  )}
                </div>

                {/* Edit + Delete buttons — canManage roles */}
                {canManage && (
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <button onClick={e => { e.stopPropagation(); handleEdit(p); }} style={{ flex: 1, padding: "6px 10px", background: T.cyan+"15", border: `1px solid ${T.cyan}30`, borderRadius: 6, cursor: "pointer", color: T.cyan, fontSize: 11, fontWeight: 700 }}>✎ Edit</button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }} style={{ flex: 1, padding: "6px 10px", background: T.red+"15", border: `1px solid ${T.red}30`, borderRadius: 6, cursor: "pointer", color: T.red, fontSize: 11, fontWeight: 700 }}>🗑 Delete</button>
                  </div>
                )}

                {/* Assign Opportunity + Impact buttons — CEO only */}
                {user?.role === "CEO" && (
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button onClick={e => { e.stopPropagation(); setAssignModal(p); }} style={{ flex: 1, padding: "6px 10px", background: T.amber+"15", border: `1px solid ${T.amber}30`, borderRadius: 6, cursor: "pointer", color: T.amber, fontSize: 11, fontWeight: 700 }}>
                      👤 {p.assigned_to_name ? p.assigned_to_name.split(" ")[0] : "Assign Opportunity"}
                    </button>
                    {p.event_category && (
                      <button onClick={e => { e.stopPropagation(); setImpactEvent(impactEvent?.id === p.id ? null : p); }} style={{ flex: 1, padding: "6px 10px", background: (EVENT_ARCHETYPES[p.event_category]?.color||T.teal)+"15", border: `1px solid ${(EVENT_ARCHETYPES[p.event_category]?.color||T.teal)}30`, borderRadius: 6, cursor: "pointer", color: EVENT_ARCHETYPES[p.event_category]?.color||T.teal, fontSize: 11, fontWeight: 700 }}>🎯 Impact</button>
                    )}
                  </div>
                )}

                {/* View Tasks button — privileged roles only */}
                {canSeeTasks && (() => {
                  const eventTaskCount = tasks.filter(t => t.project_id === p.id).length;
                  return (
                    <button onClick={() => setTaskModalEvent(p)} style={{
                      marginTop: 14, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: T.bg, border: `1px solid ${T.border}80`,
                      borderRadius: 8, padding: "7px 12px", cursor: "pointer", transition: "all 0.15s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyan + "60"; e.currentTarget.style.background = T.cyan + "10"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border + "80"; e.currentTarget.style.background = T.bg; }}
                    >
                      <span style={{ color: T.textMuted, fontSize: 11, fontWeight: 700 }}>
                        📋 {eventTaskCount} Task{eventTaskCount !== 1 ? "s" : ""}
                      </span>
                      <span style={{ color: T.cyan, fontSize: 11, fontWeight: 700 }}>View →</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* ── Assign Strategy Opportunity Modal ── */}
      {assignModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setAssignModal(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.amber}30`, borderRadius: 16, width: "100%", maxWidth: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Assign Strategy Opportunity</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>Event: <strong style={{ color: T.textPrimary }}>{assignModal.name}</strong></div>
            {assignModal.assigned_to_name && (
              <div style={{ background: T.amber+"12", border: `1px solid ${T.amber}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: T.amber, fontSize: 12 }}>
                Currently assigned to: <strong>{assignModal.assigned_to_name}</strong>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {strategyOpportunitys.map(sl => (
                <div key={sl.id} onClick={async () => {
                  await supabase.from("projects").update({ assigned_to: sl.id, assigned_to_name: sl.name }).eq("id", assignModal.id);
                  await supabase.from("notifications").insert({ user_id: sl.id, title: "Event Assigned to You", message: `CEO assigned you to opportunity "${assignModal.name}". Check your Events tab.`, type: "task" });
                  if (sl.email) await sendEmail(sl.email, `Event Assigned — ${assignModal.name}`, notifEmailHtml({ name: sl.name, title: "Event Assigned to You", message: `CEO has assigned you as Strategy Opportunity for <strong>${assignModal.name}</strong>. Please log in to view the event details.`, actionUrl: "https://workroom.stretchfield.com", actionLabel: "View Event" }));
                  setAssignModal(null);
                  load();
                }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: assignModal.assigned_to === sl.id ? T.amber+"15" : T.bg, border: `1px solid ${assignModal.assigned_to === sl.id ? T.amber : T.border}`, borderRadius: 10, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.amber}
                  onMouseLeave={e => e.currentTarget.style.borderColor = assignModal.assigned_to === sl.id ? T.amber : T.border}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.amber+"20", border: `1px solid ${T.amber}40`, display: "flex", alignItems: "center", justifyContent: "center", color: T.amber, fontWeight: 800, fontSize: 13 }}>{(sl.name||"?").slice(0,2).toUpperCase()}</div>
                  <div>
                    <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>{sl.name}</div>
                    <div style={{ color: T.textMuted, fontSize: 11 }}>{sl.email}</div>
                  </div>
                  {assignModal.assigned_to === sl.id && <div style={{ marginLeft: "auto", color: T.amber, fontWeight: 800 }}>✓</div>}
                </div>
              ))}
              {strategyOpportunitys.length === 0 && <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>No Strategy & Events Opportunity users found.</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {assignModal.assigned_to && (
                <button onClick={async () => {
                  await supabase.from("projects").update({ assigned_to: null, assigned_to_name: null }).eq("id", assignModal.id);
                  setAssignModal(null); load();
                }} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Remove Assignment</button>
              )}
              <button onClick={() => setAssignModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Event Tasks Modal ── */}
      {taskModalEvent && canSeeTasks && (() => {
        const eventTasks = tasks.filter(t => t.project_id === taskModalEvent.id);
        const completed = eventTasks.filter(t => t.status === "completed").length;
        const inProgress = eventTasks.filter(t => t.status === "in-progress").length;
        const pending = eventTasks.filter(t => !["completed","in-progress"].includes(t.status)).length;
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setTaskModalEvent(null)}
          >
            <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${T.cyan}20`, animation: "fadeUp 0.25s ease" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
                <div>
                  <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Event Tasks</div>
                  <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em" }}>{taskModalEvent.name}</div>
                  <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{taskModalEvent.client} · {taskModalEvent.phase}</div>
                </div>
                <button onClick={() => setTaskModalEvent(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.red + "60"; e.currentTarget.style.color = T.red; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
                >×</button>
              </div>

              {/* Task stats strip */}
              {eventTasks.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "14px 24px", borderBottom: `1px solid ${T.border}44`, flexShrink: 0 }}>
                  {[
                    { label: "Completed", value: completed, color: T.teal },
                    { label: "In Progress", value: inProgress, color: T.cyan },
                    { label: "Pending", value: pending, color: T.amber },
                  ].map((k, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}44`, borderTop: `2px solid ${k.color}`, borderRadius: 8, textAlign: "center" }}>
                      <div style={{ color: k.color, fontSize: 20, fontWeight: 900 }}>{k.value}</div>
                      <div style={{ color: T.textMuted, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{k.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Task list — scrollable */}
              <div style={{ overflowY: "auto", padding: "16px 24px", flex: 1 }}>
                {eventTasks.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                    <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No tasks yet</div>
                    <div style={{ color: T.textMuted, fontSize: 13 }}>No tasks have been assigned to this event.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {eventTasks.map(t => {
                      const pct = t.progress || 0;
                      const barColor = t.status === "completed" ? T.teal : pct > 66 ? T.cyan : pct > 33 ? T.amber : T.magenta;
                      const statusColors = { completed: T.teal, "in-progress": T.cyan, pending: T.amber, blocked: T.red };
                      const statusColor = statusColors[t.status] || T.textMuted;
                      const canComment = ["CEO", "Strategy & Events Opportunity"].includes(user?.role);
                      return (
                        <TaskCommentCard
                          key={t.id}
                          task={t}
                          user={user}
                          canComment={canComment}
                          barColor={barColor}
                          statusColor={statusColor}
                          pct={pct}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}44`, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
                <button onClick={() => setTaskModalEvent(null)} style={{ background: T.cyan + "18", border: `1px solid ${T.cyan}40`, color: T.cyan, padding: "8px 24px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em" }}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Event Modal */}
      {editEvent && canManage && (
        <Modal title="Edit Event" onClose={() => setEditEvent(null)}>
          <Input label="Event Name" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Event Category</div>
            <select value={editForm.event_category || ""} onChange={e => setEditForm({...editForm, event_category: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
              <option value="">Select category...</option>
              <option value="Conference/Seminar">Conference / Seminar</option>
              <option value="Product Launch">Product Launch</option>
              <option value="Awards Ceremony">Awards Ceremony</option>
              <option value="Corporate Party">Corporate Party</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {clients.length > 0 ? (
            <Select label="Client" options={[{ value: '', label: 'Select a client...' }, ...clients.map(c => ({ value: c.id, label: c.company || c.name }))]}
              value={editForm.client_id}
              onChange={v => {
                const c = clients.find(cl => cl.id === v);
                setEditForm({ ...editForm, client_id: v, client: c ? (c.company || c.name) : '' });
              }} />
          ) : (
            <Input label="Client Name" value={editForm.client} onChange={v => setEditForm({ ...editForm, client: v })} />
          )}
          <Input label="Date of Event" type="date" value={editForm.event_date} onChange={v => setEditForm({ ...editForm, event_date: v })} />
          <Input label="Planning Deadline" type="date" value={editForm.deadline} onChange={v => setEditForm({ ...editForm, deadline: v })} />
          <Select label="Phase" options={[
            { value: 'Planning', label: 'Planning' },
            { value: 'Design', label: 'Design' },
            { value: 'Execution', label: 'Execution' },
            { value: 'Review', label: 'Review' },
          ]} value={editForm.phase} onChange={v => setEditForm({ ...editForm, phase: v })} />
          <Select label="Status" options={[
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'on-hold', label: 'On Hold' },
          ]} value={editForm.status} onChange={v => setEditForm({ ...editForm, status: v })} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Completion: {editForm.completion}%</label>
            <input type="range" min="0" max="100" value={editForm.completion}
              onChange={e => setEditForm({ ...editForm, completion: e.target.value })}
              style={{ width: "100%", accentColor: T.cyan }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Btn>
            <Btn variant="ghost" onClick={() => setEditEvent(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title="New Event" onClose={() => setModal(false)}>
          <Input label="Event Name" placeholder="e.g. Brand Campaign" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Event Category *</div>
            <select value={form.event_category} onChange={e => setForm({...form, event_category: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${form.event_category ? T.border : "#F59E0B"}`, borderRadius: 8, color: form.event_category ? T.textPrimary : T.textMuted, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
              <option value="">Select event category...</option>
              <option value="Conference/Seminar">Conference / Seminar</option>
              <option value="Product Launch">Product Launch</option>
              <option value="Awards Ceremony">Awards Ceremony</option>
              <option value="Corporate Party">Corporate Party</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Country</div>
            <select value={form.country} onChange={e => setForm({...form, country: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
              <option value="Ghana">Ghana</option>
              <option value="Nigeria">Nigeria</option>
            </select>
          </div>
          {clients.length > 0 ? (
            <Select label="Client" options={[{ value: '', label: 'Select a client...' }, ...clients.map(c => ({ value: c.id, label: c.company || c.name }))]}
              value={form.client_id}
              onChange={v => {
                const c = clients.find(cl => cl.id === v);
                setForm({ ...form, client_id: v, client: c ? (c.company || c.name) : '' });
              }} />
          ) : (
            <Input label="Client Name" placeholder="Client company name" value={form.client} onChange={v => setForm({ ...form, client: v })} />
          )}
          <Input label="Date of Event" type="date" value={form.event_date} onChange={v => setForm({ ...form, event_date: v })} />
          <Input label="Planning Deadline" type="date" value={form.deadline} onChange={v => setForm({ ...form, deadline: v })} />
          <Select label="Phase" options={[
            { value: 'Planning', label: 'Planning' },
            { value: 'Design', label: 'Design' },
            { value: 'Execution', label: 'Execution' },
            { value: 'Review', label: 'Review' },
          ]} value={form.phase} onChange={v => setForm({ ...form, phase: v })} />
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Create Event'}</Btn>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};


const OpportunitiesView = ({ user, onNavigate }) => {
  const [opportunities, setOpportunities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [presenceFilter, setPresenceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ company: "", sector: "", presence: "GH", event_fit: "", notes: "", status: "New", contact_name: "", contact_email: "", contact_phone: "" });
  const [expandedOpp, setExpandedOpp] = useState(null);
  const [oppActivities, setOppActivities] = useState({});
  const [actForm, setActForm] = useState({ type: "note", content: "", scheduled_date: "", scheduled_time: "" });
  const [addingAct, setAddingAct] = useState(false);

  const canManage = ["CEO", "Sales & Marketing"].includes(user?.role);

  const load = async () => {
    const { data } = await supabase.from("opportunities").select("*").order("company");
    setOpportunities(data || []);
  };

  const loadActivities = async (oppId) => {
    const { data } = await supabase.from("opportunity_activities").select("*").eq("opportunity_id", oppId).order("created_at", { ascending: false });
    setOppActivities(prev => ({ ...prev, [oppId]: data || [] }));
  };

  const addActivity = async (oppId, company) => {
    if (!actForm.content) return;
    setAddingAct(true);
    await supabase.from("opportunity_activities").insert({
      opportunity_id: oppId,
      type: actForm.type,
      content: actForm.content,
      scheduled_date: actForm.scheduled_date || null,
      scheduled_time: actForm.scheduled_time || null,
      created_by: user.id,
      created_by_name: user.name,
    });
    // If scheduled — add to itineraries for calendar
    if (actForm.scheduled_date && ["call","meeting","demo","follow-up"].includes(actForm.type)) {
      await supabase.from("itineraries").insert({
        title: `${actForm.type.charAt(0).toUpperCase()+actForm.type.slice(1)} — ${company}`,
        week_start: actForm.scheduled_date,
        items: JSON.stringify([{
          date: actForm.scheduled_date,
          time: actForm.scheduled_time || "09:00",
          company,
          action: actForm.type,
          notes: actForm.content,
        }]),
        created_by: user.id,
      });
      // Notify assigned sales team
      const { data: sales } = await supabase.from("profiles").select("id, email, name").eq("role", "Sales & Marketing");
      for (const s of sales || []) {
        await supabase.from("notifications").insert({ user_id: s.id, title: `Follow-up Scheduled — ${company}`, message: `${actForm.type} scheduled on ${actForm.scheduled_date}${actForm.scheduled_time ? " at " + actForm.scheduled_time : ""} for ${company}`, type: "crm" });
        if (s.email) await sendEmail(s.email, `Follow-up Scheduled — ${company}`, notifEmailHtml({ name: s.name, title: `${actForm.type} Scheduled`, message: `A <strong>${actForm.type}</strong> has been scheduled for <strong>${company}</strong> on <strong>${actForm.scheduled_date}${actForm.scheduled_time ? " at " + actForm.scheduled_time : ""}</strong>.<br><br><em>${actForm.content}</em>`, actionUrl: BASE_URL, actionLabel: "View in WorkRoom" }));
      }
    }
    setActForm({ type: "note", content: "", scheduled_date: "", scheduled_time: "" });
    setAddingAct(false);
    loadActivities(oppId);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let f = [...opportunities];
    if (search) f = f.filter(o => o.company.toLowerCase().includes(search.toLowerCase()) || o.sector?.toLowerCase().includes(search.toLowerCase()));
    if (sectorFilter !== "all") f = f.filter(o => o.sector === sectorFilter);
    if (presenceFilter !== "all") f = f.filter(o => o.presence === presenceFilter);
    if (statusFilter !== "all") f = f.filter(o => o.status === statusFilter);
    setFiltered(f);
  }, [opportunities, search, sectorFilter, presenceFilter, statusFilter]);

  const sectors = [...new Set(opportunities.map(o => o.sector).filter(Boolean))].sort();
  const statuses = ["New", "Contacted", "Qualified", "Converted"];
  const statusColors = { New: T.cyan, Contacted: T.amber, Qualified: T.teal, Converted: "#10B981" };
  const presenceColors = { GH: T.cyan, NG: T.amber, KE: T.teal };

  const handleAdd = async () => {
    if (!form.company) return;
    setSaving(true);
    await supabase.from("opportunities").insert({ ...form });
    // form already includes contact_name, contact_email, contact_phone
    setSaving(false);
    setModal(false);
    setForm({ company: "", sector: "", presence: "GH", event_fit: "", notes: "", status: "New" });
    load();
  };

  const handleUpdate = async () => {
    setSaving(true);
    await supabase.from("opportunities").update({
      company: editModal.company, sector: editModal.sector,
      presence: editModal.presence, event_fit: editModal.event_fit,
      notes: editModal.notes, status: editModal.status,
      contact_name: editModal.contact_name || "",
      contact_email: editModal.contact_email || "",
      contact_phone: editModal.contact_phone || "",
      updated_at: new Date().toISOString(),
    }).eq("id", editModal.id);
    setSaving(false);
    setEditModal(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this opportunity?")) return;
    await supabase.from("opportunities").delete().eq("id", id);
    load();
  };

  const handleConvert = async (opp) => {
    if (!window.confirm(`Convert ${opp.company} to a Lead? It will appear in the Leads Pipeline.`)) return;
    setSaving(true);
    const { data: opportunity, error } = await supabase.from("opportunities").insert({
      company: opp.company,
      contact_name: opp.contact_name || "",
      email: opp.contact_email || "",
      phone: opp.contact_phone || "",
      status: "new",
      value: 0,
      notes: `Converted from Leads Portal.\n\nEvent Fit: ${opp.event_fit || ""}\n\nOpportunity Notes: ${opp.notes || ""}`,
      source: "Leads Portal",
      created_by: user?.id,
      assigned_to: user?.id,
      assigned_name: user?.name || "",
    }).select().single();
    console.log("Opportunity insert result:", opportunity, error);
    if (!error && opportunity) {
      await supabase.from("opportunities").update({
        status: "Converted",
        converted_opportunity_id: opportunity.id,
        updated_at: new Date().toISOString(),
      }).eq("id", opp.id);
      setSaving(false);
      load();
      // Navigate to CRM tab
      if (onNavigate) onNavigate("crm");
    } else {
      setSaving(false);
    }
  };

  const inputStyle = { width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 };

  const PresencePills = ({ presence }) => (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {(presence || "").split("+").map(p => (
        <span key={p} style={{ background: (presenceColors[p] || T.textMuted) + "18", color: presenceColors[p] || T.textMuted, border: `1px solid ${presenceColors[p] || T.textMuted}30`, borderRadius: 20, padding: "1px 8px", fontSize: 9, fontWeight: 800 }}>{p}</span>
      ))}
    </div>
  );

  const converted = opportunities.filter(o => o.status === "Converted").length;
  const qualified = opportunities.filter(o => o.status === "Qualified").length;
  const contacted = opportunities.filter(o => o.status === "Contacted").length;
  const panAfrica = opportunities.filter(o => o.presence === "GH+NG+KE").length;

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>CRM</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Opportunities</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{opportunities.length} target companies · {converted} converted to leads</div>
        </div>
        {canManage && (
          <button onClick={() => setModal(true)} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em" }}>+ Add Opportunity</button>
        )}
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total", value: opportunities.length, color: T.blue },
          { label: "Contacted", value: contacted, color: T.amber },
          { label: "Qualified", value: qualified, color: T.teal },
          { label: "Converted", value: converted, color: "#10B981" },
          { label: "Pan-Africa", value: panAfrica, color: T.magenta },
        ].map((k, i) => (
          <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 20, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or sector..." style={{ ...inputStyle, width: 220, flex: "none" }} />
        <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ ...inputStyle, width: "auto", flex: "none" }}>
          <option value="all">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={presenceFilter} onChange={e => setPresenceFilter(e.target.value)} style={{ ...inputStyle, width: "auto", flex: "none" }}>
          <option value="all">All Presence</option>
          <option value="GH+NG+KE">GH + NG + KE</option>
          <option value="GH+NG">GH + NG</option>
          <option value="GH+KE">GH + KE</option>
          <option value="GH">GH Only</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: "auto", flex: "none" }}>
          <option value="all">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color: T.textMuted, fontSize: 11, marginLeft: "auto" }}>{filtered.length} results</span>
      </div>

      {/* Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
                {["Company", "Sector", "Presence", "Event Fit", "Notes", "Status", ""].map((h, i) => (
                  <th key={i} style={{ padding: "12px 16px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => {
                const statusColor = statusColors[o.status] || T.textMuted;
                return (
                  <React.Fragment key={o.id}>
                  <tr style={{ borderBottom: expandedOpp !== o.id && i < filtered.length - 1 ? `1px solid ${T.border}44` : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13 }}>{o.company}</div>
                      {o.contact_name && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>👤 {o.contact_name}</div>}
                      {o.contact_email && <div style={{ color: T.cyan, fontSize: 11 }}>✉ {o.contact_email}</div>}
                      {o.contact_phone && <div style={{ color: T.textMuted, fontSize: 11 }}>📞 {o.contact_phone}</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: T.textMuted, fontSize: 12 }}>{o.sector}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <PresencePills presence={o.presence} />
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: 200 }}>
                      <span style={{ color: T.textSecondary, fontSize: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{o.event_fit}</span>
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: 200 }}>
                      <span style={{ color: T.textMuted, fontSize: 12, fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{o.notes}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: statusColor + "18", color: statusColor, border: `1px solid ${statusColor}30`, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>{o.status}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {canManage && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setEditModal({ ...o })} style={{ background: T.cyan + "15", border: `1px solid ${T.cyan}30`, color: T.cyan, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Edit</button>
                          <button onClick={() => { const isOpen = expandedOpp === o.id; setExpandedOpp(isOpen ? null : o.id); if (!isOpen) loadActivities(o.id); }} style={{ background: expandedOpp === o.id ? "#8B5CF620" : T.surface, border: `1px solid ${expandedOpp === o.id ? "#8B5CF6" : T.border}`, color: expandedOpp === o.id ? "#8B5CF6" : T.textMuted, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                            💬 {(oppActivities[o.id]||[]).length > 0 ? oppActivities[o.id].length : "Notes"}
                          </button>
                          {o.status !== "Converted" && (
                            <button onClick={() => handleConvert(o)} style={{ background: "#10B98115", border: "1px solid #10B98130", color: "#10B981", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>→ Lead</button>
                          )}
                          <button onClick={() => handleDelete(o.id)} style={{ background: T.red + "15", border: `1px solid ${T.red}30`, color: T.red, padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>×</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {/* Notes Thread Row */}
                  {expandedOpp === o.id && (
                    <tr key={o.id + "_notes"}>
                      <td colSpan={8} style={{ padding: "0 12px 12px", background: T.bg }}>
                        <div style={{ border: `1px solid #8B5CF630`, borderRadius: 10, padding: "14px 16px", background: T.surface }}>
                          <div style={{ color: "#8B5CF6", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Notes & Follow-ups — {o.company}</div>

                          {/* Add Activity */}
                          {canManage && (
                            <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
                              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                                {["note","call","meeting","email","demo","follow-up"].map(t => (
                                  <button key={t} onClick={() => setActForm(f => ({...f, type: t}))} style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${actForm.type === t ? "#8B5CF6" : T.border}`, background: actForm.type === t ? "#8B5CF620" : "none", color: actForm.type === t ? "#8B5CF6" : T.textMuted, fontSize: 10, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>{t}</button>
                                ))}
                              </div>
                              <textarea value={actForm.content} onChange={e => setActForm(f => ({...f, content: e.target.value}))} placeholder={`Add ${actForm.type}...`} rows={2} style={{ width: "100%", padding: "8px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 6 }} />
                              {["call","meeting","demo","follow-up"].includes(actForm.type) && (
                                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                  <input type="date" value={actForm.scheduled_date} onChange={e => setActForm(f => ({...f, scheduled_date: e.target.value}))} style={{ flex: 1, padding: "6px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                                  <input type="time" value={actForm.scheduled_time} onChange={e => setActForm(f => ({...f, scheduled_time: e.target.value}))} style={{ flex: 1, padding: "6px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                                </div>
                              )}
                              {actForm.scheduled_date && <div style={{ color: "#8B5CF6", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>📅 Will be added to calendar on {actForm.scheduled_date}{actForm.scheduled_time ? " at " + actForm.scheduled_time : ""}</div>}
                              <button onClick={() => addActivity(o.id, o.company)} disabled={addingAct || !actForm.content} style={{ background: "#8B5CF6", border: "none", color: "#fff", padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700, opacity: !actForm.content ? 0.5 : 1 }}>{addingAct ? "Adding..." : "Add"}</button>
                            </div>
                          )}

                          {/* Thread */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {(oppActivities[o.id]||[]).length === 0 && <div style={{ color: T.textMuted, fontSize: 12, textAlign: "center", padding: "8px 0" }}>No notes yet.</div>}
                            {(oppActivities[o.id]||[]).map(act => {
                              const typeColors = { note: T.textMuted, call: T.teal, meeting: T.cyan, email: T.blue, demo: T.amber, "follow-up": "#8B5CF6" };
                              const color = typeColors[act.type] || T.textMuted;
                              return (
                                <div key={act.id} style={{ background: T.bg, border: `1px solid ${T.border}`, borderLeft: `3px solid ${color}`, borderRadius: 6, padding: "10px 12px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                    <span style={{ background: color+"18", color, borderRadius: 20, padding: "1px 8px", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>{act.type}</span>
                                    <span style={{ color: T.textMuted, fontSize: 10 }}>{new Date(act.created_at).toLocaleDateString("en-GB")} · {act.created_by_name}</span>
                                  </div>
                                  <div style={{ color: T.textPrimary, fontSize: 12, lineHeight: 1.5 }}>{act.content}</div>
                                  {act.scheduled_date && <div style={{ color: "#8B5CF6", fontSize: 11, fontWeight: 700, marginTop: 4 }}>📅 {act.scheduled_date}{act.scheduled_time ? " at " + act.scheduled_time : ""} — on calendar</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.textMuted, fontSize: 13 }}>No opportunities match your filters.</div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 540, padding: 28, boxShadow: `0 24px 80px rgba(0,0,0,0.4)`, animation: "fadeUp 0.25s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 20 }}>Add Opportunity</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
              <div><label style={labelStyle}>Company Name</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={inputStyle} placeholder="e.g. Ecobank Ghana" /></div>
              <div><label style={labelStyle}>Sector</label><input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} style={inputStyle} placeholder="e.g. Banking" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
              <div><label style={labelStyle}>Presence</label>
                <select value={form.presence} onChange={e => setForm({ ...form, presence: e.target.value })} style={inputStyle}>
                  <option value="GH">GH Only</option>
                  <option value="GH+NG">GH + NG</option>
                  <option value="GH+KE">GH + KE</option>
                  <option value="GH+NG+KE">GH + NG + KE</option>
                </select>
              </div>
              <div><label style={labelStyle}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Event Fit</label><input value={form.event_fit} onChange={e => setForm({ ...form, event_fit: e.target.value })} style={inputStyle} placeholder="e.g. Brand activations, product launches" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div><label style={labelStyle}>Contact Name</label><input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} style={inputStyle} placeholder="John Mensah" /></div>
              <div><label style={labelStyle}>Email</label><input value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} style={inputStyle} placeholder="john@company.com" /></div>
              <div><label style={labelStyle}>Phone</label><input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} style={inputStyle} placeholder="+233 XX XXX XXXX" /></div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={labelStyle}>Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Follow-up notes, strategy, contact info..." /></div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleAdd} disabled={saving || !form.company} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, opacity: !form.company ? 0.5 : 1 }}>{saving ? "Saving..." : "Add Opportunity"}</button>
              <button onClick={() => setModal(false)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setEditModal(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 540, padding: 28, boxShadow: `0 24px 80px rgba(0,0,0,0.4)`, animation: "fadeUp 0.25s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 20 }}>Edit — {editModal.company}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
              <div><label style={labelStyle}>Company Name</label><input value={editModal.company} onChange={e => setEditModal({ ...editModal, company: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Sector</label><input value={editModal.sector || ""} onChange={e => setEditModal({ ...editModal, sector: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
              <div><label style={labelStyle}>Presence</label>
                <select value={editModal.presence || "GH"} onChange={e => setEditModal({ ...editModal, presence: e.target.value })} style={inputStyle}>
                  <option value="GH">GH Only</option>
                  <option value="GH+NG">GH + NG</option>
                  <option value="GH+KE">GH + KE</option>
                  <option value="GH+NG+KE">GH + NG + KE</option>
                </select>
              </div>
              <div><label style={labelStyle}>Status</label>
                <select value={editModal.status || "New"} onChange={e => setEditModal({ ...editModal, status: e.target.value })} style={inputStyle}>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Event Fit</label><input value={editModal.event_fit || ""} onChange={e => setEditModal({ ...editModal, event_fit: e.target.value })} style={inputStyle} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div><label style={labelStyle}>Contact Name</label><input value={editModal.contact_name || ""} onChange={e => setEditModal({ ...editModal, contact_name: e.target.value })} style={inputStyle} placeholder="John Mensah" /></div>
              <div><label style={labelStyle}>Email</label><input value={editModal.contact_email || ""} onChange={e => setEditModal({ ...editModal, contact_email: e.target.value })} style={inputStyle} placeholder="john@company.com" /></div>
              <div><label style={labelStyle}>Phone</label><input value={editModal.contact_phone || ""} onChange={e => setEditModal({ ...editModal, contact_phone: e.target.value })} style={inputStyle} placeholder="+233 XX XXX XXXX" /></div>
            </div>
            <div style={{ marginBottom: 20 }}><label style={labelStyle}>Notes / Follow-up</label><textarea value={editModal.notes || ""} onChange={e => setEditModal({ ...editModal, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleUpdate} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{saving ? "Saving..." : "Save Changes"}</button>
              <button onClick={() => setEditModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskCommentThread = ({ task, user }) => {
  const [comments, setComments] = React.useState([]);
  const [newComment, setNewComment] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const canSeeComments = ["CEO", "Strategy & Events Opportunity"].includes(user?.role) || user?.id === task.assignee_id;
  const canComment = ["CEO", "Strategy & Events Opportunity"].includes(user?.role) || user?.id === task.assignee_id;

  const loadComments = async () => {
    const { data } = await supabase.from("task_comments").select("*").eq("task_id", task.id).order("created_at", { ascending: true });
    setComments(data || []);
  };

  React.useEffect(() => { loadComments(); }, [task.id]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSaving(true);
    await supabase.from("task_comments").insert({
      task_id: task.id,
      author_id: user.id,
      author_name: user.name,
      author_role: user.role,
      message: newComment.trim(),
    });
    // Notify assignee if CEO or Strategy Opportunity comments
    if (["CEO", "Strategy & Events Opportunity"].includes(user.role) && task.assignee_id && task.assignee_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: task.assignee_id,
        title: `${user.name} commented on your task`,
        message: `"${task.name}" — ${newComment.trim().slice(0, 80)}`,
        type: "task",
        resource_id: task.id,
      });
    }
    // Notify CEO + Strategy Opportunity if assignee replies
    if (!["CEO", "Strategy & Events Opportunity"].includes(user.role)) {
      const { data: recipients } = await supabase.from("profiles").select("id").in("role", ["CEO", "Strategy & Events Opportunity"]);
      for (const r of (recipients || [])) {
        if (r.id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: r.id,
            title: `${user.name} replied on task`,
            message: `"${task.name}" — ${newComment.trim().slice(0, 80)}`,
            type: "task",
            resource_id: task.id,
          });
        }
      }
    }
    setNewComment("");
    setSaving(false);
    loadComments();
  };

  if (!canSeeComments) return null;

  return (
    <div style={{ marginTop: 20, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.cyan, boxShadow: `0 0 6px ${T.cyan}` }} />
        <span style={{ color: T.textPrimary, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Private Thread</span>
        <span style={{ color: T.textMuted, fontSize: 10 }}>— CEO · Strategy Opportunity · You</span>
      </div>

      {/* Comment bubbles */}
      {comments.length === 0 ? (
        <div style={{ color: T.textMuted, fontSize: 12, fontStyle: "italic", marginBottom: 14 }}>No comments yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
          {comments.map(c => {
            const isMe = c.author_id === user.id;
            const isCEO = c.author_role === "CEO";
            const bubbleColor = isCEO ? T.cyan : c.author_role === "Strategy & Events Opportunity" ? T.teal : T.amber;
            return (
              <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "85%", background: isMe ? bubbleColor + "20" : T.bg, border: `1px solid ${bubbleColor}30`, borderRadius: isMe ? "12px 12px 4px 12px" : "12px 12px 12px 4px", padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 5 }}>
                    <span style={{ color: bubbleColor, fontSize: 11, fontWeight: 800 }}>{isMe ? "You" : c.author_name}</span>
                    <span style={{ color: T.textMuted, fontSize: 10 }}>{new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <div style={{ color: T.textPrimary, fontSize: 13 }}>{c.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply input */}
      {canComment && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
            placeholder={["CEO","Strategy & Events Opportunity"].includes(user?.role) ? "Add a comment..." : "Reply to this thread..."}
            rows={2}
            style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", color: T.textPrimary, fontSize: 13, resize: "none", fontFamily: "inherit", outline: "none", transition: "border-color 0.15s" }}
            onFocus={e => e.target.style.borderColor = T.cyan + "60"}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          <button onClick={handleSubmit} disabled={saving || !newComment.trim()} style={{
            background: T.cyan + "20", border: `1px solid ${T.cyan}40`, color: T.cyan,
            padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
            opacity: !newComment.trim() ? 0.4 : 1, transition: "opacity 0.15s",
          }}>
            {saving ? "..." : "Send"}
          </button>
        </div>
      )}
    </div>
  );
};

const TasksView = ({ userRole, openTaskId, onOpenHandled }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [awardedVendors, setAwardedVendors] = useState([]);
  const [modal, setModal] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', project_id: '', deadline: '', status: 'pending', assignee_id: '', assignee_name: '', assigned_by: '' });

  const canEdit = ['CEO', 'Country Manager', 'Strategy & Events Opportunity', 'Vendor Manager', 'Vendor', 'Sales & Marketing'].includes(userRole);
  const canToggleVisibility = ['CEO','Country Manager'].includes(userRole);

  const openDetail = (task) => {
    setDetailTask(task);
    setEditForm({
      name: task.name,
      deadline: task.deadline || '',
      status: task.status,
      progress: task.progress || 0,
      notes: task.notes || '',
      assignee_id: task.assignee_id || '',
      assignee_name: task.assignee_name || '',
    });
  };

  const handleUpdate = async () => {
    setSaving(true);
    await supabase.from('tasks').update({
      name: editForm.name,
      deadline: editForm.deadline || null,
      status: editForm.status,
      progress: parseInt(editForm.progress),
      notes: editForm.notes,
      assignee_id: editForm.assignee_id || null,
      assignee_name: editForm.assignee_name || '',
    }).eq('id', detailTask.id);
    setSaving(false);
    setDetailTask(null);
    load();
  };

  const load = async () => {
    const [t, p, m, awards] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*'),
      supabase.from('profiles').select('*').not('role', 'in', '("Client","Vendor")'),
      supabase.from('rff_awards').select('*, rffs(project_id, event_name), profiles!vendor_id(id, name, email, role)').in('status', ['confirmed','po_created']),
    ]);
    setTasks(t.data || []);
    setProjects(p.data || []);
    setMembers(m.data || []);
    // Build awarded vendors list with their event
    const vendorIds = [...new Set((awards.data || []).map(a => a.vendor_id))];
    if (vendorIds.length > 0) {
      const { data: vendorProfiles } = await supabase.from('profiles').select('*').in('id', vendorIds);
      // Attach event info to each vendor
      const vendorsWithEvents = (vendorProfiles || []).map(v => ({
        ...v,
        awardedEventIds: (awards.data || []).filter(a => a.vendor_id === v.id).map(a => a.rffs?.project_id).filter(Boolean),
      }));
      setAwardedVendors(vendorsWithEvents);
    } else {
      setAwardedVendors([]);
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-open task from notification deep-link
  useEffect(() => {
    if (openTaskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === openTaskId);
      if (task) {
        openDetail(task);
        if (onOpenHandled) onOpenHandled();
      }
    }
  }, [openTaskId, tasks]);

  const handleCreate = async () => {
    setSaving(true);
    const { error } = await supabase.from('tasks').insert({ 
      name: form.name, 
      project_id: form.project_id || null, 
      deadline: form.deadline || null, 
      status: form.status, 
      progress: 0, 
      comments: 0,
      assignee_id: form.assignee_id || null,
      assignee_name: form.assignee_name || '',
      assigned_by: form.assigned_by || ''
    });
    if (error) { alert('Error: ' + error.message); setSaving(false); return; }
    setModal(false);
    setForm({ name: '', event_id: '', project_id: '', client_id: '', deadline: '', status: 'pending' });
    setSaving(false);
    load();
  };

  const pending = tasks.filter(t => t.status === "pending").length;
  const inProg = tasks.filter(t => t.status === "in-progress").length;
  const done = tasks.filter(t => t.status === "completed").length;

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Workload</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Event Tasks</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{tasks.length} total · {inProg} in progress · {done} completed</div>
        </div>
        {canEdit && <Btn onClick={() => setModal(true)}>+ New Task</Btn>}
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Pending", value: pending, color: T.amber },
          { label: "In Progress", value: inProg, color: T.cyan },
          { label: "Completed", value: done, color: T.teal },
        ].map((k, i) => (
          <div key={i} style={{ padding: "16px 18px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 22, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No tasks yet</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Click "+ New Task" to get started.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {tasks.map((t, idx) => {
            const proj = projects.find(p => p.id === t.project_id);
            const pct = t.progress || 0;
            const barColor = t.status === "completed" ? T.teal : pct > 66 ? T.cyan : pct > 33 ? T.amber : T.magenta;
            return (
              <div key={t.id} onClick={() => openDetail(t)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 24px ${T.cyan}12`; e.currentTarget.style.borderColor = T.cyan + "40"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = T.border; }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, letterSpacing: "-0.01em", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                    {proj && <div style={{ color: T.cyan, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{proj.name}</div>}
                    {proj?.client && <div style={{ color: T.textMuted, fontSize: 10, marginTop: 2 }}>{proj.client}</div>}
                  </div>
                  <Badge status={t.status} />
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, background: T.border + "44", borderRadius: 2, marginBottom: 6 }}>
                  <div style={{ height: "100%", width: pct + "%", background: barColor, borderRadius: 2, transition: "width 0.4s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ color: T.textMuted, fontSize: 10 }}>{pct}% complete</div>
                  {t.deadline && <div style={{ color: T.textMuted, fontSize: 10 }}>Due {t.deadline}</div>}
                </div>

                {/* Assignee + visibility */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${T.border}44` }}>
                  <div style={{ color: t.assignee_name ? T.cyan : T.textMuted, fontSize: 10, fontWeight: t.assignee_name ? 600 : 400 }}>
                    {t.assignee_name ? "→ " + t.assignee_name : "Unassigned"}
                  </div>
                  {canToggleVisibility && (
                    <button onClick={async (e) => {
                      e.stopPropagation();
                      await supabase.from("tasks").update({ visible_to_client: !t.visible_to_client }).eq("id", t.id);
                      load();
                    }} style={{
                      background: t.visible_to_client ? T.teal + "18" : "none",
                      border: `1px solid ${t.visible_to_client ? T.teal + "50" : T.border}`,
                      color: t.visible_to_client ? T.teal : T.textMuted,
                      padding: "2px 8px", borderRadius: 20, cursor: "pointer", fontSize: 9, fontWeight: 700,
                    }}>
                      {t.visible_to_client ? "👁 Client" : "Hidden"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {detailTask && (
        <Modal title={canEdit ? "Edit Task" : "Task Details"} onClose={() => setDetailTask(null)}>
          <div style={{ color: T.cyan, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
            📁 {projects.find(p => p.id === detailTask.project_id)?.name || 'No Event'}
          </div>
          {canEdit ? (
            <>
              <Input label="Task Name" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} />
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Progress: {editForm.progress}%</div>
                <input type="range" min="0" max="100" value={editForm.progress}
                  onChange={e => setEditForm({ ...editForm, progress: e.target.value })}
                  style={{ width: '100%', accentColor: T.cyan }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: T.textMuted, fontSize: 11, marginTop: 4 }}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
              <Select label="Status" options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
              ]} value={editForm.status} onChange={v => setEditForm({ ...editForm, status: v })} />
              <Select label="Assigned To" options={[{ value: '', label: 'Select...' }, ...members.map(m => ({ value: m.id, label: m.name + ' — ' + m.role }))]}
                value={editForm.assignee_id}
                onChange={v => { const m = members.find(x => x.id === v); setEditForm({ ...editForm, assignee_id: v, assignee_name: m ? m.name : '' }); }} />
              <Input label="Deadline" type="date" value={editForm.deadline} onChange={v => setEditForm({ ...editForm, deadline: v })} />
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notes</div>
                <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Add notes, updates or comments..."
                  style={{ width: '100%', minHeight: 100, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 10, color: T.textPrimary, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Btn onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Btn>
                <Btn variant="ghost" onClick={() => setDetailTask(null)}>Cancel</Btn>
              </div>
            </>
          ) : (
            <div>
              <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{detailTask.name}</div>
              <ProgressBar value={detailTask.progress || 0} />
              <div style={{ color: T.textSecondary, fontSize: 13, marginTop: 8 }}>{detailTask.progress || 0}% complete</div>
              {detailTask.assignee_name && <div style={{ color: T.textSecondary, fontSize: 13, marginTop: 8 }}>👤 {detailTask.assignee_name}</div>}
              {detailTask.deadline && <div style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>📅 Due {detailTask.deadline}</div>}
              {detailTask.notes && <div style={{ color: T.textSecondary, fontSize: 13, marginTop: 12, padding: 12, background: T.bg, borderRadius: 6 }}>{detailTask.notes}</div>}
            </div>
          )}
        </Modal>
      )}

      {modal && (
        <Modal title="New Task" onClose={() => setModal(false)}>
          <Input label="Task Name" placeholder="Describe the task" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <Select label="Event" options={[{ value: '', label: 'Select event...' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} value={form.project_id} onChange={v => { const proj = projects.find(p => p.id === v); setForm({ ...form, project_id: v, client_id: proj?.client_id || '' }); }} />
          {(() => {
            // Get vendors awarded to this event
            const eventVendors = form.project_id
              ? awardedVendors.filter(a => a.rffs?.project_id === form.project_id).map(a => ({
                  value: a.vendor_id,
                  label: a.vendor_name + ' — Vendor',
                  isVendor: true,
                }))
              : [];
            const staffOptions = members.map(m => ({ value: m.id, label: m.name + ' — ' + m.role }));
            const allOptions = [
              { value: '', label: 'Select assignee...' },
              ...staffOptions,
              ...(eventVendors.length > 0 ? [{ value: '__divider__', label: '── Awarded Vendors ──', disabled: true }, ...eventVendors] : []),
            ];
            return (
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Assign To (Person Responsible)</div>
                <select value={form.assignee_id} onChange={e => {
                  const v = e.target.value;
                  if (v === '__divider__') return;
                  const m = members.find(x => x.id === v);
                  const vendor = awardedVendors.find(a => a.vendor_id === v);
                  setForm({ ...form, assignee_id: v, assignee_name: m ? m.name : vendor ? vendor.vendor_name : '' });
                }} style={{ width: '100%', padding: '9px 12px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
                  {allOptions.map((o, i) => <option key={i} value={o.value} disabled={o.disabled}>{o.label}</option>)}
                </select>
                {form.project_id && eventVendors.length > 0 && <div style={{ color: T.teal, fontSize: 11, marginTop: 4 }}>✓ {eventVendors.length} awarded vendor{eventVendors.length !== 1 ? "s" : ""} available for this event</div>}
                {form.project_id && eventVendors.length === 0 && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>No confirmed vendors for this event yet</div>}
              </div>
            );
          })()}
          <Select label="Assigned By" options={[{ value: '', label: 'Select assignor...' }, ...members.map(m => ({ value: m.id, label: m.name + ' — ' + m.role }))]} value={form.assigned_by} onChange={v => setForm({ ...form, assigned_by: v })} />
          <Input label="Deadline" type="date" value={form.deadline} onChange={v => setForm({ ...form, deadline: v })} />
          <Select label="Status" options={[
            { value: 'pending', label: 'Pending' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ]} value={form.status} onChange={v => setForm({ ...form, status: v })} />
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Create Task'}</Btn>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

const VendorsView = ({ user }) => {
  const [rffs, setRffs] = useState([]);
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [modal, setModal] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [showAppModal, setShowAppModal] = useState(false);
  const [showApprovalsPanel, setShowApprovalsPanel] = useState(false);
  const [vendorApps, setVendorApps] = useState([]);
  const [expandedRff, setExpandedRff] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', client_id: '', client_name: '', project_id: '', event_name: '', deadline: '', event_type: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resubmitModal, setResubmitModal] = useState(null);
  const [resubmitFile, setResubmitFile] = useState(null);
  const [resubmitNotes, setResubmitNotes] = useState('');
  const isVendorManager = user?.role === 'Vendor Manager';

  const load = async () => {
    const [r, e, c, apps] = await Promise.all([
      supabase.from('rffs').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('vendor_applications').select('*').order('created_at', { ascending: false }),
    ]);
    // Show all RFFs for Vendor Manager/CEO/Admin
    setRffs(r.data || []);
    setEvents(e.data || []);
    setClients(c.data || []);
    setVendorApps(apps.data || []);
  };

  useEffect(() => { load(); }, []);

  const generateRffCode = async (eventType) => {
    const typeMap = { "Conference/Seminar": "CS", "Product Launch": "PL", "Awards Ceremony": "AWD", "Corporate Party": "CP", "Other": "OTH" };
    const prefix = typeMap[eventType] || "GEN";
    const year = new Date().getFullYear().toString().slice(-2);
    // Get or create sequence for this type+year
    const { data: seq } = await supabase.from("rff_sequences").select("*").eq("event_type", prefix).eq("year", parseInt("20"+year)).single();
    let nextSeq = 1;
    if (seq) {
      nextSeq = (seq.last_sequence || 0) + 1;
      await supabase.from("rff_sequences").update({ last_sequence: nextSeq }).eq("id", seq.id);
    } else {
      await supabase.from("rff_sequences").insert({ event_type: prefix, year: parseInt("20"+year), last_sequence: 1 });
    }
    return `ST/${prefix}/${year}/${String(nextSeq).padStart(3, "0")}`;
  };

  const handleCreate = async () => {
    if (!form.client_id || !form.project_id) { setError('Client and event are required.'); return; }
    if (!form.event_type) { setError('Please select an event type.'); return; }
    setSaving(true); setError('');
    let document_url = '';
    let document_name = '';
    if (file) {
      const ext = file.name.split('.').pop();
      const filename = `rff_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('rffs').upload(filename, file);
      if (uploadErr) { setError('Upload failed: ' + uploadErr.message); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from('rffs').getPublicUrl(filename);
      document_url = urlData.publicUrl;
      document_name = file.name;
    }
    const rffCode = await generateRffCode(form.event_type);
    const { error } = await supabase.from('rffs').insert({
      title: rffCode, description: form.description,
      client_id: form.client_id, client_name: form.client_name,
      project_id: form.project_id, event_name: form.event_name,
      deadline: form.deadline || null, document_url, document_name,
      status: 'pending', submitted_for_approval: true, approved: false,
      event_type: form.event_type, rff_code: rffCode,
    });
    if (error) { setError(error.message); setSaving(false); return; }
    setModal(false);
    setForm({ title: '', description: '', client_id: '', client_name: '', project_id: '', event_name: '', deadline: '', event_type: '' });
    setFile(null); setSaving(false); load();
  };

  const handleResubmit = async () => {
    setSaving(true);
    let document_url = resubmitModal.document_url || '';
    let document_name = resubmitModal.document_name || '';
    if (resubmitFile) {
      const ext = resubmitFile.name.split('.').pop();
      const filename = `rff_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('rffs').upload(filename, resubmitFile);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('rffs').getPublicUrl(filename);
        document_url = urlData.publicUrl;
        document_name = resubmitFile.name;
      }
    }
    await supabase.from('rffs').update({
      status: 'pending',
      approved: false,
      submitted_for_approval: true,
      declined_notes: null,
      document_url,
      document_name,
      status_notes: resubmitNotes,
    }).eq('id', resubmitModal.id);
    // Notify CEO
    const { data: ceos } = await supabase.from('profiles').select('id').in('role', ['CEO', 'Country Manager']);
    if (ceos) await Promise.all(ceos.map(c => supabase.from('notifications').insert({ user_id: c.id, title: 'RFF Resubmitted', message: `RFF "${resubmitModal.title}" has been revised and resubmitted for approval.`, type: 'rff' })));
    setResubmitModal(null); setResubmitFile(null); setResubmitNotes('');
    setSaving(false); load();
  };

  // Group RFFs by event
  const grouped = events.reduce((acc, e) => {
    const eventRffs = rffs.filter(r => r.project_id === e.id);
    if (eventRffs.length > 0) acc[e.id] = { event: e, rffs: eventRffs };
    return acc;
  }, {});

  const totalPending = rffs.filter(r => r.status === 'pending').length;
  const totalApproved = rffs.filter(r => r.approved).length;
  const totalQuotes = rffs.filter(r => r.status === 'quote-submitted').length;
  const totalDeclined = rffs.filter(r => r.status === 'declined').length;

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Procurement</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Vendors & RFFs</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{rffs.length} requests across {Object.keys(grouped).length} event{Object.keys(grouped).length !== 1 ? "s" : ""}</div>
        </div>
        <Btn onClick={() => setModal(true)}>+ New RFF</Btn>
      </div>

      {/* Vendor Applications Panel — CEO */}
      {showApprovalsPanel && user?.role === "CEO" && (
        <div style={{ marginBottom: 24, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Vendor Applications</div>
          <VendorApprovalsPanel user={user} onLoginCreated={load} />
        </div>
      )}

      {/* Vendor Manager — approved vendors with account status */}
      {user?.role === "Vendor Manager" && vendorApps.filter(a => ["approved","login-created"].includes(a.status)).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Approved Vendors — Account Status</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {vendorApps.filter(a => ["approved","login-created"].includes(a.status)).map(app => (
              <div key={app.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${app.status === "login-created" ? "#10B981" : T.amber}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{app.vendor_name}</div>
                <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 6 }}>{app.vendor_type} · {app.contact_person}</div>
                <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 8 }}>{app.contact_email}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: app.status === "login-created" ? "#10B981" : T.amber }} />
                  <span style={{ color: app.status === "login-created" ? "#10B981" : T.amber, fontSize: 11, fontWeight: 700 }}>
                    {app.status === "login-created" ? "Portal Access Granted" : "Awaiting Login Creation"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Pending Approval", value: totalPending, color: T.amber },
          { label: "CEO Approved", value: totalApproved, color: T.teal },
          { label: "Quotes In", value: totalQuotes, color: T.cyan },
          { label: "Declined", value: totalDeclined, color: T.red },
        ].map((k, i) => (
          <div key={i} style={{ padding: "16px 18px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 22, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No RFFs yet</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Create an RFF and assign it to a client event.</div>
        </div>
      ) : <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{Object.values(grouped).map(({ event: e, rffs: eventRffs }) => (
        <div key={e.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          {/* Event Group Header */}
          <button onClick={() => setExpandedEvent(expandedEvent === e.id ? null : e.id)} style={{
            width: "100%", background: expandedEvent === e.id ? T.cyan + "08" : "none",
            border: "none", borderBottom: expandedEvent === e.id ? `1px solid ${T.border}` : "none",
            padding: "16px 20px", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 4, height: 36, background: `linear-gradient(180deg, ${T.cyan}, ${T.teal})`, borderRadius: 2, flexShrink: 0 }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15 }}>{e.name}</div>
                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{e.client} · {eventRffs.length} RFF{eventRffs.length > 1 ? "s" : ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["pending","quote-submitted","approved","declined"].map(s => {
                  const count = eventRffs.filter(r => r.status === s).length;
                  if (!count) return null;
                  return <Badge key={s} status={s} />;
                })}
              </div>
              <span style={{ color: T.textMuted, fontSize: 16, transition: "transform 0.2s", display: "inline-block", transform: expandedEvent === e.id ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </div>
          </button>

          {expandedEvent === e.id && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, padding: "16px 20px" }}>
              {eventRffs.map(r => (
                <div key={r.id} style={{ marginBottom: 0 }}>
                  <div onClick={() => setExpandedRff(expandedRff === r.id ? null : r.id)} style={{ cursor: "pointer", background: T.bg, border: `1px solid ${T.border}`, borderTop: `2px solid ${T.cyan}`, borderRadius: 10, padding: "16px 18px", transition: "box-shadow 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 20px ${T.cyan}12`}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>📅 Due {r.deadline}</div>
                        {/* Status indicators for Vendor Manager */}
                        {isVendorManager && r.status === 'pending' && r.submitted_for_approval && (
                          <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", background: T.amber + "15", border: "1px solid " + T.amber + "33", borderRadius: 20 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.amber }} />
                            <span style={{ color: T.amber, fontSize: 11, fontWeight: 700 }}>Pending CEO Approval</span>
                          </div>
                        )}
                        {isVendorManager && r.status === 'approved' && (
                          <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", background: T.teal + "15", border: "1px solid " + T.teal + "33", borderRadius: 20 }}>
                            <span style={{ color: T.teal, fontSize: 11, fontWeight: 700 }}>✓ Approved by CEO</span>
                          </div>
                        )}
                        {r.status === 'declined' && r.declined_notes && (
                          <div style={{ marginTop: 6, padding: "8px 10px", background: "#F43F5E10", border: "1px solid #F43F5E33", borderRadius: 6 }}>
                            <div style={{ color: "#F43F5E", fontSize: 11, fontWeight: 700 }}>⛔ Declined by CEO</div>
                            <div style={{ color: T.textSecondary, fontSize: 11, marginTop: 2 }}>{r.declined_notes}</div>
                            {isVendorManager && (
                              <button onClick={e => { e.stopPropagation(); setResubmitModal(r); setResubmitNotes(''); setResubmitFile(null); }} style={{ marginTop: 8, padding: "5px 12px", background: T.cyan + "20", border: "1px solid " + T.cyan + "44", borderRadius: 6, cursor: "pointer", color: T.cyan, fontSize: 11, fontWeight: 700 }}>
                                🔄 Revise & Resubmit
                              </button>
                            )}
                          </div>
                        )}
                        {r.description && <div style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>{r.description}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge status={r.status} />
                        <span style={{ color: T.textMuted, fontSize: 14 }}>{expandedRff === r.id ? '▾' : '▸'}</span>
                      </div>
                    </div>
                    {r.document_url && (
                      <a href={r.document_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        color: T.cyan, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                        background: T.cyan + '15', padding: '5px 12px', borderRadius: 6,
                        border: `1px solid ${T.cyan}33`,
                      }}>📄 {r.document_name || 'Download RFF'}</a>
                    )}
                    {['CEO','Country Manager'].includes(user?.role) && !r.approved && (
                      <button onClick={async (e) => { e.stopPropagation(); await supabase.from('rffs').update({ approved: true, approved_by: user.id }).eq('id', r.id); load(); }} style={{
                        marginLeft: 8, background: T.teal + '20', border: `1px solid ${T.teal}`, color: T.teal,
                        padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}>✓ Approve RFF</button>
                    )}
                    {r.approved && <span style={{ marginLeft: 8, color: T.teal, fontSize: 12, fontWeight: 600 }}>✓ Approved for Vendors</span>}
                  </div>

                  {/* Quotes submitted for this RFF */}
                  {expandedRff === r.id && (
                    <div style={{ marginTop: 8, paddingLeft: 16 }}>
                      {r.status === 'pending' ? (
                        <div style={{ color: T.textMuted, fontSize: 13, padding: '12px 16px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
                          ⏳ No quotes submitted yet
                        </div>
                      ) : (
                        <Card style={{ borderLeft: `3px solid ${T.cyan}` }}>
                          <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Quote Received</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>{r.vendor || 'Vendor'}</div>
                            {(() => { const vp = vendors.find(v => v.name === r.vendor); if (!vp || !vp.vendor_scorecard_count) return <span style={{ fontSize: 10, color: T.textMuted, padding: '2px 8px', borderRadius: 20, border: '1px solid ' + T.border }}>Unrated</span>; const t = getTier(vp.vendor_score || 0); return <span style={{ fontSize: 10, fontWeight: 700, color: t.color, padding: '2px 8px', borderRadius: 20, background: t.bg, border: '1px solid ' + t.color + '44' }}>{t.label} {vp.vendor_score}%</span>; })()}
                          </div>
                              <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Amount: <span style={{ color: T.amber, fontWeight: 700 }}>GHS {(r.amount || 0).toLocaleString()}</span></div>
                            </div>
                            <Badge status={r.status} />
                          </div>
                          {r.quote_url && (
                            <a href={r.quote_url} target="_blank" rel="noopener noreferrer" style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
                              color: T.teal, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                              background: T.teal + '15', padding: '5px 12px', borderRadius: 6,
                              border: `1px solid ${T.teal}33`,
                            }}>📎 {r.quote_filename || 'View Quote'}</a>
                          )}
                          {r.status === 'quote-submitted' && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                              <Btn small onClick={async () => {
                                await supabase.from('rffs').update({ status: 'quote-approved' }).eq('id', r.id);
                                load();
                              }}>✓ Approve Quote</Btn>
                              <Btn small variant="ghost" onClick={async () => {
                                await supabase.from('rffs').update({ status: 'pending', amount: null, vendor: null, quote_url: null, quote_filename: null }).eq('id', r.id);
                                load();
                              }}>✕ Reject</Btn>
                            </div>
                          )}
                          {r.status === 'quote-approved' && <div style={{ color: T.teal, fontSize: 12, fontWeight: 600, marginTop: 12 }}>✓ Quote Approved</div>}
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}</div>}

      }{modal && (
        <Modal title="New RFF" onClose={() => { setModal(false); setError(''); }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Event Type *</div>
            <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${form.event_type ? T.border : T.amber}`, borderRadius: 8, color: form.event_type ? T.textPrimary : T.textMuted, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
              <option value="">Select event type...</option>
              <option value="Conference/Seminar">Conference / Seminar (ST/CS)</option>
              <option value="Product Launch">Product Launch (ST/PL)</option>
              <option value="Awards Ceremony">Awards Ceremony (ST/AWD)</option>
              <option value="Corporate Party">Corporate Party (ST/CP)</option>
              <option value="Other">Other (ST/OTH)</option>
            </select>
          </div>
          {form.event_type && (
            <div style={{ marginBottom: 14, padding: "8px 12px", background: T.cyan+"12", border: `1px solid ${T.cyan}30`, borderRadius: 8 }}>
              <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>RFF Code Preview</div>
              <div style={{ color: T.cyan, fontWeight: 900, fontSize: 16 }}>ST/{{"Conference/Seminar":"CS","Product Launch":"PL","Awards Ceremony":"AWD","Corporate Party":"CP","Other":"OTH"}[form.event_type]}/{new Date().getFullYear().toString().slice(-2)}/###</div>
            </div>
          )}
          <Input label="Description" placeholder="Brief description of what's needed" value={form.description} onChange={v => setForm({ ...form, description: v })} />
          <Select label="Client" options={[{ value: '', label: 'Select client...' }, ...clients.map(c => ({ value: c.id, label: c.company || c.name }))]}
            value={form.client_id}
            onChange={v => { const c = clients.find(x => x.id === v); setForm({ ...form, client_id: v, client_name: c ? c.name : '', project_id: '', event_name: '' }); }} />
          <Select label="Event" options={[{ value: '', label: form.client_id ? 'Select event...' : 'Select client first...' }, ...events.filter(e => e.client_id === form.client_id).map(e => ({ value: e.id, label: e.name }))]}
            value={form.project_id}
            onChange={v => { const e = events.find(x => x.id === v); setForm({ ...form, project_id: v, event_name: e ? e.name : '' }); }} />
          <Input label="Deadline" type="date" value={form.deadline} onChange={v => setForm({ ...form, deadline: v })} />
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Upload RFF Document (PDF)</div>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} style={{
              width: '100%', padding: '10px', background: T.bg,
              border: `1px solid ${T.border}`, borderRadius: 6,
              color: T.textSecondary, fontSize: 13, cursor: 'pointer',
            }} />
            {file && <div style={{ color: T.cyan, fontSize: 12, marginTop: 6 }}>✓ {file.name}</div>}
          </div>
          {error && <div style={{ color: '#F43F5E', fontSize: 12, marginTop: 4 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn onClick={handleCreate} disabled={saving}>{saving ? 'Uploading...' : 'Create RFF'}</Btn>
            <Btn variant="ghost" onClick={() => { setModal(false); setError(''); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

const InvoicesView = () => {
  const [invoices, setInvoices] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ vendor: '', amount: '', status: 'pending', date: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    setInvoices(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    await supabase.from('invoices').update({ status: 'approved' }).eq('id', id);
    load();
  };

  // Summary stats
  const totalPending = invoices.filter(i => i.status === "pending").reduce((a, i) => a + (i.amount || 0), 0);
  const totalApproved = invoices.filter(i => i.status === "approved").reduce((a, i) => a + (i.amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((a, i) => a + (i.amount || 0), 0);

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Finance</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Invoices</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Review and approve vendor invoices</div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Pending", value: "GHS " + totalPending.toLocaleString(), count: invoices.filter(i => i.status === "pending").length, color: T.amber },
          { label: "Approved", value: "GHS " + totalApproved.toLocaleString(), count: invoices.filter(i => i.status === "approved").length, color: T.teal },
          { label: "Paid", value: "GHS " + totalPaid.toLocaleString(), count: invoices.filter(i => i.status === "paid").length, color: T.cyan },
        ].map((s, i) => (
          <div key={i} style={{ padding: "16px 18px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${s.color}`, borderRadius: 10 }}>
            <div style={{ color: s.color, fontSize: 18, fontWeight: 900 }}>{s.value}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <div style={{ color: T.textPrimary, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
              <div style={{ color: T.textMuted, fontSize: 11 }}>{s.count} invoice{s.count !== 1 ? "s" : ""}</div>
            </div>
          </div>
        ))}
      </div>

      {invoices.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🧾</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No invoices yet</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Invoices submitted by vendors will appear here.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {invoices.map(inv => (
            <div key={inv.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 24px ${T.cyan}10`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>{inv.vendor}</div>
                  <div style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>{inv.event_name || "—"}</div>
                  <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{inv.date}</div>
                </div>
                <Badge status={inv.status} />
              </div>
              <div style={{ color: T.gold, fontSize: 20, fontWeight: 900, marginBottom: 12 }}>GHS {(inv.amount || 0).toLocaleString()}</div>
              {inv.status === "pending" && (
                <Btn small onClick={() => handleApprove(inv.id)}>✓ Approve</Btn>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const VendorRFFsView = ({ user }) => {
  const [rffs, setRffs] = useState([]);
  const [quoteModal, setQuoteModal] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteFile, setQuoteFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadRffs = async () => {
    console.log("VendorRFFsView - user.id:", user?.id, "user:", user);
    const { data: myAssignments, error: aErr } = await supabase.from("rff_vendor_assignments").select("rff_id").eq("vendor_id", user.id);
    console.log("Assignments:", myAssignments, "Error:", aErr);
    if (!myAssignments || myAssignments.length === 0) { setRffs([]); return; }
    const rffIds = myAssignments.map(a => a.rff_id);
    const { data, error: rErr } = await supabase.from("rffs").select("*").in("id", rffIds).order("created_at", { ascending: false });
    console.log("RFFs:", data, "Error:", rErr);
    setRffs(data || []);
  };

  useEffect(() => { loadRffs(); }, []);

  const handleSubmitQuote = async () => {
    if (!quoteAmount) { setError('Please enter your quote amount.'); return; }
    setSaving(true); setError('');

    let quote_url = '';
    let quote_filename = '';

    if (quoteFile) {
      const ext = quoteFile.name.split('.').pop();
      const filename = `quote_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('rffs').upload(filename, quoteFile);
      if (uploadErr) { setError('Upload failed: ' + uploadErr.message); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from('rffs').getPublicUrl(filename);
      quote_url = urlData.publicUrl;
      quote_filename = quoteFile.name;
    }

    // Save quote to rff_vendor_assignments
    await supabase.from('rff_vendor_assignments').update({
      quote_amount: parseFloat(quoteAmount),
      quote_document_url: quote_url,
      quote_submitted_at: new Date().toISOString(),
      quote_notes: quoteFile?.name || "",
      status: 'quote-submitted',
    }).eq('rff_id', quoteModal.id).eq('vendor_id', user.id);

    // Also update RFF status
    await supabase.from('rffs').update({
      status: 'quote-submitted',
      quote_url,
      quote_filename,
    }).eq('id', quoteModal.id);

    // Notify Vendor Manager
    const { data: vms } = await supabase.from('profiles').select('id').eq('role', 'Vendor Manager');
    if (vms) await Promise.all(vms.map(vm => supabase.from('notifications').insert({
      user_id: vm.id,
      title: 'Quote Submitted',
      message: `${user.name} submitted a quote of GHS ${parseFloat(quoteAmount).toLocaleString()} for "${quoteModal.title}"`,
      type: 'rff',
    })));

    setQuoteModal(null);
    setQuoteAmount('');
    setQuoteFile(null);
    setSaving(false);
    loadRffs();
  };

  return (
    <div>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}`, animation: "fadeUp 0.35s ease" }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Procurement</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Available RFFs</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Browse and submit your quotes</div>
      </div>
      {rffs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No open RFFs</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>New RFFs will appear here when available.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {rffs.map(r => (
            <div key={r.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${T.cyan}`, borderRadius: 12, padding: "18px 20px", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 24px ${T.cyan}12`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>{r.title}</div>
                  <div style={{ color: T.cyan, fontSize: 11, marginTop: 4, fontWeight: 700 }}>{r.client_name}</div>
                  <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{r.event_name} · Due {r.deadline}</div>
                  {r.description && <div style={{ color: T.textMuted, fontSize: 12, marginTop: 8, fontStyle: "italic" }}>{r.description}</div>}
                </div>
                <Badge status={r.status} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}44` }}>
                {r.document_url && (
                  <a href={r.document_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.cyan, fontSize: 11, fontWeight: 700, textDecoration: "none", background: T.cyan + "12", padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.cyan}30` }}>📄 Download</a>
                )}
                <Btn small onClick={() => { setQuoteModal(r); setQuoteAmount(""); }}>Submit Quote</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {quoteModal && (
        <Modal title={`Submit Quote — ${quoteModal.title}`} onClose={() => { setQuoteModal(null); setError(''); }}>
          <div style={{ color: T.textSecondary, fontSize: 13, marginBottom: 16, padding: '10px 14px', background: T.cyan + '10', borderRadius: 8, border: `1px solid ${T.cyan}22` }}>
            Client: <strong style={{ color: T.cyan }}>{quoteModal.client_name}</strong> · Event: <strong style={{ color: T.textPrimary }}>{quoteModal.event_name}</strong>
          </div>
          <Input label="Quote Amount (GHS )" type="number" placeholder="e.g. 5000" value={quoteAmount} onChange={v => setQuoteAmount(v)} />
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Attach Invoice / Quotation Document</div>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={e => setQuoteFile(e.target.files[0])} style={{
              width: '100%', padding: '10px', background: T.bg,
              border: `1px solid ${T.border}`, borderRadius: 6,
              color: T.textSecondary, fontSize: 13, cursor: 'pointer',
            }} />
            {quoteFile && <div style={{ color: T.cyan, fontSize: 12, marginTop: 6 }}>✓ {quoteFile.name}</div>}
          </div>
          {error && <div style={{ color: '#F43F5E', fontSize: 12, marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Btn onClick={handleSubmitQuote} disabled={saving}>{saving ? 'Submitting...' : 'Submit Quote'}</Btn>
            <Btn variant="ghost" onClick={() => { setQuoteModal(null); setError(''); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

const UsersView = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: '', country: '', phone: '', newPassword: '' });
  const [form, setForm] = useState({ name: '', email: '', role: 'Country Manager', password: '', country: 'Ghana' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const roleColors = {
    'CEO': T.cyan, 'Country Manager': T.blue, 'Vendor Manager': T.magenta,
    'Strategy & Events Opportunity': T.amber, 'Sales & Marketing': '#EC4899',
    'Vendor': '#06B6D4', 'Client': '#84CC16',
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('name');
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { setError('All fields required.'); return; }
    setSaving(true); setError('');
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password });
    if (authErr) { setError(authErr.message); setSaving(false); return; }
    const uid = authData.user?.id;
    const initials = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    await supabase.from('profiles').insert({ id: uid, name: form.name, email: form.email, role: form.role, avatar: initials });
    setModal(false);
    setForm({ name: '', email: '', role: 'Country Manager', password: '' });
    setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this user? This cannot be undone.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        'https://okbduzenceoknkjqnrha.supabase.co/functions/v1/delete-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userId: id }),
        }
      );
      const result = await res.json();
      if (result.error) { alert('Delete failed: ' + result.error); return; }
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Administration</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>User Management</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{users.length} total users</div>
        </div>
        <Btn onClick={() => setModal(true)}>+ Add User</Btn>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: 12, marginBottom: 24 }}>
        {[...new Set(users.map(u => u.role))].map((role, i) => {
          const roleColors = { "CEO": T.cyan, "Country Manager": T.teal, "Vendor Manager": T.amber, "Strategy & Events Opportunity": T.magenta, "Finance Manager": T.gold, "Sales & Marketing": T.blue, "Vendor": T.textSecondary, "Client": "#10B981", "Board of Directors": "#8B5CF6" };
          const color = roleColors[role] || T.textMuted;
          return (
            <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${color}`, borderRadius: 10 }}>
              <div style={{ color: color, fontSize: 20, fontWeight: 900 }}>{users.filter(u => u.role === role).length}</div>
              <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 4 }}>{role}</div>
            </div>
          );
        })}
      </div>
      {loading ? (
        <div style={{ color: T.textMuted, textAlign: 'center', padding: 60 }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {users.map(u => (
            <Card key={u.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <Avatar initials={u.avatar || '??'} size={44} color={roleColors[u.role] || T.textMuted} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>{u.name}</div>
                  <div style={{ color: T.textMuted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ background: (roleColors[u.role] || T.textMuted) + '22', color: roleColors[u.role] || T.textMuted, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{u.role}</span>
                {u.email !== user?.email && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => openEdit(u)} style={{ background: T.cyan+"18", border: `1px solid ${T.cyan}40`, color: T.cyan, width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✎</button>
                    <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 18, padding: '2px 6px' }}>×</button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Edit User Modal */}
      {editModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setEditModal(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Edit User</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>{editModal.email}</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Full Name</label>
              <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Role</label>
              <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                <option value="Country Manager">Country Manager</option>
                <option value="Vendor Manager">Vendor Manager</option>
                <option value="Strategy & Events Opportunity">Strategy & Events Opportunity</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Finance Manager">Finance Manager</option>
                <option value="Board of Directors">Board of Directors</option>
                <option value="Vendor">Vendor</option>
                <option value="Client">Client</option>
              </select>
            </div>

            {editForm.role === 'Country Manager' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Country</label>
                <select value={editForm.country} onChange={e => setEditForm({...editForm, country: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                  <option value="Ghana">Ghana 🇬🇭</option>
                  <option value="Nigeria">Nigeria 🇳🇬</option>
                </select>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Phone</label>
              <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} placeholder="+233 XX XXX XXXX" />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>New Password (leave blank to keep current)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" value={editForm.newPassword} onChange={e => setEditForm({...editForm, newPassword: e.target.value})}
                  style={{ flex: 1, padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  placeholder="Leave blank to keep current" />
                <button onClick={() => setEditForm({...editForm, newPassword: generatePassword(editModal.email)})}
                  style={{ background: T.cyan+"15", border: `1px solid ${T.cyan}30`, color: T.cyan, padding: "9px 14px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>⚡ Generate</button>
              </div>
            </div>

            {error && <div style={{ color: T.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleUserUpdate} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Saving..." : "Save Changes"}</button>
              <button onClick={() => setEditModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <Modal title="Add New User" onClose={() => { setModal(false); setError(''); }}>
          <Input label="Full Name" placeholder="e.g. Ama Mensah" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <Input label="Email" type="email" placeholder="user@stretchfield.com" value={form.email} onChange={v => setForm({ ...form, email: v, password: generatePassword(v) })} />
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Password</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Auto-generated from email" style={{ flex: 1, padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              <button type="button" onClick={() => setForm({...form, password: generatePassword(form.email)})} style={{ background: T.cyan+"15", border: `1px solid ${T.cyan}30`, color: T.cyan, padding: "9px 14px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>⚡ Generate</button>
            </div>
            {form.email && !form.password && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 5 }}>Click Generate to auto-create from email</div>}
            {form.password && <div style={{ color: T.teal, fontSize: 11, marginTop: 5 }}>✓ Password set — will be emailed to user on creation</div>}
          </div>
          <Select label="Role" options={[
            { value: 'Country Manager', label: 'Country Manager' },
            { value: 'Vendor Manager', label: 'Vendor Manager' },
            { value: 'Strategy & Events Opportunity', label: 'Strategy & Events Opportunity' },
            { value: 'Sales & Marketing', label: 'Sales & Marketing' },
            { value: 'Finance Manager', label: 'Finance Manager' },
            { value: 'Board of Directors', label: 'Board of Directors' },
            { value: 'Vendor', label: 'Vendor' },
            { value: 'Client', label: 'Client' },
          ]} value={form.role} onChange={v => setForm({ ...form, role: v })} />
          {error && <div style={{ color: '#F43F5E', fontSize: 12, marginTop: 4 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create User'}</Btn>
            <Btn variant="ghost" onClick={() => { setModal(false); setError(''); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};


const ClientsView = ({ user }) => {
  const [clients, setClients] = useState([]);
  const [profileEmails, setProfileEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [loginModal, setLoginModal] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', notes: '' });
  const [loginForm, setLoginForm] = useState({ password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      // Get current session first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const [{ data: profileData, error: pe }, { data: clientData, error: ce }] = await Promise.all([
        supabase.from('profiles').select('id, name, email, phone, company_name, role, avatar, created_at').eq('role', 'Client').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
      ]);

      if (pe) console.error('Profiles error:', pe.message);
      if (ce) console.error('Clients error:', ce.message);

      const profileEmails = (profileData || []).map(p => p.email);
      const profiles = (profileData || []).map(p => ({
        ...p,
        company: p.company_name || "",
        has_portal: true,
        source: 'profile',
      }));
      const extraClients = (clientData || [])
        .filter(c => c.email && !profileEmails.includes(c.email))
        .map(c => ({ ...c, has_portal: false, source: 'clients' }));
      setClients([...profiles, ...extraClients]);
      setProfileEmails(profileEmails);
    } catch (e) {
      console.error('ClientsView load error:', e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name) { setError('Client name is required.'); return; }
    setSaving(true); setError('');
    // Insert into clients table for CRM reference
    await supabase.from('clients').insert({
      name: form.name, company: form.company, email: form.email,
      phone: form.phone, notes: form.notes,
    });
    setModal(false);
    setForm({ name: '', company: '', email: '', phone: '', notes: '' });
    setSaving(false);
    load();
  };

  const handleCreateLogin = async () => {
    if (!loginModal.email) { setError('Client must have an email to create a login.'); return; }
    if (!loginForm.password) { setError('Password is required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (loginModal.has_portal) {
        // Client already has portal — just resend welcome email with new password reminder
        await sendEmail(
          loginModal.email,
          'Your Stretchfield WorkRoom Login Details',
          welcomeEmailHtml({ name: loginModal.name || loginModal.company, email: loginModal.email, password: loginForm.password, role: 'Client' })
        );
        setSuccess(`Login details resent to ${loginModal.email}.`);
        setSaving(false);
        return;
      }

      const res = await fetch('https://okbduzenceoknkjqnrha.supabase.co/functions/v1/create-vendor-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          email: loginModal.email,
          password: loginForm.password,
          name: loginModal.name || loginModal.company || '',
          role: 'Client',
          company_name: loginModal.company || '',
        }),
      });
      const result = await res.json();
      if (result.error) { setError(result.error); setSaving(false); return; }
      // Send welcome email
      await sendEmail(
        loginModal.email,
        'Welcome to Stretchfield WorkRoom — Your Client Portal Access',
        welcomeEmailHtml({ name: loginModal.name || loginModal.company, email: loginModal.email, password: loginForm.password, role: 'Client' })
      );
      setSuccess(`Portal login created for ${loginModal.name || loginModal.company}. Login details sent to ${loginModal.email}.`);
      setSaving(false);
      setLoginForm({ password: '' });
      load();
    } catch (e) {
      setError('Failed to create login: ' + e.message);
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this client?')) return;
    const client = clients.find(c => c.id === id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (client?.source === 'profile') {
        // Has auth account — delete via edge function
        const res = await fetch('https://okbduzenceoknkjqnrha.supabase.co/functions/v1/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ userId: id }),
        });
        const result = await res.json();
        if (result.error) { alert('Delete failed: ' + result.error); return; }
      } else {
        // No auth account — just delete from clients table
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) { alert('Delete failed: ' + error.message); return; }
      }
      // Clear FK references before deleting from clients table
      const { data: clientRecord } = await supabase.from('clients').select('id').eq('email', client?.email).single();
      if (clientRecord) {
        // Null out client_id on rffs referencing this client
        await supabase.from('rffs').update({ client_id: null }).eq('client_id', clientRecord.id);
        await supabase.from('projects').update({ client_id: null }).eq('client_id', clientRecord.id);
        await supabase.from('clients').delete().eq('id', clientRecord.id);
      }
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const isCEOorAdmin = ['CEO', 'Country Manager'].includes(user?.role);

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>CRM</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Client Database</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{clients.length} client{clients.length !== 1 ? "s" : ""} in portfolio</div>
        </div>
        <Btn onClick={() => setModal(true)}>+ Add Client</Btn>
      </div>

      {loading ? (
        <div style={{ color: T.textMuted, textAlign: "center", padding: 60 }}>Loading...</div>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏢</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No clients yet</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Click "+ Add Client" to get started.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {clients.map((c, idx) => (
            <div key={c.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 22px", transition: "box-shadow 0.2s, border-color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 24px ${T.cyan}10`; e.currentTarget.style.borderColor = T.cyan + "35"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = T.border; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${T.cyan}30, ${T.teal}20)`, border: `1px solid ${T.cyan}30`, display: "flex", alignItems: "center", justifyContent: "center", color: T.cyan, fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                  {(c.name || c.company || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.company || c.company_name || c.name || "—"}</div>
                  {(c.company || c.company_name) && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{c.name}</div>}
                </div>
                {isCEOorAdmin && c.has_portal && (
                  <div style={{ color: T.teal, fontSize: 10, fontWeight: 700, background: T.teal + "18", border: `1px solid ${T.teal}40`, padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>✓ Portal</div>
                )}
              </div>
              <div style={{ borderTop: `1px solid ${T.border}44`, paddingTop: 12, marginBottom: 12 }}>
                {c.email && <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 4 }}>✉ {c.email}</div>}
                {c.phone && <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 4 }}>📞 {c.phone}</div>}
                {c.notes && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 8, fontStyle: "italic", lineHeight: 1.5 }}>{c.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {isCEOorAdmin && c.email && (
                  <Btn small onClick={() => { setLoginModal(c); setLoginForm({ password: generatePassword(c.email) }); setError(""); setSuccess(""); }}>
                    {c.has_portal ? "🔑 Resend Login" : "🔑 Create Login"}
                  </Btn>
                )}
                <Btn small variant="ghost" onClick={() => handleDelete(c.id)}>Remove</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {modal && (
        <Modal title="Add New Client" onClose={() => { setModal(false); setError(''); }}>
          <Input label="Full Name" placeholder="e.g. John Mensah" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <Input label="Company" placeholder="Company or organisation name" value={form.company} onChange={v => setForm({ ...form, company: v })} />
          <Input label="Email" type="email" placeholder="client@company.com" value={form.email} onChange={v => setForm({ ...form, email: v })} />
          <Input label="Phone" placeholder="+233 XX XXX XXXX" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
          <Input label="Notes" placeholder="Any additional notes..." value={form.notes} onChange={v => setForm({ ...form, notes: v })} />
          {error && <div style={{ color: '#F43F5E', fontSize: 12, marginTop: 4 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Add Client'}</Btn>
            <Btn variant="ghost" onClick={() => { setModal(false); setError(''); }}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* ── Create / Resend Login Modal ── */}
      {loginModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => { setLoginModal(null); setError(""); setSuccess(""); }}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>
              {loginModal.has_portal ? "Resend Login Details" : "Create Client Portal Login"}
            </div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>
              {loginModal.company || loginModal.company_name || loginModal.name} · {loginModal.email}
            </div>
            {loginModal.has_portal && (
              <div style={{ background: T.teal+"12", border: `1px solid ${T.teal}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: T.teal, fontSize: 12 }}>
                ✓ This client already has portal access. Resend their login details below.
              </div>
            )}
            <div style={{ background: T.cyan+"12", border: `1px solid ${T.cyan}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: T.cyan }}>
              Login details will be sent to <strong>{loginModal.email}</strong>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Password</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  style={{ flex: 1, padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  placeholder="Auto-generated password" />
                <button onClick={() => setLoginForm({...loginForm, password: generatePassword(loginModal.email)})}
                  style={{ background: T.cyan+"15", border: `1px solid ${T.cyan}30`, color: T.cyan, padding: "9px 14px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>⚡ Generate</button>
              </div>
              {loginForm.password && <div style={{ color: T.teal, fontSize: 11, marginTop: 5 }}>✓ Password will be emailed to client</div>}
            </div>
            {error && <div style={{ color: T.red, fontSize: 12, marginBottom: 12, padding: "8px 12px", background: T.red+"12", borderRadius: 6 }}>{error}</div>}
            {success && <div style={{ color: "#10B981", fontSize: 12, marginBottom: 12, padding: "8px 12px", background: "#10B98112", borderRadius: 6 }}>{success}</div>}
            {!success && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleCreateLogin} disabled={saving || !loginForm.password}
                  style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13, opacity: saving || !loginForm.password ? 0.6 : 1 }}>
                  {saving ? "Creating..." : loginModal.has_portal ? "📧 Resend Login Email" : "🔑 Create Login & Send Email"}
                </button>
                <button onClick={() => { setLoginModal(null); setError(""); setSuccess(""); }}
                  style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
              </div>
            )}
            {success && (
              <button onClick={() => { setLoginModal(null); setError(""); setSuccess(""); load(); }}
                style={{ background: `linear-gradient(135deg, ${T.teal}, ${T.cyan})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>Done ✓</button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};



const VendorQuotesView = ({ user }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from('rffs').select('*')
      .eq('vendor', user.name)
      .not('status', 'eq', 'pending')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setQuotes(data || []);
        setLoading(false);
      });
  }, [user.name]);

  // Group by event name
  const grouped = quotes.reduce((acc, q) => {
    const key = q.event_name || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="My Quotes" subtitle={`${quotes.length} quotes submitted`} />

      {loading ? (
        <div style={{ color: T.textMuted, textAlign: 'center', padding: 60 }}>Loading...</div>
      ) : quotes.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No quotes yet</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Quotes you submit will appear here.</div>
        </Card>
      ) : Object.entries(grouped).map(([eventName, eventQuotes]) => (
        <div key={eventName} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 3, height: 20, background: T.cyan, borderRadius: 2 }} />
            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>{eventName}</div>
            <div style={{ color: T.textMuted, fontSize: 12, background: T.border, padding: '2px 10px', borderRadius: 20 }}>
              {eventQuotes.length} quote{eventQuotes.length > 1 ? 's' : ''}
            </div>
          </div>

          {eventQuotes.map(q => (
            <Card key={q.id} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>{q.title}</div>
                  <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>🏢 {q.client_name} · Due {q.deadline}</div>
                  <div style={{ color: T.amber, fontWeight: 700, fontSize: 14, marginTop: 6 }}>GHS {(q.amount || 0).toLocaleString()}</div>
                </div>
                <Badge status={q.status} />
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {q.quote_url && (
                  <a href={q.quote_url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: T.cyan, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                    background: T.cyan + '15', padding: '5px 12px', borderRadius: 6,
                    border: `1px solid ${T.cyan}33`,
                  }}>📎 {q.quote_filename || 'My Quote Document'}</a>
                )}
                {q.document_url && (
                  <a href={q.document_url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: T.textMuted, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                    background: T.border, padding: '5px 12px', borderRadius: 6,
                  }}>📄 Original RFF</a>
                )}
              </div>
              {q.status === 'quote-approved' && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: T.teal + '15', borderRadius: 6, border: `1px solid ${T.teal}33` }}>
                  <span style={{ color: T.teal, fontSize: 12, fontWeight: 700 }}>✓ Quote Approved — Invoice has been generated</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
};


const VendorTasksView = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [detailTask, setDetailTask] = useState(null);
  const [taskNotes, setTaskNotes] = useState("");
  const [taskPhoto, setTaskPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase.from('tasks').select('*')
      .eq('assignee_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setTasks(data || []));
  };

  useEffect(() => { load(); }, [user.id]);

  const openDetail = (t) => {
    setDetailTask(t);
    setTaskNotes(t.notes || "");
    setTaskPhoto(null);
    setPhotoPreview(t.attachment_url || null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTaskPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    let attachment_url = detailTask.attachment_url || null;
    let attachment_name = detailTask.attachment_name || null;

    if (taskPhoto) {
      const ext = taskPhoto.name.split('.').pop();
      const filename = `task_${detailTask.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('rffs').upload(filename, taskPhoto);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('rffs').getPublicUrl(filename);
        attachment_url = urlData.publicUrl;
        attachment_name = taskPhoto.name;
      }
    }

    await supabase.from('tasks').update({
      progress: detailTask.progress,
      status: detailTask.status,
      notes: taskNotes,
      attachment_url,
      attachment_name,
    }).eq('id', detailTask.id);

    setSaving(false);
    setDetailTask(null);
    load();
  };

  return (
    <div>
      <PageHeader title="My Tasks" subtitle={`${tasks.length} tasks assigned to you`} />
      {tasks.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No tasks yet</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Tasks assigned to you will appear here.</div>
        </Card>
      ) : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>{tasks.map(t => (
        <Card key={t.id} style={{ marginBottom: 0, cursor: 'pointer' }} onClick={() => openDetail(t)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>{t.name}</div>
              <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Due {t.deadline}</div>
            </div>
            <Badge status={t.status} />
          </div>
          <ProgressBar value={t.progress || 0} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <div style={{ color: T.textMuted, fontSize: 11 }}>{t.progress || 0}% complete</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {t.notes && <span style={{ color: T.cyan, fontSize: 11 }}>📝 Notes</span>}
              {t.attachment_url && <span style={{ color: T.amber, fontSize: 11 }}>📎 Attachment</span>}
            </div>
          </div>
        </Card>
      ))}</div>}

      {detailTask && (
        <Modal title="Update Task" onClose={() => setDetailTask(null)}>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{detailTask.name}</div>
          <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>Due {detailTask.deadline}</div>

          {/* Progress */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Progress: {detailTask.progress || 0}%</div>
            <input type="range" min="0" max="100" value={detailTask.progress || 0}
              onChange={e => setDetailTask({ ...detailTask, progress: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: T.cyan }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: T.textMuted, fontSize: 11, marginTop: 4 }}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {/* Status */}
          <Select label="Status" options={[
            { value: 'pending', label: 'Pending' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ]} value={detailTask.status} onChange={v => setDetailTask({ ...detailTask, status: v })} />

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notes / Updates</div>
            <textarea value={taskNotes} onChange={e => setTaskNotes(e.target.value)}
              placeholder="Add progress notes, comments or updates..."
              style={{ width: '100%', minHeight: 100, padding: 10, background: T.bg, border: '1px solid ' + T.border, borderRadius: 8, color: T.textPrimary, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          {/* Photo Attachment */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Attach Photo / Document</div>
            <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handlePhotoChange}
              style={{ width: '100%', padding: 10, background: T.bg, border: '1px solid ' + T.border, borderRadius: 8, color: T.textSecondary, fontSize: 13, cursor: 'pointer' }} />
            {photoPreview && (
              <div style={{ marginTop: 12 }}>
                {photoPreview.startsWith('data:image') || (detailTask.attachment_url && detailTask.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)/i)) ? (
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid ' + T.border }} />
                ) : (
                  <a href={photoPreview} target="_blank" rel="noopener noreferrer" style={{ color: T.cyan, fontSize: 13, fontWeight: 600 }}>
                    📎 {detailTask.attachment_name || 'View Attachment'}
                  </a>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Update'}</Btn>
            <Btn variant="ghost" onClick={() => setDetailTask(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};


// ─── CRM VIEW ─────────────────────────────────────────────────────────────────
const STAGES = [
  { id: "new", label: "New", color: "#00C8FF" },
  { id: "contacted", label: "Contacted", color: "#3B82F6" },
  { id: "qualified", label: "Qualified", color: "#F59E0B" },
  { id: "proposal", label: "Proposal", color: "#E879F9" },
  { id: "won", label: "Won", color: "#00E5C8" },
  { id: "lost", label: "Lost", color: "#F43F5E" },
];

const LeadCard = ({ lead, selectedLead, setSelectedLead, activities }) => {
  const stage = STAGES.find(s => s.id === lead.status) || STAGES[0];
  const leadActivities = (activities || []).filter(a => a.lead_id === lead.id);
  const lastAct = leadActivities[0];
  const daysSince = lead.created_at ? Math.floor((new Date() - new Date(lead.created_at)) / (1000*60*60*24)) : 0;
  const isSelected = selectedLead?.id === lead.id;
  const tIcons = { note: "📝", call: "📞", meeting: "🤝", email: "✉️", demo: "🎯", "follow-up": "🔄" };
  return (
    <div onClick={() => setSelectedLead(isSelected ? null : lead)}
      style={{ background: isSelected ? T.surface : T.bg, border: `1px solid ${isSelected ? stage.color+"80" : T.border}`, borderLeft: `3px solid ${stage.color}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s", marginBottom: 8 }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = stage.color+"50"; e.currentTarget.style.background = T.surface; }}}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; }}}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.company}</div>
          {lead.contact_name && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{lead.contact_name}</div>}
        </div>
        {lead.status === "won" && !lead.approved && <span style={{ background: T.amber+"20", color: T.amber, fontSize: 9, fontWeight: 800, borderRadius: 20, padding: "2px 7px", flexShrink: 0, marginLeft: 6 }}>CEO</span>}
        {lead.status === "won" && lead.approved && <span style={{ background: "#10B98120", color: "#10B981", fontSize: 9, fontWeight: 800, borderRadius: 20, padding: "2px 7px", flexShrink: 0, marginLeft: 6 }}>✓</span>}
      </div>
      <div style={{ color: T.gold, fontWeight: 900, fontSize: 15, marginBottom: 8 }}>GHS {(lead.value||0).toLocaleString()}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ color: T.textMuted, fontSize: 10 }}>{daysSince}d</span>
          {lastAct && <span style={{ fontSize: 10 }}>{tIcons[lastAct.type]}</span>}
          <span style={{ color: T.textMuted, fontSize: 10 }}>{leadActivities.length} act.</span>
        </div>
        {lead.assigned_name && <span style={{ color: T.cyan, fontSize: 10, fontWeight: 600 }}>{lead.assigned_name.split(" ")[0]}</span>}
      </div>
    </div>
  );
};

const LeadPanel = ({ lead, activities, canEdit, canApprove, actForm, setActForm, addingAct, addActivity, updateStatus, handleDelete, setApprovalModal, existingClients, setMatchedClient }) => {
  const stage = STAGES.find(s => s.id === lead.status) || STAGES[0];
  const leadActivities = (activities || []).filter(a => a.lead_id === lead.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  const tColors = { note: T.textMuted, call: T.teal, meeting: T.cyan, email: T.blue, demo: T.amber, "follow-up": "#8B5CF6" };
  const tIcons = { note: "📝", call: "📞", meeting: "🤝", email: "✉️", demo: "🎯", "follow-up": "🔄" };
  return (
    <div style={{ width: 380, flexShrink: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 200px)", overflow: "hidden" }}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.border}`, background: stage.color+"08" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 16 }}>{lead.company}</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{lead.contact_name} {lead.phone ? "· "+lead.phone : ""}</div>
            {lead.email && <div style={{ color: T.cyan, fontSize: 11, marginTop: 2 }}>{lead.email}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          <span style={{ color: T.gold, fontWeight: 900, fontSize: 18 }}>GHS {(lead.value||0).toLocaleString()}</span>
          <span style={{ background: stage.color+"20", color: stage.color, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{lead.status}</span>
        </div>
        {canEdit && (
          <div style={{ display: "flex", gap: 4, marginTop: 12, flexWrap: "wrap" }}>
            {STAGES.map(s => (
              <button key={s.id} onClick={() => updateStatus(lead.id, s.id)} style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${lead.status === s.id ? s.color : T.border}`, background: lead.status === s.id ? s.color+"20" : "none", color: lead.status === s.id ? s.color : T.textMuted, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>{s.label}</button>
            ))}
          </div>
        )}
        {canApprove && lead.status === "won" && !lead.approved && (
          <button onClick={() => { setApprovalModal(lead); const mc = existingClients.find(c => c.email === lead.email || c.company === lead.company); setMatchedClient(mc||null); }} style={{ marginTop: 10, width: "100%", padding: "8px", background: `linear-gradient(135deg, ${T.teal}, ${T.cyan})`, border: "none", borderRadius: 8, cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 800 }}>✓ Approve — Create Client & Portal</button>
        )}
      </div>
      {lead.notes && (
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}44`, background: T.bg }}>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
          <div style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.5 }}>{lead.notes}</div>
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto", padding: "14px 20px" }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Activity Timeline</div>
        {canEdit && (
          <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
              {["call","meeting","email","note","demo","follow-up"].map(t => (
                <button key={t} onClick={() => setActForm(f => ({...f, type: t}))} style={{ padding: "2px 8px", borderRadius: 20, border: `1px solid ${actForm.type === t ? tColors[t] : T.border}`, background: actForm.type === t ? tColors[t]+"20" : "none", color: actForm.type === t ? tColors[t] : T.textMuted, fontSize: 9, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>
                  {tIcons[t]} {t}
                </button>
              ))}
            </div>
            <textarea value={actForm.notes} onChange={e => setActForm(f => ({...f, notes: e.target.value}))} placeholder={`Log ${actForm.type}...`} rows={2} style={{ width: "100%", padding: "7px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 6 }} />
            {["call","meeting","demo","follow-up"].includes(actForm.type) && (
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input type="date" value={actForm.scheduled_date} onChange={e => setActForm(f => ({...f, scheduled_date: e.target.value}))} style={{ flex: 1, padding: "5px 8px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                <input type="time" value={actForm.scheduled_time} onChange={e => setActForm(f => ({...f, scheduled_time: e.target.value}))} style={{ flex: 1, padding: "5px 8px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
              </div>
            )}
            {actForm.scheduled_date && <div style={{ color: "#8B5CF6", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>📅 {actForm.scheduled_date}{actForm.scheduled_time ? " at "+actForm.scheduled_time : ""} → calendar</div>}
            <button onClick={() => addActivity(lead.id, lead.company)} disabled={addingAct || !actForm.notes} style={{ background: T.cyan, border: "none", color: "#000", padding: "5px 14px", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 800, opacity: !actForm.notes ? 0.5 : 1 }}>{addingAct ? "..." : "Log"}</button>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {leadActivities.length === 0 && <div style={{ color: T.textMuted, fontSize: 12, textAlign: "center", padding: "20px 0" }}>No activity yet</div>}
          {leadActivities.map((act, i) => {
            const color = tColors[act.type] || T.textMuted;
            return (
              <div key={act.id} style={{ display: "flex", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: color+"20", border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{tIcons[act.type]}</div>
                  {i < leadActivities.length-1 && <div style={{ width: 1, flex: 1, background: T.border, marginTop: 4, minHeight: 12 }} />}
                </div>
                <div style={{ flex: 1, paddingBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{act.type}</span>
                    <span style={{ color: T.textMuted, fontSize: 10 }}>{new Date(act.created_at).toLocaleDateString("en-GB")}</span>
                  </div>
                  <div style={{ color: T.textSecondary, fontSize: 12, lineHeight: 1.5 }}>{act.notes}</div>
                  {act.scheduled_date && <div style={{ color: "#8B5CF6", fontSize: 10, fontWeight: 700, marginTop: 3 }}>📅 {act.scheduled_date}{act.scheduled_time ? " at "+act.scheduled_time : ""}</div>}
                  <div style={{ color: T.textMuted, fontSize: 10, marginTop: 2 }}>— {act.created_by_name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {canEdit && (
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
          <button onClick={() => handleDelete(lead.id)} style={{ background: T.red+"15", border: `1px solid ${T.red}30`, color: T.red, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Delete</button>
        </div>
      )}
    </div>
  );
};

const CRMView = ({ user }) => {
  const [leads, setLeads] = useState([]);
  const [activities, setActivities] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [members, setMembers] = useState([]);
  const [existingClients, setExistingClients] = useState([]);
  const [view, setView] = useState("kanban"); // kanban | list
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [approvalModal, setApprovalModal] = useState(null);
  const [matchedClient, setMatchedClient] = useState(null);
  const [clientForm, setClientForm] = useState({ name: "", company: "", email: "", phone: "" });
  const [eventForm, setEventForm] = useState({ name: "", deadline: "", phase: "Planning" });
  const [createLogin, setCreateLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [actForm, setActForm] = useState({ type: "call", notes: "", scheduled_date: "", scheduled_time: "" });
  const [addingAct, setAddingAct] = useState(false);
  const [form, setForm] = useState({ company: "", contact_name: "", email: "", phone: "", source: "", value: "", notes: "", status: "new", assigned_to: "", assigned_name: "" });

  const canEdit = ["CEO", "Country Manager", "Sales & Marketing"].includes(user?.role);
  const canApprove = ["CEO", "Country Manager"].includes(user?.role);



  const load = async () => {
    const [l, a, p, m, c] = await Promise.all([
      ["CEO", "Country Manager", "Sales & Marketing"].includes(user?.role)
        ? supabase.from("leads").select("*").order("created_at", { ascending: false })
        : supabase.from("leads").select("*").or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`).order("created_at", { ascending: false }),
      supabase.from("crm_activities").select("*").order("created_at", { ascending: false }),
      supabase.from("proposals").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").not("role", "in", '("Client","Vendor")'),
      supabase.from("clients").select("*"),
    ]);
    setLeads(l.data || []);
    setActivities(a.data || []);
    setProposals(p.data || []);
    setMembers(m.data || []);
    setExistingClients(c.data || []);
  };

  useEffect(() => { load(); }, []);

  const filteredLeads = leads.filter(l => {
    if (filter !== "all" && l.status !== filter) return false;
    if (search && !l.company?.toLowerCase().includes(search.toLowerCase()) && !l.contact_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPipeline = leads.filter(l => !["won","lost"].includes(l.status)).reduce((a,l) => a + (l.value||0), 0);
  const totalWon = leads.filter(l => l.status === "won").reduce((a,l) => a + (l.value||0), 0);
  const wonCount = leads.filter(l => l.status === "won").length;
  const pendingApproval = leads.filter(l => l.status === "won" && !l.approved).length;

  const handleCreate = async () => {
    if (!form.company) return;
    setSaving(true);
    await supabase.from("leads").insert({
      company: form.company, contact_name: form.contact_name, email: form.email,
      phone: form.phone, source: form.source, value: parseFloat(form.value) || 0,
      notes: form.notes, status: form.status || "new", created_by: user.id,
      assigned_to: form.assigned_to || null, assigned_name: form.assigned_name || "",
    });
    setModal(false);
    setForm({ company: "", contact_name: "", email: "", phone: "", source: "", value: "", notes: "", status: "new", assigned_to: "", assigned_name: "" });
    setSaving(false);
    load();
  };

  const updateStatus = async (leadId, newStatus) => {
    if (newStatus === "won") {
      await supabase.from("leads").update({ status: "won", pending_approval: true, closed_date: new Date().toISOString().slice(0,10), sales_cycle_days: Math.round((new Date() - new Date(leads.find(l=>l.id===leadId)?.created_at||new Date()))/(1000*60*60*24)) }).eq("id", leadId);
      const { data: ceos } = await supabase.from("profiles").select("id, email, name").eq("role", "CEO");
      for (const ceo of ceos || []) {
        await supabase.from("notifications").insert({ user_id: ceo.id, title: "Lead Won — Action Required", message: `${leads.find(l=>l.id===leadId)?.company} has been marked as Won. Please review and approve.`, type: "crm" });
        if (ceo.email) await sendEmail(ceo.email, `Lead Won — ${leads.find(l=>l.id===leadId)?.company}`, notifEmailHtml({ name: ceo.name, title: "Lead Won — Your Approval Required", message: `<strong>${leads.find(l=>l.id===leadId)?.company}</strong> has been marked as Won. Please log in to review and approve.`, actionUrl: BASE_URL, actionLabel: "Review Lead" }));
      }
    } else {
      await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
    }
    load();
  };

  const addActivity = async (leadId, company) => {
    if (!actForm.notes) return;
    setAddingAct(true);
    await supabase.from("crm_activities").insert({
      lead_id: leadId, type: actForm.type, notes: actForm.notes,
      date: new Date().toISOString().slice(0,10),
      scheduled_date: actForm.scheduled_date || null,
      scheduled_time: actForm.scheduled_time || null,
      activity_type: actForm.type,
      created_by: user.id, created_by_name: user.name,
    });
    if (actForm.scheduled_date && ["call","meeting","demo","follow-up"].includes(actForm.type)) {
      await supabase.from("itineraries").insert({
        title: `${actForm.type.charAt(0).toUpperCase()+actForm.type.slice(1)} — ${company}`,
        week_start: actForm.scheduled_date,
        items: JSON.stringify([{ date: actForm.scheduled_date, time: actForm.scheduled_time || "09:00", company, action: actForm.type, notes: actForm.notes }]),
        created_by: user.id,
      });
      const lead = leads.find(l => l.id === leadId);
      if (lead?.assigned_to) {
        await supabase.from("notifications").insert({ user_id: lead.assigned_to, title: `Follow-up Scheduled — ${company}`, message: `${actForm.type} scheduled on ${actForm.scheduled_date}${actForm.scheduled_time ? " at " + actForm.scheduled_time : ""}`, type: "crm" });
      }
    }
    setActForm({ type: "call", notes: "", scheduled_date: "", scheduled_time: "" });
    setAddingAct(false);
    load();
  };

  const typeColors = { note: T.textMuted, call: T.teal, meeting: T.cyan, email: T.blue, demo: T.amber, "follow-up": "#8B5CF6" };
  const typeIcons = { note: "📝", call: "📞", meeting: "🤝", email: "✉️", demo: "🎯", "follow-up": "🔄" };

  // ── KANBAN CARD ──
      const handleDelete = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    await supabase.from("opportunities").update({ converted_lead_id: null }).eq("converted_lead_id", id);
    await supabase.from("leads").delete().eq("id", id);
    setSelectedLead(null);
    load();
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>Sales</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Leads Pipeline</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {/* View toggle */}
            <div style={{ display: "flex", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3 }}>
              {[["kanban","⊞"], ["list","≡"]].map(([v, icon]) => (
                <button key={v} onClick={() => setView(v)} style={{ padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: view === v ? T.surface : "none", color: view === v ? T.cyan : T.textMuted, fontSize: 14, fontWeight: 700, transition: "all 0.15s" }}>{icon}</button>
              ))}
            </div>
            {canEdit && <button onClick={() => setModal(true)} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>+ New Lead</button>}
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total Leads", value: leads.length, color: T.cyan },
          { label: "Pipeline Value", value: "GHS "+totalPipeline.toLocaleString(), color: T.amber },
          { label: "Won", value: wonCount, sub: "GHS "+totalWon.toLocaleString(), color: T.teal },
          { label: "Pending Approval", value: pendingApproval, color: pendingApproval > 0 ? T.red : T.textMuted },
        ].map((k,i) => (
          <div key={i} style={{ padding: "12px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 20, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>{k.label}</div>
            {k.sub && <div style={{ color: T.textMuted, fontSize: 10, marginTop: 1 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ flex: 1, minWidth: 180, padding: "8px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {["all",...STAGES.map(s=>s.id)].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${filter===f ? (STAGES.find(s=>s.id===f)?.color||T.cyan) : T.border}`, background: filter===f ? (STAGES.find(s=>s.id===f)?.color||T.cyan)+"18" : "none", color: filter===f ? (STAGES.find(s=>s.id===f)?.color||T.cyan) : T.textMuted, fontSize: 10, fontWeight: 700, cursor: "pointer", textTransform: "uppercase" }}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Kanban / List */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {view === "kanban" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12 }}>
              {STAGES.filter(s => filter === "all" || s.id === filter).map(stage => {
                const stageLeads = filteredLeads.filter(l => l.status === stage.id);
                const stageValue = stageLeads.reduce((a,l) => a+(l.value||0), 0);
                return (
                  <div key={stage.id}>
                    {/* Column Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "6px 10px", background: stage.color+"10", border: `1px solid ${stage.color}25`, borderRadius: 8 }}>
                      <div>
                        <span style={{ color: stage.color, fontWeight: 800, fontSize: 11, textTransform: "uppercase" }}>{stage.label}</span>
                        <span style={{ color: T.textMuted, fontSize: 10, marginLeft: 6 }}>({stageLeads.length})</span>
                      </div>
                      {stageValue > 0 && <span style={{ color: stage.color, fontSize: 10, fontWeight: 700 }}>GHS {stageValue.toLocaleString()}</span>}
                    </div>
                    {/* Cards */}
                    <div style={{ minHeight: 80 }}>
                      {stageLeads.length === 0 && <div style={{ color: T.textMuted, fontSize: 11, textAlign: "center", padding: "20px 0", fontStyle: "italic" }}>Empty</div>}
                      {stageLeads.map(lead => <LeadCard key={lead.id} lead={lead} selectedLead={selectedLead} setSelectedLead={setSelectedLead} activities={activities} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    {["Company","Contact","Value","Stage","Source","Assigned","Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead,i) => {
                    const stage = STAGES.find(s => s.id === lead.status) || STAGES[0];
                    return (
                      <tr key={lead.id} style={{ borderBottom: i < filteredLeads.length-1 ? `1px solid ${T.border}44` : "none", cursor: "pointer" }}
                        onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                        onMouseEnter={e => e.currentTarget.style.background = T.bg}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{lead.company}</div>
                          {lead.email && <div style={{ color: T.textMuted, fontSize: 11 }}>{lead.email}</div>}
                        </td>
                        <td style={{ padding: "10px 14px", color: T.textSecondary, fontSize: 12 }}>{lead.contact_name||"—"}<br/><span style={{ color: T.textMuted, fontSize: 11 }}>{lead.phone||""}</span></td>
                        <td style={{ padding: "10px 14px", color: T.gold, fontWeight: 800, fontSize: 13 }}>GHS {(lead.value||0).toLocaleString()}</td>
                        <td style={{ padding: "10px 14px" }}><span style={{ background: stage.color+"18", color: stage.color, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{stage.label}</span></td>
                        <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 12 }}>{lead.source||"—"}</td>
                        <td style={{ padding: "10px 14px", color: T.cyan, fontSize: 12 }}>{lead.assigned_name||"—"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {canApprove && lead.status === "won" && !lead.approved && (
                              <button onClick={e => { e.stopPropagation(); setApprovalModal(lead); const mc = existingClients.find(c => c.email === lead.email || c.company === lead.company); setMatchedClient(mc||null); }} style={{ background: T.teal+"15", border: `1px solid ${T.teal}30`, color: T.teal, padding: "3px 8px", borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>✓ Approve</button>
                            )}
                            {canEdit && <button onClick={e => { e.stopPropagation(); handleDelete(lead.id); }} style={{ background: T.red+"15", border: `1px solid ${T.red}30`, color: T.red, padding: "3px 8px", borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>×</button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLeads.length === 0 && <tr><td colSpan={7} style={{ padding: "40px 0", textAlign: "center", color: T.textMuted }}>No leads found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Right Panel ── */}
        {selectedLead && <LeadPanel lead={selectedLead} activities={activities} canEdit={canEdit} canApprove={canApprove} actForm={actForm} setActForm={setActForm} addingAct={addingAct} addActivity={addActivity} updateStatus={updateStatus} handleDelete={handleDelete} setApprovalModal={setApprovalModal} existingClients={existingClients} setMatchedClient={setMatchedClient} />}
      </div>

      {/* ── New Lead Modal ── */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 520, padding: 28, maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 20 }}>New Lead</div>
            {[
              ["Company *", "company", "text", "Company name"],
              ["Contact Name", "contact_name", "text", "Full name"],
              ["Email", "email", "email", "email@company.com"],
              ["Phone", "phone", "text", "+233 XX XXX XXXX"],
              ["Value (GHS)", "value", "number", "Estimated deal value"],
              ["Source", "source", "text", "Referral, LinkedIn, Cold call..."],
            ].map(([label, key, type, placeholder]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Stage</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Assign To</label>
              <select value={form.assigned_to} onChange={e => { const m = members.find(x => x.id === e.target.value); setForm({...form, assigned_to: e.target.value, assigned_name: m?.name||""}); }} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCreate} disabled={saving || !form.company} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13, opacity: !form.company ? 0.6 : 1 }}>{saving ? "Saving..." : "Create Lead"}</button>
              <button onClick={() => setModal(false)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SMTasksView = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [form, setForm] = useState({ name: "", notes: "", deadline: "", assigned_to: "", assigned_name: "" });
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  const canCreate = ["CEO", "Country Manager", "Sales & Marketing"].includes(user?.role);

  const load = async () => {
    const [t, m] = await Promise.all([
      supabase.from("tasks").select("*").eq("task_type", "sm").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").in("role", ["CEO", "Country Manager", "Sales & Marketing"]),
    ]);
    setTasks(t.data || []);
    setMembers(m.data || []);
  };

  useEffect(() => { load(); }, [user.id]);

  const handleCreate = async () => {
    if (!form.name) return;
    setSaving(true);
    await supabase.from("tasks").insert({
      name: form.name, notes: form.notes, deadline: form.deadline || null,
      assignee_id: form.assigned_to || null, assignee_name: form.assigned_name || "",
      assigned_by: user.id, status: "pending", progress: 0,
      task_type: "sm", visible_to_client: false,
    });
    setModal(false);
    setForm({ name: "", notes: "", deadline: "", assigned_to: "", assigned_name: "" });
    setSaving(false);
    load();
  };

  const handleUpdate = async () => {
    await supabase.from("tasks").update({
      progress: detailTask.progress, status: detailTask.status, notes: detailTask.notes,
    }).eq("id", detailTask.id);
    setDetailTask(null);
    load();
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Sales</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>S&M Tasks</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Sales & Marketing internal tasks</div>
        </div>
        {canCreate && <Btn onClick={() => setModal(true)}>+ New Task</Btn>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Tasks", value: tasks.length, color: T.cyan },
          { label: "In Progress", value: tasks.filter(t => t.status === "in-progress").length, color: T.amber },
          { label: "Completed", value: tasks.filter(t => t.status === "completed").length, color: T.teal },
        ].map((k, i) => (
          <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 22, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
          </div>
        ))}
      </div>
      {tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No S&M tasks yet</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Tasks between CEO and Sales & Marketing appear here.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {tasks.map((t, idx) => {
            const pct = t.progress || 0;
            const barColor = t.status === "completed" ? T.teal : pct > 66 ? T.cyan : pct > 33 ? T.amber : T.magenta;
            return (
              <div key={t.id} onClick={() => setDetailTask({ ...t })} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 24px ${T.cyan}12`; e.currentTarget.style.borderColor = T.cyan + "40"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = T.border; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                    {t.assignee_name && <div style={{ color: T.cyan, fontSize: 10, fontWeight: 700 }}>→ {t.assignee_name}</div>}
                    {t.notes && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 4, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.notes}</div>}
                  </div>
                  <Badge status={t.status} />
                </div>
                <div style={{ height: 3, background: T.border + "44", borderRadius: 2, marginBottom: 6 }}>
                  <div style={{ height: "100%", width: pct + "%", background: barColor, borderRadius: 2 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ color: T.textMuted, fontSize: 10 }}>{pct}% complete</div>
                  {t.deadline && <div style={{ color: T.textMuted, fontSize: 10 }}>Due {t.deadline}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {modal && (
        <Modal title="New S&M Task" onClose={() => setModal(false)}>
          <Input label="Task Name" placeholder="e.g. Prepare pitch deck" value={form.name} onChange={v => setForm({ ...form, name: v })} />
          <Select label="Assign To" options={[{ value: "", label: "Select..." }, ...members.map(m => ({ value: m.id, label: m.name + " — " + m.role }))]}
            value={form.assigned_to}
            onChange={v => { const m = members.find(x => x.id === v); setForm({ ...form, assigned_to: v, assigned_name: m ? m.name : "" }); }} />
          <Input label="Deadline" type="date" value={form.deadline} onChange={v => setForm({ ...form, deadline: v })} />
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</div>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Task details..."
              style={{ width: "100%", minHeight: 80, background: T.bg, border: "1px solid " + T.border, borderRadius: 6, padding: 10, color: T.textPrimary, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={handleCreate} disabled={saving}>{saving ? "Saving..." : "Create Task"}</Btn>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
      {detailTask && (
        <Modal title="Update Task" onClose={() => setDetailTask(null)}>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{detailTask.name}</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Progress: {detailTask.progress || 0}%</div>
            <input type="range" min="0" max="100" value={detailTask.progress || 0}
              onChange={e => setDetailTask({ ...detailTask, progress: parseInt(e.target.value) })}
              style={{ width: "100%", accentColor: T.cyan }} />
          </div>
          <Select label="Status" options={[
            { value: "pending", label: "Pending" },
            { value: "in-progress", label: "In Progress" },
            { value: "completed", label: "Completed" },
          ]} value={detailTask.status} onChange={v => setDetailTask({ ...detailTask, status: v })} />
          <div style={{ marginBottom: 16, marginTop: 8 }}>
            <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</div>
            <textarea value={detailTask.notes || ""} onChange={e => setDetailTask({ ...detailTask, notes: e.target.value })}
              style={{ width: "100%", minHeight: 80, background: T.bg, border: "1px solid " + T.border, borderRadius: 6, padding: 10, color: T.textPrimary, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={handleUpdate}>Save</Btn>
            <Btn variant="ghost" onClick={() => setDetailTask(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── FEEDBACK VIEW ────────────────────────────────────────────────────────────

const CalendarView = ({ user, onNavigate }) => {
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date());
  const [items, setItems] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itinModal, setItinModal] = useState(false);
  const [itinForm, setItinForm] = useState({ title: "", week_start: "", rows: [{ date: "", time: "", company: "", action: "", notes: "" }] });
  const [itinSaving, setItinSaving] = useState(false);
  const [itineraries, setItineraries] = useState([]);
  const [viewItinModal, setViewItinModal] = useState(null);
  const [opportunities, setOpportunitys] = useState([]);
  const [opps, setOpps] = useState([]);

  const role = user?.role;
  const uid = user?.id;
  const email = user?.email;

  const typeColors = {
    task: "#00C8FF",
    event: "#00E5C8",
    opportunity: "#F59E0B",
    rff: "#E879F9",
    invoice: "#C9A84C",
    activity: "#3B7BFF",
    smtask: "#10B981",
    itinerary: "#F472B6",
  };

  const loadOpportunitysOpps = async () => {
    const [{ data: l }, { data: o }, { data: itins }] = await Promise.all([
      supabase.from("opportunities").select("id, company, contact_name, status"),
      supabase.from("leads").select("id, company, sector, status").neq("status","Converted"),
      uid ? supabase.from("itineraries").select("*").eq("created_by", uid).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    setOpportunitys(l || []);
    setOpps(o || []);
    setItineraries(itins || []);
  };

  const load = async () => {
    setLoading(true);
    const all = [];

    // ── TASKS ──
    const taskQ = ["CEO","Country Manager"].includes(role)
      ? supabase.from("tasks").select("*")
      : supabase.from("tasks").select("*").eq("assignee_id", uid);
    const { data: tasks } = await taskQ;
    (tasks || []).forEach(t => {
      if (t.deadline) all.push({ id: "task-"+t.id, date: t.deadline.slice(0,10), type: "task", label: t.name, sub: t.assignee_name || "", status: t.status, nav: "tasks" });
    });

    // ── EVENTS (projects) ──
    if (!["Vendor"].includes(role)) {
      let evQ;
      if (["Client"].includes(role)) {
        const { data: clientData } = await supabase.from("clients").select("id").eq("email", email).single();
        if (clientData) evQ = await supabase.from("projects").select("*").eq("client_id", clientData.id);
      } else {
        evQ = await supabase.from("projects").select("*");
      }
      const events = evQ?.data || [];
      events.forEach(e => {
        if (e.event_date) all.push({ id: "ev-"+e.id+"-d", date: e.event_date, type: "event", label: e.name, sub: "Event Day", nav: "events" });
        if (e.deadline) all.push({ id: "ev-"+e.id+"-dl", date: e.deadline.slice(0,10), type: "event", label: e.name, sub: "Planning Deadline", nav: "events" });
      });
    }

    // ── LEADS (CEO, Admin, Sales & Marketing) ──
    if (["CEO","Country Manager","Sales & Marketing"].includes(role)) {
      const { data: opportunities } = await supabase.from("opportunities").select("*");
      (opportunities || []).forEach(l => {
        if (l.created_at) all.push({ id: "opportunity-"+l.id, date: l.created_at.slice(0,10), type: "opportunity", label: l.company, sub: "Opportunity Created · " + l.status, nav: "crm" });
        if (l.closed_date) all.push({ id: "opportunity-"+l.id+"-c", date: l.closed_date, type: "opportunity", label: l.company, sub: "Opportunity Closed · Won", nav: "crm" });
      });
    }

    // ── RFFs ──
    if (["CEO","Country Manager","Vendor Manager"].includes(role)) {
      const { data: rffs } = await supabase.from("rffs").select("*");
      (rffs || []).filter(r => r.deadline).forEach(r => {
        const dl = r.deadline.slice(0,10);
        all.push({ id: "rff-"+r.id, date: dl, type: "rff", label: r.title || "RFF", sub: "RFF Deadline · " + (r.event_name || r.status || ""), nav: "vendors" });
      });
    } else if (role === "Vendor") {
      const { data: assignments } = await supabase.from("rff_vendor_assignments").select("*, rffs(*)").eq("vendor_id", uid);
      (assignments || []).forEach(a => {
        const r = a.rffs;
        if (r?.deadline) all.push({ id: "rff-"+r.id, date: r.deadline.slice(0,10), type: "rff", label: r.title || "RFF", sub: "RFF Deadline · " + (a.status || ""), nav: "my-rffs" });
      });
    }

    // ── S&M TASKS ──
    if (["CEO","Country Manager","Sales & Marketing"].includes(role)) {
      const smQ = ["CEO","Country Manager"].includes(role)
        ? supabase.from("tasks").select("*").not("assignee_id","is",null)
        : supabase.from("tasks").select("*").eq("assignee_id", uid);
      const { data: smTasks } = await smQ;
      (smTasks || []).forEach(t => {
        if (t.deadline && !["CEO","Country Manager"].includes(role)) {
          all.push({ id: "smt-"+t.id, date: t.deadline.slice(0,10), type: "smtask", label: t.name, sub: "S&M Task", nav: "sm-tasks" });
        }
      });
    }

    // ── CLIENT INVOICES ──
    if (role === "Client") {
      const { data: clientData } = await supabase.from("clients").select("id").eq("email", email).single();
      if (clientData) {
        const { data: invs } = await supabase.from("client_invoices").select("*").eq("client_id", clientData.id);
        (invs || []).forEach(inv => {
          if (inv.created_at) all.push({ id: "inv-"+inv.id, date: inv.created_at.slice(0,10), type: "invoice", label: inv.title || "Invoice", sub: "Invoice", nav: "client-finance" });
        });
      }
    }

    // ── FINANCE INVOICES ──
    if (["CEO","Country Manager","Finance Manager"].includes(role)) {
      const { data: invs } = await supabase.from("invoices").select("*");
      (invs || []).forEach(inv => {
        if (inv.created_at) all.push({ id: "finv-"+inv.id, date: inv.created_at.slice(0,10), type: "invoice", label: inv.vendor_name || "Invoice", sub: "Invoice · " + (inv.status || ""), nav: "invoices" });
      });
    }

    // ── ITINERARIES / FOLLOW-UPS ──
    {
      const { data: itins } = await supabase.from("itineraries").select("*");
      (itins || []).forEach(itin => {
        // Parse items if stored as JSON string
        let items = itin.items;
        if (typeof items === "string") { try { items = JSON.parse(items); } catch(e) { items = []; } }
        (items || []).forEach((item, idx) => {
          if (item.date) all.push({
            id: "itin-"+itin.id+"-"+idx,
            date: item.date,
            type: "itinerary",
            color: "#8B5CF6",
            label: item.company || itin.title || "Follow-up",
            sub: itin.title + (item.time ? " · " + item.time : "") + (item.action ? " · " + item.action : ""),
            nav: "calendar"
          });
        });
      });
    }

    setItems(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = current.toLocaleString("default", { month: "long" });
  const todayStr = today.toISOString().slice(0,10);

  const itemsByDate = {};
  items.forEach(item => {
    if (!itemsByDate[item.date]) itemsByDate[item.date] = [];
    itemsByDate[item.date].push(item);
  });

  const dayItems = selectedDay ? (itemsByDate[selectedDay] || []) : [];

  const typeLabel = { task: "Task", event: "Event", opportunity: "Opportunity", rff: "RFF", invoice: "Invoice", activity: "Activity", smtask: "S&M Task", itinerary: "Itinerary" };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Personal</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Calendar</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{items.length} items across all your activities</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          {["CEO","Sales & Marketing"].includes(role) && (
            <button onClick={() => setItinModal(true)} style={{ background: `linear-gradient(135deg, #F472B6, #E879F9)`, border: "none", color: "#fff", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ Create Itinerary</button>
          )}
          {["CEO","Strategy & Events Opportunity","Vendor Manager","Sales & Marketing","Vendor"].includes(role) && (
            <button onClick={() => {
              const feedUrl = `https://workroom.stretchfield.com/api/calendar-feed?user_id=${uid}`;
              navigator.clipboard.writeText(feedUrl).then(() => alert(
                "✅ Calendar URL copied!\n\n" +
                "iPhone / Mac Calendar:\n" +
                "1. Settings → Calendar → Accounts\n" +
                "2. Add Account → Other\n" +
                "3. Add Subscribed Calendar\n" +
                "4. Paste URL → Next → Save\n\n" +
                "Mac Calendar App:\n" +
                "1. File → New Calendar Subscription\n" +
                "2. Paste URL → Subscribe\n" +
                "3. Set refresh to Every Hour → OK\n\n" +
                "Google Calendar (Android):\n" +
                "1. Open calendar.google.com on desktop\n" +
                "2. Other Calendars → + → From URL\n" +
                "3. Paste URL → Add Calendar"
              ));
            }} style={{ background: `linear-gradient(135deg, ${T.teal}, ${T.cyan})`, border: "none", color: "#fff", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>📱 Sync to Phone</button>
          )}
          {/* Legend */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ color: T.textMuted, fontSize: 10, textTransform: "capitalize" }}>{typeLabel[type]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedDay ? "1fr 320px" : "1fr", gap: 20 }}>
        {/* Calendar grid */}
        <div>
          {/* Month nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={() => setCurrent(new Date(year, month - 1, 1))} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>‹</button>
            <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 18 }}>{monthName} {year}</div>
            <button onClick={() => setCurrent(new Date(year, month + 1, 1))} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textPrimary, width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} style={{ textAlign: "center", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "6px 0" }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={"e"+i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const dayItems = itemsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;
              const isPast = dateStr < todayStr;

              return (
                <div key={day} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  style={{
                    minHeight: 80, padding: "6px 8px", borderRadius: 8, cursor: "pointer",
                    background: isSelected ? T.cyan + "18" : isToday ? T.teal + "12" : T.surface,
                    border: `1px solid ${isSelected ? T.cyan + "60" : isToday ? T.teal + "40" : T.border}`,
                    opacity: isPast && !isToday ? 0.7 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = T.cyan + "40"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = isToday ? T.teal + "40" : T.border; }}>
                  <div style={{ color: isToday ? T.teal : T.textPrimary, fontWeight: isToday ? 900 : 600, fontSize: 12, marginBottom: 4 }}>
                    {isToday ? <span style={{ background: T.teal, color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{day}</span> : day}
                  </div>
                  {dayItems.slice(0,3).map((item, idx) => (
                    <div key={idx} style={{ background: typeColors[item.type] + "25", borderLeft: `2px solid ${typeColors[item.type]}`, borderRadius: 3, padding: "1px 4px", marginBottom: 2, fontSize: 9, color: typeColors[item.type], fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.label}
                    </div>
                  ))}
                  {dayItems.length > 3 && <div style={{ color: T.textMuted, fontSize: 9 }}>+{dayItems.length - 3} more</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDay && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, height: "fit-content", position: "sticky", top: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Selected</div>
                <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 16 }}>{new Date(selectedDay + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 16 }}>×</button>
            </div>

            {dayItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: T.textMuted, fontSize: 13 }}>Nothing scheduled</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dayItems.map((item, idx) => (
                  <div key={idx} onClick={() => { if (onNavigate) onNavigate(item.nav); }}
                    style={{ padding: "10px 12px", background: T.bg, border: `1px solid ${typeColors[item.type]}30`, borderLeft: `3px solid ${typeColors[item.type]}`, borderRadius: 8, cursor: onNavigate ? "pointer" : "default", transition: "box-shadow 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 2px 12px ${typeColors[item.type]}20`}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{item.label}</div>
                        <div style={{ color: T.textMuted, fontSize: 11 }}>{item.sub}</div>
                      </div>
                      <span style={{ background: typeColors[item.type] + "20", color: typeColors[item.type], borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", flexShrink: 0, marginLeft: 8 }}>{typeLabel[item.type]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Itineraries list below calendar ── */}
      {["CEO","Sales & Marketing"].includes(role) && itineraries.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Your Itineraries</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {itineraries.map(itin => (
              <div key={itin.id} onClick={() => setViewItinModal(itin)}
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: "2px solid #F472B6", borderRadius: 10, padding: "14px 16px", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px #F472B620"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{itin.title}</div>
                <div style={{ color: T.textMuted, fontSize: 11 }}>Week of {new Date(itin.week_start + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
                <div style={{ color: "#F472B6", fontSize: 11, marginTop: 6, fontWeight: 700 }}>{(itin.items || []).length} stops</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create Itinerary Modal ── */}
      {itinModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setItinModal(false)}>
          <div style={{ background: T.surface, border: `1px solid #F472B640`, borderRadius: 16, width: "100%", maxWidth: 800, maxHeight: "90vh", overflow: "auto", padding: 28, boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 20, marginBottom: 4 }}>Create Weekly Itinerary</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>Build a weekly outreach or visit schedule from your opportunities and leads</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Itinerary Title</label>
                <input value={itinForm.title} onChange={e => setItinForm({ ...itinForm, title: e.target.value })} placeholder="e.g. Banking Sector Outreach Week" style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Week Starting</label>
                <input type="date" value={itinForm.week_start} onChange={e => setItinForm({ ...itinForm, week_start: e.target.value })} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Rows */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 80px 1fr 1fr 1fr 32px", gap: 8, marginBottom: 8 }}>
                {["Date","Time","Company","Action","Notes",""].map((h, i) => (
                  <div key={i} style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
                ))}
              </div>
              {itinForm.rows.map((row, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "120px 80px 1fr 1fr 1fr 32px", gap: 8, marginBottom: 8 }}>
                  <input type="date" value={row.date} onChange={e => { const rows = [...itinForm.rows]; rows[idx].date = e.target.value; setItinForm({ ...itinForm, rows }); }} style={{ padding: "7px 8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                  <input value={row.time} onChange={e => { const rows = [...itinForm.rows]; rows[idx].time = e.target.value; setItinForm({ ...itinForm, rows }); }} placeholder="9:00am" style={{ padding: "7px 8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                  <select value={row.company} onChange={e => { const rows = [...itinForm.rows]; rows[idx].company = e.target.value; setItinForm({ ...itinForm, rows }); }} style={{ padding: "7px 8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: row.company ? T.textPrimary : T.textMuted, fontSize: 12, fontFamily: "inherit", outline: "none" }}>
                    <option value="">Select company...</option>
                    {opportunities.length > 0 && <optgroup label="── Opportunitys ──">{opportunities.map(l => <option key={"l"+l.id} value={l.company}>{l.company}</option>)}</optgroup>}
                    {opps.length > 0 && <optgroup label="── Leads ──">{opps.map(o => <option key={"o"+o.id} value={o.company}>{o.company}</option>)}</optgroup>}
                  </select>
                  <input value={row.action} onChange={e => { const rows = [...itinForm.rows]; rows[idx].action = e.target.value; setItinForm({ ...itinForm, rows }); }} placeholder="e.g. Cold call, Site visit" style={{ padding: "7px 8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                  <input value={row.notes} onChange={e => { const rows = [...itinForm.rows]; rows[idx].notes = e.target.value; setItinForm({ ...itinForm, rows }); }} placeholder="Notes..." style={{ padding: "7px 8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                  <button onClick={() => { const rows = itinForm.rows.filter((_, i) => i !== idx); setItinForm({ ...itinForm, rows: rows.length ? rows : [{ date: "", time: "", company: "", action: "", notes: "" }] }); }} style={{ background: T.red + "18", border: `1px solid ${T.red}30`, color: T.red, borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>×</button>
                </div>
              ))}
              <button onClick={() => setItinForm({ ...itinForm, rows: [...itinForm.rows, { date: "", time: "", company: "", action: "", notes: "" }] })} style={{ background: "none", border: `1px dashed ${T.border}`, color: T.textMuted, padding: "7px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12, width: "100%", marginTop: 4 }}>+ Add Row</button>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={async () => {
                if (!itinForm.title || !itinForm.week_start) return;
                setItinSaving(true);
                const validRows = itinForm.rows.filter(r => r.date && r.company);
                await supabase.from("itineraries").insert({
                  title: itinForm.title,
                  week_start: itinForm.week_start,
                  created_by: uid,
                  created_by_name: user?.name || "",
                  items: validRows,
                });
                setItinSaving(false);
                setItinModal(false);
                setItinForm({ title: "", week_start: "", rows: [{ date: "", time: "", company: "", action: "", notes: "" }] });
                load();
                loadOpportunitysOpps();
              }} disabled={itinSaving || !itinForm.title || !itinForm.week_start} style={{ background: "linear-gradient(135deg, #F472B6, #E879F9)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, opacity: (!itinForm.title || !itinForm.week_start) ? 0.5 : 1 }}>{itinSaving ? "Saving..." : "Save & Add to Calendar"}</button>
              <button onClick={() => setItinModal(false)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Itinerary Modal ── */}
      {viewItinModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setViewItinModal(null)}>
          <div style={{ background: T.surface, border: `1px solid #F472B640`, borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "85vh", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ color: "#F472B6", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Itinerary</div>
                <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 20 }}>{viewItinModal.title}</div>
                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Week of {new Date(viewItinModal.week_start + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
              <button onClick={() => setViewItinModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(viewItinModal.items || []).sort((a,b) => (a.date > b.date ? 1 : -1)).map((item, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "140px 70px 1fr 1fr", gap: 12, padding: "12px 14px", background: T.bg, border: `1px solid ${T.border}`, borderLeft: "3px solid #F472B6", borderRadius: 8 }}>
                  <div><div style={{ color: T.textMuted, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>Date</div><div style={{ color: T.textPrimary, fontSize: 12, fontWeight: 700 }}>{new Date(item.date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div></div>
                  <div><div style={{ color: T.textMuted, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>Time</div><div style={{ color: T.textPrimary, fontSize: 12 }}>{item.time || "—"}</div></div>
                  <div><div style={{ color: T.textMuted, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>Company</div><div style={{ color: "#F472B6", fontSize: 12, fontWeight: 700 }}>{item.company}</div><div style={{ color: T.textMuted, fontSize: 11 }}>{item.action}</div></div>
                  <div><div style={{ color: T.textMuted, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>Notes</div><div style={{ color: T.textSecondary, fontSize: 12 }}>{item.notes || "—"}</div></div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button onClick={async () => { if (!window.confirm("Delete this itinerary?")) return; await supabase.from("itineraries").delete().eq("id", viewItinModal.id); setViewItinModal(null); loadOpportunitysOpps(); load(); }} style={{ background: T.red + "18", border: `1px solid ${T.red}40`, color: T.red, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Delete Itinerary</button>
              <button onClick={() => setViewItinModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const EventTypeAnalysisView = ({ user }) => {
  const [rffs, setRffs] = useState([]);
  const [pos, setPOs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [periodType, setPeriodType] = useState("year");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  const eventTypes = [
    { key: "Conference/Seminar", code: "CS", color: "#00C8FF", label: "Conference / Seminar" },
    { key: "Product Launch", code: "PL", color: "#E879F9", label: "Product Launch" },
    { key: "Awards Ceremony", code: "AWD", color: "#F59E0B", label: "Awards Ceremony" },
    { key: "Corporate Party", code: "CP", color: "#10B981", label: "Corporate Party" },
    { key: "Other", code: "OTH", color: "#8B5CF6", label: "Other" },
  ];

  const load = async () => {
    setLoading(true);
    const [{ data: rf }, { data: po }, { data: inv }] = await Promise.all([
      supabase.from("rffs").select("*").not("event_type", "is", null),
      supabase.from("purchase_orders").select("*"),
      supabase.from("vendor_invoices").select("*"),
    ]);
    setRffs(rf || []);
    setPOs(po || []);
    setInvoices(inv || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getDateRange = () => {
    if (periodType === "year") {
      return { from: `${selectedYear}-01-01`, to: `${selectedYear}-12-31` };
    }
    return { from: startDate, to: endDate };
  };

  const { from, to } = getDateRange();

  const filteredRffs = rffs.filter(r => {
    if (!r.created_at) return false;
    const d = r.created_at.slice(0, 10);
    return (!from || d >= from) && (!to || d <= to);
  });

  const totalRffs = filteredRffs.length;
  const totalBudget = filteredRffs.reduce((s, r) => s + (r.amount || 0), 0);

  const typeStats = eventTypes.map(et => {
    const typeRffs = filteredRffs.filter(r => r.event_type === et.key);
    const typePOs = pos.filter(p => p.internal_po_number?.includes(`/ST/${et.code}/`));
    const typeInvoices = invoices.filter(i => i.invoice_number?.includes(`/ST/${et.code}/`));
    const totalAmt = typeRffs.reduce((s, r) => s + (r.amount || 0), 0);
    const pct = totalRffs > 0 ? Math.round((typeRffs.length / totalRffs) * 100) : 0;
    return { ...et, count: typeRffs.length, pct, totalAmt, poCount: typePOs.length, invoiceCount: typeInvoices.length, rffs: typeRffs };
  });

  const years = ["2024", "2025", "2026", "2027", "2028"];

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>CEO</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Event Type Analysis</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Distribution of RFFs, POs and invoices by event category</div>
      </div>

      {/* Period Selector */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["year", "custom"].map(pt => (
              <button key={pt} onClick={() => setPeriodType(pt)} style={{ padding: "6px 16px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 700, border: `1px solid ${periodType === pt ? T.cyan : T.border}`, background: periodType === pt ? T.cyan+"20" : "none", color: periodType === pt ? T.cyan : T.textMuted, textTransform: "uppercase" }}>{pt === "year" ? "By Year" : "Custom Range"}</button>
            ))}
          </div>
          {periodType === "year" ? (
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: "7px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: "7px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              <span style={{ color: T.textMuted }}>to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: "7px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
            </div>
          )}
          <div style={{ marginLeft: "auto", color: T.textMuted, fontSize: 12 }}>{filteredRffs.length} RFFs in period</div>
        </div>
      </div>

      {/* Summary KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total RFFs", value: totalRffs, color: T.cyan },
          { label: "Total POs", value: pos.length, color: T.teal },
          { label: "Total Invoices", value: invoices.length, color: T.amber },
          { label: "Most Active Type", value: typeStats.sort((a,b)=>b.count-a.count)[0]?.label?.split("/")[0] || "—", color: "#10B981" },
        ].map((k,i) => (
          <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: i===3?16:20, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Distribution Chart */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15, marginBottom: 20 }}>RFF Distribution by Event Type</div>
        {typeStats.sort((a,b) => b.count - a.count).map((et, i) => (
          <div key={et.key} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: et.color, flexShrink: 0 }} />
                <span style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{et.label}</span>
                <span style={{ background: et.color+"18", color: et.color, borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 800 }}>ST/{et.code}</span>
              </div>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <span style={{ color: T.textMuted, fontSize: 12 }}>{et.count} RFF{et.count!==1?"s":""}</span>
                <span style={{ color: et.color, fontWeight: 800, fontSize: 14 }}>{et.pct}%</span>
              </div>
            </div>
            <div style={{ height: 28, background: T.border+"44", borderRadius: 6, overflow: "hidden", position: "relative" }}>
              <div style={{ height: "100%", width: `${et.pct}%`, background: `linear-gradient(90deg, ${et.color}, ${et.color}99)`, borderRadius: 6, transition: "width 0.6s ease", minWidth: et.count > 0 ? 4 : 0 }} />
              {et.count > 0 && <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#fff", fontSize: 11, fontWeight: 700 }}>{et.count} RFF{et.count!==1?"s":""}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed breakdown table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15 }}>Detailed Breakdown</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
              {["Event Type","Code Prefix","RFFs","POs Created","Invoices","% Share"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {typeStats.map((et, i) => (
              <tr key={et.key} style={{ borderBottom: i < typeStats.length-1 ? `1px solid ${T.border}44` : "none" }}
                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: et.color }} />
                    <span style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{et.label}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}><span style={{ background: et.color+"18", color: et.color, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800 }}>ST/{et.code}/YY/###</span></td>
                <td style={{ padding: "12px 16px", color: et.count > 0 ? T.textPrimary : T.textMuted, fontWeight: et.count > 0 ? 700 : 400, fontSize: 13 }}>{et.count}</td>
                <td style={{ padding: "12px 16px", color: T.textPrimary, fontSize: 13 }}>{et.poCount}</td>
                <td style={{ padding: "12px 16px", color: T.textPrimary, fontSize: 13 }}>{et.invoiceCount}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: T.border+"44", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${et.pct}%`, background: et.color, borderRadius: 3 }} />
                    </div>
                    <span style={{ color: et.color, fontWeight: 800, fontSize: 12 }}>{et.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr style={{ background: T.bg, borderTop: `2px solid ${T.border}` }}>
              <td style={{ padding: "12px 16px", color: T.textPrimary, fontWeight: 900, fontSize: 13 }}>TOTAL</td>
              <td style={{ padding: "12px 16px" }} />
              <td style={{ padding: "12px 16px", color: T.cyan, fontWeight: 900, fontSize: 13 }}>{totalRffs}</td>
              <td style={{ padding: "12px 16px", color: T.cyan, fontWeight: 900, fontSize: 13 }}>{pos.length}</td>
              <td style={{ padding: "12px 16px", color: T.cyan, fontWeight: 900, fontSize: 13 }}>{invoices.length}</td>
              <td style={{ padding: "12px 16px", color: T.cyan, fontWeight: 900, fontSize: 13 }}>100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Monthly trend for selected year */}
      {periodType === "year" && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Monthly Activity — {selectedYear}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 6 }}>
            {Array.from({length:12},(_,i)=>i+1).map(month => {
              const monthRffs = filteredRffs.filter(r => {
                const d = new Date(r.created_at);
                return d.getFullYear() === parseInt(selectedYear) && d.getMonth()+1 === month;
              });
              const maxCount = Math.max(...Array.from({length:12},(_,i)=>filteredRffs.filter(r=>new Date(r.created_at).getMonth()===i).length), 1);
              const heightPct = monthRffs.length > 0 ? Math.max((monthRffs.length/maxCount)*80, 10) : 0;
              const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
              return (
                <div key={month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ height: 80, display: "flex", alignItems: "flex-end", width: "100%" }}>
                    <div style={{ width: "100%", height: `${heightPct}%`, background: monthRffs.length > 0 ? `linear-gradient(180deg, ${T.cyan}, ${T.teal})` : T.border+"44", borderRadius: "4px 4px 0 0", transition: "height 0.4s ease" }} />
                  </div>
                  {monthRffs.length > 0 && <div style={{ color: T.cyan, fontSize: 10, fontWeight: 800 }}>{monthRffs.length}</div>}
                  <div style={{ color: T.textMuted, fontSize: 9, fontWeight: 600 }}>{months[month-1]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};




const StrategyMapView = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [brief, setBrief] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data: ev } = await supabase.from("projects").select("*").order("event_date", { ascending: false });
    setEvents(ev || []);
  };

  useEffect(() => { load(); }, []);

  const loadEventData = async (eventId) => {
    setLoading(true);
    const [{ data: b }, { data: sc }] = await Promise.all([
      supabase.from("event_impact_briefs").select("*").eq("project_id", eventId).single(),
      supabase.from("event_scorecards").select("*").eq("project_id", eventId).single(),
    ]);
    setBrief(b || null);
    setScorecard(sc || null);
    setLoading(false);
  };

  const archetype = selectedEvent ? EVENT_ARCHETYPES[selectedEvent.event_category] : null;

  const toolStatus = (val) => {
    if (val === "Yes") return { color: "#10B981", icon: "✓" };
    if (val === "No") return { color: T.red, icon: "✗" };
    return { color: T.textMuted, icon: "—" };
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Strategic</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Strategy Map</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Event impact briefs and strategic parameters to inform your planning</div>
      </div>

      {/* Event selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>Select Event</label>
        <select value={selectedEvent?.id || ""} onChange={e => {
          const ev = events.find(x => x.id === e.target.value);
          setSelectedEvent(ev || null);
          if (ev) loadEventData(ev.id);
        }} style={{ width: "100%", maxWidth: 400, padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
          <option value="">Choose an event...</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.name} {ev.event_category ? `— ${ev.event_category}` : ""}</option>
          ))}
        </select>
      </div>

      {!selectedEvent && (
        <div style={{ textAlign: "center", padding: "60px 0", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🗺</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Select an event to view its strategy map</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>The strategy map shows the impact brief, KPIs and scorecard parameters defined by the CEO.</div>
        </div>
      )}

      {selectedEvent && loading && (
        <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>Loading strategy data...</div>
      )}

      {selectedEvent && !loading && (
        <div>
          {/* Event header card */}
          <div style={{ background: archetype ? archetype.color+"12" : T.surface, border: `1px solid ${archetype ? archetype.color+"40" : T.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: archetype?.color || T.cyan, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{selectedEvent.event_category || "Event"}</div>
                <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 20 }}>{selectedEvent.name}</div>
                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{selectedEvent.client} · {selectedEvent.phase}</div>
                {selectedEvent.event_date && <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>📅 {new Date(selectedEvent.event_date+"T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 4 }}>Completion</div>
                <div style={{ color: archetype?.color || T.cyan, fontWeight: 900, fontSize: 24 }}>{selectedEvent.completion || 0}%</div>
              </div>
            </div>
          </div>

          {!brief && (
            <div style={{ background: T.amber+"12", border: `1px solid ${T.amber}30`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
              <div style={{ color: T.amber, fontWeight: 700, fontSize: 13 }}>⚠ No Impact Brief set for this event yet</div>
              <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>The CEO or Strategy Opportunity needs to complete the Impact Brief in the Impact Intelligence tab first.</div>
            </div>
          )}

          {brief && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

              {/* Impact Objective */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: archetype?.color || T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>🎯 Impact Objective</div>
                {brief.impact_objective && (
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                    <div style={{ color: T.textPrimary, fontSize: 13, lineHeight: 1.6 }}>{brief.impact_objective}</div>
                  </div>
                )}
                {brief.target_audience && <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 4 }}><strong style={{ color: T.textSecondary }}>Who:</strong> {brief.target_audience}</div>}
                {brief.observable_signal && <div style={{ color: T.textMuted, fontSize: 12 }}><strong style={{ color: T.textSecondary }}>Signal:</strong> {brief.observable_signal}</div>}
              </div>

              {/* Measurement Tools */}
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ color: archetype?.color || T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>🔧 Measurement Tools</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    ["Pre-Event Survey", brief.tool_pre_survey],
                    ["Digital Tracking", brief.tool_digital_tracking],
                    ["Live Monitoring", brief.tool_live_monitoring],
                    ["Post-Event Survey", brief.tool_post_survey],
                    ["30-Day Follow-Up", brief.tool_30day_survey],
                    ["90-Day Tracking", brief.tool_90day_tracking],
                    ["Social Listening", brief.tool_social_listening],
                    ["Commercial Data", brief.tool_commercial_data],
                  ].map(([label, val]) => {
                    const s = toolStatus(val);
                    return (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${T.border}33` }}>
                        <span style={{ color: T.textSecondary, fontSize: 12 }}>{label}</span>
                        <span style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{s.icon} {val || "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* KPIs */}
          {brief && (brief.kpi1_name || brief.kpi2_name || brief.kpi3_name) && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ color: archetype?.color || T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>📊 Success KPIs</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[1,2,3].map(n => {
                  const name = brief[`kpi${n}_name`];
                  const target = brief[`kpi${n}_target`];
                  const method = brief[`kpi${n}_method`];
                  const timing = brief[`kpi${n}_timing`];
                  if (!name) return null;
                  return (
                    <div key={n} style={{ background: T.bg, border: `1px solid ${archetype?.color || T.cyan}25`, borderTop: `2px solid ${archetype?.color || T.cyan}`, borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ color: archetype?.color || T.cyan, fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 6 }}>KPI {n}</div>
                      <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{name}</div>
                      <div style={{ color: "#10B981", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Target: {target}</div>
                      <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 2 }}>Method: {method}</div>
                      <div style={{ color: T.textMuted, fontSize: 11 }}>When: {timing}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Scorecard dimensions */}
          {archetype && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ color: archetype.color, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>⚖️ Impact Dimensions — What We Are Measuring</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {archetype.dimensions.map((dim, i) => {
                  const score = scorecard ? scorecard[dim.key+"_score"] : null;
                  return (
                    <div key={dim.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: archetype.color+"20", border: `2px solid ${archetype.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: archetype.color, fontWeight: 900, fontSize: 12 }}>{Math.round(dim.weight*100)}%</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{dim.label}</div>
                        <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{dim.description}</div>
                        <div style={{ color: archetype.color, fontSize: 10, marginTop: 2 }}>Benchmark: {dim.benchmark}</div>
                      </div>
                      {score !== null && score !== undefined && parseFloat(score) > 0 ? (
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ color: getScoreLabel(parseFloat(score)).color, fontWeight: 900, fontSize: 20 }}>{score}</div>
                          <div style={{ color: T.textMuted, fontSize: 9 }}>/10</div>
                        </div>
                      ) : (
                        <div style={{ color: T.textMuted, fontSize: 11, flexShrink: 0 }}>Not scored</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Story intent */}
          {brief && (brief.story_before || brief.story_design || brief.story_outcome) && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ color: archetype?.color || T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>✍️ Impact Story We Are Engineering</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {brief.story_before && <div style={{ background: T.bg, borderLeft: `3px solid ${T.red}`, borderRadius: 6, padding: "10px 14px" }}><div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Before Stretchfield</div><div style={{ color: T.textSecondary, fontSize: 13 }}>{brief.story_before}</div></div>}
                {brief.story_design && <div style={{ background: T.bg, borderLeft: `3px solid ${archetype?.color||T.cyan}`, borderRadius: 6, padding: "10px 14px" }}><div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>What We Are Engineering</div><div style={{ color: T.textSecondary, fontSize: 13 }}>{brief.story_design}</div></div>}
                {brief.story_outcome && <div style={{ background: T.bg, borderLeft: `3px solid #10B981`, borderRadius: 6, padding: "10px 14px" }}><div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Intended Outcome</div><div style={{ color: T.textSecondary, fontSize: 13 }}>{brief.story_outcome}</div></div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


const ImpactIntelligenceSummary = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [scorecards, setScorecardsData] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: ev }, { data: sc }, { data: br }, { data: rp }] = await Promise.all([
      supabase.from("projects").select("*").not("event_category", "is", null).order("event_date", { ascending: false }),
      supabase.from("event_scorecards").select("*"),
      supabase.from("event_impact_briefs").select("*"),
      supabase.from("event_impact_reports").select("*"),
    ]);
    setEvents(ev || []);
    setScorecardsData(sc || []);
    setBriefs(br || []);
    setReports(rp || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getEventScore = (eventId) => {
    const sc = scorecards.find(s => s.project_id === eventId);
    return sc ? sc.overall_score : null;
  };

  const avgScore = scorecards.length > 0 ? (scorecards.reduce((s, sc) => s + (sc.overall_score || 0), 0) / scorecards.length).toFixed(1) : null;

  const categoryStats = Object.keys(EVENT_ARCHETYPES).map(cat => {
    const catEvents = events.filter(e => e.event_category === cat);
    const catScores = catEvents.map(e => getEventScore(e.id)).filter(s => s !== null);
    const avgCatScore = catScores.length > 0 ? (catScores.reduce((a,b) => a+b, 0) / catScores.length).toFixed(1) : null;
    return { category: cat, count: catEvents.length, avgScore: avgCatScore, color: EVENT_ARCHETYPES[cat].color };
  }).filter(c => c.count > 0);

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Strategic</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Impact Intelligence</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Cross-event impact scores, briefs and reports</div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Events Tracked", value: events.length, color: T.cyan },
          { label: "Briefs Completed", value: briefs.length, color: T.teal },
          { label: "Scorecards", value: scorecards.length, color: T.amber },
          { label: "Avg Impact Score", value: avgScore ? `${avgScore}/10` : "—", color: avgScore >= 7 ? "#10B981" : avgScore >= 5 ? T.amber : T.red },
        ].map((k,i) => (
          <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 20, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Category performance */}
      {categoryStats.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Performance by Event Category</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12 }}>
            {categoryStats.map(cat => (
              <div key={cat.category} style={{ background: T.bg, border: `1px solid ${cat.color}30`, borderTop: `3px solid ${cat.color}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ color: cat.color, fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>{cat.category}</div>
                <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 28 }}>{cat.avgScore || "—"}<span style={{ fontSize: 14, color: T.textMuted }}>/10</span></div>
                <div style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>{cat.count} event{cat.count!==1?"s":""}</div>
                {cat.avgScore && <div style={{ color: getScoreLabel(parseFloat(cat.avgScore)).color, fontSize: 11, fontWeight: 700, marginTop: 4 }}>{getScoreLabel(parseFloat(cat.avgScore)).label}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15 }}>All Events — Impact Status</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
              {["Event","Category","Date","Brief","Score","Report","Action"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((ev, i) => {
              const score = getEventScore(ev.id);
              const hasBrief = briefs.some(b => b.project_id === ev.id);
              const hasReport = reports.some(r => r.project_id === ev.id);
              const archetype = EVENT_ARCHETYPES[ev.event_category];
              return (
                <tr key={ev.id} style={{ borderBottom: i < events.length-1 ? `1px solid ${T.border}44` : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 16px", color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{ev.name}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: (archetype?.color||T.cyan)+"18", color: archetype?.color||T.cyan, border: `1px solid ${(archetype?.color||T.cyan)}30`, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>{ev.event_category}</span>
                  </td>
                  <td style={{ padding: "12px 16px", color: T.textMuted, fontSize: 12 }}>{ev.event_date ? new Date(ev.event_date+"T12:00:00").toLocaleDateString("en-GB") : "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ color: hasBrief ? "#10B981" : T.amber, fontSize: 12, fontWeight: 700 }}>{hasBrief ? "✓ Done" : "Pending"}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {score !== null ? (
                      <span style={{ color: getScoreLabel(score).color, fontWeight: 900, fontSize: 14 }}>{score}/10</span>
                    ) : <span style={{ color: T.textMuted, fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ color: hasReport ? "#10B981" : T.textMuted, fontSize: 12, fontWeight: 700 }}>{hasReport ? "✓ Done" : "—"}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)} style={{ background: (archetype?.color||T.cyan)+"15", border: `1px solid ${(archetype?.color||T.cyan)}30`, color: archetype?.color||T.cyan, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                      {selectedEvent?.id === ev.id ? "Close" : "Open"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {events.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "40px 0", textAlign: "center", color: T.textMuted, fontSize: 13 }}>No events with categories yet. Add event categories to start tracking impact.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Expanded event impact view */}
      {selectedEvent && (
        <div style={{ marginTop: 24 }}>
          <EventImpactView user={user} project={selectedEvent} />
        </div>
      )}
    </div>
  );
};



const NotificationsView = ({ user, onNavigate }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const sub = supabase.channel('notif-view-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + user.id }, () => load())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [user.id]);

  const getNavTarget = (note) => {
    const typeMap = {
      invoice: 'invoices', task: 'tasks', quote: 'vendors', rff: 'vendors',
      crm: 'crm', approval: 'vendors', event: 'events', finance: 'finance',
      budget: 'budgets', expense: 'expenses', scorecard: 'scorecards',
    };
    return typeMap[note.type] || null;
  };

  const handleNoteClick = async (note) => {
    // Mark as read
    await supabase.from('notifications').update({ read: true }).eq('id', note.id);
    load();
    // Navigate to source
    const target = getNavTarget(note);
    if (target && onNavigate) {
      // Deep-link routing by notification title keywords
      let resolvedTarget = "notifications";
      const t = note.title?.toLowerCase() || "";
      const m = note.message?.toLowerCase() || "";
      if (t.includes("task") || t.includes("comment") || t.includes("replied")) resolvedTarget = "tasks";
      else if (t.includes("rff approved") || t.includes("rff declined") || t.includes("rff resubmitted")) resolvedTarget = "vendors";
      else if (t.includes("vendor application") || t.includes("vendor onboarding")) resolvedTarget = "vendor-onboarding";
      else if (t.includes("quote submitted")) resolvedTarget = "quotes-received";
      else if (t.includes("contract award") && t.includes("pending")) resolvedTarget = "contract-awards";
      else if (t.includes("contract award confirmed") || t.includes("gig confirmed")) resolvedTarget = "purchase-orders";
      else if (t.includes("purchase order")) resolvedTarget = "vendor-invoices-submit";
      else if (t.includes("invoice received")) resolvedTarget = "vendor-invoices";
      else if (t.includes("opportunity") || t.includes("crm")) resolvedTarget = "crm";
      else if (t.includes("opportunity") || t.includes("converted")) resolvedTarget = "leads";
      else if (t.includes("vendor assigned") || t.includes("new rff assignment")) resolvedTarget = "rffs";
      else if (note.type === "rff") resolvedTarget = "vendors";
      else if (note.type === "task") resolvedTarget = "tasks";
      onNavigate(resolvedTarget, note.resource_id || null);
    }
  };

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    load();
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    load();
  };

  const deleteNote = async (id) => {
    await supabase.from('notifications').delete().eq('id', id);
    load();
  };

  const typeIcon = (type) => {
    const icons = { invoice: '🧾', task: '✅', quote: '💬', info: 'ℹ️', event: '📁' };
    return icons[type] || '🔔';
  };

  const unread = notes.filter(n => !n.read).length;

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>System</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Notifications</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{unread > 0 ? <span style={{ color: T.cyan, fontWeight: 700 }}>{unread} unread</span> : "All caught up"}</div>
        </div>
        {unread > 0 && <Btn small onClick={markAllRead}>✓ Mark All Read</Btn>}
      </div>
      {loading ? (
        <div style={{ color: T.textMuted, textAlign: "center", padding: 60 }}>Loading...</div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔔</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No notifications</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>You're all caught up.</div>
        </div>
      ) : (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          {notes.map((n, i) => (
            <div key={n.id} onClick={() => { if (!n.read) markRead(n.id); handleNoteClick(n); }} style={{
              display: "flex", alignItems: "flex-start", gap: 14,
              padding: "16px 20px",
              borderBottom: i < notes.length - 1 ? `1px solid ${T.border}44` : "none",
              background: !n.read ? T.cyan + "08" : "transparent",
              cursor: "pointer", transition: "background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = !n.read ? T.cyan + "12" : T.bg + "80"}
              onMouseLeave={e => e.currentTarget.style.background = !n.read ? T.cyan + "08" : "transparent"}
            >
              <div style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{typeIcon(n.type)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: !n.read ? T.textPrimary : T.textMuted, fontSize: 13, fontWeight: !n.read ? 700 : 500 }}>{n.title}</div>
                {n.message && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 3 }}>{n.message}</div>}
                <div style={{ color: T.textMuted, fontSize: 10, marginTop: 5 }}>
                  {new Date(n.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.cyan, boxShadow: `0 0 6px ${T.cyan}` }} />}
                <button onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16, padding: "2px 6px", borderRadius: 4, transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = T.red}
                  onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
                >×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ZohoBooksView = ({ user }) => {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("invoices");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);

  const tabs = [
    { id: "invoices", label: "Invoices" },
    { id: "estimates", label: "Quotes / Estimates" },
    { id: "payments", label: "Payments Received" },
    { id: "expenses", label: "Expenses" },
    { id: "bills", label: "Bills" },
    { id: "purchaseorders", label: "Purchase Orders" },
    { id: "contacts", label: "Contacts" },
    { id: "sync", label: "⟳ Sync" },
  ];

  const checkConnection = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/zoho-sync?action=status");
      const json = await res.json();
      setConnected(!!json.connected);
    } catch {
      setConnected(false);
    }
    setChecking(false);
  };

  const fetchTab = async (t) => {
    setLoading(true);
    setData([]);
    try {
      const res = await fetch(`/api/zoho-sync?action=${t}`);
      const json = await res.json();
      const key = Object.keys(json).find(k => Array.isArray(json[k]));
      setData(key ? json[key] : []);
    } catch {
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkConnection();
    // Check if just connected via OAuth callback
    if (window.location.search.includes("zoho=connected")) {
      setSyncMsg("✅ Zoho Books connected successfully!");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (connected && tab !== "sync") fetchTab(tab);
  }, [connected, tab]);

  const loadLocalData = async () => {
    const [{ data: cl }, { data: vn }] = await Promise.all([
      supabase.from("clients").select("*").order("name"),
      supabase.from("profiles").select("*").eq("role", "Vendor"),
    ]);
    setClients(cl || []);
    setVendors(vn || []);
  };

  useEffect(() => { loadLocalData(); }, []);

  const syncClient = async (client) => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/zoho-sync?action=sync-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client }),
      });
      const json = await res.json();
      if (json.contact) setSyncMsg(`✅ ${client.name} synced to Zoho Books`);
      else setSyncMsg(`⚠ ${json.message || "Sync failed"}`);
    } catch (e) {
      setSyncMsg("❌ Error: " + e.message);
    }
    setSyncing(false);
  };

  const syncVendor = async (vendor) => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/zoho-sync?action=sync-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor }),
      });
      const json = await res.json();
      if (json.contact) setSyncMsg(`✅ ${vendor.name} synced to Zoho Books`);
      else setSyncMsg(`⚠ ${json.message || "Sync failed"}`);
    } catch (e) {
      setSyncMsg("❌ Error: " + e.message);
    }
    setSyncing(false);
  };

  // Column definitions per tab
  const columns = {
    invoices: ["Invoice #", "Customer", "Date", "Due Date", "Amount", "Status"],
    estimates: ["Estimate #", "Customer", "Date", "Expiry", "Amount", "Status"],
    payments: ["Payment #", "Customer", "Date", "Amount", "Mode"],
    expenses: ["Date", "Category", "Description", "Amount", "Status"],
    bills: ["Bill #", "Vendor", "Date", "Due Date", "Amount", "Status"],
    purchaseorders: ["PO #", "Vendor", "Date", "Expected", "Amount", "Status"],
    contacts: ["Name", "Type", "Email", "Phone", "Balance"],
  };

  const getRow = (item, t) => {
    if (t === "invoices") return [item.invoice_number, item.customer_name, item.date, item.due_date, `${item.currency_code} ${(item.total || 0).toLocaleString()}`, item.status];
    if (t === "estimates") return [item.estimate_number, item.customer_name, item.date, item.expiry_date, `${item.currency_code} ${(item.total || 0).toLocaleString()}`, item.status];
    if (t === "payments") return [item.payment_number, item.customer_name, item.date, `${item.currency_code} ${(item.amount || 0).toLocaleString()}`, item.payment_mode];
    if (t === "expenses") return [item.date, item.account_name, item.description || item.reference_number, `${item.currency_code} ${(item.total || 0).toLocaleString()}`, item.status];
    if (t === "bills") return [item.bill_number, item.vendor_name, item.date, item.due_date, `${item.currency_code} ${(item.total || 0).toLocaleString()}`, item.status];
    if (t === "purchaseorders") return [item.purchaseorder_number, item.vendor_name, item.date, item.delivery_date, `${item.currency_code} ${(item.total || 0).toLocaleString()}`, item.status];
    if (t === "contacts") return [item.contact_name, item.contact_type, item.email, item.phone, `${item.currency_code || ""} ${(item.outstanding_receivable_amount || 0).toLocaleString()}`];
    return [];
  };

  const statusColor = (s) => {
    if (!s) return T.textMuted;
    const sl = s.toLowerCase();
    if (["paid","accepted","received","open"].includes(sl)) return T.teal;
    if (["overdue","expired"].includes(sl)) return T.red;
    if (["draft","pending","sent"].includes(sl)) return T.amber;
    return T.textMuted;
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Finance</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Zoho Books</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Live sync with your Zoho Books Professional account</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {checking ? (
            <span style={{ color: T.textMuted, fontSize: 12 }}>Checking connection...</span>
          ) : connected ? (
            <span style={{ background: T.teal + "18", color: T.teal, border: `1px solid ${T.teal}30`, borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700 }}>● Connected</span>
          ) : (
            <a href="/api/zoho-auth" style={{ background: `linear-gradient(135deg, #E67E22, #F39C12)`, border: "none", color: "#fff", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Connect Zoho Books</a>
          )}
          {connected && <button onClick={() => { if (tab !== "sync") fetchTab(tab); }} style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>↻ Refresh</button>}
          {connected && <a href="https://books.zoho.com" target="_blank" rel="noopener noreferrer" style={{ background: `linear-gradient(135deg, #E67E22, #F39C12)`, color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Open Zoho Books ↗</a>}
        </div>
      </div>

      {!connected && !checking && (
        <div style={{ textAlign: "center", padding: "60px 0", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Connect Zoho Books</div>
          <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 24 }}>Click "Connect Zoho Books" above to authorise access to your account.</div>
          <a href="/api/zoho-auth" style={{ background: `linear-gradient(135deg, #E67E22, #F39C12)`, color: "#fff", padding: "12px 28px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Connect Now</a>
        </div>
      )}

      {connected && (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "6px 16px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 700,
                border: `1px solid ${tab === t.id ? "#E67E22" : T.border}`,
                background: tab === t.id ? "#E67E2220" : "none",
                color: tab === t.id ? "#E67E22" : T.textMuted,
                letterSpacing: "0.04em", textTransform: "uppercase", transition: "all 0.15s",
              }}>{t.label}</button>
            ))}
          </div>

          {/* Sync tab */}
          {tab === "sync" && (
            <div>
              <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Sync WorkRoom Data to Zoho Books</div>
              {syncMsg && <div style={{ padding: "10px 14px", background: T.teal + "12", border: `1px solid ${T.teal}30`, borderRadius: 8, color: T.teal, fontSize: 13, marginBottom: 16 }}>{syncMsg}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Clients */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Clients → Zoho Customers</div>
                  <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 14 }}>Push WorkRoom clients to Zoho Books as customer contacts</div>
                  {clients.map(c => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}44` }}>
                      <div>
                        <div style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ color: T.textMuted, fontSize: 11 }}>{c.email}</div>
                      </div>
                      <button onClick={() => syncClient(c)} disabled={syncing} style={{ background: "#E67E2218", border: "1px solid #E67E2230", color: "#E67E22", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                        {c.zoho_contact_id ? "Re-sync" : "→ Zoho"}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Vendors */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                  <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Vendors → Zoho Vendors</div>
                  <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 14 }}>Push WorkRoom vendors to Zoho Books as vendor contacts</div>
                  {vendors.map(v => (
                    <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}44` }}>
                      <div>
                        <div style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600 }}>{v.name}</div>
                        <div style={{ color: T.textMuted, fontSize: 11 }}>{v.email}</div>
                      </div>
                      <button onClick={() => syncVendor(v)} disabled={syncing} style={{ background: "#E67E2218", border: "1px solid #E67E2230", color: "#E67E22", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>→ Zoho</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Data table */}
          {tab !== "sync" && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: T.textMuted }}>Loading from Zoho Books...</div>
              ) : data.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: T.textMuted, fontSize: 13 }}>No {tab} found in Zoho Books. <a href="https://books.zoho.com" target="_blank" rel="noopener noreferrer" style={{ color: "#E67E22", fontWeight: 700 }}>Create one in Zoho Books ↗</a></div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
                        {(columns[tab] || []).map((h, i) => (
                          <th key={i} style={{ padding: "12px 16px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, idx) => {
                        const row = getRow(item, tab);
                        return (
                          <tr key={idx} style={{ borderBottom: idx < data.length - 1 ? `1px solid ${T.border}44` : "none" }}
                            onMouseEnter={e => e.currentTarget.style.background = T.bg}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            {row.map((cell, ci) => (
                              <td key={ci} style={{ padding: "11px 16px", fontSize: 12 }}>
                                {ci === row.length - 1 && tab !== "contacts" && tab !== "payments" ? (
                                  <span style={{ background: statusColor(cell) + "18", color: statusColor(cell), border: `1px solid ${statusColor(cell)}30`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{cell}</span>
                                ) : (
                                  <span style={{ color: ci === 0 ? T.textPrimary : T.textSecondary, fontWeight: ci === 0 ? 700 : 400 }}>{cell}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};


const HRView = ({ user }) => {
  const [hrTab, setHrTab] = useState("staff");
  const [staff, setStaff] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [training, setTraining] = useState([]);
  const [trainingNeeds, setTrainingNeeds] = useState([]);
  const [saving, setSaving] = useState(false);

  // Modals
  const [leaveModal, setLeaveModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [trainingModal, setTrainingModal] = useState(null);
  const [needModal, setNeedModal] = useState(false);

  // Forms
  const [leaveForm, setLeaveForm] = useState({ staff_id: "", staff_name: "", leave_type: "Annual", start_date: "", end_date: "", reason: "" });
  const [reviewForm, setReviewForm] = useState({ staff_id: "", staff_name: "", review_period: "", score: 7, strengths: "", improvements: "", goals: "", events_delivered: 0 });
  const [trainingForm, setTrainingForm] = useState({ staff_id: "", staff_name: "", training_name: "", training_type: "Internal", provider: "", date_completed: "", expiry_date: "", notes: "" });
  const [needForm, setNeedForm] = useState({ staff_id: "", staff_name: "", training_required: "", priority: "medium", reason: "" });

  const load = async () => {
    const [s, l, r, t, n] = await Promise.all([
      supabase.from("profiles").select("*").not("role", "in", '("Client","Vendor","Board of Directors")').order("name"),
      supabase.from("leave_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("performance_reviews").select("*").order("created_at", { ascending: false }),
      supabase.from("training_records").select("*").order("created_at", { ascending: false }),
      supabase.from("training_needs").select("*").order("created_at", { ascending: false }),
    ]);
    setStaff(s.data || []);
    setLeaveRequests(l.data || []);
    setReviews(r.data || []);
    setTraining(t.data || []);
    setTrainingNeeds(n.data || []);
  };

  useEffect(() => { load(); }, []);

  const calcDays = (start, end) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end) - new Date(start)) / (1000*60*60*24)) + 1;
  };

  const saveLeave = async () => {
    if (!leaveForm.staff_id || !leaveForm.start_date || !leaveForm.end_date) { alert("Please fill all required fields."); return; }
    setSaving(true);
    const days = calcDays(leaveForm.start_date, leaveForm.end_date);
    await supabase.from("leave_requests").insert({ ...leaveForm, days_requested: days, status: "pending" });
    // Notify staff member
    await supabase.from("notifications").insert({ user_id: leaveForm.staff_id, title: "Leave Request Submitted", message: `Your ${leaveForm.leave_type} leave request for ${days} day(s) has been submitted for approval.`, type: "task" });
    setSaving(false);
    setLeaveModal(false);
    setLeaveForm({ staff_id: "", staff_name: "", leave_type: "Annual", start_date: "", end_date: "", reason: "" });
    load();
  };

  const approveLeave = async (id, staffId, approved) => {
    await supabase.from("leave_requests").update({ status: approved ? "approved" : "declined", approved_by: user.id, approved_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("notifications").insert({ user_id: staffId, title: approved ? "Leave Approved" : "Leave Declined", message: `Your leave request has been ${approved ? "approved" : "declined"} by CEO.`, type: "task" });
    load();
  };

  const saveReview = async () => {
    if (!reviewForm.staff_id || !reviewForm.review_period) { alert("Please fill all required fields."); return; }
    setSaving(true);
    await supabase.from("performance_reviews").insert({ ...reviewForm, reviewed_by: user.id, review_date: new Date().toISOString().slice(0,10) });
    await supabase.from("notifications").insert({ user_id: reviewForm.staff_id, title: "Performance Review Added", message: `Your performance review for ${reviewForm.review_period} has been completed.`, type: "task" });
    setSaving(false);
    setReviewModal(null);
    setReviewForm({ staff_id: "", staff_name: "", review_period: "", score: 7, strengths: "", improvements: "", goals: "", events_delivered: 0 });
    load();
  };

  const saveTraining = async () => {
    if (!trainingForm.staff_id || !trainingForm.training_name) { alert("Please fill all required fields."); return; }
    setSaving(true);
    await supabase.from("training_records").insert({ ...trainingForm, status: trainingForm.date_completed ? "completed" : "pending", created_by: user.id });
    setSaving(false);
    setTrainingModal(null);
    setTrainingForm({ staff_id: "", staff_name: "", training_name: "", training_type: "Internal", provider: "", date_completed: "", expiry_date: "", notes: "" });
    load();
  };

  const saveNeed = async () => {
    if (!needForm.staff_id || !needForm.training_required) { alert("Please fill all required fields."); return; }
    setSaving(true);
    await supabase.from("training_needs").insert({ ...needForm, status: "open", created_by: user.id });
    setSaving(false);
    setNeedModal(false);
    setNeedForm({ staff_id: "", staff_name: "", training_required: "", priority: "medium", reason: "" });
    load();
  };

  const inputStyle = { width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 };
  const sectionHead = { color: T.textPrimary, fontWeight: 800, fontSize: 15, marginBottom: 16 };

  const pendingLeave = leaveRequests.filter(l => l.status === "pending");
  const expiringCerts = training.filter(t => t.expiry_date && new Date(t.expiry_date) <= new Date(Date.now() + 30*24*60*60*1000) && t.status === "completed");
  const openNeeds = trainingNeeds.filter(n => n.status === "open");

  const staffSelect = [{ value: "", label: "Select staff member..." }, ...staff.map(s => ({ value: s.id, label: `${s.name} — ${s.role}` }))];

  const StatusPill = ({ status }) => {
    const map = { pending: [T.amber, "Pending"], approved: ["#10B981", "Approved"], declined: [T.red, "Declined"], completed: ["#10B981", "Completed"], open: [T.amber, "Open"], in_progress: [T.cyan, "In Progress"] };
    const [color, label] = map[status] || [T.textMuted, status];
    return <span style={{ background: color+"18", color, border: `1px solid ${color}30`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800 }}>{label}</span>;
  };

  const PriorityPill = ({ priority }) => {
    const map = { high: [T.red, "High"], medium: [T.amber, "Medium"], low: [T.teal, "Low"] };
    const [color, label] = map[priority] || [T.textMuted, priority];
    return <span style={{ background: color+"18", color, border: `1px solid ${color}30`, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{label}</span>;
  };

  const Modal = ({ title, onClose, children, maxWidth = 580 }) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth, maxHeight: "90vh", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
        <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 20 }}>{title}</div>
        {children}
      </div>
    </div>
  );

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}><label style={labelStyle}>{label}</label>{children}</div>
  );

  const StaffSelect = ({ value, onChange }) => (
    <select value={value} onChange={e => { const s = staff.find(x => x.id === e.target.value); onChange(e.target.value, s?.name || ""); }} style={inputStyle}>
      {staffSelect.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  const hrTabs = [
    { id: "staff", label: "Staff Records", badge: 0 },
    { id: "leave", label: "Leave", badge: pendingLeave.length },
    { id: "performance", label: "Performance", badge: 0 },
    { id: "training", label: "Training", badge: expiringCerts.length + openNeeds.length },
  ];

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>People</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800 }}>Human Resources</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{staff.length} staff members · {pendingLeave.length} leave pending · {openNeeds.length} training needs open</div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Staff", value: staff.length, color: T.cyan },
          { label: "Leave Pending", value: pendingLeave.length, color: T.amber },
          { label: "Training Needs", value: openNeeds.length, color: T.red },
          { label: "Expiring Certs", value: expiringCerts.length, color: expiringCerts.length > 0 ? T.red : T.teal },
        ].map((k,i) => (
          <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 22, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* HR Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {hrTabs.map(t => (
          <button key={t.id} onClick={() => setHrTab(t.id)} style={{ padding: "10px 18px", border: "none", cursor: "pointer", background: "none", color: hrTab === t.id ? T.textPrimary : T.textMuted, fontWeight: hrTab === t.id ? 700 : 400, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: hrTab === t.id ? `2px solid ${T.cyan}` : "2px solid transparent", marginBottom: -1, position: "relative" }}>
            {t.label}
            {t.badge > 0 && <span style={{ marginLeft: 5, background: T.amber, color: "#000", fontSize: 9, fontWeight: 900, borderRadius: 20, padding: "1px 5px" }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── STAFF RECORDS ── */}
      {hrTab === "staff" && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {["Name","Role","Email","Country","Leave Taken","Reviews","Training"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((s, i) => {
                  const staffLeave = leaveRequests.filter(l => l.staff_id === s.id && l.status === "approved").reduce((sum, l) => sum + (l.days_requested || 0), 0);
                  const staffReviews = reviews.filter(r => r.staff_id === s.id).length;
                  const staffTraining = training.filter(t => t.staff_id === s.id && t.status === "completed").length;
                  const latestReview = reviews.filter(r => r.staff_id === s.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
                  const roleColor = { CEO: T.cyan, "Country Manager": T.teal, "Vendor Manager": T.amber, "Strategy & Events Lead": "#E879F9", "Finance Manager": "#F59E0B", "Sales & Marketing": T.blue }[s.role] || T.textMuted;
                  return (
                    <tr key={s.id} style={{ borderBottom: i < staff.length-1 ? `1px solid ${T.border}44` : "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: roleColor+"20", border: `1px solid ${roleColor}40`, display: "flex", alignItems: "center", justifyContent: "center", color: roleColor, fontWeight: 800, fontSize: 10 }}>{(s.name||"?").slice(0,2).toUpperCase()}</div>
                          <span style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}><span style={{ background: roleColor+"15", color: roleColor, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{s.role}</span></td>
                      <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 11 }}>{s.email}</td>
                      <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 12 }}>{s.country || "Ghana"}</td>
                      <td style={{ padding: "10px 14px", color: T.textPrimary, fontSize: 12, fontWeight: 600 }}>{staffLeave} days</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ color: staffReviews > 0 ? T.teal : T.textMuted, fontSize: 12 }}>
                          {staffReviews > 0 ? `${staffReviews} reviews` : "—"}
                          {latestReview && <div style={{ color: T.textMuted, fontSize: 10 }}>Last: {latestReview.score}/10</div>}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: staffTraining > 0 ? T.cyan : T.textMuted, fontSize: 12 }}>{staffTraining > 0 ? `${staffTraining} completed` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LEAVE MANAGEMENT ── */}
      {hrTab === "leave" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={sectionHead}>Leave Requests</div>
            <button onClick={() => setLeaveModal(true)} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>+ Add Leave Request</button>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {["Staff","Type","From","To","Days","Reason","Status","Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: i < leaveRequests.length-1 ? `1px solid ${T.border}44` : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 14px", color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{l.staff_name}</td>
                    <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 12 }}>{l.leave_type}</td>
                    <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 12 }}>{l.start_date}</td>
                    <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 12 }}>{l.end_date}</td>
                    <td style={{ padding: "10px 14px", color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{l.days_requested}</td>
                    <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 11, maxWidth: 160 }}>{l.reason}</td>
                    <td style={{ padding: "10px 14px" }}><StatusPill status={l.status} /></td>
                    <td style={{ padding: "10px 14px" }}>
                      {l.status === "pending" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => approveLeave(l.id, l.staff_id, true)} style={{ background: "#10B98118", border: "1px solid #10B98130", color: "#10B981", padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>✓ Approve</button>
                          <button onClick={() => approveLeave(l.id, l.staff_id, false)} style={{ background: T.red+"18", border: `1px solid ${T.red}30`, color: T.red, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>✗ Decline</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {leaveRequests.length === 0 && <tr><td colSpan={8} style={{ padding: "30px 0", textAlign: "center", color: T.textMuted }}>No leave requests yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PERFORMANCE REVIEWS ── */}
      {hrTab === "performance" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={sectionHead}>Performance Reviews</div>
            <button onClick={() => setReviewModal(true)} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>+ Add Review</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>
            {staff.map(s => {
              const staffReviews = reviews.filter(r => r.staff_id === s.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
              const latest = staffReviews[0];
              const avgScore = staffReviews.length > 0 ? (staffReviews.reduce((sum,r) => sum + (r.score||0), 0) / staffReviews.length).toFixed(1) : null;
              const scoreColor = avgScore >= 8 ? "#10B981" : avgScore >= 6 ? T.teal : avgScore >= 4 ? T.amber : T.red;
              return (
                <div key={s.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>{s.name}</div>
                      <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{s.role}</div>
                    </div>
                    {avgScore && <div style={{ textAlign: "right" }}><div style={{ color: scoreColor, fontWeight: 900, fontSize: 22 }}>{avgScore}</div><div style={{ color: T.textMuted, fontSize: 9 }}>avg /10</div></div>}
                  </div>
                  {latest ? (
                    <div>
                      <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 4 }}>Latest: {latest.review_period} · Score: {latest.score}/10</div>
                      {latest.strengths && <div style={{ color: T.textSecondary, fontSize: 11, marginBottom: 2 }}>✓ {latest.strengths?.slice(0,60)}...</div>}
                      {latest.improvements && <div style={{ color: T.amber, fontSize: 11 }}>↑ {latest.improvements?.slice(0,60)}...</div>}
                      <div style={{ color: T.textMuted, fontSize: 10, marginTop: 6 }}>{staffReviews.length} review{staffReviews.length !== 1 ? "s" : ""} total</div>
                    </div>
                  ) : (
                    <div style={{ color: T.textMuted, fontSize: 12, fontStyle: "italic" }}>No reviews yet</div>
                  )}
                  <button onClick={() => setReviewModal({ staff_id: s.id, staff_name: s.name })} style={{ marginTop: 12, width: "100%", background: T.cyan+"12", border: `1px solid ${T.cyan}25`, color: T.cyan, padding: "6px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>+ Add Review</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TRAINING ── */}
      {hrTab === "training" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={sectionHead}>Training & Development</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setNeedModal(true)} style={{ background: T.amber+"15", border: `1px solid ${T.amber}30`, color: T.amber, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>+ Training Need</button>
              <button onClick={() => setTrainingModal(true)} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>+ Log Training</button>
            </div>
          </div>

          {/* Training Needs */}
          {trainingNeeds.length > 0 && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>Training Needs — {openNeeds.length} open</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {["Staff","Training Required","Priority","Reason","Status"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {trainingNeeds.map((n, i) => (
                    <tr key={n.id} style={{ borderBottom: i < trainingNeeds.length-1 ? `1px solid ${T.border}44` : "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "10px 14px", color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{n.staff_name}</td>
                      <td style={{ padding: "10px 14px", color: T.textSecondary, fontSize: 12 }}>{n.training_required}</td>
                      <td style={{ padding: "10px 14px" }}><PriorityPill priority={n.priority} /></td>
                      <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 11 }}>{n.reason}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <select value={n.status} onChange={async e => { await supabase.from("training_needs").update({ status: e.target.value }).eq("id", n.id); load(); }} style={{ padding: "4px 8px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 11, fontFamily: "inherit", outline: "none" }}>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Training Records */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>Training Records</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                {["Staff","Training","Type","Provider","Date","Expiry","Status"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {training.map((t, i) => {
                  const isExpiring = t.expiry_date && new Date(t.expiry_date) <= new Date(Date.now() + 30*24*60*60*1000);
                  return (
                    <tr key={t.id} style={{ borderBottom: i < training.length-1 ? `1px solid ${T.border}44` : "none", background: isExpiring ? T.red+"05" : "transparent" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bg}
                      onMouseLeave={e => e.currentTarget.style.background = isExpiring ? T.red+"05" : "transparent"}>
                      <td style={{ padding: "10px 14px", color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{t.staff_name}</td>
                      <td style={{ padding: "10px 14px", color: T.textSecondary, fontSize: 12 }}>{t.training_name}</td>
                      <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 11 }}>{t.training_type}</td>
                      <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 11 }}>{t.provider || "—"}</td>
                      <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 11 }}>{t.date_completed || "—"}</td>
                      <td style={{ padding: "10px 14px", color: isExpiring ? T.red : T.textMuted, fontSize: 11, fontWeight: isExpiring ? 700 : 400 }}>{t.expiry_date || "—"}{isExpiring && " ⚠"}</td>
                      <td style={{ padding: "10px 14px" }}><StatusPill status={t.status} /></td>
                    </tr>
                  );
                })}
                {training.length === 0 && <tr><td colSpan={7} style={{ padding: "30px 0", textAlign: "center", color: T.textMuted }}>No training records yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ MODALS ════ */}

      {/* Leave Request Modal */}
      {leaveModal && (
        <Modal title="Add Leave Request" onClose={() => setLeaveModal(false)}>
          <Field label="Staff Member *"><StaffSelect value={leaveForm.staff_id} onChange={(id, name) => setLeaveForm({...leaveForm, staff_id: id, staff_name: name})} /></Field>
          <Field label="Leave Type">
            <select value={leaveForm.leave_type} onChange={e => setLeaveForm({...leaveForm, leave_type: e.target.value})} style={inputStyle}>
              {["Annual","Sick","Emergency","Maternity/Paternity","Study","Other"].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Start Date *"><input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} style={inputStyle} /></Field>
            <Field label="End Date *"><input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} style={inputStyle} /></Field>
          </div>
          {leaveForm.start_date && leaveForm.end_date && <div style={{ color: T.cyan, fontSize: 12, marginBottom: 14, fontWeight: 700 }}>📅 {calcDays(leaveForm.start_date, leaveForm.end_date)} days requested</div>}
          <Field label="Reason"><textarea value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} rows={3} style={{...inputStyle, resize: "vertical"}} placeholder="Reason for leave..." /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={saveLeave} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Saving..." : "Submit Leave Request"}</button>
            <button onClick={() => setLeaveModal(false)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Performance Review Modal */}
      {reviewModal && (
        <Modal title="Add Performance Review" onClose={() => setReviewModal(null)}>
          {!reviewModal.staff_id ? (
            <Field label="Staff Member *"><StaffSelect value={reviewForm.staff_id} onChange={(id, name) => setReviewForm({...reviewForm, staff_id: id, staff_name: name})} /></Field>
          ) : (
            <div style={{ background: T.cyan+"12", border: `1px solid ${T.cyan}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: T.cyan, fontSize: 13, fontWeight: 700 }}>{reviewModal.staff_name}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Review Period *"><input value={reviewForm.review_period} onChange={e => setReviewForm({...reviewForm, review_period: e.target.value})} style={inputStyle} placeholder="e.g. Q1 2026" /></Field>
            <Field label="Events Delivered"><input type="number" value={reviewForm.events_delivered} onChange={e => setReviewForm({...reviewForm, events_delivered: parseInt(e.target.value)||0})} style={inputStyle} /></Field>
          </div>
          <Field label={`Performance Score: ${reviewForm.score}/10`}>
            <input type="range" min="1" max="10" step="0.5" value={reviewForm.score} onChange={e => setReviewForm({...reviewForm, score: parseFloat(e.target.value)})}
              style={{ width: "100%", accentColor: T.cyan }} />
            <div style={{ display: "flex", justifyContent: "space-between", color: T.textMuted, fontSize: 10, marginTop: 2 }}><span>1 — Poor</span><span style={{ color: T.cyan, fontWeight: 700 }}>{reviewForm.score}/10</span><span>10 — Exceptional</span></div>
          </Field>
          <Field label="Strengths"><textarea value={reviewForm.strengths} onChange={e => setReviewForm({...reviewForm, strengths: e.target.value})} rows={2} style={{...inputStyle, resize: "vertical"}} placeholder="Key strengths observed..." /></Field>
          <Field label="Areas for Improvement"><textarea value={reviewForm.improvements} onChange={e => setReviewForm({...reviewForm, improvements: e.target.value})} rows={2} style={{...inputStyle, resize: "vertical"}} placeholder="Areas to develop..." /></Field>
          <Field label="Goals for Next Period"><textarea value={reviewForm.goals} onChange={e => setReviewForm({...reviewForm, goals: e.target.value})} rows={2} style={{...inputStyle, resize: "vertical"}} placeholder="Goals and objectives..." /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { if(reviewModal.staff_id) setReviewForm(f => ({...f, staff_id: reviewModal.staff_id, staff_name: reviewModal.staff_name})); saveReview(); }} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Saving..." : "Save Review"}</button>
            <button onClick={() => setReviewModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Training Log Modal */}
      {trainingModal && (
        <Modal title="Log Training" onClose={() => setTrainingModal(null)}>
          <Field label="Staff Member *"><StaffSelect value={trainingForm.staff_id} onChange={(id, name) => setTrainingForm({...trainingForm, staff_id: id, staff_name: name})} /></Field>
          <Field label="Training Name *"><input value={trainingForm.training_name} onChange={e => setTrainingForm({...trainingForm, training_name: e.target.value})} style={inputStyle} placeholder="e.g. Event Safety Certification" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Training Type">
              <select value={trainingForm.training_type} onChange={e => setTrainingForm({...trainingForm, training_type: e.target.value})} style={inputStyle}>
                {["Internal","External","Certification","Workshop","Online","Conference"].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Provider / Institution"><input value={trainingForm.provider} onChange={e => setTrainingForm({...trainingForm, provider: e.target.value})} style={inputStyle} placeholder="Who delivered it?" /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Date Completed"><input type="date" value={trainingForm.date_completed} onChange={e => setTrainingForm({...trainingForm, date_completed: e.target.value})} style={inputStyle} /></Field>
            <Field label="Expiry Date (if applicable)"><input type="date" value={trainingForm.expiry_date} onChange={e => setTrainingForm({...trainingForm, expiry_date: e.target.value})} style={inputStyle} /></Field>
          </div>
          <Field label="Notes"><textarea value={trainingForm.notes} onChange={e => setTrainingForm({...trainingForm, notes: e.target.value})} rows={2} style={{...inputStyle, resize: "vertical"}} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={saveTraining} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Saving..." : "Save Training Record"}</button>
            <button onClick={() => setTrainingModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Training Need Modal */}
      {needModal && (
        <Modal title="Flag Training Need" onClose={() => setNeedModal(false)}>
          <Field label="Staff Member *"><StaffSelect value={needForm.staff_id} onChange={(id, name) => setNeedForm({...needForm, staff_id: id, staff_name: name})} /></Field>
          <Field label="Training Required *"><input value={needForm.training_required} onChange={e => setNeedForm({...needForm, training_required: e.target.value})} style={inputStyle} placeholder="e.g. Client Management, Protocol Training" /></Field>
          <Field label="Priority">
            <select value={needForm.priority} onChange={e => setNeedForm({...needForm, priority: e.target.value})} style={inputStyle}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>
          <Field label="Reason / Context"><textarea value={needForm.reason} onChange={e => setNeedForm({...needForm, reason: e.target.value})} rows={3} style={{...inputStyle, resize: "vertical"}} placeholder="Why is this training needed?" /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={saveNeed} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.amber}, ${T.amber}99)`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Saving..." : "Flag Training Need"}</button>
            <button onClick={() => setNeedModal(false)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
};


export default function StretchfieldWorkRoom({ user: propUser, profile: propProfile, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingResourceId, setPendingResourceId] = useState(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const isMobile = useIsMobile();

  const buildUser = (p) => p ? {
    id: p.id,
    name: p.name,
    role: p.role,
    email: p.email,
    avatar: p.avatar,
    avatar_url: p.avatar_url || null,
    phone: p.phone || "",
  } : null;

  const [currentUser, setCurrentUser] = useState(() => buildUser(propProfile));

  // Sync if propProfile changes (e.g. on login)
  React.useEffect(() => {
    if (propProfile) setCurrentUser(buildUser(propProfile));
  }, [propProfile?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchUnread = async () => {
      const { data } = await supabase.from('notifications').select('id').eq('user_id', currentUser.id).eq('read', false);
      setUnreadCount((data || []).length);
    };
    fetchUnread();
    const sub = supabase.channel('live-notif-' + currentUser.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + currentUser.id }, () => fetchUnread())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [currentUser?.id]);

  if (!currentUser) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${T.border}`, borderTop: `3px solid ${T.cyan}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: T.textMuted, fontSize: 13, letterSpacing: "0.06em" }}>Loading WorkRoom...</div>
    </div>
  );

  const renderContent = () => {
    try {
    const role = currentUser.role;
    switch (activeTab) {
      case "dashboard":
        if (role === "CEO") return <CEODashboard onTab={setActiveTab} user={currentUser} />;
        if (role === "Board of Directors") return <BoardDashboard user={currentUser} />;
        if (role === "Country Manager") return <StaffDashboard user={currentUser} />;
        if (role === "Vendor") return <VendorDashboard user={currentUser} />;
        if (role === "Client") return <ClientDashboard user={currentUser} />;
        if (role === "Finance Manager") return <FinanceManagerDashboard user={currentUser} onTab={setActiveTab} />;
        if (role === "Sales & Marketing") return <CRMDashboardSM user={currentUser} />;
        if (role === "Strategy & Events Opportunity") return <StaffDashboard user={currentUser} />;
        if (role === "Vendor Manager") return <VendorManagerDashboard user={currentUser} />;
        return <StaffDashboard user={currentUser} />;
      case "events": return <EventsView user={currentUser} userRole={currentUser.role} />;
      case "tasks": return <TasksView userRole={currentUser.role} openTaskId={pendingResourceId} onOpenHandled={() => setPendingResourceId(null)} />;
      case "vendors": return <VendorsView />;
      case "invoices": return <InvoicesView />;
      case "clients": return <ClientsView user={currentUser} />;
      case "users": return <UsersView user={currentUser} />;
      case "crm": return <CRMView user={currentUser} />;
      case "crm-insights": return ["CEO","Country Manager"].includes(currentUser.role) ? <CRMDashboardCEO user={currentUser} /> : <CRMDashboardSM user={currentUser} />;
      case "sm-tasks": return <SMTasksView user={currentUser} />;
      case "strategy-overview": return <StrategyOverviewView />;
      case "opportunities": return <OpportunitiesView user={currentUser} onNavigate={(tab) => setActiveTab(tab)} />;
      case "client-financials": return <CEOClientFinanceView user={currentUser} />;
      case "client-finance": return <ClientFinanceView user={currentUser} />;
      case "feedback-summary": return <FeedbackView userRole={currentUser.role} />;
      case "finance": return <FinanceDashboard user={currentUser} onTab={setActiveTab} />;
      case "finance-approvals": return <FinanceApprovalsView user={currentUser} />;
      case "scorecards": return <VendorScorecardsView user={currentUser} />;
      case "vendor-ratings": return <VendorRatingsView user={currentUser} />;
      case "rff-approvals": return <RFFApprovalsView user={currentUser} />;
      case "vendor-assignment": return <VendorAssignmentView user={currentUser} />;
      case "scorecards": return <VendorScorecardsView user={currentUser} />;
      case "vendor-ratings": return <VendorRatingsView user={currentUser} />;
      case "rff-approvals": return <RFFApprovalsView user={currentUser} />;
      case "vendor-assignment": return <VendorAssignmentView user={currentUser} />;
      case "budgets": return <BudgetView user={currentUser} />;
      case "expenses": return <ExpenseView user={currentUser} />;
      case "finance-reports": return <FinanceReportsView user={currentUser} />;
      case "feedback": return <FeedbackView userRole={currentUser.role} />;
      case "calendar": return <CalendarView user={currentUser} onNavigate={(tab) => setActiveTab(tab)} />;
      case "zoho-books": return <ZohoBooksView user={currentUser} />;
      case "vendor-onboarding": return <VendorOnboardingView user={currentUser} />;
      case "event-analysis": return <EventTypeAnalysisView user={currentUser} />;
      case "impact-intelligence": return <ImpactIntelligenceSummary user={currentUser} />;
      case "hr": return <HRView user={currentUser} />;
      case "strategy-map": return <StrategyMapView user={currentUser} />;
      case "quotes-received": return <QuotesReceivedView user={currentUser} />;
      case "quote-comparison": return <QuoteComparisonView user={currentUser} />;
      case "contract-awards": return <ContractAwardApprovalView user={currentUser} />;
      case "gig-confirmation": return <GigConfirmationView user={currentUser} />;
      case "purchase-orders": return <PurchaseOrderView user={currentUser} />;
      case "vendor-invoices": return <FinanceInvoicesView user={currentUser} />;
      case "vendor-invoices-submit": return <VendorInvoiceView user={currentUser} />;
      case "notifications": return <NotificationsView user={currentUser} onNavigate={(tab, resourceId) => { setActiveTab(tab); if (resourceId) setPendingResourceId(resourceId); }} />;
      case "rffs": return <VendorRFFsView user={currentUser} />;
      case "quotes": return <VendorQuotesView user={currentUser} />;
      case "vendor-tasks": return <VendorTasksView user={currentUser} />;
      case "client-events": return <ClientEventsView user={currentUser} />;
      case "client-docs": return <div style={{ color: T.textSecondary }}>Documents will appear here.</div>;
      default: return null;
    }
    } catch(e) {
      return <div style={{color:"red", padding:20}}>{e.message} — {e.stack?.split("\n")[1]}</div>;
    }
  };

  return (
    <ThemeProvider>
    <div className="sf-layout" style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif", color: T.textPrimary, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${T.bg}; } ::-webkit-scrollbar-thumb { background: ${T.border}44; border-radius: 3px; }
        input, select, textarea { font-family: inherit; }
        .sf-bottom-nav { display: none; }
        .sf-mobile-header { display: none; }
        .sf-drawer { display: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .sf-animate { animation: fadeUp 0.35s ease forwards; }
        @media (max-width: 768px) {
          .sf-mobile-header { display: flex !important; }
          .sf-sidebar { display: none !important; }
          .sf-bottom-nav { display: flex !important; }
          .sf-drawer { display: flex !important; }
          .sf-content { padding: 12px !important; padding-top: 68px !important; padding-bottom: 76px !important; margin-left: 0 !important; }
          .sf-layout { flex-direction: column !important; }
          .sf-hide-mobile { display: none !important; }
          .sf-full-mobile { width: 100% !important; max-width: 100% !important; }
          .sf-stack-mobile { flex-direction: column !important; }
          .sf-card-mobile { border-radius: 12px !important; }
          table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
          input, select, textarea, button { font-size: 16px !important; }
        }
      `}</style>

      <div className="sf-sidebar" style={{ display: isMobile ? "none" : "flex", width: sidebarCollapsed ? 58 : 228, background: T.bgDeep, borderRight: `1px solid ${T.border}`, flexDirection: "column", transition: "width 0.28s cubic-bezier(0.22,1,0.36,1)", flexShrink: 0, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 1, height: "100%", background: `linear-gradient(180deg, transparent, ${T.cyan}25, ${T.magenta}18, transparent)`, pointerEvents: "none" }} />
        <div style={{ padding: "16px 12px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, minHeight: 60 }}>
          <img src={LOGO_SRC} alt="S" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0, borderRadius: 6 }} />
          {!sidebarCollapsed && (
            <div>
              <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13, letterSpacing: "0.05em" }}>Stretchfield</div>
              <div style={{ color: T.textMuted, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 1 }}>WorkRoom</div>
            </div>
          )}
        </div>
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {(() => {
            const navItems = getNavItems(currentUser.role);
            const isCEONav = currentUser.role === "CEO";

            if (!isCEONav) {
              return navItems.map(item => {
                const active = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: active ? T.cyan + "18" : "none",
                    color: active ? T.cyan : T.textMuted,
                    fontWeight: active ? 700 : 400, fontSize: 11,
                    marginBottom: 1, textAlign: "left",
                    borderLeft: active ? `2px solid ${T.cyan}` : "2px solid transparent",
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    transition: "all 0.15s", whiteSpace: "nowrap", overflow: "hidden",
                  }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.textSecondary; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = T.textMuted; } }}
                  >
                    <span style={{ fontSize: 5, flexShrink: 0, color: active ? T.cyan : T.textGhost }}>■</span>
                    {!sidebarCollapsed && item.label}
                  </button>
                );
              });
            }

            // CEO grouped nav
            return navItems.map(item => {
              if (!item.children) {
                // Top level single item (Dashboard, Notifications, Calendar)
                const active = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: active ? T.cyan+"18" : "none",
                    color: active ? T.cyan : T.textMuted,
                    fontWeight: active ? 700 : 400, fontSize: 11,
                    marginBottom: 2, textAlign: "left",
                    borderLeft: active ? `2px solid ${T.cyan}` : "2px solid transparent",
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    transition: "all 0.15s",
                  }}>
                    {!sidebarCollapsed && item.label}
                    {sidebarCollapsed && item.label?.slice(0,2)}
                  </button>
                );
              }

              // Group item with children
              const isGroupActive = item.children.some(c => c.id === activeTab);
              const [groupOpen, setGroupOpen] = React.useState(isGroupActive);

              return (
                <div key={item.id} style={{ marginBottom: 2 }}>
                  <button onClick={() => setGroupOpen(o => !o)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                    background: isGroupActive ? T.cyan+"10" : "none",
                    color: isGroupActive ? T.cyan : T.textSecondary,
                    fontWeight: 700, fontSize: 10,
                    textAlign: "left", letterSpacing: "0.06em", textTransform: "uppercase",
                    transition: "all 0.15s",
                  }}>
                    {!sidebarCollapsed && (
                      <>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        <span style={{ fontSize: 9, transition: "transform 0.2s", transform: groupOpen ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.5 }}>▾</span>
                      </>
                    )}
                    {sidebarCollapsed && <span style={{ fontSize: 9 }}>▾</span>}
                  </button>
                  {groupOpen && !sidebarCollapsed && (
                    <div style={{ paddingLeft: 12, marginTop: 2 }}>
                      {item.children.map(child => {
                        const active = activeTab === child.id;
                        return (
                          <button key={child.id} onClick={() => setActiveTab(child.id)} style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 8,
                            padding: "7px 10px", borderRadius: 5, border: "none", cursor: "pointer",
                            background: active ? T.cyan+"20" : "none",
                            color: active ? T.cyan : T.textMuted,
                            fontWeight: active ? 700 : 400, fontSize: 11,
                            marginBottom: 1, textAlign: "left",
                            borderLeft: active ? `2px solid ${T.cyan}` : "2px solid transparent",
                            letterSpacing: "0.03em",
                            transition: "all 0.15s",
                          }}
                            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.textSecondary; } }}
                            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = T.textMuted; } }}
                          >
                            <span style={{ fontSize: 4, color: active ? T.cyan : T.textGhost }}>●</span>
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </nav>
        <div style={{ padding: "10px 10px 12px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px", borderRadius: 6, marginBottom: 8 }}>
            <Avatar initials={currentUser.avatar} size={28} color={T.cyan} />
            {!sidebarCollapsed && <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ color: T.textPrimary, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser.name}</div>
              <div style={{ color: T.textMuted, fontSize: 10 }}>{currentUser.role}</div>
            </div>}
          </div>
          {!sidebarCollapsed && <div style={{ marginBottom: 6 }}><ThemeToggle /></div>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ width: "100%", background: "none", border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 6, padding: "5px", cursor: "pointer", fontSize: 13, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyan + "60"; e.currentTarget.style.color = T.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >{sidebarCollapsed ? "›" : "‹"}</button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, background: T.bgDeep, flexShrink: 0, position: "relative" }}>
          {/* Left — breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
            <span style={{ color: T.textMuted, fontSize: 11, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>Stretchfield / {currentUser.name.split(" ")[0]}</span>
          </div>

          {/* Centre — tagline */}
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", pointerEvents: "none", textAlign: "center", maxWidth: "calc(100% - 480px)" }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 12,
              letterSpacing: "0.06em",
              background: `linear-gradient(90deg, ${T.textMuted}, ${T.textPrimary}, ${T.textMuted})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
            }}>We don't plan events. We engineer impact.</span>
          </div>

          {/* Right — controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "flex-end" }}>
            <span style={{ color: T.textMuted, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>{currentUser.name}</span>
            <div style={{ background: T.cyan + "18", border: `1px solid ${T.cyan}30`, color: T.cyan, padding: "3px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{currentUser.role}</div>
            <button onClick={() => setActiveTab("notifications")} style={{ position: "relative", background: activeTab === "notifications" ? T.cyan + "18" : "none", border: "1px solid " + (activeTab === "notifications" ? T.cyan + "40" : T.border), color: activeTab === "notifications" ? T.cyan : T.textMuted, width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -5, right: -5, background: T.red, color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: "50%", width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid " + T.bgDeep, boxShadow: `0 0 8px ${T.red}80` }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button onClick={onLogout} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.red + "60"; e.currentTarget.style.color = T.red; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
            >Sign Out</button>
          </div>
        </div>

        <div className="sf-content" style={{ flex: 1, overflowY: "auto", padding: isMobile ? "72px 16px 16px" : 24 }}>
          {renderContent()}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sf-mobile-header" style={{ display: isMobile ? "flex" : "none", position: "fixed", top: 0, left: 0, right: 0, height: 56, background: T.surface, borderBottom: `1px solid ${T.border}`, alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${T.cyan}, #3B7BFF)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#000" }}>S</div>
          <span style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15 }}>WorkRoom</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setActiveTab('notifications')} style={{ position: "relative", background: "none", border: "1px solid " + T.border, color: T.textMuted, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
            🔔
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "#F43F5E", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid " + T.bg }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <div style={{ background: T.cyan + "22", border: `1px solid ${T.cyan}44`, color: T.cyan, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{currentUser.role}</div>
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Sign Out</button>
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textPrimary, padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>☰</button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {/* ── Mobile Bottom Navigation ── */}
      {isMobile && (() => {
        const role = currentUser.role;
        const bottomTabs = {
          "CEO": [
            { id: "dashboard", icon: "⊞", label: "Home" },
            { id: "events", icon: "📅", label: "Events" },
            { id: "crm", icon: "📈", label: "Leads" },
            { id: "vendors", icon: "🏭", label: "Vendors" },
            { id: "finance", icon: "💼", label: "Finance" },
          ],
          "Country Manager": [
            { id: "dashboard", icon: "⊞", label: "Home" },
            { id: "events", icon: "📅", label: "Events" },
            { id: "vendors", icon: "🏭", label: "Vendors" },
            { id: "finance", icon: "💼", label: "Finance" },
            { id: "tasks", icon: "✅", label: "Tasks" },
          ],
          "Strategy & Events Lead": [
            { id: "dashboard", icon: "⊞", label: "Home" },
            { id: "events", icon: "📅", label: "Events" },
            { id: "tasks", icon: "✅", label: "Tasks" },
            { id: "calendar", icon: "📆", label: "Calendar" },
            { id: "notifications", icon: "🔔", label: "Alerts" },
          ],
          "Vendor Manager": [
            { id: "dashboard", icon: "⊞", label: "Home" },
            { id: "vendors", icon: "🏭", label: "Vendors" },
            { id: "vendor-assignment", icon: "📋", label: "Assign" },
            { id: "quote-comparison", icon: "⚖️", label: "Quotes" },
            { id: "calendar", icon: "📆", label: "Calendar" },
          ],
          "Finance Manager": [
            { id: "dashboard", icon: "⊞", label: "Home" },
            { id: "finance", icon: "💼", label: "Finance" },
            { id: "purchase-orders", icon: "📄", label: "POs" },
            { id: "vendor-invoices", icon: "🧾", label: "Invoices" },
            { id: "calendar", icon: "📆", label: "Calendar" },
          ],
          "Sales & Marketing": [
            { id: "dashboard", icon: "⊞", label: "Home" },
            { id: "opportunities", icon: "🎯", label: "Leads" },
            { id: "crm", icon: "📈", label: "Pipeline" },
            { id: "sm-tasks", icon: "✅", label: "Tasks" },
            { id: "calendar", icon: "📆", label: "Calendar" },
          ],
          "Vendor": [
            { id: "dashboard", icon: "⊞", label: "Home" },
            { id: "rffs", icon: "📋", label: "RFFs" },
            { id: "quotes", icon: "💬", label: "Quotes" },
            { id: "vendor-invoices-submit", icon: "🧾", label: "Invoices" },
            { id: "vendor-tasks", icon: "✅", label: "Tasks" },
          ],
          "Client": [
            { id: "dashboard", icon: "⊞", label: "Home" },
            { id: "client-events", icon: "📅", label: "Events" },
            { id: "client-finance", icon: "💼", label: "Finance" },
            { id: "notifications", icon: "🔔", label: "Alerts" },
            { id: "calendar", icon: "📆", label: "Calendar" },
          ],
        };
        const tabs = bottomTabs[role] || [
          { id: "dashboard", icon: "⊞", label: "Home" },
          { id: "notifications", icon: "🔔", label: "Alerts" },
          { id: "calendar", icon: "📆", label: "Calendar" },
        ];
        return (
          <div className="sf-bottom-nav" style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500,
            background: T.bgDeep, borderTop: `1px solid ${T.border}`,
            display: "none", alignItems: "center", justifyContent: "space-around",
            padding: "6px 0 max(6px, env(safe-area-inset-bottom))",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          }}>
            {tabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  background: "none", border: "none", cursor: "pointer", padding: "6px 12px",
                  flex: 1, minWidth: 0,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: active ? T.cyan+"20" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, transition: "all 0.15s",
                    transform: active ? "scale(1.1)" : "scale(1)",
                  }}>{tab.icon}</div>
                  <span style={{ color: active ? T.cyan : T.textMuted, fontSize: 9, fontWeight: active ? 700 : 400, letterSpacing: "0.04em" }}>{tab.label}</span>
                  {tab.id === "notifications" && unreadCount > 0 && (
                    <div style={{ position: "absolute", top: 4, width: 6, height: 6, borderRadius: "50%", background: T.red }} />
                  )}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* ── Mobile Drawer (full nav) ── */}
      {mobileMenuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={() => setMobileMenuOpen(false)}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: T.bgDeep, borderRadius: "24px 24px 0 0", borderTop: `1px solid ${T.border}`, boxShadow: `0 -8px 48px rgba(0,0,0,0.4)`, overflow: "hidden" }} onClick={e => e.stopPropagation()}>

            {/* Pull handle */}
            <div style={{ width: 36, height: 3, borderRadius: 2, background: T.border, margin: "14px auto 0" }} />

            {/* User identity */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 24px 14px", borderBottom: `1px solid ${T.border}` }}>
              <Avatar initials={currentUser.avatar} size={40} color={T.cyan} />
              <div>
                <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15 }}>{currentUser.name}</div>
                <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{currentUser.role}</div>
              </div>
            </div>

            {/* Tagline */}
            <div style={{ textAlign: "center", padding: "12px 24px 10px", borderBottom: `1px solid ${T.border}44` }}>
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 13,
                letterSpacing: "0.06em",
                color: T.textMuted,
              }}>We don't plan events. We engineer impact.</span>
            </div>

            {/* Nav items */}
            <div style={{ padding: "8px 0 16px", overflowY: "auto", maxHeight: "55vh" }}>
              {getNavItems(currentUser.role).map(item => {
                const active = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 16,
                    padding: "13px 24px", background: active ? T.cyan + "14" : "none",
                    border: "none", cursor: "pointer", textAlign: "left",
                    borderLeft: active ? `3px solid ${T.cyan}` : "3px solid transparent",
                    transition: "all 0.15s",
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? T.cyan : T.border, boxShadow: active ? `0 0 8px ${T.cyan}` : "none", flexShrink: 0, transition: "all 0.15s" }} />
                    <span style={{ color: active ? T.cyan : T.textPrimary, fontWeight: active ? 700 : 500, fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom — theme toggle + sign out */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px 36px", borderTop: `1px solid ${T.border}` }}>
              <ThemeToggle compact />
              <button onClick={onLogout} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
      {showAccountSettings && (
        <AccountSettingsModal
          user={currentUser}
          onClose={() => setShowAccountSettings(false)}
          onUpdate={(updated) => {
            setCurrentUser(updated);
            setShowAccountSettings(false);
          }}
        />
      )}
    </ThemeProvider>
  );
}

const CRMDashboardCEO = ({ user }) => {
  const [opportunities, setOpportunitys] = useState([]);
  const [targets, setTargets] = useState([]);
  const [members, setMembers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ rep_id: "", rep_name: "", target_amount: "", period: "monthly", start_date: "", end_date: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [l, t, m] = await Promise.all([
      supabase.from("opportunities").select("*"),
      supabase.from("sales_targets").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").in("role", ["CEO", "Country Manager", "Sales & Marketing"]),
    ]);
    setOpportunitys(l.data || []);
    setTargets(t.data || []);
    setMembers(m.data || []);
  };

  useEffect(() => { load(); }, []);

  const wonOpportunitys = opportunities.filter(l => l.status === "won");
  const totalRevenue = wonOpportunitys.reduce((a, l) => a + (l.value || 0), 0);
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const ytdRevenue = wonOpportunitys.filter(l => l.closed_date && new Date(l.closed_date) >= startOfYear).reduce((a, l) => a + (l.value || 0), 0);
  const avgCycle = wonOpportunitys.filter(l => l.sales_cycle_days).length
    ? Math.round(wonOpportunitys.filter(l => l.sales_cycle_days).reduce((a, l) => a + l.sales_cycle_days, 0) / wonOpportunitys.filter(l => l.sales_cycle_days).length) : 0;
  const closingPct = opportunities.length ? Math.round((wonOpportunitys.length / opportunities.length) * 100) : 0;

  const repStats = members.map(m => {
    const repOpportunitys = opportunities.filter(l => l.assigned_to === m.id || l.created_by === m.id);
    const repWon = repOpportunitys.filter(l => l.status === "won");
    const repRevenue = repWon.reduce((a, l) => a + (l.value || 0), 0);
    const repTarget = targets.find(t => t.rep_id === m.id);
    const repCycle = repWon.filter(l => l.sales_cycle_days).length
      ? Math.round(repWon.filter(l => l.sales_cycle_days).reduce((a, l) => a + l.sales_cycle_days, 0) / repWon.filter(l => l.sales_cycle_days).length) : 0;
    return { ...m, repOpportunitys, repWon, repRevenue, repTarget, repCycle, closingPct: repOpportunitys.length ? Math.round((repWon.length / repOpportunitys.length) * 100) : 0 };
  }).sort((a, b) => b.repRevenue - a.repRevenue);

  const clientEarnings = wonOpportunitys.reduce((acc, l) => { acc[l.company] = (acc[l.company] || 0) + (l.value || 0); return acc; }, {});

  const handleCreateTarget = async () => {
    if (!form.rep_id || !form.target_amount) return;
    setSaving(true);
    await supabase.from("sales_targets").insert({
      rep_id: form.rep_id, rep_name: form.rep_name,
      target_amount: parseFloat(form.target_amount),
      period: form.period, start_date: form.start_date || null,
      end_date: form.end_date || null, created_by: user.id,
    });
    setModal(false);
    setForm({ rep_id: "", rep_name: "", target_amount: "", period: "monthly", start_date: "", end_date: "" });
    setSaving(false);
    load();
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Sales Analytics</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>CRM Insights</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Team performance and revenue overview</div>
        </div>
        <Btn onClick={() => setModal(true)}>+ Set Target</Btn>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Revenue", value: "GHS " + totalRevenue.toLocaleString(), color: T.teal },
          { label: "YTD Revenue", value: "GHS " + ytdRevenue.toLocaleString(), color: T.cyan },
          { label: "Closing Rate", value: closingPct + "%", color: T.blue },
          { label: "Avg Cycle", value: avgCycle + "d", color: T.amber },
          { label: "Deals Won", value: wonOpportunitys.length + " / " + opportunities.length, color: T.magenta },
        ].map((k, i) => (
          <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 18, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Rep Performance + Revenue by Client */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16, marginBottom: 16 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Rep Performance vs Target</div>
          {repStats.length === 0 ? <div style={{ color: T.textMuted, fontSize: 13 }}>No reps yet.</div>
          : repStats.map((rep, i) => {
            const target = rep.repTarget ? rep.repTarget.target_amount : 0;
            const pct = target ? Math.min(100, Math.round((rep.repRevenue / target) * 100)) : 0;
            const barColor = pct >= 100 ? T.teal : pct >= 60 ? T.cyan : T.amber;
            return (
              <div key={rep.id} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${T.border}44` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 12 }}>{i === 0 && <span style={{ color: T.gold }}>★ </span>}{rep.name}</div>
                    <div style={{ color: T.textMuted, fontSize: 10, marginTop: 2 }}>{rep.repWon.length} won · {rep.closingPct}% close · {rep.repCycle}d</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: T.teal, fontWeight: 800, fontSize: 13 }}>GHS {rep.repRevenue.toLocaleString()}</div>
                    {target > 0 && <div style={{ color: T.textMuted, fontSize: 10 }}>of GHS {target.toLocaleString()}</div>}
                  </div>
                </div>
                {target > 0 && (
                  <>
                    <div style={{ height: 4, background: T.border + "44", borderRadius: 2, marginBottom: 4 }}>
                      <div style={{ height: "100%", width: pct + "%", background: barColor, borderRadius: 2 }} />
                    </div>
                    <div style={{ color: T.textMuted, fontSize: 10 }}>{pct}% of target</div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Revenue by Client</div>
          {Object.keys(clientEarnings).length === 0 ? <div style={{ color: T.textMuted, fontSize: 13 }}>No won deals yet.</div>
          : Object.entries(clientEarnings).sort((a,b) => b[1]-a[1]).map(([company, amount]) => (
            <div key={company} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ color: T.textPrimary, fontSize: 12, fontWeight: 600 }}>{company}</div>
                <div style={{ color: T.gold, fontWeight: 800, fontSize: 12 }}>GHS {amount.toLocaleString()}</div>
              </div>
              <div style={{ height: 3, background: T.border + "44", borderRadius: 2 }}>
                <div style={{ height: "100%", width: Math.round((amount / totalRevenue) * 100) + "%", background: `linear-gradient(90deg, ${T.cyan}, ${T.teal})`, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Targets */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sales Targets</div>
          <button onClick={() => setModal(true)} style={{ background: "none", border: "none", color: T.cyan, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>+ Set Target →</button>
        </div>
        {targets.length === 0 ? <div style={{ color: T.textMuted, fontSize: 13, padding: "16px 0" }}>No targets set yet.</div>
        : targets.map(t => {
          const rep = repStats.find(r => r.id === t.rep_id);
          const pct = rep ? Math.min(100, Math.round(((rep.repRevenue || 0) / t.target_amount) * 100)) : 0;
          return (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.border}44` }}>
              <div>
                <div style={{ color: T.textPrimary, fontWeight: 600, fontSize: 12 }}>{t.rep_name}</div>
                <div style={{ color: T.textMuted, fontSize: 10, marginTop: 2 }}>{t.period} · {t.start_date} → {t.end_date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: T.gold, fontWeight: 800, fontSize: 13 }}>GHS {t.target_amount.toLocaleString()}</div>
                <div style={{ color: pct >= 100 ? T.teal : T.textMuted, fontSize: 10, marginTop: 2 }}>{pct}% achieved</div>
              </div>
            </div>
          );
        })}
      </div>
      {modal && (
        <Modal title="Set Sales Target" onClose={() => setModal(false)}>
          <Select label="Sales Rep" options={[{ value: "", label: "Select rep..." }, ...members.map(m => ({ value: m.id, label: m.name + " — " + m.role }))]}
            value={form.rep_id} onChange={v => { const m = members.find(x => x.id === v); setForm({ ...form, rep_id: v, rep_name: m ? m.name : "" }); }} />
          <Input label="Target Amount (GHS )" type="number" placeholder="0" value={form.target_amount} onChange={v => setForm({ ...form, target_amount: v })} />
          <Select label="Period" options={[{ value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }, { value: "yearly", label: "Yearly" }]}
            value={form.period} onChange={v => setForm({ ...form, period: v })} />
          <Input label="Start Date" type="date" value={form.start_date} onChange={v => setForm({ ...form, start_date: v })} />
          <Input label="End Date" type="date" value={form.end_date} onChange={v => setForm({ ...form, end_date: v })} />
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn onClick={handleCreateTarget} disabled={saving}>{saving ? "Saving..." : "Set Target"}</Btn>
            <Btn variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

const CRMDashboardSM = ({ user }) => {
  const [opportunities, setOpportunitys] = useState([]);
  const [target, setTarget] = useState(null);
  const [period, setPeriod] = useState("mtd");

  const load = async () => {
    const [l, t] = await Promise.all([
      supabase.from("opportunities").select("*").or("assigned_to.eq." + user.id + ",created_by.eq." + user.id),
      supabase.from("sales_targets").select("*").eq("rep_id", user.id).order("created_at", { ascending: false }).limit(1),
    ]);
    setOpportunitys(l.data || []);
    setTarget(t.data && t.data[0] ? t.data[0] : null);
  };

  useEffect(() => { load(); }, [user.id]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const filterByPeriod = (arr, p) => arr.filter(l => {
    if (!l.closed_date) return false;
    const d = new Date(l.closed_date);
    if (p === "mtd") return d >= startOfMonth;
    if (p === "ytd") return d >= startOfYear;
    return true;
  });

  const wonOpportunitys = opportunities.filter(l => l.status === "won");
  const periodRevenue = filterByPeriod(wonOpportunitys, period).reduce((a, l) => a + (l.value || 0), 0);
  const ytdRevenue = filterByPeriod(wonOpportunitys, "ytd").reduce((a, l) => a + (l.value || 0), 0);
  const totalRevenue = wonOpportunitys.reduce((a, l) => a + (l.value || 0), 0);
  const pipelineValue = opportunities.filter(l => !["won","lost"].includes(l.status)).reduce((a, l) => a + (l.value || 0), 0);
  const targetAmount = target ? target.target_amount : 0;
  const targetPct = targetAmount ? Math.min(100, Math.round((periodRevenue / targetAmount) * 100)) : 0;
  const ytdTargetPct = targetAmount ? Math.min(100, Math.round((ytdRevenue / targetAmount) * 100)) : 0;
  const avgCycle = wonOpportunitys.filter(l => l.sales_cycle_days).length
    ? Math.round(wonOpportunitys.filter(l => l.sales_cycle_days).reduce((a, l) => a + l.sales_cycle_days, 0) / wonOpportunitys.filter(l => l.sales_cycle_days).length) : 0;
  const closingPct = opportunities.length ? Math.round((wonOpportunitys.length / opportunities.length) * 100) : 0;
  const clientSpread = wonOpportunitys.reduce((acc, l) => { acc[l.company] = (acc[l.company] || 0) + (l.value || 0); return acc; }, {});
  const periodLabel = period === "mtd" ? "Month to Date" : period === "ytd" ? "Year to Date" : "All Time";

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Sales Analytics</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>My CRM Insights</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Performance overview for {user.name}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["mtd","MTD"],["ytd","YTD"],["all","All"]].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)} style={{
              padding: "6px 16px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.06em", border: `1px solid ${period === val ? T.cyan : T.border}`,
              background: period === val ? T.cyan + "20" : "none",
              color: period === val ? T.cyan : T.textMuted, transition: "all 0.15s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: periodLabel + " Revenue", value: "GHS " + periodRevenue.toLocaleString(), color: T.teal },
          { label: "YTD Revenue", value: "GHS " + ytdRevenue.toLocaleString(), color: T.cyan },
          { label: "Pipeline", value: "GHS " + pipelineValue.toLocaleString(), color: T.amber },
          { label: "Close Rate", value: closingPct + "%", color: T.magenta },
          { label: "Avg Cycle", value: avgCycle + "d", color: T.blue },
        ].map((k, i) => (
          <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 15, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Target Tracking */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Target Tracking — {periodLabel}</div>
        {!target ? (
          <div style={{ color: T.textMuted, fontSize: 13, padding: "8px 0" }}>No target set. Ask your CEO to set a target.</div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
              <div>
                <div style={{ color: T.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{target.period} target</div>
                <div style={{ color: T.textMuted, fontSize: 10, marginTop: 2 }}>{target.start_date} → {target.end_date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: T.teal, fontWeight: 900, fontSize: 24 }}>GHS {periodRevenue.toLocaleString()}</div>
                <div style={{ color: T.textMuted, fontSize: 11 }}>of GHS {targetAmount.toLocaleString()}</div>
              </div>
            </div>
            <div style={{ height: 8, background: T.border + "44", borderRadius: 4, marginBottom: 8 }}>
              <div style={{ height: "100%", width: targetPct + "%", background: targetPct >= 100 ? T.teal : targetPct >= 60 ? T.cyan : T.amber, borderRadius: 4, transition: "width 0.4s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ color: targetPct >= 100 ? T.teal : T.amber, fontSize: 13, fontWeight: 700 }}>{targetPct}%</div>
              <div style={{ color: T.textMuted, fontSize: 11 }}>{targetAmount - periodRevenue > 0 ? "GHS " + (targetAmount - periodRevenue).toLocaleString() + " to go" : "🎉 Target exceeded!"}</div>
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}44` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Year to Date</div>
                <div style={{ color: T.cyan, fontWeight: 700, fontSize: 12 }}>GHS {ytdRevenue.toLocaleString()} <span style={{ color: T.textMuted, fontWeight: 400 }}>({ytdTargetPct}%)</span></div>
              </div>
              <div style={{ height: 4, background: T.border + "44", borderRadius: 2 }}>
                <div style={{ height: "100%", width: ytdTargetPct + "%", background: T.blue, borderRadius: 2 }} />
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
        {/* Pipeline by Stage */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Pipeline by Stage</div>
          {["new","contacted","qualified","proposal","won","lost"].map(s => {
            const count = opportunities.filter(l => l.status === s).length;
            const val = opportunities.filter(l => l.status === s).reduce((a, l) => a + (l.value || 0), 0);
            if (!count) return null;
            const colors = { new: T.cyan, contacted: T.blue, qualified: T.amber, proposal: T.magenta, won: T.teal, lost: T.red };
            return (
              <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}44` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors[s], boxShadow: `0 0 5px ${colors[s]}` }} />
                  <div style={{ color: T.textPrimary, fontSize: 12, fontWeight: 600 }}>{s.charAt(0).toUpperCase() + s.slice(1)}</div>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ color: T.textMuted, fontSize: 11 }}>{count}</div>
                  <div style={{ color: colors[s], fontWeight: 800, fontSize: 12, minWidth: 90, textAlign: "right" }}>GHS {val.toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Business Spread */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Business Spread by Client</div>
          {Object.keys(clientSpread).length === 0 ? <div style={{ color: T.textMuted, fontSize: 13 }}>No won deals yet.</div>
          : Object.entries(clientSpread).sort((a,b) => b[1]-a[1]).map(([company, amount]) => (
            <div key={company} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ color: T.textPrimary, fontSize: 12, fontWeight: 600 }}>{company}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ color: T.textMuted, fontSize: 10 }}>{totalRevenue ? Math.round((amount / totalRevenue) * 100) : 0}%</div>
                  <div style={{ color: T.gold, fontWeight: 800, fontSize: 12 }}>GHS {amount.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ height: 3, background: T.border + "44", borderRadius: 2 }}>
                <div style={{ height: "100%", width: (totalRevenue ? Math.round((amount / totalRevenue) * 100) : 0) + "%", background: `linear-gradient(90deg, ${T.cyan}, ${T.teal})`, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── FINANCE DASHBOARD ────────────────────────────────────────────────────────

const FinanceManagerDashboard = ({ user, onTab }) => {
  const [vouchers, setVouchers] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [pettyCash, setPettyCash] = useState(null);
  const [dailyBalances, setDailyBalances] = useState([]);
  const [clientInvoices, setClientInvoices] = useState([]);
  const [vendorInvoices, setVendorInvoices] = useState([]);
  const [pos, setPOs] = useState([]);
  const [events, setEvents] = useState([]);

  const load = async () => {
    const [v, est, pc, db, ci, vi, po, ev] = await Promise.all([
      supabase.from('payment_vouchers').select('*').order('created_at', { ascending: false }),
      supabase.from('estimates').select('*').order('created_at', { ascending: false }),
      supabase.from('petty_cash').select('*').limit(1).single(),
      supabase.from('daily_balances').select('*').order('report_date', { ascending: false }).limit(1),
      supabase.from('client_invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('vendor_invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*').order('event_date', { ascending: true }),
    ]);
    setVouchers(v.data || []);
    setEstimates(est.data || []);
    setPettyCash(pc.data || null);
    setDailyBalances(db.data || []);
    setClientInvoices(ci.data || []);
    setVendorInvoices(vi.data || []);
    setPOs(po.data || []);
    setEvents(ev.data || []);
  };

  useEffect(() => { load(); }, []);

  const now = new Date();
  const pendingVouchers = vouchers.filter(v => v.status === 'pending_approval');
  const approvedVouchers = vouchers.filter(v => v.status === 'approved');
  const paidVouchers = vouchers.filter(v => v.status === 'paid');
  const totalInflows = clientInvoices.reduce((s,i) => s + (i.amount||0), 0);
  const totalPaidOut = paidVouchers.reduce((s,v) => s + (v.amount||0), 0);
  const pendingVendorInvoices = vendorInvoices.filter(i => i.status !== 'paid');
  const pcBalance = pettyCash?.float_balance ?? pettyCash?.total_float ?? 200;
  const pcTotal = pettyCash?.total_float || 200;
  const pcPct = pcTotal > 0 ? Math.round((pcBalance/pcTotal)*100) : 100;
  const todayBalance = dailyBalances[0];
  const upcomingEvents = events.filter(e => e.event_date && new Date(e.event_date) >= now).slice(0,3);
  const grossProfit = totalInflows - totalPaidOut;

  return (
    <div style={{ animation: 'fadeUp 0.35s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Finance</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800 }}>Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      {/* Action alerts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {approvedVouchers.length > 0 && (
          <div onClick={() => onTab('finance')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: T.teal+'15', border: `1px solid ${T.teal}40`, borderRadius: 20, cursor: 'pointer' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.teal, boxShadow: `0 0 8px ${T.teal}` }} />
            <span style={{ color: T.teal, fontSize: 11, fontWeight: 700 }}>{approvedVouchers.length} voucher{approvedVouchers.length>1?'s':''} approved — ready to pay →</span>
          </div>
        )}
        {pendingVouchers.length > 0 && (
          <div onClick={() => onTab('finance')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: T.amber+'15', border: `1px solid ${T.amber}40`, borderRadius: 20, cursor: 'pointer' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.amber, boxShadow: `0 0 8px ${T.amber}` }} />
            <span style={{ color: T.amber, fontSize: 11, fontWeight: 700 }}>{pendingVouchers.length} voucher{pendingVouchers.length>1?'s':''} awaiting CEO approval →</span>
          </div>
        )}
        {pendingVendorInvoices.length > 0 && (
          <div onClick={() => onTab('vendor-invoices')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: T.cyan+'15', border: `1px solid ${T.cyan}40`, borderRadius: 20, cursor: 'pointer' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.cyan, boxShadow: `0 0 8px ${T.cyan}` }} />
            <span style={{ color: T.cyan, fontSize: 11, fontWeight: 700 }}>{pendingVendorInvoices.length} vendor invoice{pendingVendorInvoices.length>1?'s':''} pending review →</span>
          </div>
        )}
        {pcPct < 10 && (
          <div onClick={() => onTab('finance')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: T.red+'15', border: `1px solid ${T.red}40`, borderRadius: 20, cursor: 'pointer' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.red }} />
            <span style={{ color: T.red, fontSize: 11, fontWeight: 700 }}>Petty cash float below 10% — replenishment required →</span>
          </div>
        )}
        {!todayBalance && (
          <div onClick={() => onTab('finance')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: T.border+'80', border: `1px solid ${T.border}`, borderRadius: 20, cursor: 'pointer' }}>
            <span style={{ color: T.textMuted, fontSize: 11, fontWeight: 700 }}>📊 Daily balance report not prepared yet →</span>
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Inflows', value: `GHS ${totalInflows.toLocaleString()}`, sub: `${clientInvoices.length} client invoices`, color: '#10B981' },
          { label: 'Total Paid Out', value: `GHS ${totalPaidOut.toLocaleString()}`, sub: `${paidVouchers.length} vouchers paid`, color: T.red },
          { label: 'Gross Position', value: `GHS ${Math.abs(grossProfit).toLocaleString()}`, sub: grossProfit >= 0 ? 'Net positive' : 'Net negative', color: grossProfit >= 0 ? T.teal : T.red },
          { label: 'Petty Cash Float', value: `GHS ${pcBalance.toLocaleString()}`, sub: `${pcPct}% remaining`, color: pcPct < 10 ? T.red : T.cyan },
        ].map((k,i) => (
          <div key={i} style={{ padding: '16px 18px', background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${k.color}`, borderRadius: 12 }}>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ color: k.color, fontSize: 22, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Voucher status */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>Payment Vouchers</div>
            <button onClick={() => onTab('finance')} style={{ background: 'none', border: `1px solid ${T.border}`, color: T.textMuted, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Manage →</button>
          </div>
          {[
            ['Pending Approval', pendingVouchers.length, T.amber],
            ['Approved — To Pay', approvedVouchers.length, T.teal],
            ['Paid', paidVouchers.length, '#10B981'],
            ['Total Vouchers', vouchers.length, T.cyan],
          ].map(([label, count, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.border}33` }}>
              <span style={{ color: T.textSecondary, fontSize: 12 }}>{label}</span>
              <span style={{ color, fontWeight: 800, fontSize: 14 }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Purchase Orders */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>Purchase Orders</div>
            <button onClick={() => onTab('purchase-orders')} style={{ background: 'none', border: `1px solid ${T.border}`, color: T.textMuted, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>View →</button>
          </div>
          {pos.slice(0,4).map((po,i) => (
            <div key={po.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < 3 ? `1px solid ${T.border}33` : 'none' }}>
              <div>
                <div style={{ color: T.textPrimary, fontWeight: 600, fontSize: 12 }}>{po.internal_po_number || po.vendor_name}</div>
                <div style={{ color: T.textMuted, fontSize: 10 }}>{po.event_name}</div>
              </div>
              <span style={{ color: T.cyan, fontWeight: 700, fontSize: 12 }}>GHS {(po.amount||0).toLocaleString()}</span>
            </div>
          ))}
          {pos.length === 0 && <div style={{ color: T.textMuted, fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No purchase orders yet</div>}
        </div>
      </div>

      {/* Today's balance + upcoming events */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Daily balance */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>Today's Balance</div>
            <button onClick={() => onTab('finance')} style={{ background: 'none', border: `1px solid ${T.border}`, color: T.textMuted, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>Report →</button>
          </div>
          {todayBalance ? (
            [
              ['Opening Balance', todayBalance.opening_balance, T.textMuted],
              ['Actual Inflows', todayBalance.actual_inflows, '#10B981'],
              ['Actual Payments', todayBalance.actual_payments, T.red],
              ['Closing Balance', todayBalance.closing_balance, todayBalance.closing_balance >= 0 ? T.teal : T.red],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: label !== 'Closing Balance' ? `1px solid ${T.border}33` : 'none' }}>
                <span style={{ color: T.textSecondary, fontSize: 12 }}>{label}</span>
                <span style={{ color, fontWeight: label === 'Closing Balance' ? 900 : 600, fontSize: 13 }}>GHS {(val||0).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 10 }}>No daily balance prepared today</div>
              <button onClick={() => onTab('finance')} style={{ background: T.cyan+'15', border: `1px solid ${T.cyan}30`, color: T.cyan, padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>Prepare Now →</button>
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Upcoming Events</div>
          {upcomingEvents.length > 0 ? upcomingEvents.map((ev,i) => {
            const days = Math.ceil((new Date(ev.event_date) - now) / (1000*60*60*24));
            const color = days <= 7 ? T.red : days <= 30 ? T.amber : T.teal;
            return (
              <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < upcomingEvents.length-1 ? `1px solid ${T.border}33` : 'none' }}>
                <div>
                  <div style={{ color: T.textPrimary, fontWeight: 600, fontSize: 12 }}>{ev.name}</div>
                  <div style={{ color: T.textMuted, fontSize: 10 }}>{ev.client}</div>
                </div>
                <div style={{ color, fontWeight: 800, fontSize: 12 }}>{days}d</div>
              </div>
            );
          }) : <div style={{ color: T.textMuted, fontSize: 12, textAlign: 'center', padding: '16px 0' }}>No upcoming events</div>}
        </div>
      </div>
    </div>
  );
};


const FinanceDashboard = ({ user, onTab }) => {
  const [financeTab, setFinanceTab] = useState("overview");
  const [vouchers, setVouchers] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [pettyCash, setPettyCash] = useState(null);
  const [pettyCashVouchers, setPettyCashVouchers] = useState([]);
  const [dailyBalances, setDailyBalances] = useState([]);
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [pos, setPOs] = useState([]);
  const [clientInvoices, setClientInvoices] = useState([]);
  const [vendorInvoices, setVendorInvoices] = useState([]);
  const [saving, setSaving] = useState(false);

  // Voucher form
  const [voucherModal, setVoucherModal] = useState(null);
  const [vForm, setVForm] = useState({ payment_type: 'project', payee: '', description: '', amount: '', currency: 'GHS', project_id: '', event_name: '', invoice_ref: '', department: '', welfare_type: '', admin_type: '', statutory_type: '', due_date: '', notes: '' });

  // Estimate form
  const [estimateModal, setEstimateModal] = useState(null);
  const [eForm, setEForm] = useState({ client_name: '', project_id: '', event_name: '', line_items: [{ description: '', qty: 1, unit_price: '' }], tax_pct: 0, notes: '' });

  // Petty cash voucher form
  const [pcModal, setPcModal] = useState(false);
  const [pcForm, setPcForm] = useState({ payee: '', purpose: '', amount: '' });

  // Daily balance form
  const [dbModal, setDbModal] = useState(false);
  const [dbForm, setDbForm] = useState({ report_date: new Date().toISOString().slice(0,10), opening_balance: '', expected_inflows: '', expected_expenditure: '', actual_inflows: '', actual_payments: '', notes: '' });

  const canApprove = ['CEO', 'Country Manager'].includes(user?.role);
  const isFinance = ['Finance Manager', 'CEO'].includes(user?.role);
  const [financeLoading, setFinanceLoading] = useState(true);

  const load = async () => {
    setFinanceLoading(true);
    const [v, est, pc, pcv, db, ev, cl, po, ci, vi] = await Promise.all([
      supabase.from('payment_vouchers').select('*').order('created_at', { ascending: false }),
      supabase.from('estimates').select('*').order('created_at', { ascending: false }),
      supabase.from('petty_cash').select('*').limit(1).single(),
      supabase.from('petty_cash_vouchers').select('*').order('created_at', { ascending: false }),
      supabase.from('daily_balances').select('*').order('report_date', { ascending: false }),
      supabase.from('projects').select('*').order('name'),
      supabase.from('profiles').select('*').eq('role', 'Client'),
      supabase.from('purchase_orders').select('*'),
      supabase.from('client_invoices').select('*'),
      supabase.from('vendor_invoices').select('*'),
    ]);
    setVouchers(v.data || []);
    setEstimates(est.data || []);
    setPettyCash(pc.data || null);
    setPettyCashVouchers(pcv.data || []);
    setDailyBalances(db.data || []);
    setEvents(ev.data || []);
    setClients(cl.data || []);
    setPOs(po.data || []);
    setClientInvoices(ci.data || []);
    setVendorInvoices(vi.data || []);
    setFinanceLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Auto-generate voucher number
  const genVoucherNumber = (type) => {
    const prefixes = { project: 'PV', cheque: 'CHQ', petty_cash: 'PC', staff_welfare: 'SW', administrative: 'ADM', statutory: 'STAT' };
    const prefix = prefixes[type] || 'PV';
    const year = new Date().getFullYear().toString().slice(-2);
    const count = vouchers.filter(v => v.payment_type === type).length + 1;
    return `${prefix}/${year}/${String(count).padStart(3,'0')}`;
  };

  const genEstimateNumber = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    return `EST/${year}/${String(estimates.length + 1).padStart(3,'0')}`;
  };

  // Save voucher
  const saveVoucher = async () => {
    if (!vForm.payee || !vForm.amount) { alert('Payee and amount are required.'); return; }
    setSaving(true);
    const voucherNumber = genVoucherNumber(vForm.payment_type);
    await supabase.from('payment_vouchers').insert({
      ...vForm,
      voucher_number: voucherNumber,
      amount: parseFloat(vForm.amount) || 0,
      raised_by: user.id,
      status: 'pending_approval',
    });
    // Notify CEO for approval
    const { data: ceos } = await supabase.from('profiles').select('id, email, name').eq('role', 'CEO');
    for (const ceo of ceos || []) {
      await supabase.from('notifications').insert({ user_id: ceo.id, title: 'Payment Voucher Raised', message: `${user.name} raised voucher ${voucherNumber} for GHS ${parseFloat(vForm.amount).toLocaleString()} — ${vForm.description}`, type: 'rff' });
      if (ceo.email) await sendEmail(ceo.email, `Payment Voucher — ${voucherNumber}`, notifEmailHtml({ name: ceo.name, title: 'Payment Voucher Raised', message: `Finance Manager raised voucher <strong>${voucherNumber}</strong> for <strong>GHS ${parseFloat(vForm.amount).toLocaleString()}</strong>.<br><br>Payee: ${vForm.payee}<br>Description: ${vForm.description}<br>Type: ${vForm.payment_type}`, actionUrl: 'https://workroom.stretchfield.com', actionLabel: 'Review Voucher' }));
    }
    setSaving(false);
    setVoucherModal(null);
    setVForm({ payment_type: 'project', payee: '', description: '', amount: '', currency: 'GHS', project_id: '', event_name: '', invoice_ref: '', department: '', welfare_type: '', admin_type: '', statutory_type: '', due_date: '', notes: '' });
    load();
  };

  // Approve voucher (CEO)
  const approveVoucher = async (v) => {
    await supabase.from('payment_vouchers').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('id', v.id);
    // Notify Finance Manager
    const { data: fms } = await supabase.from('profiles').select('id, email, name').eq('role', 'Finance Manager');
    for (const fm of fms || []) {
      await supabase.from('notifications').insert({ user_id: fm.id, title: 'Voucher Approved', message: `Voucher ${v.voucher_number} has been approved. Proceed with payment.`, type: 'rff' });
      if (fm.email) await sendEmail(fm.email, `Voucher Approved — ${v.voucher_number}`, notifEmailHtml({ name: fm.name, title: 'Voucher Approved — Action Required', message: `Voucher <strong>${v.voucher_number}</strong> for <strong>GHS ${(v.amount||0).toLocaleString()}</strong> has been approved by CEO. Please proceed with payment within 3 working days.`, actionUrl: 'https://workroom.stretchfield.com', actionLabel: 'View Voucher' }));
    }
    load();
  };

  // Mark voucher paid
  const markPaid = async (v) => {
    await supabase.from('payment_vouchers').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', v.id);
    load();
  };

  // Reject voucher
  const rejectVoucher = async (v) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    await supabase.from('payment_vouchers').update({ status: 'rejected', notes: (v.notes||'') + ' | Rejected: ' + reason }).eq('id', v.id);
    load();
  };

  // Save estimate
  const saveEstimate = async () => {
    if (!eForm.client_name) { alert('Client name is required.'); return; }
    setSaving(true);
    const lineItems = eForm.line_items.filter(l => l.description && l.unit_price);
    const subtotal = lineItems.reduce((s,l) => s + (parseFloat(l.unit_price)||0) * (parseInt(l.qty)||1), 0);
    const tax = subtotal * ((parseFloat(eForm.tax_pct)||0) / 100);
    const total = subtotal + tax;
    await supabase.from('estimates').insert({
      estimate_number: genEstimateNumber(),
      client_name: eForm.client_name,
      project_id: eForm.project_id || null,
      event_name: eForm.event_name,
      line_items: lineItems,
      subtotal, tax_pct: parseFloat(eForm.tax_pct)||0,
      total, notes: eForm.notes,
      status: 'draft',
      created_by: user.id,
    });
    setSaving(false);
    setEstimateModal(null);
    setEForm({ client_name: '', project_id: '', event_name: '', line_items: [{ description: '', qty: 1, unit_price: '' }], tax_pct: 0, notes: '' });
    load();
  };

  // Convert estimate to invoice
  const convertEstimate = async (est) => {
    if (!window.confirm(`Convert estimate ${est.estimate_number} to invoice? This confirms client approval.`)) return;
    const invoiceNum = est.estimate_number.replace('EST/', 'INV/');
    const { data: inv } = await supabase.from('client_invoices').insert({
      title: invoiceNum,
      client_name: est.client_name,
      project_id: est.project_id,
      event_name: est.event_name,
      amount: est.total,
      status: 'pending',
      created_by: user.id,
    }).select().single();
    await supabase.from('estimates').update({ status: 'converted', converted_invoice_id: inv?.id }).eq('id', est.id);
    load();
  };

  // Petty cash voucher
  const savePCVoucher = async () => {
    if (!pcForm.payee || !pcForm.amount) { alert('Payee and amount required.'); return; }
    const amt = parseFloat(pcForm.amount);
    if (amt > 200) { alert('Single petty cash payment cannot exceed GHS 200. Use cheque payment for amounts over GHS 200.'); return; }
    setSaving(true);
    const year = new Date().getFullYear().toString().slice(-2);
    const count = pettyCashVouchers.length + 1;
    await supabase.from('petty_cash_vouchers').insert({
      voucher_number: `PC/${year}/${String(count).padStart(3,'0')}`,
      payee: pcForm.payee, purpose: pcForm.purpose, amount: amt,
      created_by: user.id, status: 'pending',
    });
    // Update petty cash float
    const currentBalance = pettyCash?.float_balance || 0;
    const newBalance = currentBalance - amt;
    const totalFloat = pettyCash?.total_float || 200;
    if (pettyCash) {
      await supabase.from('petty_cash').update({ float_balance: newBalance }).eq('id', pettyCash.id);
    } else {
      await supabase.from('petty_cash').insert({ float_balance: totalFloat - amt, total_float: totalFloat });
    }
    setSaving(false);
    setPcModal(false);
    setPcForm({ payee: '', purpose: '', amount: '' });
    load();
  };

  // Daily balance
  const saveDailyBalance = async () => {
    setSaving(true);
    const closing = (parseFloat(dbForm.opening_balance)||0) + (parseFloat(dbForm.actual_inflows)||0) - (parseFloat(dbForm.actual_payments)||0);
    await supabase.from('daily_balances').insert({
      ...dbForm,
      closing_balance: closing,
      prepared_by: user.id,
    });
    setSaving(false);
    setDbModal(false);
    setDbForm({ report_date: new Date().toISOString().slice(0,10), opening_balance: '', expected_inflows: '', expected_expenditure: '', actual_inflows: '', actual_payments: '', notes: '' });
    load();
  };

  // Metrics
  const pendingVouchers = vouchers.filter(v => v.status === 'pending_approval');
  const approvedVouchers = vouchers.filter(v => v.status === 'approved');
  const paidVouchers = vouchers.filter(v => v.status === 'paid');
  const totalVouchersPaid = paidVouchers.reduce((s,v) => s + (v.amount||0), 0);
  const totalPendingAmt = pendingVouchers.reduce((s,v) => s + (v.amount||0), 0);
  const totalClientInflows = clientInvoices.reduce((s,i) => s + (i.amount||0), 0);
  const pcBalance = pettyCash?.float_balance ?? pettyCash?.total_float ?? 200;
  const pcTotal = pettyCash?.total_float || 200;
  const pcPct = pcTotal > 0 ? Math.round((pcBalance / pcTotal) * 100) : 100;
  const todayBalance = dailyBalances[0];

  const inputStyle = { width: '100%', padding: '9px 12px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 };

  const statusBadge = (status) => {
    const map = { pending_approval: [T.amber, 'Pending Approval'], approved: [T.teal, 'Approved'], paid: ['#10B981', 'Paid'], rejected: [T.red, 'Rejected'], draft: [T.textMuted, 'Draft'] };
    const [color, label] = map[status] || [T.textMuted, status];
    return <span style={{ background: color+'18', color, border: `1px solid ${color}30`, borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 800 }}>{label}</span>;
  };

  const typeBadge = (type) => {
    const map = { project: [T.cyan, 'Project'], cheque: [T.blue, 'Cheque'], petty_cash: [T.teal, 'Petty Cash'], staff_welfare: ['#E879F9', 'Staff Welfare'], administrative: [T.amber, 'Administrative'], statutory: [T.red, 'Statutory'] };
    const [color, label] = map[type] || [T.textMuted, type];
    return <span style={{ background: color+'18', color, border: `1px solid ${color}30`, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{label}</span>;
  };

  return (
    <div style={{ animation: 'fadeUp 0.35s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Finance</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Finance Operations</h2>
            <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>
              Vouchers · Estimates · Petty Cash · Daily Balances
              {user?.role === 'Country Manager' && <span style={{ marginLeft: 8, background: userCountry === 'Nigeria' ? '#10B98120' : T.amber+'20', color: userCountry === 'Nigeria' ? '#10B981' : T.amber, borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>{userCountry === 'Nigeria' ? '🇳🇬' : '🇬🇭'} {userCountry} only</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {pendingVouchers.length > 0 && canApprove && (
              <div onClick={() => setFinanceTab('vouchers')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: T.amber+'15', border: `1px solid ${T.amber}40`, borderRadius: 20, cursor: 'pointer' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.amber, boxShadow: `0 0 8px ${T.amber}` }} />
                <span style={{ color: T.amber, fontSize: 11, fontWeight: 700 }}>{pendingVouchers.length} voucher{pendingVouchers.length>1?'s':''} pending</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: `1px solid ${T.border}` }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'vouchers', label: 'Payment Vouchers', badge: pendingVouchers.length },
          { id: 'estimates', label: 'Estimates & Invoices' },
          { id: 'petty-cash', label: 'Petty Cash' },
          { id: 'daily-balance', label: 'Daily Balance' },
          { id: 'reports', label: 'Reports' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFinanceTab(tab.id)} style={{ padding: '10px 16px', border: 'none', cursor: 'pointer', background: 'none', color: financeTab === tab.id ? T.textPrimary : T.textMuted, fontWeight: financeTab === tab.id ? 700 : 400, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: financeTab === tab.id ? `2px solid ${T.cyan}` : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s', position: 'relative' }}>
            {tab.label}
            {tab.badge > 0 && <span style={{ marginLeft: 5, background: T.amber, color: '#000', fontSize: 9, fontWeight: 900, borderRadius: 20, padding: '1px 5px' }}>{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {financeTab === 'overview' && (
        <div>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Inflows', value: `GHS ${totalClientInflows.toLocaleString()}`, sub: `${clientInvoices.length} client invoices`, color: '#10B981', icon: '📥' },
              { label: 'Total Paid Out', value: `GHS ${totalVouchersPaid.toLocaleString()}`, sub: `${paidVouchers.length} vouchers paid`, color: T.red, icon: '📤' },
              { label: 'Pending Approval', value: `GHS ${totalPendingAmt.toLocaleString()}`, sub: `${pendingVouchers.length} vouchers`, color: T.amber, icon: '⏳' },
              { label: 'Petty Cash Float', value: `GHS ${pcBalance.toLocaleString()}`, sub: `${pcPct}% remaining`, color: pcPct < 10 ? T.red : T.cyan, icon: '💵' },
            ].map((k,i) => (
              <div key={i} style={{ padding: '16px 18px', background: T.surface, border: `1px solid ${T.border}`, borderTop: `3px solid ${k.color}`, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{k.label}</div>
                    <div style={{ color: k.color, fontSize: 22, fontWeight: 900 }}>{k.value}</div>
                    <div style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>{k.sub}</div>
                  </div>
                  <span style={{ fontSize: 24, opacity: 0.4 }}>{k.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Today's balance */}
          {todayBalance && (
            <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 12, padding: '18px 22px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ color: T.cyan, fontWeight: 800, fontSize: 14 }}>📊 Daily Balance — {new Date(todayBalance.report_date+'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                <div style={{ color: T.textMuted, fontSize: 11 }}>Prepared by Finance</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
                {[
                  ['Opening Balance', todayBalance.opening_balance, T.textMuted],
                  ['Expected Inflows', todayBalance.expected_inflows, '#10B981'],
                  ['Expected Expenditure', todayBalance.expected_expenditure, T.amber],
                  ['Actual Inflows', todayBalance.actual_inflows, '#10B981'],
                  ['Closing Balance', todayBalance.closing_balance, todayBalance.closing_balance >= 0 ? T.teal : T.red],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ color, fontWeight: 900, fontSize: 18 }}>GHS {(val||0).toLocaleString()}</div>
                    <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 600, marginTop: 3 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Petty cash alert */}
          {pcPct < 10 && (
            <div style={{ background: T.red+'12', border: `1px solid ${T.red}30`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: T.red, fontWeight: 700, fontSize: 13 }}>
              ⚠ Petty cash float is below 10% (GHS {pcBalance.toLocaleString()} remaining). Replenishment required.
            </div>
          )}

          {/* Recent vouchers */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>Recent Payment Vouchers</div>
              <button onClick={() => setFinanceTab('vouchers')} style={{ background: 'none', border: `1px solid ${T.border}`, color: T.textMuted, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>View All</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {['Voucher #','Type','Payee','Amount','Status','Date'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vouchers.slice(0,6).map((v,i) => (
                  <tr key={v.id} style={{ borderBottom: i < 5 ? `1px solid ${T.border}44` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px', color: T.cyan, fontWeight: 700, fontSize: 12 }}>{v.voucher_number}</td>
                    <td style={{ padding: '10px 14px' }}>{typeBadge(v.payment_type)}</td>
                    <td style={{ padding: '10px 14px', color: T.textPrimary, fontSize: 12 }}>{v.payee}</td>
                    <td style={{ padding: '10px 14px', color: T.textPrimary, fontWeight: 700, fontSize: 12 }}>GHS {(v.amount||0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>{statusBadge(v.status)}</td>
                    <td style={{ padding: '10px 14px', color: T.textMuted, fontSize: 11 }}>{new Date(v.created_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
                {vouchers.length === 0 && <tr><td colSpan={6} style={{ padding: '30px 0', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>No vouchers yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PAYMENT VOUCHERS TAB ── */}
      {financeTab === 'vouchers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 16 }}>Payment Vouchers</div>
            {isFinance && <button onClick={() => setVoucherModal(true)} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: 'none', color: '#fff', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>+ Raise Voucher</button>}
          </div>

          {/* Filter tabs */}
          {['all','pending_approval','approved','paid','rejected'].map(s => {
            const count = s === 'all' ? vouchers.length : vouchers.filter(v => v.status === s).length;
            return <button key={s} onClick={() => {}} style={{ marginRight: 8, marginBottom: 16, padding: '5px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: 'none', color: T.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{s === 'all' ? 'All' : s.replace('_',' ').replace(/\w/g, l => l.toUpperCase())} ({count})</button>;
          })}

          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {['Voucher #','Type','Payee','Description','Amount','Status','Due','Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v,i) => (
                  <tr key={v.id} style={{ borderBottom: i < vouchers.length-1 ? `1px solid ${T.border}44` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 12px', color: T.cyan, fontWeight: 700, fontSize: 12 }}>{v.voucher_number}</td>
                    <td style={{ padding: '10px 12px' }}>{typeBadge(v.payment_type)}</td>
                    <td style={{ padding: '10px 12px', color: T.textPrimary, fontSize: 12, fontWeight: 600 }}>{v.payee}</td>
                    <td style={{ padding: '10px 12px', color: T.textMuted, fontSize: 11, maxWidth: 200 }}>{v.description}</td>
                    <td style={{ padding: '10px 12px', color: T.textPrimary, fontWeight: 800, fontSize: 13 }}>GHS {(v.amount||0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>{statusBadge(v.status)}</td>
                    <td style={{ padding: '10px 12px', color: v.due_date && new Date(v.due_date) < new Date() && v.status !== 'paid' ? T.red : T.textMuted, fontSize: 11 }}>{v.due_date || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {canApprove && v.status === 'pending_approval' && (
                          <>
                            <button onClick={() => approveVoucher(v)} style={{ background: '#10B98118', border: '1px solid #10B98130', color: '#10B981', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>✓ Approve</button>
                            <button onClick={() => rejectVoucher(v)} style={{ background: T.red+'18', border: `1px solid ${T.red}30`, color: T.red, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>✗</button>
                          </>
                        )}
                        {isFinance && v.status === 'approved' && (
                          <button onClick={() => markPaid(v)} style={{ background: T.cyan+'18', border: `1px solid ${T.cyan}30`, color: T.cyan, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>Mark Paid</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {vouchers.length === 0 && <tr><td colSpan={8} style={{ padding: '40px 0', textAlign: 'center', color: T.textMuted }}>No payment vouchers yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ESTIMATES & INVOICES TAB ── */}
      {financeTab === 'estimates' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 16 }}>Estimates & Invoices</div>
            {isFinance && <button onClick={() => setEstimateModal(true)} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: 'none', color: '#fff', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>+ New Estimate</button>}
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Estimates</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {['Estimate #','Client','Event','Total','Status','Action'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estimates.map((est,i) => (
                  <tr key={est.id} style={{ borderBottom: i < estimates.length-1 ? `1px solid ${T.border}44` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px', color: T.cyan, fontWeight: 700, fontSize: 12 }}>{est.estimate_number}</td>
                    <td style={{ padding: '10px 14px', color: T.textPrimary, fontSize: 12 }}>{est.client_name}</td>
                    <td style={{ padding: '10px 14px', color: T.textMuted, fontSize: 11 }}>{est.event_name || '—'}</td>
                    <td style={{ padding: '10px 14px', color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>GHS {(est.total||0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: est.status==='converted' ? '#10B98118' : est.status==='approved' ? T.teal+'18' : T.amber+'18', color: est.status==='converted' ? '#10B981' : est.status==='approved' ? T.teal : T.amber, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{est.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {est.status !== 'converted' && isFinance && (
                        <button onClick={() => convertEstimate(est)} style={{ background: T.teal+'18', border: `1px solid ${T.teal}30`, color: T.teal, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>→ Convert to Invoice</button>
                      )}
                      {est.status === 'converted' && <span style={{ color: T.textMuted, fontSize: 11 }}>✓ Converted</span>}
                    </td>
                  </tr>
                ))}
                {estimates.length === 0 && <tr><td colSpan={6} style={{ padding: '30px 0', textAlign: 'center', color: T.textMuted }}>No estimates yet</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Client Invoices */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Client Invoices (Statement of Claim)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {['Invoice','Client','Event','Amount','Status'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientInvoices.map((inv,i) => (
                  <tr key={inv.id} style={{ borderBottom: i < clientInvoices.length-1 ? `1px solid ${T.border}44` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px', color: T.cyan, fontWeight: 700, fontSize: 12 }}>{inv.title}</td>
                    <td style={{ padding: '10px 14px', color: T.textPrimary, fontSize: 12 }}>{inv.client_name || '—'}</td>
                    <td style={{ padding: '10px 14px', color: T.textMuted, fontSize: 11 }}>{inv.event_name || '—'}</td>
                    <td style={{ padding: '10px 14px', color: T.textPrimary, fontWeight: 700 }}>GHS {(inv.amount||0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ color: inv.status==='paid' ? '#10B981' : T.amber, fontWeight: 700, fontSize: 11 }}>{inv.status || 'pending'}</span></td>
                  </tr>
                ))}
                {clientInvoices.length === 0 && <tr><td colSpan={5} style={{ padding: '30px 0', textAlign: 'center', color: T.textMuted }}>No client invoices yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PETTY CASH TAB ── */}
      {financeTab === 'petty-cash' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 16 }}>Petty Cash</div>
            {isFinance && <button onClick={() => setPcModal(true)} style={{ background: `linear-gradient(135deg, ${T.teal}, ${T.cyan})`, border: 'none', color: '#fff', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>+ Petty Cash Voucher</button>}
          </div>

          {/* Float status */}
          <div style={{ background: T.surface, border: `1px solid ${pcPct < 10 ? T.red : T.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Current Float Balance</div>
                <div style={{ color: pcPct < 10 ? T.red : '#10B981', fontWeight: 900, fontSize: 36 }}>GHS {pcBalance.toLocaleString()}</div>
                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>of GHS {pcTotal.toLocaleString()} total float · {pcPct}% remaining</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 6 }}>Max single payment: <strong style={{ color: T.textPrimary }}>GHS 200</strong></div>
                <div style={{ color: T.textMuted, fontSize: 11 }}>Replenish trigger: <strong style={{ color: T.amber }}>at 90% exhaustion</strong></div>
                {pcPct < 10 && <div style={{ color: T.red, fontWeight: 700, fontSize: 12, marginTop: 8 }}>⚠ Replenishment required!</div>}
              </div>
            </div>
            <div style={{ height: 8, background: T.border+'44', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pcPct}%`, background: pcPct < 10 ? T.red : pcPct < 30 ? T.amber : '#10B981', borderRadius: 4, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Petty cash vouchers */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {['Voucher #','Payee','Purpose','Amount','Status','Date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pettyCashVouchers.map((v,i) => (
                  <tr key={v.id} style={{ borderBottom: i < pettyCashVouchers.length-1 ? `1px solid ${T.border}44` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px', color: T.teal, fontWeight: 700, fontSize: 12 }}>{v.voucher_number}</td>
                    <td style={{ padding: '10px 14px', color: T.textPrimary, fontSize: 12 }}>{v.payee}</td>
                    <td style={{ padding: '10px 14px', color: T.textMuted, fontSize: 11 }}>{v.purpose}</td>
                    <td style={{ padding: '10px 14px', color: T.textPrimary, fontWeight: 700 }}>GHS {(v.amount||0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ color: v.status==='approved' ? '#10B981' : T.amber, fontWeight: 700, fontSize: 11 }}>{v.status}</span></td>
                    <td style={{ padding: '10px 14px', color: T.textMuted, fontSize: 11 }}>{new Date(v.created_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
                {pettyCashVouchers.length === 0 && <tr><td colSpan={6} style={{ padding: '30px 0', textAlign: 'center', color: T.textMuted }}>No petty cash vouchers yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DAILY BALANCE TAB ── */}
      {financeTab === 'daily-balance' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 16 }}>Daily Balance Reports</div>
              <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Prepared each morning and sent to Director — previous payments, inflows, expected inflows and expenditure</div>
            </div>
            {isFinance && <button onClick={() => setDbModal(true)} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: 'none', color: '#fff', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>+ Today's Balance</button>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dailyBalances.map((db,i) => (
              <div key={db.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>{new Date(db.report_date+'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div style={{ color: db.closing_balance >= 0 ? '#10B981' : T.red, fontWeight: 900, fontSize: 18 }}>Closing: GHS {(db.closing_balance||0).toLocaleString()}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                  {[
                    ['Opening', db.opening_balance, T.textMuted],
                    ['Expected Inflows', db.expected_inflows, '#10B981'],
                    ['Expected Spend', db.expected_expenditure, T.amber],
                    ['Actual Inflows', db.actual_inflows, '#10B981'],
                    ['Actual Payments', db.actual_payments, T.red],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ textAlign: 'center', background: T.bg, borderRadius: 8, padding: '10px 8px' }}>
                      <div style={{ color, fontWeight: 800, fontSize: 16 }}>GHS {(val||0).toLocaleString()}</div>
                      <div style={{ color: T.textMuted, fontSize: 10, marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {db.notes && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 10, fontStyle: 'italic' }}>{db.notes}</div>}
              </div>
            ))}
            {dailyBalances.length === 0 && <div style={{ textAlign: 'center', padding: 40, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, color: T.textMuted }}>No daily balance reports yet. Finance Manager prepares one each morning.</div>}
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {financeTab === 'reports' && <FinanceReportsView user={user} />}

      {/* ════ MODALS ════ */}

      {/* Payment Voucher Modal */}
      {voucherModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setVoucherModal(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto', padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Raise Payment Voucher</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>All payments require a voucher. Amounts over GHS 200 require CEO authorization.</div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Payment Type *</label>
              <select value={vForm.payment_type} onChange={e => setVForm({...vForm, payment_type: e.target.value})} style={inputStyle}>
                <option value="project">Project Payment</option>
                <option value="cheque">Cheque Payment (&gt;GHS 200)</option>
                <option value="petty_cash">Petty Cash (≤GHS 200)</option>
                <option value="staff_welfare">Staff Welfare</option>
                <option value="administrative">Administrative</option>
                <option value="statutory">Statutory Payment</option>
              </select>
            </div>

            {vForm.payment_type === 'staff_welfare' && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Welfare Type</label>
                <select value={vForm.welfare_type} onChange={e => setVForm({...vForm, welfare_type: e.target.value})} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="loan">Staff Loan</option>
                  <option value="birthday">Birthday</option>
                  <option value="travel">Travel</option>
                  <option value="donation">Donation</option>
                </select>
              </div>
            )}

            {vForm.payment_type === 'administrative' && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Administrative Type</label>
                <select value={vForm.admin_type} onChange={e => setVForm({...vForm, admin_type: e.target.value})} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="internet">Internet Subscription</option>
                  <option value="telephone">Telephone</option>
                  <option value="stationery">Stationery & Toiletries</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            {vForm.payment_type === 'statutory' && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Statutory Type</label>
                <select value={vForm.statutory_type} onChange={e => setVForm({...vForm, statutory_type: e.target.value})} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="PAYE">PAYE</option>
                  <option value="SSNIT">SSNIT</option>
                  <option value="VAT">VAT</option>
                  <option value="self_assessment">Self Assessment</option>
                  <option value="withholding_tax">Withholding Tax</option>
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>Payee / Supplier *</label><input value={vForm.payee} onChange={e => setVForm({...vForm, payee: e.target.value})} style={inputStyle} placeholder="Who is being paid?" /></div>
              <div><label style={labelStyle}>Amount (GHS) *</label><input type="number" value={vForm.amount} onChange={e => setVForm({...vForm, amount: e.target.value})} style={inputStyle} placeholder="0.00" /></div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Description / Purpose</label>
              <input value={vForm.description} onChange={e => setVForm({...vForm, description: e.target.value})} style={inputStyle} placeholder="What is this payment for?" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Linked Event</label>
                <select value={vForm.project_id} onChange={e => { const ev = events.find(x => x.id === e.target.value); setVForm({...vForm, project_id: e.target.value, event_name: ev?.name||''}); }} style={inputStyle}>
                  <option value="">Select event (optional)...</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Invoice / PO Reference</label><input value={vForm.invoice_ref} onChange={e => setVForm({...vForm, invoice_ref: e.target.value})} style={inputStyle} placeholder="e.g. INV/ST/CS/26/001" /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Currency</label>
                <select value={vForm.currency} onChange={e => setVForm({...vForm, currency: e.target.value})} style={inputStyle}>
                  {['GHS','USD','EUR','GBP','NGN','KES'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Due Date (pay by)</label><input type="date" value={vForm.due_date} onChange={e => setVForm({...vForm, due_date: e.target.value})} style={inputStyle} /></div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={vForm.notes} onChange={e => setVForm({...vForm, notes: e.target.value})} rows={2} style={{...inputStyle, resize: 'vertical'}} placeholder="Additional notes or supporting document reference..." />
            </div>

            {parseFloat(vForm.amount) > 200 && vForm.payment_type !== 'petty_cash' && (
              <div style={{ background: T.amber+'12', border: `1px solid ${T.amber}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: T.amber, fontSize: 12 }}>
                ⚠ Amount exceeds GHS 200 — this voucher will require CEO authorization before payment.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveVoucher} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>{saving ? 'Saving...' : 'Raise Voucher'}</button>
              <button onClick={() => setVoucherModal(null)} style={{ background: 'none', border: `1px solid ${T.border}`, color: T.textMuted, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Estimate Modal */}
      {estimateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEstimateModal(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto', padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>New Estimate</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>Create an estimate. Once client approves, convert it to an invoice.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>Client Name *</label><input value={eForm.client_name} onChange={e => setEForm({...eForm, client_name: e.target.value})} style={inputStyle} placeholder="Client or company name" /></div>
              <div>
                <label style={labelStyle}>Linked Event</label>
                <select value={eForm.project_id} onChange={e => { const ev = events.find(x => x.id === e.target.value); setEForm({...eForm, project_id: e.target.value, event_name: ev?.name||''}); }} style={inputStyle}>
                  <option value="">Select event (optional)...</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ color: T.cyan, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${T.cyan}30` }}>Line Items</div>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 28px', gap: 8, marginBottom: 6 }}>
                {['Description','Qty','Unit Price',''].map(h => <div key={h} style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{h}</div>)}
              </div>
              {eForm.line_items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 28px', gap: 8, marginBottom: 8 }}>
                  <input value={item.description} onChange={e => { const l = [...eForm.line_items]; l[idx].description = e.target.value; setEForm({...eForm, line_items: l}); }} style={inputStyle} placeholder="Service description" />
                  <input type="number" value={item.qty} onChange={e => { const l = [...eForm.line_items]; l[idx].qty = e.target.value; setEForm({...eForm, line_items: l}); }} style={inputStyle} placeholder="1" />
                  <input type="number" value={item.unit_price} onChange={e => { const l = [...eForm.line_items]; l[idx].unit_price = e.target.value; setEForm({...eForm, line_items: l}); }} style={inputStyle} placeholder="0.00" />
                  <button onClick={() => setEForm({...eForm, line_items: eForm.line_items.filter((_,i) => i!==idx)})} style={{ background: T.red+'18', border: `1px solid ${T.red}30`, color: T.red, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>×</button>
                </div>
              ))}
              <button onClick={() => setEForm({...eForm, line_items: [...eForm.line_items, { description: '', qty: 1, unit_price: '' }]})} style={{ background: 'none', border: `1px dashed ${T.border}`, color: T.textMuted, padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 12, width: '100%' }}>+ Add Line Item</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>Tax / VAT %</label><input type="number" value={eForm.tax_pct} onChange={e => setEForm({...eForm, tax_pct: e.target.value})} style={inputStyle} placeholder="0" /></div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {(() => { const sub = eForm.line_items.reduce((s,l) => s+(parseFloat(l.unit_price)||0)*(parseInt(l.qty)||1),0); const tax = sub*((parseFloat(eForm.tax_pct)||0)/100); return <div style={{ background: T.bg, border: `1px solid ${T.cyan}30`, borderRadius: 8, padding: '10px 14px' }}><div style={{ color: T.textMuted, fontSize: 11 }}>Subtotal: GHS {sub.toLocaleString()}</div><div style={{ color: T.textMuted, fontSize: 11 }}>Tax: GHS {tax.toLocaleString()}</div><div style={{ color: T.cyan, fontWeight: 900, fontSize: 16 }}>Total: GHS {(sub+tax).toLocaleString()}</div></div>; })()}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={eForm.notes} onChange={e => setEForm({...eForm, notes: e.target.value})} rows={2} style={{...inputStyle, resize: 'vertical'}} placeholder="Terms, conditions or notes..." />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveEstimate} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>{saving ? 'Saving...' : 'Save Estimate'}</button>
              <button onClick={() => setEstimateModal(null)} style={{ background: 'none', border: `1px solid ${T.border}`, color: T.textMuted, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Petty Cash Voucher Modal */}
      {pcModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setPcModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.teal}30`, borderRadius: 16, width: '100%', maxWidth: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Petty Cash Voucher</div>
            <div style={{ color: T.amber, fontSize: 12, marginBottom: 20 }}>⚠ Maximum single payment: GHS 200. Use cheque for larger amounts.</div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Payee *</label><input value={pcForm.payee} onChange={e => setPcForm({...pcForm, payee: e.target.value})} style={inputStyle} placeholder="Who is being paid?" /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Purpose</label><input value={pcForm.purpose} onChange={e => setPcForm({...pcForm, purpose: e.target.value})} style={inputStyle} placeholder="What is this for?" /></div>
            <div style={{ marginBottom: 20 }}><label style={labelStyle}>Amount (GHS) *</label><input type="number" max="200" value={pcForm.amount} onChange={e => setPcForm({...pcForm, amount: e.target.value})} style={inputStyle} placeholder="Max GHS 200" /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={savePCVoucher} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.teal}, ${T.cyan})`, border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>{saving ? 'Saving...' : 'Submit Voucher'}</button>
              <button onClick={() => setPcModal(false)} style={{ background: 'none', border: `1px solid ${T.border}`, color: T.textMuted, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Balance Modal */}
      {dbModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDbModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: '100%', maxWidth: 560, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Daily Balance Report</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>Prepared each morning and sent to the Director. Shows previous payments, inflows and expected transactions.</div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Report Date</label><input type="date" value={dbForm.report_date} onChange={e => setDbForm({...dbForm, report_date: e.target.value})} style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>Opening Balance (GHS)</label><input type="number" value={dbForm.opening_balance} onChange={e => setDbForm({...dbForm, opening_balance: e.target.value})} style={inputStyle} placeholder="0.00" /></div>
              <div><label style={labelStyle}>Expected Inflows (GHS)</label><input type="number" value={dbForm.expected_inflows} onChange={e => setDbForm({...dbForm, expected_inflows: e.target.value})} style={inputStyle} placeholder="0.00" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div><label style={labelStyle}>Expected Expenditure (GHS)</label><input type="number" value={dbForm.expected_expenditure} onChange={e => setDbForm({...dbForm, expected_expenditure: e.target.value})} style={inputStyle} placeholder="0.00" /></div>
              <div><label style={labelStyle}>Actual Inflows (GHS)</label><input type="number" value={dbForm.actual_inflows} onChange={e => setDbForm({...dbForm, actual_inflows: e.target.value})} style={inputStyle} placeholder="0.00" /></div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Actual Payments Made (GHS)</label><input type="number" value={dbForm.actual_payments} onChange={e => setDbForm({...dbForm, actual_payments: e.target.value})} style={inputStyle} placeholder="0.00" /></div>
            {(dbForm.opening_balance || dbForm.actual_inflows || dbForm.actual_payments) && (
              <div style={{ background: T.bg, border: `1px solid ${T.cyan}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ color: T.cyan, fontWeight: 900, fontSize: 16 }}>Closing Balance: GHS {((parseFloat(dbForm.opening_balance)||0) + (parseFloat(dbForm.actual_inflows)||0) - (parseFloat(dbForm.actual_payments)||0)).toLocaleString()}</div>
              </div>
            )}
            <div style={{ marginBottom: 20 }}><label style={labelStyle}>Notes</label><textarea value={dbForm.notes} onChange={e => setDbForm({...dbForm, notes: e.target.value})} rows={2} style={{...inputStyle, resize: 'vertical'}} placeholder="Any notable transactions or observations..." /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveDailyBalance} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: 'none', color: '#fff', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>{saving ? 'Saving...' : 'Save Report'}</button>
              <button onClick={() => setDbModal(false)} style={{ background: 'none', border: `1px solid ${T.border}`, color: T.textMuted, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FinanceReportsView = ({ user }) => {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [opportunities, setOpportunitys] = useState([]);
  const [period, setPeriod] = useState("mtd");

  useEffect(() => {
    Promise.all([
      supabase.from("invoices").select("*"),
      supabase.from("expenses").select("*"),
      supabase.from("opportunities").select("*").eq("status", "won"),
    ]).then(([inv, exp, l]) => {
      setInvoices(inv.data || []);
      setExpenses(exp.data || []);
      setOpportunitys(l.data || []);
    });
  }, []);

  const now = new Date();
  const ranges = {
    mtd: new Date(now.getFullYear(), now.getMonth(), 1),
    ytd: new Date(now.getFullYear(), 0, 1),
    all: new Date(0),
  };
  const start = ranges[period];

  const periodRevenue = opportunities.filter(l => l.closed_date && new Date(l.closed_date) >= start).reduce((a, l) => a + (l.value || 0), 0);
  const periodExpenses = expenses.filter(e => e.date && new Date(e.date) >= start).reduce((a, e) => a + (e.amount || 0), 0);
  const periodInvoiced = invoices.filter(i => i.created_at && new Date(i.created_at) >= start).reduce((a, i) => a + (i.amount || 0), 0);
  const periodPaid = invoices.filter(i => i.status === "paid" && i.created_at && new Date(i.created_at) >= start).reduce((a, i) => a + (i.amount || 0), 0);
  const grossProfit = periodRevenue - periodExpenses;
  const margin = periodRevenue ? Math.round((grossProfit / periodRevenue) * 100) : 0;

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
    const label = d.toLocaleString("default", { month: "short" });
    const rev = opportunities.filter(l => l.closed_date && new Date(l.closed_date) >= d && new Date(l.closed_date) < next).reduce((a, l) => a + (l.value || 0), 0);
    const exp = expenses.filter(e => e.date && new Date(e.date) >= d && new Date(e.date) < next).reduce((a, e) => a + (e.amount || 0), 0);
    return { label, rev, exp, profit: rev - exp };
  });

  const maxVal = Math.max(...monthlyData.map(m => Math.max(m.rev, m.exp)), 1);

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Finance</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Financial Reports</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>P&L and cash flow analysis</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["mtd","MTD"],["ytd","YTD"],["all","All Time"]].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)} style={{ padding: "6px 16px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", border: `1px solid ${period === val ? T.cyan : T.border}`, background: period === val ? T.cyan + "20" : "none", color: period === val ? T.cyan : T.textMuted, transition: "all 0.15s" }}>{label}</button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Revenue", value: "GHS " + periodRevenue.toLocaleString(), color: T.teal, grad: `linear-gradient(135deg, ${T.teal}20, ${T.teal}08)` },
          { label: "Gross Profit", value: "GHS " + grossProfit.toLocaleString(), sub: margin + "% margin", color: grossProfit >= 0 ? T.cyan : T.red, grad: `linear-gradient(135deg, ${grossProfit >= 0 ? T.cyan : T.red}20, transparent)` },
          { label: "Total Expenses", value: "GHS " + periodExpenses.toLocaleString(), color: T.amber, grad: `linear-gradient(135deg, ${T.amber}20, ${T.amber}08)` },
        ].map((k, i) => (
          <div key={i} style={{ padding: "18px 20px", background: k.grad, border: `1px solid ${k.color}30`, borderRadius: 12 }}>
            <div style={{ color: k.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{k.label}</div>
            <div style={{ color: T.textPrimary, fontSize: 20, fontWeight: 900 }}>{k.value}</div>
            {k.sub && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 3 }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* P&L Summary */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>P&L Summary</div>
        {[
          ["Revenue (Won Deals)", periodRevenue, T.teal],
          ["Total Expenses", periodExpenses, T.amber],
          ["Total Invoiced", periodInvoiced, T.blue],
          ["Invoices Paid", periodPaid, T.cyan],
        ].map(([label, val, color]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.border}44` }}>
            <div style={{ color: T.textMuted, fontSize: 13 }}>{label}</div>
            <div style={{ color, fontWeight: 700, fontSize: 15 }}>GHS {val.toLocaleString()}</div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>Gross Profit</div>
          <div style={{ color: grossProfit >= 0 ? T.teal : "#F43F5E", fontWeight: 800, fontSize: 18 }}>GHS {grossProfit.toLocaleString()}</div>
        </div>
        <div style={{ padding: "12px 16px", background: (grossProfit >= 0 ? T.teal : T.red) + "15", borderRadius: 8, border: `1px solid ${(grossProfit >= 0 ? T.teal : T.red)}33` }}>
          <div style={{ color: grossProfit >= 0 ? T.teal : T.red, fontWeight: 700, fontSize: 13 }}>Profit Margin: {margin}%</div>
        </div>
      </div>

      {/* 6-Month Chart */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>6-Month Revenue vs Expenses</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160, padding: "10px 0" }}>
          {monthlyData.map(m => (
            <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", display: "flex", gap: 3, alignItems: "flex-end", height: 120 }}>
                <div style={{ flex: 1, background: T.teal + "80", borderRadius: "3px 3px 0 0", height: Math.max(4, (m.rev / maxVal) * 120) + "px", transition: "height 0.3s" }} title={"Revenue: GHS " + m.rev.toLocaleString()} />
                <div style={{ flex: 1, background: T.amber + "80", borderRadius: "3px 3px 0 0", height: Math.max(4, (m.exp / maxVal) * 120) + "px", transition: "height 0.3s" }} title={"Expenses: GHS " + m.exp.toLocaleString()} />
              </div>
              <div style={{ color: T.textMuted, fontSize: 11, textAlign: "center" }}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: T.teal + "80" }} /><span style={{ color: T.textMuted, fontSize: 12 }}>Revenue</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: T.amber + "80" }} /><span style={{ color: T.textMuted, fontSize: 12 }}>Expenses</span></div>
        </div>
      </div>
    </div>
  );
};


// ─── VENDOR SCORECARD ─────────────────────────────────────────────────────────
const SCORECARD_CATEGORIES = [
  {
    key: "pricing", label: "1. Pricing & Cost Efficiency", weight: 0.15,
    fields: [
      { key: "pricing_competitiveness", label: "Competitiveness" },
      { key: "pricing_clarity", label: "Clarity of Pricing" },
      { key: "pricing_value", label: "Value-for-Money" },
      { key: "pricing_payment_flexibility", label: "Payment Flexibility & Terms" },
    ]
  },
  {
    key: "quality", label: "2. Quality of Service/Product", weight: 0.20,
    fields: [
      { key: "quality_product", label: "Product/Service Quality" },
      { key: "quality_execution", label: "Execution Excellence" },
      { key: "quality_post_support", label: "Post-Service Support" },
      { key: "quality_consistency", label: "Consistency" },
    ]
  },
  {
    key: "reliability", label: "3. Reliability & Consistency", weight: 0.15,
    fields: [
      { key: "reliability_delivery", label: "Delivery Accuracy" },
      { key: "reliability_punctuality", label: "Punctuality" },
      { key: "reliability_dependability", label: "Dependability" },
      { key: "reliability_contingency", label: "Contingency Management" },
    ]
  },
  {
    key: "comms", label: "4. Customer Service & Communication", weight: 0.15,
    fields: [
      { key: "comms_responsiveness", label: "Responsiveness" },
      { key: "comms_clarity", label: "Clarity & Proactivity" },
      { key: "comms_problem_solving", label: "Problem-Solving" },
      { key: "comms_relationship", label: "Relationship Management" },
    ]
  },
  {
    key: "innovation", label: "5. Innovation & Value-Addition", weight: 0.10,
    fields: [
      { key: "innovation_creative", label: "Creative Solutions" },
      { key: "innovation_customization", label: "Customization Capabilities" },
      { key: "innovation_suggestions", label: "Suggestions for Improvement" },
      { key: "innovation_trends", label: "Trend Awareness" },
    ]
  },
  {
    key: "flexibility", label: "6. Flexibility & Adaptability", weight: 0.10,
    fields: [
      { key: "flexibility_adaptation", label: "Adaptation to Change" },
      { key: "flexibility_custom", label: "Custom Solutions" },
      { key: "flexibility_negotiation", label: "Negotiation Flexibility" },
      { key: "flexibility_client_centric", label: "Client-Centric Approach" },
    ]
  },
  {
    key: "sustainability", label: "7. Sustainability & Social Responsibility", weight: 0.10,
    fields: [
      { key: "sustainability_eco", label: "Eco-Friendliness" },
      { key: "sustainability_ethics", label: "Ethical Standards" },
      { key: "sustainability_community", label: "Community Engagement" },
      { key: "sustainability_certifications", label: "Certifications & Reporting" },
    ]
  },
  {
    key: "fee", label: "8. Fee Summary", weight: 0.05,
    fields: [
      { key: "fee_transparency", label: "Fee Transparency" },
      { key: "fee_vs_budget", label: "Fees vs Budget" },
      { key: "fee_hidden", label: "Hidden Charges" },
      { key: "fee_invoice_clarity", label: "Invoice Clarity" },
      { key: "fee_other", label: "Other Fees" },
    ]
  },
];

const getTier = (pct) => {
  if (pct >= 85) return { label: "Impressive", color: "#10B981", bg: "#10B98120", desc: "Exceeds expectations — Elite pick" };
  if (pct >= 70) return { label: "Very Good", color: "#06B6D4", bg: "#06B6D420", desc: "Reliable — Strong performer" };
  if (pct >= 50) return { label: "Good", color: "#F59E0B", bg: "#F59E0B20", desc: "Satisfactory — Use with caution" };
  return { label: "Poor", color: "#F43F5E", bg: "#F43F5E20", desc: "Below standard — Cannot engage" };
};

const calcScore = (scores) => {
  let total = 0;
  SCORECARD_CATEGORIES.forEach(cat => {
    const vals = cat.fields.map(f => parseFloat(scores[f.key] || 0)).filter(v => v > 0);
    if (vals.length > 0) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      total += avg * cat.weight;
    }
  });
  return Math.round((total / 5) * 100 * 10) / 10;
};

const VendorScorecardModal = ({ vendor, events, user, onClose, onSaved }) => {
  const initScores = {};
  SCORECARD_CATEGORIES.forEach(cat => cat.fields.forEach(f => { initScores[f.key] = 0; }));
  const [scores, setScores] = useState(initScores);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedCat, setExpandedCat] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState("");

  const selectedEvent = events.find(e => e.id === selectedEventId) || null;
  const liveScore = calcScore(scores);
  const tier = getTier(liveScore);

  const setScore = (key, val) => setScores(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!selectedEventId) { alert("Please select an event before saving."); return; }
    setSaving(true);
    const pct = calcScore(scores);
    const tierLabel = getTier(pct).label;
    const { error } = await supabase.from("vendor_scorecards").insert({
      vendor_id: vendor.id, vendor_name: vendor.name,
      project_id: selectedEvent?.id || null, event_name: selectedEvent?.name || "",
      ...scores, total_score: (pct / 20), total_pct: pct, tier: tierLabel,
      notes, scored_by: user.id,
    });
    if (!error) {
      // Update vendor profile with most recent score
      const { data: allScores } = await supabase.from("vendor_scorecards").select("total_pct, created_at").eq("vendor_id", vendor.id).order("created_at", { ascending: false });
      if (allScores && allScores.length > 0) {
        // Average last 2 scorecards
        const last2 = allScores.slice(0, 2);
        const avgScore = last2.reduce((sum, s) => sum + (s.total_pct || 0), 0) / last2.length;
        await supabase.from("profiles").update({
          vendor_score: Math.round(avgScore * 10) / 10,
          vendor_tier: getTier(avgScore).label,
          vendor_scorecard_count: allScores.length,
        }).eq("id", vendor.id);
      }
      onSaved();
      onClose();
    }
    setSaving(false);
  };

  const StarInput = ({ fieldKey }) => (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} onClick={() => setScore(fieldKey, s)} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 22, color: s <= scores[fieldKey] ? "#F59E0B" : T.border,
          padding: "2px", transition: "color 0.1s",
        }}>★</button>
      ))}
      {scores[fieldKey] > 0 && <span style={{ color: T.textMuted, fontSize: 11, alignSelf: "center", marginLeft: 4 }}>{scores[fieldKey]}/5</span>}
    </div>
  );

  return (
    <Modal title={"Scorecard — " + vendor.name} onClose={onClose}>
      {/* Event Selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Select Event to Score</div>
        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} style={{ width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid " + (selectedEventId ? T.cyan : T.border), borderRadius: 8, color: selectedEventId ? T.textPrimary : T.textMuted, fontSize: 13, fontFamily: "inherit" }}>
          <option value="">Select event...</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} — {ev.client || ""}</option>)}
        </select>
        {!selectedEventId && <div style={{ color: T.amber, fontSize: 11, marginTop: 6 }}>⚠ Please select an event to proceed</div>}
      </div>

      {/* Live Score */}
      <div style={{ padding: 16, background: tier.bg, border: "1px solid " + tier.color + "44", borderRadius: 10, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: tier.color, fontWeight: 800, fontSize: 28 }}>{liveScore}%</div>
          <div style={{ color: tier.color, fontWeight: 700, fontSize: 14 }}>{tier.label}</div>
          <div style={{ color: T.textMuted, fontSize: 12 }}>{tier.desc}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {selectedEvent && <div style={{ color: T.cyan, fontSize: 12, fontWeight: 600 }}>📁 {selectedEvent.name}</div>}
          <div style={{ color: T.textMuted, fontSize: 11, marginTop: 4 }}>Score updates as you fill in</div>
        </div>
      </div>

      {/* Categories */}
      {SCORECARD_CATEGORIES.map(cat => {
        const catVals = cat.fields.map(f => scores[f.key]).filter(v => v > 0);
        const catAvg = catVals.length ? (catVals.reduce((a,b) => a+b,0) / catVals.length).toFixed(1) : "-";
        const isOpen = expandedCat === cat.key;
        return (
          <div key={cat.key} style={{ marginBottom: 8 }}>
            <button onClick={() => setExpandedCat(isOpen ? null : cat.key)} style={{
              width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", background: isOpen ? T.cyan + "15" : T.bg,
              border: "1px solid " + (isOpen ? T.cyan + "44" : T.border),
              borderRadius: 8, cursor: "pointer",
            }}>
              <div style={{ color: isOpen ? T.cyan : T.textPrimary, fontWeight: 600, fontSize: 13 }}>{cat.label}</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: T.amber, fontSize: 12, fontWeight: 700 }}>Avg: {catAvg}/5</span>
                <span style={{ color: T.textMuted, fontSize: 11 }}>Weight: {Math.round(cat.weight * 100)}%</span>
                <span style={{ color: T.textMuted, fontSize: 12 }}>{isOpen ? "▾" : "▸"}</span>
              </div>
            </button>
            {isOpen && (
              <div style={{ padding: "12px 14px", background: T.surface, border: "1px solid " + T.border, borderTop: "none", borderRadius: "0 0 8px 8px" }}>
                {cat.fields.map(f => (
                  <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid " + T.border + "66" }}>
                    <div style={{ color: T.textSecondary, fontSize: 13 }}>{f.label}</div>
                    <StarInput fieldKey={f.key} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Notes */}
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional observations..."
          style={{ width: "100%", minHeight: 80, padding: 10, background: T.bg, border: "1px solid " + T.border, borderRadius: 8, color: T.textPrimary, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Scorecard"}</Btn>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  );
};

const VendorScorecardsView = ({ user }) => {
  const [vendors, setVendors] = useState([]);
  const [events, setEvents] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [scoreModal, setScoreModal] = useState(null);
  const [historyVendor, setHistoryVendor] = useState(null);

  const canScore = ["CEO", "Country Manager", "Vendor Manager"].includes(user?.role);

  const [awards, setAwards] = useState([]);

  const load = async () => {
    const [v, e, s, aw] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "Vendor"),
      supabase.from("projects").select("*"),
      supabase.from("vendor_scorecards").select("*").order("created_at", { ascending: false }),
      supabase.from("rff_awards").select("*, rffs(project_id, event_name)").in("status", ["confirmed","po_created"]),
    ]);
    setVendors(v.data || []);
    setEvents(e.data || []);
    setScorecards(s.data || []);
    setAwards(aw.data || []);
  };

  useEffect(() => { load(); }, []);

  const getTierBadge = (tier, score) => {
    const t = tier ? getTier(score) : { label: "Unrated", color: T.textMuted, bg: T.bg };
    return (
      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: t.bg, color: t.color, border: "1px solid " + t.color + "44" }}>
        {t.label} {score > 0 ? score + "%" : ""}
      </span>
    );
  };

  const impressive = vendors.filter(v => (v.vendor_score || 0) >= 85).length;
  const veryGood = vendors.filter(v => (v.vendor_score || 0) >= 70 && (v.vendor_score || 0) < 85).length;
  const good = vendors.filter(v => (v.vendor_score || 0) >= 50 && (v.vendor_score || 0) < 70).length;
  const poor = vendors.filter(v => v.vendor_scorecard_count > 0 && (v.vendor_score || 0) < 50).length;
  const unrated = vendors.filter(v => !v.vendor_scorecard_count).length;

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Vendors</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Vendor Scorecards</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Performance ratings based on Stretchfield scoring formula</div>
      </div>

      {/* Tier distribution strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Total", value: vendors.length, color: T.cyan },
          { label: "Impressive", value: impressive, color: "#10B981" },
          { label: "Very Good", value: veryGood, color: T.blue },
          { label: "Good", value: good, color: T.amber },
          { label: "Poor / Blocked", value: poor, color: T.red },
        ].map((k, i) => (
          <div key={i} style={{ padding: "12px 14px", background: T.surface, border: `1px solid ${k.color}30`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 20, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 600, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Vendor Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {vendors.sort((a, b) => (b.vendor_score || 0) - (a.vendor_score || 0)).map(v => {
          const score = v.vendor_score || 0;
          const tier = getTier(score);
          const vendorCards = scorecards.filter(s => s.vendor_id === v.id);
          const isPoor = v.vendor_scorecard_count > 0 && score < 50;
          const isUnrated = !v.vendor_scorecard_count;
          const accentColor = isPoor ? T.red : score >= 85 ? "#10B981" : score >= 70 ? T.cyan : score >= 50 ? T.amber : T.border;
          const initials = v.name.slice(0,2).toUpperCase();

          return (
            <div key={v.id} style={{
              background: T.surface,
              border: `1px solid ${isPoor ? T.red + "40" : T.border}`,
              borderTop: `3px solid ${accentColor}`,
              borderRadius: 12, padding: "18px 20px",
              transition: "box-shadow 0.2s, border-color 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 24px ${accentColor}18`}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`, border: `1px solid ${accentColor}40`, display: "flex", alignItems: "center", justifyContent: "center", color: accentColor, fontWeight: 900, fontSize: 12, flexShrink: 0 }}>{initials}</div>
                  <div>
                    <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13 }}>{v.name}</div>
                    <div style={{ color: T.textMuted, fontSize: 11, marginTop: 1 }}>{v.email}</div>
                  </div>
                </div>
                {/* Score dial */}
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, color: isUnrated ? T.textMuted : accentColor }}>
                    {score > 0 ? score + "%" : "—"}
                  </div>
                  <div style={{ color: T.textMuted, fontSize: 9, marginTop: 2 }}>{v.vendor_scorecard_count || 0} scored</div>
                </div>
              </div>

              {/* Tier badge + score bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: accentColor + "18", color: accentColor, border: `1px solid ${accentColor}30` }}>
                    {tier.label}
                  </span>
                  {isPoor && <span style={{ color: T.red, fontSize: 10, fontWeight: 700 }}>⛔ Blocked</span>}
                  {score >= 85 && <span style={{ color: "#10B981", fontSize: 10, fontWeight: 700 }}>★ Priority</span>}
                </div>
                {score > 0 && (
                  <div style={{ height: 4, background: T.border + "44", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: score + "%", background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)`, borderRadius: 2, transition: "width 0.4s ease" }} />
                  </div>
                )}
              </div>

              {/* Recent scores */}
              {vendorCards.length > 0 && (
                <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${T.border}33` }}>
                  <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Recent</div>
                  {vendorCards.slice(0, 2).map(sc => (
                    <div key={sc.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <div style={{ color: T.textMuted, fontSize: 11 }}>{sc.event_name || "General"}</div>
                      <div style={{ color: getTier(sc.total_pct).color, fontWeight: 800, fontSize: 11 }}>{sc.total_pct}%</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                {canScore && !isPoor && (
                  <button onClick={() => setScoreModal(v)} style={{ flex: 1, padding: "7px", background: T.cyan + "12", border: `1px solid ${T.cyan}30`, borderRadius: 8, cursor: "pointer", color: T.cyan, fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>
                    + Score
                  </button>
                )}
                {vendorCards.length > 0 && (
                  <button onClick={() => setHistoryVendor(v)} style={{ flex: 1, padding: "7px", background: "none", border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer", color: T.textMuted, fontSize: 11, fontWeight: 600 }}>
                    History
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Modal */}
      {scoreModal && (
        <VendorScorecardModal
          vendor={scoreModal}
          events={events.filter(e => {
            const vendorAwards = awards.filter(a => a.vendor_id === scoreModal.id);
            const awardedEventIds = vendorAwards.map(a => a.rffs?.project_id).filter(Boolean);
            return awardedEventIds.includes(e.id);
          })}
          user={user}
          onClose={() => setScoreModal(null)}
          onSaved={load}
        />
      )}

      {/* History Modal */}
      {historyVendor && (
        <Modal title={"Scorecard History — " + historyVendor.name} onClose={() => setHistoryVendor(null)}>
          {scorecards.filter(s => s.vendor_id === historyVendor.id).map(sc => {
            const t = getTier(sc.total_pct);
            return (
              <div key={sc.id} style={{ padding: "14px 0", borderBottom: `1px solid ${T.border}44` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{sc.event_name || "General"}</div>
                  <span style={{ color: t.color, fontWeight: 900, fontSize: 18 }}>{sc.total_pct}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: t.color + "18", color: t.color, border: `1px solid ${t.color}30` }}>{t.label}</span>
                  <div style={{ color: T.textMuted, fontSize: 11 }}>{new Date(sc.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ height: 3, background: T.border + "44", borderRadius: 2, marginTop: 8 }}>
                  <div style={{ height: "100%", width: sc.total_pct + "%", background: t.color, borderRadius: 2 }} />
                </div>
                {sc.notes && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 8, fontStyle: "italic", borderTop: `1px solid ${T.border}33`, paddingTop: 8 }}>{sc.notes}</div>}
              </div>
            );
          })}
        </Modal>
      )}
    </div>
  );
};



// ─── VENDOR RATINGS VIEW (CEO/Admin/Strategy read-only) ──────────────────────
const VendorRatingsView = ({ user }) => {
  const [vendors, setVendors] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [rffs, setRffs] = useState([]);
  const [events, setEvents] = useState([]);
  const [historyVendor, setHistoryVendor] = useState(null);
  const [viewMode, setViewMode] = useState("by-event");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [period, setPeriod] = useState("all"); // "all" | "this-month" | "last-3" | "this-year"

  const load = async () => {
    const [v, s, r, e] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "Vendor"),
      supabase.from("vendor_scorecards").select("*").order("created_at", { ascending: false }),
      supabase.from("rffs").select("*").eq("status", "quote-approved"),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
    ]);
    setVendors(v.data || []);
    setScorecards(s.data || []);
    setRffs(r.data || []);
    setEvents(e.data || []);
  };

  useEffect(() => { load(); }, []);

  // Period filter
  const now = new Date();
  const filteredScorecards = scorecards.filter(sc => {
    if (period === "all") return true;
    const d = new Date(sc.created_at);
    if (period === "this-month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "last-3") return d >= new Date(now.getFullYear(), now.getMonth() - 3, 1);
    if (period === "this-year") return d.getFullYear() === now.getFullYear();
    return true;
  });

  // Analytics
  const scoredVendors = vendors.filter(v => filteredScorecards.some(s => s.vendor_id === v.id));
  const avgScore = scoredVendors.length ? Math.round(filteredScorecards.reduce((a, s) => a + s.total_pct, 0) / filteredScorecards.length) : 0;
  const topVendor = filteredScorecards.length ? vendors.find(v => v.id === [...filteredScorecards].sort((a,b) => b.total_pct - a.total_pct)[0]?.vendor_id) : null;
  const poorVendors = vendors.filter(v => { const sc = filteredScorecards.filter(s => s.vendor_id === v.id); return sc.length > 0 && sc[sc.length-1].total_pct < 50; });

  // Build event → vendors map from approved RFFs
  const eventVendorMap = events.map(ev => {
    const eventRffs = rffs.filter(r => r.project_id === ev.id);
    const vendorIds = [...new Set(eventRffs.map(r => r.vendor).filter(Boolean))];
    const vendorsForEvent = eventRffs.map(r => {
      const vendorProfile = vendors.find(v => v.name === r.vendor || v.id === r.vendor_id);
      const scorecard = filteredScorecards.find(s => s.vendor_id === vendorProfile?.id && s.project_id === ev.id);
      return {
        rff: r, vendorProfile,
        scorecard, score: scorecard?.total_pct || null,
        tier: scorecard ? getTier(scorecard.total_pct) : null,
      };
    });
    return { event: ev, vendors: vendorsForEvent };
  }).filter(e => e.vendors.length > 0);

  const sorted = [...vendors].sort((a, b) => (b.vendor_score || 0) - (a.vendor_score || 0));

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Vendors</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Vendor Ratings</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Performance ratings per event and overall</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["all","All"],["this-month","Month"],["last-3","3M"],["this-year","YTD"]].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)} style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${period === val ? T.cyan : T.border}`, cursor: "pointer", background: period === val ? T.cyan + "20" : "none", color: period === val ? T.cyan : T.textMuted, fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", transition: "all 0.15s" }}>{label}</button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Scorecards", value: filteredScorecards.length, color: T.cyan },
          { label: "Avg Score", value: filteredScorecards.length ? avgScore + "%" : "—", color: T.amber },
          { label: "Top Vendor", value: topVendor?.name?.split(" ")[0] || "—", color: "#10B981" },
          { label: "Do Not Engage", value: poorVendors.length, color: T.red },
          { label: "Impressive", value: filteredScorecards.filter(s => s.total_pct >= 85).length, color: "#10B981" },
          { label: "Poor (<50%)", value: filteredScorecards.filter(s => s.total_pct < 50).length, color: T.red },
        ].map((k, i) => (
          <div key={i} style={{ padding: "12px 14px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 16, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 9, fontWeight: 600, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["by-event", "by-vendor"].map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)} style={{
            padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer",
            background: viewMode === mode ? T.cyan : T.bg,
            color: viewMode === mode ? "#000" : T.textMuted,
            fontWeight: viewMode === mode ? 700 : 500, fontSize: 12,
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>{mode === "by-event" ? "By Event" : "By Vendor"}</button>
        ))}
      </div>

      {/* BY EVENT VIEW */}
      {viewMode === "by-event" && (
        <div>
          {eventVendorMap.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16 }}>No scored vendors yet</div>
              <div style={{ color: T.textMuted, fontSize: 13, marginTop: 8 }}>Vendor Manager scores vendors after each event.</div>
            </Card>
          ) : eventVendorMap.map(({ event: ev, vendors: evVendors }) => (
            <div key={ev.id} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 3, height: 20, background: T.cyan, borderRadius: 2 }} />
                <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>{ev.name}</div>
                <div style={{ color: T.textMuted, fontSize: 12 }}>· {evVendors.length} vendor{evVendors.length > 1 ? "s" : ""}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {evVendors.map((vd, i) => {
                  const score = vd.score;
                  const tier = score !== null ? getTier(score) : null;
                  const isPoor = score !== null && score < 50;
                  return (
                    <div key={i} style={{ background: T.surface, border: `1px solid ${score === null ? T.border : isPoor ? T.red + "40" : tier.color + "40"}`, borderTop: `2px solid ${score === null ? T.border : isPoor ? T.red : tier.color}`, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13 }}>{vd.rff.vendor}</div>
                          <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{vd.rff.title}</div>
                          {score !== null && (
                            <span style={{ display: "inline-block", marginTop: 6, padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: tier.color + "18", color: tier.color, border: `1px solid ${tier.color}30` }}>
                              {tier.label}
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: "center", minWidth: 48, flexShrink: 0 }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: score === null ? T.textMuted : isPoor ? T.red : tier.color }}>
                            {score !== null ? score + "%" : "—"}
                          </div>
                          <div style={{ color: T.textMuted, fontSize: 9 }}>{score === null ? "Unscored" : "Score"}</div>
                        </div>
                      </div>
                      {isPoor && <div style={{ marginTop: 8, color: T.red, fontSize: 10, fontWeight: 700 }}>⛔ Do not re-engage</div>}
                      {score !== null && score >= 85 && <div style={{ marginTop: 8, color: "#10B981", fontSize: 10, fontWeight: 700 }}>★ Priority pick</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BY VENDOR VIEW */}
      {viewMode === "by-vendor" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {sorted.map(v => {
            const score = v.vendor_score || 0;
            const tier = getTier(score);
            const vendorCards = scorecards.filter(s => s.vendor_id === v.id);
            const isPoor = v.vendor_scorecard_count > 0 && score < 50;
            const isUnrated = !v.vendor_scorecard_count;
            return (
              <div key={v.id} style={{ background: T.surface, border: `1px solid ${isPoor ? T.red + "40" : T.border}`, borderTop: `3px solid ${isPoor ? T.red : isUnrated ? T.border : tier.color}`, borderRadius: 12, padding: "18px 20px", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 20px ${isPoor ? T.red : isUnrated ? T.border : tier.color}15`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 13 }}>{v.name}</div>
                    <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{v.email}</div>
                    <div style={{ marginTop: 7 }}>
                      <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: isUnrated ? T.bg : tier.color + "18", color: isUnrated ? T.textMuted : tier.color, border: `1px solid ${isUnrated ? T.border : tier.color + "30"}` }}>
                        {isUnrated ? "Unrated" : tier.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: isUnrated ? T.textMuted : tier.color }}>{isUnrated ? "—" : score + "%"}</div>
                    <div style={{ color: T.textMuted, fontSize: 9 }}>{v.vendor_scorecard_count || 0} scored</div>
                  </div>
                </div>
                {!isUnrated && score > 0 && (
                  <div style={{ height: 3, background: T.border + "44", borderRadius: 2, marginBottom: 10 }}>
                    <div style={{ height: "100%", width: score + "%", background: isPoor ? T.red : tier.color, borderRadius: 2 }} />
                  </div>
                )}
                {isPoor && <div style={{ padding: "6px 12px", background: T.red + "12", borderRadius: 6, border: `1px solid ${T.red}30`, marginBottom: 8 }}><div style={{ color: T.red, fontSize: 11, fontWeight: 700 }}>⛔ Do not engage</div></div>}
                {score >= 85 && <div style={{ padding: "6px 12px", background: "#10B98112", borderRadius: 6, border: "1px solid #10B98130", marginBottom: 8 }}><div style={{ color: "#10B981", fontSize: 11, fontWeight: 700 }}>★ Priority vendor</div></div>}
                {vendorCards.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    {filteredScorecards.filter(s => s.vendor_id === v.id).slice(0, 3).map(sc => (
                      <div key={sc.id} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                        <div style={{ color: T.textMuted, fontSize: 11 }}>{sc.event_name || "General"}</div>
                        <div style={{ color: getTier(sc.total_pct).color, fontWeight: 800, fontSize: 11 }}>{sc.total_pct}%</div>
                      </div>
                    ))}
                  </div>
                )}
                {vendorCards.length > 0 && (
                  <button onClick={() => setHistoryVendor(v)} style={{ width: "100%", padding: "7px", background: "none", border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer", color: T.textMuted, fontSize: 11, fontWeight: 600 }}>View All Scorecards</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {historyVendor && (
        <Modal title={"Scorecard History — " + historyVendor.name} onClose={() => setHistoryVendor(null)}>
          {scorecards.filter(s => s.vendor_id === historyVendor.id).map(sc => {
            const t = getTier(sc.total_pct);
            return (
              <div key={sc.id} style={{ padding: "12px 0", borderBottom: "1px solid " + T.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ color: T.textPrimary, fontWeight: 700 }}>{sc.event_name || "General"}</div>
                  <span style={{ color: t.color, fontWeight: 800, fontSize: 16 }}>{sc.total_pct}%</span>
                </div>
                <div style={{ color: t.color, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{t.label}</div>
                <div style={{ color: T.textMuted, fontSize: 11 }}>{new Date(sc.created_at).toLocaleDateString()}</div>
                {sc.notes && <div style={{ color: T.textSecondary, fontSize: 12, marginTop: 6, fontStyle: "italic" }}>{sc.notes}</div>}
              </div>
            );
          })}
        </Modal>
      )}
    </div>
  );
};


// ─── RFF APPROVAL QUEUE (CEO) ─────────────────────────────────────────────────


const ContractAwardApprovalView = ({ user }) => {
  const [awards, setAwards] = useState([]);
  const [previewAward, setPreviewAward] = useState(null);
  const [ceoNotes, setCeoNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [rffs, setRffs] = useState([]);
  const [budgets, setBudgets] = useState([]);

  const load = async () => {
    const { data: aw } = await supabase.from("rff_awards").select("*").order("created_at", { ascending: false });
    const { data: rf } = await supabase.from("rffs").select("*");
    const { data: bud } = await supabase.from("rff_budgets").select("*");
    setAwards(aw || []);
    setRffs(rf || []);
    setBudgets(bud || []);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (award) => {
    setSaving(true);
    // CEO approves AND confirms in one step
    await supabase.from("rff_awards").update({
      status: "confirmed",
      approved_by: user.id,
      ceo_notes: ceoNotes,
      confirmed_at: new Date().toISOString(),
    }).eq("id", award.id);
    // Notify Finance Manager
    const { data: fms } = await supabase.from("profiles").select("id, email, name").in("role", ["Finance Manager"]);
    for (const fm of fms || []) {
      await supabase.from("notifications").insert({
        user_id: fm.id,
        title: "Gig Confirmed — Create PO",
        message: `CEO confirmed ${award.vendor_name} for this gig. Please create a Purchase Order.`,
        type: "rff",
      });
      if (fm.email) await sendEmail(fm.email, `Gig Confirmed — Create PO for ${award.vendor_name}`, notifEmailHtml({ name: fm.name, title: "Gig Confirmed — Action Required", message: `CEO has confirmed <strong>${award.vendor_name}</strong> for a gig. Please log in to create a Purchase Order.`, actionUrl: BASE_URL, actionLabel: "Create Purchase Order" }));
    }
    // Notify Vendor Manager
    const { data: vms } = await supabase.from("profiles").select("id, email, name").eq("role", "Vendor Manager");
    for (const vm of vms || []) {
      await supabase.from("notifications").insert({
        user_id: vm.id,
        title: "Contract Award Confirmed",
        message: `CEO approved and confirmed ${award.vendor_name} for the gig. Finance has been notified to create a PO.`,
        type: "rff",
      });
      if (vm.email) await sendEmail(vm.email, `Contract Award Confirmed — ${award.vendor_name}`, notifEmailHtml({ name: vm.name, title: "Contract Award Confirmed", message: `CEO has approved and confirmed <strong>${award.vendor_name}</strong> for the gig. Finance has been notified to create a Purchase Order.`, actionUrl: BASE_URL, actionLabel: "View in WorkRoom" }));
    }
    setSaving(false); setPreviewAward(null); setCeoNotes(""); load();
  };

  const handleDecline = async (award) => {
    if (!ceoNotes) { alert("Please add notes explaining the decline."); return; }
    setSaving(true);
    await supabase.from("rff_awards").update({ status: "declined_ceo", ceo_notes: ceoNotes }).eq("id", award.id);
    const { data: vms } = await supabase.from("profiles").select("id").eq("role", "Vendor Manager");
    for (const vm of vms || []) {
      await supabase.from("notifications").insert({
        user_id: vm.id,
        title: "Contract Award Declined",
        message: `CEO declined the award for ${award.vendor_name}. Notes: ${ceoNotes.slice(0,100)}`,
        type: "rff",
      });
    }
    setSaving(false); setPreviewAward(null); setCeoNotes(""); load();
  };

  const statusColor = { pending_ceo: T.amber, approved_ceo: T.teal, declined_ceo: T.red, confirmed: "#10B981", po_created: T.cyan };
  const statusLabel = { pending_ceo: "Pending CEO Approval", declined_ceo: "Declined by CEO", confirmed: "Confirmed by CEO", po_created: "PO Created" };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Procurement</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Contract Awards</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{awards.filter(a => a.status === "pending_ceo").length} pending your approval</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Pending Approval", value: awards.filter(a => a.status === "pending_ceo").length, color: T.amber },
          { label: "Approved", value: awards.filter(a => ["approved_ceo","confirmed","po_created"].includes(a.status)).length, color: T.teal },
          { label: "Confirmed", value: awards.filter(a => a.status === "confirmed").length, color: "#10B981" },
          { label: "PO Created", value: awards.filter(a => a.status === "po_created").length, color: T.cyan },
        ].map((k,i) => (
          <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 20, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {awards.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>No contract awards yet.</div>}
        {awards.map(award => {
          const rff = rffs.find(r => r.id === award.rff_id);
          const rffBudgets = budgets.filter(b => b.rff_id === award.rff_id);
          const totalBudget = rffBudgets.reduce((s, b) => s + (b.proposed_amount || 0), 0);
          return (
            <div key={award.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${statusColor[award.status] || T.textMuted}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15 }}>{award.vendor_name}</div>
                  <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{rff?.title} · {rff?.event_name}</div>
                  <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                    <span style={{ color: T.amber, fontWeight: 700, fontSize: 13 }}>Quote: GHS {(award.quoted_amount || 0).toLocaleString()}</span>
                    {totalBudget > 0 && <span style={{ color: T.cyan, fontSize: 13 }}>Budget: GHS {totalBudget.toLocaleString()}</span>}
                  </div>
                  {award.vendor_manager_notes && <div style={{ color: T.textMuted, fontSize: 12, marginTop: 6, fontStyle: "italic" }}>VM Notes: {award.vendor_manager_notes}</div>}
                </div>
                <span style={{ background: (statusColor[award.status] || T.textMuted) + "18", color: statusColor[award.status] || T.textMuted, border: `1px solid ${(statusColor[award.status] || T.textMuted)}30`, borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{statusLabel[award.status] || award.status}</span>
              </div>
              <button onClick={() => { setPreviewAward(award); setCeoNotes(award.ceo_notes || ""); }} style={{ background: T.cyan + "15", border: `1px solid ${T.cyan}30`, color: T.cyan, padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>👁 Review</button>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewAward && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setPreviewAward(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 560, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Contract Award Review</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>{previewAward.vendor_name}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 12, background: T.bg, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
              {[
                ["Vendor", previewAward.vendor_name],
                ["Quoted Amount", `GHS ${(previewAward.quoted_amount||0).toLocaleString()}`],
                ["Proposed Budget", `GHS ${(previewAward.proposed_budget||0).toLocaleString()}`],
                ["Variance", previewAward.quoted_amount <= (previewAward.proposed_budget||0) ? "✓ Within budget" : `⚠ Over by GHS ${((previewAward.quoted_amount||0)-(previewAward.proposed_budget||0)).toLocaleString()}`],
              ].map(([l,v]) => (
                <div key={l}><div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{l}</div><div style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600, marginTop: 3 }}>{v}</div></div>
              ))}
            </div>
            {previewAward.vendor_manager_notes && (
              <div style={{ background: T.cyan + "10", border: `1px solid ${T.cyan}25`, borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                <div style={{ color: T.cyan, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Vendor Manager Notes</div>
                <div style={{ color: T.textSecondary, fontSize: 13 }}>{previewAward.vendor_manager_notes}</div>
              </div>
            )}
            {previewAward.status === "pending_ceo" && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>CEO Notes</label>
                  <textarea value={ceoNotes} onChange={e => setCeoNotes(e.target.value)} rows={3} placeholder="Add notes..." style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => handleApprove(previewAward)} disabled={saving} style={{ background: "linear-gradient(135deg, #10B981, #059669)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>✓ Approve & Confirm Gig</button>
                  <button onClick={() => handleDecline(previewAward)} disabled={saving} style={{ background: T.red + "18", border: `1px solid ${T.red}40`, color: T.red, padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>✗ Decline</button>
                  <button onClick={() => setPreviewAward(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
                </div>
              </>
            )}
            {previewAward.status !== "pending_ceo" && (
              <button onClick={() => setPreviewAward(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Close</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const GigConfirmationView = ({ user }) => {
  const [awards, setAwards] = useState([]);
  const [rffs, setRffs] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data: aw } = await supabase.from("rff_awards").select("*").in("status", ["approved_ceo","confirmed"]).order("created_at", { ascending: false });
    const { data: rf } = await supabase.from("rffs").select("*");
    setAwards(aw || []);
    setRffs(rf || []);
  };

  useEffect(() => { load(); }, []);

  const handleConfirm = async (award) => {
    if (!window.confirm(`Confirm gig for ${award.vendor_name}? This will notify Finance to create a Purchase Order.`)) return;
    setSaving(true);
    await supabase.from("rff_awards").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", award.id);
    // Notify Finance Manager
    const { data: fms } = await supabase.from("profiles").select("id").in("role", ["Finance Manager","CEO"]);
    for (const fm of fms || []) {
      await supabase.from("notifications").insert({
        user_id: fm.id,
        title: "Gig Confirmed — Create PO",
        message: `${award.vendor_name} confirmed for "${rffs.find(r => r.id === award.rff_id)?.title}". Please create a Purchase Order.`,
        type: "rff",
      });
    }
    setSaving(false); load();
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Procurement</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Confirm Gigs</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{awards.filter(a => a.status === "approved_ceo").length} awaiting your confirmation</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {awards.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>No approved awards to confirm.</div>}
        {awards.map(award => {
          const rff = rffs.find(r => r.id === award.rff_id);
          return (
            <div key={award.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${award.status === "confirmed" ? "#10B981" : T.teal}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15 }}>{award.vendor_name}</div>
                  <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{rff?.title} · {rff?.event_name}</div>
                  <div style={{ color: T.amber, fontWeight: 700, fontSize: 13, marginTop: 4 }}>GHS {(award.quoted_amount || 0).toLocaleString()}</div>
                  {award.ceo_notes && <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>CEO: {award.ceo_notes}</div>}
                </div>
                {award.status === "approved_ceo" && (
                  <button onClick={() => handleConfirm(award)} disabled={saving} style={{ background: "linear-gradient(135deg, #10B981, #059669)", border: "none", color: "#fff", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>✓ Confirm Gig</button>
                )}
                {award.status === "confirmed" && <span style={{ color: "#10B981", fontWeight: 700, fontSize: 13 }}>✓ Confirmed</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PurchaseOrderView = ({ user }) => {
  const [awards, setAwards] = useState([]);
  const [pos, setPOs] = useState([]);
  const [rffs, setRffs] = useState([]);
  const [events, setEvents] = useState([]);
  const [vendorProfiles, setVendorProfiles] = useState([]);
  const [poModal, setPoModal] = useState(null);
  const [poForm, setPoForm] = useState({ currency: "GHS", notes: "", vendor_email: "" });
  const [saving, setSaving] = useState(false);
  const [zohoStatus, setZohoStatus] = useState("");

  const load = async () => {
    const [{ data: aw }, { data: po }, { data: rf }, { data: ev }, { data: vp }] = await Promise.all([
      supabase.from("rff_awards").select("*").in("status", ["confirmed"]),
      supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("rffs").select("*"),
      supabase.from("projects").select("*"),
      supabase.from("profiles").select("id, name, email, phone, company_name, service_category").eq("role", "Vendor"),
    ]);
    setAwards(aw || []);
    setPOs(po || []);
    setRffs(rf || []);
    setEvents(ev || []);
    setVendorProfiles(vp || []);
  };

  useEffect(() => { load(); }, []);

  const handleCreatePO = async () => {
    if (!poModal) return;
    setSaving(true);
    setZohoStatus("");
    const rff = rffs.find(r => r.id === poModal.rff_id);
    const event = events.find(e => e.id === rff?.project_id);

    // Generate internal PO number from RFF code
    let internalPoNumber = "";
    if (rff?.rff_code) {
      // Count existing POs for this RFF to determine vendor suffix
      const { data: existingPos } = await supabase.from("purchase_orders").select("id").eq("rff_id", poModal.rff_id);
      const vendorSuffix = (existingPos?.length || 0) === 0 ? "" : String(existingPos.length + 1);
      internalPoNumber = `PO/${rff.rff_code}${vendorSuffix}`;
    }

    // Create PO in Supabase
    const { data: po } = await supabase.from("purchase_orders").insert({
      rff_id: poModal.rff_id,
      rff_award_id: poModal.id,
      vendor_id: poModal.vendor_id,
      vendor_name: poModal.vendor_name,
      event_id: rff?.project_id,
      event_name: rff?.event_name || event?.name,
      amount: poModal.quoted_amount,
      currency: poForm.currency,
      notes: poForm.notes,
      status: "draft",
      created_by: user.id,
      internal_po_number: internalPoNumber,
    }).select().single();

    // Push to Zoho Books
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const zohoRes = await fetch("/api/zoho-sync?action=create-po", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          vendor_name: poModal.vendor_name,
          amount: poModal.quoted_amount,
          currency: poForm.currency,
          notes: poForm.notes,
          rff_title: rff?.title,
          event_name: rff?.event_name,
          po_id: po?.id,
        }),
      });
      const zohoData = await zohoRes.json();
      if (zohoData.purchaseorder) {
        await supabase.from("purchase_orders").update({
          zoho_po_id: zohoData.purchaseorder.purchaseorder_id,
          zoho_po_number: zohoData.purchaseorder.purchaseorder_number,
          status: "sent",
        }).eq("id", po.id);
        setZohoStatus(`✅ PO ${zohoData.purchaseorder.purchaseorder_number} created in Zoho Books`);
      }
    } catch (e) {
      setZohoStatus("⚠ PO saved locally. Zoho sync failed: " + e.message);
    }

    // Update award status
    await supabase.from("rff_awards").update({ status: "po_created" }).eq("id", poModal.id);

    // Notify vendor
    if (poModal.vendor_id) {
      await supabase.from("notifications").insert({
        user_id: poModal.vendor_id,
        title: "Purchase Order Created",
        message: `A Purchase Order has been raised for your services on "${rff?.event_name}". Please submit your invoice.`,
        type: "rff",
      });
      // Send PO email to vendor
      if (poForm.vendor_email) {
        await sendEmail(
          poForm.vendor_email,
          `Purchase Order ${internalPoNumber} — Stretchfield`,
          poEmailHtml({
            vendorName: poModal.vendor_name,
            poNumber: internalPoNumber,
            eventName: rff?.event_name || "",
            amount: poModal.quoted_amount,
            currency: poForm.currency,
            notes: poForm.notes,
          })
        );
      }
    }

    setSaving(false);
    setPoModal(null);
    load();
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Finance</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Purchase Orders</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{awards.length} confirmed gigs awaiting PO · {pos.length} POs created</div>
      </div>

      {zohoStatus && <div style={{ padding: "10px 14px", background: T.teal + "12", border: `1px solid ${T.teal}30`, borderRadius: 8, color: T.teal, fontSize: 13, marginBottom: 16 }}>{zohoStatus}</div>}

      {/* Confirmed gigs needing PO */}
      {awards.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ color: T.amber, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>⚠ Confirmed Gigs — Create PO</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {awards.map(award => {
              const rff = rffs.find(r => r.id === award.rff_id);
              return (
                <div key={award.id} style={{ background: T.surface, border: `1px solid ${T.amber}30`, borderLeft: `3px solid ${T.amber}`, borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>{award.vendor_name}</div>
                    <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{rff?.title} · {rff?.event_name}</div>
                    <div style={{ color: T.amber, fontWeight: 700, fontSize: 13, marginTop: 4 }}>GHS {(award.quoted_amount || 0).toLocaleString()}</div>
                    {vendorProfiles.find(v => v.id === award.vendor_id)?.email && (
                      <div style={{ color: T.cyan, fontSize: 11, marginTop: 3 }}>✉ {vendorProfiles.find(v => v.id === award.vendor_id)?.email}</div>
                    )}
                    {vendorProfiles.find(v => v.id === award.vendor_id)?.phone && (
                      <div style={{ color: T.textMuted, fontSize: 11 }}>📞 {vendorProfiles.find(v => v.id === award.vendor_id)?.phone}</div>
                    )}
                  </div>
                  <button onClick={() => {
                    const vp = vendorProfiles.find(v => v.id === award.vendor_id);
                    setPoModal(award);
                    setPoForm({ currency: "GHS", notes: "", vendor_email: vp?.email || "" });
                  }} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>Create PO</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Existing POs */}
      {pos.length > 0 && (
        <div>
          <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Purchase Orders</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {["PO Number","Vendor","Event","Amount","Zoho Status","Status"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pos.map((po, i) => (
                  <tr key={po.id} style={{ borderBottom: i < pos.length-1 ? `1px solid ${T.border}44` : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ color: T.cyan, fontSize: 12, fontWeight: 700 }}>{po.internal_po_number || po.zoho_po_number || "—"}</div>
                      {po.zoho_po_number && po.internal_po_number && <div style={{ color: T.textMuted, fontSize: 10 }}>Zoho: {po.zoho_po_number}</div>}
                    </td>
                    <td style={{ padding: "10px 14px", color: T.textPrimary, fontSize: 12, fontWeight: 600 }}>{po.vendor_name}</td>
                    <td style={{ padding: "10px 14px", color: T.textSecondary, fontSize: 12 }}>{po.event_name}</td>
                    <td style={{ padding: "10px 14px", color: T.amber, fontSize: 12, fontWeight: 700 }}>{po.currency} {(po.amount||0).toLocaleString()}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ color: po.zoho_po_id ? T.teal : T.textMuted, fontSize: 11, fontWeight: 600 }}>{po.zoho_po_id ? "✓ In Zoho" : "Local only"}</span></td>
                    <td style={{ padding: "10px 14px" }}><span style={{ background: T.teal + "18", color: T.teal, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{po.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {poModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setPoModal(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Create Purchase Order</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>{poModal.vendor_name}</div>
            <div style={{ background: T.bg, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 10 }}>
                {[["Vendor", poModal.vendor_name], ["Amount", `GHS ${(poModal.quoted_amount||0).toLocaleString()}`]].map(([l,v]) => (
                  <div key={l}><div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{l}</div><div style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600, marginTop: 3 }}>{v}</div></div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Vendor Email (for PO delivery)</label>
              <input type="email" value={poForm.vendor_email} onChange={e => setPoForm({...poForm, vendor_email: e.target.value})} placeholder="vendor@company.com" style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Currency</label>
              <select value={poForm.currency} onChange={e => setPoForm({...poForm, currency: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                {["GHS","USD","EUR","GBP","NGN","KES"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Notes</label>
              <textarea value={poForm.notes} onChange={e => setPoForm({...poForm, notes: e.target.value})} rows={3} placeholder="PO notes, delivery terms..." style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCreatePO} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Creating..." : "Create PO + Sync to Zoho"}</button>
              <button onClick={() => setPoModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VendorInvoiceView = ({ user }) => {
  const [invoices, setInvoices] = useState([]);
  const [pos, setPOs] = useState([]);
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ event_id: "", purchase_order_id: "", amount: "", notes: "" });
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = React.useRef();

  const load = async () => {
    const [{ data: inv }, { data: po }, { data: awards }] = await Promise.all([
      supabase.from("vendor_invoices").select("*").eq("vendor_id", user.id).order("created_at", { ascending: false }),
      supabase.from("purchase_orders").select("*").eq("vendor_id", user.id),
      supabase.from("rff_awards").select("*, rffs(project_id, event_name, title)").eq("vendor_id", user.id).in("status", ["confirmed","po_created"]),
    ]);
    setInvoices(inv || []);
    setPOs(po || []);
    // Only show events where vendor has a confirmed/awarded gig
    const awardedEventIds = [...new Set((awards || []).map(a => a.rffs?.project_id).filter(Boolean))];
    if (awardedEventIds.length > 0) {
      const { data: ev } = await supabase.from("projects").select("*").in("id", awardedEventIds);
      setEvents(ev || []);
    } else {
      // Fallback: show events from purchase orders
      const poEventIds = [...new Set((po || []).map(p => p.event_id).filter(Boolean))];
      if (poEventIds.length > 0) {
        const { data: ev } = await supabase.from("projects").select("*").in("id", poEventIds);
        setEvents(ev || []);
      } else {
        setEvents([]);
      }
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.event_id || !form.amount) { alert("Please select an event and enter the amount."); return; }
    setSaving(true);
    let invoice_url = "", invoice_filename = "";
    if (invoiceFile) {
      const ext = invoiceFile.name.split(".").pop();
      const filename = `invoice_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("rffs").upload(filename, invoiceFile, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("rffs").getPublicUrl(filename);
        invoice_url = data.publicUrl;
        invoice_filename = invoiceFile.name;
      }
    }
    const event = events.find(e => e.id === form.event_id);
    const po = pos.find(p => p.id === form.purchase_order_id);
    // Generate invoice number from PO internal number
    let invoiceNumber = "";
    if (po?.internal_po_number) {
      invoiceNumber = po.internal_po_number.replace("PO/", "INV/");
    }
    await supabase.from("vendor_invoices").insert({
      vendor_id: user.id,
      vendor_name: user.name,
      event_id: form.event_id,
      event_name: event?.name || "",
      purchase_order_id: form.purchase_order_id || null,
      amount: parseFloat(form.amount) || 0,
      invoice_url,
      invoice_filename,
      notes: form.notes,
      status: "submitted",
      invoice_number: invoiceNumber,
    });
    // Notify Finance
    const { data: fms } = await supabase.from("profiles").select("id").in("role", ["Finance Manager","CEO"]);
    for (const fm of fms || []) {
      await supabase.from("notifications").insert({
        user_id: fm.id,
        title: "Invoice Received",
        message: `${user.name} submitted an invoice of GHS ${parseFloat(form.amount).toLocaleString()} for "${event?.name}".`,
        type: "rff",
      });
    }
    setSaving(false);
    setModal(false);
    setForm({ event_id: "", purchase_order_id: "", amount: "", notes: "" });
    setInvoiceFile(null);
    load();
  };

  const statusColor = { submitted: T.amber, reviewed: T.teal, paid: "#10B981" };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Finance</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>My Invoices</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Submit invoices per event</div>
        </div>
        <button onClick={() => setModal(true)} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+ Submit Invoice</button>
      </div>

      {invoices.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🧾</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No invoices submitted</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Submit your first invoice using the button above.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {invoices.map(inv => (
            <div key={inv.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${statusColor[inv.status] || T.textMuted}`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>{inv.event_name}</div>
                <div style={{ color: T.amber, fontWeight: 700, fontSize: 13, marginTop: 3 }}>GHS {(inv.amount||0).toLocaleString()}</div>
                <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{new Date(inv.created_at).toLocaleDateString("en-GB")}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {inv.invoice_url && <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" style={{ color: T.cyan, fontSize: 12, fontWeight: 700 }}>📄 View</a>}
                <span style={{ background: (statusColor[inv.status]||T.textMuted)+"18", color: statusColor[inv.status]||T.textMuted, border: `1px solid ${(statusColor[inv.status]||T.textMuted)}30`, borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setModal(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 20 }}>Submit Invoice</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Event</label>
              <select value={form.event_id} onChange={e => setForm({...form, event_id: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                <option value="">Select event...</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            {pos.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Purchase Order (if any)</label>
                <select value={form.purchase_order_id} onChange={e => setForm({...form, purchase_order_id: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                  <option value="">No PO / Select PO...</option>
                  {pos.map(p => <option key={p.id} value={p.id}>{p.zoho_po_number || "PO"} · {p.event_name} · GHS {(p.amount||0).toLocaleString()}</option>)}
                </select>
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Invoice Amount (GHS)</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Upload Invoice Document</label>
              <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${T.border}`, borderRadius: 8, padding: "14px", textAlign: "center", cursor: "pointer", background: T.bg }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.cyan + "60"}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                <div style={{ color: T.textMuted, fontSize: 12 }}>{invoiceFile ? `✓ ${invoiceFile.name}` : "Drop file here or browse"}</div>
              </div>
              <input ref={fileRef} type="file" onChange={e => setInvoiceFile(e.target.files[0])} style={{ display: "none" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSubmit} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Submitting..." : "Submit Invoice"}</button>
              <button onClick={() => setModal(false)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FinanceInvoicesView = ({ user }) => {
  const [invoices, setInvoices] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("vendor_invoices").select("*").order("created_at", { ascending: false });
    setInvoices(data || []);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await supabase.from("vendor_invoices").update({ status, reviewed_by: user.id }).eq("id", id);
    load();
  };

  const statusColor = { submitted: T.amber, reviewed: T.teal, paid: "#10B981" };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Finance</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Vendor Invoices</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{invoices.filter(i => i.status === "submitted").length} new invoices to review</div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        {invoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>No invoices received yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                {["Vendor","Event","Amount","Document","Date","Status","Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={inv.id} style={{ borderBottom: i < invoices.length-1 ? `1px solid ${T.border}44` : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 14px", color: T.textPrimary, fontSize: 12, fontWeight: 700 }}>{inv.vendor_name}</td>
                  <td style={{ padding: "10px 14px", color: T.textSecondary, fontSize: 12 }}>{inv.event_name}</td>
                  <td style={{ padding: "10px 14px", color: T.amber, fontSize: 12, fontWeight: 700 }}>GHS {(inv.amount||0).toLocaleString()}</td>
                  <td style={{ padding: "10px 14px" }}>{inv.invoice_url ? <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" style={{ color: T.cyan, fontSize: 12, fontWeight: 700 }}>📄 View</a> : <span style={{ color: T.textMuted, fontSize: 11 }}>No doc</span>}</td>
                  <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 11 }}>{new Date(inv.created_at).toLocaleDateString("en-GB")}</td>
                  <td style={{ padding: "10px 14px" }}><span style={{ background: (statusColor[inv.status]||T.textMuted)+"18", color: statusColor[inv.status]||T.textMuted, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{inv.status}</span></td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {inv.status === "submitted" && <button onClick={() => updateStatus(inv.id, "reviewed")} style={{ background: T.teal + "18", border: `1px solid ${T.teal}30`, color: T.teal, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Review</button>}
                      {inv.status === "reviewed" && <button onClick={() => updateStatus(inv.id, "paid")} style={{ background: "#10B98118", border: "1px solid #10B98130", color: "#10B981", padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>Mark Paid</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};


const QuotesReceivedView = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [rffs, setRffs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedRff, setSelectedRff] = useState(null);

  const load = async () => {
    const [{ data: ev }, { data: rf }, { data: asn }] = await Promise.all([
      supabase.from("projects").select("*").order("name"),
      supabase.from("rffs").select("*").eq("approved", true).order("created_at", { ascending: false }),
      supabase.from("rff_vendor_assignments").select("*").order("created_at", { ascending: false }),
    ]);
    setEvents(ev || []);
    setRffs(rf || []);
    setAssignments(asn || []);
  };

  useEffect(() => { load(); }, []);

  const filteredRffs = selectedEvent === "all" ? rffs : rffs.filter(r => r.project_id === selectedEvent);
  const rffsWithQuotes = filteredRffs.filter(r => {
    const rffAssignments = assignments.filter(a => a.rff_id === r.id);
    return rffAssignments.some(a => a.quote_amount);
  });
  const totalQuotes = assignments.filter(a => a.quote_amount).length;

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Procurement</div>
          <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Quotes Received</h2>
          <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{totalQuotes} quotes received across {rffsWithQuotes.length} RFFs</div>
        </div>
        <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} style={{ padding: "9px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
          <option value="all">All Events</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total RFFs", value: filteredRffs.length, color: T.cyan },
          { label: "RFFs with Quotes", value: rffsWithQuotes.length, color: T.teal },
          { label: "Total Quotes", value: totalQuotes, color: T.amber },
          { label: "Pending Quotes", value: assignments.filter(a => !a.quote_amount).length, color: T.textMuted },
        ].map((k, i) => (
          <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 20, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* RFF Cards grouped by event */}
      {filteredRffs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16 }}>No RFFs found</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredRffs.map(rff => {
            const rffAssignments = assignments.filter(a => a.rff_id === rff.id);
            const quotedAssignments = rffAssignments.filter(a => a.quote_amount);
            const event = events.find(e => e.id === rff.project_id);
            const isExpanded = selectedRff === rff.id;

            return (
              <div key={rff.id} style={{ background: T.surface, border: `1px solid ${isExpanded ? T.cyan + "60" : T.border}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s" }}>
                {/* RFF Header */}
                <div onClick={() => setSelectedRff(isExpanded ? null : rff.id)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div>
                    <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15 }}>{rff.title}</div>
                    <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{event?.name || rff.event_name}</div>
                    <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>Deadline: {rff.deadline ? new Date(rff.deadline).toLocaleDateString("en-GB") : "—"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: quotedAssignments.length > 0 ? T.teal : T.amber, fontWeight: 900, fontSize: 18 }}>{quotedAssignments.length}</div>
                      <div style={{ color: T.textMuted, fontSize: 10, textTransform: "uppercase" }}>of {rffAssignments.length} quoted</div>
                    </div>
                    <div style={{ color: T.textMuted, fontSize: 18, transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>›</div>
                  </div>
                </div>

                {/* Expanded Quotes */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px 20px" }}>
                    {rffAssignments.length === 0 ? (
                      <div style={{ color: T.textMuted, fontSize: 13 }}>No vendors assigned yet.</div>
                    ) : (
                      <div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                          {["Vendor","Category","Quote Amount","Document","Submitted"].map(h => (
                            <div key={h} style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</div>
                          ))}
                        </div>
                        {rffAssignments.map(a => (
                          <div key={a.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8, padding: "10px 0", borderBottom: `1px solid ${T.border}44`, alignItems: "center" }}>
                            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{a.vendor_name}</div>
                            <div style={{ color: T.textMuted, fontSize: 12 }}>—</div>
                            <div style={{ color: a.quote_amount ? T.amber : T.textMuted, fontWeight: a.quote_amount ? 800 : 400, fontSize: 13 }}>
                              {a.quote_amount ? `GHS ${parseFloat(a.quote_amount).toLocaleString()}` : "Pending"}
                            </div>
                            <div>
                              {a.quote_document_url ? (
                                <a href={a.quote_document_url} target="_blank" rel="noopener noreferrer" style={{ color: T.cyan, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>📄 View</a>
                              ) : <span style={{ color: T.textMuted, fontSize: 12 }}>No doc</span>}
                            </div>
                            <div style={{ color: T.textMuted, fontSize: 11 }}>
                              {a.quote_submitted_at ? new Date(a.quote_submitted_at).toLocaleDateString("en-GB") : "—"}
                            </div>
                          </div>
                        ))}

                        {/* Summary */}
                        {quotedAssignments.length > 0 && (
                          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}44`, display: "flex", gap: 20 }}>
                            <span style={{ color: T.textMuted, fontSize: 12 }}>Lowest: <strong style={{ color: T.teal }}>GHS {Math.min(...quotedAssignments.map(a => a.quote_amount)).toLocaleString()}</strong></span>
                            <span style={{ color: T.textMuted, fontSize: 12 }}>Highest: <strong style={{ color: T.amber }}>GHS {Math.max(...quotedAssignments.map(a => a.quote_amount)).toLocaleString()}</strong></span>
                            <span style={{ color: T.textMuted, fontSize: 12 }}>Avg: <strong style={{ color: T.cyan }}>GHS {Math.round(quotedAssignments.reduce((s,a) => s + a.quote_amount, 0) / quotedAssignments.length).toLocaleString()}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const QuoteComparisonView = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [rffs, setRffs] = useState([]);
  const [selectedRff, setSelectedRff] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [compareVendors, setCompareVendors] = useState([]);
  const [awardModal, setAwardModal] = useState(null);
  const [awardNotes, setAwardNotes] = useState("");
  const [agreedAmount, setAgreedAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [awards, setAwards] = useState([]);
  const [vendorProfiles, setVendorProfiles] = useState([]);
  const [vendorApps, setVendorApps] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);

  const load = async () => {
    const [{ data: ev }, { data: aw }, { data: vp }, { data: va }, { data: pe }] = await Promise.all([
      supabase.from("projects").select("*").order("name"),
      supabase.from("rff_awards").select("*"),
      supabase.from("profiles").select("*").eq("role", "Vendor"),
      supabase.from("vendor_applications").select("*").eq("status", "login-created"),
      supabase.from("rff_vendor_assignments").select("*"),
    ]);
    setEvents(ev || []);
    setAwards(aw || []);
    setVendorProfiles(vp || []);
    setVendorApps(va || []);
    setPastEvents(pe || []);
  };

  useEffect(() => { load(); }, []);

  const loadRffs = async (eventId) => {
    const { data } = await supabase.from("rffs").select("*").eq("project_id", eventId).eq("approved", true);
    setRffs(data || []);
    setSelectedRff("");
    setAssignments([]);
    setBudgets([]);
  };

  const loadQuotes = async (rffId) => {
    const [{ data: asn }, { data: bud }, { data: rff }] = await Promise.all([
      supabase.from("rff_vendor_assignments").select("*").eq("rff_id", rffId),
      supabase.from("rff_budgets").select("*").eq("rff_id", rffId),
      supabase.from("rffs").select("*").eq("id", rffId).single(),
    ]);
    // Merge rff-level quote data as fallback for old submissions
    const enriched = (asn || []).map(a => ({
      ...a,
      quote_amount: a.quote_amount || (rff?.amount && rff?.vendor === a.vendor_name ? rff.amount : null),
      quote_document_url: a.quote_document_url || rff?.quote_url || null,
    }));
    setAssignments(enriched);
    setBudgets(bud || []);
    setSelectedCategory("all");
    setCompareVendors([]);
  };

  const categories = [...new Set(budgets.map(b => b.category))];
  const totalBudget = budgets.reduce((sum, b) => sum + (b.proposed_amount || 0), 0);
  // When category selected, use only that category budget for comparison
  const activeBudget = selectedCategory === "all"
    ? totalBudget
    : (budgets.find(b => b.category === selectedCategory)?.proposed_amount || 0);
  const quotedAssignments = assignments.filter(a => a.quote_amount);
  // Filter assignments by selected budget category — match vendor service_category
  const filteredAssignments = selectedCategory === "all" ? quotedAssignments : quotedAssignments.filter(a => {
    const vProfile = vendorProfiles.find(v => v.id === a.vendor_id);
    return vProfile?.service_category === selectedCategory;
  });

  const toggleCompare = (id) => {
    setCompareVendors(prev => prev.includes(id) ? prev.filter(v => v !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]);
  };

  const handleAward = async () => {
    if (!awardModal) return;
    setSaving(true);
    const assignment = assignments.find(a => a.id === awardModal.id);
    const rff = rffs.find(r => r.id === selectedRff);
    const finalAmount = parseFloat(agreedAmount) || awardModal.quote_amount;
    await supabase.from("rff_awards").insert({
      rff_id: selectedRff,
      vendor_id: awardModal.vendor_id,
      vendor_name: awardModal.vendor_name,
      quoted_amount: awardModal.quote_amount,
      agreed_amount: finalAmount,
      proposed_budget: totalBudget,
      vendor_manager_notes: awardNotes,
      status: "pending_ceo",
      awarded_by: user.id,
    });
    // Notify CEO
    const { data: ceos } = await supabase.from("profiles").select("id").eq("role", "CEO");
    for (const ceo of ceos || []) {
      await supabase.from("notifications").insert({
        user_id: ceo.id,
        title: "Contract Award Pending Approval",
        message: `${user.name} has nominated ${awardModal.vendor_name} for "${rff?.title}". Agreed Amount: GHS ${finalAmount?.toLocaleString()}${finalAmount !== awardModal.quote_amount ? ` (Original: GHS ${awardModal.quote_amount?.toLocaleString()})` : ""}. Please review.`,
        type: "rff",
      });
    }
    setSaving(false);
    setAwardModal(null);
    setAwardNotes("");
    setAgreedAmount("");
    load();
    loadQuotes(selectedRff);
  };

  const selectedRffData = rffs.find(r => r.id === selectedRff);
  const compareData = compareVendors.map(id => assignments.find(a => a.id === id)).filter(Boolean);

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Procurement</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Quote Comparison</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Compare vendor quotes against proposed budgets per event</div>
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div>
          <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Select Event</label>
          <select value={selectedEvent} onChange={e => { setSelectedEvent(e.target.value); loadRffs(e.target.value); }} style={{ width: "100%", padding: "9px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
            <option value="">Choose event...</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Select RFF</label>
          <select value={selectedRff} onChange={e => { setSelectedRff(e.target.value); loadQuotes(e.target.value); }} style={{ width: "100%", padding: "9px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }} disabled={!selectedEvent}>
            <option value="">Choose RFF...</option>
            {rffs.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Filter by Category</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: "100%", padding: "9px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }} disabled={!selectedRff}>
            <option value="all">All Categories</option>
            {budgets.map(b => <option key={b.id} value={b.category}>{b.category} — GHS {(b.proposed_amount||0).toLocaleString()} budget</option>)}
          </select>
        </div>
      </div>

      {selectedRff && (
        <>
          {/* Budget vs Quotes KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { label: selectedCategory === "all" ? "Total Budget" : selectedCategory + " Budget", value: `GHS ${activeBudget.toLocaleString()}`, color: T.cyan },
              { label: "Quotes Received", value: quotedAssignments.length, color: T.teal },
              { label: "Lowest Quote", value: quotedAssignments.length > 0 ? `GHS ${Math.min(...quotedAssignments.map(a => a.quote_amount)).toLocaleString()}` : "—", color: "#10B981" },
              { label: "Highest Quote", value: quotedAssignments.length > 0 ? `GHS ${Math.max(...quotedAssignments.map(a => a.quote_amount)).toLocaleString()}` : "—", color: T.amber },
            ].map((k, i) => (
              <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
                <div style={{ color: k.color, fontSize: 18, fontWeight: 900 }}>{k.value}</div>
                <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Budget Lines */}
          {budgets.length > 0 && (
            <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <div style={{ color: T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>CEO Proposed Budget Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {budgets.map(b => (
                  <div key={b.id} style={{ background: T.bg, borderRadius: 8, padding: "10px 14px", border: `1px solid ${T.border}` }}>
                    <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{b.category}</div>
                    <div style={{ color: T.cyan, fontWeight: 900, fontSize: 16, marginTop: 4 }}>GHS {(b.proposed_amount || 0).toLocaleString()}</div>
                    {b.notes && <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{b.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quote Comparison Chart */}
          {quotedAssignments.length > 0 && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px", marginBottom: 20 }}>
              <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Quote Comparison Chart</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Budget line */}
                {totalBudget > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 120, color: T.cyan, fontSize: 11, fontWeight: 700, textAlign: "right", flexShrink: 0 }}>Proposed Budget</div>
                    <div style={{ flex: 1, height: 28, background: T.border + "44", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                      <div style={{ height: "100%", width: "100%", background: `linear-gradient(90deg, ${T.cyan}40, ${T.cyan}20)`, borderRadius: 4, border: `2px dashed ${T.cyan}`, boxSizing: "border-box" }} />
                    </div>
                    <div style={{ width: 120, color: T.cyan, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>GHS {totalBudget.toLocaleString()}</div>
                  </div>
                )}
                {quotedAssignments.map((a, idx) => {
                  const pct = activeBudget > 0 ? Math.min((a.quote_amount / activeBudget) * 100, 150) : 50;
                  const barColor = a.quote_amount <= activeBudget ? T.teal : T.red;
                  const isSelected = compareVendors.includes(a.id);
                  const isAwarded = awards.some(aw => aw.rff_id === selectedRff && aw.vendor_id === a.vendor_id);
                  const vProfile = vendorProfiles.find(v => v.id === a.vendor_id);
                  const vApp = vendorApps.find(v => v.vendor_name === a.vendor_name);
                  const tier = vProfile ? getTier(vProfile.vendor_score || 0) : null;
                  const expCount = pastEvents.filter(e => e.vendor_id === a.vendor_id && e.quote_submitted_at).length;
                  const variancePct = activeBudget > 0 ? (((a.quote_amount - activeBudget) / activeBudget) * 100).toFixed(1) : null;
                  const daysToRespond = a.quote_submitted_at && a.created_at ? Math.ceil((new Date(a.quote_submitted_at) - new Date(a.created_at)) / (1000*60*60*24)) : null;
                  return (
                    <div key={a.id} style={{ background: isSelected ? T.amber+"08" : "transparent", border: isSelected ? `1px solid ${T.amber}30` : "1px solid transparent", borderRadius: 8, padding: "8px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 140, flexShrink: 0, textAlign: "right" }}>
                          <div style={{ color: isSelected ? T.amber : T.textPrimary, fontSize: 12, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.vendor_name}</div>
                          {tier && vProfile?.vendor_scorecard_count > 0 && (
                            <span style={{ background: tier.color+"20", color: tier.color, border: `1px solid ${tier.color}40`, borderRadius: 20, padding: "1px 6px", fontSize: 9, fontWeight: 800 }}>{tier.label}</span>
                          )}
                          {(!vProfile || vProfile.vendor_scorecard_count === 0) && (
                            <span style={{ color: T.textMuted, fontSize: 9 }}>Unrated</span>
                          )}
                        </div>
                        <div style={{ flex: 1, height: 28, background: T.border + "44", borderRadius: 4, overflow: "hidden", position: "relative", cursor: "pointer" }} onClick={() => toggleCompare(a.id)}>
                          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}99)`, borderRadius: 4, transition: "width 0.4s ease", border: isSelected ? `2px solid ${T.amber}` : "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ width: 130, flexShrink: 0 }}>
                          <div style={{ color: barColor, fontSize: 12, fontWeight: 700 }}>GHS {(a.quote_amount || 0).toLocaleString()}</div>
                          {variancePct !== null && (
                            <div style={{ color: parseFloat(variancePct) <= 0 ? T.teal : T.red, fontSize: 10, fontWeight: 700 }}>
                              {parseFloat(variancePct) <= 0 ? `✓ ${Math.abs(variancePct)}% under` : `⚠ ${variancePct}% over`}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, width: 200, flexShrink: 0 }}>
                          {expCount > 0 && <span style={{ background: T.blue+"15", color: T.blue, borderRadius: 20, padding: "1px 7px", fontSize: 9, fontWeight: 700 }}>📋 {expCount} event{expCount>1?"s":""}</span>}
                          {daysToRespond !== null && <span style={{ background: daysToRespond <= 2 ? T.teal+"15" : T.amber+"15", color: daysToRespond <= 2 ? T.teal : T.amber, borderRadius: 20, padding: "1px 7px", fontSize: 9, fontWeight: 700 }}>⚡ {daysToRespond}d response</span>}
                          {a.quote_document_url ? <span style={{ background: T.teal+"15", color: T.teal, borderRadius: 20, padding: "1px 7px", fontSize: 9, fontWeight: 700 }}>📄 Doc ✓</span> : <span style={{ background: T.red+"15", color: T.red, borderRadius: 20, padding: "1px 7px", fontSize: 9, fontWeight: 700 }}>No doc</span>}
                          {vApp?.payment_terms && <span style={{ background: T.gold+"15", color: T.gold, borderRadius: 20, padding: "1px 7px", fontSize: 9, fontWeight: 700 }}>💳 {vApp.payment_terms.slice(0,15)}</span>}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => toggleCompare(a.id)} style={{ background: isSelected ? T.amber+"20" : T.surface, border: `1px solid ${isSelected ? T.amber : T.border}`, color: isSelected ? T.amber : T.textMuted, padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>{isSelected ? "✓ Selected" : "Compare"}</button>
                          {a.quote_document_url && <a href={a.quote_document_url} target="_blank" rel="noopener noreferrer" style={{ background: T.cyan+"15", border: `1px solid ${T.cyan}30`, color: T.cyan, padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, textDecoration: "none" }}>View</a>}
                          {!isAwarded && user?.role === "Vendor Manager" && (
                            <button onClick={() => { setAwardModal(a); setAgreedAmount(a.quote_amount || ""); }} style={{ background: "#10B98115", border: "1px solid #10B98130", color: "#10B981", padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>🏆 Award</button>
                          )}
                          {isAwarded && <span style={{ color: "#10B981", fontSize: 10, fontWeight: 700 }}>✓ Awarded</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Side by Side Comparison */}
          {compareData.length === 2 && (
            <div style={{ background: T.surface, border: `1px solid ${T.amber}30`, borderRadius: 12, padding: "20px", marginBottom: 20 }}>
              <div style={{ color: T.amber, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Side-by-Side Comparison</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
                <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}></div>
                {compareData.map(a => (
                  <div key={a.id} style={{ padding: "10px 14px", background: T.amber + "10", borderRadius: 8, textAlign: "center", margin: "0 6px" }}>
                    <div style={{ color: T.amber, fontWeight: 900, fontSize: 14 }}>{a.vendor_name}</div>
                  </div>
                ))}
                {[
                  ["Total Quote", (a) => `GHS ${(a.quote_amount || 0).toLocaleString()}`],
                  ["vs Budget", (a) => { if (!activeBudget) return "No budget set"; const v = (((a.quote_amount - activeBudget) / activeBudget) * 100).toFixed(1); return parseFloat(v) <= 0 ? `✓ ${Math.abs(v)}% under budget` : `⚠ ${v}% over budget`; }],
                  ["Vendor Rating", (a) => { const vp = vendorProfiles.find(v => v.id === a.vendor_id); if (!vp || !vp.vendor_scorecard_count) return "Unrated"; const t = getTier(vp.vendor_score || 0); return `${t.label} (${vp.vendor_score}%)`; }],
                  ["Experience", (a) => { const c = pastEvents.filter(e => e.vendor_id === a.vendor_id && e.quote_submitted_at).length; return c > 0 ? `${c} event${c>1?"s":""} with Stretchfield` : "New vendor"; }],
                  ["Response Speed", (a) => { if (!a.quote_submitted_at || !a.created_at) return "—"; const d = Math.ceil((new Date(a.quote_submitted_at) - new Date(a.created_at))/(1000*60*60*24)); return `${d} day${d!==1?"s":""}`; }],
                  ["Document", (a) => a.quote_document_url ? "✓ Submitted" : "✗ Not submitted"],
                  ["Payment Terms", (a) => { const va = vendorApps.find(v => v.vendor_name === a.vendor_name); return va?.payment_terms || "Not specified"; }],
                  ["Submitted", (a) => a.quote_submitted_at ? new Date(a.quote_submitted_at).toLocaleDateString("en-GB") : "—"],
                ].map(([label, fn]) => (
                  <React.Fragment key={label}>
                    <div style={{ padding: "10px 0", color: T.textMuted, fontSize: 12, display: "flex", alignItems: "center" }}>{label}</div>
                    {compareData.map(a => (
                      <div key={a.id} style={{ padding: "10px 14px", textAlign: "center", borderBottom: `1px solid ${T.border}44` }}>
                        <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600 }}>{fn(a)}</span>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {quotedAssignments.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 13 }}>No quotes submitted for this RFF yet.</div>
          )}
        </>
      )}

      {!selectedRff && (
        <div style={{ textAlign: "center", padding: "60px 0", background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Select an Event and RFF</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>Choose an event and RFF above to compare vendor quotes.</div>
        </div>
      )}

      {/* Award Modal */}
      {awardModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setAwardModal(null)}>
          <div style={{ background: T.surface, border: `1px solid #10B98140`, borderRadius: 16, width: "100%", maxWidth: 500, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Award Contract</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>Nominate {awardModal.vendor_name} for this RFF</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 12, marginBottom: 16, background: T.bg, borderRadius: 8, padding: "12px 14px" }}>
              <div><div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Vendor</div><div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 13, marginTop: 3 }}>{awardModal.vendor_name}</div></div>
              <div><div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Original Quote</div><div style={{ color: "#10B981", fontWeight: 900, fontSize: 16, marginTop: 3 }}>GHS {(awardModal.quote_amount || 0).toLocaleString()}</div></div>
              <div><div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Proposed Budget</div><div style={{ color: T.cyan, fontWeight: 700, fontSize: 13, marginTop: 3 }}>GHS {totalBudget.toLocaleString()}</div></div>
              <div><div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Variance</div><div style={{ color: (parseFloat(agreedAmount)||awardModal.quote_amount) <= totalBudget ? T.teal : T.red, fontWeight: 700, fontSize: 13, marginTop: 3 }}>{(parseFloat(agreedAmount)||awardModal.quote_amount) <= totalBudget ? "✓ Within budget" : `⚠ Over by GHS ${((parseFloat(agreedAmount)||awardModal.quote_amount) - totalBudget).toLocaleString()}`}</div></div>
            </div>

            {/* Agreed Amount — editable */}
            <div style={{ marginBottom: 16, background: T.amber+"10", border: `1px solid ${T.amber}30`, borderRadius: 8, padding: "12px 14px" }}>
              <label style={{ color: T.amber, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Agreed Amount (GHS) — edit if negotiated</label>
              <input type="number" value={agreedAmount} onChange={e => setAgreedAmount(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.amber}40`, borderRadius: 8, color: T.textPrimary, fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                placeholder={awardModal.quote_amount || "Enter agreed amount"} />
              {agreedAmount && parseFloat(agreedAmount) !== awardModal.quote_amount && (
                <div style={{ color: T.amber, fontSize: 11, marginTop: 5, fontWeight: 600 }}>
                  {parseFloat(agreedAmount) < awardModal.quote_amount
                    ? `✓ Negotiated down by GHS ${(awardModal.quote_amount - parseFloat(agreedAmount)).toLocaleString()}`
                    : `↑ Increased by GHS ${(parseFloat(agreedAmount) - awardModal.quote_amount).toLocaleString()}`}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Award Notes (sent to CEO)</label>
              <textarea value={awardNotes} onChange={e => setAwardNotes(e.target.value)} rows={3} placeholder="Reason for selection, notes for CEO..." style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleAward} disabled={saving} style={{ background: "linear-gradient(135deg, #10B981, #059669)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Submitting..." : "🏆 Nominate & Send to CEO"}</button>
              <button onClick={() => setAwardModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RFFApprovalsView = ({ user }) => {
  const [rffs, setRffs] = useState([]);
  const [actionModal, setActionModal] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [budgetLines, setBudgetLines] = useState([{ category: "", proposed_amount: "", notes: "" }]);
  const [budgetEditModal, setBudgetEditModal] = useState(null);
  const [existingBudgets, setExistingBudgets] = useState([]);
  const [allRffs, setAllRffs] = useState([]);

  const load = () => {
    supabase.from("rffs").select("*").in("status", ["pending", "declined"]).eq("approved", false).order("created_at", { ascending: false }).then(({ data }) => setRffs(data || []));
    supabase.from("rffs").select("*").eq("approved", true).order("created_at", { ascending: false }).then(({ data }) => setAllRffs(data || []));
    supabase.from("rff_budgets").select("*").then(({ data }) => setExistingBudgets(data || []));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (rff) => {
    setSaving(true);
    await supabase.from("rffs").update({ approved: true, status: "approved", status_notes: notes }).eq("id", rff.id);
    // Save budget lines
    const validLines = budgetLines.filter(l => l.category && l.proposed_amount);
    if (validLines.length > 0) {
      await supabase.from("rff_budgets").insert(validLines.map(l => ({
        rff_id: rff.id,
        category: l.category,
        proposed_amount: parseFloat(l.proposed_amount) || 0,
        notes: l.notes || "",
        created_by: user.id,
      })));
    }
    // Notify Vendor Manager
    const { data: vms } = await supabase.from("profiles").select("id").eq("role", "Vendor Manager");
    if (vms) await Promise.all(vms.map(async vm => {
      await supabase.from("notifications").insert({ user_id: vm.id, title: "RFF Approved with Budget", message: `RFF "${rff.title}" for ${rff.event_name} has been approved with proposed budget. Proceed to vendor assignment.`, type: "rff" });
      const { data: vmProfile } = await supabase.from("profiles").select("email, name").eq("id", vm.id).single();
      if (vmProfile?.email) await sendEmail(vmProfile.email, `RFF Approved — ${rff.title}`, notifEmailHtml({ name: vmProfile.name, title: "RFF Approved with Budget", message: `RFF "${rff.title}" for ${rff.event_name} has been approved with proposed budget. You may now proceed to vendor assignment.`, actionUrl: BASE_URL, actionLabel: "Go to Vendor Assignment" }));
    }));
    setSaving(false); setActionModal(null); setNotes(""); setBudgetLines([{ category: "", proposed_amount: "", notes: "" }]); load();
  };

  const handleDecline = async (rff) => {
    if (!notes) { alert("Please add notes explaining why this RFF is declined."); return; }
    setSaving(true);
    await supabase.from("rffs").update({ approved: false, status: "declined", declined_notes: notes }).eq("id", rff.id);
    // Notify Vendor Manager
    const { data: vms } = await supabase.from("profiles").select("id").eq("role", "Vendor Manager");
    if (vms) await Promise.all(vms.map(async vm => {
      await supabase.from("notifications").insert({ user_id: vm.id, title: "RFF Declined", message: `RFF "${rff.title}" was declined. Notes: ${notes}`, type: "rff" });
      const { data: vmProfile } = await supabase.from("profiles").select("email, name").eq("id", vm.id).single();
      if (vmProfile?.email) await sendEmail(vmProfile.email, `RFF Declined — ${rff.title}`, notifEmailHtml({ name: vmProfile.name, title: "RFF Declined", message: `RFF "${rff.title}" was declined by the CEO.<br><br><strong>Notes:</strong> ${notes}`, actionUrl: BASE_URL, actionLabel: "View RFF" }));
    }));
    setSaving(false); setActionModal(null); setNotes(""); load();
  };

  const pending = rffs.filter(r => r.status === "pending");
  const declined = rffs.filter(r => r.status === "declined");

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Procurement</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>RFF Approval Queue</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{pending.length} pending review</div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Pending Review", value: pending.length, color: T.amber },
          { label: "Approved", value: rffs.filter(r => r.approved).length, color: T.teal },
          { label: "Declined", value: rffs.filter(r => r.status === "declined").length, color: T.red },
        ].map((k, i) => (
          <div key={i} style={{ padding: "16px 18px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 22, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {rffs.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16 }}>No RFFs awaiting approval</div>
          <div style={{ color: T.textMuted, fontSize: 13, marginTop: 8 }}>New RFF submissions will appear here.</div>
        </Card>
      ) : (
        <div>
          {pending.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Pending Review ({pending.length})</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {pending.map(r => (
                  <Card key={r.id} style={{ borderLeft: "3px solid " + T.amber, marginBottom: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>{r.title}</div>
                        <div style={{ color: T.cyan, fontSize: 12, marginTop: 3, fontWeight: 600 }}>📁 {r.event_name}</div>
                        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>🏢 {r.client_name} · Due {r.deadline}</div>
                        {r.description && <div style={{ color: T.textSecondary, fontSize: 12, marginTop: 6 }}>{r.description}</div>}
                      </div>
                      <Badge status="pending" />
                    </div>
                    {r.document_url && <a href={r.document_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.cyan, fontSize: 12, fontWeight: 600, textDecoration: "none", background: T.cyan + "15", padding: "5px 12px", borderRadius: 6, border: "1px solid " + T.cyan + "33", marginBottom: 12 }}>📄 View RFF Document</a>}
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button onClick={() => { setActionModal({ rff: r, action: "approve" }); setNotes(""); setBudgetLines([{ category: "", proposed_amount: "", notes: "" }]); }} style={{ flex: 1, padding: "8px", background: T.teal + "20", border: "1px solid " + T.teal + "44", borderRadius: 8, cursor: "pointer", color: T.teal, fontSize: 12, fontWeight: 700 }}>✓ Approve + Budget</button>
                      <button onClick={() => { setActionModal({ rff: r, action: "decline" }); setNotes(""); }} style={{ flex: 1, padding: "8px", background: "#F43F5E15", border: "1px solid #F43F5E44", borderRadius: 8, cursor: "pointer", color: "#F43F5E", fontSize: 12, fontWeight: 700 }}>✕ Decline</button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {declined.length > 0 && (
            <div>
              <div style={{ color: T.textSecondary, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Previously Declined ({declined.length})</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {declined.map(r => (
                  <Card key={r.id} style={{ borderLeft: "3px solid #F43F5E", marginBottom: 0 }}>
                    <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{r.title}</div>
                    <div style={{ color: T.cyan, fontSize: 12, fontWeight: 600 }}>📁 {r.event_name}</div>
                    {r.declined_notes && <div style={{ marginTop: 8, padding: "8px 12px", background: "#F43F5E10", border: "1px solid #F43F5E33", borderRadius: 6 }}><div style={{ color: "#F43F5E", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>Decline Notes:</div><div style={{ color: T.textSecondary, fontSize: 12 }}>{r.declined_notes}</div></div>}
                    <button onClick={() => { setActionModal({ rff: r, action: "approve" }); setNotes(""); }} style={{ marginTop: 10, width: "100%", padding: "8px", background: T.teal + "20", border: "1px solid " + T.teal + "44", borderRadius: 8, cursor: "pointer", color: T.teal, fontSize: 12, fontWeight: 700 }}>✓ Approve Now</button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


      {/* ── Approved RFFs — CEO can edit budgets ── */}
      {allRffs.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Approved RFFs — Edit Budgets</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {["RFF Title","Event","Budget Lines","Total Budget",""].map((h,i) => (
                    <th key={i} style={{ padding: "10px 14px", textAlign: "left", color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRffs.map((rff, i) => {
                  const rfBudgets = existingBudgets.filter(b => b.rff_id === rff.id);
                  const total = rfBudgets.reduce((s, b) => s + (b.proposed_amount || 0), 0);
                  return (
                    <tr key={rff.id} style={{ borderBottom: i < allRffs.length-1 ? `1px solid ${T.border}44` : "none" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.bg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "10px 14px", color: T.textPrimary, fontWeight: 700, fontSize: 13 }}>{rff.title}</td>
                      <td style={{ padding: "10px 14px", color: T.textMuted, fontSize: 12 }}>{rff.event_name}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {rfBudgets.length === 0 ? (
                          <span style={{ color: T.amber, fontSize: 11, fontWeight: 700 }}>No budget set</span>
                        ) : (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {rfBudgets.map(b => (
                              <span key={b.id} style={{ background: T.cyan+"15", color: T.cyan, border: `1px solid ${T.cyan}30`, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{b.category}: GHS {(b.proposed_amount||0).toLocaleString()}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", color: total > 0 ? T.teal : T.textMuted, fontWeight: 700, fontSize: 13 }}>{total > 0 ? `GHS ${total.toLocaleString()}` : "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <button onClick={() => {
                          const existing = existingBudgets.filter(b => b.rff_id === rff.id);
                          setBudgetEditModal(rff);
                          setBudgetLines(existing.length > 0 ? existing.map(b => ({ id: b.id, category: b.category, proposed_amount: b.proposed_amount, notes: b.notes || "" })) : [{ category: "", proposed_amount: "", notes: "" }]);
                        }} style={{ background: T.cyan+"15", border: `1px solid ${T.cyan}30`, color: T.cyan, padding: "5px 14px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                          {existingBudgets.filter(b => b.rff_id === rff.id).length > 0 ? "✎ Edit Budget" : "+ Add Budget"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget Edit Modal */}
      {budgetEditModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setBudgetEditModal(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 620, maxHeight: "85vh", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Edit Budget — {budgetEditModal.title}</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>{budgetEditModal.event_name} · {budgetEditModal.client_name}</div>

            <div style={{ color: T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${T.cyan}30` }}>Budget Line Items</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 32px", gap: 8, marginBottom: 6 }}>
              {["Category","Proposed Amount (GHS)","Notes",""].map((h,i) => (
                <div key={i} style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>
            {budgetLines.map((line, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 32px", gap: 8, marginBottom: 8 }}>
                <select value={line.category} onChange={e => { const l = [...budgetLines]; l[idx].category = e.target.value; setBudgetLines(l); }} style={{ padding: "7px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: line.category ? T.textPrimary : T.textMuted, fontSize: 12, fontFamily: "inherit", outline: "none" }}>
                  <option value="">Select category...</option>
                  {["Event Lighting","Photography","Videography","Catering","Entertainment Provider (MC, DJ, Live Band, Performers)","Event Decor","Event Production Company","Event Refreshment","Furniture & Equipment Rental","Gift & Merchandise Supplier","Health & Safety Provider","Printing Company","Registration & Badging Service","Security Service","Technology Provider","Transportation (Shuttle, Car Rental)","Venue Provider","Other"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" value={line.proposed_amount} onChange={e => { const l = [...budgetLines]; l[idx].proposed_amount = e.target.value; setBudgetLines(l); }} placeholder="0.00" style={{ padding: "7px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                <input value={line.notes || ""} onChange={e => { const l = [...budgetLines]; l[idx].notes = e.target.value; setBudgetLines(l); }} placeholder="Notes..." style={{ padding: "7px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                <button onClick={() => setBudgetLines(budgetLines.filter((_,i) => i !== idx))} style={{ background: T.red+"18", border: `1px solid ${T.red}30`, color: T.red, borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>×</button>
              </div>
            ))}
            <button onClick={() => setBudgetLines([...budgetLines, { category: "", proposed_amount: "", notes: "" }])} style={{ background: "none", border: `1px dashed ${T.border}`, color: T.textMuted, padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12, width: "100%", marginTop: 4, marginBottom: 20 }}>+ Add Line Item</button>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={async () => {
                setSaving(true);
                const validLines = budgetLines.filter(l => l.category && l.proposed_amount);
                // Delete existing budgets for this RFF
                await supabase.from("rff_budgets").delete().eq("rff_id", budgetEditModal.id);
                // Insert new ones
                if (validLines.length > 0) {
                  await supabase.from("rff_budgets").insert(validLines.map(l => ({
                    rff_id: budgetEditModal.id,
                    category: l.category,
                    proposed_amount: parseFloat(l.proposed_amount) || 0,
                    notes: l.notes || "",
                    created_by: user.id,
                  })));
                }
                setSaving(false);
                setBudgetEditModal(null);
                load();
              }} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Saving..." : "Save Budget"}</button>
              <button onClick={() => setBudgetEditModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* RFF Action Modal with Budget Template */}
      {actionModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setActionModal(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{actionModal.action === "approve" ? "Approve RFF + Set Budget" : "Decline RFF"}</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>{actionModal.rff.title} · {actionModal.rff.event_name}</div>

            {actionModal.action === "approve" && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${T.cyan}30` }}>Proposed Budget Template</div>
                <div style={{ color: T.textMuted, fontSize: 11, marginBottom: 10 }}>Add budget line items for this RFF. These will be used to compare vendor quotes.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 32px", gap: 8, marginBottom: 6 }}>
                  {["Category","Proposed Amount (GHS)","Notes",""].map((h,i) => (
                    <div key={i} style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</div>
                  ))}
                </div>
                {budgetLines.map((line, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 32px", gap: 8, marginBottom: 8 }}>
                    <select value={line.category} onChange={e => { const l = [...budgetLines]; l[idx].category = e.target.value; setBudgetLines(l); }} style={{ padding: "7px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: line.category ? T.textPrimary : T.textMuted, fontSize: 12, fontFamily: "inherit", outline: "none" }}>
                      <option value="">Select category...</option>
                      {["Event Lighting","Photography","Videography","Catering","Entertainment Provider (MC, DJ, Live Band, Performers)","Event Decor","Event Production Company","Event Refreshment","Furniture & Equipment Rental","Gift & Merchandise Supplier","Health & Safety Provider","Printing Company","Registration & Badging Service","Security Service","Technology Provider","Transportation (Shuttle, Car Rental)","Venue Provider","Other"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="number" value={line.proposed_amount} onChange={e => { const l = [...budgetLines]; l[idx].proposed_amount = e.target.value; setBudgetLines(l); }} placeholder="0.00" style={{ padding: "7px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    <input value={line.notes} onChange={e => { const l = [...budgetLines]; l[idx].notes = e.target.value; setBudgetLines(l); }} placeholder="Notes..." style={{ padding: "7px 10px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textPrimary, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                    <button onClick={() => setBudgetLines(budgetLines.filter((_,i) => i !== idx))} style={{ background: T.red+"18", border: `1px solid ${T.red}30`, color: T.red, borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>×</button>
                  </div>
                ))}
                <button onClick={() => setBudgetLines([...budgetLines, { category: "", proposed_amount: "", notes: "" }])} style={{ background: "none", border: `1px dashed ${T.border}`, color: T.textMuted, padding: "6px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12, width: "100%", marginTop: 4 }}>+ Add Line Item</button>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>{actionModal.action === "approve" ? "Approval Notes (optional)" : "Reason for Decline *"}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add notes..." style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {actionModal.action === "approve" ? (
                <button onClick={() => handleApprove(actionModal.rff)} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.teal}, #10B981)`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Approving..." : "✓ Approve & Send Budget"}</button>
              ) : (
                <button onClick={() => handleDecline(actionModal.rff)} disabled={saving} style={{ background: T.red+"18", border: `1px solid ${T.red}40`, color: T.red, padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Declining..." : "✕ Decline RFF"}</button>
              )}
              <button onClick={() => setActionModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── VENDOR ASSIGNMENT TAB ────────────────────────────────────────────────────

const VendorApplicationModal = ({ user, onClose, onSubmitted }) => {
  const [form, setForm] = useState({
    vendor_name: "", vendor_type: "", contact_person: "", contact_email: "",
    phone: "", address: "", country: "", bank_name: "", bank_address: "",
    bank_account_name: "", account_no: "", swift_code: "", bank_phone: "",
    bank_email: "", payment_terms: "", form_completed_by: "", position_in_company: "",
    signature: "", date_submitted: new Date().toISOString().slice(0,10),
  });
  const [busRegFile, setBusRegFile] = useState(null);
  const [vatFile, setVatFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busRegRef = React.useRef();
  const vatRef = React.useRef();

  const vendorTypes = ["Event Lighting","Photography","Videography","Catering","Entertainment Provider (MC, DJ, Live Band, Performers)","Event Decor","Event Production Company","Event Refreshment","Furniture & Equipment Rental","Gift & Merchandise Supplier","Health & Safety Provider","Printing Company","Registration & Badging Service","Security Service","Technology Provider","Transportation (Shuttle, Car Rental)","Venue Provider","Other"];

  const inputStyle = { width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 };
  const sectionStyle = { color: T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 20, paddingBottom: 6, borderBottom: `1px solid ${T.cyan}30` };

  const uploadFile = async (file, bucket) => {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const filename = `${bucket}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("vendor-docs").upload(filename, file, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("vendor-docs").getPublicUrl(filename);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!form.vendor_name || !form.contact_email || !form.contact_person) {
      setError("Please fill in Vendor Name, Contact Person and Email.");
      return;
    }
    setSaving(true);
    setError("");

    const busRegUrl = await uploadFile(busRegFile, "bus_reg");
    const vatUrl = await uploadFile(vatFile, "vat");

    const { error: insErr } = await supabase.from("vendor_applications").insert({
      ...form,
      business_reg_url: busRegUrl,
      vat_cert_url: vatUrl,
      submitted_by: user.id,
      status: "pending",
    });

    if (insErr) { setError("Submit failed: " + insErr.message); setSaving(false); return; }

    // Notify CEO
    const { data: ceos } = await supabase.from("profiles").select("id, email, name").eq("role", "CEO");
    for (const ceo of ceos || []) {
      await supabase.from("notifications").insert({
        user_id: ceo.id,
        title: "New Vendor Application",
        message: `${form.vendor_name} has been submitted for approval by ${user.name}.`,
        type: "task",
      });
      if (ceo.email) await sendEmail(ceo.email, `New Vendor Application — ${form.vendor_name}`, notifEmailHtml({ name: ceo.name, title: "New Vendor Application", message: `<strong>${form.vendor_name}</strong> has been submitted for approval by ${user.name}. Please log in to review the application.`, actionUrl: BASE_URL, actionLabel: "Review Application" }));
    }

    setSaving(false);
    onSubmitted();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "90vh", overflow: "auto", padding: 28, boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Vendor Onboarding</div>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 20 }}>New Vendor Application</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        {/* Vendor Info */}
        <div style={sectionStyle}>Vendor Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Vendor Name *</label><input value={form.vendor_name} onChange={e => setForm({...form, vendor_name: e.target.value})} style={inputStyle} placeholder="Company / Vendor name" /></div>
          <div><label style={labelStyle}>Vendor Type</label>
            <select value={form.vendor_type} onChange={e => setForm({...form, vendor_type: e.target.value})} style={inputStyle}>
              <option value="">Select type...</option>
              {vendorTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Contact Person *</label><input value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} style={inputStyle} placeholder="Full name" /></div>
          <div><label style={labelStyle}>Contact Email *</label><input type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} style={inputStyle} placeholder="email@company.com" /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Phone Number</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={inputStyle} placeholder="+233 XX XXX XXXX" /></div>
          <div><label style={labelStyle}>Country</label><input value={form.country} onChange={e => setForm({...form, country: e.target.value})} style={inputStyle} placeholder="Ghana" /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Address</label><textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2} style={{...inputStyle, resize: "vertical"}} placeholder="Full address" /></div>

        {/* Documents */}
        <div style={sectionStyle}>Documents</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Business Registration Certificate</label>
            <div onClick={() => busRegRef.current.click()} style={{ border: `2px dashed ${T.border}`, borderRadius: 8, padding: "14px", textAlign: "center", cursor: "pointer", background: T.bg }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.cyan + "60"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ color: T.textMuted, fontSize: 12 }}>{busRegFile ? `✓ ${busRegFile.name}` : "Drop file here or browse"}</div>
            </div>
            <input ref={busRegRef} type="file" onChange={e => setBusRegFile(e.target.files[0])} style={{ display: "none" }} />
          </div>
          <div>
            <label style={labelStyle}>VAT Certificate (if any)</label>
            <div onClick={() => vatRef.current.click()} style={{ border: `2px dashed ${T.border}`, borderRadius: 8, padding: "14px", textAlign: "center", cursor: "pointer", background: T.bg }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.cyan + "60"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
              <div style={{ color: T.textMuted, fontSize: 12 }}>{vatFile ? `✓ ${vatFile.name}` : "Drop file here or browse"}</div>
            </div>
            <input ref={vatRef} type="file" onChange={e => setVatFile(e.target.files[0])} style={{ display: "none" }} />
          </div>
        </div>

        {/* Bank Details */}
        <div style={sectionStyle}>Bank Details</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Bank Name</label><input value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})} style={inputStyle} placeholder="Bank name" /></div>
          <div><label style={labelStyle}>Bank Account Name</label><input value={form.bank_account_name} onChange={e => setForm({...form, bank_account_name: e.target.value})} style={inputStyle} placeholder="Account name" /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Account Number</label><input value={form.account_no} onChange={e => setForm({...form, account_no: e.target.value})} style={inputStyle} placeholder="Account number" /></div>
          <div><label style={labelStyle}>Swift Code</label><input value={form.swift_code} onChange={e => setForm({...form, swift_code: e.target.value})} style={inputStyle} placeholder="SWIFT/BIC code" /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Bank Address</label><input value={form.bank_address} onChange={e => setForm({...form, bank_address: e.target.value})} style={inputStyle} placeholder="Bank branch address" /></div>
          <div><label style={labelStyle}>Bank Telephone</label><input value={form.bank_phone} onChange={e => setForm({...form, bank_phone: e.target.value})} style={inputStyle} placeholder="+233 XX XXX XXXX" /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Bank Email</label><input value={form.bank_email} onChange={e => setForm({...form, bank_email: e.target.value})} style={inputStyle} placeholder="bank@email.com" /></div>
          <div><label style={labelStyle}>Payment Terms</label><input value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})} style={inputStyle} placeholder="e.g. Net 30, 50% upfront" /></div>
        </div>



        {error && <div style={{ color: T.red, fontSize: 12, marginBottom: 12, padding: "8px 12px", background: T.red + "12", borderRadius: 8 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSubmit} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "11px 28px", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 13, opacity: saving ? 0.7 : 1 }}>{saving ? "Submitting..." : "Submit for CEO Approval"}</button>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "11px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const VendorApprovalsPanel = ({ user, onLoginCreated }) => {
  const [apps, setApps] = useState([]);
  const [previewApp, setPreviewApp] = useState(null);
  const [loginModal, setLoginModal] = useState(null);
  const [declineModal, setDeclineModal] = useState(null);
  const [ceoNotes, setCeoNotes] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);

  const load = async () => {
    const [{ data: appData }, { data: vpData }] = await Promise.all([
      supabase.from("vendor_applications").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "Vendor").order("name"),
    ]);
    setApps(appData || []);
    setVendorProfiles(vpData || []);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (app) => {
    await supabase.from("vendor_applications").update({ status: "approved", approved_by: user.id }).eq("id", app.id);
    // Notify vendor manager who submitted
    if (app.submitted_by) {
      await supabase.from("notifications").insert({
        user_id: app.submitted_by,
        title: "Vendor Application Approved",
        message: `${app.vendor_name} has been approved by the CEO. You can now create their login.`,
        type: "task",
      });
    }
    setPreviewApp(null);
    load();
  };

  const handleDecline = async () => {
    if (!ceoNotes.trim()) { alert("Please add notes explaining the decline reason."); return; }
    setSaving(true);
    await supabase.from("vendor_applications").update({ status: "declined", ceo_notes: ceoNotes }).eq("id", declineModal.id);
    // Notify vendor manager
    if (declineModal.submitted_by) {
      await supabase.from("notifications").insert({
        user_id: declineModal.submitted_by,
        title: "Vendor Application Declined",
        message: `${declineModal.vendor_name} was declined. CEO notes: ${ceoNotes.slice(0, 100)}`,
        type: "task",
      });
    }
    setSaving(false);
    setDeclineModal(null);
    setCeoNotes("");
    setPreviewApp(null);
    load();
  };

  const handleCreateLogin = async () => {
    if (!password || password.length < 8) { alert("Password must be at least 8 characters."); return; }
    setSaving(true);
    const app = loginModal;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("https://okbduzenceoknkjqnrha.supabase.co/functions/v1/create-vendor-login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
      body: JSON.stringify({
        email: app.contact_email, password,
        name: app.vendor_name, phone: app.phone,
        company_name: app.vendor_name, service_category: app.vendor_type,
        application_id: app.id,
      }),
    });
    const result = await res.json();
    if (result.error) { alert("Failed: " + result.error); setSaving(false); return; }
    setCreatedCreds({ email: app.contact_email, password });
    // Send welcome email to vendor
    await sendEmail(
      app.contact_email,
      "Welcome to Stretchfield WorkRoom — Your Vendor Portal Access",
      welcomeEmailHtml({ name: app.vendor_name, email: app.contact_email, password, role: "Vendor" })
    );
    setLoginModal(null);
    setSaving(false);
    load();
    if (onLoginCreated) onLoginCreated();
  };

  const statusColor = { pending: T.amber, approved: T.teal, declined: T.red, "login-created": "#10B981" };
  const statusLabel = { pending: "Pending Review", approved: "Approved", declined: "Declined", "login-created": "Login Created" };

  const FieldRow = ({ label, value }) => value ? (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8, padding: "7px 0", borderBottom: `1px solid ${T.border}44` }}>
      <div style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ color: T.textPrimary, fontSize: 12 }}>{value}</div>
    </div>
  ) : null;

  return (
    <div>
      {createdCreds && (
        <div style={{ background: T.teal + "15", border: `1px solid ${T.teal}40`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ color: T.teal, fontWeight: 800, fontSize: 14, marginBottom: 8 }}>✓ Vendor Login Created</div>
          <div style={{ color: T.textPrimary, fontSize: 13 }}>Email: <strong>{createdCreds.email}</strong></div>
          <div style={{ color: T.textPrimary, fontSize: 13 }}>Password: <strong>{createdCreds.password}</strong></div>
          <div style={{ color: T.textMuted, fontSize: 11, marginTop: 6 }}>Share these credentials with the vendor securely.</div>
          <button onClick={() => setCreatedCreds(null)} style={{ marginTop: 8, background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>Dismiss</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {apps.length === 0 && <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 30 }}>No vendor applications yet.</div>}
        {apps.map(app => (
          <div key={app.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${statusColor[app.status] || T.textMuted}`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>{app.vendor_name}</div>
                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{app.vendor_type} · {app.contact_person} · {app.contact_email}</div>
                <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{app.country} · Submitted {new Date(app.created_at).toLocaleDateString("en-GB")}</div>
                {app.ceo_notes && app.status === "declined" && (
                  <div style={{ marginTop: 8, padding: "8px 10px", background: T.red + "12", border: `1px solid ${T.red}30`, borderRadius: 6 }}>
                    <div style={{ color: T.red, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>CEO Notes</div>
                    <div style={{ color: T.textSecondary, fontSize: 12 }}>{app.ceo_notes}</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginLeft: 12 }}>
                <span style={{ background: (statusColor[app.status] || T.textMuted) + "18", color: statusColor[app.status] || T.textMuted, border: `1px solid ${(statusColor[app.status] || T.textMuted)}30`, borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{statusLabel[app.status] || app.status}</span>
                <button onClick={() => setPreviewApp(app)} style={{ background: T.cyan + "15", border: `1px solid ${T.cyan}30`, color: T.cyan, padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Preview Form</button>
              </div>
            </div>
            {user?.role === "CEO" && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {app.status === "pending" && (
                  <>
                    <button onClick={() => handleApprove(app)} style={{ background: T.teal + "18", border: `1px solid ${T.teal}40`, color: T.teal, padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓ Approve</button>
                    <button onClick={() => { setDeclineModal(app); setCeoNotes(""); }} style={{ background: T.red + "18", border: `1px solid ${T.red}40`, color: T.red, padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✗ Decline with Notes</button>
                  </>
                )}
                {app.status === "approved" && (
                  <button onClick={() => { setLoginModal(app); setPassword(generatePassword(app.contact_email || "")); }} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>🔑 Create Login</button>
                )}
                {app.status === "login-created" && <span style={{ color: "#10B981", fontSize: 12, fontWeight: 700 }}>✓ Portal access granted</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewApp && (
        <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setPreviewApp(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "90vh", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Vendor Application</div>
                <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 20 }}>{previewApp.vendor_name}</div>
                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Submitted {new Date(previewApp.created_at).toLocaleDateString("en-GB")}</div>
              </div>
              <button onClick={() => setPreviewApp(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
            </div>

            {/* Vendor Info */}
            <div style={{ color: T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${T.cyan}30` }}>Vendor Information</div>
            <FieldRow label="Vendor Name" value={previewApp.vendor_name} />
            <FieldRow label="Vendor Type" value={previewApp.vendor_type} />
            <FieldRow label="Contact Person" value={previewApp.contact_person} />
            <FieldRow label="Contact Email" value={previewApp.contact_email} />
            <FieldRow label="Phone" value={previewApp.phone} />
            <FieldRow label="Address" value={previewApp.address} />
            <FieldRow label="Country" value={previewApp.country} />

            {/* Documents */}
            <div style={{ color: T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: "16px 0 10px", paddingBottom: 6, borderBottom: `1px solid ${T.cyan}30` }}>Documents</div>
            <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
              {previewApp.business_reg_url ? <a href={previewApp.business_reg_url} target="_blank" rel="noopener noreferrer" style={{ color: T.cyan, fontSize: 12, fontWeight: 700 }}>📄 Business Registration</a> : <span style={{ color: T.textMuted, fontSize: 12 }}>No business registration uploaded</span>}
              {previewApp.vat_cert_url && <a href={previewApp.vat_cert_url} target="_blank" rel="noopener noreferrer" style={{ color: T.cyan, fontSize: 12, fontWeight: 700 }}>📄 VAT Certificate</a>}
            </div>

            {/* Bank Details */}
            <div style={{ color: T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: "16px 0 10px", paddingBottom: 6, borderBottom: `1px solid ${T.cyan}30` }}>Bank Details</div>
            <FieldRow label="Bank Name" value={previewApp.bank_name} />
            <FieldRow label="Account Name" value={previewApp.bank_account_name} />
            <FieldRow label="Account Number" value={previewApp.account_no} />
            <FieldRow label="Swift Code" value={previewApp.swift_code} />
            <FieldRow label="Bank Address" value={previewApp.bank_address} />
            <FieldRow label="Bank Phone" value={previewApp.bank_phone} />
            <FieldRow label="Bank Email" value={previewApp.bank_email} />
            <FieldRow label="Payment Terms" value={previewApp.payment_terms} />

            {/* CEO Notes if declined */}
            {previewApp.ceo_notes && (
              <div style={{ marginTop: 16, padding: "12px 14px", background: T.red + "12", border: `1px solid ${T.red}30`, borderRadius: 8 }}>
                <div style={{ color: T.red, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>CEO Decline Notes</div>
                <div style={{ color: T.textSecondary, fontSize: 13 }}>{previewApp.ceo_notes}</div>
              </div>
            )}

            {/* Action buttons in preview */}
            {user?.role === "CEO" && previewApp.status === "pending" && (
              <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <button onClick={() => handleApprove(previewApp)} style={{ background: `linear-gradient(135deg, ${T.teal}, #10B981)`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>✓ Approve</button>
                <button onClick={() => { setDeclineModal(previewApp); setCeoNotes(""); setPreviewApp(null); }} style={{ background: T.red + "18", border: `1px solid ${T.red}40`, color: T.red, padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>✗ Decline with Notes</button>
                <button onClick={() => setPreviewApp(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Close</button>
              </div>
            )}
            {user?.role === "CEO" && previewApp.status === "approved" && (
              <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <button onClick={() => { setLoginModal(previewApp); setPassword(generatePassword(previewApp.contact_email || "")); setPreviewApp(null); }} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>🔑 Create Login</button>
                <button onClick={() => setPreviewApp(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Decline with Notes Modal */}
      {declineModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setDeclineModal(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.red}30`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Decline Application</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>{declineModal.vendor_name} — Add notes for the Vendor Manager</div>
            <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Reason / Notes *</label>
            <textarea value={ceoNotes} onChange={e => setCeoNotes(e.target.value)} rows={4} placeholder="Explain what needs to be corrected or why this is being declined..." style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "vertical", marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleDecline} disabled={saving || !ceoNotes.trim()} style={{ background: `linear-gradient(135deg, ${T.red}, #C0192A)`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13, opacity: !ceoNotes.trim() ? 0.5 : 1 }}>{saving ? "Declining..." : "Decline & Notify"}</button>
              <button onClick={() => setDeclineModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Login Modal */}
      {loginModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setLoginModal(null)}>
          <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, padding: 28, width: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Create Vendor Login</div>
            <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>{loginModal.vendor_name} · {loginModal.contact_email}</div>
            <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Password</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Auto-generated from email" style={{ flex: 1, padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              <button onClick={() => setPassword(generatePassword(loginModal.contact_email || ""))} style={{ background: T.cyan+"15", border: `1px solid ${T.cyan}30`, color: T.cyan, padding: "9px 14px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>⚡ Generate</button>
            </div>
            {password && <div style={{ color: T.teal, fontSize: 11, marginBottom: 16 }}>✓ Password will be emailed to vendor on login creation</div>}
            {!password && <div style={{ color: T.amber, fontSize: 11, marginBottom: 16 }}>Click Generate to auto-create from vendor email</div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCreateLogin} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{saving ? "Creating..." : "Create Login"}</button>
              <button onClick={() => setLoginModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



const EditVendorAppModal = ({ app, user, onClose, onResubmitted }) => {
  const [form, setForm] = useState({
    vendor_name: app.vendor_name || "",
    vendor_type: app.vendor_type || "",
    contact_person: app.contact_person || "",
    contact_email: app.contact_email || "",
    phone: app.phone || "",
    address: app.address || "",
    country: app.country || "",
    bank_name: app.bank_name || "",
    bank_address: app.bank_address || "",
    bank_account_name: app.bank_account_name || "",
    account_no: app.account_no || "",
    swift_code: app.swift_code || "",
    bank_phone: app.bank_phone || "",
    bank_email: app.bank_email || "",
    payment_terms: app.payment_terms || "",
  });
  const [saving, setSaving] = useState(false);

  const vendorTypes = ["Event Lighting","Photography","Videography","Catering","Entertainment Provider (MC, DJ, Live Band, Performers)","Event Decor","Event Production Company","Event Refreshment","Furniture & Equipment Rental","Gift & Merchandise Supplier","Health & Safety Provider","Printing Company","Registration & Badging Service","Security Service","Technology Provider","Transportation (Shuttle, Car Rental)","Venue Provider","Other"];
  const inputStyle = { width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle = { color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 };
  const sectionStyle = { color: T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, marginTop: 20, paddingBottom: 6, borderBottom: `1px solid ${T.cyan}30` };

  const handleResubmit = async () => {
    setSaving(true);
    await supabase.from("vendor_applications").update({
      ...form,
      status: "pending",
      ceo_notes: null,
    }).eq("id", app.id);

    // Notify CEO
    const { data: ceos } = await supabase.from("profiles").select("id").eq("role", "CEO");
    for (const ceo of ceos || []) {
      await supabase.from("notifications").insert({
        user_id: ceo.id,
        title: "Vendor Application Resubmitted",
        message: `${form.vendor_name} application has been updated and resubmitted for approval.`,
        type: "task",
      });
    }
    setSaving(false);
    onResubmitted();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: T.surface, border: `1px solid ${T.amber}40`, borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "90vh", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ color: T.amber, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Edit & Resubmit</div>
            <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 20 }}>{app.vendor_name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        {/* CEO Notes */}
        {app.ceo_notes && (
          <div style={{ background: T.red + "10", border: `1px solid ${T.red}30`, borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ color: T.red, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>CEO Feedback — Please address before resubmitting</div>
            <div style={{ color: T.textSecondary, fontSize: 13 }}>{app.ceo_notes}</div>
          </div>
        )}

        {/* Vendor Info */}
        <div style={sectionStyle}>Vendor Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Vendor Name</label><input value={form.vendor_name} onChange={e => setForm({...form, vendor_name: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Vendor Type</label>
            <select value={form.vendor_type} onChange={e => setForm({...form, vendor_type: e.target.value})} style={inputStyle}>
              <option value="">Select type...</option>
              {vendorTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Contact Person</label><input value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Contact Email</label><input value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} style={inputStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Country</label><input value={form.country} onChange={e => setForm({...form, country: e.target.value})} style={inputStyle} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Address</label><textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2} style={{...inputStyle, resize: "vertical"}} /></div>

        {/* Bank Details */}
        <div style={sectionStyle}>Bank Details</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Bank Name</label><input value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Account Name</label><input value={form.bank_account_name} onChange={e => setForm({...form, bank_account_name: e.target.value})} style={inputStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Account Number</label><input value={form.account_no} onChange={e => setForm({...form, account_no: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Swift Code</label><input value={form.swift_code} onChange={e => setForm({...form, swift_code: e.target.value})} style={inputStyle} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Bank Address</label><input value={form.bank_address} onChange={e => setForm({...form, bank_address: e.target.value})} style={inputStyle} /></div>
          <div><label style={labelStyle}>Payment Terms</label><input value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})} style={inputStyle} /></div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={handleResubmit} disabled={saving} style={{ background: `linear-gradient(135deg, ${T.amber}, ${T.gold})`, border: "none", color: "#fff", padding: "11px 28px", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 13, opacity: saving ? 0.7 : 1 }}>{saving ? "Resubmitting..." : "Resubmit for Approval"}</button>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "11px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const VendorOnboardingView = ({ user }) => {
  const [tab, setTab] = useState(user?.role === "CEO" ? "applications" : "form");
  const [apps, setApps] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [editApp, setEditApp] = useState(null);

  const load = async () => {
    const [{ data: appData }, { data: vpData }] = await Promise.all([
      supabase.from("vendor_applications").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "Vendor").order("name"),
    ]);
    setApps(appData || []);
    setVendorProfiles(vpData || []);
  };

  useEffect(() => { load(); }, []);

  const tabs = user?.role === "CEO"
    ? [{ id: "applications", label: "Applications" }, { id: "active-vendors", label: "Active Vendors" }]
    : [{ id: "form", label: "New Vendor Form" }, { id: "submitted", label: "Submitted Applications" }];
  const [vendorProfiles, setVendorProfiles] = useState([]);
  const [editVendorModal, setEditVendorModal] = useState(null);
  const [editVendorForm, setEditVendorForm] = useState({});
  const [savingVendor, setSavingVendor] = useState(false);
  const VTYPES = ["Event Lighting","Photography","Videography","Catering","Entertainment Provider (MC, DJ, Live Band, Performers)","Event Decor","Event Production Company","Event Refreshment","Furniture & Equipment Rental","Gift & Merchandise Supplier","Health & Safety Provider","Printing Company","Registration & Badging Service","Security Service","Technology Provider","Transportation (Shuttle, Car Rental)","Venue Provider","Other"];

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Procurement</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
          {user?.role === "CEO" ? "Vendor Applications" : "Add New Vendor"}
        </h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>
          {user?.role === "CEO" ? `${apps.filter(a => a.status === "pending").length} pending approval` : "Submit a new vendor for CEO approval"}
        </div>
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "6px 18px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 700,
              border: `1px solid ${tab === t.id ? T.cyan : T.border}`,
              background: tab === t.id ? T.cyan + "20" : "none",
              color: tab === t.id ? T.cyan : T.textMuted,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>{t.label}</button>
          ))}
        </div>
      )}

      {/* Active Vendors Tab — CEO only */}
      {tab === "active-vendors" && user?.role === "CEO" && (
        <div>
          <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 16 }}>{vendorProfiles.length} active vendors with portal access</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vendorProfiles.map(v => {
              const linked = apps.find(a => a.contact_email === v.email);
              const tierColor = v.vendor_scorecard_count > 0 ? (v.vendor_score >= 85 ? "#10B981" : v.vendor_score >= 70 ? T.teal : v.vendor_score >= 50 ? T.amber : T.red) : T.textMuted;
              return (
                <div key={v.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: tierColor+"20", border: `1px solid ${tierColor}40`, display: "flex", alignItems: "center", justifyContent: "center", color: tierColor, fontWeight: 800, fontSize: 13 }}>{(v.name||"?").slice(0,2).toUpperCase()}</div>
                    <div>
                      <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>{v.name}</div>
                      <div style={{ color: T.textMuted, fontSize: 11 }}>{v.company_name || ""} {v.company_name && v.service_category ? "·" : ""} {v.service_category || "No category"}</div>
                      <div style={{ color: T.textMuted, fontSize: 11 }}>{v.email} {v.phone ? "· " + v.phone : ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {v.vendor_scorecard_count > 0 && <span style={{ color: tierColor, fontWeight: 700, fontSize: 13 }}>{v.vendor_score}%</span>}
                    <button onClick={() => {
                      setEditVendorModal(v);
                      setEditVendorForm({
                        name: v.name || "",
                        company_name: v.company_name || "",
                        phone: v.phone || "",
                        service_category: v.service_category || "",
                        // Bank & payment from linked application
                        bank_name: linked?.bank_name || "",
                        bank_account_name: linked?.bank_account_name || "",
                        account_number: linked?.account_number || "",
                        swift_code: linked?.swift_code || "",
                        bank_address: linked?.bank_address || "",
                        payment_terms: linked?.payment_terms || "",
                        country: linked?.country || "",
                        address: linked?.address || "",
                        contact_person: linked?.contact_person || v.name || "",
                      });
                    }} style={{ background: T.cyan+"15", border: `1px solid ${T.cyan}30`, color: T.cyan, padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✎ Edit</button>
                  </div>
                </div>
              );
            })}
            {vendorProfiles.length === 0 && <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>No active vendors yet. Approve vendor applications first.</div>}
          </div>

          {/* Vendor Edit Modal */}
          {editVendorModal && (
            <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setEditVendorModal(null)}>
              <div style={{ background: T.surface, border: `1px solid ${T.cyan}30`, borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto", padding: 28 }} onClick={e => e.stopPropagation()}>
                <div style={{ color: T.textPrimary, fontWeight: 900, fontSize: 18, marginBottom: 4 }}>Edit Vendor — {editVendorModal.name}</div>
                <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>{editVendorModal.email}</div>

                {[
                  { section: "Contact Details", fields: [
                    ["name", "Vendor / Contact Name", "text"],
                    ["company_name", "Company Name", "text"],
                    ["phone", "Phone Number", "text"],
                    ["country", "Country", "text"],
                    ["address", "Address", "text"],
                  ]},
                  { section: "Service", fields: [
                    ["contact_person", "Contact Person", "text"],
                  ]},
                  { section: "Bank Details", fields: [
                    ["bank_name", "Bank Name", "text"],
                    ["bank_account_name", "Account Name", "text"],
                    ["account_number", "Account Number", "text"],
                    ["swift_code", "Swift Code", "text"],
                    ["bank_address", "Bank Address", "text"],
                    ["payment_terms", "Payment Terms", "text"],
                  ]},
                ].map(({ section, fields }) => (
                  <div key={section}>
                    <div style={{ color: T.cyan, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, marginTop: 18, paddingBottom: 6, borderBottom: `1px solid ${T.cyan}30` }}>{section}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 10 }}>
                      {fields.map(([key, label]) => (
                        <div key={key}>
                          <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>{label}</label>
                          <input value={editVendorForm[key] || ""} onChange={e => setEditVendorForm({...editVendorForm, [key]: e.target.value})} style={{ width: "100%", padding: "8px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 16 }}>
                  <label style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Service Category</label>
                  <select value={editVendorForm.service_category} onChange={e => setEditVendorForm({...editVendorForm, service_category: e.target.value})} style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                    <option value="">Select category...</option>
                    {VTYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button onClick={async () => {
                    setSavingVendor(true);
                    // Update profile
                    await supabase.from("profiles").update({
                      name: editVendorForm.name,
                      company_name: editVendorForm.company_name,
                      phone: editVendorForm.phone,
                      service_category: editVendorForm.service_category,
                    }).eq("id", editVendorModal.id);
                    // Update linked application if exists
                    const linked = apps.find(a => a.contact_email === editVendorModal.email);
                    if (linked) {
                      await supabase.from("vendor_applications").update({
                        contact_person: editVendorForm.contact_person,
                        country: editVendorForm.country,
                        address: editVendorForm.address,
                        bank_name: editVendorForm.bank_name,
                        bank_account_name: editVendorForm.bank_account_name,
                        account_number: editVendorForm.account_number,
                        swift_code: editVendorForm.swift_code,
                        bank_address: editVendorForm.bank_address,
                        payment_terms: editVendorForm.payment_terms,
                      }).eq("id", linked.id);
                    }
                    setSavingVendor(false);
                    setEditVendorModal(null);
                    load();
                  }} disabled={savingVendor} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{savingVendor ? "Saving..." : "Save All Changes"}</button>
                  <button onClick={() => setEditVendorModal(null)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textMuted, padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Vendor Form */}
      {tab === "form" && !submitted && (
        <VendorApplicationModal
          user={user}
          onClose={() => setTab("submitted")}
          inline={true}
          onSubmitted={() => { setSubmitted(true); load(); setTab("submitted"); }}
        />
      )}

      {submitted && tab === "form" && (
        <div style={{ textAlign: "center", padding: "60px 0", background: T.surface, borderRadius: 12, border: `1px solid ${T.teal}30` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Application Submitted!</div>
          <div style={{ color: T.textMuted, fontSize: 13, marginBottom: 20 }}>The CEO has been notified and will review the application.</div>
          <button onClick={() => { setSubmitted(false); }} style={{ background: `linear-gradient(135deg, ${T.cyan}, ${T.teal})`, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Submit Another</button>
        </div>
      )}

      {/* Submitted Applications — Vendor Manager */}
      {tab === "submitted" && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {apps.filter(a => a.submitted_by === user?.id).length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: T.textMuted, fontSize: 13 }}>No applications submitted yet.</div>
            )}
            {apps.filter(a => a.submitted_by === user?.id).map(app => {
              const statusColor = { pending: T.amber, approved: T.teal, declined: T.red, "login-created": "#10B981" };
              const statusLabel = { pending: "Pending CEO Approval", approved: "Approved", declined: "Declined — Edit & Resubmit", "login-created": "Portal Access Granted" };
              return (
                <div key={app.id} style={{ background: T.surface, border: `1px solid ${statusColor[app.status] || T.border}22`, borderLeft: `3px solid ${statusColor[app.status] || T.textMuted}`, borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: app.ceo_notes ? 10 : 0 }}>
                    <div>
                      <div style={{ color: T.textPrimary, fontWeight: 800, fontSize: 14 }}>{app.vendor_name}</div>
                      <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{app.vendor_type} · {app.contact_person} · {app.contact_email}</div>
                      <div style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>{app.country} · Submitted {new Date(app.created_at).toLocaleDateString("en-GB")}</div>
                    </div>
                    <span style={{ background: (statusColor[app.status] || T.textMuted) + "18", color: statusColor[app.status] || T.textMuted, border: `1px solid ${(statusColor[app.status] || T.textMuted)}30`, borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>{statusLabel[app.status] || app.status}</span>
                  </div>
                  {app.ceo_notes && (
                    <div style={{ background: T.red + "10", border: `1px solid ${T.red}25`, borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                      <div style={{ color: T.red, fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>CEO Feedback</div>
                      <div style={{ color: T.textSecondary, fontSize: 12 }}>{app.ceo_notes}</div>
                    </div>
                  )}
                  {app.status === "declined" && (
                    <button onClick={() => setEditApp(app)} style={{ background: T.amber + "18", border: `1px solid ${T.amber}40`, color: T.amber, padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✎ Edit & Resubmit</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CEO — All Applications */}
      {tab === "applications" && (
        <VendorApprovalsPanel user={user} onLoginCreated={load} />
      )}

      {/* Edit & Resubmit Modal */}
      {editApp && (
        <EditVendorAppModal
          app={editApp}
          user={user}
          onClose={() => setEditApp(null)}
          onResubmitted={() => { setEditApp(null); load(); alert("✓ Application resubmitted for CEO approval."); }}
        />
      )}
    </div>
  );
};

const VendorAssignmentView = ({ user }) => {
  const [rffs, setRffs] = useState([]);
  const [events, setEvents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [basketModal, setBasketModal] = useState(null);

  const load = async () => {
    const [r, e, v, a] = await Promise.all([
      supabase.from("rffs").select("*").eq("approved", true).in("status", ["approved", "vendor-assigned", "quote-submitted", "quote-approved"]).order("created_at", { ascending: false }),
      supabase.from("projects").select("*"),
      supabase.from("profiles").select("*").eq("role", "Vendor"),
      supabase.from("rff_vendor_assignments").select("*"),
    ]);
    setRffs(r.data || []);
    setEvents(e.data || []);
    // Include vendors from profiles (all with role=Vendor)
    setVendors(v.data || []);
    setAssignments(a.data || []);
  };

  useEffect(() => { load(); }, []);

  // ── Upcoming Events Assignment Dashboard ──
  const today = new Date().toISOString().slice(0,10);
  const upcomingEvents = events
    .filter(e => !e.event_date || e.event_date >= today)
    .sort((a,b) => {
      if (!a.event_date && !b.event_date) return 0;
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      return a.event_date > b.event_date ? 1 : -1;
    })
    .slice(0, 3);

  const getEventVendorMap = (eventId) => {
    const eventRffs = rffs.filter(r => r.project_id === eventId);
    return eventRffs.map(rff => {
      const rffAssignments = assignments.filter(a => a.rff_id === rff.id);
      return { rff, vendors: rffAssignments };
    }).filter(x => x.vendors.length > 0);
  };

  const daysUntil = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24));
    return diff;
  };

  const assignedVendorIds = (rffId) => assignments.filter(a => a.rff_id === rffId).map(a => a.vendor_id);

  const addVendor = async (rff, vendor) => {
    setSaving(true);
    await supabase.from("rff_vendor_assignments").insert({ rff_id: rff.id, vendor_id: vendor.id, vendor_name: vendor.name, assigned_by: user.id });
    // Notify vendor
    await supabase.from("notifications").insert({ user_id: vendor.id, title: "New RFF Assignment", message: `You have been assigned to RFF: "${rff.title}" for ${rff.event_name}. Please submit your quote.`, type: "rff" });
    // Update RFF status to show vendors are being assigned
    await supabase.from("rffs").update({ status: "vendor-assigned" }).eq("id", rff.id);
    setSaving(false); load();
  };

  const removeVendor = async (rffId, vendorId) => {
    setSaving(true);
    await supabase.from("rff_vendor_assignments").delete().eq("rff_id", rffId).eq("vendor_id", vendorId);
    // Check if any vendors remain
    const { data: remaining } = await supabase.from("rff_vendor_assignments").select("id").eq("rff_id", rffId);
    if (!remaining || remaining.length === 0) await supabase.from("rffs").update({ status: "approved" }).eq("id", rffId);
    setSaving(false); load();
  };

  // Group approved RFFs by event
  const grouped = events.reduce((acc, ev) => {
    const evRffs = rffs.filter(r => r.project_id === ev.id);
    if (evRffs.length > 0) acc[ev.id] = { event: ev, rffs: evRffs };
    return acc;
  }, {});

  const TierBadge = ({ vendor }) => {
    const score = vendor.vendor_score || 0;
    const count = vendor.vendor_scorecard_count || 0;
    const isUnrated = count === 0;
    let grade, gradeColor, gradeBg, gradeLabel;
    if (isUnrated) { grade = "—"; gradeColor = T.textMuted; gradeBg = T.bg; gradeLabel = "Unrated"; }
    else if (score >= 85) { grade = "A"; gradeColor = "#10B981"; gradeBg = "#10B98115"; gradeLabel = "Excellent"; }
    else if (score >= 70) { grade = "B"; gradeColor = T.cyan; gradeBg = T.cyan + "15"; gradeLabel = "Good"; }
    else if (score >= 50) { grade = "C"; gradeColor = T.amber; gradeBg = T.amber + "15"; gradeLabel = "Fair"; }
    else { grade = "D"; gradeColor = "#F43F5E"; gradeBg = "#F43F5E15"; gradeLabel = "Do Not Engage"; }
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: gradeBg, border: "1.5px solid " + gradeColor + "66", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: gradeColor }}>{grade}</div>
        <span style={{ fontSize: 11, color: gradeColor, fontWeight: 600 }}>{gradeLabel}</span>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Procurement</div>
        <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Vendor Assignment</h2>
        <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Assign vendors to approved RFFs by event</div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16 }}>No approved RFFs yet</div>
          <div style={{ color: T.textMuted, fontSize: 13, marginTop: 8 }}>RFFs approved by CEO will appear here for vendor assignment.</div>
        </Card>
      ) : Object.values(grouped).map(({ event: ev, rffs: evRffs }) => (
        <div key={ev.id} style={{ marginBottom: 24 }}>
          <button onClick={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)} style={{ width: "100%", background: T.surface, border: "1px solid " + T.border, borderRadius: 8, padding: "14px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: expandedEvent === ev.id ? 12 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 3, height: 20, background: T.cyan, borderRadius: 2 }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>{ev.name}</div>
                <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>{ev.client} · {evRffs.length} RFF{evRffs.length > 1 ? "s" : ""}</div>
              </div>
            </div>
            <span style={{ color: T.textMuted, fontSize: 16 }}>{expandedEvent === ev.id ? "▾" : "▸"}</span>
          </button>

          {expandedEvent === ev.id && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
              {evRffs.map(rff => {
                const assigned = assignments.filter(a => a.rff_id === rff.id);
                const assignedIds = assigned.map(a => a.vendor_id);
                return (
                  <Card key={rff.id} style={{ borderLeft: "3px solid " + T.teal, marginBottom: 0 }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>{rff.title}</div>
                      <div style={{ color: T.textMuted, fontSize: 12, marginTop: 2 }}>Due {rff.deadline}</div>
                      {rff.description && <div style={{ color: T.textSecondary, fontSize: 12, marginTop: 4 }}>{rff.description}</div>}
                    </div>

                    {/* Assigned Vendors Basket */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: T.textSecondary, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Assigned Vendors ({assigned.length})</div>
                      {assigned.length === 0 ? (
                        <div style={{ color: T.textMuted, fontSize: 12, padding: "8px 12px", background: T.bg, borderRadius: 6, border: "1px dashed " + T.border }}>No vendors assigned yet</div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {assigned.map(a => {
                            const vp = vendors.find(v => v.id === a.vendor_id);
                            return (
                              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: T.teal + "15", border: "1px solid " + T.teal + "33", borderRadius: 20 }}>
                                <span style={{ color: T.teal, fontSize: 12, fontWeight: 600 }}>{a.vendor_name}</span>
                                {vp && <TierBadge vendor={vp} />}
                                <button onClick={() => removeVendor(rff.id, a.vendor_id)} style={{ background: "none", border: "none", color: "#F43F5E", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Add Vendor Button */}
                    <button onClick={() => setBasketModal({ rff, assignedIds })} style={{ width: "100%", padding: "8px", background: T.cyan + "15", border: "1px solid " + T.cyan + "33", borderRadius: 8, cursor: "pointer", color: T.cyan, fontSize: 12, fontWeight: 700 }}>
                      + Add Vendor
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Vendor Picker Modal */}
      {basketModal && (
        <Modal title={"Assign Vendors — " + basketModal.rff.title} onClose={() => setBasketModal(null)}>
          <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 16 }}>📁 {basketModal.rff.event_name} · Select vendors in good standing</div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {vendors.map(v => {
              const score = v.vendor_score || 0;
              const isPoor = v.vendor_scorecard_count > 0 && score < 50;
              const isAssigned = basketModal.assignedIds.includes(v.id);
              return (
                <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid " + T.border + "66", opacity: isPoor ? 0.5 : 1 }}>
                  <div>
                    <div style={{ color: isPoor ? T.textMuted : T.textPrimary, fontWeight: 600, fontSize: 14 }}>{v.name}</div>
                    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <TierBadge vendor={v} />
                    {v.vendor_scorecard_count >= 2 && <span style={{ color: T.textMuted, fontSize: 9 }}>(avg 2 events)</span>}
                    {v.vendor_scorecard_count === 1 && <span style={{ color: T.textMuted, fontSize: 9 }}>(1 event)</span>}
                  </div>
                  </div>
                  {isPoor ? (
                    <span style={{ color: "#F43F5E", fontSize: 11, fontWeight: 600 }}>⛔ Cannot assign</span>
                  ) : isAssigned ? (
                    <button onClick={() => { removeVendor(basketModal.rff.id, v.id); setBasketModal({ ...basketModal, assignedIds: basketModal.assignedIds.filter(id => id !== v.id) }); }} style={{ padding: "6px 14px", background: "#F43F5E15", border: "1px solid #F43F5E44", borderRadius: 20, cursor: "pointer", color: "#F43F5E", fontSize: 12, fontWeight: 700 }}>✕ Remove</button>
                  ) : (
                    <button onClick={() => { addVendor(basketModal.rff, v); setBasketModal({ ...basketModal, assignedIds: [...basketModal.assignedIds, v.id] }); }} disabled={saving} style={{ padding: "6px 14px", background: T.cyan + "15", border: "1px solid " + T.cyan + "33", borderRadius: 20, cursor: "pointer", color: T.cyan, fontSize: 12, fontWeight: 700 }}>+ Assign</button>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn onClick={() => setBasketModal(null)}>Done</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── FINANCE APPROVALS VIEW ───────────────────────────────────────────────────
const FinanceApprovalsView = ({ user }) => {
  const [expenses, setExpenses] = useState([]);
  const [budgetRequests, setBudgetRequests] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [saving, setSaving] = useState(null);
  const canApprove = ["CEO", "Country Manager"].includes(user?.role);

  const load = async () => {
    const [ex, br, pr] = await Promise.all([
      supabase.from("expenses").select("*").eq("approval_required", true).order("created_at", { ascending: false }),
      supabase.from("budget_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("invoice_payments").select("*").order("created_at", { ascending: false }),
    ]);
    setExpenses(ex.data || []);
    setBudgetRequests(br.data || []);
    setPaymentRequests(pr.data || []);
  };

  useEffect(() => { load(); }, []);

  const pendingExpenses = expenses.filter(e => e.approval_status === "pending");
  const pendingBudgets = budgetRequests.filter(b => b.status === "pending");
  const pendingPayments = paymentRequests.filter(p => p.status === "pending");
  const totalPending = pendingExpenses.length + pendingBudgets.length + pendingPayments.length;

  const handleExpense = async (id, status, notes) => {
    setSaving(id);
    await supabase.from("expenses").update({ approval_status: status, approved_by: user.id, approval_notes: notes || "" }).eq("id", id);
    setSaving(null);
    load();
  };

  const handleBudget = async (req, status) => {
    setSaving(req.id);
    await supabase.from("budget_requests").update({ status, approved_by: user.id }).eq("id", req.id);
    if (status === "approved") {
      const { data: existing } = await supabase.from("budgets").select("*").eq("project_id", req.project_id).single();
      if (existing) {
        await supabase.from("budgets").update({ total_budget: existing.total_budget + req.requested_amount }).eq("id", existing.id);
      }
    }
    setSaving(null);
    load();
  };

  const handlePayment = async (req, status) => {
    setSaving(req.id);
    await supabase.from("invoice_payments").update({ status, approved_by: user.id }).eq("id", req.id);
    if (status === "approved") {
      await supabase.from("invoices").update({ status: "paid" }).eq("id", req.invoice_id);
    }
    setSaving(null);
    load();
  };

  return (
    <div style={{ animation: "fadeUp 0.35s ease" }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Finance</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ margin: 0, color: T.textPrimary, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Finance Approvals</h2>
            <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>{totalPending} item{totalPending !== 1 ? "s" : ""} pending your approval</div>
          </div>
          {totalPending > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", background: T.amber + "15", border: `1px solid ${T.amber}40`, borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.amber, boxShadow: `0 0 6px ${T.amber}` }} />
            <span style={{ color: T.amber, fontSize: 11, fontWeight: 700 }}>{totalPending} pending</span>
          </div>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Pending Expenses", value: pendingExpenses.length, color: pendingExpenses.length > 0 ? T.amber : T.teal },
          { label: "Budget Requests", value: pendingBudgets.length, color: pendingBudgets.length > 0 ? T.magenta : T.teal },
          { label: "Payment Requests", value: pendingPayments.length, color: pendingPayments.length > 0 ? T.cyan : T.teal },
        ].map((k, i) => (
          <div key={i} style={{ padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${k.color}`, borderRadius: 10 }}>
            <div style={{ color: k.color, fontSize: 24, fontWeight: 900 }}>{k.value}</div>
            <div style={{ color: T.textMuted, fontSize: 10, fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Expense Approvals */}
      {expenses.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 3, height: 20, background: T.amber, borderRadius: 2 }} />
            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>Expense Approvals</div>
          </div>
          {expenses.map(e => (
            <Card key={e.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>{e.description}</div>
                  <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>
                    {e.category && <span style={{ background: T.cyan + "20", color: T.cyan, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, marginRight: 8 }}>{e.category}</span>}
                    {e.event_name && <span>📁 {e.event_name} · </span>}
                    {e.vendor && <span>🏢 {e.vendor} · </span>}
                    {e.date}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: T.amber, fontWeight: 800, fontSize: 18 }}>GHS {(e.amount || 0).toLocaleString()}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: e.approval_status === "approved" ? T.teal : e.approval_status === "rejected" ? "#F43F5E" : T.amber }}>
                    {e.approval_status === "approved" ? "✓ Approved" : e.approval_status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                  </span>
                </div>
              </div>
              {e.receipt_url && <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: T.cyan, fontSize: 12, fontWeight: 600, textDecoration: "none", display: "block", marginBottom: 10 }}>📎 View Receipt</a>}
              {canApprove && e.approval_status === "pending" && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => handleExpense(e.id, "approved")} disabled={saving === e.id} style={{ flex: 1, background: T.teal + "20", border: "1px solid " + T.teal, color: T.teal, padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓ Approve</button>
                  <button onClick={() => handleExpense(e.id, "rejected")} disabled={saving === e.id} style={{ flex: 1, background: "#F43F5E20", border: "1px solid #F43F5E", color: "#F43F5E", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✗ Reject</button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Budget Requests */}
      {budgetRequests.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 3, height: 20, background: T.magenta, borderRadius: 2 }} />
            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>Budget Increase Requests</div>
          </div>
          {budgetRequests.map(b => (
            <Card key={b.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>📁 {b.event_name}</div>
                  <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>Current: GHS {(b.current_budget || 0).toLocaleString()} · Requesting: GHS {(b.requested_amount || 0).toLocaleString()}</div>
                  {b.reason && <div style={{ color: T.textSecondary, fontSize: 12, marginTop: 6, fontStyle: "italic" }}>{b.reason}</div>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: b.status === "approved" ? T.teal : b.status === "rejected" ? "#F43F5E" : T.amber }}>
                  {b.status === "approved" ? "✓ Approved" : b.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                </span>
              </div>
              {canApprove && b.status === "pending" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleBudget(b, "approved")} disabled={saving === b.id} style={{ flex: 1, background: T.teal + "20", border: "1px solid " + T.teal, color: T.teal, padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓ Approve + GHS {(b.requested_amount || 0).toLocaleString()}</button>
                  <button onClick={() => handleBudget(b, "rejected")} disabled={saving === b.id} style={{ flex: 1, background: "#F43F5E20", border: "1px solid #F43F5E", color: "#F43F5E", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✗ Reject</button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Payment Requests */}
      {paymentRequests.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 3, height: 20, background: T.cyan, borderRadius: 2 }} />
            <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 15 }}>Invoice Payment Requests</div>
          </div>
          {paymentRequests.map(p => (
            <Card key={p.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>🏢 {p.vendor}</div>
                  <div style={{ color: T.textMuted, fontSize: 12, marginTop: 4 }}>📁 {p.event_name}</div>
                  {p.notes && <div style={{ color: T.textSecondary, fontSize: 12, marginTop: 6, fontStyle: "italic" }}>{p.notes}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: T.cyan, fontWeight: 800, fontSize: 18 }}>GHS {(p.amount || 0).toLocaleString()}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: p.status === "approved" ? T.teal : p.status === "rejected" ? "#F43F5E" : T.amber }}>
                    {p.status === "approved" ? "✓ Payment Approved" : p.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                  </span>
                </div>
              </div>
              {canApprove && p.status === "pending" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handlePayment(p, "approved")} disabled={saving === p.id} style={{ flex: 1, background: T.teal + "20", border: "1px solid " + T.teal, color: T.teal, padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✓ Approve Payment</button>
                  <button onClick={() => handlePayment(p, "rejected")} disabled={saving === p.id} style={{ flex: 1, background: "#F43F5E20", border: "1px solid #F43F5E", color: "#F43F5E", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>✗ Reject</button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {totalPending === 0 && (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <div style={{ color: T.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>All caught up!</div>
          <div style={{ color: T.textMuted, fontSize: 13 }}>No pending finance approvals.</div>
        </Card>
      )}
    </div>
  );
};
