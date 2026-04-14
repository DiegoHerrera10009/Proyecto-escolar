package com.susequid.erp.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class ManejadorGlobalExcepciones {

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> manejarNoEncontrado(NoResourceFoundException ex) {
        String mensaje = ex.getMessage() != null && !ex.getMessage().isBlank()
                ? ex.getMessage()
                : "Recurso no encontrado";
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "estado", 404,
                "mensaje", mensaje
        ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> manejarRuntime(RuntimeException ex) {
        String mensaje = resolverMensaje(ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "estado", 400,
                "mensaje", mensaje
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> manejarGenerica(Exception ex) {
        String mensaje = resolverMensaje(ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "estado", 400,
                "mensaje", mensaje
        ));
    }

    private String resolverMensaje(Throwable ex) {
        if (ex == null) {
            return "Error de validacion";
        }
        if (ex.getMessage() != null && !ex.getMessage().isBlank()) {
            return ex.getMessage();
        }
        Throwable causa = ex.getCause();
        while (causa != null) {
            if (causa.getMessage() != null && !causa.getMessage().isBlank()) {
                return causa.getMessage();
            }
            causa = causa.getCause();
        }
        return "Error de validacion (" + ex.getClass().getSimpleName() + ")";
    }
}

