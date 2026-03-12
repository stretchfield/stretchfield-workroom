import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function toICSDate(dateStr: string): string {
  return dateStr.replace(/-/g, "").slice(0, 8);
}

function escapeICS(str: string): string {
  return (str || "").replace(/[\\;,]/g, "\\$&").replace(/\n/g, "\\n");
}

function makeEvent(uid: string, dtstart: string, summary: string, description: string): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtstart}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    "END:VEVENT",
  ].join("\r\n");
}

serve(async (req) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  if (!userId) return new Response("user_id required", { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Verify this user is CEO
  const { data: profile } = await supabase.from("profiles").select("role, name").eq("id", userId).single();
  if (!profile || profile.role !== "CEO") {
    return new Response("Unauthorized", { status: 403 });
  }

  const events: string[] = [];

  // ── ALL TASKS ──
  const { data: tasks } = await supabase.from("tasks").select("*");
  for (const t of tasks || []) {
    if (t.deadline) {
      events.push(makeEvent(
        `task-${t.id}@stretchfield`,
        toICSDate(t.deadline.slice(0, 10)),
        `[Task] ${t.name}`,
        `Assignee: ${t.assignee_name || "Unassigned"}\nStatus: ${t.status}\nProgress: ${t.progress || 0}%`
      ));
    }
  }

  // ── ALL EVENTS ──
  const { data: projects } = await supabase.from("projects").select("*");
  for (const e of projects || []) {
    if (e.event_date) {
      events.push(makeEvent(
        `event-${e.id}-day@stretchfield`,
        toICSDate(e.event_date),
        `[Event Day] ${e.name}`,
        `Client: ${e.client_name || ""}\nPhase: ${e.phase || ""}\nStatus: ${e.status || ""}`
      ));
    }
    if (e.deadline) {
      events.push(makeEvent(
        `event-${e.id}-deadline@stretchfield`,
        toICSDate(e.deadline.slice(0, 10)),
        `[Deadline] ${e.name}`,
        `Planning deadline for event: ${e.name}`
      ));
    }
  }

  // ── ALL RFFs ──
  const { data: rffs } = await supabase.from("rffs").select("*");
  for (const r of rffs || []) {
    if (r.deadline) {
      events.push(makeEvent(
        `rff-${r.id}@stretchfield`,
        toICSDate(r.deadline.slice(0, 10)),
        `[RFF Deadline] ${r.title || "RFF"}`,
        `Event: ${r.event_name || ""}\nVendor: ${r.vendor || ""}\nStatus: ${r.status}`
      ));
    }
  }

  // ── ALL LEADS ──
  const { data: leads } = await supabase.from("leads").select("*");
  for (const l of leads || []) {
    if (l.created_at) {
      events.push(makeEvent(
        `lead-${l.id}-created@stretchfield`,
        toICSDate(l.created_at.slice(0, 10)),
        `[Lead] ${l.company}`,
        `Status: ${l.status}\nContact: ${l.contact_name || ""}\nValue: GHS ${l.value || 0}`
      ));
    }
    if (l.closed_date) {
      events.push(makeEvent(
        `lead-${l.id}-won@stretchfield`,
        toICSDate(l.closed_date),
        `[Lead Won] ${l.company}`,
        `Value: GHS ${l.value || 0}`
      ));
    }
  }

  // ── ALL ITINERARIES ──
  const { data: itins } = await supabase.from("itineraries").select("*");
  for (const itin of itins || []) {
    for (const item of itin.items || []) {
      if (item.date) {
        events.push(makeEvent(
          `itin-${itin.id}-${item.company}-${item.date}@stretchfield`,
          toICSDate(item.date),
          `[Itinerary] ${item.company} — ${item.action || "Visit"}`,
          `Plan: ${itin.title}\nTime: ${item.time || "TBD"}\nNotes: ${item.notes || ""}`
        ));
      }
    }
  }

  // ── ALL OPPORTUNITIES (status changes) ──
  const { data: opps } = await supabase.from("opportunities").select("*").eq("status", "Converted");
  for (const o of opps || []) {
    if (o.updated_at) {
      events.push(makeEvent(
        `opp-${o.id}-converted@stretchfield`,
        toICSDate(o.updated_at.slice(0, 10)),
        `[Converted] ${o.company}`,
        `Sector: ${o.sector || ""}\nConverted to Lead`
      ));
    }
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Stretchfield WorkRoom//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Stretchfield WorkRoom — CEO",
    "X-WR-TIMEZONE:Africa/Accra",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
// apikey param accepted for iOS compatibility — already handled by Supabase gateway
