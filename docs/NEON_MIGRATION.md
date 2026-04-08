# Migracion a Neon PostgreSQL (Postgres 17)

## Resumen
Se migro la capa de persistencia de Firebase Realtime Database a Neon (PostgreSQL).

### Cambios principales
- `src/lib/db.ts`: Reescrito para usar Neon SQL (`@neondatabase/serverless`).
- Nuevos endpoints REST para proyectos:
  - `src/app/api/projects/route.ts`
  - `src/app/api/projects/[id]/route.ts`
- `src/app/api/records/route.ts`: ahora permite `?projectId=` para filtrar.
- `src/app/page.tsx`: cliente actualizado para consumir API server-side en lugar de importar DB directo.

## Seguridad
- La variable `DATABASE_URL` se usa solo del lado servidor.
- `.env.local` no se sube a git (`.gitignore` ya contiene `.env*`).
- Recomendado: crear rol de app con privilegios minimos en Neon (evitar `owner` para runtime).

## Inicializacion automatica
La app crea tablas e indices automaticamente en el primer acceso via `ensureSchema()`.

## Esquema de base de datos

### Tabla `projects`
- `id` (TEXT, PK)
- `name` (TEXT, NOT NULL)
- `description` (TEXT)
- `color` (TEXT, NOT NULL)
- `icon` (TEXT, NOT NULL)
- `actors` (JSONB, NOT NULL, default `[]`)
- `created_at` (TIMESTAMPTZ, NOT NULL)

### Tabla `records`
- `id` (TEXT, PK)
- `project_id` (TEXT, FK -> `projects.id`, ON DELETE CASCADE)
- `actor` (TEXT, NOT NULL)
- `modulo` (TEXT, NOT NULL)
- `tipo_error` (TEXT)
- `device` (TEXT)
- `resolution` (TEXT)
- `titulo` (TEXT, NOT NULL)
- `pasos_reproducir` (TEXT)
- `resultado_esperado` (TEXT)
- `resultado_actual` (TEXT)
- `evidencia` (JSONB, NOT NULL, default `[]`)
- `estado` (TEXT, NOT NULL)
- `notas_dev` (TEXT)
- `fecha_creacion` (TIMESTAMPTZ, NOT NULL)

## Diagrama ER

```mermaid
erDiagram
    PROJECTS {
        text id PK
        text name
        text description
        text color
        text icon
        jsonb actors
        timestamptz created_at
    }

    RECORDS {
        text id PK
        text project_id FK
        text actor
        text modulo
        text tipo_error
        text device
        text resolution
        text titulo
        text pasos_reproducir
        text resultado_esperado
        text resultado_actual
        jsonb evidencia
        text estado
        text notas_dev
        timestamptz fecha_creacion
    }

    PROJECTS ||--o{ RECORDS : contains
```

## Flujo de arquitectura

```mermaid
flowchart LR
    UI[Next.js Client UI] --> API[Route Handlers /api/*]
    API --> DB[src/lib/db.ts]
    DB --> NEON[(Neon Postgres 17)]
```

## Variables de entorno
Archivo local: `.env.local`

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require&channel_binding=require"
```

## Verificacion
1. Ejecutar `npm run build`
2. Ejecutar `npm run dev`
3. Crear proyecto
4. Crear/editar bug
5. Verificar persistencia y filtros por proyecto

## Nota de migracion de datos legacy
Esta migracion cambia de backend. Si necesitas importar datos previos de Firebase, se recomienda script de importacion por lote (pendiente bajo solicitud).
