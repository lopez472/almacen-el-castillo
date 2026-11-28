-- BARBERÍA · pega todo esto en Supabase > SQL Editor > Run (una sola vez)

-- Tipos de corte / servicios
create table if not exists servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text default '',
  precio numeric not null default 0,
  duracion_min int not null default 30,
  activo boolean not null default true,
  orden int not null default 0,
  creado timestamptz not null default now()
);

-- Barberos
create table if not exists barberos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  especialidad text default '',
  foto text default '',
  activo boolean not null default true,
  orden int not null default 0,
  creado timestamptz not null default now()
);

-- Citas (guardan una copia del nombre del corte y del barbero para el historial)
create table if not exists citas (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  nombre text not null,
  apellido text not null,
  telefono text not null,
  servicio_id uuid references servicios(id) on delete set null,
  servicio_nombre text not null,
  precio numeric not null default 0,
  duracion_min int not null default 30,
  barbero_id uuid references barberos(id) on delete set null,
  barbero_nombre text not null,
  fecha date not null,
  hora time not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','atendida','no_vino','cancelada')),
  nota text default ''
);
create index if not exists citas_barbero_fecha on citas (barbero_id, fecha);
create index if not exists citas_fecha on citas (fecha, hora);

-- Configuración general
create table if not exists configuracion (
  id int primary key default 1,
  nombre text default 'BARBERÍA',
  eslogan text default 'Agenda tu cita en menos de un minuto',
  whatsapp text default '',
  direccion text default '',
  apertura time default '09:00',
  cierre time default '20:00',
  intervalo_min int default 30,
  dias int[] default '{1,2,3,4,5,6}',      -- 0=domingo … 6=sábado
  descanso_inicio time,
  descanso_fin time,
  dias_adelante int default 14
);
insert into configuracion (id) values (1) on conflict do nothing;

-- Seguridad: el público solo lee cortes, barberos y configuración;
-- las citas solo las ve el administrador (con sesión iniciada).
alter table servicios enable row level security;
alter table barberos enable row level security;
alter table citas enable row level security;
alter table configuracion enable row level security;

drop policy if exists "leer servicios" on servicios;
create policy "leer servicios" on servicios for select using (true);
drop policy if exists "admin servicios" on servicios;
create policy "admin servicios" on servicios for all to authenticated using (true) with check (true);

drop policy if exists "leer barberos" on barberos;
create policy "leer barberos" on barberos for select using (true);
drop policy if exists "admin barberos" on barberos;
create policy "admin barberos" on barberos for all to authenticated using (true) with check (true);

drop policy if exists "leer configuracion" on configuracion;
create policy "leer configuracion" on configuracion for select using (true);
drop policy if exists "admin configuracion" on configuracion;
create policy "admin configuracion" on configuracion for all to authenticated using (true) with check (true);

drop policy if exists "admin citas" on citas;
create policy "admin citas" on citas for all to authenticated using (true) with check (true);

-- Horas ocupadas de un barbero en un día (sin datos personales)
create or replace function horas_ocupadas(p_barbero uuid, p_fecha date)
returns table (hora time, duracion int)
language sql security definer set search_path = public as $$
  select c.hora, c.duracion_min from citas c
  where c.barbero_id = p_barbero and c.fecha = p_fecha and c.estado <> 'cancelada';
$$;

-- Agendar una cita revisando que la hora siga libre
create or replace function agendar_cita(
  p_nombre text, p_apellido text, p_telefono text,
  p_servicio uuid, p_barbero uuid, p_fecha date, p_hora time
) returns uuid
language plpgsql security definer set search_path = public as $$
declare s servicios; b barberos; nuevo uuid;
begin
  if coalesce(trim(p_nombre),'') = '' or coalesce(trim(p_apellido),'') = '' or length(regexp_replace(p_telefono,'\D','','g')) < 7 then
    raise exception 'DATOS_INCOMPLETOS';
  end if;
  if p_fecha < (now() at time zone 'America/Bogota')::date then raise exception 'FECHA_PASADA'; end if;
  select * into s from servicios where id = p_servicio and activo;
  select * into b from barberos where id = p_barbero and activo;
  if s.id is null or b.id is null then raise exception 'NO_DISPONIBLE'; end if;
  perform pg_advisory_xact_lock(hashtext(p_barbero::text || p_fecha::text));
  if exists (
    select 1 from citas c
    where c.barbero_id = p_barbero and c.fecha = p_fecha and c.estado <> 'cancelada'
      and c.hora < p_hora + make_interval(mins => s.duracion_min)
      and p_hora < c.hora + make_interval(mins => c.duracion_min)
  ) then raise exception 'HORA_OCUPADA'; end if;
  insert into citas (nombre, apellido, telefono, servicio_id, servicio_nombre, precio, duracion_min, barbero_id, barbero_nombre, fecha, hora)
  values (trim(p_nombre), trim(p_apellido), regexp_replace(p_telefono,'\D','','g'), s.id, s.nombre, s.precio, s.duracion_min, b.id, b.nombre, p_fecha, p_hora)
  returning id into nuevo;
  return nuevo;
end $$;

grant execute on function horas_ocupadas(uuid, date) to anon, authenticated;
grant execute on function agendar_cita(text, text, text, uuid, uuid, date, time) to anon, authenticated;

-- Fotos de los barberos
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true) on conflict do nothing;
drop policy if exists "fotos publicas" on storage.objects;
create policy "fotos publicas" on storage.objects for select using (bucket_id = 'fotos');
drop policy if exists "admin sube fotos" on storage.objects;
create policy "admin sube fotos" on storage.objects for all to authenticated using (bucket_id = 'fotos') with check (bucket_id = 'fotos');

-- Datos de ejemplo (puedes editarlos o borrarlos desde el panel)
insert into servicios (nombre, descripcion, precio, duracion_min, orden)
select * from (values
  ('Corte clásico', 'Tijera y máquina, acabado limpio', 20000, 30, 1),
  ('Fade / Degradado', 'Degradado bajo, medio o alto', 25000, 40, 2),
  ('Corte + Barba', 'Corte completo y perfilado de barba', 35000, 60, 3),
  ('Barba', 'Perfilado con navaja y toalla caliente', 15000, 20, 4)
) v where not exists (select 1 from servicios);
