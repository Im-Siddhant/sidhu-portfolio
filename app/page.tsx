import { createClient } from '@/lib/supabase/server';
import ContactForm from '@/components/contact-form';

export default async function Home() {
  const supabase = await createClient();
  const [{ data: site }, { data: skills }, { data: experiences }, { data: projects }, { data: achievements }] = await Promise.all([
    supabase.from('site_settings').select('*').eq('singleton', true).eq('is_published', true).maybeSingle(),
    supabase.from('skills').select('*').eq('is_published', true).order('sort_order'),
    supabase.from('experiences').select('*').eq('is_published', true).order('sort_order'),
    supabase.from('projects').select('*').eq('is_published', true).order('sort_order'),
    supabase.from('achievements').select('*').eq('is_published', true).order('sort_order'),
  ]);
  const content = site ?? { full_name: 'Sidhu', headline: 'Building things, learning fast.', bio: 'Welcome to my portfolio.', email: null, location: null, github_url: null, linkedin_url: null, instagram_url: null, resume_url: null };

  return <main id="top">
    <nav className="container-page flex items-center justify-between py-6" aria-label="Primary navigation">
      <a href="#top" className="font-semibold tracking-tight">{content.full_name}</a>
      <div className="hidden gap-6 text-sm text-muted sm:flex"><a href="#work">Work</a><a href="#experience">Experience</a><a href="#about">About</a><a href="#contact">Contact</a></div>
      <a href="/admin" className="rounded-full border border-line px-4 py-2 text-sm">Admin</a>
    </nav>

    <section className="container-page section">
      <p className="mb-5 text-sm uppercase tracking-[0.2em] text-muted">Portfolio</p>
      <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">{content.headline}</h1>
      <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">{content.bio}</p>
      <div className="mt-9 flex flex-wrap gap-3">{content.email && <a className="rounded-full bg-ink px-5 py-3 text-sm text-white" href={`mailto:${content.email}`}>Get in touch</a>}{content.resume_url && <a className="rounded-full border border-line px-5 py-3 text-sm" href={content.resume_url} target="_blank" rel="noreferrer">Resume</a>}</div>
      <div className="mt-7 flex flex-wrap gap-4 text-sm text-muted">{content.github_url && <a href={content.github_url} target="_blank" rel="noreferrer">GitHub ↗</a>}{content.linkedin_url && <a href={content.linkedin_url} target="_blank" rel="noreferrer">LinkedIn ↗</a>}{content.instagram_url && <a href={content.instagram_url} target="_blank" rel="noreferrer">Instagram ↗</a>}{content.location && <span>{content.location}</span>}</div>
    </section>

    <section id="work" className="container-page section border-t border-line"><div className="mb-10 flex items-end justify-between"><div><p className="text-sm text-muted">Selected</p><h2 className="mt-2 text-3xl font-semibold">Projects</h2></div><span className="text-sm text-muted">{projects?.length ?? 0}</span></div><div className="grid gap-5 md:grid-cols-2">
      {projects?.map(p => <article key={p.id} className="overflow-hidden rounded-2xl border border-line bg-white">{p.image_url && <img src={p.image_url} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />}<div className="p-6"><div className="flex items-start justify-between gap-4"><h3 className="text-xl font-semibold">{p.title}</h3>{p.featured && <span className="text-xs text-muted">Featured</span>}</div><p className="mt-3 leading-7 text-muted">{p.short_description}</p>{p.description && <p className="mt-3 text-sm leading-6 text-muted">{p.description}</p>}<div className="mt-6 flex gap-4 text-sm">{p.live_url && <a className="underline" href={p.live_url} target="_blank" rel="noreferrer">Live ↗</a>}{p.github_url && <a className="underline" href={p.github_url} target="_blank" rel="noreferrer">Source ↗</a>}</div></div></article>)}
      {(!projects || projects.length === 0) && <p className="text-muted">Projects will appear here once published.</p>}
    </div></section>

    <section id="experience" className="container-page section border-t border-line"><p className="text-sm text-muted">Background</p><h2 className="mt-2 text-3xl font-semibold">Experience</h2><div className="mt-10 space-y-8">{experiences?.map(e => <article key={e.id} className="grid gap-2 border-b border-line pb-8 sm:grid-cols-[180px_1fr]"><p className="text-sm text-muted">{new Date(e.start_date).getFullYear()} — {e.is_current ? 'Present' : e.end_date ? new Date(e.end_date).getFullYear() : ''}</p><div><h3 className="text-xl font-medium">{e.title}</h3><p className="mt-1 text-muted">{e.organization}{e.location ? ` · ${e.location}` : ''}</p>{e.description && <p className="mt-3 max-w-2xl leading-7 text-muted">{e.description}</p>}</div></article>)}</div></section>

    <section id="about" className="container-page section border-t border-line"><div className="grid gap-12 md:grid-cols-2"><div><p className="text-sm text-muted">About</p><h2 className="mt-2 text-3xl font-semibold">A little more about me</h2></div><div><p className="leading-8 text-muted">{content.bio}</p><div className="mt-8 flex flex-wrap gap-2">{skills?.map(s => <span key={s.id} className="rounded-full border border-line px-4 py-2 text-sm">{s.name}</span>)}</div></div></div></section>

    <section className="container-page section border-t border-line"><p className="text-sm text-muted">Milestones</p><h2 className="mt-2 text-3xl font-semibold">Achievements</h2><div className="mt-8 grid gap-4 md:grid-cols-2">{achievements?.map(a => <div key={a.id} className="rounded-2xl border border-line p-5"><h3 className="font-semibold">{a.title}</h3>{a.issuer && <p className="mt-1 text-sm text-muted">{a.issuer}</p>}{a.date && <p className="mt-1 text-xs text-muted">{new Date(a.date).getFullYear()}</p>}{a.description && <p className="mt-3 text-sm leading-6 text-muted">{a.description}</p>}{a.url && <a className="mt-4 inline-block text-sm underline" href={a.url} target="_blank" rel="noreferrer">View ↗</a>}</div>)}</div></section>

    <section id="contact" className="container-page section border-t border-line"><div className="rounded-3xl bg-ink p-8 text-white sm:p-12"><p className="text-sm text-white/60">Contact</p><h2 className="mt-3 text-4xl font-semibold tracking-tight">Have something worth building?</h2><ContactForm /></div></section>
    <footer className="container-page border-t border-line py-8 text-sm text-muted">© {new Date().getFullYear()} {content.full_name}. Built with Next.js + Supabase.</footer>
  </main>;
}
