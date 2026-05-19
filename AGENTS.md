# AGENTS.md

Guia rapida para agentes y devs trabajando en este repo.

## Leer primero

1. `README.md`
2. `docs/PROJECT_GUIDE.md`
3. `docs/NEON_MIGRATION.md` si el cambio toca DB/API

## Arquitectura obligatoria

- Frontend cliente en `src/app/*`.
- API server en `src/app/api/*`.
- DB solo en `src/lib/db.ts`.
- Tipos de dominio en `src/types/index.ts`.
- Catalogos editables en `src/lib/config.ts`.
- Componentes compartidos desde `@/components`.

No importes `src/lib/db.ts` en client components. El cliente siempre debe consumir `/api/*`.

## Estilo y UI

- Mantener el estilo `QA Pulse`: claro, operacional, sobrio, con `#263a5f` como primario.
- Reusar `Button`, `Card`, `Badge`, `Input`, `Modal`, `Spinner`, `SkeletonLoader` e `ImageEditor`.
- Usar Heroicons para iconos.
- Tailwind es el patron actual; no agregar otra libreria UI sin necesidad clara.
- Gradientes solo como acentos de proyecto.

## Seguridad

- Nunca exponer `DATABASE_URL` ni secretos al cliente.
- No loggear secretos.
- Validar payloads si se amplian endpoints.
- Recordar que `DELETE /api/records` elimina todos los bugs.

## Cambios de datos

Para agregar o cambiar campos:

1. Actualizar tipos.
2. Actualizar schema/mappers en `src/lib/db.ts`.
3. Actualizar API.
4. Actualizar UI.
5. Actualizar docs.

## Archivos legacy o delicados

Revisar antes de usar o borrar:

- `src/components/Modal.tsx`
- `src/lib/firebase.ts`
- `src/lib/excel.ts`
- `src/lib/projects.ts`
- `src/lib/theme.ts`
- `src/data/database.json`

## Validacion

Antes de cerrar una tarea de codigo:

```bash
npm run lint
npm run build
```

Si el cambio toca UI principal, probar manualmente: crear proyecto, crear bug, cambiar estado, adjuntar evidencia y exportar PDF.
