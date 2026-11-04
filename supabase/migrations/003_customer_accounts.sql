-- 003: optional customer accounts (guest checkout still works).
-- Links customers/orders to Supabase auth users and lets a logged-in
-- customer read ONLY their own profile, orders, items and history.

alter table public.customers add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.orders    add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user_idx on public.orders(user_id);

-- customers table: self-service policies (admin policies already exist)
create policy "customers insert own profile"
  on public.customers for insert to authenticated
  with check (auth.uid() = user_id);
create policy "customers read own profile"
  on public.customers for select
  using (auth.uid() = user_id or public.is_admin());
create policy "customers update own profile"
  on public.customers for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- orders: logged-in customers see their own orders
create policy "customers read own orders"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());
create policy "customers read own order items"
  on public.order_items for select
  using (exists (select 1 from public.orders o
                 where o.id = order_items.order_id
                   and (o.user_id = auth.uid() or public.is_admin())));
create policy "customers read own status history"
  on public.order_status_history for select
  using (exists (select 1 from public.orders o
                 where o.id = order_status_history.order_id
                   and (o.user_id = auth.uid() or public.is_admin())));
