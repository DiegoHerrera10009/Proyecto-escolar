package com.susequid.erp.servicio;

import com.susequid.erp.dto.LoginPeticion;
import com.susequid.erp.dto.LoginRespuesta;
import com.susequid.erp.dto.RegistroUsuarioPeticion;
import com.susequid.erp.entidad.Rol;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.repositorio.RolRepositorio;
import com.susequid.erp.repositorio.UsuarioRepositorio;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class ServicioAutenticacion {
    private final UsuarioRepositorio usuarioRepositorio;
    private final RolRepositorio rolRepositorio;
    private final JdbcTemplate jdbcTemplate;
    private final Map<String, Long> sesiones = new ConcurrentHashMap<>();

    public ServicioAutenticacion(UsuarioRepositorio usuarioRepositorio, RolRepositorio rolRepositorio, JdbcTemplate jdbcTemplate) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.rolRepositorio = rolRepositorio;
        this.jdbcTemplate = jdbcTemplate;
    }

    public Usuario registrar(RegistroUsuarioPeticion peticion) {
        asegurarRolesSistema();
        usuarioRepositorio.findByCorreo(peticion.getCorreo()).ifPresent(u -> {
            throw new RuntimeException("El correo ya existe");
        });

        Usuario usuario = new Usuario();
        usuario.setNombreCompleto(peticion.getNombreCompleto());
        usuario.setCorreo(peticion.getCorreo());
        usuario.setClave(hash(peticion.getClave()));

        Set<RolNombre> rolesSolicitados = peticion.getRoles() == null || peticion.getRoles().isEmpty()
                ? Set.of(RolNombre.COMERCIAL)
                : peticion.getRoles();

        // Regla de negocio actual: desde el panel solo se crean roles operativos permitidos.
        boolean rolesValidos = rolesSolicitados.stream()
                .allMatch(r -> r == RolNombre.BODEGA
                        || r == RolNombre.COMPRAS
                        || r == RolNombre.COMERCIAL);
        if (!rolesValidos) {
            throw new RuntimeException("Solo se permite crear usuarios con rol BODEGA, COMPRAS o COMERCIAL");
        }

        Set<Rol> roles = rolesSolicitados.stream()
                .map(this::obtenerOCrearRol)
                .collect(Collectors.toSet());
        usuario.setRoles(roles);
        return usuarioRepositorio.save(usuario);
    }

    public LoginRespuesta login(LoginPeticion peticion) {
        Usuario usuario = usuarioRepositorio.findByCorreo(peticion.getCorreo())
                .orElseThrow(() -> new RuntimeException("Credenciales invalidas"));

        if (!usuario.getClave().equals(hash(peticion.getClave()))) {
            throw new RuntimeException("Credenciales invalidas");
        }

        String token = UUID.randomUUID().toString();
        sesiones.put(token, usuario.getId());
        Set<String> roles = usuario.getRoles().stream().map(r -> r.getNombre().name()).collect(Collectors.toSet());
        return new LoginRespuesta(token, usuario.getId(), usuario.getCorreo(), roles);
    }

    public Optional<Usuario> obtenerUsuarioPorToken(String token) {
        Long usuarioId = sesiones.get(token);
        if (usuarioId == null) {
            return Optional.empty();
        }
        return usuarioRepositorio.findById(usuarioId);
    }

    /** Comprueba la clave en texto plano contra el hash almacenado (p. ej. confirmación de acciones sensibles). */
    public boolean claveCoincide(Usuario usuario, String clavePlana) {
        if (usuario == null || clavePlana == null) {
            return false;
        }
        String almacenada = usuario.getClave();
        if (almacenada == null || almacenada.isEmpty()) {
            return false;
        }
        return almacenada.equals(hash(clavePlana));
    }

    /** Recarga el usuario desde BD para asegurar que el hash de clave está presente (sesión/token solo guarda el id). */
    public Usuario obtenerUsuarioConClavePorId(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }

    private Rol obtenerOCrearRol(RolNombre rolNombre) {
        return rolRepositorio.findByNombre(rolNombre).orElseGet(() -> {
            Rol rol = new Rol();
            rol.setNombre(rolNombre);
            return rolRepositorio.save(rol);
        });
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

    private String hash(String texto) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(texto.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("No fue posible encriptar la clave");
        }
    }
}
