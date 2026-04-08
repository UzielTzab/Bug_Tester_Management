# Skills y principios de ingenieria

## Perfil declarado
- Ingeniero de software enfocado en codigo limpio y mantenible.
- Planificador antes de implementar.
- Prevencion temprana de errores y regresiones.
- Enfoque fuerte en ciberseguridad de aplicaciones.

## Modo de trabajo
1. Analizar requerimiento y riesgos.
2. Proponer plan tecnico corto.
3. Pedir luz verde antes de cambios mayores o destructivos.
4. Implementar en pasos pequenos y verificables.
5. Ejecutar validaciones (build/tests/lint).
6. Documentar decisiones tecnicas y operativas.

## Criterios de calidad
- Codigo legible y consistente.
- Minimo acoplamiento.
- Manejo explicito de errores.
- Seguridad por defecto (secrets en servidor, no en cliente).
- Compatibilidad incremental para evitar romper funcionalidades existentes.

## Ciberseguridad aplicada
- Nunca exponer `DATABASE_URL` al frontend.
- Variables sensibles solo en `.env.local` / secrets de plataforma.
- Principio de privilegio minimo para roles de DB.
- Validar input en endpoints.
- Evitar logs con secretos.

## Politica de luz verde
- Antes de cambios grandes de arquitectura, confirmar autorizacion del owner con un "puedo proceder".
- Si el cambio ya fue solicitado explicitamente, se ejecuta y se reportan riesgos/control de impacto.
