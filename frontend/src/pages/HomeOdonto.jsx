import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { authService } from '../api/authService';
import { getMisTurnos } from '../api/turnoService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import TurnoCalendar from '../components/TurnoCalendar';
import { getToday } from '../utils/dateUtils';

const HomeOdonto = () => {
  const navigate = useNavigate();
  const [userData] = useState(() => authService.getUserData());
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    return getToday();
  });

  // Estados de paginación
  const [paginaReservados, setPaginaReservados] = useState(1);
  const [paginaDisponibles, setPaginaDisponibles] = useState(1);
  const ITEMS_POR_PAGINA = 3;

  // Calcular turnos activos (disponibles, reservados, confirmados) de hoy en adelante
  const turnosActivosPorDia = useMemo(() => {
    const mapa = {};
    const hoy = getToday();
    turnos.forEach(t => {
      if (['disponible', 'reservado', 'confirmado'].includes(t.estado)) {
        const [fechaStr] = t.fecha_hora.split('T');
        if (fechaStr >= hoy) {
          mapa[fechaStr] = (mapa[fechaStr] || 0) + 1;
        }
      }
    });
    return mapa;
  }, [turnos]);

  useEffect(() => {
    if (!userData) {
      navigate('/login?tipo=odontologo');
      return;
    }
    if (userData.tipo_usuario !== 'odontologo') {
      navigate('/');
      return;
    }
  }, [navigate, userData]);

  useEffect(() => {
    cargarTurnos();
  }, []);

  const cargarTurnos = async () => {
    setLoading(true);
    try {
      const data = await getMisTurnos();
      setTurnos(data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaHora) => {
    // El backend ya envía la fecha en hora local de Argentina (sin timezone)
    // Solo necesitamos parsearla y formatearla directamente
    const fecha = new Date(fechaHora);

    const horaStr = String(fecha.getHours()).padStart(2, '0');
    const minStr = String(fecha.getMinutes()).padStart(2, '0');
    const diaStr = String(fecha.getDate()).padStart(2, '0');
    const mesStr = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();

    return `${horaStr}:${minStr} - ${diaStr}/${mesStr}/${año}`;
  };

  const formatearFechaLarga = (fechaISO) => {
    const fecha = new Date(fechaISO + 'T00:00:00');
    const opciones = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    };
    return fecha.toLocaleDateString('es-AR', opciones);
  };

  const avanzarDia = () => {
    const fecha = new Date(fechaSeleccionada);
    fecha.setDate(fecha.getDate() + 1);
    setFechaSeleccionada(fecha.toISOString().split('T')[0]);
    setPaginaReservados(1);
    setPaginaDisponibles(1);
  };

  const retrocederDia = () => {
    const fecha = new Date(fechaSeleccionada);
    fecha.setDate(fecha.getDate() - 1);
    setFechaSeleccionada(fecha.toISOString().split('T')[0]);
    setPaginaReservados(1);
    setPaginaDisponibles(1);
  };

  const irHoy = () => {
    setFechaSeleccionada(getToday());
    setPaginaReservados(1);
    setPaginaDisponibles(1);
  };

  const getTurnosPorFechaYEstado = (estado) => {
    return turnos.filter(t => {
      const cumpleEstado = estado === 'reservados'
        ? (t.estado === 'reservado' || t.estado === 'confirmado')
        : t.estado === 'disponible';

      if (!cumpleEstado) return false;

      const fechaTurno = new Date(t.fecha_hora);
      const fechaFiltro = new Date(fechaSeleccionada + 'T00:00:00');

      // Comparar solo la fecha (día/mes/año) en UTC
      return fechaTurno.getUTCFullYear() === fechaFiltro.getUTCFullYear() &&
        fechaTurno.getUTCMonth() === fechaFiltro.getUTCMonth() &&
        fechaTurno.getUTCDate() === fechaFiltro.getUTCDate();
    });
  };

  const getTurnosPaginados = (estado, pagina) => {
    const turnosFiltrados = getTurnosPorFechaYEstado(estado);
    const inicio = (pagina - 1) * ITEMS_POR_PAGINA;
    const fin = inicio + ITEMS_POR_PAGINA;
    return turnosFiltrados.slice(inicio, fin);
  };

  const getTotalPaginas = (estado) => {
    const turnosFiltrados = getTurnosPorFechaYEstado(estado);
    return Math.ceil(turnosFiltrados.length / ITEMS_POR_PAGINA);
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

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />

      {/* Header with User Info */}
      <header className="bg-white/95 shadow-md backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Odontólogo
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenido, Dr. {userData.first_name} {userData.last_name}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Botón destacado de Gestión de Turnos */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between text-white gap-4">
                  <div className="text-center md:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Gestión de Turnos</h2>
                    <p className="text-blue-100 text-sm sm:text-base">
                      Administra, crea y visualiza todos tus turnos de manera eficiente
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg whitespace-nowrap w-full md:w-auto"
                    onClick={() => navigate('/gestion-turnos')}
                  >
                    <CalendarIcon className="w-5 h-5 mr-2 inline" />
                    Ir a Gestión
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botón destacado de Mis Pacientes */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 border-none">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between text-white gap-4">
                  <div className="text-center md:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Mis Pacientes</h2>
                    <p className="text-emerald-100 text-sm sm:text-base">
                      Accede al seguimiento de tus pacientes y su historial clínico
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="bg-white text-emerald-600 hover:bg-gray-100 px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg whitespace-nowrap w-full md:w-auto"
                    onClick={() => navigate('/mis-pacientes')}
                  >
                    <Users className="w-5 h-5 mr-2 inline" />
                    Ver Pacientes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selector de Fecha */}
          <div className="mb-6">
            <Card className="p-6 sm:p-8">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Seleccionar Fecha
                </h3>

                {/* Calendario */}
                <TurnoCalendar
                  turnosPorDia={turnosActivosPorDia}
                  fechaSeleccionada={fechaSeleccionada}
                  onSelectFecha={(fecha) => {
                    setFechaSeleccionada(fecha);
                    setPaginaReservados(1);
                    setPaginaDisponibles(1);
                  }}
                  highlightColor="blue"
                  label="turnos activos"
                  showTotal={false}
                />
              </div>

              {/* Separador */}
              <div className="h-px bg-gray-200 mt-2 mb-4"></div>

              {/* Navegación por día */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
                {/* Mobile: Layout vertical */}
                <div className="md:hidden w-full space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-center font-medium text-gray-700 shadow-sm flex items-center justify-center">
                      {new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    <Button
                      size="sm"
                      onClick={irHoy}
                      className="whitespace-nowrap shadow-sm"
                    >
                      Hoy
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={retrocederDia}
                      className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm"
                    >
                      ← Anterior
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={avanzarDia}
                      className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm"
                    >
                      Siguiente →
                    </Button>
                  </div>
                </div>

                {/* Desktop: Layout horizontal */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={retrocederDia}
                  className="hidden md:block shrink-0 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm"
                >
                  ← Día Anterior
                </Button>

                <div className="hidden md:flex items-center gap-3">
                  <div className="relative">
                    <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-center font-medium text-gray-700 shadow-sm flex items-center justify-center min-w-[120px]">
                      {new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={irHoy}
                    className="px-4 shadow-sm"
                  >
                    Hoy
                  </Button>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={avanzarDia}
                  className="hidden md:block shrink-0 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm"
                >
                  Día Siguiente →
                </Button>
              </div>

              <p className="text-sm text-gray-600 mt-4 text-center">
                Viendo turnos para el {formatearFechaLarga(fechaSeleccionada)}
              </p>
            </Card>
          </div>

          {/* Grid de Turnos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Turnos Reservados/Confirmados */}
            <Card>
              <CardHeader>
                <CardTitle>Turnos Reservados</CardTitle>
                <CardDescription>
                  Turnos con pacientes asignados ({getTurnosPorFechaYEstado('reservados').length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">Cargando...</p>
                ) : getTurnosPorFechaYEstado('reservados').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay turnos reservados para esta fecha</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {getTurnosPaginados('reservados', paginaReservados).map((turno) => (
                        <div
                          key={turno.id}
                          className="p-4 bg-blue-50 rounded-lg border border-blue-100"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {formatearFecha(turno.fecha_hora)}
                              </p>
                              {turno.paciente ? (
                                <p className="text-sm text-gray-600 mt-1">
                                  Paciente: {turno.paciente.nombre_completo}
                                </p>
                              ) : turno.nombre_paciente_manual && turno.apellido_paciente_manual ? (
                                <div className="text-sm text-gray-600 mt-1">
                                  <p>Paciente: {turno.nombre_paciente_manual} {turno.apellido_paciente_manual}</p>
                                  {turno.telefono_paciente_manual && (
                                    <p className="text-xs text-gray-500 mt-0.5">📞 {turno.telefono_paciente_manual}</p>
                                  )}
                                </div>
                              ) : null}
                              <p className="text-sm text-gray-500">
                                Duración: {turno.duracion_minutos} min
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(turno.estado)}`}>
                              {turno.estado}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {getTotalPaginas('reservados') > 1 && (
                      <Pagination
                        currentPage={paginaReservados}
                        totalPages={getTotalPaginas('reservados')}
                        onPageChange={setPaginaReservados}
                        itemsPerPage={ITEMS_POR_PAGINA}
                        totalItems={getTurnosPorFechaYEstado('reservados').length}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Turnos Disponibles */}
            <Card>
              <CardHeader>
                <CardTitle>Turnos Disponibles</CardTitle>
                <CardDescription>
                  Espacios libres para reservar ({getTurnosPorFechaYEstado('disponibles').length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">Cargando...</p>
                ) : getTurnosPorFechaYEstado('disponibles').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay turnos disponibles para esta fecha</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {getTurnosPaginados('disponibles', paginaDisponibles).map((turno) => (
                        <div
                          key={turno.id}
                          className={`p-4 rounded-lg border ${turno.visible ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-200'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">
                                  {formatearFecha(turno.fecha_hora)}
                                </p>
                                {!turno.visible && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded-full font-medium">
                                    🚫 Oculto
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                Duración: {turno.duracion_minutos} min
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(turno.estado)}`}>
                              {turno.estado}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {getTotalPaginas('disponibles') > 1 && (
                      <Pagination
                        currentPage={paginaDisponibles}
                        totalPages={getTotalPaginas('disponibles')}
                        onPageChange={setPaginaDisponibles}
                        itemsPerPage={ITEMS_POR_PAGINA}
                        totalItems={getTurnosPorFechaYEstado('disponibles').length}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HomeOdonto;
