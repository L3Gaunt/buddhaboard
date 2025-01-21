-- Enable the moddatetime extension
create extension if not exists moddatetime schema extensions;

-- Create a function to automatically update the updated_at timestamp
create or replace function public.moddatetime()
returns trigger as $$
begin
    new.updated_at = current_timestamp;
    return new;
end;
$$ language plpgsql; 