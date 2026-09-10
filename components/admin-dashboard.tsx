'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

type Item = { id: string; [key: string]: any };

const fields: Record<string, string[]> = {
  skills: ['name', 'category', 'proficiency', 'sort_order', 'is_published'],
  projects: ['title', 'slug', 'short_description', 'description', 'image_url', 'live_url', 'github_url', 'featured', 'sort_order', 'is_published'],
  experiences: ['title', 'organization', 'location', 'description', 'start_date', 'end_date', 'is_current', 'sort_order', 'is_published'],
  achievements: ['title', 'issuer', 'date', 'description', 'url', 'sort_order', 'is_published'],
};

const defaults: Record<string, Item> = {
  skills: { name: 'New skill', category: 'Other', proficiency: 50, sort_order: 999, is_published: true },
  projects: { title: 'New project', slug: `new-project-${Date.now()}`, short_description: 'Project summary', description: '', image_url: '', live_url: '', github_url: '', featured: false, sort_order: 999, is_published: false },
  experiences: { title: 'New role', organization: 'Organization', location: '', description: '', start_date: new Date().toISOString().slice(0, 10), end_date: null, is_current: false, sort_order: 999, is_published: false },
  achievements: { title: 'New achievement', issuer: '', date: null, description: '', url: '', sort_order: 999, is_published: true },
};

export default function AdminDashboard({ role, site, skills, projects, experiences, achievements, messages }: { role: string; site: any; skills: Item[]; projects: Item[]; experiences: Item[]; achievements: Item[]; messages: Item[] }) {
  const supabase = createClient();
  const [settings, setSettings] = useState(site ?? { singleton: true, full_name: 'Sidhu', headline: '', bio: '', is_published: true });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  async function saveSettings() {
    setSaving(true); setNotice('');
    const { id: _id, created_at: _created, updated_at: _updated, ...data } = settings;
    const { error } = await supabase.from('site_settings').upsert({ ...data, singleton: true }, { onConflict: 'singleton' });
    setNotice(error ? `Save failed: ${error.message}` : 'Settings saved.'); setSaving(false);
  }

  async function add(table: string) {
    const { error } = await supabase.from(table).insert(defaults[table]);
    if (error) setNotice(`Add failed: ${error.message}`); else location.reload();
  }

  async function remove(table: string, id: string) {
    if (role !== 'admin') { setNotice('Only admins can delete items.'); return; }
    if (!confirm('Delete this item permanently?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) setNotice(`Delete failed: ${error.message}`); else location.reload();
  }

  async function update(table: string, item: Item) {
    const { id, created_at: _created, updated_at: _updated, ...data } = item;
    const { error } = await supabase.from(table).update(data).eq('id', id);
    setNotice(error ? `Save failed: ${error.message}` : 'Saved.');
  }

  function inputFor(table: string, item: Item, key: string) {
    if (typeof item[key] === 'boolean') return <label key={key} className="flex items-center gap-2 rounded-lg border border-line px-3 py-3 text-xs text-muted"><input type="checkbox" checked={!!item[key]} onChange={e => { item[key] = e.target.checked; }} />{key.replaceAll('_', ' ')}</label>;
    const multiline = ['description'].includes(key);
    const type = ['date'].includes(key) ? 'date' : key === 'proficiency' || key === 'sort_order' ? 'number' : 'text';
    return <label key={key} className="text-xs text-muted">{key.replaceAll('_', ' ')}{multiline ? <textarea rows={3} value={item[key] ?? ''} onChange={e => { item[key] = e.target.value; }} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink" /> : <input type={type} value={item[key] ?? ''} onChange={e => { item[key] = type === 'number' ? Number(e.target.value) : e.target.value; }} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink" />}</label>;
  }

  function collection(title: string, table: string, items: Item[]) {
    return <section className="rounded-2xl border border-line bg-white p-5"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-xs text-muted">Edit, publish, reorder or remove.</p></div><button onClick={() => add(table)} className="rounded-full bg-ink px-4 py-2 text-xs text-white">Add</button></div>{items.length === 0 && <p className="text-sm text-muted">Nothing here yet. Add your first item.</p>}<div className="space-y-4">{items.map(item => <div key={item.id} className="rounded-xl border border-line p-4"><div className="grid gap-3 md:grid-cols-2">{fields[table].map(key => inputFor(table, item, key))}</div><div className="mt-3 flex flex-wrap justify-end gap-2"><button onClick={() => update(table, item)} className="rounded-lg bg-ink px-4 py-2 text-xs text-white">Save</button><button onClick={() => remove(table, item.id)} className="rounded-lg border border-line px-4 py-2 text-xs">Delete</button></div></div>)}</div></section>;
  }

  return <main className="min-h-screen bg-paper"><header className="border-b border-line bg-white"><div className="container-page flex items-center justify-between gap-4 py-5"><div><p className="text-xs uppercase tracking-widest text-muted">Admin</p><h1 className="text-xl font-semibold">Portfolio CMS</h1></div><div className="flex items-center gap-2"><a href="/" className="rounded-full border border-line px-4 py-2 text-sm">View site</a><button onClick={async () => { await supabase.auth.signOut(); location.href = '/admin/login'; }} className="rounded-full bg-ink px-4 py-2 text-sm text-white">Sign out</button></div></div></header><div className="container-page space-y-6 py-8"><div className="grid gap-4 sm:grid-cols-4">{[['Projects', projects.length], ['Skills', skills.length], ['Experience', experiences.length], ['Messages', messages.length]].map(([k, v]) => <div key={k as string} className="rounded-2xl border border-line bg-white p-5"><p className="text-sm text-muted">{k}</p><p className="mt-2 text-3xl font-semibold">{v as number}</p></div>)}</div>{notice && <div role="status" className="rounded-xl border border-line bg-white px-4 py-3 text-sm">{notice}</div>}
  <section className="rounded-2xl border border-line bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Site settings</h2><p className="mt-1 text-xs text-muted">Your public identity and social links.</p></div><span className="text-xs text-muted">{role}</span></div><div className="mt-5 grid gap-4 md:grid-cols-2">{['full_name','headline','bio','email','location','avatar_url','resume_url','github_url','linkedin_url','instagram_url'].map(key => <label key={key} className="text-xs text-muted">{key.replaceAll('_', ' ')}<textarea rows={key === 'bio' ? 4 : 1} value={settings[key] ?? ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink" /></label>)}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!settings.is_published} onChange={e => setSettings({ ...settings, is_published: e.target.checked })} /> Publish site settings</label></div><button onClick={saveSettings} disabled={saving} className="mt-5 rounded-xl bg-ink px-5 py-3 text-sm text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save settings'}</button></section>
  {collection('Skills', 'skills', skills)}{collection('Projects', 'projects', projects)}{collection('Experience', 'experiences', experiences)}{collection('Achievements', 'achievements', achievements)}
  <section className="rounded-2xl border border-line bg-white p-5"><h2 className="text-lg font-semibold">Recent contact messages</h2><div className="mt-5 space-y-3">{messages.length === 0 ? <p className="text-sm text-muted">No messages yet.</p> : messages.map(m => <article key={m.id} className="rounded-xl border border-line p-4"><div className="flex justify-between gap-4"><div><p className="font-medium">{m.name} · {m.email}</p><p className="mt-1 text-xs text-muted">{new Date(m.created_at).toLocaleString()}</p></div><span className="text-xs text-muted">{m.is_read ? 'Read' : 'Unread'}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{m.message}</p></article>)}</div></section><p className="pb-8 text-xs text-muted">Signed in as {role}. Database RLS remains the authorization boundary.</p></div></main>;
}
