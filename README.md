# ERP Empresarial - Susequid SAS

Base de sistema ERP web modular para mantenimiento y gestion de equipos, con enfoque principal en plantas electricas.

## Arquitectura general

- `erp-backend`: API REST en Spring Boot (Java 17), arquitectura en capas.
- `erp-frontend`: interfaz React responsive tipo ERP (sidebar, navbar, tablas, formularios).
- Base de datos objetivo: PostgreSQL.
- Diseno orientado a escalar por modulos y a evolucionar a microservicios.

## Modelo de base de datos (diseno relacional)

### Seguridad y usuarios
- `usuarios`: datos base de autenticacion y perfil.
- `roles`: catalogo de roles (`ADMINISTRADOR`, `TECNICO`, `COMPRAS`, `HSEQ`, `BODEGA`).
- `usuarios_roles`: relacion muchos-a-muchos para permisos por usuario.

### Operacion tecnica
- `plantas_electricas`: inventario maestro de plantas.
  - Relacion `N:1` con `usuarios` para tecnico asignado.
- `mantenimientos_planta`: historial y hoja de vida tecnica.
  - Relacion `N:1` con `plantas_electricas`.
  - Relacion `N:1` con `usuarios` (tecnico ejecutor).

### Inventario general
- `equipos_inventario`: gestion de equipos (computadores, dispositivos, etc.).

### Formularios dinamicos
- `formularios_dinamicos`: estructura de formulario en JSON.
- `respuestas_formulario`: respuestas capturadas en JSON.
  - Relacion `N:1` con `formularios_dinamicos`.
  - Relacion opcional `N:1` con `plantas_electricas` y `equipos_inventario`.
  - Relacion `N:1` con `usuarios` (quien diligencia).

### Workflow interareas
- `workflows`: flujo de procesos entre areas (origen -> destino).
  - Campos de referencia generica para enlazar cualquier modulo (`referenciaTipo`, `referenciaId`).
  - Estado (`PENDIENTE`, `EN_PROCESO`, `COMPLETADO`, `RECHAZADO`).
- `bitacora_workflow`: trazabilidad de cambios de estado del workflow.
  - Relacion `N:1` con `workflows`.
  - Relacion `N:1` con `usuarios` (quien ejecuta la transicion).

## Backend generado (Spring Boot)

Ruta base de paquetes:

- `com.susequid.erp.entidad`
- `com.susequid.erp.repositorio`
- `com.susequid.erp.servicio`
- `com.susequid.erp.controlador`
- `com.susequid.erp.dto`

### Endpoints principales

#### Autenticacion y usuarios
- `POST /api/auth/registro`
- `POST /api/auth/login`
- `GET /api/usuarios` (solo ADMINISTRADOR)

#### Plantas electricas
- `GET /api/plantas`
- `GET /api/plantas/{id}`
- `POST /api/plantas`
- `PUT /api/plantas/{id}`
- `DELETE /api/plantas/{id}`

#### Inventario
- `GET /api/inventario`
- `POST /api/inventario`
- `PUT /api/inventario/{id}`
- `DELETE /api/inventario/{id}`

#### Formularios dinamicos
- `GET /api/formularios`
- `POST /api/formularios`
- `GET /api/formularios/respuestas`
- `POST /api/formularios/respuestas`

#### Workflow
- `GET /api/workflows`
- `POST /api/workflows`
- `PUT /api/workflows/{id}/estado`
- `GET /api/workflows/{id}/bitacora`

Documentacion de API:
- Swagger UI: `http://localhost:8080/swagger-ui.html`

### Seguridad por roles (version base)

- Los endpoints de negocio ahora requieren cabecera `Authorization: Bearer <token>`.
- El token se obtiene desde `POST /api/auth/login`.
- Se valida acceso por roles de usuario (`ADMINISTRADOR`, `TECNICO`, `COMPRAS`, `HSEQ`, `BODEGA`).
- En workflow, la transicion de estado valida rol de la `areaDestino` y registra bitacora.

## Frontend generado (React + Vite)

Modulos base incluidos:
- Dashboard
- Plantas
- Inventario
- Formularios

Patron UI:
- Sidebar de navegacion por modulos
- Navbar superior contextual
- Formularios de registro rapido
- Tablas responsivas para listado

## Configuracion y ejecucion

### Backend
1. Configurar PostgreSQL:
   - BD: `erp_susequid`
   - Usuario/clave en `erp-backend/src/main/resources/application.yml`
2. Instalar Maven o agregar Maven Wrapper.
3. Ejecutar:
   - `mvn spring-boot:run`

### Frontend
1. `cd erp-frontend`
2. `npm install`
3. `npm run dev`

## Recomendaciones de despliegue empresarial

- Dockerizar backend y frontend para ambientes consistentes.
- Usar Nginx como reverse proxy del frontend y API.
- Migrar `ddl-auto=update` a migraciones versionadas con Flyway.
- Externalizar secretos con variables de entorno.
- Agregar JWT + Spring Security para control robusto por permisos.
- Implementar observabilidad (logs estructurados, metricas, trazas).
- Preparar separacion futura por dominios: `auth`, `activos`, `workflow`, `formularios`.

## Ruta de evolucion sugerida

1. Endurecer seguridad (JWT, refresh token, control de permisos por endpoint).
2. Crear modulo comercial y compras con trazabilidad documental.
3. Implementar workflow con reglas y aprobaciones por rol.
4. Exponer app movil via API versionada y contrato estable.
