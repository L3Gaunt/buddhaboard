-- Reset data in tables (using CASCADE to handle dependencies)
TRUNCATE auth.users CASCADE;
TRUNCATE public.profiles CASCADE;
TRUNCATE public.user_roles CASCADE;
TRUNCATE public.role_permissions CASCADE;

-- Insert users into auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data, encrypted_password)
VALUES 
  -- Admin
  ('d0d54e51-cc10-4a05-a4fc-8b80c0f6c975', 'admin@example.com', 
   jsonb_build_object('full_name', 'Admin User'),
   crypt('password123', gen_salt('bf'))),
  
  -- Customers
  ('b5b6c10a-d5e3-4640-9524-a0fe0c38c923', 'customer1@example.com',
   jsonb_build_object('full_name', 'John Customer'),
   crypt('password123', gen_salt('bf'))),
  ('e7d4c6b8-f2a1-4835-b853-79e4c6d1c923', 'customer2@example.com',
   jsonb_build_object('full_name', 'Jane Customer'),
   crypt('password123', gen_salt('bf'))),
  
  -- Agents
  ('a1b2c3d4-e5f6-4321-b123-a1b2c3d4e5f6', 'agent1@example.com',
   jsonb_build_object('full_name', 'Bob Agent'),
   crypt('password123', gen_salt('bf'))),
  ('f6e5d4c3-b2a1-4321-b123-f6e5d4c3b2a1', 'agent2@example.com',
   jsonb_build_object('full_name', 'Alice Agent'),
   crypt('password123', gen_salt('bf')));

-- Insert user roles
INSERT INTO public.user_roles (user_id, role)
VALUES
  -- Admin
  ('d0d54e51-cc10-4a05-a4fc-8b80c0f6c975', 'admin'),
  
  -- Customers
  ('b5b6c10a-d5e3-4640-9524-a0fe0c38c923', 'customer'),
  ('e7d4c6b8-f2a1-4835-b853-79e4c6d1c923', 'customer'),
  
  -- Agents
  ('a1b2c3d4-e5f6-4321-b123-a1b2c3d4e5f6', 'agent'),
  ('f6e5d4c3-b2a1-4321-b123-f6e5d4c3b2a1', 'agent');

-- Insert role permissions
INSERT INTO public.role_permissions (role, permission)
VALUES
  -- Admin permissions
  ('admin', 'profiles.read'),
  ('admin', 'profiles.write'),
  ('admin', 'profiles.delete'),
  
  -- Agent permissions
  ('agent', 'profiles.read'),
  ('agent', 'profiles.write'),
  
  -- Customer permissions
  ('customer', 'profiles.read');

-- Insert corresponding profiles
INSERT INTO public.profiles (id, full_name)
VALUES
  -- Admin
  ('d0d54e51-cc10-4a05-a4fc-8b80c0f6c975', 'Admin User'),
  
  -- Customers
  ('b5b6c10a-d5e3-4640-9524-a0fe0c38c923', 'John Customer'),
  ('e7d4c6b8-f2a1-4835-b853-79e4c6d1c923', 'Jane Customer'),
  
  -- Agents
  ('a1b2c3d4-e5f6-4321-b123-a1b2c3d4e5f6', 'Bob Agent'),
  ('f6e5d4c3-b2a1-4321-b123-f6e5d4c3b2a1', 'Alice Agent');

-- Verify the data
SELECT 'auth.users' as table_name, count(*) as count FROM auth.users
UNION ALL
SELECT 'public.profiles' as table_name, count(*) FROM public.profiles
UNION ALL
SELECT 'public.user_roles' as table_name, count(*) FROM public.user_roles
UNION ALL
SELECT 'public.role_permissions' as table_name, count(*) FROM public.role_permissions; 