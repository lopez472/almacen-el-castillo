# ALMACÉN EL CASTILLO · tienda + administrador

La tienda pública está en la dirección principal (`/`) y el administrador en `/admin`.
Los pedidos llegan por WhatsApp (573103685448).

## Pasos desde el celular

1. **Supabase** (supabase.com): crea un proyecto nuevo.
   - Abre *SQL Editor*, pega todo `base-de-datos.sql` y toca *Run*.
   - En *Authentication > Users > Add user* crea tu correo y contraseña de administrador.
   - En *Project Settings > API* copia la **Project URL** y la **anon public key**.
2. **GitHub** (github.com): crea un repositorio y sube estos archivos
   (*Add file > Upload files*). Primero descomprime el zip en la app Archivos.
3. **Netlify** (netlify.com): *Add new site > Import from GitHub*, elige el repositorio.
   Antes de publicar, en *Environment variables* agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = tu Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key
4. Toca **Deploy**. Cuando termine, abre `tu-sitio.netlify.app/admin`, entra con tu correo y sube productos.

## Qué incluye
Catálogo con búsqueda y categorías, ofertas, carrito con pedido por WhatsApp, botón flotante de WhatsApp,
y administrador privado (productos, fotos desde el iPhone, ocultar/mostrar, WhatsApp y horarios).

## Actualización: logo, me gusta, presupuesto, combos y colores
Si la tienda ya estaba funcionando, entra a Supabase > *SQL Editor*, pega todo
`actualizar-base-de-datos.sql` y toca *Run* (una sola vez). Agrega:
- el **mensaje de la franja** de arriba (se cambia en `/admin` > Configuración general),
- los **colores** de cada producto, cada uno con su foto,
- los **productos para combo** de cada producto.

En la tienda: corazón de *me gusta* (arriba a la izquierda), logo en el centro, lupa y carrito a la
derecha, "¿Cuánto quieres gastar?" con combo sugerido, galería de varias fotos por producto, y el
pedido completo (cada artículo, color, cantidad, subtotal y total) se envía por WhatsApp al 310 368 5448.

## Dirección, mapa y reseñas (pie de página)
En `/admin` > Configuración general escribe la **dirección** del almacén: al final de la tienda sale el
mapa de Google, el botón **Cómo llegar** (abre Google Maps con la ruta) y las **reseñas** que agregues.
Requiere haber corrido `actualizar-base-de-datos.sql` (incluye las columnas nuevas).
