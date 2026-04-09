# Cronograma de actividades — ERP Susequid (referencia)

**Proyecto (título orientativo):** Plataforma web modular tipo ERP para la gestión integrada del mantenimiento, el inventario y la trazabilidad de procesos en empresas de servicios mediante formularios dinámicos.

**Stack:** Java 17, Spring Boot, PostgreSQL, React (erp-frontend), aplicación móvil (erp-mobile), JWT / API REST.

**Leyenda de columnas:** cada número (1–4) es una semana del mes (Febrero → Mayo).

---

| Actividades | Especificaciones | Feb 1 | Feb 2 | Feb 3 | Feb 4 | Mar 1 | Mar 2 | Mar 3 | Mar 4 | Abr 1 | Abr 2 | Abr 3 | Abr 4 | May 1 | May 2 | May 3 | May 4 |
|-------------|------------------|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Organización** | • Definición del alcance del proyecto (módulos: seguridad, activos/plantas, inventario, formularios, workflows, tareas de campo).<br>• Selección y validación de tecnologías: Spring Boot, PostgreSQL, React, cliente móvil, herramientas de diagramación y control de versiones. | x | | | | | | | | | | | | | | | |
| **Actualización del documento del proyecto** | • Actualización del título y marco del proyecto.<br>• Definición del problema.<br>• Objetivo general y objetivos específicos.<br>• Justificación. | x | | | | | | | | | | | | | | | |
| **Configuración del entorno de desarrollo** | • Instalación Java JDK 17.<br>• Spring Boot / Maven o Gradle según el repo.<br>• PostgreSQL (creación de base esquema dev).<br>• Node.js para el frontend React.<br>• IDE (IntelliJ / VS Code / Cursor) y cliente API (Postman, etc.). | x | x | | | | | | | | | | | | | | |
| **Creación del proyecto base (backend)** | • Estructura en capas (entidad, repositorio, servicio, controlador, DTO).<br>• Dependencias (Web, Data JPA, Security, validación).<br>• Perfiles de configuración y conexión a PostgreSQL.<br>• Prueba de arranque y endpoint de salud. | | x | x | | | | | | | | | | | | | |
| **Integración de la base de datos** | • Creación/esquema de base de datos alineado al modelo relacional.<br>• Configuración JPA (entidades, relaciones).<br>• Tablas núcleo: usuarios, roles, usuarios_roles; plantas eléctricas; mantenimientos; inventario (catálogos/ítems o equipos según alcance). | | | x | x | | | | | | | | | | | | |
| **Desarrollo backend #1 — Seguridad y usuarios** | • Entidades Usuario y Rol; registro/login.<br>• JWT (o mecanismo definido en el proyecto).<br>• Control de acceso por roles (ADMINISTRADOR, TÉCNICO, etc.).<br>• Endpoints base de usuarios. | | | | x | x | | | | | | | | | | | |
| **Pruebas de funcionamiento #1** | • Pruebas de autenticación y autorización.<br>• Verificación de persistencia de usuarios y roles.<br>• Corrección de errores. | | | | | | x | | | | | | | | | | |
| **Desarrollo backend #2 — Activos operativos y mantenimiento** | • CRUD de plantas eléctricas (o activos equivalentes).<br>• Registro de mantenimientos vinculados al activo.<br>• Asignación de técnico cuando aplique. | | | | | | x | x | | | | | | | | | |
| **Pruebas de funcionamiento #2** | • Pruebas de creación/edición de activos y mantenimientos.<br>• Validación de integridad referencial.<br>• Corrección de errores. | | | | | | | | x | | | | | | | | |
| **Desarrollo backend #3 — Inventario** | • Catálogos dinámicos e ítems (o módulo equipos_inventario según alcance).<br>• Repositorios, servicios y API REST.<br>• Reglas de unicidad (p. ej. serial por catálogo). | | | | | | | | x | x | | | | | | | |
| **Pruebas de funcionamiento #3** | • Pruebas de alta/baja/modificación de ítems.<br>• Verificación de datos extra JSON si aplica.<br>• Corrección de errores. | | | | | | | | | | x | | | | | | |
| **Desarrollo backend #4 — Formularios dinámicos** | • Definición de formularios (esquema JSON).<br>• Registro de respuestas vinculadas a activo/equipo/usuario o etapa.<br>• Endpoints de consulta y registro. | | | | | | | | | | x | x | | | | | |
| **Pruebas de funcionamiento #4** | • Pruebas de creación de formulario y envío de respuestas.<br>• Validación de JSON almacenado.<br>• Corrección de errores. | | | | | | | | | | | | x | | | | |
| **Desarrollo backend #5 — Workflows y tareas de campo** | • Workflows entre áreas y bitácora de estados.<br>• Tareas de campo: etapas, roles por paso, plantillas de flujo.<br>• Evidencias digitales (archivo/imagen/firma) si está en alcance. | | | | | | | | | | | | x | x | | | |
| **Pruebas de funcionamiento #5** | • Pruebas de transición de workflow y registro en bitácora.<br>• Pruebas de flujo por etapas y permisos por rol.<br>• Corrección de errores. | | | | | | | | | | | | | | x | | |
| **Desarrollo frontend y cliente móvil** | • Pantallas principales en React (layout ERP, tablas, formularios).<br>• Consumo de API (auth, inventario, formularios, flujos).<br>• Pantallas clave en app móvil (login, tareas, evidencias si aplica).<br>• Ajustes de UX y manejo de errores. | | | | | | | | x | x | x | x | x | | | | |
| **Pruebas de funcionamiento final** | • Pruebas integrales: login, activos, inventario, formularios, workflows/tareas.<br>• Pruebas en web y móvil según alcance.<br>• Regresión y corrección de hallazgos. | | | | | | | | | | | | | | | x | |
| **Finalización del proyecto y documentación** | • Documentación técnica y de usuario.<br>• Capturas del sistema (web/móvil).<br>• Diagramas (clases, ER, secuencia, componentes) y cronograma cumplido.<br>• Preparación y entrega / presentación final. | | | | | | | | | | | | | | | | x |

---

## Notas para ajustar a tu calendario real

- Las **marcas (x)** son una **propuesta**; muévelas si tu semestre empieza en otra fecha o si ya tienes avance en algunos módulos.
- Si el alcance académico **no incluye móvil**, unifica la fila “Frontend y cliente móvil” solo en **React**.
- Si priorizas **solo inventario + formularios**, puedes acortar filas de workflows/tareas y adelantar pruebas finales.

Puedes copiar la tabla a **Excel** o **Word**: en Excel, usa “Texto en columnas” o pega desde Markdown según tu flujo de trabajo.
