-- 002: storage RLS for the public product-images bucket + realtime publication
create policy "public can read product images"
  on storage.objects for select using (bucket_id = 'product-images');
create policy "admins can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "admins can update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy "admins can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

alter publication supabase_realtime add table public.branding_settings;
alter publication supabase_realtime add table public.store_settings;
alter publication supabase_realtime add table public.contact_settings;
alter publication supabase_realtime add table public.products;
