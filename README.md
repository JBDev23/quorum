# quorum

App móvil (Expo 57) para asambleas con acreditación QR, voto anónimo y resultados en vivo.

## Requisitos

- Node 20+
- [pnpm](https://pnpm.io) 9.15
- Cuenta Supabase (proyecto ya enlazado o uno nuevo)
- Para builds nativos: EAS / Android Studio / Xcode

## Arranque rápido

```bash
pnpm install
cp .env.example .env
# Rellena EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY
pnpm start
```

Si faltan las variables públicas de Supabase, la app **falla al arrancar** con un mensaje explícito (no con un error opaco más tarde).

### Variables de entorno

| Variable | Dónde | Uso |
|----------|--------|-----|
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` (cliente) | URL del proyecto |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` (cliente) | Clave anon / publishable |
| `EXPO_PUBLIC_REVENUECAT_*` | `.env` (cliente) | Paywall Premium |
| `SUPABASE_SERVICE_ROLE_KEY` | solo scripts locales | `pnpm db:seed` — **nunca** en la app |
| Secrets de Edge Functions | Dashboard → Edge Functions → Secrets | `REVENUECAT_*`, `PUSH_DISPATCH_SECRET`, `EXPO_ACCESS_TOKEN` |

Detalles y comentarios: ver `.env.example`.

### Auth redirects

Scheme: `quorum://`  
Callback OAuth / magic link: `quorum://auth/callback`  
Configúralo en Supabase → Authentication → URL Configuration.

OAuth (Google/Apple) requiere un **dev client / build nativo** (no Expo Go).

## Base de datos

Migraciones en `supabase/migrations/`:

1. `20260910161802_baseline_core_schema.sql` — esquema completo (tablas, RLS, RPCs, realtime, cron).
2. Stubs intermedios — alinean el historial con el proyecto remoto (contenido ya incluido en el baseline).
3. `20260917185549_device_push_tokens.sql` — tokens push + triggers.

```bash
npx supabase link --project-ref YOUR_REF
npx supabase db reset   # solo entorno local / vacío
# o
npx supabase db push
```

Seed de datos de prueba:

```bash
pnpm db:seed
```

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm start` | Metro con cache limpia |
| `pnpm android` / `pnpm ios` | Dev client nativo |
| `pnpm db:seed` | Semilla vía service role |

## Estructura relevante

- `src/app` — rutas Expo Router
- `src/services` — acceso a Supabase
- `src/components/voting` — urna, resultados, estados
- `supabase/functions` — Premium, push, borrar cuenta

## Notas de producto

- El **hash de recibo** se guarda en el dispositivo tras votar; en servidor el voto es anónimo (`cast_votes` sin `user_id`). La caja fuerte muestra el hash local cuando existe.
- Tras cerrar una reunión, los miembros ven el escrutinio de las urnas cerradas.
