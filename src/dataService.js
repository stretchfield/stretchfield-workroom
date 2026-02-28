import { supabase } from './supabase';

// PROJECTS
export async function getProjects() {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) console.error('getProjects error:', error);
  return data || [];
}

export async function createProject(project) {
  const { data, error } = await supabase.from('projects').insert([project]).select();
  if (error) console.error('createProject error:', error);
  return data?.[0] || null;
}

export async function updateProject(id, updates) {
  const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select();
  if (error) console.error('updateProject error:', error);
  return data?.[0] || null;
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) console.error('deleteProject error:', error);
}

// TASKS
export async function getTasks() {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) console.error('getTasks error:', error);
  return data || [];
}

export async function createTask(task) {
  const { data, error } = await supabase.from('tasks').insert([task]).select();
  if (error) console.error('createTask error:', error);
  return data?.[0] || null;
}

export async function updateTask(id, updates) {
  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select();
  if (error) console.error('updateTask error:', error);
  return data?.[0] || null;
}

// INVOICES
export async function getInvoices() {
  const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
  if (error) console.error('getInvoices error:', error);
  return data || [];
}

export async function createInvoice(invoice) {
  const { data, error } = await supabase.from('invoices').insert([invoice]).select();
  if (error) console.error('createInvoice error:', error);
  return data?.[0] || null;
}

export async function updateInvoice(id, updates) {
  const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).select();
  if (error) console.error('updateInvoice error:', error);
  return data?.[0] || null;
}

// RFFS
export async function getRFFs() {
  const { data, error } = await supabase.from('rffs').select('*').order('created_at', { ascending: false });
  if (error) console.error('getRFFs error:', error);
  return data || [];
}

export async function createRFF(rff) {
  const { data, error } = await supabase.from('rffs').insert([rff]).select();
  if (error) console.error('createRFF error:', error);
  return data?.[0] || null;
}

export async function updateRFF(id, updates) {
  const { data, error } = await supabase.from('rffs').update(updates).eq('id', id).select();
  if (error) console.error('updateRFF error:', error);
  return data?.[0] || null;
}

// FILE UPLOAD
export async function uploadRFFDocument(file, rffId) {
  const ext = file.name.split('.').pop();
  const path = `${rffId}-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('rff-documents')
    .upload(path, file);
  if (error) { console.error('uploadRFFDocument error:', error); return null; }
  const { data: urlData } = supabase.storage.from('rff-documents').getPublicUrl(path);
  return { url: urlData.publicUrl, name: file.name };
}
// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

export const getProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
};

export const deleteProfile = async (id) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);
  if (error) throw error;
};