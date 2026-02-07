import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearTurno, crearTurnosLote, getMisTurnos, cancelarTurno, confirmarTurno, completarTurno, actualizarTurno } from '../api/turnoService';
import { authService } from '../api/authService';
import Button from '../components/Button';
import { Card } from '../components/Card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const GestionTurnosOdonto = () => {
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [modoCreacion, setModoCreacion] = useState('lote'); // 'individual' o 'lote'
  const [turnoEditando, setTurnoEditando] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState(() => {
    // Por defecto mostrar la fecha de hoy
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  }); // Filtro para turnos disponibles
  
  // Estado del formulario para crear turno individual
  const [turnoIndividual, setTurnoIndividual] = useState({
    fecha: '',
    hora: '',
    duracion_minutos: 20,
    motivo: ''
  });
  
  // Estado del formulario para crear turnos en lote
  const [loteForm, setLoteForm] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    hora_inicio: '08:00',
    hora_fin: '12:00',
    duracion_minutos: 20,
    dias_semana: [0, 1, 2, 3, 4], // Lunes a viernes por defecto
    motivo: ''
  });

  const userData = authService.getUserData();

  const diasSemanaOptions = [
    { value: 0, label: 'Lunes' },
    { value: 1, label: 'Martes' },
    { value: 2, label: 'Miércoles' },
    { value: 3, label: 'Jueves' },
    { value: 4, label: 'Viernes' },
    { value: 5, label: 'Sábado' },
    { value: 6, label: 'Domingo' }
  ];

  useEffect(() => {
    cargarTurnos();
  }, []);

  const cargarTurnos = async () => {
    setLoading(true);
    try {
      const data = await getMisTurnos();
      setTurnos(data);
      setError('');
    } catch (err) {
      setError('Error al cargar los turnos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearTurnoIndividual = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const fechaHora = `${turnoIndividual.fecha}T${turnoIndividual.hora}:00`;
      
      const turnoData = {
        odontologo: userData.perfil_id,
        fecha_hora: fechaHora,
        duracion_minutos: parseInt(turnoIndividual.duracion_minutos),
        motivo: turnoIndividual.motivo || ''
      };

      await crearTurno(turnoData);
      setSuccess('Turno creado exitosamente');
      setShowForm(false);
      setTurnoIndividual({
        fecha: '',
        hora: '',
        duracion_minutos: 20,
        motivo: ''
      });
      cargarTurnos();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear el turno');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearTurnosLote = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await crearTurnosLote(loteForm);
      
      if (response.turnos_creados === 0) {
        setError(response.message || 'No se pudo crear ningún turno debido a conflictos de horario');
      } else if (response.conflictos > 0) {
        setSuccess(`${response.message}`);
        // Opcional: mostrar también una advertencia con detalles
        console.log('Conflictos detectados:', response.errores);
      } else {
        setSuccess(response.message);
      }
      
      if (response.turnos_creados > 0) {
        setShowForm(false);
        setLoteForm({
          fecha_inicio: '',
          fecha_fin: '',
          hora_inicio: '08:00',
          hora_fin: '12:00',
          duracion_minutos: 20,
          dias_semana: [0, 1, 2, 3, 4],
          motivo: ''
        });
        cargarTurnos();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || err.response?.data?.error || 'Error al crear los turnos');
    } finally {
      setLoading(false);
    }
  };

  const handleDiasSemanaChange = (dia) => {
    setLoteForm(prev => {
      const dias = prev.dias_semana.includes(dia)
        ? prev.dias_semana.filter(d => d !== dia)
        : [...prev.dias_semana, dia];
      return { ...prev, dias_semana: dias.sort() };
    });
  };

  const handleEditarTurno = (turno) => {
    const fecha = new Date(turno.fecha_hora);
    
    // Extraer componentes UTC para tratarlos como hora local
    const año = fecha.getUTCFullYear();
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    const horas = String(fecha.getUTCHours()).padStart(2, '0');
    const minutos = String(fecha.getUTCMinutes()).padStart(2, '0');
    
    setTurnoEditando({
      id: turno.id,
      fecha: `${año}-${mes}-${dia}`,
      hora: `${horas}:${minutos}`,
      duracion_minutos: turno.duracion_minutos,
      estado: turno.estado,
      nombre_paciente_manual: turno.nombre_paciente_manual || '',
      apellido_paciente_manual: turno.apellido_paciente_manual || ''
    });
  };

  const handleGuardarEdicion = async () => {
    if (!turnoEditando) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const fechaHora = `${turnoEditando.fecha}T${turnoEditando.hora}:00`;
      const updateData = {
        fecha_hora: fechaHora,
        duracion_minutos: parseInt(turnoEditando.duracion_minutos)
      };
      
      // Si se está marcando como reservado, incluir los datos del paciente manual
      if (turnoEditando.estado === 'reservado') {
        updateData.estado = 'reservado';
        updateData.nombre_paciente_manual = turnoEditando.nombre_paciente_manual;
        updateData.apellido_paciente_manual = turnoEditando.apellido_paciente_manual;
      }
      
      await actualizarTurno(turnoEditando.id, updateData);
      setSuccess('Turno actualizado exitosamente');
      setTurnoEditando(null);
      cargarTurnos();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar el turno');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarTurno = async (turnoId) => {
    if (!window.confirm('¿Está seguro de cancelar este turno?')) return;
    
    setLoading(true);
    try {
      await cancelarTurno(turnoId);
      setSuccess('Turno cancelado exitosamente');
      cargarTurnos();
    } catch (err) {
      setError('Error al cancelar el turno');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarTurno = async (turnoId) => {
    setLoading(true);
    try {
      await confirmarTurno(turnoId);
      setSuccess('Turno confirmado exitosamente');
      cargarTurnos();
    } catch (err) {
      setError('Error al confirmar el turno');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletarTurno = async (turnoId) => {
    setLoading(true);
    try {
      await completarTurno(turnoId);
      setSuccess('Turno completado exitosamente');
      cargarTurnos();
    } catch (err) {
      setError('Error al completar el turno');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaHora) => {
    // El backend guarda las fechas en UTC, pero queremos mostrarlas como "hora local"
    // sin conversión de zona horaria (la hora que el odontólogo eligió)
    const fecha = new Date(fechaHora);
    
    // Si la fecha viene como ISO string con Z (UTC), extraer componentes UTC
    // y tratarlos como hora local
    const año = fecha.getUTCFullYear();
    const mes = fecha.getUTCMonth();
    const dia = fecha.getUTCDate();
    const horas = fecha.getUTCHours();
    const minutos = fecha.getUTCMinutes();
    
    // Crear nueva fecha con esos valores como hora local
    const fechaLocal = new Date(año, mes, dia, horas, minutos);
    
    return fechaLocal.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado) => {
    const colores = {
      disponible: 'bg-green-100 text-green-800',
      reservado: 'bg-blue-100 text-blue-800',
      confirmado: 'bg-purple-100 text-purple-800',
      completado: 'bg-gray-100 text-gray-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getTurnosPorEstado = (estado) => {
    let filtrados = turnos.filter(t => t.estado === estado);
    
    // Para turnos disponibles, SIEMPRE aplicar filtro por fecha
    if (estado === 'disponible') {
      if (fechaFiltro) {
        filtrados = filtrados.filter(t => {
          const fechaTurno = new Date(t.fecha_hora);
          const fechaFiltroDate = new Date(fechaFiltro + 'T00:00:00');
          
          // Comparar solo la fecha (día/mes/año) en UTC
          return fechaTurno.getUTCFullYear() === fechaFiltroDate.getFullYear() &&
                 fechaTurno.getUTCMonth() === fechaFiltroDate.getMonth() &&
                 fechaTurno.getUTCDate() === fechaFiltroDate.getDate();
        });
      } else {
        // Si no hay filtro, no mostrar nada (evitar listado gigante)
        filtrados = [];
      }
    }
    
    return filtrados;
  };

  const avanzarDia = () => {
    const fecha = new Date(fechaFiltro);
    fecha.setDate(fecha.getDate() + 1);
    setFechaFiltro(fecha.toISOString().split('T')[0]);
  };

  const retrocederDia = () => {
    const fecha = new Date(fechaFiltro);
    fecha.setDate(fecha.getDate() - 1);
    setFechaFiltro(fecha.toISOString().split('T')[0]);
  };

  const irHoy = () => {
    const hoy = new Date();
    setFechaFiltro(hoy.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      <div className="flex-grow bg-white/5 backdrop-blur-sm p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de Turnos</h1>
            <p className="text-slate-200 mt-2">Dr. {userData.nombre} {userData.apellido}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/home-odontologo')} variant="secondary">
              Volver al Inicio
            </Button>
            <Button onClick={() => { setShowForm(!showForm); setModoCreacion('individual'); }}>
              {showForm ? 'Cancelar' : '+ Crear Turno'}
            </Button>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Formulario Crear Turnos */}
        {showForm && (
          <Card className="mb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Crear Turno</h2>
              
              {/* Selector de Modo */}
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setModoCreacion('individual')}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    modoCreacion === 'individual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Turno Individual
                </button>
                <button
                  type="button"
                  onClick={() => setModoCreacion('lote')}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    modoCreacion === 'lote'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Turnos en Lote
                </button>
              </div>
            </div>

            {modoCreacion === 'individual' ? (
              /* Formulario Individual */
              <form onSubmit={handleCrearTurnoIndividual} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha
                    </label>
                    <input
                      type="date"
                      required
                      value={turnoIndividual.fecha}
                      onChange={(e) => setTurnoIndividual({ ...turnoIndividual, fecha: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora
                    </label>
                    <input
                      type="time"
                      required
                      value={turnoIndividual.hora}
                      onChange={(e) => setTurnoIndividual({ ...turnoIndividual, hora: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    required
                    value={turnoIndividual.duracion_minutos}
                    onChange={(e) => setTurnoIndividual({ ...turnoIndividual, duracion_minutos: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="10"
                    max="180"
                    step="5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={turnoIndividual.motivo}
                    onChange={(e) => setTurnoIndividual({ ...turnoIndividual, motivo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Ej: Consulta general, limpieza, etc."
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creando...' : 'Crear Turno'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              /* Formulario en Lote */
              <form onSubmit={handleCrearTurnosLote} className="space-y-6">
                <p className="text-gray-600 mb-4">Crea múltiples turnos de manera rápida seleccionando un rango de fechas, horas y días de la semana.</p>
              {/* Rango de Fechas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Rango de Fechas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      required
                      value={loteForm.fecha_inicio}
                      onChange={(e) => setLoteForm({ ...loteForm, fecha_inicio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      required
                      value={loteForm.fecha_fin}
                      onChange={(e) => setLoteForm({ ...loteForm, fecha_fin: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={loteForm.fecha_inicio || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Días de la Semana */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Días de la Semana</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {diasSemanaOptions.map(dia => (
                    <label key={dia.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={loteForm.dias_semana.includes(dia.value)}
                        onChange={() => handleDiasSemanaChange(dia.value)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{dia.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rango de Horas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Rango de Horas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      required
                      value={loteForm.hora_inicio}
                      onChange={(e) => setLoteForm({ ...loteForm, hora_inicio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      required
                      value={loteForm.hora_fin}
                      onChange={(e) => setLoteForm({ ...loteForm, hora_fin: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Duración */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración de cada turno (minutos)
                </label>
                <input
                  type="number"
                  required
                  value={loteForm.duracion_minutos}
                  onChange={(e) => setLoteForm({ ...loteForm, duracion_minutos: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="10"
                  max="180"
                  step="5"
                />
                <p className="text-sm text-gray-500 mt-1">Por defecto: 20 minutos</p>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={loteForm.motivo}
                  onChange={(e) => setLoteForm({ ...loteForm, motivo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="Ej: Consulta general, limpieza, etc."
                />
              </div>
              
              <div className="flex gap-4">
                <Button type="submit" disabled={loading || loteForm.dias_semana.length === 0}>
                  {loading ? 'Creando Turnos...' : 'Crear Turnos en Lote'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
            )}
          </Card>
        )}

        {/* Lista de Turnos */}
        {loading && !turnos.length ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando turnos...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Turnos Disponibles */}
            <Card>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Turnos Disponibles
                </h3>
                
                {/* Navegación por día */}
                <div className="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={retrocederDia}
                  >
                    ← Día Anterior
                  </Button>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={fechaFiltro}
                      onChange={(e) => setFechaFiltro(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-medium"
                    />
                    <Button
                      size="sm"
                      onClick={irHoy}
                    >
                      Hoy
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={avanzarDia}
                  >
                    Día Siguiente →
                  </Button>
                </div>
                
                <p className="text-sm text-gray-600 mt-3 text-center">
                  Mostrando <span className="font-semibold">{getTurnosPorEstado('disponible').length}</span> turnos disponibles para el {new Date(fechaFiltro + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              
              {getTurnosPorEstado('disponible').length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay turnos disponibles para esta fecha</p>
              ) : (
                <div className="space-y-3">
                  {getTurnosPorEstado('disponible').map((turno) => (
                    <div
                      key={turno.id}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      {turnoEditando && turnoEditando.id === turno.id ? (
                        /* Modo Edición */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                              <input
                                type="date"
                                value={turnoEditando.fecha}
                                onChange={(e) => setTurnoEditando({ ...turnoEditando, fecha: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Hora</label>
                              <input
                                type="time"
                                value={turnoEditando.hora}
                                onChange={(e) => setTurnoEditando({ ...turnoEditando, hora: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Duración (min)</label>
                              <input
                                type="number"
                                value={turnoEditando.duracion_minutos}
                                onChange={(e) => setTurnoEditando({ ...turnoEditando, duracion_minutos: e.target.value })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                min="10"
                                max="180"
                                step="5"
                              />
                            </div>
                          </div>
                          
                          {/* Opción de Reserva Manual */}
                          <div className="border-t pt-3">
                            <div className="flex items-center gap-3 mb-3">
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={turnoEditando.estado === 'reservado'}
                                  onChange={(e) => setTurnoEditando({ 
                                    ...turnoEditando, 
                                    estado: e.target.checked ? 'reservado' : 'disponible',
                                    nombre_paciente_manual: e.target.checked ? turnoEditando.nombre_paciente_manual : '',
                                    apellido_paciente_manual: e.target.checked ? turnoEditando.apellido_paciente_manual : ''
                                  })}
                                  className="mr-2 h-4 w-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Reservar manualmente (sin usuario)</span>
                              </label>
                            </div>
                            
                            {turnoEditando.estado === 'reservado' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del Paciente *</label>
                                  <input
                                    type="text"
                                    value={turnoEditando.nombre_paciente_manual}
                                    onChange={(e) => setTurnoEditando({ ...turnoEditando, nombre_paciente_manual: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    placeholder="Nombre"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Apellido del Paciente *</label>
                                  <input
                                    type="text"
                                    value={turnoEditando.apellido_paciente_manual}
                                    onChange={(e) => setTurnoEditando({ ...turnoEditando, apellido_paciente_manual: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    placeholder="Apellido"
                                    required
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleGuardarEdicion}>
                              Guardar
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setTurnoEditando(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Modo Vista */
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-800">{formatearFecha(turno.fecha_hora)}</p>
                            <p className="text-sm text-gray-600">{turno.duracion_minutos} minutos</p>
                            {turno.motivo && (
                              <p className="text-sm text-gray-500 mt-1">{turno.motivo}</p>
                            )}
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(turno.estado)}`}>
                              {turno.estado}
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleEditarTurno(turno)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleCancelarTurno(turno.id)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Turnos Reservados */}
            <Card>
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Turnos Reservados ({getTurnosPorEstado('reservado').length})
              </h3>
              {getTurnosPorEstado('reservado').length === 0 ? (
                <p className="text-gray-500">No hay turnos reservados</p>
              ) : (
                <div className="space-y-3">
                  {getTurnosPorEstado('reservado').map((turno) => (
                    <div
                      key={turno.id}
                      className="flex justify-between items-center p-4 bg-blue-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{formatearFecha(turno.fecha_hora)}</p>
                        {turno.paciente ? (
                          <p className="text-sm text-gray-600">
                            Paciente: {turno.paciente.nombre_completo}
                          </p>
                        ) : turno.nombre_paciente_manual && turno.apellido_paciente_manual ? (
                          <p className="text-sm text-gray-600">
                            Paciente: {turno.nombre_paciente_manual} {turno.apellido_paciente_manual} <span className="text-xs text-blue-600">(reserva manual)</span>
                          </p>
                        ) : null}
                        <p className="text-sm text-gray-600">{turno.duracion_minutos} minutos</p>
                        {turno.motivo && (
                          <p className="text-sm text-gray-500 mt-1">{turno.motivo}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(turno.estado)}`}>
                          {turno.estado}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmarTurno(turno.id)}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleCancelarTurno(turno.id)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Turnos Confirmados */}
            <Card>
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Turnos Confirmados ({getTurnosPorEstado('confirmado').length})
              </h3>
              {getTurnosPorEstado('confirmado').length === 0 ? (
                <p className="text-gray-500">No hay turnos confirmados</p>
              ) : (
                <div className="space-y-3">
                  {getTurnosPorEstado('confirmado').map((turno) => (
                    <div
                      key={turno.id}
                      className="flex justify-between items-center p-4 bg-purple-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{formatearFecha(turno.fecha_hora)}</p>
                        {turno.paciente ? (
                          <p className="text-sm text-gray-600">
                            Paciente: {turno.paciente.nombre_completo}
                          </p>
                        ) : turno.nombre_paciente_manual && turno.apellido_paciente_manual ? (
                          <p className="text-sm text-gray-600">
                            Paciente: {turno.nombre_paciente_manual} {turno.apellido_paciente_manual} <span className="text-xs text-blue-600">(reserva manual)</span>
                          </p>
                        ) : null}
                        <p className="text-sm text-gray-600">{turno.duracion_minutos} minutos</p>
                        {turno.motivo && (
                          <p className="text-sm text-gray-500 mt-1">{turno.motivo}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(turno.estado)}`}>
                          {turno.estado}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleCompletarTurno(turno.id)}
                        >
                          Completar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleCancelarTurno(turno.id)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default GestionTurnosOdonto;
