-- Amigo Secreto de Livros — schema Supabase
-- Rode inteiro no SQL Editor do Supabase.

-- ========== Tabelas ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.books (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  author text not null check (char_length(author) between 1 and 200),
  link text check (link is null or link ~* '^https?://'),
  created_at timestamptz not null default now()
);
create index books_user_idx on public.books(user_id);

create table public.draw (
  giver_id uuid primary key references public.profiles(id) on delete cascade,
  receiver_id uuid not null unique references public.profiles(id) on delete cascade,
  check (giver_id <> receiver_id)
);

create table public.settings (
  id int primary key default 1 check (id = 1),
  draw_done boolean not null default false
);
insert into public.settings (id) values (1);

-- ========== Helpers ==========
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ========== Cadastro: cria profile (bloqueado após o sorteio) ==========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select draw_done from public.settings where id = 1) then
    raise exception 'O sorteio já foi realizado; cadastros encerrados';
  end if;

  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== Limite de 3 livros por pessoa (vale antes e depois do sorteio) ==========
create or replace function public.enforce_book_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT'
     and (select count(*) from public.books where user_id = new.user_id) >= 3 then
    raise exception 'Máximo de 3 livros por pessoa';
  end if;
  return new;
end $$;

create trigger books_rules
  before insert or update on public.books
  for each row execute function public.enforce_book_rules();

-- ========== RLS ==========
alter table public.profiles enable row level security;
alter table public.books    enable row level security;
alter table public.draw     enable row level security;
alter table public.settings enable row level security;

-- profiles: o próprio, o admin, e quem eu tirei (para mostrar o nome)
create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.draw d where d.giver_id = auth.uid() and d.receiver_id = profiles.id)
);

-- books: dono faz CRUD; admin lê; quem tirou o dono lê
create policy books_select on public.books for select using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.draw d where d.giver_id = auth.uid() and d.receiver_id = books.user_id)
);
create policy books_insert on public.books for insert with check (user_id = auth.uid());
create policy books_update on public.books for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy books_delete on public.books for delete using (user_id = auth.uid());

-- draw: só a própria linha (ou tudo para admin). Sem insert/update direto.
create policy draw_select on public.draw for select using (
  giver_id = auth.uid() or public.is_admin()
);

-- settings: acesso direto bloqueado; todos leem draw_done pela view abaixo
revoke all on public.settings from anon, authenticated;
create or replace view public.public_settings as
  select draw_done from public.settings where id = 1;
grant select on public.public_settings to anon, authenticated;

-- ========== Sorteio ==========
-- Retorna lista de quem ainda não cadastrou livros, sem sortear, quando p_force = false.
create or replace function public.run_draw(p_force boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  ids uuid[];
  n int;
  missing jsonb;
begin
  if not public.is_admin() then
    raise exception 'Apenas o admin pode sortear';
  end if;
  if (select draw_done from public.settings where id = 1) then
    raise exception 'Sorteio já foi realizado';
  end if;

  select array_agg(id order by random()) into ids from public.profiles where not is_admin;
  n := coalesce(array_length(ids, 1), 0);
  if n < 2 then
    raise exception 'São necessários pelo menos 2 participantes';
  end if;

  select coalesce(jsonb_agg(p.name), '[]'::jsonb) into missing
  from public.profiles p
  where not p.is_admin and not exists (select 1 from public.books b where b.user_id = p.id);

  if jsonb_array_length(missing) > 0 and not p_force then
    return jsonb_build_object('done', false, 'missing_books', missing);
  end if;

  -- Rotação cíclica de uma permutação aleatória: ninguém tira a si mesmo,
  -- ninguém se repete, e é garantido para n >= 2.
  -- ids já está em ordem aleatória; cada um tira o próximo da lista (e o último tira o primeiro).
  for i in 1..n loop
    insert into public.draw (giver_id, receiver_id)
    values (ids[i], ids[(i % n) + 1]);
  end loop;

  update public.settings set draw_done = true where id = 1;
  return jsonb_build_object('done', true, 'participants', n);
end $$;

revoke all on function public.run_draw(boolean) from public, anon;
grant execute on function public.run_draw(boolean) to authenticated;

-- Reset do sorteio (admin), caso precise refazer
create or replace function public.reset_draw()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas o admin pode resetar';
  end if;
  delete from public.draw where true; -- o Supabase exige WHERE em DELETE (pg-safeupdate)
  update public.settings set draw_done = false where id = 1;
end $$;
revoke all on function public.reset_draw() from public, anon;
grant execute on function public.reset_draw() to authenticated;

-- ========== Setup manual do admin ==========
-- 1) Crie seu usuário normalmente pelo site (ou Auth > Users no painel).
-- 2) Rode:  update public.profiles set is_admin = true where email = 'SEU_EMAIL';
