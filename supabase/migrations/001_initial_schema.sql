-- =========================================================
-- CollabMD initial schema
-- =========================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Sync auth.users -> profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- documents ----------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled',
  content text not null default '',
  parent_id uuid references public.documents(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'document' check (type in ('document', 'folder')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_parent_id_idx on public.documents(parent_id);
create index if not exists documents_owner_id_idx on public.documents(owner_id);

alter table public.documents enable row level security;

-- ---------- document_members ----------
create table if not exists public.document_members (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (document_id, user_id)
);

alter table public.document_members enable row level security;

-- ---------- document_snapshots ----------
create table if not exists public.document_snapshots (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  content text not null,
  label text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists snapshots_document_id_idx on public.document_snapshots(document_id);

alter table public.document_snapshots enable row level security;

-- =========================================================
-- Helper: is user owner or member of a document
-- =========================================================
create or replace function public.has_document_access(doc_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.documents d
    where d.id = doc_id
      and (
        d.owner_id = auth.uid()
        or exists (
          select 1 from public.document_members m
          where m.document_id = d.id and m.user_id = auth.uid()
        )
      )
  );
$$;

-- =========================================================
-- RLS: documents
-- =========================================================
create policy "Select own or shared documents"
  on public.documents for select
  to authenticated
  using (public.has_document_access(id));

create policy "Insert own documents"
  on public.documents for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Update own or shared documents"
  on public.documents for update
  to authenticated
  using (public.has_document_access(id));

create policy "Delete own documents"
  on public.documents for delete
  to authenticated
  using (owner_id = auth.uid());

-- =========================================================
-- RLS: document_members
-- =========================================================
create policy "View members of accessible documents"
  on public.document_members for select
  to authenticated
  using (public.has_document_access(document_id));

create policy "Owner can add members"
  on public.document_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.owner_id = auth.uid()
    )
  );

create policy "Owner can remove members"
  on public.document_members for delete
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.owner_id = auth.uid()
    )
  );

-- =========================================================
-- RLS: document_snapshots
-- =========================================================
create policy "View snapshots of accessible documents"
  on public.document_snapshots for select
  to authenticated
  using (public.has_document_access(document_id));

create policy "Create snapshots on accessible documents"
  on public.document_snapshots for insert
  to authenticated
  with check (public.has_document_access(document_id));

-- =========================================================
-- updated_at trigger
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- =========================================================
-- Realtime: enable postgres changes for relevant tables
-- =========================================================
alter publication supabase_realtime add table public.documents;
alter publication supabase_realtime add table public.document_members;
alter publication supabase_realtime add table public.document_snapshots;

-- =========================================================
-- Storage: document-images bucket
-- Run this section AFTER creating the bucket in the dashboard,
-- or create it here (requires storage extension already enabled by Supabase).
-- =========================================================
insert into storage.buckets (id, name, public)
values ('document-images', 'document-images', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'document-images');

create policy "Anyone can view document images"
  on storage.objects for select
  to public
  using (bucket_id = 'document-images');
