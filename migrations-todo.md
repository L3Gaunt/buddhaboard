# Supabase Database Migration Plan

This document outlines the step-by-step migrations needed to implement the AutoCRM database schema.

## Migration Files Structure

Migrations will be placed in `supabase/migrations/` with the following naming convention:
`YYYYMMDDHHMMSS_descriptive_name.sql`

## Core Tables Migration Plan

### 1. Authentication and Users
```sql
-- Trigger for updated_at
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure moddatetime (updated_at);  -- Auto-updates the updated_at timestamp

-- Create enum types for various statuses
create type public.user_role as enum ('customer', 'agent', 'admin');
-- Create profiles table extending auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role user_role not null default 'customer',
  full_name text,
  avatar_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies for profiles
alter table public.profiles enable row level security;

-- Allow users to view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

-- Allow users to update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Allow users to insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

-- Allow admins to view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Allow admins to update any profile
create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
```

### 2. Teams
```sql
-- Teams and members are separate tables to allow many-to-many relationships
create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member',  -- Flexible role system at team level
  joined_at timestamptz default now(),
  primary key (team_id, user_id)        -- Composite key prevents duplicate memberships
);

-- RLS policies for teams
alter table public.teams enable row level security;
alter table public.team_members enable row level security;

-- Add trigger for updated_at
create trigger handle_updated_at before update on public.teams
  for each row execute procedure moddatetime (updated_at);
```

### 3. Tickets
```sql
create type public.ticket_status as enum ('new', 'open', 'pending', 'resolved', 'closed');
create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.tickets (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status ticket_status not null default 'new',
  priority ticket_priority not null default 'medium',
  customer_id uuid references public.profiles(id),
  assigned_agent_id uuid references public.profiles(id),
  assigned_team_id uuid references public.teams(id),
  metadata jsonb default '{}'::jsonb,    -- Flexible storage for custom fields
  tags text[] default array[]::text[],   -- Array type for efficient tag querying
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  resolved_at timestamptz,
  closed_at timestamptz
);

-- RLS policies for tickets
alter table public.tickets enable row level security;

create policy "Customers can view own tickets"
  on public.tickets for select
  using (
    auth.uid() = customer_id or                    -- User owns the ticket
    auth.uid() in (                                -- Or user is in the assigned team
      select user_id from team_members tm
      join teams t on tm.team_id = t.id
      where t.id = tickets.assigned_team_id
    )
  );

-- Add trigger for updated_at
create trigger handle_updated_at before update on public.tickets
  for each row execute procedure moddatetime (updated_at);
```

### 4. Messages and Interactions
```sql
create type public.message_type as enum ('customer', 'agent', 'system', 'ai');

create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references public.tickets(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  message_type message_type not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies for messages
alter table public.messages enable row level security;

create policy "Users can view messages of accessible tickets"
  on public.messages for select
  using (
    ticket_id in (
      select id from tickets
      where customer_id = auth.uid() or
            assigned_agent_id = auth.uid() or
            assigned_team_id in (
              select team_id from team_members
              where user_id = auth.uid()
            )
    )
  );

-- Add trigger for updated_at
create trigger handle_updated_at before update on public.messages
  for each row execute procedure moddatetime (updated_at);
```

### 5. Knowledge Base
```sql
-- Enable vector extension in the public schema since it's used by kb_articles
create extension if not exists "vector" schema public;

create table public.kb_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  parent_id uuid references public.kb_categories(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add trigger for updated_at
create trigger handle_updated_at before update on public.kb_categories
  for each row execute procedure moddatetime (updated_at);

create table public.kb_articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  category_id uuid references public.kb_categories(id),
  author_id uuid references public.profiles(id),
  metadata jsonb default '{}'::jsonb,
  tags text[] default array[]::text[],
  embedding vector(1536),                -- OpenAI embedding dimension size for AI search
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz
);

-- Add trigger for updated_at
create trigger handle_updated_at before update on public.kb_articles
  for each row execute procedure moddatetime (updated_at);

-- RLS policies for knowledge base
alter table public.kb_categories enable row level security;
alter table public.kb_articles enable row level security;
```

### 6. Templates and Macros
```sql
create table public.response_templates (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  team_id uuid references public.teams(id),
  author_id uuid references public.profiles(id),
  tags text[] default array[]::text[],
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies for templates
alter table public.response_templates enable row level security;

-- Add trigger for updated_at
create trigger handle_updated_at before update on public.response_templates
  for each row execute procedure moddatetime (updated_at);
```

### 7. Analytics Views
```sql
-- Create materialized view for ticket metrics
create materialized view public.ticket_metrics as    -- Materialized for better query performance
select
  date_trunc('day', created_at) as day,      -- Aggregates data by day
  count(*) as total_tickets,
  sum(case when status = 'resolved' then 1 else 0 end) as resolved_tickets,
  avg(extract(epoch from (resolved_at - created_at))) as avg_resolution_time  -- Resolution time in seconds
from public.tickets
group by 1;

-- Create materialized view for agent performance
create materialized view public.agent_performance as
select
  date_trunc('day', t.created_at) as day,
  t.assigned_agent_id,
  count(*) as total_tickets,
  sum(case when t.status = 'resolved' then 1 else 0 end) as resolved_tickets,
  avg(extract(epoch from (t.resolved_at - t.created_at))) as avg_resolution_time,
  count(distinct m.id) as total_messages
from public.tickets t
left join public.messages m on t.id = m.ticket_id
where t.assigned_agent_id is not null
group by 1, 2;

-- Create refresh function
create function public.refresh_analytics_views()
returns void as $$
begin
  refresh materialized view concurrently public.ticket_metrics;
  refresh materialized view concurrently public.agent_performance;
end;
$$ language plpgsql security definer;
```

