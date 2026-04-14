package com.susequid.erp.dto;

import java.util.ArrayList;
import java.util.List;

public class ParseoPedidoPdfRespuesta {
    private String numeroPedido;
    private List<LineaPedidoPdfDto> lineas = new ArrayList<>();
    private List<String> advertencias = new ArrayList<>();

    public String getNumeroPedido() {
        return numeroPedido;
    }

    public void setNumeroPedido(String numeroPedido) {
        this.numeroPedido = numeroPedido;
    }

    public List<LineaPedidoPdfDto> getLineas() {
        return lineas;
    }

    public void setLineas(List<LineaPedidoPdfDto> lineas) {
        this.lineas = lineas;
    }

    public List<String> getAdvertencias() {
        return advertencias;
    }

    public void setAdvertencias(List<String> advertencias) {
        this.advertencias = advertencias;
    }
}
