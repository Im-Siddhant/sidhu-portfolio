'use client';
import { FormEvent, useState } from 'react';

export default function ContactForm() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setStatus('');
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get('name'), email: form.get('email'), message: form.get('message'), website: form.get('website') };
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send.');
      event.currentTarget.reset(); setStatus('Message sent — thanks!');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to send right now.'); }
    finally { setLoading(false); }
  }

  return <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2" aria-label="Contact form">
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
    <label className="text-sm sm:col-span-1">Name<input name="name" required maxLength={80} className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50" placeholder="Your name" /></label>
    <label className="text-sm sm:col-span-1">Email<input name="email" required type="email" maxLength={160} className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50" placeholder="you@example.com" /></label>
    <label className="text-sm sm:col-span-2">Message<textarea name="message" required minLength={10} maxLength={3000} rows={5} className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50" placeholder="Tell me what you're working on…" /></label>
    <div className="flex items-center gap-4 sm:col-span-2"><button disabled={loading} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-ink disabled:opacity-60">{loading ? 'Sending…' : 'Send message'}</button>{status && <p role="status" className="text-sm text-white/70">{status}</p>}</div>
  </form>;
}
