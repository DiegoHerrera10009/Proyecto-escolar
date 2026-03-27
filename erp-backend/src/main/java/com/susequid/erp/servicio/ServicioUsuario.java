package com.susequid.erp.servicio;

import com.susequid.erp.entidad.Rol;
import com.susequid.erp.entidad.RolNombre;
import com.susequid.erp.entidad.Usuario;
import com.susequid.erp.repositorio.RolRepositorio;
import com.susequid.erp.repositorio.UsuarioRepositorio;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.List;

@Service
public class ServicioUsuario {
    private final UsuarioRepositorio usuarioRepositorio;
    private final RolRepositorio rolRepositorio;

    public ServicioUsuario(UsuarioRepositorio usuarioRepositorio, RolRepositorio rolRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.rolRepositorio = rolRepositorio;
    }

    public List<Usuario> listarTodos() {
        return usuarioRepositorio.findAll();
    }

    public Usuario actualizarRol(Long usuarioId, RolNombre rolNombre) {
        if (rolNombre != RolNombre.TECNICO && rolNombre != RolNombre.SUPERVISOR) {
            throw new RuntimeException("Solo se permite rol TECNICO o SUPERVISOR");
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
        usuario.setRoles(Set.of(rol));
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
}