### 8. Audit Logging
```sql
-- Enable crypto extension in the public schema for audit logging
create extension if not exists "pgcrypto" schema public;
create extension if not exists "uuid-ossp" schema public;

create type public.audit_action as enum ('create', 'update', 'delete');

create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  table_name text not null,
  record_id uuid not null,
  action audit_action not null,
  old_data jsonb,
  new_data jsonb,
  actor_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- RLS policies for audit logs
alter table public.audit_logs enable row level security;

-- Create audit trigger function
create or replace function public.audit_trigger_func()
returns trigger as $$
begin
  insert into public.audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    actor_id
  )
  values (
    TG_TABLE_NAME,
    coalesce(NEW.id, OLD.id),
    TG_OP::audit_action,
    case when TG_OP = 'DELETE' then row_to_json(OLD) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then row_to_json(NEW) else null end,
    auth.uid()
  );
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

-- Add audit triggers to all tables
-- Profiles
create trigger audit_profiles_changes
  after insert or update or delete on public.profiles
  for each row execute function public.audit_trigger_func();

-- Organizations
create trigger audit_organizations_changes
  after insert or update or delete on public.organizations
  for each row execute function public.audit_trigger_func();

-- Teams
create trigger audit_teams_changes
  after insert or update or delete on public.teams
  for each row execute function public.audit_trigger_func();

-- Team Members
create trigger audit_team_members_changes
  after insert or update or delete on public.team_members
  for each row execute function public.audit_trigger_func();

-- Tickets
create trigger audit_tickets_changes
  after insert or update or delete on public.tickets
  for each row execute function public.audit_trigger_func();

-- Messages
create trigger audit_messages_changes
  after insert or update or delete on public.messages
  for each row execute function public.audit_trigger_func();

-- KB Categories
create trigger audit_kb_categories_changes
  after insert or update or delete on public.kb_categories
  for each row execute function public.audit_trigger_func();

-- KB Articles
create trigger audit_kb_articles_changes
  after insert or update or delete on public.kb_articles
  for each row execute function public.audit_trigger_func();

-- Response Templates
create trigger audit_response_templates_changes
  after insert or update or delete on public.response_templates
  for each row execute function public.audit_trigger_func();

-- Add RLS policies for audit_logs
create policy "Admins can view all audit logs"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can view audit logs for their organization"
  on public.audit_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.organization_id = (
        select organization_id from public.profiles
        where id = audit_logs.actor_id
      )
    )
  ); 
```

## Additional Considerations


1. **Indexes**
- Add appropriate indexes for frequently queried columns
- Consider partial indexes for specific queries
- Add GiST index for vector similarity search

Index file (for later):
-- Indices for "profiles"
-- Role is frequently filtered in back-office queries, organization_id is common in join queries.
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_organization_id on public.profiles (organization_id);

-- Indices for "organizations"
-- If your app frequently searches by domain, indexing can help.
create index if not exists idx_organizations_domain on public.organizations (domain);

-- Indices for "teams" and "team_members"
create index if not exists idx_teams_organization_id on public.teams (organization_id);
create index if not exists idx_team_members_user_id on public.team_members (user_id);

-- Indices for "tickets"
-- Commonly filtered columns: customer, agent, team, organization, status, priority.
create index if not exists idx_tickets_customer_id on public.tickets (customer_id);
create index if not exists idx_tickets_assigned_agent_id on public.tickets (assigned_agent_id);
create index if not exists idx_tickets_assigned_team_id on public.tickets (assigned_team_id);
create index if not exists idx_tickets_organization_id on public.tickets (organization_id);
create index if not exists idx_tickets_status on public.tickets (status);
create index if not exists idx_tickets_priority on public.tickets (priority);

-- If you frequently filter or search by tags, consider a GIN index on the array column.
create index if not exists idx_tickets_tags_gin on public.tickets using gin (tags);

-- Indices for "messages"
-- Ticket and timestamp are common for sorting or retrieving recent messages by ticket.
create index if not exists idx_messages_ticket_id on public.messages (ticket_id);
create index if not exists idx_messages_created_at on public.messages (created_at);

-- Adding vector index for "kb_articles" to speed up similarity searches.
create index if not exists idx_kb_articles_embedding
  on public.kb_articles using ivfflat (embedding vector_cosine_ops);

commit; 

2. **Functions and Triggers**
✓ Add triggers for updated_at timestamps
✓ Add triggers for audit logging
- Add functions for common operations

3. **Security**
- Implement RLS policies for each table
- Set up appropriate roles and permissions
- Configure secure defaults

4. **Performance**
- Set up appropriate partitioning for large tables
- Configure vacuum and analyze settings
- Set up appropriate maintenance tasks

## Implementation Order

1. Core authentication and user management (1)
2. Team structure (2)
3. Ticket management system (3-4)
4. Knowledge base and templates (5-6)
5. Audit and analytics (7-8)

Each migration should be tested thoroughly in a development environment before being applied to production. Make sure to have appropriate rollback procedures in place.