create extension if not exists pgcrypto;
create schema if not exists private;
create type public.app_role as enum ('user','editor','admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,
  full_name text not null default 'Sidhu',
  headline text not null default 'Student • Creator • Learner',
  bio text not null default 'Welcome to my personal website.',
  avatar_url text,
  resume_url text,
  email text,
  location text,
  github_url text,
  linkedin_url text,
  instagram_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  proficiency smallint check (proficiency between 0 and 100),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text not null,
  location text,
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  description text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text not null,
  description text,
  image_url text,
  live_url text,
  github_url text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_skills (
  project_id uuid not null references public.projects(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (project_id, skill_id)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  date date,
  description text,
  url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) between 3 and 160),
  message text not null check (char_length(message) between 10 and 3000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index skills_published_order_idx on public.skills(is_published, sort_order);
create index experiences_published_order_idx on public.experiences(is_published, sort_order);
create index projects_published_order_idx on public.projects(is_published, sort_order);
create index projects_featured_idx on public.projects(featured) where featured = true;
create index project_skills_skill_id_idx on public.project_skills(skill_id);
create index achievements_published_order_idx on public.achievements(is_published, sort_order);
create index contact_messages_created_idx on public.contact_messages(created_at desc);
create index contact_messages_unread_idx on public.contact_messages(is_read, created_at desc) where is_read = false;
create index audit_logs_actor_created_idx on public.audit_logs(actor_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public, pg_catalog as $$
begin new.updated_at = now(); return new; end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','site_settings','skills','experiences','projects','achievements'] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.is_admin_or_editor() returns boolean
language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'));
$$;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = public, pg_catalog as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_admin_or_editor() to anon, authenticated;
revoke all on function private.handle_new_user() from public;

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.skills enable row level security;
alter table public.experiences enable row level security;
alter table public.projects enable row level security;
alter table public.project_skills enable row level security;
alter table public.achievements enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated using ((select auth.uid()) = id or private.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated using (private.is_admin()) with check (private.is_admin());

create policy settings_public_read on public.site_settings for select to anon, authenticated using (is_published or private.is_admin_or_editor());
create policy settings_editor_insert on public.site_settings for insert to authenticated with check (private.is_admin_or_editor());
create policy settings_editor_update on public.site_settings for update to authenticated using (private.is_admin_or_editor()) with check (private.is_admin_or_editor());
create policy settings_admin_delete on public.site_settings for delete to authenticated using (private.is_admin());

create policy skills_public_read on public.skills for select to anon, authenticated using (is_published or private.is_admin_or_editor());
create policy skills_editor_insert on public.skills for insert to authenticated with check (private.is_admin_or_editor());
create policy skills_editor_update on public.skills for update to authenticated using (private.is_admin_or_editor()) with check (private.is_admin_or_editor());
create policy skills_admin_delete on public.skills for delete to authenticated using (private.is_admin());

create policy experiences_public_read on public.experiences for select to anon, authenticated using (is_published or private.is_admin_or_editor());
create policy experiences_editor_insert on public.experiences for insert to authenticated with check (private.is_admin_or_editor());
create policy experiences_editor_update on public.experiences for update to authenticated using (private.is_admin_or_editor()) with check (private.is_admin_or_editor());
create policy experiences_admin_delete on public.experiences for delete to authenticated using (private.is_admin());

create policy projects_public_read on public.projects for select to anon, authenticated using (is_published or private.is_admin_or_editor());
create policy projects_editor_insert on public.projects for insert to authenticated with check (private.is_admin_or_editor());
create policy projects_editor_update on public.projects for update to authenticated using (private.is_admin_or_editor()) with check (private.is_admin_or_editor());
create policy projects_admin_delete on public.projects for delete to authenticated using (private.is_admin());

create policy project_skills_public_read on public.project_skills for select to anon, authenticated using (exists (select 1 from public.projects p where p.id = project_id and (p.is_published or private.is_admin_or_editor())));
create policy project_skills_editor_insert on public.project_skills for insert to authenticated with check (private.is_admin_or_editor());
create policy project_skills_editor_delete on public.project_skills for delete to authenticated using (private.is_admin_or_editor());

create policy achievements_public_read on public.achievements for select to anon, authenticated using (is_published or private.is_admin_or_editor());
create policy achievements_editor_insert on public.achievements for insert to authenticated with check (private.is_admin_or_editor());
create policy achievements_editor_update on public.achievements for update to authenticated using (private.is_admin_or_editor()) with check (private.is_admin_or_editor());
create policy achievements_admin_delete on public.achievements for delete to authenticated using (private.is_admin());

create policy contact_public_insert on public.contact_messages for insert to anon, authenticated with check (true);
create policy contact_editor_read on public.contact_messages for select to authenticated using (private.is_admin_or_editor());
create policy contact_editor_update on public.contact_messages for update to authenticated using (private.is_admin_or_editor()) with check (private.is_admin_or_editor());
create policy contact_admin_delete on public.contact_messages for delete to authenticated using (private.is_admin());

create policy audit_admin_read on public.audit_logs for select to authenticated using (private.is_admin());
create policy audit_authenticated_insert on public.audit_logs for insert to authenticated with check ((select auth.uid()) is not null and actor_id = (select auth.uid()));

insert into public.site_settings (singleton, full_name, headline, bio)
values (true, 'Sidhu', 'Student • Creator • Learner', 'Welcome to my personal website.')
on conflict (singleton) do nothing;
