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

  // Calcular turnos activos de hoy en adelante
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
      console.error('Error al cargar turnos:', err);
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const retrocederDia = () => {
    const fecha = new Date(fechaSeleccionada + 'T00:00:00');
    fecha.setDate(fecha.getDate() - 1);
    setFechaSeleccionada(fecha.toISOString().split('T')[0]);
    setPaginaReservados(1);
    setPaginaDisponibles(1);
  };

  const avanzarDia = () => {
    const fecha = new Date(fechaSeleccionada + 'T00:00:00');
    fecha.setDate(fecha.getDate() + 1);
    setFechaSeleccionada(fecha.toISOString().split('T')[0]);
    setPaginaReservados(1);
    setPaginaDisponibles(1);
  };

  const irHoy = () => {
    setFechaSeleccionada(getToday());
    setPaginaReservados(1);
    setPaginaDisponibles(1);
  };

  const formatearFechaLarga = (fechaStr) => {
    const fecha = new Date(fechaStr + 'T00:00:00');
    return fecha.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const formatearFecha = (fechaHoraStr) => {
    // fechaHoraStr viene como "YYYY-MM-DDTHH:MM:SS"
    const [, horaPart] = fechaHoraStr.split('T');
    const [hh, mm] = horaPart.split(':');
    return `${hh}:${mm} hs`;
  };

  const getTurnosPorFechaYEstado = (estado) => {
    return turnos.filter(t => {
      const cumpleEstado = estado === 'reservados'
        ? (t.estado === 'reservado' || t.estado === 'confirmado')
        : t.estado === 'disponible';

      if (!cumpleEstado) return false;

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
      disponible: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      reservado: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      confirmado: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      completado: 'bg-slate-800 text-slate-400 border border-slate-700',
      cancelado: 'bg-red-500/10 text-red-400 border border-red-500/20'
    };
    return colores[estado] || 'bg-slate-800 text-slate-400 border border-slate-700';
  };

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col relative overflow-hidden text-white">
      {/* Background decorations / Glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[15%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none z-0"></div>
      
      <Navbar />

      {/* Header with User Info */}
      <header className="bg-slate-900/40 border-b border-white/5 backdrop-blur-md sticky top-16 z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
                Panel de Odontólogo
              </h1>
              <p className="text-slate-400 mt-1 text-sm font-semibold">
                Bienvenido, Dr. {userData.first_name} {userData.last_name}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Botón destacado de Gestión de Turnos */}
          <div className="mb-8 animate-fadeIn">
            <Card className="bg-gradient-to-r from-blue-900/80 to-indigo-950/80 border border-blue-500/30">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between text-white gap-4">
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <h2 className="text-xl sm:text-2xl font-bold">Gestión de Turnos</h2>
                      {!userData?.plan?.tiene_turnos && (
                        <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Plan Medio / Premium
                        </span>
                      )}
                    </div>
                    <p className="text-blue-200 text-sm sm:text-base">
                      {userData?.plan?.tiene_turnos 
                        ? 'Administra, crea y visualiza todos tus turnos de manera eficiente'
                        : 'Agenda de turnos y recordatorios automáticos por email. Disponible en Plan Medio y Premium.'}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm font-bold whitespace-nowrap w-full md:w-auto flex items-center justify-center gap-2"
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
                        <CalendarIcon className="w-4 h-4" />
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
            <Card className="bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/30">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between text-white gap-4">
                  <div className="text-center md:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Mis Pacientes</h2>
                    <p className="text-emerald-200 text-sm sm:text-base">
                      Accede al seguimiento de tus pacientes y su historial clínico
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white border-none px-6 sm:px-8 py-2.5 sm:py-3 text-sm font-bold whitespace-nowrap w-full md:w-auto flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
                    onClick={() => navigate('/mis-pacientes')}
                  >
                    <Users className="w-4 h-4" />
                    Ver Pacientes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barra de almacenamiento */}
          {storageInfo && (
            <div className="mb-8">
              <Card className="p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                  <HardDrive className="w-5 h-5 text-blue-400" />
                  <h3 className="text-base font-bold text-white">Almacenamiento</h3>
                </div>
                <div className="w-full bg-slate-950/80 rounded-full h-4 overflow-hidden border border-slate-800">
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
                <div className="flex justify-between mt-2 text-xs text-slate-400">
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
                    <h3 className="text-xl font-bold text-white mb-4">
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
                    <span className="text-sm font-semibold text-slate-350 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-md">
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
                    <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
                      <span>Turnos Agendados</span>
                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full font-bold">
                        {getTurnosPorFechaYEstado('reservados').length}
                      </span>
                    </CardTitle>
                    <CardDescription>Pacientes citados para esta fecha</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getTurnosPorFechaYEstado('reservados').length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        No hay turnos agendados para este día.
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {getTurnosPaginados('reservados', paginaReservados).map((turno) => (
                            <div
                              key={turno.id}
                              className="border border-slate-850 bg-slate-950/40 rounded-lg p-4 hover:border-slate-800 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-white">
                                    {turno.paciente_nombre || 'Paciente no registrado'}
                                  </h4>
                                  <p className="text-sm text-slate-400 mt-1">
                                    🕒 {formatearFecha(turno.fecha_hora)}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Duración: {turno.duracion_minutos} min
                                  </p>
                                  {turno.motivo && (
                                    <p className="text-xs text-slate-350 mt-2 bg-slate-900 border border-slate-800 p-2 rounded italic">
                                      "{turno.motivo}"
                                    </p>
                                  )}
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getEstadoColor(turno.estado)}`}>
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
                    <CardTitle className="text-lg font-bold text-white flex items-center justify-between">
                      <span>Turnos Disponibles</span>
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full font-bold">
                        {getTurnosPorFechaYEstado('disponibles').length}
                      </span>
                    </CardTitle>
                    <CardDescription>Horarios libres para reserva online</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getTurnosPorFechaYEstado('disponibles').length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        No hay horarios disponibles creados para este día.
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {getTurnosPaginados('disponibles', paginaDisponibles).map((turno) => (
                            <div
                              key={turno.id}
                              className="border border-slate-850 bg-slate-950/40 rounded-lg p-4 hover:border-slate-800 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-white">
                                    🕒 {formatearFecha(turno.fecha_hora)}
                                  </p>
                                  <div className="flex gap-2 items-center mt-1">
                                    {!turno.visible && (
                                      <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-bold">
                                        🚫 Oculto
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Duración: {turno.duracion_minutos} min
                                  </p>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getEstadoColor(turno.estado)}`}>
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
                className="bg-blue-600 hover:bg-blue-505 border-none text-white px-6 py-2.5 font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-blue-500/15"
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
