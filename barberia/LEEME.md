# BARBERÍA · agenda de citas + panel

Página en blanco y negro para que los clientes agenden su cita y un panel para la barbería.

**Cliente (dirección principal `/`):**
1. Escribe nombre, apellido y celular (se recuerdan para la próxima vez).
2. Elige el tipo de corte.
3. Elige el barbero.
4. Elige el día (solo los días que abren).
5. Elige la hora (solo horas libres de ese barbero, según la duración del corte).
6. Revisa y confirma. Puede enviar la confirmación por WhatsApp a la barbería.

**Panel (`/admin`):**
- **Citas** (lo primero que se ve): hoy, mañana, próximas o un día específico; filtro por barbero
  (cada barbero puede dejar seleccionado su nombre en su celular); botones para llamar, escribir por
  WhatsApp con recordatorio, marcar atendida, no vino o cancelar. Se actualiza solo cada 30 segundos.
- **Tipos de corte**: agregar, editar, ordenar, ocultar o borrar (nombre, precio, duración, descripción).
- **Barberos**: agregar, editar, foto, activar/desactivar o borrar.
- **Ajustes**: nombre, frase, WhatsApp, dirección, días que abren, horario, almuerzo, cada cuánto se
  muestran las horas y hasta cuántos días adelante se puede agendar.

Dos personas no pueden tomar la misma hora con el mismo barbero: la base de datos lo revisa al confirmar.

## Modo demostración
Si no hay llaves de Supabase, la página funciona en **modo demostración** (los datos quedan solo en
ese navegador y el panel acepta cualquier correo). Sirve para probarla antes de publicarla.

## Publicarla (cuando se decida)
1. **Supabase** (supabase.com): proyecto nuevo → *SQL Editor* → pega todo `base-de-datos.sql` → *Run*.
   En *Authentication > Users > Add user* crea el correo y la contraseña del panel.
   En *Project Settings > API* copia la **Project URL** y la **anon public key**.
2. **Netlify**: *Add new site > Import from GitHub*, elige el repositorio y en **Base directory** escribe `barberia`.
   En *Environment variables* agrega:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
3. *Deploy*. Entra a `tu-sitio.netlify.app/admin`, ajusta nombre, WhatsApp, horario, cortes y barberos.
