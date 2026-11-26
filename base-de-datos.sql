-- ALMACÉN EL CASTILLO · pega todo esto en Supabase > SQL Editor > Run

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio numeric not null,
  precio_oferta numeric,
  categoria text not null default 'Otros productos',
  imagenes text[] not null default '{}',
  activo boolean not null default true,
  destacado boolean not null default false,
  variantes jsonb not null default '[]',
  relacionados uuid[] not null default '{}',
  creado timestamptz not null default now()
);

create table if not exists configuracion (
  id int primary key default 1,
  nombre text default 'ALMACÉN EL CASTILLO',
  whatsapp text default '573103685448',
  horarios text default '',
  mensaje_franja text default '¡Lo mejor para ti! Pide por WhatsApp al 310 368 5448'
);
insert into configuracion (id) values (1) on conflict do nothing;

alter table productos enable row level security;
alter table configuracion enable row level security;

create policy "ver productos activos" on productos for select using (activo = true or auth.role() = 'authenticated');
create policy "admin gestiona productos" on productos for all to authenticated using (true) with check (true);
create policy "ver configuracion" on configuracion for select using (true);
create policy "admin gestiona configuracion" on configuracion for all to authenticated using (true) with check (true);

-- Fotos
insert into storage.buckets (id, name, public) values ('productos', 'productos', true) on conflict do nothing;
create policy "ver fotos" on storage.objects for select using (bucket_id = 'productos');
create policy "admin sube fotos" on storage.objects for insert to authenticated with check (bucket_id = 'productos');
create policy "admin borra fotos" on storage.objects for delete to authenticated using (bucket_id = 'productos');
