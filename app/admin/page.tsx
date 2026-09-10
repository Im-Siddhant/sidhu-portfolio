import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/admin-dashboard';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await supabase.from('profiles').select('role,display_name').eq('id', user.id).maybeSingle();
  if (!profile || !['admin','editor'].includes(profile.role)) redirect('/admin/login?error=forbidden');
  const [{ data: site }, { data: skills }, { data: experiences }, { data: projects }, { data: achievements }, { data: messages }] = await Promise.all([
    supabase.from('site_settings').select('*').eq('site_key','default').maybeSingle(),
    supabase.from('skills').select('*').order('sort_order'),
    supabase.from('experiences').select('*').order('sort_order'),
    supabase.from('projects').select('*').order('sort_order'),
    supabase.from('achievements').select('*').order('sort_order'),
    supabase.from('contact_messages').select('id,name,email,subject,message,status,created_at').order('created_at',{ascending:false}).limit(20),
  ]);
  return <AdminDashboard role={profile.role} site={site} skills={skills ?? []} experiences={experiences ?? []} projects={projects ?? []} achievements={achievements ?? []} messages={messages ?? []} />;
}