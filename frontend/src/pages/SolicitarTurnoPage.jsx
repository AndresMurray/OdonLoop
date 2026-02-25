import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTurnosDisponibles, reservarTurno, getMisTurnos, cancelarTurno } from '../api/turnoService';
import { getOdontologos } from '../api/odontologoService';
import { authService } from '../api/authService';
import Button from '../components/Button';
import { Card } from '../components/Card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import LoadingModal from '../components/LoadingModal';
import TurnoCalendar from '../components/TurnoCalendar';

const SolicitarTurnoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vistaInicial = location.state?.vistaInicial || 'buscar';
  const [odontologos, setOdontologos] = useState([]);
  const [odontologoSeleccionado, setOdontologoSeleccionado] = useState('');
  const [turnosDisponibles, setTurnosDisponibles] = useState([]);
  const [misTurnos, setMisTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vistaActual, setVistaActual] = useState(vistaInicial); // 'buscar' o 'misTurnos'
  const [motivo, setMotivo] = useState('');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [fechaFiltro, setFechaFiltro] = useState(() => {
    // Por defecto mostrar la fecha de hoy
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const [paginaActualDisponibles, setPaginaActualDisponibles] = useState(1);
  const turnosPorPagina = 5;
  const turnosDisponiblesPorPagina = 6;
  const [confirmModal, setConfirmModal] = useState({ open: false, turnoId: null });
  const [reservaModal, setReservaModal] = useState({ open: false, status: 'loading', message: '' });

  const userData = authService.getUserData();

  useEffect(() => {
    cargarOdontologos();
    cargarMisTurnos();
  }, []);

  useEffect(() => {
    // Resetear paginación cuando cambia la vista
    setPaginaActual(1);
  }, [vistaActual]);

  useEffect(() => {
    // Resetear paginación de disponibles cuando cambia la fecha o búsqueda
    setPaginaActualDisponibles(1);
  }, [fechaFiltro, turnosDisponibles]);

  const cargarOdontologos = async () => {
    try {
      const data = await getOdontologos();
      setOdontologos(data);
    } catch (err) {
    }
  };

  const cargarMisTurnos = async () => {
    try {
      const data = await getMisTurnos();
      setMisTurnos(data);
      setPaginaActual(1); // Resetear a la primera página cuando cargan los turnos
    } catch (err) {
    }
  };

  const buscarTurnos = async () => {
    if (!odontologoSeleccionado) {
      setError('Por favor seleccione un odontólogo');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getTurnosDisponibles(odontologoSeleccionado);
      setTurnosDisponibles(data);
      if (data.length === 0) {
        setError('No hay turnos disponibles para este odontólogo');
      }
    } catch (err) {
      setError('Error al buscar turnos disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleReservarTurno = async (turnoId) => {
    setReservaModal({ open: true, status: 'loading', message: '' });
    setError('');
    setSuccess('');

    try {
      await reservarTurno(turnoId, motivo);
      setReservaModal({ open: true, status: 'success', message: '¡Tu turno fue reservado exitosamente!' });
      setTurnoSeleccionado(null);
      setMotivo('');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al reservar el turno';
      setReservaModal({ open: true, status: 'error', message: errorMsg });
    }
  };

  const handleCerrarReservaModal = () => {
    const wasSuccess = reservaModal.status === 'success';
    setReservaModal({ open: false, status: 'loading', message: '' });
    if (wasSuccess) {
      buscarTurnos();
      cargarMisTurnos();
    }
  };

  const handleCancelarTurno = async (turnoId) => {
    setConfirmModal({ open: true, turnoId });
  };

  const confirmarCancelacion = async () => {
    const turnoId = confirmModal.turnoId;
    setConfirmModal({ open: false, turnoId: null });

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await cancelarTurno(turnoId);
      setSuccess('Turno cancelado exitosamente');
      cargarMisTurnos();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cancelar el turno');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaHora) => {
    // El backend ya envía la fecha en hora local de Argentina
    // Simplemente parseamos sin conversión de timezone
    const fecha = new Date(fechaHora);

    return fecha.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
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

  const getTurnosFiltrados = () => {
    return turnosDisponibles.filter(turno => {
      const fechaTurno = new Date(turno.fecha_hora);
      const fechaFiltroDate = new Date(fechaFiltro + 'T00:00:00');

      // Comparar solo la fecha (día/mes/año) en hora local
      return fechaTurno.getFullYear() === fechaFiltroDate.getFullYear() &&
        fechaTurno.getMonth() === fechaFiltroDate.getMonth() &&
        fechaTurno.getDate() === fechaFiltroDate.getDate();
    });
  };

  const getTurnosDisponiblesPaginados = () => {
    const turnosFiltrados = getTurnosFiltrados();
    const inicio = (paginaActualDisponibles - 1) * turnosDisponiblesPorPagina;
    const fin = inicio + turnosDisponiblesPorPagina;
    return turnosFiltrados.slice(inicio, fin);
  };

  const totalPaginasDisponibles = Math.ceil(getTurnosFiltrados().length / turnosDisponiblesPorPagina);

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

  const getTurnosOrganizados = () => {
    // Separar turnos pendientes y pasados/cancelados
    const pendientes = misTurnos.filter(t =>
      t.estado === 'reservado' || t.estado === 'confirmado'
    ).sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

    const pasados = misTurnos.filter(t =>
      t.estado === 'completado' || t.estado === 'cancelado'
    ).sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));

    return [...pendientes, ...pasados];
  };

  const getTurnosPaginados = () => {
    const turnosOrganizados = getTurnosOrganizados();
    const inicio = (paginaActual - 1) * turnosPorPagina;
    const fin = inicio + turnosPorPagina;
    return turnosOrganizados.slice(inicio, fin);
  };

  const totalPaginas = Math.ceil(misTurnos.length / turnosPorPagina);

  // Mapa de turnos disponibles por día para el calendario
  const turnosDisponiblesPorDia = useMemo(() => {
    const mapa = {};
    turnosDisponibles.forEach(t => {
      const fechaTurno = new Date(t.fecha_hora);
      const dateStr = `${fechaTurno.getFullYear()}-${String(fechaTurno.getMonth() + 1).padStart(2, '0')}-${String(fechaTurno.getDate()).padStart(2, '0')}`;
      mapa[dateStr] = (mapa[dateStr] || 0) + 1;
    });
    return mapa;
  }, [turnosDisponibles]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      <div className="flex-grow bg-white/5 backdrop-blur-sm p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Solicitar Turno</h1>
              <p className="text-slate-200 mt-2">{userData.nombre} {userData.apellido}</p>
            </div>
            <Button onClick={() => navigate('/home-paciente')} variant="secondary" className="w-full sm:w-auto">
              Volver al Inicio
            </Button>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button
              onClick={() => setVistaActual('buscar')}
              className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${vistaActual === 'buscar'
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Buscar Turnos
            </button>
            <button
              onClick={() => setVistaActual('misTurnos')}
              className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${vistaActual === 'misTurnos'
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              Mis Turnos ({misTurnos.filter(t => t.estado === 'reservado' || t.estado === 'confirmado').length})
            </button>
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

          {/* Vista Buscar Turnos */}
          {vistaActual === 'buscar' && (
            <div className="space-y-6">
              {/* Seleccionar Odontólogo */}
              <Card>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Seleccionar Odontólogo</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Odontólogo
                    </label>
                    <select
                      value={odontologoSeleccionado}
                      onChange={(e) => {
                        setOdontologoSeleccionado(e.target.value);
                        setTurnosDisponibles([]);
                        setError('');
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Seleccione un odontólogo</option>
                      {odontologos.map((odontologo) => (
                        <option key={odontologo.id} value={odontologo.id}>
                          Dr. {odontologo.user.first_name} {odontologo.user.last_name} - {odontologo.especialidad}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button onClick={buscarTurnos} disabled={loading || !odontologoSeleccionado}>
                    {loading ? 'Buscando...' : 'Buscar Turnos Disponibles'}
                  </Button>
                </div>
              </Card>

              {/* Turnos Disponibles */}
              {turnosDisponibles.length > 0 && (
                <Card>
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">
                      Turnos Disponibles
                    </h2>

                    {/* Calendario */}
                    <TurnoCalendar
                      turnosPorDia={turnosDisponiblesPorDia}
                      fechaSeleccionada={fechaFiltro}
                      onSelectFecha={setFechaFiltro}
                      highlightColor="green"
                      label="disponibles"
                      totalLabel="Total disponibles"
                    />

                    {/* Navegación por día */}
                    <div className="bg-gray-100 p-4 rounded-lg">
                      {/* Mobile: Layout vertical */}
                      <div className="md:hidden space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={fechaFiltro}
                            onChange={(e) => setFechaFiltro(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={irHoy}
                            className="whitespace-nowrap"
                          >
                            Hoy
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={retrocederDia}
                            className="flex-1"
                          >
                            ← Anterior
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={avanzarDia}
                            className="flex-1"
                          >
                            Siguiente →
                          </Button>
                        </div>
                      </div>

                      {/* Desktop: Layout horizontal */}
                      <div className="hidden md:flex items-center justify-between gap-4">
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
                    </div>

                    <p className="text-sm text-gray-600 mt-3 text-center">
                      Mostrando <span className="font-semibold">{getTurnosFiltrados().length}</span> turnos disponibles para el {new Date(fechaFiltro + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  {getTurnosFiltrados().length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay turnos disponibles para esta fecha</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getTurnosDisponiblesPaginados().map((turno) => (
                          <div
                            key={turno.id}
                            className="p-4 bg-gray-50 rounded-lg border-2 border-transparent hover:border-teal-500 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {formatearFecha(turno.fecha_hora)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Duración: {turno.duracion_minutos} minutos
                                </p>
                                {turno.motivo && (
                                  <p className="text-sm text-gray-500 mt-1">{turno.motivo}</p>
                                )}
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(turno.estado)}`}>
                                {turno.estado}
                              </span>
                            </div>

                            {turnoSeleccionado === turno.id ? (
                              <div className="space-y-3 mt-4">
                                <textarea
                                  value={motivo}
                                  onChange={(e) => setMotivo(e.target.value)}
                                  placeholder="Motivo de la consulta (opcional)"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  rows="2"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleReservarTurno(turno.id)}
                                    disabled={loading}
                                  >
                                    Confirmar Reserva
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setTurnoSeleccionado(null);
                                      setMotivo('');
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full mt-3"
                                onClick={() => setTurnoSeleccionado(turno.id)}
                              >
                                Reservar este Turno
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Paginación */}
                      {totalPaginasDisponibles > 1 && (
                        <div className="mt-6">
                          <Pagination
                            currentPage={paginaActualDisponibles}
                            totalPages={totalPaginasDisponibles}
                            onPageChange={setPaginaActualDisponibles}
                            itemsPerPage={turnosDisponiblesPorPagina}
                            totalItems={getTurnosFiltrados().length}
                          />
                        </div>
                      )}
                    </>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Vista Mis Turnos */}
          {vistaActual === 'misTurnos' && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Mis Turnos</h2>
                {misTurnos.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No tienes turnos programados</p>
                    <Button onClick={() => setVistaActual('buscar')}>
                      Buscar Turnos Disponibles
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-4">
                      {getTurnosPaginados().map((turno) => (
                        <div
                          key={turno.id}
                          className="p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-semibold text-gray-800">
                                  {formatearFecha(turno.fecha_hora)}
                                </p>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(turno.estado)}`}>
                                  {turno.estado}
                                </span>
                              </div>
                              {turno.odontologo && (
                                <p className="text-sm text-gray-600">
                                  Odontólogo: {turno.odontologo.nombre_completo}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">
                                Duración: {turno.duracion_minutos} minutos
                              </p>
                              {turno.motivo && (
                                <p className="text-sm text-gray-500 mt-1">Motivo: {turno.motivo}</p>
                              )}
                            </div>
                            {(turno.estado === 'reservado' || turno.estado === 'confirmado') && (
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleCancelarTurno(turno.id)}
                                disabled={loading}
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Pagination
                      currentPage={paginaActual}
                      totalPages={totalPaginas}
                      onPageChange={setPaginaActual}
                      itemsPerPage={turnosPorPagina}
                      totalItems={misTurnos.length}
                    />
                  </>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
      <Footer />

      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, turnoId: null })}
        onConfirm={confirmarCancelacion}
        title="Cancelar Turno"
        message="¿Estás seguro de que querés cancelar este turno? Esta acción no se puede deshacer."
        confirmText="Sí, cancelar turno"
        cancelText="No, mantener turno"
        variant="danger"
      />

      <LoadingModal
        isOpen={reservaModal.open}
        status={reservaModal.status}
        message={reservaModal.message}
        onClose={handleCerrarReservaModal}
      />
    </div>
  );
};

export default SolicitarTurnoPage;
