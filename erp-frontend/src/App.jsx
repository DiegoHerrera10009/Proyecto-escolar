import { useEffect, useMemo, useState } from 'react'
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
    { nombre: '', etiqueta: '', tipo: 'string', obligatorio: true, opciones: '' },
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
  const [asignacionFormulario, setAsignacionFormulario] = useState({
    titulo: '',
    formularioId: '',
    tecnicoId: '',
  })
  const [tareaFormularioActivaId, setTareaFormularioActivaId] = useState('')
  const [respuestasFormularioTecnico, setRespuestasFormularioTecnico] = useState({})
  const [informeTareaSeleccionadaId, setInformeTareaSeleccionadaId] = useState('')
  const [vistaDashboardAdmin, setVistaDashboardAdmin] = useState('pendientes')
  const [vistaFormulariosAdmin, setVistaFormulariosAdmin] = useState('crear')
  const [vistaUsuariosAdmin, setVistaUsuariosAdmin] = useState('ver')

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

  const cabeceras = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  })
  const cabecerasAuth = () => ({ Authorization: `Bearer ${token}` })

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
      setPlantas(await resPlantas.json())
      setInventario(await resInventario.json())
      setFormularios(await resFormularios.json())
      const resRespuestas = await fetch(`${API_URL}/formularios/respuestas`, { headers: cabeceras() })
      if (resRespuestas.ok) {
        setRespuestasFormularios(await resRespuestas.json())
      } else {
        setRespuestasFormularios([])
      }
      const resTareasCampo = await fetch(`${API_URL}/campo/tareas`, { headers: cabeceras() })
      if (resTareasCampo.ok) {
        setTareasCampo(await resTareasCampo.json())
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
        opciones: c.tipo === 'select' ? c.opciones.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
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
    setCamposFormularioNuevo([{ nombre: '', etiqueta: '', tipo: 'string', obligatorio: true, opciones: '' }])
    setFormularioEdicionId('')
    cargarDatos()
  }

  const esAdmin = rolesUsuario.includes('ADMINISTRADOR')
  const esTecnico = rolesUsuario.includes('TECNICO')
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

  const crearTareaDesdeFormulario = async (e) => {
    e.preventDefault()
    if (!asignacionFormulario.titulo || !asignacionFormulario.formularioId || !asignacionFormulario.tecnicoId) {
      setMensajeError('Debes completar título, formulario y técnico')
      return
    }
    const resp = await fetch(`${API_URL}/campo/tareas`, {
      method: 'POST',
      headers: cabeceras(),
      body: JSON.stringify({
        titulo: asignacionFormulario.titulo,
        descripcion: `Tarea generada desde formulario ${asignacionFormulario.formularioId}`,
        formularioId: Number(asignacionFormulario.formularioId),
        asignadoAId: Number(asignacionFormulario.tecnicoId),
        etapas: ['Ejecucion', 'Revision'],
      }),
    })
    if (!resp.ok) {
      setMensajeError(`No se pudo crear la tarea desde formulario (${resp.status})`)
      return
    }
    setAsignacionFormulario({ titulo: '', formularioId: '', tecnicoId: '' })
    cargarDatos()
  }

  const agregarCampoFormulario = () => {
    setCamposFormularioNuevo((prev) => [...prev, { nombre: '', etiqueta: '', tipo: 'string', obligatorio: true, opciones: '' }])
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
          }))
        : [{ nombre: '', etiqueta: '', tipo: 'string', obligatorio: true, opciones: '' }]
    )
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

  const renderContenido = () => {
    if (moduloActivo === 'dashboard') {
      if (esTecnico) {
        const pendientes = tareasCampo.filter((t) => t.estado === 'PENDIENTE' || t.estado === 'EN_PROCESO')
        const realizadas = tareasCampo.filter((t) => t.estado === 'TERMINADA' || t.estado === 'CANCELADA')
        return (
          <section>
            <h3 className="titulo-seccion">Mis pendientes</h3>
            <TablaSimple
              columnas={['Id', 'Tarea', 'Estado', 'Formulario']}
              filas={pendientes.map((t) => [t.id, t.titulo, t.estado, t.formulario?.nombre])}
            />
            <div className="tarjeta-formulario">
              <h3>Acciones rápidas</h3>
              {pendientes.map((t) => (
                <div key={t.id} className="roles-grid">
                  <span>#{t.id} - {t.titulo} ({t.estado})</span>
                  {t.estado === 'PENDIENTE' && (
                    <button type="button" onClick={() => cambiarEstadoRapidoTarea(t.id, 'EN_PROCESO')}>
                      Iniciar tarea
                    </button>
                  )}
                  {t.estado === 'EN_PROCESO' && (
                    <button type="button" onClick={() => { setTareaFormularioActivaId(String(t.id)); setRespuestasFormularioTecnico({}) }}>
                      Rellenar formulario
                    </button>
                  )}
                </div>
              ))}
            </div>

            {pendientes
              .filter((t) => String(t.id) === String(tareaFormularioActivaId))
              .map((t) => {
                let campos = []
                try {
                  campos = JSON.parse(t.formulario?.esquemaJson || '{}').campos || []
                } catch {
                  campos = []
                }
                return (
                  <div key={`form-tecnico-${t.id}`} className="tarjeta-formulario">
                    <h3>Formulario de tarea: {t.titulo}</h3>
                    {campos.length === 0 && <p>Este formulario no tiene campos definidos.</p>}
                    {campos.map((c, idx) => (
                      <div key={`${c.nombre}-${idx}`} className="formulario">
                        <label>{c.etiqueta || c.nombre}</label>
                        {c.tipo === 'int' && (
                          <input type="number" onChange={(e) => actualizarRespuestaFormularioTecnico(c.nombre, Number(e.target.value || 0))} />
                        )}
                        {c.tipo === 'fecha' && (
                          <input type="date" onChange={(e) => actualizarRespuestaFormularioTecnico(c.nombre, e.target.value)} />
                        )}
                        {c.tipo === 'select' && (
                          <select onChange={(e) => actualizarRespuestaFormularioTecnico(c.nombre, e.target.value)}>
                            <option value="">Selecciona</option>
                            {(c.opciones || []).map((op) => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        )}
                        {(c.tipo === 'imagen' || c.tipo === 'firma') && (
                          <input type="file" onChange={(e) => manejarArchivoCampo(c.nombre, e.target.files?.[0])} />
                        )}
                        {(c.tipo === 'string' || !['int', 'fecha', 'select', 'imagen', 'firma'].includes(c.tipo)) && (
                          <input type="text" onChange={(e) => actualizarRespuestaFormularioTecnico(c.nombre, e.target.value)} />
                        )}
                      </div>
                    ))}
                    <div className="roles-grid">
                      <button type="button" onClick={() => enviarFormularioTecnico(t)}>Guardar formulario y finalizar tarea</button>
                      <button type="button" onClick={() => setTareaFormularioActivaId('')}>Cancelar</button>
                    </div>
                  </div>
                )
              })}
            <h3 className="titulo-seccion">Historial de tareas realizadas</h3>
            <TablaSimple
              columnas={['Id', 'Tarea', 'Estado', 'Formulario']}
              filas={realizadas.map((t) => [t.id, t.titulo, renderEstadoTarea(t.estado), t.formulario?.nombre])}
            />
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
              <TablaSimple columnas={['Nombre', 'Serial', 'Ubicación', 'Estado']} filas={plantas.map((p) => [p.nombre, p.serial, p.ubicacion, p.estado])} />
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
              <TablaSimple columnas={['Nombre', 'Serial', 'Responsable', 'Estado', 'Ubicación']} filas={inventario.map((i) => [i.nombre, i.serial, i.responsable, i.estado, i.ubicacion])} />
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
                className={vistaFormulariosAdmin === 'asignar' ? 'btn-tab-admin activo' : 'btn-tab-admin'}
                onClick={() => setVistaFormulariosAdmin('asignar')}
              >
                🧑‍🔧 Asignar formulario a técnico (crear tarea)
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
                <span>Define estructura y guarda</span>
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
                    <input placeholder="Opciones separadas por coma" value={campo.opciones} onChange={(e) => actualizarCampoFormulario(idx, { opciones: e.target.value })} />
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {esAdmin && vistaFormulariosAdmin === 'asignar' && (
            <div className="tarjeta-formulario">
              <div className="panel-seccion-header">
                <h3>Asignar formulario a técnico (crear tarea)</h3>
                <span>Selecciona formulario y técnico</span>
              </div>
              <form className="formulario" onSubmit={crearTareaDesdeFormulario}>
                <input
                  placeholder="Título de la tarea"
                  value={asignacionFormulario.titulo}
                  onChange={(e) => setAsignacionFormulario({ ...asignacionFormulario, titulo: e.target.value })}
                  required
                />
                <select
                  value={asignacionFormulario.formularioId}
                  onChange={(e) => setAsignacionFormulario({ ...asignacionFormulario, formularioId: e.target.value })}
                  required
                >
                  <option value="">Selecciona formulario</option>
                  {formularios.map((f) => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
                <select
                  value={asignacionFormulario.tecnicoId}
                  onChange={(e) => setAsignacionFormulario({ ...asignacionFormulario, tecnicoId: e.target.value })}
                  required
                >
                  <option value="">Selecciona técnico</option>
                  {usuarios
                    .filter((u) => (u.roles || []).some((r) => r.nombre === 'TECNICO'))
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.nombreCompleto} ({u.correo})</option>
                    ))}
                </select>
                <button type="submit">Crear y asignar tarea</button>
              </form>
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
                      columnas={['Nombre', 'Etiqueta', 'Tipo', 'Obligatorio', 'Opciones']}
                      filas={campos.map((c) => [
                        c.nombre,
                        c.etiqueta,
                        c.tipo,
                        c.obligatorio ? 'Sí' : 'No',
                        Array.isArray(c.opciones) ? c.opciones.join(', ') : '-',
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
