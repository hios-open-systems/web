# Historial de cambios

Resumen contrastado con Git el 27 de octubre de 2026. Describe código integrado;
no afirma que cada commit esté desplegado. Para publicar, consultar
[DEPLOY.md](DEPLOY.md); para trabajo abierto, [BACKLOG.md](BACKLOG.md).

## Limpieza documental — 27 de octubre de 2026

- Consolidación de pendientes reales, verificaciones externas e ideas opcionales.
- Retirada de prompts iniciales duplicados, transcripción de chat, checklist de julio
  e investigación reemplazada por las implementaciones de métricas y autenticación.
- Actualización del checkpoint de espacios y referencias de seguridad/release.
  Se conservan contratos, guías de hardware y evidencias fechadas.
- Revisión local previa a la limpieza: lint y 53/53 grupos de self-tests en verde.
  Esta edición documental no vuelve a certificar build, navegador ni producción.

## Integrado después del paquete del 24 de octubre

- `226907a`: despliegue manual desde Actions; pushes y PR solo validan.
- `9b5e403`: modo de soldadura y secciones más claras en la página del PAD.
- `8255566`, `b10b3a6`, `d329690`: pines agrupados, documentación y correcciones
  de stick, encoder, menú, pulsación larga y autenticación OTA del PAD.
- `3deec89`, `ce09edd`: portada, compositor y beatmaker; acceso heredado conservado.
- `a925cf2`, `3c82c8a`, `a0d6172`: esquemas, netlists y BOMs; diseño de Node AI,
  divisor de batería del Speaker y traducciones de decimales.

## Paquete del 24 de octubre de 2026

- `042dfe6`: descubrimiento por tareas, favoritos/recientes, demos, lector de
  repositorios de solo lectura e identidades OAuth multi-proveedor.
- `3e75724`, `5ec6e6f`: métricas agregadas, retención, caché pública y tráfico Cloudflare.
- `b2987f4`, `cf3fa51`: entorno aislado Google OAuth y objetivo táctil móvil de 44 px.
- Migraciones 0006–0008: espacios, agregados e identidades OAuth.

Las [notas de release](docs/ai-context/release-2026-10-24.md) registran el despliegue
de ese paquete. Son evidencia histórica, no una consulta actual a producción.
Las [referencias técnicas](docs/ai-context/README.md) conservan las auditorías.
