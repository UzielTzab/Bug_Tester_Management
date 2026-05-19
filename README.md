# QA Bug Tracker Dashboard

Sistema web para registrar, revisar y exportar bugs por proyecto. La app esta construida con Next.js App Router, React, TypeScript, Tailwind CSS y Neon PostgreSQL.

## Inicio rapido

```bash
npm install
npm run dev
```

Abrir `http://localhost:4567`.

Variables locales esperadas:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

## Scripts

- `npm run dev`: servidor local Next.js en el puerto `4567`.
- `npm run build`: build de produccion.
- `npm run start`: sirve el build en el puerto `4567`.
- `npm run lint`: ejecuta ESLint.

## Arquitectura corta

```mermaid
flowchart LR
  UI["Client UI: src/app/*"] --> API["Route handlers: src/app/api/*"]
  API --> DB["Server data layer: src/lib/db.ts"]
  DB --> Neon["Neon PostgreSQL"]
  UI --> Components["src/components/ui"]
  UI --> Config["src/lib/config.ts + src/types"]
```

- `src/app/page.tsx`: dashboard de proyectos.
- `src/app/projects/[projectId]/page.tsx`: dashboard principal de bugs, filtros, vistas `cards/list/kanban`, editor de evidencia y exportacion PDF.
- `src/app/api/projects/*`: CRUD de proyectos.
- `src/app/api/records/*`: CRUD de registros de bugs.
- `src/lib/db.ts`: unica capa de persistencia. Usa `server-only` y `DATABASE_URL`.
- `src/types/index.ts`: tipos de dominio compartidos.
- `src/lib/config.ts`: catalogos editables de estados, tipos de error, actores y dispositivos.
- `src/components/ui/*`: componentes base reutilizables.

## Documentacion del proyecto

- [Guia de arquitectura y reglas](docs/PROJECT_GUIDE.md)
- [Migracion a Neon](docs/NEON_MIGRATION.md)
- [Principios de ingenieria](docs/SKILLS.md)
- [Contexto UX/UI](docs/ux_ui_skill.md)

## Reglas criticas

- No importar `src/lib/db.ts` desde componentes cliente. El frontend debe hablar con `/api/*`.
- No exponer `DATABASE_URL` ni secretos en cliente.
- Mantener tipos y catalogos sincronizados entre `src/types/index.ts`, `src/lib/config.ts` y la UI.
- Reusar `@/components` y Tailwind antes de crear nuevos estilos aislados.
- El proyecto `sumo` es el proyecto por defecto y esta protegido contra eliminacion en la capa DB.
- `DELETE /api/records` elimina todos los registros, no solo los del proyecto activo.
