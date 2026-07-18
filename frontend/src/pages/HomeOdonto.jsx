import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, HardDrive, Lock } from 'lucide-react';
import { authService } from '../api/authService';
import { userService } from '../api/userService';
import { getMisTurnos } from '../api/turnoService';
import { getMiStorage } from '../api/odontologoService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';
import TurnoCalendar from '../components/TurnoCalendar';
import { PlanModal } from '../components';
import { getToday } from '../utils/dateUtils';

const HomeOdonto = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(() => authService.getUserData());
  const [planesModalOpen, setPlanesModalOpen] = useState(false);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    return getToday();
  });

  // Estados de paginación
  const [paginaReservados, setPaginaReservados] = useState(1);
  const [paginaDisponibles, setPaginaDisponibles] = useState(1);
  const ITEMS_POR_PAGINA = 3;

  // Storage
  const [storageInfo, setStorageInfo] = useState(null);

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
    const syncProfile = async () => {
      try {
        const latestProfile = await userService.getProfile();
        localStorage.setItem('user_data', JSON.stringify(latestProfile));
        setUserData(latestProfile);
      } catch (err) {
        console.error('Error syncing profile:', err);
      }
    };
    syncProfile();
    cargarTurnos();
    cargarStorage();
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

  const cargarStorage = async () => {
    try {
      const data = await getMiStorage();
      setStorageInfo(data);
    } catch (err) {
      // Silencioso - no es crítico
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

      // Comparar directamente el string de fecha (el backend envía hora local sin timezone)
      const fechaTurno = t.fecha_hora.split('T')[0];
      return fechaTurno === fechaSeleccionada;
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
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <h2 className="text-xl sm:text-2xl font-bold">Gestión de Turnos</h2>
                      {!userData?.plan?.tiene_turnos && (
                        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Plan Medio / Premium
                        </span>
                      )}
                    </div>
                    <p className="text-blue-100 text-sm sm:text-base">
                      {userData?.plan?.tiene_turnos 
                        ? 'Administra, crea y visualiza todos tus turnos de manera eficiente'
                        : 'Agenda de turnos y recordatorios automáticos por email. Disponible en Plan Medio y Premium.'}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg whitespace-nowrap w-full md:w-auto flex items-center justify-center gap-2"
                    onClick={() => {
                      if (userData?.plan?.tiene_turnos) {
                        navigate('/gestion-turnos');
                      } else {
                        setPlanesModalOpen(true);
                      }
                    }}
                  >
                    {userData?.plan?.tiene_turnos ? (
                      <>
                        <CalendarIcon className="w-5 h-5" />
                        Ir a Gestión
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Ver Planes
                      </>
                    )}
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

          {/* Barra de almacenamiento */}
          {storageInfo && (
            <div className="mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <HardDrive className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Almacenamiento</h3>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${
                      (storageInfo.storage_used / storageInfo.storage_limit) > 0.9
                        ? 'bg-red-500'
                        : (storageInfo.storage_used / storageInfo.storage_limit) > 0.7
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, (storageInfo.storage_used / storageInfo.storage_limit) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>{formatBytes(storageInfo.storage_used)} usado</span>
                  <span>{formatBytes(storageInfo.storage_available)} disponible de {formatBytes(storageInfo.storage_limit)}</span>
                </div>
              </Card>
            </div>
          )}

          {/* Selector de Fecha / Calendario condicionado */}
          {userData?.plan?.tiene_turnos ? (
            <>
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

                  <div className="flex justify-between items-center mt-6">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retrocederDia}
                        className="flex items-center"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Día anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={irHoy}
                      >
                        Hoy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={avanzarDia}
                        className="flex items-center"
                      >
                        Día siguiente
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                      {formatearFechaLarga(fechaSeleccionada)}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Listados de Turnos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Reservados y Confirmados */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center justify-between">
                      <span>Turnos Agendados</span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                        {getTurnosPorFechaYEstado('reservados').length}
                      </span>
                    </CardTitle>
                    <CardDescription>Pacientes citados para esta fecha</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getTurnosPorFechaYEstado('reservados').length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No hay turnos agendados para este día.
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {getTurnosPaginados('reservados', paginaReservados).map((turno) => (
                            <div
                              key={turno.id}
                              className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {turno.paciente_nombre || 'Paciente no registrado'}
                                  </h4>
                                  <p className="text-sm text-gray-500 mt-1">
                                    🕒 {formatearFecha(turno.fecha_hora)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Duración: {turno.duracion_minutos} min
                                  </p>
                                  {turno.motivo && (
                                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded italic">
                                      "{turno.motivo}"
                                    </p>
                                  )}
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

                {/* Disponibles */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center justify-between">
                      <span>Turnos Disponibles</span>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                        {getTurnosPorFechaYEstado('disponibles').length}
                      </span>
                    </CardTitle>
                    <CardDescription>Horarios libres para reserva online</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getTurnosPorFechaYEstado('disponibles').length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No hay horarios disponibles creados para este día.
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {getTurnosPaginados('disponibles', paginaDisponibles).map((turno) => (
                            <div
                              key={turno.id}
                              className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    🕒 {formatearFecha(turno.fecha_hora)}
                                  </p>
                                  <div className="flex gap-2 items-center mt-1">
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
            </>
          ) : (
            <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-white relative overflow-hidden shadow-2xl">
              {/* Decorative glows */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
              
              <h3 className="text-2xl font-bold mb-3 flex items-center justify-center gap-2">
                <Lock className="w-6 h-6 text-amber-400" />
                Automatizá tu agenda con el Plan Medio
              </h3>
              <p className="text-slate-400 max-w-xl mx-auto mb-6 text-sm leading-relaxed">
                Habilitá la agenda interactiva de turnos y permití que tus pacientes agenden de forma online. Recibirán confirmaciones y recordatorios automáticos de turnos por email 24 horas antes de su cita.
              </p>
              <Button
                onClick={() => setPlanesModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 border-none text-white px-6 py-2.5 font-bold rounded-xl"
              >
                Conocé los planes de suscripción
              </Button>
            </div>
          )}
        </div>
      </main>
      <PlanModal isOpen={planesModalOpen} onClose={() => setPlanesModalOpen(false)} />
      <Footer />
    </div>
  );
};

export default HomeOdonto;
