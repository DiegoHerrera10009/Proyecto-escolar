-- Script 01: Crear base de datos y usuario para ERP Susequid
-- Ejecutar como superusuario (postgres)

DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'erp_user') THEN
      CREATE ROLE erp_user LOGIN PASSWORD 'erp_pass_2026';
   END IF;
END
$$;

-- Crear base de datos solo si no existe
-- Nota: CREATE DATABASE no se permite dentro de transaccion.
SELECT 'CREATE DATABASE erp_susequid OWNER erp_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'erp_susequid')
\gexec

GRANT ALL PRIVILEGES ON DATABASE erp_susequid TO erp_user;
