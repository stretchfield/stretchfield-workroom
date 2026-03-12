const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toICSDate(dateStr) {
  return dateStr.replace(/-/g, '').slice(0, 8);
}

function escapeICS(str) {
  return (str || '').replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
}

function makeEvent(uid, dtstart, summary, description) {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtstart}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    'END:VEVENT',
  ].join('\r\n');
}

module.exports = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).send('user_id required');

  const { data: profile } = await supabase.from('profiles').select('role, name').eq('id', user_id).single();
  if (!profile || profile.role !== 'CEO') return res.status(403).send('Unauthorized');

  const events = [];

  // Tasks
  const { data: tasks } = await supabase.from('tasks').select('*');
  for (const t of tasks || []) {
    if (t.deadline) events.push(makeEvent(`task-${t.id}@sf`, toICSDate(t.deadline.slice(0,10)), `[Task] ${t.name}`, `Assignee: ${t.assignee_name || 'Unassigned'}\nStatus: ${t.status}`));
  }

  // Events
  const { data: projects } = await supabase.from('projects').select('*');
  for (const e of projects || []) {
    if (e.event_date) events.push(makeEvent(`event-${e.id}-day@sf`, toICSDate(e.event_date), `[Event] ${e.name}`, `Client: ${e.client_name || ''}\nPhase: ${e.phase || ''}`));
    if (e.deadline) events.push(makeEvent(`event-${e.id}-dl@sf`, toICSDate(e.deadline.slice(0,10)), `[Deadline] ${e.name}`, `Planning deadline`));
  }

  // RFFs
  const { data: rffs } = await supabase.from('rffs').select('*');
  for (const r of rffs || []) {
    if (r.deadline) events.push(makeEvent(`rff-${r.id}@sf`, toICSDate(r.deadline.slice(0,10)), `[RFF] ${r.title || 'RFF'}`, `Event: ${r.event_name || ''}\nStatus: ${r.status}`));
  }

  // Leads
  const { data: leads } = await supabase.from('leads').select('*');
  for (const l of leads || []) {
    if (l.created_at) events.push(makeEvent(`lead-${l.id}@sf`, toICSDate(l.created_at.slice(0,10)), `[Lead] ${l.company}`, `Status: ${l.status}\nValue: GHS ${l.value || 0}`));
    if (l.closed_date) events.push(makeEvent(`lead-${l.id}-won@sf`, toICSDate(l.closed_date), `[Won] ${l.company}`, `Value: GHS ${l.value || 0}`));
  }

  // Itineraries
  const { data: itins } = await supabase.from('itineraries').select('*');
  for (const itin of itins || []) {
    for (const item of itin.items || []) {
      if (item.date) events.push(makeEvent(`itin-${itin.id}-${item.date}@sf`, toICSDate(item.date), `[Itinerary] ${item.company} — ${item.action || 'Visit'}`, `Plan: ${itin.title}\nTime: ${item.time || 'TBD'}\nNotes: ${item.notes || ''}`));
    }
  }

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stretchfield WorkRoom//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Stretchfield WorkRoom',
    'X-WR-TIMEZONE:Africa/Accra',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(ics);
};
