import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:8080/api'

const COLUMNAS_INVENTARIO_RESERVADAS = new Set(['nombre', 'serial', 'responsable', 'estado', 'ubicacion'])
const REGEX_NOMBRE_COLUMNA_PERSONALIZADA_INV = /^[\p{L}0-9 .,_\-]+$/u

function esColumnaInventarioEstandar(k) {
  return COLUMNAS_INVENTARIO_RESERVADAS.has(String(k).toLowerCase())
}

function nombreColumnaPersonalizadaInventarioValido(t) {
  const s = String(t).trim()
  if (s.length < 1 || s.length > 80) return false
  if (COLUMNAS_INVENTARIO_RESERVADAS.has(s.toLowerCase())) return false
  return REGEX_NOMBRE_COLUMNA_PERSONALIZADA_INV.test(s)
}

function parseColumnasCatalogoInventario(cat) {
  if (!cat?.columnasJson) return ['nombre', 'serial', 'responsable', 'estado', 'ubicacion']
  try {
    const arr = JSON.parse(cat.columnasJson)
    if (Array.isArray(arr) && arr.length) return arr
  } catch {
    // ignore
  }
  return ['nombre', 'serial', 'responsable', 'estado', 'ubicacion']
}

function nuevaFilaColumnaPersonalizadaInventario() {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `col-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return { id, nombre: '' }
}

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
  /** menu | ver | crear */
  const [vistaInventario, setVistaInventario] = useState('menu')
  /** preset:plantas | preset:herramientas | catalog:ID */
  const [inventarioVerSeleccion, setInventarioVerSeleccion] = useState('')
  const [plantas, setPlantas] = useState([])
  const [inventario, setInventario] = useState([])
  const [catalogosInventarioLista, setCatalogosInventarioLista] = useState([])
  const [catalogoActivoId, setCatalogoActivoId] = useState('')
  const [itemsCatalogoActivo, setItemsCatalogoActivo] = useState([])
  const [nuevoInventarioNombre, setNuevoInventarioNombre] = useState('')
  const [columnasNuevoInventario, setColumnasNuevoInventario] = useState({
    serial: true,
    responsable: true,
    ubicacion: true,
    estado: true,
  })
  const [columnasPersonalizadasNuevoInventario, setColumnasPersonalizadasNuevoInventario] = useState([])
  const [modalBorrarCatalogoInventario, setModalBorrarCatalogoInventario] = useState({
    abierto: false,
    catalogoId: null,
    clave: '',
    error: '',
  })
  const [nuevoItemCatalogo, setNuevoItemCatalogo] = useState({
    nombre: '',
    serial: '',
    responsable: '',
    ubicacion: '',
    estado: 'ACTIVO',
    datosExtra: {},
  })
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
      catalogoPersonalizadoId: '',
      campoEtiquetaInventario: 'nombre',
      campoValorInventario: 'id',
    },
  ])
  const [usuarios, setUsuarios] = useState([])
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombreCompleto: '',
    correo: '',
    clave: '',
    rol: 'COMERCIAL',
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
  const esAdmin = rolesUsuario.includes('ADMINISTRADOR')
  const esTecnico = rolesUsuario.includes('TECNICO')
  const esSupervisor = rolesUsuario.includes('SUPERVISOR')
  const esComercial = rolesUsuario.includes('COMERCIAL')
  const esBodega = rolesUsuario.includes('BODEGA')
  const esCompras = rolesUsuario.includes('COMPRAS')
  const esOperadorFlujo = esTecnico || esSupervisor || esComercial || esBodega || esCompras

  const resumen = useMemo(
    () => [
      { titulo: 'Flujos', valor: tareasCampo.filter((t) => !!t.esPlantillaFlujo).length },
      { titulo: 'Formularios dinámicos', valor: formularios.length },
    ],
    [tareasCampo, formularios.length]
  )

  useEffect(() => {
    if (token) {
      cargarDatos()
    }
  }, [token])

  useEffect(() => {
    if (!token) return undefined
    const timer = setInterval(async () => {
      await cargarDatos()
      if (moduloActivo === 'flujos') {
        await refrescarPanelFlujosUsuario()
        if (esAdmin) {
          await cargarPlantillasAdminFlujo()
        }
      }
    }, 10000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, moduloActivo, esAdmin])

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

  /** Resuelve el endpoint API para campos select con origen inventario (plantas, herramientas o catálogo personalizado). */
  const resolverEndpointInventarioCampo = (campo) => {
    const raw = campo?.endpointOpciones
    if (raw && String(raw).trim()) {
      return normalizarEndpointCatalogo(raw)
    }
    const cat = campo?.catalogoInventario || 'HERRAMIENTAS'
    if (cat === 'PLANTAS') return '/plantas'
    if (cat === 'HERRAMIENTAS') return '/inventario'
    if (cat === 'PERSONALIZADO' && campo?.catalogoPersonalizadoId) {
      return `/inventarios/catalogos/${campo.catalogoPersonalizadoId}/items`
    }
    return '/inventario'
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
    setCatalogosInventarioLista([])
    setCatalogoActivoId('')
    setItemsCatalogoActivo([])
    setVistaInventario('menu')
    setInventarioVerSeleccion('')
    setNuevoInventarioNombre('')
    setColumnasNuevoInventario({ serial: true, responsable: true, ubicacion: true, estado: true })
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
    if (modulo === 'inventario') {
      setVistaInventario('menu')
      setInventarioVerSeleccion('')
      setCatalogoActivoId('')
      setItemsCatalogoActivo([])
    }
  }

  const cargarDatos = async () => {
    try {
      const [resPlantas, resInventario, resFormularios, resCatalogosInv] = await Promise.all([
        fetch(`${API_URL}/plantas`, { headers: cabeceras() }),
        fetch(`${API_URL}/inventario`, { headers: cabeceras() }),
        fetch(`${API_URL}/formularios`, { headers: cabeceras() }),
        fetch(`${API_URL}/inventarios/catalogos`, { headers: cabeceras() }),
      ])
      if ([resPlantas, resInventario, resFormularios, resCatalogosInv].some((r) => r.status === 401)) {
        cerrarSesion()
        setMensajeError('Sesión expirada, inicia sesión de nuevo')
        return
      }
      const rawP = await resPlantas.json()
      const rawI = await resInventario.json()
      const rawF = await resFormularios.json()
      setPlantas(Array.isArray(rawP) ? rawP : [])
      setInventario(Array.isArray(rawI) ? rawI : [])
      if (resCatalogosInv.ok) {
        try {
          const rawCat = await resCatalogosInv.json()
          setCatalogosInventarioLista(Array.isArray(rawCat) ? rawCat : [])
        } catch {
          setCatalogosInventarioLista([])
        }
      } else {
        setCatalogosInventarioLista([])
      }
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
    setMensajeError('')
    try {
      const r = await fetch(`${API_URL}/plantas`, {
        method: 'POST',
        headers: cabeceras(),
        body: JSON.stringify(nuevaPlanta),
      })
      if (!r.ok) {
        let detalle = ''
        try {
          const j = await r.json()
          detalle = j.message || j.mensaje || j.error || JSON.stringify(j)
        } catch {
          try {
            detalle = await r.text()
          } catch {
            detalle = ''
          }
        }
        setMensajeError(`No se pudo guardar la planta (${r.status}) ${detalle}`.trim())
        return
      }
      setNuevaPlanta({ nombre: '', serial: '', ubicacion: '', estado: 'ACTIVO' })
      await cargarDatos()
    } catch {
      setMensajeError('No se pudo conectar con el servidor al guardar la planta')
    }
  }

  const guardarEquipo = async (e) => {
    e.preventDefault()
    setMensajeError('')
    try {
      const r = await fetch(`${API_URL}/inventario`, {
        method: 'POST',
        headers: cabeceras(),
        body: JSON.stringify(nuevoEquipo),
      })
      if (!r.ok) {
        let detalle = ''
        try {
          const j = await r.json()
          detalle = j.message || j.mensaje || j.error || JSON.stringify(j)
        } catch {
          try {
            detalle = await r.text()
          } catch {
            detalle = ''
          }
        }
        setMensajeError(`No se pudo guardar el equipo (${r.status}) ${detalle}`.trim())
        return
      }
      setNuevoEquipo({ nombre: '', serial: '', responsable: '', estado: 'ACTIVO', ubicacion: '' })
      await cargarDatos()
    } catch {
      setMensajeError('No se pudo conectar con el servidor al guardar el equipo')
    }
  }

  const invalidarCacheEndpointCatalogo = (endpointRelativo) => {
    const ep = normalizarEndpointCatalogo(endpointRelativo).toLowerCase()
    setCatalogosPorEndpoint((prev) => {
      const next = { ...prev }
      delete next[ep]
      return next
    })
  }

  const construirColumnasNuevoInventario = () => {
    const columnas = ['nombre']
    if (columnasNuevoInventario.serial) columnas.push('serial')
    if (columnasNuevoInventario.responsable) columnas.push('responsable')
    if (columnasNuevoInventario.ubicacion) columnas.push('ubicacion')
    if (columnasNuevoInventario.estado) columnas.push('estado')
    const vistos = new Set(columnas.map((c) => c.toLowerCase()))
    for (const row of columnasPersonalizadasNuevoInventario) {
      const t = row.nombre.trim()
      if (!t) continue
      const low = t.toLowerCase()
      if (vistos.has(low)) continue
      if (!nombreColumnaPersonalizadaInventarioValido(t)) continue
      vistos.add(low)
      columnas.push(t)
    }
    return columnas
  }

  const crearCatalogoInventarioAdmin = async (e) => {
    e.preventDefault()
    setMensajeError('')
    const nombre = nuevoInventarioNombre.trim()
    if (!nombre) return
    for (const row of columnasPersonalizadasNuevoInventario) {
      const t = row.nombre.trim()
      if (!t) continue
      if (!nombreColumnaPersonalizadaInventarioValido(t)) {
        setMensajeError(
          `Columna «${t}» no válida: usa letras, números, espacios y . , _ - (máx. 80). No uses nombres reservados (Nombre, Serial, Responsable, Ubicación, Estado).`,
        )
        return
      }
    }
    const columnas = construirColumnasNuevoInventario()
    try {
      const r = await fetch(`${API_URL}/inventarios/catalogos`, {
        method: 'POST',
        headers: cabeceras(),
        body: JSON.stringify({ nombre, columnas }),
      })
      if (!r.ok) {
        let detalle = ''
        try {
          const j = await r.json()
          detalle = j.mensaje || j.message || ''
        } catch {
          try {
            detalle = await r.text()
          } catch {
            detalle = ''
          }
        }
        setMensajeError(`No se pudo crear el inventario (${r.status}) ${detalle}`.trim())
        return
      }
      let creado = {}
      try {
        creado = await r.json()
      } catch {
        creado = {}
      }
      setNuevoInventarioNombre('')
      setColumnasNuevoInventario({ serial: true, responsable: true, ubicacion: true, estado: true })
      setColumnasPersonalizadasNuevoInventario([])
      await cargarDatos()
      if (creado?.id != null) {
        const sid = String(creado.id)
        setInventarioVerSeleccion(`catalog:${sid}`)
        setCatalogoActivoId(sid)
        setVistaInventario('ver')
        await cargarItemsCatalogoSeleccionado(sid)
      } else {
        setVistaInventario('ver')
      }
    } catch {
      setMensajeError('Error de conexión al crear el inventario')
    }
  }

  const abrirModalBorrarCatalogoInventario = (id) => {
    setModalBorrarCatalogoInventario({ abierto: true, catalogoId: id, clave: '', error: '' })
    setMensajeError('')
  }

  const cerrarModalBorrarCatalogoInventario = () => {
    setModalBorrarCatalogoInventario({ abierto: false, catalogoId: null, clave: '', error: '' })
  }

  const ejecutarBorradoCatalogoInventarioConfirmado = async () => {
    const id = modalBorrarCatalogoInventario.catalogoId
    const claveTrim = (modalBorrarCatalogoInventario.clave || '').trim()
    if (!id) return
    if (!claveTrim) {
      setModalBorrarCatalogoInventario((prev) => ({
        ...prev,
        error: 'Ingresa tu contraseña para confirmar la eliminación.',
      }))
      return
    }
    setModalBorrarCatalogoInventario((prev) => ({ ...prev, error: '' }))
    try {
      const intentarEliminar = (forzar) => {
        const q = forzar ? '?forzar=true' : ''
        return fetch(`${API_URL}/inventarios/catalogos/${id}/eliminar${q}`, {
          method: 'POST',
          headers: cabeceras(),
          body: JSON.stringify({ claveConfirmacion: claveTrim }),
        })
      }
      let r = await intentarEliminar(false)
      if (r.status === 400) {
        let msg = ''
        try {
          const j = await r.json()
          msg = j.mensaje || ''
        } catch {
          try {
            msg = await r.text()
          } catch {
            msg = ''
          }
        }
        const pideForzar =
          typeof msg === 'string' &&
          msg.includes('ítems') &&
          (msg.includes('forzado') || msg.includes('Elimínalos'))
        if (pideForzar) {
          if (
            !window.confirm(
              `${msg}\n\n¿Forzar borrado eliminando también todos los ítems? Se requiere la misma contraseña ya ingresada.`,
            )
          ) {
            return
          }
          r = await intentarEliminar(true)
        } else {
          setModalBorrarCatalogoInventario((prev) => ({
            ...prev,
            error: msg.trim() || 'No se pudo eliminar el catálogo',
          }))
          return
        }
      }
      if (!r.ok) {
        let detalle = ''
        try {
          const j = await r.json()
          detalle = j.mensaje || ''
        } catch {
          detalle = await r.text()
        }
        setModalBorrarCatalogoInventario((prev) => ({
          ...prev,
          error: `No se pudo eliminar el catálogo (${r.status}) ${detalle}`.trim(),
        }))
        return
      }
      cerrarModalBorrarCatalogoInventario()
      if (String(catalogoActivoId) === String(id) || inventarioVerSeleccion === `catalog:${id}`) {
        setCatalogoActivoId('')
        setItemsCatalogoActivo([])
        setInventarioVerSeleccion('')
      }
      invalidarCacheEndpointCatalogo(`/inventarios/catalogos/${id}/items`)
      await cargarDatos()
    } catch {
      setModalBorrarCatalogoInventario((prev) => ({
        ...prev,
        error: 'Error de conexión al eliminar el catálogo',
      }))
    }
  }

  const cargarItemsCatalogoSeleccionado = async (catalogoId) => {
    if (!catalogoId) {
      setItemsCatalogoActivo([])
      return
    }
    try {
      const r = await fetch(`${API_URL}/inventarios/catalogos/${catalogoId}/items`, { headers: cabeceras() })
      if (!r.ok) {
        setItemsCatalogoActivo([])
        return
      }
      const raw = await r.json()
      setItemsCatalogoActivo(Array.isArray(raw) ? raw : [])
    } catch {
      setItemsCatalogoActivo([])
    }
  }

  const crearItemCatalogoAdmin = async (e) => {
    e.preventDefault()
    if (!catalogoActivoId) {
      setMensajeError('Selecciona un catálogo para agregar ítems')
      return
    }
    setMensajeError('')
    const catMeta = catalogosInventarioLista.find((c) => String(c.id) === String(catalogoActivoId))
    const colsCat = parseColumnasCatalogoInventario(catMeta)
    const datosExtra = {}
    for (const col of colsCat) {
      if (!esColumnaInventarioEstandar(col)) {
        datosExtra[col] = (nuevoItemCatalogo.datosExtra && nuevoItemCatalogo.datosExtra[col]) || ''
      }
    }
    const cuerpo = {
      nombre: nuevoItemCatalogo.nombre,
      serial: nuevoItemCatalogo.serial,
      responsable: nuevoItemCatalogo.responsable,
      ubicacion: nuevoItemCatalogo.ubicacion,
      estado: nuevoItemCatalogo.estado,
    }
    if (Object.keys(datosExtra).length > 0) {
      cuerpo.datosExtra = datosExtra
    }
    try {
      const r = await fetch(`${API_URL}/inventarios/catalogos/${catalogoActivoId}/items`, {
        method: 'POST',
        headers: cabeceras(),
        body: JSON.stringify(cuerpo),
      })
      if (!r.ok) {
        let detalle = ''
        try {
          const j = await r.json()
          detalle = j.mensaje || j.message || ''
        } catch {
          detalle = await r.text()
        }
        setMensajeError(`No se pudo crear el ítem (${r.status}) ${detalle}`.trim())
        return
      }
      setNuevoItemCatalogo({ nombre: '', serial: '', responsable: '', ubicacion: '', estado: 'ACTIVO', datosExtra: {} })
      invalidarCacheEndpointCatalogo(`/inventarios/catalogos/${catalogoActivoId}/items`)
      await cargarItemsCatalogoSeleccionado(catalogoActivoId)
      await cargarDatos()
    } catch {
      setMensajeError('Error de conexión al crear el ítem')
    }
  }

  const eliminarItemCatalogoAdmin = async (itemId) => {
    if (!window.confirm('¿Eliminar este ítem del catálogo?')) return
    setMensajeError('')
    try {
      const r = await fetch(`${API_URL}/inventarios/catalogos/items/${itemId}`, { method: 'DELETE', headers: cabeceras() })
      if (!r.ok) {
        let detalle = ''
        try {
          const j = await r.json()
          detalle = j.mensaje || ''
        } catch {
          detalle = await r.text()
        }
        setMensajeError(`No se pudo eliminar el ítem (${r.status}) ${detalle}`.trim())
        return
      }
      if (catalogoActivoId) {
        invalidarCacheEndpointCatalogo(`/inventarios/catalogos/${catalogoActivoId}/items`)
        await cargarItemsCatalogoSeleccionado(catalogoActivoId)
      }
      await cargarDatos()
    } catch {
      setMensajeError('Error de conexión al eliminar el ítem')
    }
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
        catalogoPersonalizadoId:
          c.tipo === 'select' && (c.origenOpciones || 'manual') === 'inventario' && c.catalogoPersonalizadoId
            ? String(c.catalogoPersonalizadoId)
            : undefined,
        endpointOpciones:
          c.tipo === 'select' && (c.origenOpciones || 'manual') === 'inventario'
            ? resolverEndpointInventarioCampo(c)
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
      catalogoPersonalizadoId: '',
      campoEtiquetaInventario: 'nombre',
      campoValorInventario: 'id',
    }])
    setFormularioEdicionId('')
    cargarDatos()
  }

  const refrescarPanelFlujosUsuario = useCallback(async () => {
    if (!token || (!esOperadorFlujo && !esAdmin)) return
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
  }, [token, esOperadorFlujo, esAdmin, vistaSeccionFlujo, rolesUsuario])

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
      setNuevoUsuario({ nombreCompleto: '', correo: '', clave: '', rol: 'COMERCIAL' })
      cargarDatos()
    } catch (error) {
      setMensajeError(error.message)
    }
  }

  const actualizarRolUsuario = async (usuarioId, rol) => {
    const confirmado = window.confirm(`¿Confirmas asignar el rol ${rol} a este usuario?`)
    if (!confirmado) return
    const resp = await fetch(`${API_URL}/usuarios/${usuarioId}/rol/${encodeURIComponent(rol)}`, {
      method: 'PUT',
      headers: cabeceras(),
    })
    if (!resp.ok) {
      let detalle = ''
      try {
        const json = await resp.json()
        detalle = json?.mensaje || json?.error || ''
      } catch {
        try {
          detalle = await resp.text()
        } catch {
          detalle = ''
        }
      }
      setMensajeError(`No se pudo actualizar rol (${resp.status})${detalle ? `: ${detalle}` : ''}`)
      return
    }
    cargarDatos()
  }

  const eliminarUsuario = async (usuarioId) => {
    const confirmado = window.confirm('¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.')
    if (!confirmado) return
    const resp = await fetch(`${API_URL}/usuarios/${usuarioId}`, {
      method: 'DELETE',
      headers: cabeceras(),
    })
    if (!resp.ok) {
      let detalle = ''
      try {
        const json = await resp.json()
        detalle = json?.mensaje || json?.error || ''
      } catch {
        try {
          detalle = await resp.text()
        } catch {
          detalle = ''
        }
      }
      setMensajeError(`No se pudo eliminar usuario (${resp.status})${detalle ? `: ${detalle}` : ''}`)
      return
    }
    cargarDatos()
  }

  const eliminarFormulario = async (formularioId) => {
    if (!window.confirm('¿Eliminar este formulario?')) return
    let resp = await fetch(`${API_URL}/formularios/${formularioId}`, {
      method: 'DELETE',
      headers: cabeceras(),
    })
    if (!resp.ok) {
      let detalle = ''
      try {
        const json = await resp.json()
        detalle = json?.mensaje || json?.error || JSON.stringify(json)
      } catch {
        try {
          detalle = await resp.text()
        } catch {
          detalle = ''
        }
      }
      if (resp.status === 400) {
        if (window.confirm(`No se pudo eliminar en modo normal. ${detalle}\n\n¿Deseas forzar borrado y eliminar también referencias (tareas/pasos/respuestas)?`)) {
          resp = await fetch(`${API_URL}/formularios/${formularioId}?forzar=true`, {
            method: 'DELETE',
            headers: cabeceras(),
          })
          if (!resp.ok) {
            let detalle2 = ''
            try {
              const json2 = await resp.json()
              detalle2 = json2?.mensaje || json2?.error || JSON.stringify(json2)
            } catch {
              try {
                detalle2 = await resp.text()
              } catch {
                detalle2 = ''
              }
            }
            setMensajeError(`No se pudo eliminar formulario (${resp.status}) ${detalle2}`.trim())
            return
          }
        } else {
          setMensajeError(`No se pudo eliminar formulario (${resp.status}) ${detalle}`.trim())
          return
        }
      } else {
        setMensajeError(`No se pudo eliminar formulario (${resp.status}) ${detalle}`.trim())
        return
      }
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
    setMensajeError('')
    const r = await fetch(`${API_URL}/plantas/${id}`, { method: 'DELETE', headers: cabeceras() })
    if (!r.ok) {
      let detalle = ''
      try {
        const j = await r.json()
        detalle = j.message || j.mensaje || j.error || ''
      } catch {
        try {
          detalle = await r.text()
        } catch {
          detalle = ''
        }
      }
      setMensajeError(`No se pudo eliminar planta (${r.status}) ${detalle}`.trim())
      return
    }
    await cargarDatos()
  }

  const eliminarEquipo = async (id) => {
    if (!window.confirm('¿Eliminar registro de herramienta/equipo?')) return
    setMensajeError('')
    const r = await fetch(`${API_URL}/inventario/${id}`, { method: 'DELETE', headers: cabeceras() })
    if (!r.ok) {
      let detalle = ''
      try {
        const j = await r.json()
        detalle = j.message || j.mensaje || j.error || ''
      } catch {
        try {
          detalle = await r.text()
        } catch {
          detalle = ''
        }
      }
      setMensajeError(`No se pudo eliminar el registro (${r.status}) ${detalle}`.trim())
      return
    }
    await cargarDatos()
  }

  const eliminarTareaPendiente = async (tareaId) => {
    if (!window.confirm('¿Eliminar esta tarea pendiente? Esta acción no se puede deshacer.')) return
    let r = await fetch(`${API_URL}/campo/tareas/${tareaId}`, {
      method: 'DELETE',
      headers: cabeceras(),
    })
    if (r.status === 405) {
      r = await fetch(`${API_URL}/campo/tareas/${tareaId}/eliminar`, {
        method: 'POST',
        headers: cabeceras(),
      })
    }
    if (!r.ok) {
      let detalle = ''
      try {
        const json = await r.json()
        detalle = json?.mensaje || json?.error || JSON.stringify(json)
      } catch {
        try {
          detalle = await r.text()
        } catch {
          detalle = ''
        }
      }
      setMensajeError(`No se pudo eliminar tarea (${r.status}) ${detalle}`.trim())
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
        catalogoPersonalizadoId: '',
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
    setVistaFormulariosAdmin('crear')
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
        ? campos.map((c) => {
            const ep = c.endpointOpciones || ''
            const m = /\/inventarios\/catalogos\/(\d+)\/items/i.exec(String(ep))
            const esPersonalizado = c.catalogoInventario === 'PERSONALIZADO' || !!m
            const idCustom = c.catalogoPersonalizadoId || (m ? m[1] : '')
            return {
              nombre: c.nombre || '',
              etiqueta: c.etiqueta || '',
              tipo: c.tipo || 'string',
              obligatorio: !!c.obligatorio,
              opciones: Array.isArray(c.opciones) ? c.opciones.join(', ') : '',
              origenOpciones: c.origenOpciones || 'manual',
              multiple: !!c.multiple,
              catalogoInventario: esPersonalizado ? 'PERSONALIZADO' : (c.catalogoInventario || 'HERRAMIENTAS'),
              endpointOpciones:
                esPersonalizado && idCustom
                  ? `/inventarios/catalogos/${idCustom}/items`
                  : (c.endpointOpciones || ((c.catalogoInventario || 'HERRAMIENTAS') === 'PLANTAS' ? '/plantas' : '/inventario')),
              inventarioIds: Array.isArray(c.inventarioIds) ? c.inventarioIds.map((id) => String(id)) : [],
              catalogoPersonalizadoId: idCustom ? String(idCustom) : '',
              campoEtiquetaInventario: c.campoEtiquetaInventario || 'nombre',
              campoValorInventario: c.campoValorInventario || 'id',
            }
          })
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
          catalogoPersonalizadoId: '',
          campoEtiquetaInventario: 'nombre',
          campoValorInventario: 'id',
        }]
    )
  }

  const obtenerEndpointCampo = (campo) => resolverEndpointInventarioCampo(campo)

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
      let registrosCatalogo = obtenerRegistrosCatalogo(campo)
      const idsFiltrados = Array.isArray(campo.inventarioIds) ? campo.inventarioIds.map((x) => String(x)).filter(Boolean) : []
      if (idsFiltrados.length > 0) {
        const permitidos = new Set(idsFiltrados)
        registrosCatalogo = registrosCatalogo.filter((item) => item?.id != null && permitidos.has(String(item.id)))
      }
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

  const extraerProductosPedido = (tarea) => {
    const desc = String(tarea?.descripcion || '')
    const marcador = 'Productos:'
    const idx = desc.indexOf(marcador)
    if (idx < 0) return ''
    return desc.slice(idx + marcador.length).trim()
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

  const iniciarPedidoComercial = async () => {
    if (!esComercial && !esAdmin) {
      setMensajeError('Solo Comercial puede iniciar este flujo.')
      return
    }
    const productosTexto = window.prompt('Productos del pedido (separados por coma):', 'Producto A, Producto B')
    if (productosTexto === null) return
    const productos = String(productosTexto)
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (productos.length === 0) {
      setMensajeError('Debes ingresar al menos un producto para crear el pedido.')
      return
    }
    const titulo = window.prompt('Título del pedido (opcional):', 'Pedido comercial') || ''
    setMensajeError('')
    const r = await fetch(`${API_URL}/campo/flujos/pedidos`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify({ titulo, productos }),
    })
    let cuerpo = {}
    try {
      cuerpo = await r.json()
    } catch {
      cuerpo = {}
    }
    if (!r.ok) {
      setMensajeError(`No se pudo crear el pedido (${r.status}) ${cuerpo.mensaje || cuerpo.error || ''}`.trim())
      return
    }
    await refrescarPanelFlujosUsuario()
    await cargarDatos()
    setVistaPanelFlujo('mis')
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
      if (esOperadorFlujo) {
        return (
          <section className="panel-dashboard-tecnico panel-flujos-usuario">
            <div className="tabs-sub-tecnico">
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
            {vistaPanelFlujo === 'disponibles' && (
              <div className="grid-actividades-tecnico">
                {esComercial && (
                  <button
                    type="button"
                    className="tarjeta-actividad-tecnico"
                    onClick={() => iniciarPedidoComercial()}
                  >
                    <span className="tarjeta-actividad-titulo">Pedido comercial (flujo fijo)</span>
                    <span className="tarjeta-actividad-hint">Crear pedido e iniciar en Bodega</span>
                  </button>
                )}
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
              <div className="bloque-mis-actividades">
                {actividadesFlujoActivas.length === 0 && actividadesFlujoSeguimiento.length === 0 && (
                  <p>No tienes actividades en esta sección.</p>
                )}
                {actividadesFlujoActivas.length > 0 && (
                  <h4 className="titulo-seccion titulo-seccion--bloque">
                    En tu turno (puedes completar el paso)
                  </h4>
                )}
                {actividadesFlujoActivas.map((t) => {
                  const etapas = [...(etapasPorActividadFlujo[t.id] || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0))
                  const paso = etapas.find((e) => !e.completada)
                  const exp = String(actividadFlujoExpandidaId) === String(t.id)
                  const productos = extraerProductosPedido(t)
                  let campos = []
                  if (paso?.formulario?.esquemaJson) {
                    try {
                      campos = JSON.parse(paso.formulario.esquemaJson || '{}').campos || []
                    } catch {
                      campos = []
                    }
                  }
                  return (
                    <div key={t.id} className="tarjeta-formulario tarjeta-formulario--espaciada">
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
                      {productos && <small className="texto-ref-id">Productos del pedido: {productos}</small>}
                      {exp && paso && (
                        <>
                          <h4 className="subtitulo-paso-formulario">{paso.formulario?.nombre || 'Formulario'}</h4>
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
                          <button type="button" className="btn-completar-paso-flujo" onClick={() => enviarPasoFlujo(t.id, paso.id)}>
                            Completar paso y continuar
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
                {actividadesFlujoSeguimiento.length > 0 && (
                  <>
                    <h4 className="titulo-seccion titulo-seccion--separado">
                      Seguimiento (solo consulta; no es tu turno)
                    </h4>
                    {actividadesFlujoSeguimiento.map((t) => {
                      const etapas = [...(etapasPorActividadFlujo[t.id] || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0))
                      const pasoActual = etapas.find((e) => !e.completada)
                      const exp = String(actividadFlujoExpandidaId) === String(t.id)
                      const productos = extraerProductosPedido(t)
                      return (
                        <div key={`seg-${t.id}`} className="tarjeta-formulario tarjeta-formulario--seguimiento">
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
                          {productos && <small className="texto-ref-id">Productos del pedido: {productos}</small>}
                          {exp && (
                            <ul className="lista-etapas-flujo">
                              {etapas.map((e) => (
                                <li key={e.id}>
                                  {e.completada ? (
                                    <>
                                      <span className="etapa-marca etapa-marca--ok">✓</span> {e.nombre}
                                      {e.completadaPor?.nombreCompleto ? ` · ${e.completadaPor.nombreCompleto}` : ''}
                                    </>
                                  ) : (
                                    <>
                                      <span className="etapa-marca etapa-marca--pendiente">○</span> {e.nombre} · pendiente · responsable {e.rolResponsable}
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
              <div className="bloque-historial-actividades">
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
            <div className="tarjetas-grid tarjetas-kpi">
              {resumen.map((item) => (
                <article
                  key={item.titulo}
                  className="tarjeta tarjeta-kpi"
                  data-kpi={item.titulo === 'Flujos' ? 'flujos' : 'formularios'}
                >
                  <h3>{item.titulo}</h3>
                  <p className="tarjeta-kpi-valor">{item.valor}</p>
                </article>
              ))}
            </div>
            <div className="tabs-dashboard-admin">
              <button
                type="button"
                className={vistaDashboardAdmin === 'pendientes' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                onClick={() => setVistaDashboardAdmin('pendientes')}
              >
                <span className="tab-leading-dot tab-dot-amber" aria-hidden="true" />
                Registro de tareas pendientes <span className="badge-tab">{pendientesAdmin.length}</span>
              </button>
              <button
                type="button"
                className={vistaDashboardAdmin === 'finalizadas' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                onClick={() => setVistaDashboardAdmin('finalizadas')}
              >
                <span className="tab-leading-dot tab-dot-emerald" aria-hidden="true" />
                Registro de tareas finalizadas/canceladas <span className="badge-tab">{finalizadasAdmin.length}</span>
              </button>
            </div>

            {vistaDashboardAdmin === 'pendientes' && (
              <div className="panel-seccion">
                <div className="panel-seccion-header">
                  <h3>Registro de tareas pendientes</h3>
                  <span>{pendientesAdmin.length} tareas</span>
                </div>
                <TablaSimple
                  columnas={['Id', 'Tarea', 'Estado', 'Técnico', 'Formulario', 'Acciones']}
                  filas={pendientesAdmin.map((t) => [
                    t.id,
                    t.titulo,
                    renderEstadoTarea(t.estado),
                    t.asignadoA?.correo,
                    t.formulario?.nombre,
                    <button key={`del-tarea-${t.id}`} type="button" className="btn-peligro" onClick={() => eliminarTareaPendiente(t.id)}>Eliminar</button>,
                  ])}
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
        <div className="tarjetas-grid tarjetas-kpi">
          {resumen.map((item) => (
            <article
              key={item.titulo}
              className="tarjeta tarjeta-kpi"
              data-kpi={item.titulo === 'Flujos' ? 'flujos' : 'formularios'}
            >
              <h3>{item.titulo}</h3>
              <p className="tarjeta-kpi-valor">{item.valor}</p>
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
        <section className="modulo-flujos-admin">
          <div className="panel-seccion-header flujo-admin-cabecera">
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
            <div className="tarjeta-formulario flujo-formulario-nuevo">
              <div className="flujo-seccion-titulo">
                <h4>Nueva plantilla (borrador)</h4>
                <span className="flujo-seccion-sub">Define el flujo y los pasos antes de publicar.</span>
              </div>
              <form className="formulario flujo-form-grid" onSubmit={crearPlantillaFlujoSubmit}>
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
                  <div key={idx} className="formulario flujo-paso-bloque">
                    <strong className="flujo-paso-numero">Paso {idx + 1}</strong>
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
            <div className="tarjeta-formulario flujo-tabla-carta">
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
            <div className="tarjeta-formulario flujo-tabla-carta">
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
      const etiquetasColumnaInventario = {
        nombre: 'Nombre',
        serial: 'Serial',
        responsable: 'Responsable',
        estado: 'Estado',
        ubicacion: 'Ubicación',
      }
      const volverMenuInventario = () => {
        setVistaInventario('menu')
        setInventarioVerSeleccion('')
        setCatalogoActivoId('')
        setItemsCatalogoActivo([])
      }
      const idCatalogoVer = inventarioVerSeleccion.startsWith('catalog:') ? inventarioVerSeleccion.replace('catalog:', '') : ''
      const catalogoSeleccionadoMeta = catalogosInventarioLista.find((c) => String(c.id) === String(idCatalogoVer)) || null
      const colsInventarioCustom = parseColumnasCatalogoInventario(catalogoSeleccionadoMeta)

      return (
        <section className="modulo-inventario">
          {vistaInventario === 'menu' && (
            <div className="inventario-menu-inicio">
              <h2 className="inventario-menu-titulo">Inventario</h2>
              <p className="texto-ayuda-tecnico inventario-menu-sub">Elige qué deseas hacer.</p>
              <div className="inventario-menu-grid">
                <button type="button" className="inventario-menu-tarjeta" onClick={() => setVistaInventario('ver')}>
                  <span className="inventario-menu-tarjeta-titulo">Ver inventarios</span>
                  <span className="inventario-menu-tarjeta-texto">
                    Consulta plantas, herramientas y los inventarios que hayas creado. Selecciona cuál ver y administra su contenido.
                  </span>
                </button>
                <button type="button" className="inventario-menu-tarjeta" onClick={() => setVistaInventario('crear')}>
                  <span className="inventario-menu-tarjeta-titulo">Crear inventario</span>
                  <span className="inventario-menu-tarjeta-texto">
                    Define un nuevo listado con nombre y las columnas que tendrá la tabla. Luego podrás cargar datos desde «Ver inventarios».
                  </span>
                </button>
              </div>
            </div>
          )}

          {vistaInventario === 'ver' && (
            <div className="tarjeta-formulario inventario-panel-ver inventario-panel-tarjeta">
              <div className="panel-seccion-header inventario-panel-cabecera">
                <div className="inventario-panel-intro">
                  <button type="button" className="btn-secundario inventario-boton-volver" onClick={volverMenuInventario}>
                    ← Volver
                  </button>
                  <h3 className="inventario-panel-h3">Ver inventarios</h3>
                  <span className="inventario-panel-subtitulo">
                    Elige un listado, consulta datos y agrega o elimina registros según tu rol.
                  </span>
                </div>
              </div>
              <div className="inventario-bloque-selector">
                <label className="inventario-etiqueta-selector" htmlFor="sel-inventario-ver">
                  Inventario a visualizar
                </label>
                <select
                  id="sel-inventario-ver"
                  className="inventario-select-principal"
                  value={inventarioVerSeleccion}
                  onChange={(e) => {
                    const v = e.target.value
                    setInventarioVerSeleccion(v)
                    setNuevoItemCatalogo({
                      nombre: '',
                      serial: '',
                      responsable: '',
                      ubicacion: '',
                      estado: 'ACTIVO',
                      datosExtra: {},
                    })
                    if (v.startsWith('catalog:')) {
                      const id = v.replace('catalog:', '')
                      setCatalogoActivoId(id)
                      void cargarItemsCatalogoSeleccionado(id)
                    } else {
                      setCatalogoActivoId('')
                      setItemsCatalogoActivo([])
                    }
                  }}
                >
                  <option value="">— Elige un inventario —</option>
                  <option value="preset:plantas">Plantas (eléctricas)</option>
                  <option value="preset:herramientas">Herramientas / equipos</option>
                  {catalogosInventarioLista.map((c) => (
                    <option key={c.id} value={`catalog:${c.id}`}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {inventarioVerSeleccion === 'preset:plantas' && (
                <div className="inventario-detalle-bloque">
                  <div className="panel-seccion-header">
                    <h4>Plantas</h4>
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

              {inventarioVerSeleccion === 'preset:herramientas' && (
                <div className="inventario-detalle-bloque">
                  <div className="panel-seccion-header">
                    <h4>Herramientas</h4>
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

              {inventarioVerSeleccion.startsWith('catalog:') && catalogoActivoId && (
                <div className="inventario-detalle-bloque">
                  <div className="panel-seccion-header">
                    <div>
                      <h4>{catalogoSeleccionadoMeta?.nombre || 'Inventario personalizado'}</h4>
                      <span>{itemsCatalogoActivo.length} ítems</span>
                    </div>
                    {esAdmin && catalogoSeleccionadoMeta?.id != null && (
                      <button
                        type="button"
                        className="btn-peligro"
                        onClick={() => abrirModalBorrarCatalogoInventario(catalogoSeleccionadoMeta.id)}
                      >
                        Eliminar inventario completo
                      </button>
                    )}
                  </div>
                  {!catalogoSeleccionadoMeta && (
                    <p className="texto-error">No se encontró este inventario. Vuelve a cargar datos o elige otro.</p>
                  )}
                  {catalogoSeleccionadoMeta && (
                    <>
                      <p className="inventario-seccion-titulo inventario-seccion-titulo-alta">Agregar ítem</p>
                      <form className="formulario inventario-form-alta" onSubmit={crearItemCatalogoAdmin}>
                        {colsInventarioCustom.includes('nombre') && (
                          <input
                            placeholder="Nombre"
                            value={nuevoItemCatalogo.nombre}
                            onChange={(e) => setNuevoItemCatalogo({ ...nuevoItemCatalogo, nombre: e.target.value })}
                            required
                          />
                        )}
                        {colsInventarioCustom.includes('serial') && (
                          <input
                            placeholder="Serial (único en este inventario)"
                            value={nuevoItemCatalogo.serial}
                            onChange={(e) => setNuevoItemCatalogo({ ...nuevoItemCatalogo, serial: e.target.value })}
                          />
                        )}
                        {colsInventarioCustom.includes('responsable') && (
                          <input
                            placeholder="Responsable"
                            value={nuevoItemCatalogo.responsable}
                            onChange={(e) => setNuevoItemCatalogo({ ...nuevoItemCatalogo, responsable: e.target.value })}
                          />
                        )}
                        {colsInventarioCustom.includes('ubicacion') && (
                          <input
                            placeholder="Ubicación"
                            value={nuevoItemCatalogo.ubicacion}
                            onChange={(e) => setNuevoItemCatalogo({ ...nuevoItemCatalogo, ubicacion: e.target.value })}
                          />
                        )}
                        {colsInventarioCustom.includes('estado') && (
                          <select
                            value={nuevoItemCatalogo.estado}
                            onChange={(e) => setNuevoItemCatalogo({ ...nuevoItemCatalogo, estado: e.target.value })}
                          >
                            <option value="ACTIVO">ACTIVO</option>
                            <option value="EN_MANTENIMIENTO">EN_MANTENIMIENTO</option>
                            <option value="INACTIVO">INACTIVO</option>
                            <option value="DADO_DE_BAJA">DADO_DE_BAJA</option>
                          </select>
                        )}
                        {colsInventarioCustom
                          .filter((col) => !esColumnaInventarioEstandar(col))
                          .map((col) => (
                            <input
                              key={col}
                              placeholder={col}
                              value={(nuevoItemCatalogo.datosExtra && nuevoItemCatalogo.datosExtra[col]) || ''}
                              onChange={(e) =>
                                setNuevoItemCatalogo({
                                  ...nuevoItemCatalogo,
                                  datosExtra: { ...nuevoItemCatalogo.datosExtra, [col]: e.target.value },
                                })
                              }
                            />
                          ))}
                        <button type="submit">Agregar ítem</button>
                      </form>
                      <TablaSimple
                        columnas={[
                          'Id',
                          ...colsInventarioCustom.map((k) => etiquetasColumnaInventario[k] || k),
                          'Acciones',
                        ]}
                        filas={itemsCatalogoActivo.map((it) => [
                          it.id,
                          ...colsInventarioCustom.map((k) =>
                            esColumnaInventarioEstandar(k) ? it[k] ?? '' : (it.datosExtra && it.datosExtra[k]) ?? '',
                          ),
                          esAdmin ? (
                            <button key={`del-it-${it.id}`} type="button" className="btn-peligro" onClick={() => eliminarItemCatalogoAdmin(it.id)}>
                              Eliminar
                            </button>
                          ) : (
                            '-'
                          ),
                        ])}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {vistaInventario === 'crear' && (
            <div className="tarjeta-formulario inventario-panel-crear inventario-panel-tarjeta">
              <div className="panel-seccion-header inventario-panel-cabecera">
                <div className="inventario-panel-intro">
                  <button type="button" className="btn-secundario inventario-boton-volver" onClick={volverMenuInventario}>
                    ← Volver
                  </button>
                  <h3 className="inventario-panel-h3">Crear inventario</h3>
                </div>
              </div>
              <form className="formulario inventario-form-crear" onSubmit={crearCatalogoInventarioAdmin}>
                <div className="inventario-campo-bloque">
                  <label className="inventario-etiqueta-campo" htmlFor="inv-crear-nombre">
                    Nombre del inventario
                  </label>
                  <input
                    id="inv-crear-nombre"
                    placeholder="Ej. Computadores, vehículos de obra…"
                    value={nuevoInventarioNombre}
                    onChange={(e) => setNuevoInventarioNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="inventario-seccion-columnas">
                  <p className="inventario-seccion-titulo">Columnas además del nombre</p>
                <div className="roles-grid inventario-columnas-checks">
                  <label className="rol-checkbox">
                    <input
                      type="checkbox"
                      checked={columnasNuevoInventario.serial}
                      onChange={(e) => setColumnasNuevoInventario({ ...columnasNuevoInventario, serial: e.target.checked })}
                    />
                    Serial
                  </label>
                  <label className="rol-checkbox">
                    <input
                      type="checkbox"
                      checked={columnasNuevoInventario.responsable}
                      onChange={(e) => setColumnasNuevoInventario({ ...columnasNuevoInventario, responsable: e.target.checked })}
                    />
                    Responsable
                  </label>
                  <label className="rol-checkbox">
                    <input
                      type="checkbox"
                      checked={columnasNuevoInventario.ubicacion}
                      onChange={(e) => setColumnasNuevoInventario({ ...columnasNuevoInventario, ubicacion: e.target.checked })}
                    />
                    Ubicación
                  </label>
                  <label className="rol-checkbox">
                    <input
                      type="checkbox"
                      checked={columnasNuevoInventario.estado}
                      onChange={(e) => setColumnasNuevoInventario({ ...columnasNuevoInventario, estado: e.target.checked })}
                    />
                    Estado
                  </label>
                </div>
                </div>
                <div className="inventario-seccion-columnas inventario-seccion-columnas-custom">
                  <p className="inventario-seccion-titulo">Columnas personalizadas (opcional)</p>
                <div className="inventario-columnas-custom-list">
                  {columnasPersonalizadasNuevoInventario.map((row) => (
                    <div key={row.id} className="inventario-columna-custom-fila">
                      <input
                        type="text"
                        placeholder="Nombre de la columna (ej. Marca, Proveedor)"
                        value={row.nombre}
                        onChange={(e) =>
                          setColumnasPersonalizadasNuevoInventario((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, nombre: e.target.value } : r)),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="btn-secundario inventario-quitar-columna-custom"
                        onClick={() =>
                          setColumnasPersonalizadasNuevoInventario((prev) => prev.filter((r) => r.id !== row.id))
                        }
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn-secundario inventario-anadir-columna-custom"
                    onClick={() =>
                      setColumnasPersonalizadasNuevoInventario((prev) => [...prev, nuevaFilaColumnaPersonalizadaInventario()])
                    }
                  >
                    + Añadir columna personalizada
                  </button>
                </div>
                </div>
                <div className="inventario-accion-principal">
                  <button type="submit">Crear inventario</button>
                </div>
              </form>
            </div>
          )}

          {modalBorrarCatalogoInventario.abierto && (
            <div
              className="modal-confirmacion-inventario-fondo"
              role="presentation"
              onClick={cerrarModalBorrarCatalogoInventario}
            >
              <div
                className="modal-confirmacion-inventario-caja"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-borrar-catalogo-titulo"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 id="modal-borrar-catalogo-titulo" className="modal-confirmacion-inventario-titulo">
                  Confirmar eliminación del inventario
                </h4>
                <p className="texto-ayuda-tecnico modal-confirmacion-inventario-texto">
                  Esta acción elimina el catálogo y todos sus datos asociados. Es irreversible. Escribe tu contraseña de
                  sesión para continuar.
                </p>
                <label className="modal-confirmacion-inventario-label-clave" htmlFor="modal-borrar-catalogo-clave">
                  Contraseña
                </label>
                <input
                  id="modal-borrar-catalogo-clave"
                  type="password"
                  className="modal-confirmacion-inventario-clave"
                  placeholder="Tu contraseña de acceso"
                  autoComplete="current-password"
                  value={modalBorrarCatalogoInventario.clave}
                  onChange={(e) =>
                    setModalBorrarCatalogoInventario((prev) => ({
                      ...prev,
                      clave: e.target.value,
                      error: '',
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void ejecutarBorradoCatalogoInventarioConfirmado()
                    }
                  }}
                />
                {modalBorrarCatalogoInventario.error ? (
                  <p className="texto-error modal-confirmacion-inventario-error" role="alert">
                    {modalBorrarCatalogoInventario.error}
                  </p>
                ) : null}
                <div className="modal-confirmacion-inventario-acciones">
                  <button type="button" className="btn-secundario" onClick={cerrarModalBorrarCatalogoInventario}>
                    Cancelar
                  </button>
                  <button type="button" className="btn-peligro" onClick={() => void ejecutarBorradoCatalogoInventarioConfirmado()}>
                    Eliminar definitivamente
                  </button>
                </div>
              </div>
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
                <span className="tab-leading-icon-inv" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </span>
                Ver formularios creados <span className="badge-tab">{formularios.length}</span>
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
                            value={
                              campo.catalogoInventario === 'PERSONALIZADO' && campo.catalogoPersonalizadoId
                                ? `custom:${campo.catalogoPersonalizadoId}`
                                : campo.catalogoInventario || 'HERRAMIENTAS'
                            }
                            onChange={(e) => {
                              const v = e.target.value
                              if (v === 'PLANTAS') {
                                actualizarCampoFormulario(idx, {
                                  catalogoInventario: 'PLANTAS',
                                  endpointOpciones: '/plantas',
                                  catalogoPersonalizadoId: '',
                                  inventarioIds: [],
                                })
                              } else if (v === 'HERRAMIENTAS') {
                                actualizarCampoFormulario(idx, {
                                  catalogoInventario: 'HERRAMIENTAS',
                                  endpointOpciones: '/inventario',
                                  catalogoPersonalizadoId: '',
                                  inventarioIds: [],
                                })
                              } else if (v.startsWith('custom:')) {
                                const id = v.slice(7)
                                actualizarCampoFormulario(idx, {
                                  catalogoInventario: 'PERSONALIZADO',
                                  catalogoPersonalizadoId: id,
                                  endpointOpciones: `/inventarios/catalogos/${id}/items`,
                                  inventarioIds: [],
                                })
                              }
                            }}
                          >
                            <option value="PLANTAS">Plantas (eléctricas)</option>
                            <option value="HERRAMIENTAS">Herramientas / equipos</option>
                            {catalogosInventarioLista.map((cat) => (
                              <option key={cat.id} value={`custom:${cat.id}`}>
                                Catálogo: {cat.nombre}
                              </option>
                            ))}
                          </select>
                          <input
                            placeholder="Endpoint API (se rellena al elegir catálogo; avanzado: /inventarios/catalogos/ID/items)"
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
            <div className="tarjeta-formulario formularios-lista-creados">
              <div className="panel-seccion-header formularios-lista-creados-cabecera">
                <h3>Formularios creados</h3>
              </div>
              <TablaSimple
                columnas={['Id', 'Nombre', 'Acciones']}
                filas={formularios.map((f) => [
                  f.id,
                  f.nombre,
                  <div key={`acc-form-${f.id}`} className="formularios-tabla-acciones">
                    <button type="button" className="btn-secundario" onClick={() => abrirFormulario(f.id)}>
                      Abrir
                    </button>
                    {esAdmin && (
                      <button type="button" className="btn-secundario" onClick={() => cargarFormularioParaEditar(f)}>
                        Editar
                      </button>
                    )}
                    {esAdmin && (
                      <button type="button" className="btn-peligro" onClick={() => eliminarFormulario(f.id)}>
                        Eliminar
                      </button>
                    )}
                  </div>,
                ])}
              />
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
                            <button type="button" className="btn-secundario" onClick={() => actualizarRolUsuario(u.id, 'BODEGA')}>
                              Asignar BODEGA
                            </button>
                            <button type="button" className="btn-secundario" onClick={() => actualizarRolUsuario(u.id, 'COMPRAS')}>
                              Asignar COMPRAS
                            </button>
                            <button type="button" className="btn-secundario" onClick={() => actualizarRolUsuario(u.id, 'COMERCIAL')}>
                              Asignar COMERCIAL
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
                    <span>Solo bodega, compras o comercial</span>
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
                          checked={nuevoUsuario.rol === 'BODEGA'}
                          onChange={() => setNuevoUsuario({ ...nuevoUsuario, rol: 'BODEGA' })}
                        />
                        BODEGA
                      </label>
                      <label className="rol-checkbox">
                        <input
                          type="radio"
                          name="rolUsuario"
                          checked={nuevoUsuario.rol === 'COMPRAS'}
                          onChange={() => setNuevoUsuario({ ...nuevoUsuario, rol: 'COMPRAS' })}
                        />
                        COMPRAS
                      </label>
                      <label className="rol-checkbox">
                        <input
                          type="radio"
                          name="rolUsuario"
                          checked={nuevoUsuario.rol === 'COMERCIAL'}
                          onChange={() => setNuevoUsuario({ ...nuevoUsuario, rol: 'COMERCIAL' })}
                        />
                        COMERCIAL
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
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
              </svg>
            </span>
            Dashboard
          </button>
          {!esTecnico && (
            <button
              className={moduloActivo === 'inventario' ? 'sidebar-btn activo' : 'sidebar-btn'}
              onClick={() => irAModulo('inventario')}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19V9l8-4 8 4v10" />
                  <path d="M9 22V12h6v10" />
                </svg>
              </span>
              Inventario
            </button>
          )}
          {!esTecnico && (
            <button
              className={moduloActivo === 'formularios' ? 'sidebar-btn activo' : 'sidebar-btn'}
              onClick={() => irAModulo('formularios')}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
                  <path d="M14 2v6h6" />
                  <path d="M8 13h8M8 17h8M8 9h4" />
                </svg>
              </span>
              Formularios
            </button>
          )}
          {esAdmin && (
            <button
              className={moduloActivo === 'flujos' ? 'sidebar-btn activo' : 'sidebar-btn'}
              onClick={() => irAModulo('flujos')}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="6" height="6" rx="1.5" />
                  <rect x="15" y="4" width="6" height="6" rx="1.5" />
                  <rect x="9" y="14" width="6" height="6" rx="1.5" />
                  <path d="M6 10v2h12V10M12 10v4" />
                </svg>
              </span>
              Flujos
            </button>
          )}
          {esAdmin && (
            <button
              className={moduloActivo === 'usuarios' ? 'sidebar-btn activo' : 'sidebar-btn'}
              onClick={() => irAModulo('usuarios')}
            >
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              Usuarios
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-btn sidebar-btn-salir" onClick={cerrarSesion}>
            <span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="contenido">
        <header className="navbar">
          <div className="navbar-izquierda">
            <button
              type="button"
              className="btn-menu-movil"
              onClick={() => setMenuMovilAbierto((prev) => !prev)}
              aria-label="Abrir menú"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
            <h1>Sistema ERP de Mantenimiento</h1>
          </div>
          <div className="acciones-navbar">
            <span className="navbar-meta">Área activa: {moduloActivo} | Roles: {rolesUsuario.join(', ') || 'N/A'}</span>
            <button type="button" className="btn-tema" onClick={alternarTema}>
              {temaOscuro ? (
                <>
                  <span className="nav-icon btn-tema-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                    </svg>
                  </span>
                  Modo claro
                </>
              ) : (
                <>
                  <span className="nav-icon btn-tema-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </span>
                  Modo oscuro
                </>
              )}
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
