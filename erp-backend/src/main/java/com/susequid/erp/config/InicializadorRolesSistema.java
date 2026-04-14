package com.susequid.erp.config;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class InicializadorRolesSistema {
    private final JdbcTemplate jdbcTemplate;

    public InicializadorRolesSistema(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void inicializarRoles() {
        Integer existeTabla = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles'",
                Integer.class
        );
        if (existeTabla == null || existeTabla == 0) {
            return;
        }

        // Mantiene el CHECK de roles alineado con los valores del enum RolNombre.
        jdbcTemplate.execute(
                "DELETE FROM usuarios_roles WHERE rol_id IN (" +
                        "SELECT id FROM roles WHERE nombre NOT IN ('ADMINISTRADOR','TECNICO','SUPERVISOR','COMPRAS','COMERCIAL','DESPACHO','HSEQ','BODEGA','GESTION_HUMANA')" +
                        ")"
        );
        jdbcTemplate.execute(
                "DELETE FROM roles WHERE nombre NOT IN ('ADMINISTRADOR','TECNICO','SUPERVISOR','COMPRAS','COMERCIAL','DESPACHO','HSEQ','BODEGA','GESTION_HUMANA')"
        );
        jdbcTemplate.execute("ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_nombre_check");
        jdbcTemplate.execute(
                "ALTER TABLE roles ADD CONSTRAINT roles_nombre_check " +
                        "CHECK (nombre IN (" +
                        "'ADMINISTRADOR','TECNICO','SUPERVISOR','COMPRAS','COMERCIAL','DESPACHO','HSEQ','BODEGA','GESTION_HUMANA'" +
                        "))"
        );

        jdbcTemplate.execute(
                "INSERT INTO roles (nombre) VALUES " +
                        "('ADMINISTRADOR'),('TECNICO'),('SUPERVISOR'),('COMPRAS'),('COMERCIAL'),('DESPACHO'),('HSEQ'),('BODEGA'),('GESTION_HUMANA') " +
                        "ON CONFLICT (nombre) DO NOTHING"
        );

        // Restricción de pasos del flujo (roles permitidos en etapas).
        jdbcTemplate.execute("ALTER TABLE etapas_tarea_campo DROP CONSTRAINT IF EXISTS etapas_tarea_campo_rol_responsable_check");
        jdbcTemplate.execute(
                "UPDATE etapas_tarea_campo " +
                        "SET rol_responsable = CASE " +
                        "  WHEN rol_responsable = 'DESPACHO' THEN 'BODEGA' " +
                        "  WHEN rol_responsable IN ('ADMINISTRADOR','TECNICO','SUPERVISOR','COMPRAS','COMERCIAL','DESPACHO','HSEQ','BODEGA','GESTION_HUMANA') THEN rol_responsable " +
                        "  ELSE 'BODEGA' " +
                        "END " +
                        "WHERE rol_responsable IS NULL " +
                        "   OR rol_responsable NOT IN ('ADMINISTRADOR','TECNICO','SUPERVISOR','COMPRAS','COMERCIAL','DESPACHO','HSEQ','BODEGA','GESTION_HUMANA')"
        );
        jdbcTemplate.execute(
                "ALTER TABLE etapas_tarea_campo ADD CONSTRAINT etapas_tarea_campo_rol_responsable_check " +
                        "CHECK (rol_responsable IN ('ADMINISTRADOR','TECNICO','SUPERVISOR','COMPRAS','COMERCIAL','DESPACHO','HSEQ','BODEGA','GESTION_HUMANA'))"
        );
    }
}
