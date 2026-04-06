import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:8080/api'

function App() {
  const [token, setToken] = useState(localStorage.getItem('erp_token') || '')
  const [correoLogin, setCorreoLogin] = useState('')
  const [claveLogin, setClaveLogin] = useState('')
  const [rolesUsuario, setRolesUsuario] = useState(() => {
    try {
      const guardados = localStorage.getItem('erp_roles')
      return guardados ? JSON.parse(guardados) : []
    } catch {
      return []
    }
  })
  const [mensajeError, setMensajeError] = useState('')
  const [temaOscuro, setTemaOscuro] = useState(() => localStorage.getItem('erp_tema') === 'oscuro')
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

  const [moduloActivo, setModuloActivo] = useState('dashboard')
  const [vistaInventario, setVistaInventario] = useState('plantas')
  const [plantas, setPlantas] = useState([])
  const [inventario, setInventario] = useState([])
  const [formularios, setFormularios] = useState([])
  const [respuestasFormularios, setRespuestasFormularios] = useState([])
  const [tareasCampo, setTareasCampo] = useState([])
  const [tareaCampoSeleccionadaId, setTareaCampoSeleccionadaId] = useState('')
  const [historialTareaCampo, setHistorialTareaCampo] = useState([])
  const [evidenciasCampo, setEvidenciasCampo] = useState([])

  const [nuevaPlanta, setNuevaPlanta] = useState({ nombre: '', serial: '', ubicacion: '', estado: 'ACTIVO' })
  const [nuevoEquipo, setNuevoEquipo] = useState({ nombre: '', serial: '', responsable: '', estado: 'ACTIVO', ubicacion: '' })
  const [nuevoFormulario, setNuevoFormulario] = useState({ nombre: '' })
  const [camposFormularioNuevo, setCamposFormularioNuevo] = useState([
    {
      nombre: '',
      etiqueta: '',
      tipo: 'string',
      obligatorio: true,
      opciones: '',
      origenOpciones: 'manual',
      multiple: false,
      catalogoInventario: 'HERRAMIENTAS',
      inventarioIds: [],
      campoEtiquetaInventario: 'nombre',
      campoValorInventario: 'id',
    },
  ])
  const [usuarios, setUsuarios] = useState([])
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombreCompleto: '',
    correo: '',
    clave: '',
    rol: 'TECNICO',
  })
  const [nuevaTareaCampo, setNuevaTareaCampo] = useState({
    titulo: '',
    descripcion: '',
    latitud: '',
    longitud: '',
    etapasTexto: 'Llegada,Inspeccion,Cierre',
    asignadoAId: '',
    formularioId: '',
  })
  const [asignacionTareaCampo, setAsignacionTareaCampo] = useState({
    tareaId: '',
    asignadoAId: '',
    formularioId: '',
  })
  const [cambioEstadoTareaCampo, setCambioEstadoTareaCampo] = useState({
    estadoNuevo: 'EN_PROCESO',
    comentario: '',
  })
  const [tipoEvidenciaCampo, setTipoEvidenciaCampo] = useState('IMAGEN')
  const [archivoEvidenciaCampo, setArchivoEvidenciaCampo] = useState(null)
  const [formularioAbiertoId, setFormularioAbiertoId] = useState('')
  const [formularioEdicionId, setFormularioEdicionId] = useState('')
  const [tareaFormularioActivaId, setTareaFormularioActivaId] = useState('')
  const [respuestasFormularioTecnico, setRespuestasFormularioTecnico] = useState({})
  const [informeTareaSeleccionadaId, setInformeTareaSeleccionadaId] = useState('')
  const [vistaDashboardAdmin, setVistaDashboardAdmin] = useState('pendientes')
  const [vistaFormulariosAdmin, setVistaFormulariosAdmin] = useState('crear')
  const [vistaUsuariosAdmin, setVistaUsuariosAdmin] = useState('ver')
  const [vistaSeccionFlujo, setVistaSeccionFlujo] = useState('operativos')
  const [vistaPanelFlujo, setVistaPanelFlujo] = useState('disponibles')
  const [plantillasMenuFlujo, setPlantillasMenuFlujo] = useState([])
  const [actividadesFlujoActivas, setActividadesFlujoActivas] = useState([])
  const [actividadesFlujoSeguimiento, setActividadesFlujoSeguimiento] = useState([])
  const [actividadesFlujoHistorial, setActividadesFlujoHistorial] = useState([])
  const [nuevaPlantillaFlujo, setNuevaPlantillaFlujo] = useState({
    titulo: '',
    descripcion: '',
    tipoVisibilidad: 'MENU_PERMANENTE',
    seccionPanel: 'OPERATIVOS',
    visibleEnMenuFlujo: true,
    /** Rol que ejecuta el primer paso y puede iniciar el flujo en «Disponibles». */
    rolPrimerPaso: 'TECNICO',
  })
  const [pasosPlantillaFlujo, setPasosPlantillaFlujo] = useState([
    { nombre: '', rolResponsable: 'TECNICO', formularioId: '' },
  ])
  const [plantillasBorrador, setPlantillasBorrador] = useState([])
  const [plantillasPublicadas, setPlantillasPublicadas] = useState([])
  const [vistaAdminFlujos, setVistaAdminFlujos] = useState('diseno')
  const [actividadFlujoExpandidaId, setActividadFlujoExpandidaId] = useState('')
  const [etapasPorActividadFlujo, setEtapasPorActividadFlujo] = useState({})
  const [respuestasPasoFlujo, setRespuestasPasoFlujo] = useState({})
  const [catalogosPorEndpoint, setCatalogosPorEndpoint] = useState({})

  const resumen = useMemo(
    () => [
      { titulo: 'Plantas eléctricas', valor: plantas.length },
      { titulo: 'Equipos en inventario', valor: inventario.length },
      { titulo: 'Formularios dinámicos', valor: formularios.length },
      { titulo: 'Tareas de campo', valor: tareasCampo.length },
    ],
    [plantas.length, inventario.length, formularios.length, tareasCampo.length]
  )

  useEffect(() => {
    if (token) {
      cargarDatos()
    }
  }, [token])

  useEffect(() => {
    if (!menuMovilAbierto) return undefined
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [menuMovilAbierto])

  useEffect(() => {
    setCatalogosPorEndpoint((prev) => ({
      ...prev,
      '/plantas': Array.isArray(plantas) ? plantas : [],
      '/inventario': Array.isArray(inventario) ? inventario : [],
    }))
  }, [plantas, inventario])

  const cabeceras = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  })
  const cabecerasAuth = () => ({ Authorization: `Bearer ${token}` })
  const normalizarEndpointCatalogo = (valor) => {
    const limpio = String(valor || '').trim()
    if (!limpio) return '/inventario'
    return limpio.startsWith('/') ? limpio : `/${limpio}`
  }

  const login = async (e) => {
    e.preventDefault()
    setMensajeError('')
    try {
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correoLogin, clave: claveLogin }),
      })
      if (!respuesta.ok) {
        throw new Error('Credenciales inválidas')
      }
      const data = await respuesta.json()
      setToken(data.token)
      setRolesUsuario(data.roles || [])
      localStorage.setItem('erp_token', data.token)
      localStorage.setItem('erp_roles', JSON.stringify(data.roles || []))
    } catch (error) {
      setMensajeError(error.message)
    }
  }

  const cerrarSesion = () => {
    localStorage.removeItem('erp_token')
    localStorage.removeItem('erp_roles')
    setToken('')
    setRolesUsuario([])
    setPlantas([])
    setInventario([])
    setFormularios([])
    setRespuestasFormularios([])
    setTareasCampo([])
    setCorreoLogin('')
    setClaveLogin('')
    setMensajeError('')
    setMenuMovilAbierto(false)
  }

  const alternarTema = () => {
    setTemaOscuro((prev) => {
      const nuevo = !prev
      localStorage.setItem('erp_tema', nuevo ? 'oscuro' : 'claro')
      return nuevo
    })
  }

  const irAModulo = (modulo) => {
    setModuloActivo(modulo)
    setMenuMovilAbierto(false)
  }

  const cargarDatos = async () => {
    try {
      const [resPlantas, resInventario, resFormularios] = await Promise.all([
        fetch(`${API_URL}/plantas`, { headers: cabeceras() }),
        fetch(`${API_URL}/inventario`, { headers: cabeceras() }),
        fetch(`${API_URL}/formularios`, { headers: cabeceras() }),
      ])
      if ([resPlantas, resInventario, resFormularios].some((r) => r.status === 401)) {
        cerrarSesion()
        setMensajeError('Sesión expirada, inicia sesión de nuevo')
        return
      }
      const rawP = await resPlantas.json()
      const rawI = await resInventario.json()
      const rawF = await resFormularios.json()
      setPlantas(Array.isArray(rawP) ? rawP : [])
      setInventario(Array.isArray(rawI) ? rawI : [])
      if (!resFormularios.ok) {
        setFormularios([])
        setMensajeError(`No se pudieron cargar formularios (${resFormularios.status})`)
      } else {
        setFormularios(Array.isArray(rawF) ? rawF : [])
      }
      const resRespuestas = await fetch(`${API_URL}/formularios/respuestas`, { headers: cabeceras() })
      if (resRespuestas.ok) {
        const rawR = await resRespuestas.json()
        setRespuestasFormularios(Array.isArray(rawR) ? rawR : [])
      } else {
        setRespuestasFormularios([])
      }
      const resTareasCampo = await fetch(`${API_URL}/campo/tareas`, { headers: cabeceras() })
      if (resTareasCampo.ok) {
        const rawT = await resTareasCampo.json()
        setTareasCampo(Array.isArray(rawT) ? rawT : [])
      }
      // cargar usuarios solo si el rol incluye ADMINISTRADOR
      if (rolesUsuario.includes('ADMINISTRADOR')) {
        const resUsuarios = await fetch(`${API_URL}/usuarios`, { headers: cabeceras() })
        if (resUsuarios.ok) {
          setUsuarios(await resUsuarios.json())
        } else {
          setUsuarios([])
          setMensajeError(`Error al cargar usuarios (${resUsuarios.status})`)
        }
      }
    } catch {
      setMensajeError('No se pudo conectar con el backend')
    }
  }

  const guardarPlanta = async (e) => {
    e.preventDefault()
    await fetch(`${API_URL}/plantas`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify(nuevaPlanta),
    })
    setNuevaPlanta({ nombre: '', serial: '', ubicacion: '', estado: 'ACTIVO' })
    cargarDatos()
  }

  const guardarEquipo = async (e) => {
    e.preventDefault()
    await fetch(`${API_URL}/inventario`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify(nuevoEquipo),
    })
    setNuevoEquipo({ nombre: '', serial: '', responsable: '', estado: 'ACTIVO', ubicacion: '' })
    cargarDatos()
  }

  const guardarFormulario = async (e) => {
    e.preventDefault()
    const campos = camposFormularioNuevo
      .map((c) => ({
        nombre: c.nombre.trim(),
        etiqueta: c.etiqueta.trim(),
        tipo: c.tipo,
        obligatorio: !!c.obligatorio,
        multiple: c.tipo === 'select' ? !!c.multiple : undefined,
        origenOpciones: c.tipo === 'select' ? (c.origenOpciones || 'manual') : undefined,
        catalogoInventario:
          c.tipo === 'select' && (c.origenOpciones || 'manual') === 'inventario'
            ? (c.catalogoInventario || 'HERRAMIENTAS')
            : undefined,
        endpointOpciones:
          c.tipo === 'select' && (c.origenOpciones || 'manual') === 'inventario'
            ? normalizarEndpointCatalogo(
                c.endpointOpciones || ((c.catalogoInventario || 'HERRAMIENTAS') === 'PLANTAS' ? '/plantas' : '/inventario')
              )
            : undefined,
        campoEtiquetaInventario:
          c.tipo === 'select' && (c.origenOpciones || 'manual') === 'inventario'
            ? (c.campoEtiquetaInventario || 'nombre')
            : undefined,
        campoValorInventario:
          c.tipo === 'select' && (c.origenOpciones || 'manual') === 'inventario'
            ? (c.campoValorInventario || 'id')
            : undefined,
        opciones:
          c.tipo === 'select' && (c.origenOpciones || 'manual') === 'manual'
            ? c.opciones.split(',').map((o) => o.trim()).filter(Boolean)
            : undefined,
      }))
      .filter((c) => c.nombre && c.etiqueta)

    if (!nuevoFormulario.nombre.trim() || campos.length === 0) {
      setMensajeError('Debes definir nombre y al menos un campo válido')
      return
    }

    const esquema = JSON.stringify({ version: 1, campos })
    const method = formularioEdicionId ? 'PUT' : 'POST'
    const url = formularioEdicionId ? `${API_URL}/formularios/${formularioEdicionId}` : `${API_URL}/formularios`
    await fetch(url, {
      method,
      headers: cabeceras(),
      body: JSON.stringify({ nombre: nuevoFormulario.nombre.trim(), esquemaJson: esquema }),
    })
    setNuevoFormulario({ nombre: '' })
    setCamposFormularioNuevo([{
      nombre: '',
      etiqueta: '',
      tipo: 'string',
      obligatorio: true,
      opciones: '',
      origenOpciones: 'manual',
      multiple: false,
      catalogoInventario: 'HERRAMIENTAS',
      endpointOpciones: '/inventario',
      inventarioIds: [],
      campoEtiquetaInventario: 'nombre',
      campoValorInventario: 'id',
    }])
    setFormularioEdicionId('')
    cargarDatos()
  }

  const esAdmin = rolesUsuario.includes('ADMINISTRADOR')
  const esTecnico = rolesUsuario.includes('TECNICO')
  const esSupervisor = rolesUsuario.includes('SUPERVISOR')

  const refrescarPanelFlujosUsuario = useCallback(async () => {
    if (!token || (!esTecnico && !esSupervisor && !esAdmin)) return
    const flota = vistaSeccionFlujo === 'flota'
    const pasaSeccion = (t) => {
      const s = t.seccionPanel || 'OPERATIVOS'
      if (flota) return s === 'FLOTA'
      return s !== 'FLOTA'
    }
    const menuVisibleParaMisRoles = (p) => {
      if (esAdmin) return true
      const rol = String(p.menuInicioRol || 'TECNICO').toUpperCase()
      return rolesUsuario.includes(rol)
    }
    const sec = flota ? 'FLOTA' : 'OPERATIVOS'
    try {
      const [rMenu, rAct, rSeg, rHist] = await Promise.all([
        fetch(`${API_URL}/campo/flujos/menu?seccion=${encodeURIComponent(sec)}`, { headers: cabeceras() }),
        fetch(`${API_URL}/campo/flujos/mis-actividades/activas`, { headers: cabeceras() }),
        fetch(`${API_URL}/campo/flujos/mis-actividades/seguimiento`, { headers: cabeceras() }),
        fetch(`${API_URL}/campo/flujos/mis-actividades/historial`, { headers: cabeceras() }),
      ])
      if (rMenu.ok) {
        const raw = await rMenu.json()
        setPlantillasMenuFlujo(
          Array.isArray(raw) ? raw.filter(pasaSeccion).filter(menuVisibleParaMisRoles) : []
        )
      } else {
        setPlantillasMenuFlujo([])
      }
      if (rAct.ok) {
        const raw = await rAct.json()
        setActividadesFlujoActivas(Array.isArray(raw) ? raw.filter(pasaSeccion) : [])
      } else {
        setActividadesFlujoActivas([])
      }
      if (rSeg.ok) {
        const raw = await rSeg.json()
        setActividadesFlujoSeguimiento(Array.isArray(raw) ? raw.filter(pasaSeccion) : [])
      } else {
        setActividadesFlujoSeguimiento([])
      }
      if (rHist.ok) {
        const raw = await rHist.json()
        setActividadesFlujoHistorial(Array.isArray(raw) ? raw.filter(pasaSeccion) : [])
      } else {
        setActividadesFlujoHistorial([])
      }
    } catch {
      setPlantillasMenuFlujo([])
      setActividadesFlujoActivas([])
      setActividadesFlujoSeguimiento([])
      setActividadesFlujoHistorial([])
    }
  }, [token, esTecnico, esSupervisor, esAdmin, vistaSeccionFlujo, rolesUsuario])

  useEffect(() => {
    if (!token) return
    void refrescarPanelFlujosUsuario()
  }, [token, refrescarPanelFlujosUsuario])

  const informeRespuestaSeleccionada = useMemo(() => {
    if (!informeTareaSeleccionadaId) return null
    const tarea = tareasCampo.find((t) => String(t.id) === String(informeTareaSeleccionadaId))
    if (!tarea) return null
    const candidatas = respuestasFormularios
      .filter((r) => {
        const mismoFormulario = String(r.formulario?.id || '') === String(tarea.formulario?.id || '')
        const mismoTecnico = !tarea.asignadoA?.id || String(r.usuario?.id || '') === String(tarea.asignadoA?.id)
        return mismoFormulario && mismoTecnico
      })
      .sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime())
    return {
      tarea,
      respuesta: candidatas[0] || null,
    }
  }, [informeTareaSeleccionadaId, tareasCampo, respuestasFormularios])

  const guardarUsuario = async (e) => {
    e.preventDefault()
    setMensajeError('')
    try {
      if (!nuevoUsuario.rol) {
        throw new Error('Debes seleccionar un rol')
      }
      const respuesta = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: cabeceras(),
        body: JSON.stringify({
          nombreCompleto: nuevoUsuario.nombreCompleto,
          correo: nuevoUsuario.correo,
          clave: nuevoUsuario.clave,
          roles: [nuevoUsuario.rol],
        }),
      })
      if (!respuesta.ok) {
        const texto = await respuesta.text()
        throw new Error(texto || 'No se pudo crear el usuario')
      }
      setNuevoUsuario({ nombreCompleto: '', correo: '', clave: '', rol: 'TECNICO' })
      cargarDatos()
    } catch (error) {
      setMensajeError(error.message)
    }
  }

  const actualizarRolUsuario = async (usuarioId, rol) => {
    const resp = await fetch(`${API_URL}/usuarios/${usuarioId}/rol`, {
      method: 'PUT',
      headers: cabeceras(),
      body: JSON.stringify({ rol }),
    })
    if (!resp.ok) {
      setMensajeError(`No se pudo actualizar rol (${resp.status})`)
      return
    }
    cargarDatos()
  }

  const eliminarUsuario = async (usuarioId) => {
    const resp = await fetch(`${API_URL}/usuarios/${usuarioId}`, {
      method: 'DELETE',
      headers: cabeceras(),
    })
    if (!resp.ok) {
      setMensajeError(`No se pudo eliminar usuario (${resp.status})`)
      return
    }
    cargarDatos()
  }

  const eliminarFormulario = async (formularioId) => {
    if (!window.confirm('¿Eliminar este formulario? Esta acción no se puede deshacer.')) return
    const resp = await fetch(`${API_URL}/formularios/${formularioId}`, {
      method: 'DELETE',
      headers: cabeceras(),
    })
    if (!resp.ok) {
      let detalle = ''
      try {
        detalle = await resp.text()
      } catch {
        detalle = ''
      }
      setMensajeError(`No se pudo eliminar formulario (${resp.status}) ${detalle}`.trim())
      return
    }
    if (String(formularioAbiertoId) === String(formularioId)) setFormularioAbiertoId('')
    if (String(formularioEdicionId) === String(formularioId)) setFormularioEdicionId('')
    await cargarDatos()
  }

  const eliminarPlantillaFlujo = async (plantillaId) => {
    if (!window.confirm('¿Eliminar este flujo?')) return
    let r = await fetch(`${API_URL}/campo/flujos/plantillas/${plantillaId}`, {
      method: 'DELETE',
      headers: cabeceras(),
    })
    if (!r.ok && r.status === 400) {
      let detalle400 = ''
      try {
        const json = await r.json()
        detalle400 = json?.mensaje || json?.error || JSON.stringify(json)
      } catch {
        try {
          detalle400 = await r.text()
        } catch {
          detalle400 = ''
        }
      }
      if (window.confirm(`No se pudo eliminar en modo normal. ${detalle400}\n\n¿Deseas forzar borrado y eliminar también ejecuciones asociadas?`)) {
        r = await fetch(`${API_URL}/campo/flujos/plantillas/${plantillaId}?forzar=true`, {
          method: 'DELETE',
          headers: cabeceras(),
        })
      } else {
        setMensajeError(`No se pudo eliminar flujo (${r.status}) ${detalle400}`.trim())
        return
      }
    }
    if (!r.ok) {
      let detalle = ''
      try {
        detalle = await r.text()
      } catch {
        detalle = ''
      }
      setMensajeError(`No se pudo eliminar flujo (${r.status}) ${detalle}`.trim())
      return
    }
    await cargarPlantillasAdminFlujo()
    await refrescarPanelFlujosUsuario()
  }

  const eliminarPlanta = async (id) => {
    if (!window.confirm('¿Eliminar registro de planta?')) return
    const r = await fetch(`${API_URL}/plantas/${id}`, { method: 'DELETE', headers: cabeceras() })
    if (!r.ok) {
      setMensajeError(`No se pudo eliminar planta (${r.status})`)
      return
    }
    await cargarDatos()
  }

  const eliminarEquipo = async (id) => {
    if (!window.confirm('¿Eliminar registro de herramienta/equipo?')) return
    const r = await fetch(`${API_URL}/inventario/${id}`, { method: 'DELETE', headers: cabeceras() })
    if (!r.ok) {
      setMensajeError(`No se pudo eliminar registro (${r.status})`)
      return
    }
    await cargarDatos()
  }

  const agregarCampoFormulario = () => {
    setCamposFormularioNuevo((prev) => [
      ...prev,
      {
        nombre: '',
        etiqueta: '',
        tipo: 'string',
        obligatorio: true,
        opciones: '',
        origenOpciones: 'manual',
        multiple: false,
        catalogoInventario: 'HERRAMIENTAS',
        endpointOpciones: '/inventario',
        inventarioIds: [],
        campoEtiquetaInventario: 'nombre',
        campoValorInventario: 'id',
      },
    ])
  }

  const actualizarCampoFormulario = (idx, cambios) => {
    setCamposFormularioNuevo((prev) => prev.map((c, i) => (i === idx ? { ...c, ...cambios } : c)))
  }

  const eliminarCampoFormulario = (idx) => {
    setCamposFormularioNuevo((prev) => prev.filter((_, i) => i !== idx))
  }

  const abrirFormulario = (formularioId) => {
    setFormularioAbiertoId((prev) => (prev === formularioId ? '' : formularioId))
  }

  const cargarFormularioParaEditar = (formulario) => {
    setFormularioEdicionId(formulario.id)
    setNuevoFormulario({ nombre: formulario.nombre || '' })
    let esquema = { campos: [] }
    try {
      esquema = JSON.parse(formulario.esquemaJson || '{}')
    } catch {
      esquema = { campos: [] }
    }
    const campos = Array.isArray(esquema.campos) ? esquema.campos : []
    setCamposFormularioNuevo(
      campos.length > 0
        ? campos.map((c) => ({
            nombre: c.nombre || '',
            etiqueta: c.etiqueta || '',
            tipo: c.tipo || 'string',
            obligatorio: !!c.obligatorio,
            opciones: Array.isArray(c.opciones) ? c.opciones.join(', ') : '',
            origenOpciones: c.origenOpciones || 'manual',
            multiple: !!c.multiple,
            catalogoInventario: c.catalogoInventario || 'HERRAMIENTAS',
            endpointOpciones: c.endpointOpciones || ((c.catalogoInventario || 'HERRAMIENTAS') === 'PLANTAS' ? '/plantas' : '/inventario'),
            inventarioIds: Array.isArray(c.inventarioIds) ? c.inventarioIds.map((id) => String(id)) : [],
            campoEtiquetaInventario: c.campoEtiquetaInventario || 'nombre',
            campoValorInventario: c.campoValorInventario || 'id',
          }))
        : [{
          nombre: '',
          etiqueta: '',
          tipo: 'string',
          obligatorio: true,
          opciones: '',
          origenOpciones: 'manual',
          multiple: false,
          catalogoInventario: 'HERRAMIENTAS',
          endpointOpciones: '/inventario',
          inventarioIds: [],
          campoEtiquetaInventario: 'nombre',
          campoValorInventario: 'id',
        }]
    )
  }

  const obtenerEndpointCampo = (campo) => {
    const porCatalogo = (campo?.catalogoInventario || 'HERRAMIENTAS') === 'PLANTAS' ? '/plantas' : '/inventario'
    return normalizarEndpointCatalogo(campo?.endpointOpciones || porCatalogo)
  }

  const obtenerRegistrosCatalogo = (campo) => {
    const endpoint = obtenerEndpointCampo(campo)
    if (endpoint === '/plantas') return plantas
    if (endpoint === '/inventario') return inventario
    const clave = endpoint.toLowerCase()
    return Array.isArray(catalogosPorEndpoint[clave]) ? catalogosPorEndpoint[clave] : []
  }

  const cargarCatalogoPorEndpoint = async (endpointCrudo) => {
    const endpoint = normalizarEndpointCatalogo(endpointCrudo).toLowerCase()
    if (!token || endpoint === '/plantas' || endpoint === '/inventario') return
    if (Array.isArray(catalogosPorEndpoint[endpoint])) return
    try {
      const r = await fetch(`${API_URL}${endpoint}`, { headers: cabeceras() })
      if (!r.ok) {
        setCatalogosPorEndpoint((prev) => ({ ...prev, [endpoint]: [] }))
        return
      }
      const raw = await r.json()
      setCatalogosPorEndpoint((prev) => ({ ...prev, [endpoint]: Array.isArray(raw) ? raw : [] }))
    } catch {
      setCatalogosPorEndpoint((prev) => ({ ...prev, [endpoint]: [] }))
    }
  }

  const obtenerOpcionesCampo = (campo) => {
    if (!campo || campo.tipo !== 'select') return []
    if ((campo.origenOpciones || 'manual') === 'inventario') {
      const registrosCatalogo = obtenerRegistrosCatalogo(campo)
      const base = registrosCatalogo
      const campoEtiqueta = campo.campoEtiquetaInventario || 'nombre'
      const campoValor = campo.campoValorInventario || 'id'
      return base.map((item) => {
        const labelRaw = item?.[campoEtiqueta]
        const valueRaw = item?.[campoValor]
        const label = labelRaw !== undefined && labelRaw !== null && String(labelRaw).trim() ? String(labelRaw) : `${item.nombre || 'Equipo'} (${item.serial || 'Sin serial'})`
        const value = valueRaw !== undefined && valueRaw !== null && String(valueRaw).trim() ? String(valueRaw) : String(item.id)
        return { value, label }
      })
    }
    return (campo.opciones || []).map((opcion) => ({ value: String(opcion), label: String(opcion) }))
  }

  const crearTareaCampo = async (e) => {
    e.preventDefault()
    setMensajeError('')
    try {
      const etapas = (nuevaTareaCampo.etapasTexto || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
      const body = {
        titulo: nuevaTareaCampo.titulo,
        descripcion: nuevaTareaCampo.descripcion,
        latitud: nuevaTareaCampo.latitud ? Number(nuevaTareaCampo.latitud) : null,
        longitud: nuevaTareaCampo.longitud ? Number(nuevaTareaCampo.longitud) : null,
        etapas,
        asignadoAId: nuevaTareaCampo.asignadoAId ? Number(nuevaTareaCampo.asignadoAId) : null,
        formularioId: nuevaTareaCampo.formularioId ? Number(nuevaTareaCampo.formularioId) : null,
      }
      const resp = await fetch(`${API_URL}/campo/tareas`, {
        method: 'POST',
        headers: cabeceras(),
        body: JSON.stringify(body),
      })
      if (!resp.ok) throw new Error(`No se pudo crear tarea (${resp.status})`)
      setNuevaTareaCampo({ titulo: '', descripcion: '', latitud: '', longitud: '', etapasTexto: 'Llegada,Inspeccion,Cierre', asignadoAId: '', formularioId: '' })
      cargarDatos()
    } catch (err) {
      setMensajeError(err.message)
    }
  }

  const guardarAsignacionTareaCampo = async (e) => {
    e.preventDefault()
    if (!asignacionTareaCampo.tareaId) return
    const resp = await fetch(`${API_URL}/campo/tareas/${asignacionTareaCampo.tareaId}/asignacion`, {
      method: 'PUT',
      headers: cabeceras(),
      body: JSON.stringify({
        asignadoAId: asignacionTareaCampo.asignadoAId ? Number(asignacionTareaCampo.asignadoAId) : null,
        formularioId: asignacionTareaCampo.formularioId ? Number(asignacionTareaCampo.formularioId) : null,
      }),
    })
    if (!resp.ok) {
      setMensajeError(`No se pudo asignar tarea (${resp.status})`)
      return
    }
    setAsignacionTareaCampo({ tareaId: '', asignadoAId: '', formularioId: '' })
    cargarDatos()
  }

  const cargarDetalleTareaCampo = async (tareaId) => {
    setTareaCampoSeleccionadaId(tareaId)
    if (!tareaId) return
    const [hRes, eRes] = await Promise.all([
      fetch(`${API_URL}/campo/tareas/${tareaId}/historial`, { headers: cabeceras() }),
      fetch(`${API_URL}/campo/tareas/${tareaId}/evidencias`, { headers: cabeceras() }),
    ])
    if (hRes.ok) setHistorialTareaCampo(await hRes.json())
    if (eRes.ok) setEvidenciasCampo(await eRes.json())
  }

  const cambiarEstadoTarea = async (e) => {
    e.preventDefault()
    if (!tareaCampoSeleccionadaId) return
    const resp = await fetch(`${API_URL}/campo/tareas/${tareaCampoSeleccionadaId}/estado`, {
      method: 'PUT',
      headers: cabeceras(),
      body: JSON.stringify(cambioEstadoTareaCampo),
    })
    if (!resp.ok) {
      setMensajeError(`No se pudo cambiar estado (${resp.status})`)
      return
    }
    setCambioEstadoTareaCampo({ estadoNuevo: 'EN_PROCESO', comentario: '' })
    await cargarDetalleTareaCampo(tareaCampoSeleccionadaId)
    cargarDatos()
  }

  const subirEvidenciaCampo = async (e) => {
    e.preventDefault()
    if (!tareaCampoSeleccionadaId || !archivoEvidenciaCampo) return
    const fd = new FormData()
    fd.append('tipo', tipoEvidenciaCampo)
    fd.append('archivo', archivoEvidenciaCampo)
    const resp = await fetch(`${API_URL}/campo/tareas/${tareaCampoSeleccionadaId}/evidencias`, {
      method: 'POST',
      headers: cabecerasAuth(),
      body: fd,
    })
    if (!resp.ok) {
      setMensajeError(`No se pudo subir evidencia (${resp.status})`)
      return
    }
    setArchivoEvidenciaCampo(null)
    await cargarDetalleTareaCampo(tareaCampoSeleccionadaId)
  }

  const cambiarEstadoRapidoTarea = async (tareaId, estadoNuevo, comentario = '') => {
    const resp = await fetch(`${API_URL}/campo/tareas/${tareaId}/estado`, {
      method: 'PUT',
      headers: cabeceras(),
      body: JSON.stringify({ estadoNuevo, comentario }),
    })
    if (!resp.ok) {
      setMensajeError(`No se pudo cambiar estado (${resp.status})`)
      return
    }
    cargarDatos()
  }

  const actualizarRespuestaFormularioTecnico = (nombreCampo, valor) => {
    setRespuestasFormularioTecnico((prev) => ({ ...prev, [nombreCampo]: valor }))
  }

  const manejarArchivoCampo = async (nombreCampo, archivo) => {
    if (!archivo) return
    // Guardamos una referencia liviana en la respuesta para evitar payloads enormes.
    actualizarRespuestaFormularioTecnico(nombreCampo, `archivo:${archivo.name}`)
  }

  const enviarFormularioTecnico = async (tarea) => {
    if (!tarea?.formulario?.id) {
      setMensajeError('La tarea no tiene formulario asociado')
      return
    }
    const respFormulario = await fetch(`${API_URL}/formularios/respuestas`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify({
        formulario: { id: tarea.formulario.id },
        respuestaJson: JSON.stringify(respuestasFormularioTecnico),
      }),
    })
    if (!respFormulario.ok) {
      let detalle = ''
      try {
        const cuerpo = await respFormulario.json()
        detalle = cuerpo.mensaje || cuerpo.error || ''
      } catch {
        try {
          detalle = await respFormulario.text()
        } catch {
          detalle = ''
        }
      }
      setMensajeError(`No se pudo guardar formulario (${respFormulario.status}) ${detalle}`.trim())
      return
    }

    const respEstado = await fetch(`${API_URL}/campo/tareas/${tarea.id}/estado`, {
      method: 'PUT',
      headers: cabeceras(),
      body: JSON.stringify({ estadoNuevo: 'TERMINADA', comentario: 'Formulario diligenciado por técnico' }),
    })
    if (!respEstado.ok) {
      let detalleEstado = ''
      try {
        const cuerpo = await respEstado.json()
        detalleEstado = cuerpo.mensaje || cuerpo.error || ''
      } catch {
        try {
          detalleEstado = await respEstado.text()
        } catch {
          detalleEstado = ''
        }
      }
      setMensajeError(`Formulario guardado pero no se pudo finalizar tarea (${respEstado.status}) ${detalleEstado}`.trim())
      return
    }
    setTareaFormularioActivaId('')
    setRespuestasFormularioTecnico({})
    cargarDatos()
  }

  const cargarEtapasActividadFlujo = async (tareaId) => {
    if (!tareaId) return []
    const r = await fetch(`${API_URL}/campo/tareas/${tareaId}/etapas`, { headers: cabeceras() })
    if (!r.ok) return []
    const raw = await r.json()
    const etapas = Array.isArray(raw) ? raw : []
    setEtapasPorActividadFlujo((prev) => ({ ...prev, [tareaId]: etapas }))
    return etapas
  }

  const toggleExpandirActividadFlujo = async (tareaId) => {
    const sid = tareaId !== undefined && tareaId !== null && tareaId !== '' ? String(tareaId) : ''
    setActividadFlujoExpandidaId((prev) => (String(prev) === sid ? '' : sid))
    setRespuestasPasoFlujo({})
    if (!sid) return
    const etapas = await cargarEtapasActividadFlujo(sid)
    const paso = [...etapas].sort((a, b) => (a.orden || 0) - (b.orden || 0)).find((e) => !e.completada)
    if (!paso?.formulario?.esquemaJson) return
    try {
      const campos = JSON.parse(paso.formulario.esquemaJson || '{}').campos || []
      const endpoints = campos
        .filter((c) => c?.tipo === 'select' && (c?.origenOpciones || 'manual') === 'inventario')
        .map((c) => obtenerEndpointCampo(c))
      await Promise.all(endpoints.map((ep) => cargarCatalogoPorEndpoint(ep)))
    } catch {
      // sin esquema parseable
    }
  }

  const iniciarFlujoDesdeMenu = async (plantillaId, tituloPlantilla) => {
    const nombre = (tituloPlantilla && String(tituloPlantilla).trim()) || 'este flujo'
    if (!window.confirm(`¿Desea empezar el formulario «${nombre}»? Se creará una nueva actividad en «Mis actividades».`)) {
      return
    }
    setMensajeError('')
    const r = await fetch(`${API_URL}/campo/flujos/plantillas/${plantillaId}/iniciar`, { method: 'POST', headers: cabeceras() })
    let cuerpo = {}
    try {
      cuerpo = await r.json()
    } catch {
      cuerpo = {}
    }
    if (!r.ok) {
      setMensajeError(`No se pudo iniciar (${r.status}) ${cuerpo.mensaje || cuerpo.error || ''}`.trim())
      return
    }
    await refrescarPanelFlujosUsuario()
    await cargarDatos()
    if (cuerpo?.id) {
      setActividadFlujoExpandidaId(String(cuerpo.id))
      setRespuestasPasoFlujo({})
      await cargarEtapasActividadFlujo(String(cuerpo.id))
      setVistaPanelFlujo('mis')
    }
  }

  const enviarPasoFlujo = async (tareaId, etapaId) => {
    setMensajeError('')
    if (!respuestasPasoFlujo.firmaSistema) {
      setMensajeError('La firma es obligatoria para completar el formulario.')
      return
    }
    const r = await fetch(`${API_URL}/campo/flujos/ejecuciones/${tareaId}/pasos/${etapaId}/completar`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify({ respuestaJson: JSON.stringify(respuestasPasoFlujo) }),
    })
    let cuerpo = {}
    try {
      cuerpo = await r.json()
    } catch {
      cuerpo = {}
    }
    if (!r.ok) {
      setMensajeError(`No se pudo completar el paso (${r.status}) ${cuerpo.mensaje || cuerpo.error || ''}`.trim())
      return
    }
    setRespuestasPasoFlujo({})
    setActividadFlujoExpandidaId('')
    setEtapasPorActividadFlujo((prev) => {
      const n = { ...prev }
      delete n[tareaId]
      return n
    })
    await refrescarPanelFlujosUsuario()
    await cargarDatos()
    if (cuerpo?.estado === 'TERMINADA') {
      setVistaPanelFlujo('historial')
    }
  }

  const cargarPlantillasAdminFlujo = async () => {
    const [rb, rp] = await Promise.all([
      fetch(`${API_URL}/campo/flujos/plantillas?estado=BORRADOR`, { headers: cabeceras() }),
      fetch(`${API_URL}/campo/flujos/plantillas?estado=PUBLICADA`, { headers: cabeceras() }),
    ])
    if (rb.ok) {
      const x = await rb.json()
      setPlantillasBorrador(Array.isArray(x) ? x : [])
    } else {
      setPlantillasBorrador([])
    }
    if (rp.ok) {
      const x = await rp.json()
      setPlantillasPublicadas(Array.isArray(x) ? x : [])
    } else {
      setPlantillasPublicadas([])
    }
  }

  const crearPlantillaFlujoSubmit = async (e) => {
    e.preventDefault()
    setMensajeError('')
    const pasosValidos = pasosPlantillaFlujo
      .map((p) => ({
        nombre: (p.nombre || '').trim(),
        rolResponsable: p.rolResponsable,
        formularioId: p.formularioId ? Number(p.formularioId) : null,
      }))
      .filter((p) => p.nombre && p.formularioId)
    if (!nuevaPlantillaFlujo.titulo?.trim() || pasosValidos.length === 0) {
      setMensajeError('Define título y al menos un paso con nombre, formulario y rol')
      return
    }
    const rolInicio = nuevaPlantillaFlujo.rolPrimerPaso || 'TECNICO'
    const idxPrimero = pasosValidos.findIndex((p) => p.rolResponsable === rolInicio)
    if (idxPrimero === -1) {
      setMensajeError(`Debe haber al menos un paso con rol ${rolInicio} (quien hace el primer paso).`)
      return
    }
    const primero = pasosValidos[idxPrimero]
    const resto = [...pasosValidos.slice(0, idxPrimero), ...pasosValidos.slice(idxPrimero + 1)]
    const ordenados = [primero, ...resto]
    const pasos = ordenados.map((p, i) => ({
      nombre: p.nombre,
      orden: i + 1,
      rolResponsable: p.rolResponsable,
      formularioId: p.formularioId,
    }))
    const menuRol = rolInicio
    const r = await fetch(`${API_URL}/campo/flujos/plantillas`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify({
        titulo: nuevaPlantillaFlujo.titulo.trim(),
        descripcion: nuevaPlantillaFlujo.descripcion || '',
        tipoVisibilidad: 'MENU_PERMANENTE',
        seccionPanel: nuevaPlantillaFlujo.seccionPanel,
        visibleEnMenuFlujo: true,
        menuInicioRol: menuRol,
        pasos,
      }),
    })
    let cuerpo = {}
    try {
      cuerpo = await r.json()
    } catch {
      cuerpo = {}
    }
    if (!r.ok) {
      setMensajeError(`No se pudo crear el flujo (${r.status}) ${cuerpo.mensaje || ''}`.trim())
      return
    }
    setNuevaPlantillaFlujo({
      titulo: '',
      descripcion: '',
      tipoVisibilidad: 'MENU_PERMANENTE',
      seccionPanel: 'OPERATIVOS',
      visibleEnMenuFlujo: true,
      rolPrimerPaso: 'TECNICO',
    })
    setPasosPlantillaFlujo([{ nombre: '', rolResponsable: 'TECNICO', formularioId: '' }])
    await cargarPlantillasAdminFlujo()
  }

  const publicarPlantillaFlujo = async (id) => {
    setMensajeError('')
    const r = await fetch(`${API_URL}/campo/flujos/plantillas/${id}/publicar`, { method: 'PUT', headers: cabeceras() })
    let cuerpo = {}
    try {
      cuerpo = await r.json()
    } catch {
      cuerpo = {}
    }
    if (!r.ok) {
      setMensajeError(cuerpo.mensaje || `Error ${r.status}`)
      return
    }
    await cargarPlantillasAdminFlujo()
    await refrescarPanelFlujosUsuario()
  }

  useEffect(() => {
    if (moduloActivo !== 'flujos' || !esAdmin || !token) return
    void cargarPlantillasAdminFlujo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduloActivo, esAdmin, token])

  const renderContenido = () => {
    if (moduloActivo === 'dashboard') {
      if (esTecnico || esSupervisor) {
        return (
          <section className="panel-dashboard-tecnico">
            <div className="tabs-sub-tecnico" style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                className={vistaSeccionFlujo === 'operativos' ? 'btn-tab-sub-tecnico activo' : 'btn-tab-sub-tecnico'}
                onClick={() => setVistaSeccionFlujo('operativos')}
              >
                Operativos
              </button>
              <button
                type="button"
                className={vistaSeccionFlujo === 'flota' ? 'btn-tab-sub-tecnico activo' : 'btn-tab-sub-tecnico'}
                onClick={() => setVistaSeccionFlujo('flota')}
              >
                Flota
              </button>
            </div>
            <div className="tabs-dashboard-admin">
              <button
                type="button"
                className={vistaPanelFlujo === 'disponibles' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                onClick={() => setVistaPanelFlujo('disponibles')}
              >
                Disponibles <span className="badge-tab">{plantillasMenuFlujo.length}</span>
              </button>
              <button
                type="button"
                className={vistaPanelFlujo === 'mis' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                onClick={() => setVistaPanelFlujo('mis')}
              >
                Mis actividades{' '}
                <span className="badge-tab">{actividadesFlujoActivas.length + actividadesFlujoSeguimiento.length}</span>
              </button>
              <button
                type="button"
                className={vistaPanelFlujo === 'historial' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                onClick={() => setVistaPanelFlujo('historial')}
              >
                Historial <span className="badge-tab">{actividadesFlujoHistorial.length}</span>
              </button>
            </div>
            <p className="texto-ayuda-tecnico" style={{ marginTop: '0.75rem' }}>
              <strong>Disponibles</strong>: solo aparecen flujos que <strong>tú puedes iniciar</strong> según tu rol. <strong>Mis actividades</strong>: lo que debes hacer ahora; debajo, <strong>Seguimiento</strong> es para ver el avance sin editar hasta que vuelva tu turno. Al terminar todo, la instancia va a <strong>Historial</strong>.
            </p>

            {vistaPanelFlujo === 'disponibles' && (
              <div className="grid-actividades-tecnico" style={{ marginTop: '1rem' }}>
                {plantillasMenuFlujo.length === 0 && <p>No hay flujos disponibles en esta sección.</p>}
                {plantillasMenuFlujo.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="tarjeta-actividad-tecnico"
                    onClick={() => iniciarFlujoDesdeMenu(p.id, p.titulo)}
                  >
                    <span className="tarjeta-actividad-titulo">{p.titulo}</span>
                    <span className="tarjeta-actividad-hint">Iniciar nueva ejecución</span>
                  </button>
                ))}
              </div>
            )}

            {vistaPanelFlujo === 'mis' && (
              <div style={{ marginTop: '1rem' }}>
                {actividadesFlujoActivas.length === 0 && actividadesFlujoSeguimiento.length === 0 && (
                  <p>No tienes actividades en esta sección.</p>
                )}
                {actividadesFlujoActivas.length > 0 && (
                  <h4 className="titulo-seccion" style={{ marginBottom: '0.75rem' }}>
                    En tu turno (puedes completar el paso)
                  </h4>
                )}
                {actividadesFlujoActivas.map((t) => {
                  const etapas = [...(etapasPorActividadFlujo[t.id] || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0))
                  const paso = etapas.find((e) => !e.completada)
                  const exp = String(actividadFlujoExpandidaId) === String(t.id)
                  let campos = []
                  if (paso?.formulario?.esquemaJson) {
                    try {
                      campos = JSON.parse(paso.formulario.esquemaJson || '{}').campos || []
                    } catch {
                      campos = []
                    }
                  }
                  return (
                    <div key={t.id} className="tarjeta-formulario" style={{ marginBottom: '1rem' }}>
                      <div className="roles-grid">
                        <strong>{t.titulo}</strong>
                        <button type="button" className="btn-secundario" onClick={() => toggleExpandirActividadFlujo(exp ? '' : t.id)}>
                          {exp ? 'Ocultar' : paso ? 'Realizar mi paso' : 'Ver detalle'}
                        </button>
                      </div>
                      {paso && (
                        <small className="texto-ref-id">
                          Paso actual: {paso.nombre} · responsable {paso.rolResponsable}
                        </small>
                      )}
                      {exp && paso && (
                        <>
                          <h4 style={{ marginTop: '0.75rem' }}>{paso.formulario?.nombre || 'Formulario'}</h4>
                          {campos.length === 0 && <p>Sin campos en el formulario.</p>}
                          {campos.map((c, idx) => (
                            <div key={`${c.nombre}-${idx}`} className="formulario">
                              <label>{c.etiqueta || c.nombre}</label>
                              {c.tipo === 'int' && (
                                <input
                                  type="number"
                                  onChange={(e) =>
                                    setRespuestasPasoFlujo((prev) => ({ ...prev, [c.nombre]: Number(e.target.value || 0) }))
                                  }
                                />
                              )}
                              {c.tipo === 'fecha' && (
                                <input
                                  type="date"
                                  onChange={(e) => setRespuestasPasoFlujo((prev) => ({ ...prev, [c.nombre]: e.target.value }))}
                                />
                              )}
                              {c.tipo === 'select' && (
                                <select
                                  multiple={!!c.multiple}
                                  size={c.multiple ? 5 : 1}
                                  onChange={(e) => {
                                    if (c.multiple) {
                                      const seleccionados = Array.from(e.target.selectedOptions).map((opt) => opt.value)
                                      setRespuestasPasoFlujo((prev) => ({ ...prev, [c.nombre]: seleccionados }))
                                      return
                                    }
                                    setRespuestasPasoFlujo((prev) => ({ ...prev, [c.nombre]: e.target.value }))
                                  }}
                                >
                                  {!c.multiple && <option value="">Selecciona</option>}
                                  {obtenerOpcionesCampo(c).length === 0 && <option value="" disabled>Sin opciones disponibles</option>}
                                  {obtenerOpcionesCampo(c).map((op) => (
                                    <option key={op.value} value={op.value}>
                                      {op.label}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {(c.tipo === 'imagen' || c.tipo === 'firma') && (
                                <input
                                  type="file"
                                  onChange={(e) =>
                                    setRespuestasPasoFlujo((prev) => ({
                                      ...prev,
                                      [c.nombre]: e.target.files?.[0] ? `archivo:${e.target.files[0].name}` : '',
                                    }))
                                  }
                                />
                              )}
                              {(c.tipo === 'string' || !['int', 'fecha', 'select', 'imagen', 'firma'].includes(c.tipo)) && (
                                <input
                                  type="text"
                                  onChange={(e) => setRespuestasPasoFlujo((prev) => ({ ...prev, [c.nombre]: e.target.value }))}
                                />
                              )}
                            </div>
                          ))}
                          <div className="formulario">
                            <label>Firma obligatoria</label>
                            <PanelFirma
                              value={respuestasPasoFlujo.firmaSistema || ''}
                              onChange={(firmaDataUrl) =>
                                setRespuestasPasoFlujo((prev) => ({ ...prev, firmaSistema: firmaDataUrl }))
                              }
                            />
                            <small className="texto-ayuda-tecnico">
                              Firma con el dedo (táctil) o con el mouse (PC). Este campo siempre es obligatorio.
                            </small>
                          </div>
                          <button type="button" style={{ marginTop: '0.5rem' }} onClick={() => enviarPasoFlujo(t.id, paso.id)}>
                            Completar paso y continuar
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
                {actividadesFlujoSeguimiento.length > 0 && (
                  <>
                    <h4 className="titulo-seccion" style={{ margin: '1.25rem 0 0.75rem' }}>
                      Seguimiento (solo consulta; no es tu turno)
                    </h4>
                    {actividadesFlujoSeguimiento.map((t) => {
                      const etapas = [...(etapasPorActividadFlujo[t.id] || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0))
                      const pasoActual = etapas.find((e) => !e.completada)
                      const exp = String(actividadFlujoExpandidaId) === String(t.id)
                      return (
                        <div key={`seg-${t.id}`} className="tarjeta-formulario" style={{ marginBottom: '1rem', opacity: 0.95 }}>
                          <div className="roles-grid">
                            <strong>{t.titulo}</strong>
                            <button type="button" className="btn-secundario" onClick={() => toggleExpandirActividadFlujo(exp ? '' : t.id)}>
                              {exp ? 'Ocultar avance' : 'Ver avance del flujo'}
                            </button>
                          </div>
                          {pasoActual && (
                            <small className="texto-ref-id">
                              Paso en curso: {pasoActual.nombre} · a cargo {pasoActual.rolResponsable}
                            </small>
                          )}
                          {exp && (
                            <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem' }}>
                              {etapas.map((e) => (
                                <li key={e.id} style={{ marginBottom: '0.35rem' }}>
                                  {e.completada ? (
                                    <>
                                      <span style={{ color: '#15803d' }}>✓</span> {e.nombre}
                                      {e.completadaPor?.nombreCompleto ? ` · ${e.completadaPor.nombreCompleto}` : ''}
                                    </>
                                  ) : (
                                    <>
                                      <span style={{ color: '#ca8a04' }}>○</span> {e.nombre} · pendiente · responsable {e.rolResponsable}
                                      {pasoActual?.id === e.id ? ' (turno actual)' : ''}
                                    </>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}

            {vistaPanelFlujo === 'historial' && (
              <div style={{ marginTop: '1rem' }}>
                <TablaSimple
                  columnas={['Ref.', 'Actividad', 'Estado']}
                  filas={actividadesFlujoHistorial.map((t) => [t.id, t.titulo, renderEstadoTarea(t.estado)])}
                />
              </div>
            )}
          </section>
        )
      }
      if (esAdmin) {
        const pendientesAdmin = tareasCampo.filter((t) =>
          t.estado === 'PENDIENTE' || t.estado === 'EN_PROCESO' || t.estado === 'PENDIENTE_APROBACION'
        )
        const finalizadasAdmin = tareasCampo.filter((t) => t.estado === 'TERMINADA' || t.estado === 'CANCELADA')
        return (
          <section>
            <div className="tarjetas-grid">
              {resumen.map((item) => (
                <article key={item.titulo} className="tarjeta">
                  <h3>{item.titulo}</h3>
                  <p>{item.valor}</p>
                </article>
              ))}
            </div>
            <div className="tabs-dashboard-admin">
              <button
                type="button"
                className={vistaDashboardAdmin === 'pendientes' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                onClick={() => setVistaDashboardAdmin('pendientes')}
              >
                📌 Registro de tareas pendientes <span className="badge-tab">{pendientesAdmin.length}</span>
              </button>
              <button
                type="button"
                className={vistaDashboardAdmin === 'finalizadas' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                onClick={() => setVistaDashboardAdmin('finalizadas')}
              >
                ✅ Registro de tareas finalizadas/canceladas <span className="badge-tab">{finalizadasAdmin.length}</span>
              </button>
            </div>

            {vistaDashboardAdmin === 'pendientes' && (
              <div className="panel-seccion">
                <div className="panel-seccion-header">
                  <h3>Registro de tareas pendientes</h3>
                  <span>{pendientesAdmin.length} tareas</span>
                </div>
                <TablaSimple
                  columnas={['Id', 'Tarea', 'Estado', 'Técnico', 'Formulario']}
                  filas={pendientesAdmin.map((t) => [t.id, t.titulo, renderEstadoTarea(t.estado), t.asignadoA?.correo, t.formulario?.nombre])}
                />
              </div>
            )}

            {vistaDashboardAdmin === 'finalizadas' && (
              <div className="panel-seccion">
                <div className="panel-seccion-header">
                  <h3>Registro de tareas finalizadas/canceladas</h3>
                  <span>{finalizadasAdmin.length} tareas</span>
                </div>
                <TablaSimple
                  columnas={['Id', 'Tarea', 'Estado', 'Técnico', 'Formulario', 'Acción']}
                  filas={finalizadasAdmin.map((t) => [
                    t.id,
                    t.titulo,
                    renderEstadoTarea(t.estado),
                    t.asignadoA?.correo,
                    t.formulario?.nombre,
                    (
                      <button
                        type="button"
                        className="btn-secundario"
                        onClick={() => setInformeTareaSeleccionadaId((prev) => (String(prev) === String(t.id) ? '' : String(t.id)))}
                      >
                        {String(informeTareaSeleccionadaId) === String(t.id) ? 'Ocultar informe' : 'Ver informe'}
                      </button>
                    ),
                  ])}
                />
              </div>
            )}

            {vistaDashboardAdmin === 'finalizadas' && informeRespuestaSeleccionada && (
              <div className="panel-seccion">
                <div className="panel-seccion-header">
                  <h3>Informe de tarea #{informeRespuestaSeleccionada.tarea.id}</h3>
                  <span>{informeRespuestaSeleccionada.tarea.titulo}</span>
                </div>
                {!informeRespuestaSeleccionada.respuesta && (
                  <p>No se encontró respuesta de formulario para esta tarea.</p>
                )}
                {informeRespuestaSeleccionada.respuesta && (
                  <>
                    <div className="resumen-informe">
                      <span><strong>Formulario:</strong> {informeRespuestaSeleccionada.respuesta.formulario?.nombre || '-'}</span>
                      <span><strong>Técnico:</strong> {informeRespuestaSeleccionada.respuesta.usuario?.correo || '-'}</span>
                      <span><strong>Fecha:</strong> {formatearFecha(informeRespuestaSeleccionada.respuesta.fechaRegistro)}</span>
                    </div>
                    <TablaSimple
                      columnas={['Campo', 'Respuesta']}
                      filas={construirFilasInforme(informeRespuestaSeleccionada.respuesta.respuestaJson)}
                    />
                  </>
                )}
              </div>
            )}
          </section>
        )
      }
      return (
        <div className="tarjetas-grid">
          {resumen.map((item) => (
            <article key={item.titulo} className="tarjeta">
              <h3>{item.titulo}</h3>
              <p>{item.valor}</p>
            </article>
          ))}
        </div>
      )
    }

    if (moduloActivo === 'flujos') {
      if (!esAdmin) {
        return <p>Solo administración puede diseñar y publicar flujos.</p>
      }
      return (
        <section>
          <div className="panel-seccion-header">
            <h3>Flujos de actividades</h3>
            <span>Diseña procesos por pasos, roles y formularios. Nada se publica hasta que lo confirmes.</span>
          </div>
          <div className="tabs-dashboard-admin">
            <button
              type="button"
              className={vistaAdminFlujos === 'diseno' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
              onClick={() => setVistaAdminFlujos('diseno')}
            >
              Diseñar flujo
            </button>
            <button
              type="button"
              className={vistaAdminFlujos === 'borradores' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
              onClick={() => setVistaAdminFlujos('borradores')}
            >
              Borradores <span className="badge-tab">{plantillasBorrador.length}</span>
            </button>
            <button
              type="button"
              className={vistaAdminFlujos === 'publicadas' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
              onClick={() => setVistaAdminFlujos('publicadas')}
            >
              Publicadas <span className="badge-tab">{plantillasPublicadas.length}</span>
            </button>
          </div>

          {vistaAdminFlujos === 'diseno' && (
            <div className="tarjeta-formulario">
              <h4>Nueva plantilla (borrador)</h4>
              <form className="formulario" onSubmit={crearPlantillaFlujoSubmit}>
                <input
                  placeholder="Nombre del flujo"
                  value={nuevaPlantillaFlujo.titulo}
                  onChange={(e) => setNuevaPlantillaFlujo({ ...nuevaPlantillaFlujo, titulo: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Descripción (opcional)"
                  value={nuevaPlantillaFlujo.descripcion}
                  onChange={(e) => setNuevaPlantillaFlujo({ ...nuevaPlantillaFlujo, descripcion: e.target.value })}
                  rows={2}
                />
                <p className="texto-ayuda-tecnico" style={{ marginTop: '-0.25rem' }}>
                  Este flujo se crea como menú permanente: al publicarlo, quedará disponible para los roles definidos.
                </p>
                <label className="rol-checkbox">Sección del panel (técnico / supervisor)</label>
                <div className="roles-grid">
                  <label className="rol-checkbox">
                    <input
                      type="radio"
                      name="secFlujo"
                      checked={nuevaPlantillaFlujo.seccionPanel === 'OPERATIVOS'}
                      onChange={() =>
                        setNuevaPlantillaFlujo({ ...nuevaPlantillaFlujo, seccionPanel: 'OPERATIVOS' })
                      }
                    />
                    Operativos
                  </label>
                  <label className="rol-checkbox">
                    <input
                      type="radio"
                      name="secFlujo"
                      checked={nuevaPlantillaFlujo.seccionPanel === 'FLOTA'}
                      onChange={() => setNuevaPlantillaFlujo({ ...nuevaPlantillaFlujo, seccionPanel: 'FLOTA' })}
                    />
                    Flota
                  </label>
                </div>
                <label className="rol-checkbox">Quién hace el primer paso (inicia el flujo y ve «Disponibles»)</label>
                <select
                  value={nuevaPlantillaFlujo.rolPrimerPaso}
                  onChange={(e) => setNuevaPlantillaFlujo({ ...nuevaPlantillaFlujo, rolPrimerPaso: e.target.value })}
                >
                  <option value="TECNICO">TECNICO</option>
                  <option value="SUPERVISOR">SUPERVISOR</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                </select>
                <p className="texto-ayuda-tecnico" style={{ marginTop: '0.35rem' }}>
                  En cada paso eliges qué rol lo hace; los demás solo lo verán en «Mis actividades» cuando sea su turno.
                </p>
                <p className="texto-ayuda-tecnico" style={{ marginTop: '0.25rem' }}>
                  Se publicará visible en «Disponibles» automáticamente.
                </p>
                <h4 className="titulo-seccion">Pasos</h4>
                <p className="texto-ayuda-tecnico" style={{ marginBottom: '0.75rem' }}>
                  Debe existir al menos un paso con el rol elegido arriba (ese quedará primero). El resto sigue el orden de esta lista.
                </p>
                {pasosPlantillaFlujo.map((paso, idx) => (
                  <div key={idx} className="formulario" style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '0.75rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.35rem' }}>Paso {idx + 1}</strong>
                    <input
                      placeholder="Nombre del paso"
                      value={paso.nombre}
                      onChange={(e) => {
                        const copia = [...pasosPlantillaFlujo]
                        copia[idx] = { ...copia[idx], nombre: e.target.value }
                        setPasosPlantillaFlujo(copia)
                      }}
                    />
                    <select
                      value={paso.rolResponsable}
                      onChange={(e) => {
                        const copia = [...pasosPlantillaFlujo]
                        copia[idx] = { ...copia[idx], rolResponsable: e.target.value }
                        setPasosPlantillaFlujo(copia)
                      }}
                    >
                      <option value="TECNICO">TECNICO</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    </select>
                    <select
                      value={paso.formularioId}
                      onChange={(e) => {
                        const copia = [...pasosPlantillaFlujo]
                        copia[idx] = { ...copia[idx], formularioId: e.target.value }
                        setPasosPlantillaFlujo(copia)
                      }}
                    >
                      <option value="">Formulario</option>
                      {formularios.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <button type="button" onClick={() => setPasosPlantillaFlujo([...pasosPlantillaFlujo, { nombre: '', rolResponsable: 'TECNICO', formularioId: '' }])}>
                  + Paso
                </button>
                <button type="submit">Guardar borrador</button>
              </form>
            </div>
          )}

          {vistaAdminFlujos === 'borradores' && (
            <div className="tarjeta-formulario">
              <h4>Borradores</h4>
              <TablaSimple
                columnas={['Id', 'Título', 'Tipo', 'Sección', 'Acciones']}
                filas={plantillasBorrador.map((p) => [
                  p.id,
                  p.titulo,
                  p.tipoVisibilidadFlujo || '—',
                  p.seccionPanel || '—',
                  <div key={`acc-bor-${p.id}`} className="acciones-usuario-admin">
                    <button type="button" onClick={() => publicarPlantillaFlujo(p.id)}>Publicar</button>
                    <button type="button" className="btn-peligro" onClick={() => eliminarPlantillaFlujo(p.id)}>Eliminar</button>
                  </div>,
                ])}
              />
            </div>
          )}

          {vistaAdminFlujos === 'publicadas' && (
            <div className="tarjeta-formulario">
              <h4>Plantillas publicadas</h4>
              <TablaSimple
                columnas={['Id', 'Título', 'Tipo', 'Menú', 'Inicio rol', 'Sección', 'Acciones']}
                filas={plantillasPublicadas.map((p) => [
                  p.id,
                  p.titulo,
                  p.tipoVisibilidadFlujo || '—',
                  p.visibleEnMenuFlujo ? 'Sí' : 'No',
                  p.menuInicioRol || '—',
                  p.seccionPanel || '—',
                  <button key={`del-pub-${p.id}`} type="button" className="btn-peligro" onClick={() => eliminarPlantillaFlujo(p.id)}>Eliminar</button>,
                ])}
              />
            </div>
          )}

          {vistaAdminFlujos === 'instancia' && null}
        </section>
      )
    }

    if (moduloActivo === 'inventario') {
      if (esTecnico) {
        return <p>No tienes acceso a inventario.</p>
      }
      return (
        <section>
          <div className="tabs-dashboard-admin">
            <button
              type="button"
              className={vistaInventario === 'plantas' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
              onClick={() => setVistaInventario('plantas')}
            >
              🏭 Plantas <span className="badge-tab">{plantas.length}</span>
            </button>
            <button
              type="button"
              className={vistaInventario === 'herramientas' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
              onClick={() => setVistaInventario('herramientas')}
            >
              🧰 Herramientas <span className="badge-tab">{inventario.length}</span>
            </button>
          </div>

          {vistaInventario === 'plantas' && (
            <div className="tarjeta-formulario">
              <div className="panel-seccion-header">
                <h3>Plantas</h3>
                <span>{plantas.length} registradas</span>
              </div>
              <form className="formulario" onSubmit={guardarPlanta}>
                <input placeholder="Nombre de planta" value={nuevaPlanta.nombre} onChange={(e) => setNuevaPlanta({ ...nuevaPlanta, nombre: e.target.value })} required />
                <input placeholder="Serial" value={nuevaPlanta.serial} onChange={(e) => setNuevaPlanta({ ...nuevaPlanta, serial: e.target.value })} required />
                <input placeholder="Ubicación" value={nuevaPlanta.ubicacion} onChange={(e) => setNuevaPlanta({ ...nuevaPlanta, ubicacion: e.target.value })} />
                <button type="submit">Guardar planta</button>
              </form>
              <TablaSimple
                columnas={['Nombre', 'Serial', 'Ubicación', 'Estado', 'Acciones']}
                filas={plantas.map((p) => [
                  p.nombre,
                  p.serial,
                  p.ubicacion,
                  p.estado,
                  esAdmin ? <button key={`del-pl-${p.id}`} type="button" className="btn-peligro" onClick={() => eliminarPlanta(p.id)}>Eliminar</button> : '-',
                ])}
              />
            </div>
          )}

          {vistaInventario === 'herramientas' && (
            <div className="tarjeta-formulario">
              <div className="panel-seccion-header">
                <h3>Herramientas</h3>
                <span>{inventario.length} registradas</span>
              </div>
              <form className="formulario" onSubmit={guardarEquipo}>
                <input placeholder="Nombre de herramienta/equipo" value={nuevoEquipo.nombre} onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, nombre: e.target.value })} required />
                <input placeholder="Serial" value={nuevoEquipo.serial} onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, serial: e.target.value })} required />
                <input placeholder="Responsable" value={nuevoEquipo.responsable} onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, responsable: e.target.value })} />
                <input placeholder="Ubicación" value={nuevoEquipo.ubicacion} onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, ubicacion: e.target.value })} />
                <button type="submit">Guardar herramienta</button>
              </form>
              <TablaSimple
                columnas={['Nombre', 'Serial', 'Responsable', 'Estado', 'Ubicación', 'Acciones']}
                filas={inventario.map((i) => [
                  i.nombre,
                  i.serial,
                  i.responsable,
                  i.estado,
                  i.ubicacion,
                  esAdmin ? <button key={`del-inv-${i.id}`} type="button" className="btn-peligro" onClick={() => eliminarEquipo(i.id)}>Eliminar</button> : '-',
                ])}
              />
            </div>
          )}
        </section>
      )
    }

    if (moduloActivo === 'formularios') {
      if (esTecnico) {
        return <p>No tienes acceso a formularios.</p>
      }
      return (
        <section>
          {esAdmin && (
            <div className="tabs-dashboard-admin">
              <button
                type="button"
                className={vistaFormulariosAdmin === 'crear' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                onClick={() => setVistaFormulariosAdmin('crear')}
              >
                🧱 Crear formulario
              </button>
              <button
                type="button"
                className={vistaFormulariosAdmin === 'ver' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                onClick={() => setVistaFormulariosAdmin('ver')}
              >
                📋 Ver formularios creados <span className="badge-tab">{formularios.length}</span>
              </button>
            </div>
          )}

          {esAdmin && vistaFormulariosAdmin === 'crear' && (
            <div className="tarjeta-formulario">
              <div className="panel-seccion-header">
                <h3>Crear formulario</h3>
                <span>Define estructura y guarda. Los procesos con varios pasos y roles se configuran en el módulo Flujos.</span>
              </div>
              <form className="formulario" onSubmit={guardarFormulario}>
                <input placeholder="Nombre de formulario" value={nuevoFormulario.nombre} onChange={(e) => setNuevoFormulario({ ...nuevoFormulario, nombre: e.target.value })} required />
                <button type="submit">{formularioEdicionId ? 'Actualizar formulario' : 'Guardar formulario'}</button>
              </form>
              <h4 className="titulo-seccion">Constructor de campos</h4>
              {camposFormularioNuevo.map((campo, idx) => (
                <div key={idx} className="formulario">
                  <input placeholder="Nombre interno (ej: cedula)" value={campo.nombre} onChange={(e) => actualizarCampoFormulario(idx, { nombre: e.target.value })} />
                  <input placeholder="Etiqueta visible (ej: Cédula)" value={campo.etiqueta} onChange={(e) => actualizarCampoFormulario(idx, { etiqueta: e.target.value })} />
                  <select value={campo.tipo} onChange={(e) => actualizarCampoFormulario(idx, { tipo: e.target.value })}>
                    <option value="string">Texto</option>
                    <option value="int">Número entero</option>
                    <option value="fecha">Fecha</option>
                    <option value="select">Selección</option>
                    <option value="firma">Firma</option>
                    <option value="imagen">Imagen</option>
                  </select>
                  <label className="rol-checkbox">
                    <input type="checkbox" checked={campo.obligatorio} onChange={(e) => actualizarCampoFormulario(idx, { obligatorio: e.target.checked })} />
                    Obligatorio
                  </label>
                  {campo.tipo === 'select' && (
                    <>
                      <label className="rol-checkbox">
                        <input
                          type="checkbox"
                          checked={!!campo.multiple}
                          onChange={(e) => actualizarCampoFormulario(idx, { multiple: e.target.checked })}
                        />
                        Permitir selección múltiple
                      </label>
                      <select
                        value={campo.origenOpciones || 'manual'}
                        onChange={(e) =>
                          actualizarCampoFormulario(idx, {
                            origenOpciones: e.target.value,
                            opciones: e.target.value === 'manual' ? campo.opciones : '',
                          })
                        }
                      >
                        <option value="manual">Opciones manuales</option>
                        <option value="inventario">Desde inventario (vehiculos/equipos)</option>
                      </select>
                      {(campo.origenOpciones || 'manual') === 'inventario' && (
                        <>
                          <select
                            value={campo.catalogoInventario || 'HERRAMIENTAS'}
                            onChange={(e) =>
                              actualizarCampoFormulario(idx, {
                                catalogoInventario: e.target.value,
                                endpointOpciones: e.target.value === 'PLANTAS' ? '/plantas' : '/inventario',
                                inventarioIds: [],
                              })
                            }
                          >
                            <option value="PLANTAS">Inventario: PLANTAS</option>
                            <option value="HERRAMIENTAS">Inventario: HERRAMIENTAS</option>
                          </select>
                          <input
                            placeholder="Endpoint catálogo (ej: /inventario, /plantas, /mi-catalogo)"
                            value={campo.endpointOpciones || ''}
                            onChange={(e) => actualizarCampoFormulario(idx, { endpointOpciones: e.target.value })}
                          />
                          <select
                            value={campo.campoEtiquetaInventario || 'nombre'}
                            onChange={(e) => actualizarCampoFormulario(idx, { campoEtiquetaInventario: e.target.value })}
                          >
                            <option value="nombre">Mostrar: Nombre</option>
                            <option value="serial">Mostrar: Serial</option>
                            <option value="responsable">Mostrar: Responsable</option>
                            <option value="ubicacion">Mostrar: Ubicación</option>
                            <option value="estado">Mostrar: Estado</option>
                            <option value="id">Mostrar: ID</option>
                          </select>
                          <select
                            value={campo.campoValorInventario || 'id'}
                            onChange={(e) => actualizarCampoFormulario(idx, { campoValorInventario: e.target.value })}
                          >
                            <option value="id">Guardar valor: ID</option>
                            <option value="serial">Guardar valor: Serial</option>
                            <option value="nombre">Guardar valor: Nombre</option>
                          </select>
                          <small className="texto-ayuda-tecnico">
                            Se mostrarán automáticamente todos los registros del catálogo seleccionado.
                          </small>
                        </>
                      )}
                      {(campo.origenOpciones || 'manual') === 'manual' && (
                        <input
                          placeholder="Opciones separadas por coma"
                          value={campo.opciones}
                          onChange={(e) => actualizarCampoFormulario(idx, { opciones: e.target.value })}
                        />
                      )}
                    </>
                  )}
                  <button type="button" onClick={() => eliminarCampoFormulario(idx)}>Eliminar campo</button>
                </div>
              ))}
              <button type="button" onClick={agregarCampoFormulario}>Agregar campo</button>
            </div>
          )}

          {vistaFormulariosAdmin === 'ver' && (
            <div className="tarjeta-formulario">
              <h3>Formularios creados</h3>
              <TablaSimple
                columnas={['Id', 'Nombre', 'Acciones']}
                filas={formularios.map((f) => [
                  f.id,
                  f.nombre,
                  `Abrir / Editar`,
                ])}
              />
              <div className="roles-grid">
                {formularios.map((f) => (
                  <div key={f.id} className="rol-checkbox">
                    <strong>{f.nombre}</strong>
                    <button type="button" onClick={() => abrirFormulario(f.id)}>Abrir</button>
                    {esAdmin && <button type="button" onClick={() => cargarFormularioParaEditar(f)}>Editar</button>}
                    {esAdmin && <button type="button" className="btn-peligro" onClick={() => eliminarFormulario(f.id)}>Eliminar</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {vistaFormulariosAdmin === 'ver' && formularios
            .filter((f) => String(f.id) === String(formularioAbiertoId))
            .map((f) => {
              let esquema
              try {
                esquema = JSON.parse(f.esquemaJson || '{}')
              } catch {
                esquema = { error: 'JSON no válido' }
              }
              const campos = Array.isArray(esquema.campos) ? esquema.campos : []
              return (
                <div key={`abierto-${f.id}`} className="tarjeta-formulario">
                  <h3>Campos de: {f.nombre}</h3>
                  {campos.length === 0 && <small>Sin campos definidos en el esquema.</small>}
                  {campos.length > 0 && (
                    <TablaSimple
                      columnas={['Nombre', 'Etiqueta', 'Tipo', 'Obligatorio', 'Múltiple', 'Origen opciones', 'Configuración select']}
                      filas={campos.map((c) => [
                        c.nombre,
                        c.etiqueta,
                        c.tipo,
                        c.obligatorio ? 'Sí' : 'No',
                        c.tipo === 'select' ? (c.multiple ? 'Sí' : 'No') : '-',
                        c.tipo === 'select' ? (c.origenOpciones === 'inventario' ? 'Inventario' : 'Manual') : '-',
                        c.tipo !== 'select'
                          ? '-'
                          : c.origenOpciones === 'inventario'
                            ? `Endpoint: ${normalizarEndpointCatalogo(c.endpointOpciones || '')} | Mostrar: ${c.campoEtiquetaInventario || 'nombre'} | Guardar: ${c.campoValorInventario || 'id'} | Registros: todos`
                            : (Array.isArray(c.opciones) ? c.opciones.join(', ') : '-'),
                      ])}
                    />
                  )}
                </div>
              )
            })}
        </section>
      )
    }

    if (moduloActivo === 'usuarios') {
      // modulo usuarios (solo admin)
      return (
        <section>
          {!esAdmin && <p>Solo un usuario ADMINISTRADOR puede administrar usuarios.</p>}
          {esAdmin && (
            <>
              <div className="tabs-dashboard-admin">
                <button
                  type="button"
                  className={vistaUsuariosAdmin === 'ver' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                  onClick={() => setVistaUsuariosAdmin('ver')}
                >
                  👥 Ver usuarios <span className="badge-tab">{usuarios.length}</span>
                </button>
                <button
                  type="button"
                  className={vistaUsuariosAdmin === 'crear' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                  onClick={() => setVistaUsuariosAdmin('crear')}
                >
                  ➕ Crear usuarios
                </button>
              </div>
              {vistaUsuariosAdmin === 'ver' && (
                <div className="tarjeta-formulario">
                  <div className="panel-seccion-header">
                    <h3>Ver usuarios</h3>
                    <span>{usuarios.length} registrados</span>
                  </div>
                  <TablaSimple
                    columnas={['Id', 'Nombre', 'Correo', 'Roles']}
                    filas={usuarios.map((u) => [u.id, u.nombreCompleto, u.correo, (u.roles || []).map((r) => r.nombre).join(', ')])}
                  />
                  <h4 className="titulo-seccion">Editar / eliminar usuarios</h4>
                  <div className="lista-usuarios-admin">
                    {usuarios
                      .filter((u) => u.correo !== 'admin@susequid.com')
                      .map((u) => (
                        <article key={u.id} className="item-usuario-admin">
                          <div>
                            <strong>{u.nombreCompleto}</strong>
                            <small>{u.correo}</small>
                          </div>
                          <div className="acciones-usuario-admin">
                            <button type="button" className="btn-secundario" onClick={() => actualizarRolUsuario(u.id, 'TECNICO')}>
                              Asignar TECNICO
                            </button>
                            <button type="button" className="btn-secundario" onClick={() => actualizarRolUsuario(u.id, 'SUPERVISOR')}>
                              Asignar SUPERVISOR
                            </button>
                            <button type="button" className="btn-peligro" onClick={() => eliminarUsuario(u.id)}>Eliminar</button>
                          </div>
                        </article>
                      ))}
                  </div>
                </div>
              )}
              {vistaUsuariosAdmin === 'crear' && (
                <div className="tarjeta-formulario">
                  <div className="panel-seccion-header">
                    <h3>Crear usuarios</h3>
                    <span>Solo técnico o supervisor</span>
                  </div>
                  <form className="formulario" onSubmit={guardarUsuario}>
                    <input
                      placeholder="Nombre completo"
                      value={nuevoUsuario.nombreCompleto}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombreCompleto: e.target.value })}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Correo"
                      value={nuevoUsuario.correo}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Clave"
                      value={nuevoUsuario.clave}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, clave: e.target.value })}
                      required
                    />
                    <div className="roles-grid">
                      <label className="rol-checkbox">
                        <input
                          type="radio"
                          name="rolUsuario"
                          checked={nuevoUsuario.rol === 'TECNICO'}
                          onChange={() => setNuevoUsuario({ ...nuevoUsuario, rol: 'TECNICO' })}
                        />
                        TECNICO
                      </label>
                      <label className="rol-checkbox">
                        <input
                          type="radio"
                          name="rolUsuario"
                          checked={nuevoUsuario.rol === 'SUPERVISOR'}
                          onChange={() => setNuevoUsuario({ ...nuevoUsuario, rol: 'SUPERVISOR' })}
                        />
                        SUPERVISOR
                      </label>
                    </div>
                    <button type="submit">Crear usuario</button>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      )
    }

    return (
      <p>Selecciona un módulo del menú.</p>
    )
  }

  if (!token) {
    return (
      <div className="contenedor-login">
        <form className="tarjeta-login" onSubmit={login}>
          <h1>ERP Susequid</h1>
          <p>Inicia sesión para acceder a los módulos</p>
          <input type="email" placeholder="Correo" value={correoLogin} onChange={(e) => setCorreoLogin(e.target.value)} required />
          <input type="password" placeholder="Clave" value={claveLogin} onChange={(e) => setClaveLogin(e.target.value)} required />
          <button type="submit">Entrar</button>
          {mensajeError && <small className="texto-error">{mensajeError}</small>}
        </form>
      </div>
    )
  }

  return (
    <div className={`contenedor-app ${temaOscuro ? 'tema-oscuro' : ''}`}>
      {menuMovilAbierto && <div className="overlay-menu-movil" onClick={() => setMenuMovilAbierto(false)} />}
      <aside className={`sidebar ${menuMovilAbierto ? 'abierto' : ''}`}>
        <div className="sidebar-encabezado">
          <h2>ERP Susequid</h2>
          <small>Panel principal</small>
        </div>

        <nav className="sidebar-menu">
          <button
            className={moduloActivo === 'dashboard' ? 'sidebar-btn activo' : 'sidebar-btn'}
            onClick={() => irAModulo('dashboard')}
          >
            🧭 Dashboard
          </button>
          {!esTecnico && (
            <button
              className={moduloActivo === 'inventario' ? 'sidebar-btn activo' : 'sidebar-btn'}
              onClick={() => irAModulo('inventario')}
            >
              🏭 Inventario
            </button>
          )}
          {!esTecnico && (
            <button
              className={moduloActivo === 'formularios' ? 'sidebar-btn activo' : 'sidebar-btn'}
              onClick={() => irAModulo('formularios')}
            >
              📋 Formularios
            </button>
          )}
          {esAdmin && (
            <button
              className={moduloActivo === 'flujos' ? 'sidebar-btn activo' : 'sidebar-btn'}
              onClick={() => irAModulo('flujos')}
            >
              🔁 Flujos
            </button>
          )}
          {esAdmin && (
            <button
              className={moduloActivo === 'usuarios' ? 'sidebar-btn activo' : 'sidebar-btn'}
              onClick={() => irAModulo('usuarios')}
            >
              👥 Usuarios
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-btn sidebar-btn-salir" onClick={cerrarSesion}>⏻ Cerrar sesión</button>
        </div>
      </aside>
      <main className="contenido">
        <header className="navbar">
          <div className="navbar-izquierda">
            <button
              type="button"
              className="btn-menu-movil"
              onClick={() => setMenuMovilAbierto((prev) => !prev)}
            >
              ☰
            </button>
            <h1>Sistema ERP de Mantenimiento</h1>
          </div>
          <div className="acciones-navbar">
            <span>Área activa: {moduloActivo} | Roles: {rolesUsuario.join(', ') || 'N/A'}</span>
            <button type="button" className="btn-tema" onClick={alternarTema}>
              {temaOscuro ? '☀️ Modo claro' : '🌙 Modo oscuro'}
            </button>
          </div>
        </header>
        {mensajeError && <small className="texto-error">{mensajeError}</small>}
        {renderContenido()}
      </main>
    </div>
  )
}

function TablaSimple({ columnas, filas }) {
  return (
    <div className="tabla-wrapper">
      <table>
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th key={columna}>{columna}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i}>
              {fila.map((valor, j) => (
                <td key={`${i}-${j}`}>{valor || '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PanelFirma({ value, onChange }) {
  const canvasRef = useRef(null)
  const dibujandoRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#111827'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (!value) return
    const img = new Image()
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    img.src = value
  }, [value])

  const obtenerPos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clienteX = e.touches?.[0]?.clientX ?? e.clientX
    const clienteY = e.touches?.[0]?.clientY ?? e.clientY
    return { x: clienteX - rect.left, y: clienteY - rect.top }
  }

  const iniciar = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { x, y } = obtenerPos(e)
    dibujandoRef.current = true
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const mover = (e) => {
    if (!dibujandoRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { x, y } = obtenerPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const terminar = (e) => {
    if (!dibujandoRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    dibujandoRef.current = false
    ctx.closePath()
    onChange(canvas.toDataURL('image/png'))
  }

  const limpiar = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    onChange('')
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', touchAction: 'none' }}
        onMouseDown={iniciar}
        onMouseMove={mover}
        onMouseUp={terminar}
        onMouseLeave={terminar}
        onTouchStart={iniciar}
        onTouchMove={mover}
        onTouchEnd={terminar}
      />
      <button type="button" className="btn-secundario" style={{ marginTop: '0.5rem' }} onClick={limpiar}>
        Limpiar firma
      </button>
    </div>
  )
}

function formatearJsonCorto(texto) {
  if (!texto) return '-'
  try {
    const obj = JSON.parse(texto)
    const serializado = JSON.stringify(obj)
    return serializado.length > 120 ? `${serializado.slice(0, 117)}...` : serializado
  } catch {
    return texto.length > 120 ? `${texto.slice(0, 117)}...` : texto
  }
}

function formatearFecha(valor) {
  if (!valor) return '-'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return String(valor)
  return fecha.toLocaleString('es-CO')
}

function construirFilasInforme(respuestaJson) {
  if (!respuestaJson) return [['Sin datos', '-']]
  try {
    const obj = JSON.parse(respuestaJson)
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return [['Respuesta', JSON.stringify(obj)]]
    }
    return Object.entries(obj).map(([campo, valor]) => [
      campo,
      valor === null || valor === undefined
        ? '-'
        : typeof valor === 'object'
          ? JSON.stringify(valor)
          : String(valor),
    ])
  } catch {
    return [['Respuesta', respuestaJson]]
  }
}

function renderEstadoTarea(estado) {
  const clase = `chip-estado chip-${String(estado || '').toLowerCase()}`
  return <span className={clase}>{estado || '-'}</span>
}

export default App
