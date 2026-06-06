create or replace function public.auto_confirm_mvp_user()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$;

drop trigger if exists auto_confirm_mvp_user on auth.users;
create trigger auto_confirm_mvp_user
  before insert on auth.users
  for each row execute function public.auto_confirm_mvp_user();

update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;

update public.restaurant_qr_codes qr
set public_url = '/clienti/' || restaurants.slug,
    updated_at = now()
from public.restaurants
where restaurants.id = qr.restaurant_id;

insert into public.restaurant_qr_codes (restaurant_id, public_url)
select id, '/clienti/' || slug
from public.restaurants
on conflict (restaurant_id) do update
  set public_url = excluded.public_url,
      updated_at = now();
