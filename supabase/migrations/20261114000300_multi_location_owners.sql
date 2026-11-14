-- Mai multe locații pe același cont de administrator.
-- profiles.restaurant_id rămâne "locația activă" (toate regulile de acces
-- existente continuă să funcționeze); restaurant_owners ține lista locațiilor.

create table if not exists public.restaurant_owners (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

alter table public.restaurant_owners enable row level security;

drop policy if exists "restaurant_owners_select_own" on public.restaurant_owners;
create policy "restaurant_owners_select_own"
  on public.restaurant_owners for select to authenticated
  using (user_id = auth.uid());

revoke all on public.restaurant_owners from public, anon, authenticated;
grant select on public.restaurant_owners to authenticated;

-- Locațiile existente intră în listă.
insert into public.restaurant_owners (user_id, restaurant_id)
select id, restaurant_id from public.profiles
where role = 'restaurant_owner' and restaurant_id is not null
on conflict do nothing;

-- Orice locație nouă setată pe un administrator se adaugă automat în listă.
create or replace function public.track_restaurant_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'restaurant_owner' and new.restaurant_id is not null then
    insert into public.restaurant_owners (user_id, restaurant_id)
    values (new.id, new.restaurant_id)
    on conflict do nothing;
  end if;
  return new;
end
$$;

revoke all on function public.track_restaurant_owner() from public, anon, authenticated;

drop trigger if exists profiles_track_restaurant_owner on public.profiles;
create trigger profiles_track_restaurant_owner
after insert or update of restaurant_id, role on public.profiles
for each row execute function public.track_restaurant_owner();

-- Lista locațiilor mele.
create or replace function public.my_restaurants()
returns table (id uuid, name text, slug text, city text, status text, is_active boolean, is_current boolean)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.name, r.slug, r.city, r.status::text, r.is_active,
         r.id = (select restaurant_id from public.profiles where id = auth.uid())
  from public.restaurant_owners o
  join public.restaurants r on r.id = o.restaurant_id
  where o.user_id = auth.uid()
  order by r.created_at
$$;

revoke all on function public.my_restaurants() from public, anon;
grant execute on function public.my_restaurants() to authenticated;

-- Schimbă locația activă (doar între locațiile proprii).
create or replace function public.switch_active_restaurant(target_restaurant_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Acces interzis.';
  end if;
  if not exists (
    select 1 from public.restaurant_owners
    where user_id = auth.uid() and restaurant_id = target_restaurant_id
  ) then
    raise exception 'Acces interzis.';
  end if;
  update public.profiles
  set restaurant_id = target_restaurant_id
  where id = auth.uid() and role = 'restaurant_owner';
  return target_restaurant_id;
end
$$;

revoke all on function public.switch_active_restaurant(uuid) from public, anon;
grant execute on function public.switch_active_restaurant(uuid) to authenticated;
