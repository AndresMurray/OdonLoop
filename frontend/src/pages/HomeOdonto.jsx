import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { authService } from '../api/authService';
import { getMisTurnos } from '../api/turnoService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Pagination from '../components/Pagination';

const HomeOdonto = () => {
  const navigate = useNavigate();
  const [userData] = useState(() => authService.getUserData());
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  
  // Estados de paginación
  const [paginaReservados, setPaginaReservados] = useState(1);
  const [paginaDisponibles, setPaginaDisponibles] = useState(1);
  const ITEMS_POR_PAGINA = 3;

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
    const hoy = new Date();
    setFechaSeleccionada(hoy.toISOString().split('T')[0]);
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
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between text-white">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold mb-2">Gestión de Turnos</h2>
                    <p className="text-blue-100">
                      Administra, crea y visualiza todos tus turnos de manera eficiente
                    </p>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
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
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between text-white">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold mb-2">Mis Pacientes</h2>
                    <p className="text-emerald-100">
                      Accede al seguimiento de tus pacientes y su historial clínico
                    </p>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-3 text-lg"
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={retrocederDia}
                    className="flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <input
                        type="date"
                        value={fechaSeleccionada}
                        onChange={(e) => {
                          setFechaSeleccionada(e.target.value);
                          setPaginaReservados(1);
                          setPaginaDisponibles(1);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={irHoy}
                    >
                      Hoy
                    </Button>
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={avanzarDia}
                    className="flex items-center"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-3 text-center">
                  Viendo turnos para el {formatearFechaLarga(fechaSeleccionada)}
                </p>
              </CardContent>
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
                          className="p-4 bg-green-50 rounded-lg border border-green-100"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {formatearFecha(turno.fecha_hora)}
                              </p>
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
