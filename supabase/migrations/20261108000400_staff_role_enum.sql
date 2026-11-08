-- Rol pentru personalul din locație (vede comenzile și le procesează; nu editează meniul/setările).
alter type public.app_role add value if not exists 'restaurant_staff';
