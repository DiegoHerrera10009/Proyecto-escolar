package com.susequid.erp.servicio;

import com.susequid.erp.dto.LoginPeticion;
import com.susequid.erp.dto.LoginRespuesta;
import com.susequid.erp.dto.RegistroUsuarioPeticion;
import com.susequid.erp.entidad.Rol;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.repositorio.RolRepositorio;
import com.susequid.erp.repositorio.UsuarioRepositorio;
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
    private final Map<String, Long> sesiones = new ConcurrentHashMap<>();

    public ServicioAutenticacion(UsuarioRepositorio usuarioRepositorio, RolRepositorio rolRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.rolRepositorio = rolRepositorio;
    }

    public Usuario registrar(RegistroUsuarioPeticion peticion) {
        usuarioRepositorio.findByCorreo(peticion.getCorreo()).ifPresent(u -> {
            throw new RuntimeException("El correo ya existe");
        });

        Usuario usuario = new Usuario();
        usuario.setNombreCompleto(peticion.getNombreCompleto());
        usuario.setCorreo(peticion.getCorreo());
        usuario.setClave(hash(peticion.getClave()));

        Set<RolNombre> rolesSolicitados = peticion.getRoles() == null || peticion.getRoles().isEmpty()
                ? Set.of(RolNombre.TECNICO)
                : peticion.getRoles();

        // Regla de negocio actual: desde el panel solo se crean TECNICO o SUPERVISOR.
        boolean rolesValidos = rolesSolicitados.stream()
                .allMatch(r -> r == RolNombre.TECNICO || r == RolNombre.SUPERVISOR);
        if (!rolesValidos) {
            throw new RuntimeException("Solo se permite crear usuarios con rol TECNICO o SUPERVISOR");
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

    private Rol obtenerOCrearRol(RolNombre rolNombre) {
        return rolRepositorio.findByNombre(rolNombre).orElseGet(() -> {
            Rol rol = new Rol();
            rol.setNombre(rolNombre);
            return rolRepositorio.save(rol);
        });
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
