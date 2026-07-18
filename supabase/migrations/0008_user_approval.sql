-- Cadastro público com aprovação manual pelo Admin
alter table profiles
  add column if not exists status text check (status in ('pending', 'approved', 'rejected')) default 'approved' not null;

-- Novos cadastros (via signUp) entram como 'pending' até um admin aprovar.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, status)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'editor', 'pending');
  return new;
end;
$$;

-- profiles não guarda e-mail (fica em auth.users); RPC pro Admin listar usuários com e-mail.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  status text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, u.email, p.full_name, p.role, p.status, p.created_at
  from profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;
