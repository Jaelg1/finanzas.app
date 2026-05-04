# Mis finanzas (web)

App para registrar **ingresos** y **gastos** con **concepto** en un solo paso. Cada usuario inicia sesión con **Google** y solo ve sus propios datos.

## Requisitos

- Node.js 20+
- Una cuenta en [Supabase](https://supabase.com)

## 1. Crear proyecto en Supabase

1. Nuevo proyecto → copiá **Project URL** y **anon public** key (Settings → API).
2. En la raíz de esta carpeta, copiá el ejemplo de variables:

   ```bash
   copy .env.example .env.local
   ```

   Completá `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Tabla y seguridad (RLS)

En Supabase: **SQL Editor** → pegá el contenido de `supabase/schema.sql` → **Run**.

## 3. Inicio de sesión con Google

1. Supabase → **Authentication** → **Providers** → activá **Google** y seguí el asistente (Client ID / Secret desde [Google Cloud Console](https://console.cloud.google.com/apis/credentials)).
2. En Google Cloud, en **OAuth client** → **Authorized redirect URIs**, agregá la URL que muestra Supabase para Google (tiene forma `https://<ref>.supabase.co/auth/v1/callback`).
3. Supabase → **Authentication** → **URL Configuration**:
   - **Site URL**: `http://localhost:3000` en desarrollo; en producción, la URL de tu deploy (ej. Vercel).
   - **Redirect URLs**: agregá `http://localhost:3000/auth/callback` y la misma ruta con tu dominio público.

Opcional: desactivá el proveedor **Email** si solo querés Google (Authentication → Providers → Email).

## 4. Ejecutar en local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000), iniciá sesión con Google y probá cargar un movimiento.

## 5. Publicar (ej. Vercel)

1. Subí el repo o conectá la carpeta a Vercel.
2. Configurá las mismas variables de entorno que en `.env.local`.
3. Actualizá en Supabase **Site URL** y **Redirect URLs** con la URL de producción (`https://tu-dominio/auth/callback`).

## Estructura útil

- `src/app/dashboard` — panel, resumen por mes, lista y formulario.
- `src/app/actions.ts` — alta y baja de movimientos, cerrar sesión.
- `supabase/schema.sql` — definición de `transactions` y políticas RLS.
