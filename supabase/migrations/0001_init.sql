-- LabStock Web — başlangıç şeması
-- Çok kullanıcılı: her kullanıcının deposu RLS ile veritabanı seviyesinde izole.
--
-- Temel ayrım:
--   parts        → ORTAK katalog (herkes okur, herkes katkı verir)
--   locations    → kullanıcıya ait hiyerarşik konum ağacı
--   stock_items  → kullanıcının elindeki stok (parça × konum)
--   stock_movements → hareket defteri; adet buradan türetilebilir olsun diye her +/- loglanır

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- profiles

create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  ad             text,
  telefon        text,
  sirket_adi     text,
  sirket_adresi  text,
  created_at     timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, ad)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'ad', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------ parts
-- Ortak parça kataloğu. Kullanıcıdan bağımsız: herkes ekledikçe büyüyen,
-- Türkçe kategorili bir parça veritabanı oluşur.

create table if not exists public.parts (
  id            uuid primary key default gen_random_uuid(),
  mpn           text not null,
  uretici       text,
  aciklama      text,
  kategori      text,
  kilif         text,
  datasheet_url text,
  parametreler  jsonb not null default '{}'::jsonb,
  rohs          boolean,
  olusturan     uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

create unique index if not exists parts_mpn_uretici_key
  on public.parts (lower(mpn), coalesce(lower(uretici), ''));
create index if not exists parts_mpn_trgm
  on public.parts using gin (mpn gin_trgm_ops);
create index if not exists parts_aciklama_trgm
  on public.parts using gin (aciklama gin_trgm_ops);
create index if not exists parts_kategori_idx on public.parts (kategori);

-- -------------------------------------------------------------- locations
-- oda › dolap › çekmece › bölme — parent_id ile ağaç.

create table if not exists public.locations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  parent_id  uuid references public.locations (id) on delete cascade,
  ad         text not null,
  kod        text,
  tip        text,
  aciklama   text,
  sira       integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists locations_user_parent_idx on public.locations (user_id, parent_id, sira);
create unique index if not exists locations_user_kod_key
  on public.locations (user_id, lower(kod)) where kod is not null;

-- --------------------------------------------------------------- projects

create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ad         text not null,
  aciklama   text,
  durum      text not null default 'aktif',
  created_at timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects (user_id);

-- ------------------------------------------------------------ stock_items

create table if not exists public.stock_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  part_id        uuid not null references public.parts (id) on delete restrict,
  location_id    uuid references public.locations (id) on delete set null,
  adet           numeric(14, 3) not null default 0,
  min_adet       numeric(14, 3) not null default 0,
  birim          text not null default 'adet',
  alis_fiyati    numeric(12, 4),
  para_birimi    text not null default 'TRY',
  tedarikci      text,
  tedarikci_kodu text,
  notlar         text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Aynı parça aynı konumda tek satır (konumu boş olanlar da tek satır: nulls not distinct)
create unique index if not exists stock_items_uniq
  on public.stock_items (user_id, part_id, location_id) nulls not distinct;
create index if not exists stock_items_user_idx on public.stock_items (user_id);
create index if not exists stock_items_location_idx on public.stock_items (location_id);

-- -------------------------------------------------------- stock_movements
-- Hareket defteri. Adedi doğrudan yazmak yerine her değişimi loglamak;
-- BOM/proje düşümü, "nereye gitti bu 50 direnç" ve geri alma bunun üstüne oturur.

create table if not exists public.stock_movements (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  stock_item_id uuid not null references public.stock_items (id) on delete cascade,
  delta         numeric(14, 3) not null,
  sonraki_adet  numeric(14, 3) not null,
  sebep         text not null default 'manuel',
  proje_id      uuid references public.projects (id) on delete set null,
  aciklama      text,
  created_at    timestamptz not null default now()
);

create index if not exists stock_movements_item_idx on public.stock_movements (stock_item_id, created_at desc);
create index if not exists stock_movements_user_idx on public.stock_movements (user_id, created_at desc);

-- ------------------------------------------------------------ project_bom

create table if not exists public.project_bom (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  proje_id   uuid not null references public.projects (id) on delete cascade,
  part_id    uuid not null references public.parts (id) on delete restrict,
  adet       numeric(14, 3) not null default 1,
  referans   text,
  created_at timestamptz not null default now()
);

create unique index if not exists project_bom_uniq on public.project_bom (proje_id, part_id);

-- -------------------------------------------------------------- part_suppliers
-- Ortak fiyat/tedarikçi karşılaştırma listesi (parça başına birden fazla satır).
-- parts gibi ortak katalog: herkes okur, ekleyen düzenler/siler.

create table if not exists public.part_suppliers (
  id             uuid primary key default gen_random_uuid(),
  part_id        uuid not null references public.parts (id) on delete cascade,
  tedarikci      text not null,
  tedarikci_kodu text,
  fiyat          numeric(12, 4),
  para_birimi    text not null default 'TRY',
  olusturan      uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists part_suppliers_part_idx on public.part_suppliers (part_id);

-- ------------------------------------------------------------------------ tags
-- Kullanıcıya özel etiketler; bir stok kalemine (konum×parça değil, tam olarak
-- stock_items satırına) birden fazla etiket iliştirilebilir.

create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ad         text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists tags_user_ad_uniq on public.tags (user_id, lower(ad));

create table if not exists public.stock_item_tags (
  stock_item_id uuid not null references public.stock_items (id) on delete cascade,
  tag_id        uuid not null references public.tags (id) on delete cascade,
  primary key (stock_item_id, tag_id)
);

-- ------------------------------------------------------------------- RLS

alter table public.profiles        enable row level security;
alter table public.parts           enable row level security;
alter table public.locations       enable row level security;
alter table public.projects        enable row level security;
alter table public.stock_items     enable row level security;
alter table public.stock_movements enable row level security;
alter table public.project_bom     enable row level security;
alter table public.part_suppliers  enable row level security;
alter table public.tags            enable row level security;
alter table public.stock_item_tags enable row level security;

-- profiles: kendi profilin
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- parts: ortak katalog — herkes okur, giriş yapan ekler, sadece ekleyen düzenler
drop policy if exists parts_read on public.parts;
create policy parts_read on public.parts
  for select to authenticated using (true);

drop policy if exists parts_insert on public.parts;
create policy parts_insert on public.parts
  for insert to authenticated
  with check (olusturan = (select auth.uid()));

drop policy if exists parts_update_own on public.parts;
create policy parts_update_own on public.parts
  for update to authenticated
  using (olusturan = (select auth.uid()))
  with check (olusturan = (select auth.uid()));

-- kullanıcıya ait tablolar: tek kalıp
drop policy if exists locations_own on public.locations;
create policy locations_own on public.locations
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists projects_own on public.projects;
create policy projects_own on public.projects
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists stock_items_own on public.stock_items;
create policy stock_items_own on public.stock_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists stock_movements_own on public.stock_movements;
create policy stock_movements_own on public.stock_movements
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists project_bom_own on public.project_bom;
create policy project_bom_own on public.project_bom
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- part_suppliers: ortak katalog — herkes okur, giriş yapan ekler, sadece ekleyen düzenler/siler
drop policy if exists part_suppliers_read on public.part_suppliers;
create policy part_suppliers_read on public.part_suppliers
  for select to authenticated using (true);

drop policy if exists part_suppliers_insert on public.part_suppliers;
create policy part_suppliers_insert on public.part_suppliers
  for insert to authenticated
  with check (olusturan = (select auth.uid()));

drop policy if exists part_suppliers_update_own on public.part_suppliers;
create policy part_suppliers_update_own on public.part_suppliers
  for update to authenticated
  using (olusturan = (select auth.uid()))
  with check (olusturan = (select auth.uid()));

drop policy if exists part_suppliers_delete_own on public.part_suppliers;
create policy part_suppliers_delete_own on public.part_suppliers
  for delete to authenticated
  using (olusturan = (select auth.uid()));

-- tags: kullanıcıya ait
drop policy if exists tags_own on public.tags;
create policy tags_own on public.tags
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- stock_item_tags: sadece kendi stock_items satırına bağlıysa
drop policy if exists stock_item_tags_own on public.stock_item_tags;
create policy stock_item_tags_own on public.stock_item_tags
  for all to authenticated
  using (
    exists (
      select 1 from public.stock_items si
      where si.id = stock_item_id and si.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.stock_items si
      where si.id = stock_item_id and si.user_id = (select auth.uid())
    )
  );

-- ------------------------------------------------------------- envanter view
-- Liste ekranının tek sorguluk kaynağı. security_invoker: RLS çağıranın
-- kimliğiyle uygulanır, view bir yetki kaçağı olmaz.

create or replace view public.envanter
with (security_invoker = true) as
select
  si.id            as stok_id,
  si.user_id,
  si.adet,
  si.min_adet,
  si.birim,
  si.tedarikci,
  si.tedarikci_kodu,
  si.alis_fiyati,
  si.para_birimi,
  si.updated_at,
  p.id             as part_id,
  p.mpn,
  p.uretici,
  p.aciklama,
  p.kategori,
  p.kilif,
  p.datasheet_url,
  p.parametreler,
  p.rohs,
  l.id             as konum_id,
  l.kod            as konum_kodu,
  l.ad             as konum_adi,
  case
    when si.adet <= 0                                    then 'yok'
    when si.min_adet > 0 and si.adet < si.min_adet       then 'kritik'
    when si.min_adet > 0 and si.adet < si.min_adet * 1.5 then 'az'
    else 'yeterli'
  end              as durum
from public.stock_items si
join public.parts p on p.id = si.part_id
left join public.locations l on l.id = si.location_id;

-- --------------------------------------------------------- stok_hareket()
-- Adet güncelleme + hareket kaydı tek işlemde. security invoker → RLS geçerli.

create or replace function public.stok_hareket(
  p_stok_id  uuid,
  p_delta    numeric,
  p_sebep    text default 'manuel',
  p_aciklama text default null,
  p_proje_id uuid default null
)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_yeni numeric;
begin
  if p_delta = 0 then
    raise exception 'Hareket miktarı sıfır olamaz';
  end if;

  update public.stock_items
     set adet = adet + p_delta,
         updated_at = now()
   where id = p_stok_id
  returning adet into v_yeni;

  if v_yeni is null then
    raise exception 'Stok kalemi bulunamadı veya erişim yok';
  end if;

  if v_yeni < 0 then
    raise exception 'Stok negatife düşemez (mevcut: %, istenen: %)', v_yeni - p_delta, p_delta;
  end if;

  insert into public.stock_movements (stock_item_id, delta, sonraki_adet, sebep, aciklama, proje_id)
  values (p_stok_id, p_delta, v_yeni, p_sebep, p_aciklama, p_proje_id);

  return v_yeni;
end;
$$;
