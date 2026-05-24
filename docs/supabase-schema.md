# Supabase Schema

This schema supports Supabase Auth, draft project storage, generated result storage, and protected DeepSeek generation.

## users

Supabase Auth owns authentication. This table stores app-level profile data.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key, references auth.users.id |
| email | text | User email |
| created_at | timestamptz | Default now() |

## product_projects

Stores one Amazon Listing project per product.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| user_id | uuid | References users.id |
| product_name_cn | text | Chinese product name |
| product_name_en | text | Optional English product name |
| marketplace | text | US, UK, CA, or AU |
| category | text | Amazon category |
| target_price | text | Flexible MVP field |
| target_customer | text | Target users |
| form_data | jsonb | Full wizard input snapshot |
| status | text | Draft or Generated |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Updated on save |

## generation_results

Stores AI output for a project.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| project_id | uuid | References product_projects.id |
| model | text | AI model name |
| input_snapshot | jsonb | Input used for this generation |
| result_json | jsonb | Structured bilingual result |
| created_at | timestamptz | Default now() |

## MVP Policy Notes

- Only Amazon marketplaces are allowed: US, UK, CA, AU.
- Row level security should restrict users to their own projects and results.
- Result JSON should preserve English content, Chinese explanation, beginner tips, and copy-ready text separately.

## SQL

Run this in Supabase SQL Editor.

```sql
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.product_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  product_name_cn text not null,
  product_name_en text,
  marketplace text not null check (marketplace in ('US', 'UK', 'CA', 'AU')),
  category text not null,
  target_price text,
  target_customer text,
  form_data jsonb not null default '{}'::jsonb,
  status text not null default 'Draft' check (status in ('Draft', 'Generated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.product_projects(id) on delete cascade,
  model text,
  input_snapshot jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists product_projects_updated_at on public.product_projects;
create trigger product_projects_updated_at
  before update on public.product_projects
  for each row execute procedure public.set_updated_at();

alter table public.users enable row level security;
alter table public.product_projects enable row level security;
alter table public.generation_results enable row level security;

create policy "Users can read own profile"
on public.users for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.users for update
using (auth.uid() = id);

create policy "Users can read own projects"
on public.product_projects for select
using (auth.uid() = user_id);

create policy "Users can insert own projects"
on public.product_projects for insert
with check (auth.uid() = user_id);

create policy "Users can update own projects"
on public.product_projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read own generation results"
on public.generation_results for select
using (
  exists (
    select 1
    from public.product_projects p
    where p.id = generation_results.project_id
      and p.user_id = auth.uid()
  )
);

create policy "Users can insert own generation results"
on public.generation_results for insert
with check (
  exists (
    select 1
    from public.product_projects p
    where p.id = generation_results.project_id
      and p.user_id = auth.uid()
  )
);
```
