package com.susequid.erp.servicio;

import com.susequid.erp.dto.LineaPedidoPdfDto;
import com.susequid.erp.dto.ParseoPedidoPdfRespuesta;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ServicioParseoPedidoPdf {

    private static final Pattern PATRON_NUMERO_PEDIDO = Pattern.compile(
            "(?i)PEDIDO\\s*N[oó]\\.?\\s*[:\\s]*([0-9]+)"
    );
    /** Línea con referencia | descripción (pipe explícito). */
    private static final Pattern LINEA_PIPE = Pattern.compile(
            "^\\s*([^|]{1,80}?)\\s*\\|\\s*(.+?)\\s*$"
    );
    /**
     * Fila tipo tabla: referencia (código alfanumérico), luego descripción, al final cantidad tipo 1,00 y resto.
     * Ej.: "31H BATERIA 31 H CO 1,00 Und."
     */
    private static final Pattern LINEA_REF_DESC_CANT = Pattern.compile(
            "^\\s*([A-Za-z0-9][A-Za-z0-9.\\-]{1,40}?)\\s+(.+?)\\s+(\\d+[,.]\\d{2})\\s+.*$"
    );
    private static final Pattern LINEA_REF_DOBLE_ESPACIO = Pattern.compile(
            "^\\s*([A-Za-z0-9][A-Za-z0-9.\\-]{1,40}?)\\s{2,}(.+)$"
    );

    public ParseoPedidoPdfRespuesta parsear(MultipartFile archivo) {
        ParseoPedidoPdfRespuesta out = new ParseoPedidoPdfRespuesta();
        if (archivo == null || archivo.isEmpty()) {
            out.getAdvertencias().add("No se recibió ningún archivo");
            return out;
        }
        String nombre = archivo.getOriginalFilename() != null ? archivo.getOriginalFilename() : "";
        if (!nombre.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            out.getAdvertencias().add("El archivo debe ser PDF");
            return out;
        }

        String texto;
        try (InputStream in = archivo.getInputStream(); PDDocument doc = PDDocument.load(in)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            texto = stripper.getText(doc);
        } catch (Exception e) {
            out.getAdvertencias().add("No se pudo leer el PDF: " + e.getMessage());
            return out;
        }

        if (texto == null || texto.isBlank()) {
            out.getAdvertencias().add("El PDF no contiene texto seleccionable (¿es un escaneo?).");
            return out;
        }

        Matcher mNum = PATRON_NUMERO_PEDIDO.matcher(texto);
        if (mNum.find()) {
            out.setNumeroPedido(mNum.group(1));
        } else {
            out.getAdvertencias().add("No se encontró «PEDIDO No.» en el texto; revisa el título manualmente.");
        }

        List<LineaPedidoPdfDto> lineas = extraerLineasProducto(texto);
        out.setLineas(lineas);
        if (lineas.isEmpty()) {
            out.getAdvertencias().add("No se detectaron filas de productos; copia las líneas a mano o revisa el PDF.");
        }

        return out;
    }

    private List<LineaPedidoPdfDto> extraerLineasProducto(String texto) {
        List<LineaPedidoPdfDto> lineas = new ArrayList<>();
        String[] raw = texto.split("\\R");
        for (String linea : raw) {
            String l = linea.trim();
            if (l.isEmpty()) {
                continue;
            }
            String upper = l.toUpperCase(Locale.ROOT);
            if (upper.contains("DESCRIPCIÓN") || upper.contains("DESCRIPCION")) {
                continue;
            }
            if (esLineaBasura(l)) {
                continue;
            }

            LineaPedidoPdfDto parsed = intentarParsearLineaProducto(l);
            if (parsed != null) {
                lineas.add(parsed);
            }
        }

        if (lineas.isEmpty()) {
            for (String linea : raw) {
                String l = linea.trim();
                if (l.isEmpty() || esLineaBasura(l)) {
                    continue;
                }
                LineaPedidoPdfDto parsed = intentarParsearLineaProducto(l);
                if (parsed != null) {
                    lineas.add(parsed);
                }
            }
        }

        return deduplicar(lineas);
    }

    private List<LineaPedidoPdfDto> deduplicar(List<LineaPedidoPdfDto> lineas) {
        List<LineaPedidoPdfDto> out = new ArrayList<>();
        java.util.Set<String> v = new java.util.HashSet<>();
        for (LineaPedidoPdfDto x : lineas) {
            String k = (x.getReferencia() + "|" + x.getDescripcion()).toLowerCase(Locale.ROOT);
            if (v.add(k)) {
                out.add(x);
            }
        }
        return out;
    }

    private boolean esLineaBasura(String l) {
        String u = l.toUpperCase(Locale.ROOT);
        return u.startsWith("CLIENTE")
                || u.startsWith("NIT")
                || u.startsWith("FECHA")
                || u.startsWith("ELABORADO")
                || u.startsWith("FORMA DE PAGO")
                || u.startsWith("POR CONCEPTO")
                || u.startsWith("SUBTOTAL")
                || u.startsWith("TOTAL")
                || u.startsWith("IVA")
                || u.contains("SERVICIOS Y SUMINISTROS")
                || u.matches(".*PEDIDO\\s*N[oó].*") && l.length() < 40
                || u.equals("UND.") || u.equals("UND");
    }

    private LineaPedidoPdfDto intentarParsearLineaProducto(String l) {
        Matcher mp = LINEA_PIPE.matcher(l);
        if (mp.matches()) {
            String ref = mp.group(1).trim();
            String desc = mp.group(2).trim();
            if (ref.length() >= 1 && desc.length() >= 2 && !esSoloNumerosCantidad(ref)) {
                return new LineaPedidoPdfDto(ref, desc);
            }
        }

        Matcher mc = LINEA_REF_DESC_CANT.matcher(l);
        if (mc.matches()) {
            return new LineaPedidoPdfDto(mc.group(1).trim(), mc.group(2).trim());
        }

        Matcher md = LINEA_REF_DOBLE_ESPACIO.matcher(l);
        if (md.matches()) {
            String ref = md.group(1).trim();
            String desc = md.group(2).trim();
            if (ref.length() >= 2 && desc.length() >= 3 && !esLineaBasura(desc)) {
                desc = desc.replaceAll("\\s+\\d+[,.]\\d{2}\\s+.*$", "").trim();
                return new LineaPedidoPdfDto(ref, desc);
            }
        }

        if (l.contains("|")) {
            int i = l.indexOf('|');
            String ref = l.substring(0, i).trim();
            String desc = l.substring(i + 1).trim();
            if (ref.length() >= 1 && desc.length() >= 2) {
                return new LineaPedidoPdfDto(ref, desc);
            }
        }

        return null;
    }

    private boolean esSoloNumerosCantidad(String s) {
        return s.matches("\\d+[,.]\\d+");
    }
}
