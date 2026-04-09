package com.susequid.erp.servicio;

import com.susequid.erp.entidad.Rol;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.repositorio.RolRepositorio;
import com.susequid.erp.repositorio.UsuarioRepositorio;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.List;
import java.util.HashSet;

@Service
public class ServicioUsuario {
    private final UsuarioRepositorio usuarioRepositorio;
    private final RolRepositorio rolRepositorio;
    private final JdbcTemplate jdbcTemplate;

    public ServicioUsuario(UsuarioRepositorio usuarioRepositorio, RolRepositorio rolRepositorio, JdbcTemplate jdbcTemplate) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.rolRepositorio = rolRepositorio;
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Usuario> listarTodos() {
        return usuarioRepositorio.findAll();
    }

    public Usuario actualizarRol(Long usuarioId, RolNombre rolNombre) {
        asegurarRolesSistema();
        if (rolNombre != RolNombre.BODEGA
                && rolNombre != RolNombre.COMPRAS
                && rolNombre != RolNombre.COMERCIAL) {
            throw new RuntimeException("Solo se permite rol BODEGA, COMPRAS o COMERCIAL");
        }
        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (ServicioAutorizacion.CORREO_SUPER_ADMIN.equalsIgnoreCase(usuario.getCorreo())) {
            throw new RuntimeException("No se puede modificar el super admin");
        }
        Rol rol = rolRepositorio.findByNombre(rolNombre).orElseGet(() -> {
            Rol nuevo = new Rol();
            nuevo.setNombre(rolNombre);
            return rolRepositorio.save(nuevo);
        });
        usuario.setRoles(new HashSet<>(List.of(rol)));
        return usuarioRepositorio.save(usuario);
    }

    public void eliminar(Long usuarioId) {
        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (ServicioAutorizacion.CORREO_SUPER_ADMIN.equalsIgnoreCase(usuario.getCorreo())) {
            throw new RuntimeException("No se puede eliminar el super admin");
        }
        usuarioRepositorio.delete(usuario);
    }

    private void asegurarRolesSistema() {
        Integer existeTabla = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles'",
                Integer.class
        );
        if (existeTabla == null || existeTabla == 0) {
            return;
        }
        jdbcTemplate.execute(
                "DELETE FROM usuarios_roles WHERE rol_id IN (" +
                        "SELECT id FROM roles WHERE nombre NOT IN ('ADMINISTRADOR','BODEGA','COMPRAS','COMERCIAL')" +
                        ")"
        );
        jdbcTemplate.execute(
                "DELETE FROM roles WHERE nombre NOT IN ('ADMINISTRADOR','BODEGA','COMPRAS','COMERCIAL')"
        );
        jdbcTemplate.execute("ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_nombre_check");
        jdbcTemplate.execute(
                "ALTER TABLE roles ADD CONSTRAINT roles_nombre_check " +
                        "CHECK (nombre IN (" +
                        "'ADMINISTRADOR','BODEGA','COMPRAS','COMERCIAL'" +
                        "))"
        );
        jdbcTemplate.execute(
                "INSERT INTO roles (nombre) VALUES " +
                        "('ADMINISTRADOR'),('BODEGA'),('COMPRAS'),('COMERCIAL') " +
                        "ON CONFLICT (nombre) DO NOTHING"
        );
    }
}

