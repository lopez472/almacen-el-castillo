-- ALMACÉN EL CASTILLO · ACTUALIZACIÓN (franja, colores y combos)
-- Si ya tenías la tienda funcionando: pega todo esto en Supabase > SQL Editor > Run.
-- Se puede correr varias veces sin dañar nada.

alter table configuracion add column if not exists mensaje_franja text
  default '¡Lo mejor para ti! Pide por WhatsApp al 310 368 5448';
update configuracion set mensaje_franja = '¡Lo mejor para ti! Pide por WhatsApp al 310 368 5448'
  where id = 1 and mensaje_franja is null;
update configuracion set whatsapp = '573103685448' where id = 1;

-- Colores / variantes: lista de { "nombre": "Rojo", "imagen": "url de la foto" }
alter table productos add column if not exists variantes jsonb not null default '[]';
-- Productos que se ofrecen en combo con este
alter table productos add column if not exists relacionados uuid[] not null default '{}';

-- Dirección, mapa y reseñas (pie de página)
alter table configuracion add column if not exists direccion text default '';
alter table configuracion add column if not exists enlace_maps text default '';
-- Lista de { "nombre": "Ana", "estrellas": 5, "texto": "Muy buena atención" }
alter table configuracion add column if not exists resenas jsonb not null default '[]';
