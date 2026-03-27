-- Script 02: Esquema inicial ERP Susequid
-- Ejecutar conectado a la BD erp_susequid:
-- psql -U erp_user -d erp_susequid -f 02_esquema_inicial_erp.sql

CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    clave VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios_roles (
    usuario_id BIGINT NOT NULL,
    rol_id BIGINT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT fk_usuarios_roles_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_usuarios_roles_rol
        FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plantas_electricas (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    serial VARCHAR(255) NOT NULL UNIQUE,
    ubicacion VARCHAR(255),
    estado VARCHAR(50) NOT NULL,
    tecnico_asignado_id BIGINT,
    CONSTRAINT fk_planta_tecnico
        FOREIGN KEY (tecnico_asignado_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS mantenimientos_planta (
    id BIGSERIAL PRIMARY KEY,
    planta_id BIGINT NOT NULL,
    tecnico_id BIGINT,
    fecha DATE NOT NULL,
    descripcion VARCHAR(1500),
    resultado VARCHAR(255),
    CONSTRAINT fk_mantenimiento_planta
        FOREIGN KEY (planta_id) REFERENCES plantas_electricas(id) ON DELETE CASCADE,
    CONSTRAINT fk_mantenimiento_tecnico
        FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS equipos_inventario (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    serial VARCHAR(255) NOT NULL UNIQUE,
    responsable VARCHAR(255),
    estado VARCHAR(50) NOT NULL,
    ubicacion VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS formularios_dinamicos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    esquema_json VARCHAR(5000) NOT NULL
);

CREATE TABLE IF NOT EXISTS respuestas_formulario (
    id BIGSERIAL PRIMARY KEY,
    formulario_id BIGINT NOT NULL,
    planta_id BIGINT,
    equipo_id BIGINT,
    usuario_id BIGINT,
    respuesta_json VARCHAR(5000) NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_respuesta_formulario
        FOREIGN KEY (formulario_id) REFERENCES formularios_dinamicos(id) ON DELETE CASCADE,
    CONSTRAINT fk_respuesta_planta
        FOREIGN KEY (planta_id) REFERENCES plantas_electricas(id) ON DELETE SET NULL,
    CONSTRAINT fk_respuesta_equipo
        FOREIGN KEY (equipo_id) REFERENCES equipos_inventario(id) ON DELETE SET NULL,
    CONSTRAINT fk_respuesta_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workflows (
    id BIGSERIAL PRIMARY KEY,
    nombre_proceso VARCHAR(255) NOT NULL,
    area_origen VARCHAR(100) NOT NULL,
    area_destino VARCHAR(100) NOT NULL,
    referencia_tipo VARCHAR(100) NOT NULL,
    referencia_id BIGINT NOT NULL,
    estado VARCHAR(50) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bitacora_workflow (
    id BIGSERIAL PRIMARY KEY,
    workflow_id BIGINT NOT NULL,
    estado_anterior VARCHAR(50) NOT NULL,
    estado_nuevo VARCHAR(50) NOT NULL,
    comentario VARCHAR(1000),
    usuario_id BIGINT,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bitacora_workflow
        FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    CONSTRAINT fk_bitacora_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Indices recomendados para rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_plantas_serial ON plantas_electricas(serial);
CREATE INDEX IF NOT EXISTS idx_equipos_serial ON equipos_inventario(serial);
CREATE INDEX IF NOT EXISTS idx_workflows_ref ON workflows(referencia_tipo, referencia_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_workflow ON bitacora_workflow(workflow_id, fecha_registro DESC);

-- Datos base de roles
INSERT INTO roles (nombre) VALUES
('ADMINISTRADOR'),
('SUPERVISOR'),
('TECNICO'),
('COMPRAS'),
('HSEQ'),
('BODEGA')
ON CONFLICT (nombre) DO NOTHING;
