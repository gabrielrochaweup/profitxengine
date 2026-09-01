-- Pixels de Meta/Google (Pixel ID +, pro Meta, um token da API de
-- Conversões) pra disparar eventos padrão de verdade — PageView e Lead
-- automáticos no carregamento do script, InitiateCheckout no clique do
-- link de checkout (gerado via appendRef), e Purchase via Conversions API
-- do lado do servidor quando o webhook de compra chega (não dá pra disparar
-- Purchase pelo navegador porque a compra acontece na página do checkout,
-- fora do nosso domínio). Google fica só com os eventos client-side por
-- enquanto — subir Purchase pro Google Ads exigiria a API do Google Ads
-- (OAuth), que ainda não está implementada.
create table tracking_pixels (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  platform text not null check (platform in ('meta', 'google')),
  pixel_id text not null,
  label text,
  encrypted_capi_token text,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table tracking_pixels enable row level security;

create policy "tracking_pixels_admin_all" on tracking_pixels
  for all using (public.is_admin()) with check (public.is_admin());
