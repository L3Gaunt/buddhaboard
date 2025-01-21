-- Start transaction
begin;

-- Plan the tests
select plan(20);

-- Create test helper schema if it doesn't exist
create schema if not exists tests;

-- Grant necessary permissions
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;
grant usage on schema auth to authenticated, anon, postgres;
grant all on all tables in schema auth to authenticated, anon, postgres;
grant all on all sequences in schema auth to authenticated, anon, postgres;
grant execute on all functions in schema auth to authenticated, anon, postgres;

-- Create helper functions
create or replace function tests.create_supabase_user(email text, user_role text default 'customer')
returns uuid as $$
declare
  user_id uuid;
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    '',
    now(),
    now(),
    now(),
    '{"provider": "email"}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) returning id into user_id;

  -- Insert into user_roles table
  insert into public.user_roles (user_id, role)
  values (user_id, user_role::public.app_role);
  
  return user_id;
end;
$$ language plpgsql security definer;

create or replace function tests.get_supabase_uid(email text)
returns uuid as $$
  select id from auth.users where email = $1;
$$ language sql;

-- Create helper functions to bypass RLS
create or replace function tests.count_profiles()
returns bigint as $$
  select count(*) from public.profiles;
$$ language sql security definer;

create or replace function tests.get_user_role(uid uuid)
returns public.app_role as $$
  select role from public.user_roles where user_id = uid;
$$ language sql security definer;

create or replace function tests.update_profile_name(uid uuid, new_name text)
returns void as $$
  update public.profiles set full_name = new_name where id = uid;
$$ language sql security definer;

create or replace function tests.set_auth_user(uid uuid)
returns void as $$
declare
  user_role public.app_role;
  claims jsonb;
begin
  -- Get the user's role
  select role into user_role from public.user_roles where user_id = uid;
  
  -- Build claims with user_role
  claims := json_build_object(
    'sub', uid::text,
    'role', 'authenticated',
    'user_role', user_role::text
  );
  
  -- Set the authenticated role and claims
  set local role to 'authenticated';
  perform set_config('request.jwt.claims', claims::text, true);
end;
$$ language plpgsql security definer;

-- Insert default role permissions if not exists
insert into public.role_permissions (role, permission)
values
  ('admin', 'profiles.read'),
  ('admin', 'profiles.write'),
  ('admin', 'profiles.delete'),
  ('agent', 'profiles.read'),
  ('agent', 'profiles.write'),
  ('customer', 'profiles.read')
on conflict (role, permission) do nothing;

-- Run the tests
select has_type(
    'public', 'app_role',
    'Should have app_role enum type'
);

select has_type(
    'public', 'app_permission',
    'Should have app_permission enum type'
);

select enum_has_labels(
    'public', 'app_role',
    ARRAY['customer', 'agent', 'admin'],
    'app_role should have correct labels'
);

select enum_has_labels(
    'public', 'app_permission',
    ARRAY['profiles.read', 'profiles.write', 'profiles.delete'],
    'app_permission should have correct labels'
);

select has_table(
    'public', 'profiles',
    'Should have profiles table'
);

select has_table(
    'public', 'role_permissions',
    'Should have role_permissions table'
);

select has_table(
    'public', 'user_roles',
    'Should have user_roles table'
);

select has_column(
    'public', 'profiles', 'id',
    'Should have id column'
);

select has_column(
    'public', 'profiles', 'full_name',
    'Should have full_name column'
);

select has_column(
    'public', 'profiles', 'avatar_url',
    'Should have avatar_url column'
);

select has_column(
    'public', 'profiles', 'metadata',
    'Should have metadata column'
);

select col_is_pk(
    'public', 'profiles', 'id',
    'id should be primary key'
);

-- Create test users
select tests.create_supabase_user('test_customer@example.com', 'customer');
select tests.create_supabase_user('test_agent@example.com', 'agent');
select tests.create_supabase_user('test_admin@example.com', 'admin');

-- Set up test data
insert into public.profiles (id, full_name)
values 
  (tests.get_supabase_uid('test_customer@example.com'), 'Test Customer'),
  (tests.get_supabase_uid('test_agent@example.com'), 'Test Agent'),
  (tests.get_supabase_uid('test_admin@example.com'), 'Test Admin');

-- Test RLS policies as customer
select tests.set_auth_user(tests.get_supabase_uid('test_customer@example.com'));

select results_eq(
    'select count(*) from public.profiles',
    ARRAY[1::bigint],
    'Customer should only see their own profile (read permission)'
);

-- Test as agent
select tests.set_auth_user(tests.get_supabase_uid('test_agent@example.com'));

select results_eq(
    'select count(*) from public.profiles',
    ARRAY[3::bigint],
    'Agent should see all profiles (read permission)'
);

-- Test as admin
select tests.set_auth_user(tests.get_supabase_uid('test_admin@example.com'));

select results_eq(
    'select count(*) from public.profiles',
    ARRAY[3::bigint],
    'Admin should see all profiles'
);

-- Test update policies
select tests.set_auth_user(tests.get_supabase_uid('test_customer@example.com'));

prepare update_own_profile as 
    update public.profiles set full_name = 'Updated Customer'
    where id = tests.get_supabase_uid('test_customer@example.com');

prepare update_other_profile as 
    update public.profiles set full_name = 'Should Fail'
    where id = tests.get_supabase_uid('test_admin@example.com');

select lives_ok(
    'update_own_profile',
    'Customer should be able to update their own profile'
);

select throws_ok(
    'update_other_profile',
    'Customer should not be able to update other profiles'
);

-- Test delete permission (admin only)
select tests.set_auth_user(tests.get_supabase_uid('test_admin@example.com'));

prepare delete_profile as
    delete from public.profiles 
    where id = tests.get_supabase_uid('test_customer@example.com');

select lives_ok(
    'delete_profile',
    'Admin should be able to delete profiles'
);

-- Test role permissions count
select results_eq(
    'select count(*) from public.role_permissions',
    ARRAY[6::bigint],
    'Should have correct number of role permissions'
);

-- Test updated_at trigger
select has_trigger(
    'public', 'profiles', 'handle_updated_at',
    'Should have updated_at trigger'
);

-- Finish the tests
select * from finish();

-- Rollback the transaction
rollback; 