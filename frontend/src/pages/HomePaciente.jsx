import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Button from '../components/Button';
import { 
  Calendar as CalendarIcon
} from 'lucide-react';
import { authService } from '../api/authService';
import { getMisTurnos } from '../api/turnoService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HomePaciente = () => {
  const navigate = useNavigate();
  const [userData] = useState(() => authService.getUserData());
  const [proximoTurno, setProximoTurno] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData) {
      navigate('/login?tipo=paciente');
      return;
    }
    if (userData.tipo_usuario !== 'paciente') {
      navigate('/');
      return;
    }
    cargarProximoTurno();
  }, [navigate, userData]);

  const cargarProximoTurno = async () => {
    try {
      setLoading(true);
      const turnos = await getMisTurnos();
      // Filtrar solo turnos reservados o confirmados y ordenar por fecha
      const turnosPendientes = turnos
        .filter(t => t.estado === 'reservado' || t.estado === 'confirmado')
        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
      
      if (turnosPendientes.length > 0) {
        setProximoTurno(turnosPendientes[0]);
      }
    } catch (error) {
      console.error('Error al cargar próximo turno:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaHora) => {
    const fecha = new Date(fechaHora);
    const año = fecha.getUTCFullYear();
    const mes = fecha.getUTCMonth();
    const dia = fecha.getUTCDate();
    const horas = fecha.getUTCHours();
    const minutos = fecha.getUTCMinutes();
    const fechaLocal = new Date(año, mes, dia, horas, minutos);
    
    return fechaLocal.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
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
                Panel de Paciente
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenido, {userData.first_name} {userData.last_name}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botón destacado de Solicitar Turno */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 border-none">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between text-white">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold mb-2">¿Necesitas un turno?</h2>
                  <p className="text-blue-100">
                    Solicita tu turno de manera rápida y sencilla
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg"
                  onClick={() => navigate('/solicitar-turno')}
                >
                  <CalendarIcon className="w-5 h-5 mr-2 inline" />
                  Solicitar Turno
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximo Turno */}
        <div className="mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <CalendarIcon className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Próximo Turno</h3>
              {loading ? (
                <>
                  <p className="text-3xl font-bold text-gray-900 mb-1">-</p>
                  <p className="text-sm text-gray-500">Cargando...</p>
                </>
              ) : proximoTurno ? (
                <>
                  <p className="text-xl font-bold text-gray-900 mb-1">
                    {formatearFecha(proximoTurno.fecha_hora)}
                  </p>
                  {proximoTurno.odontologo && (
                    <p className="text-sm text-gray-600 mb-1">
                      Dr. {proximoTurno.odontologo.nombre_completo}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Duración: {proximoTurno.duracion_minutos} minutos
                  </p>
                  {proximoTurno.motivo && (
                    <p className="text-sm text-gray-500 mt-2">
                      Motivo: {proximoTurno.motivo}
                    </p>
                  )}
                  <div className="mt-4">
                    <Button 
                      size="sm"
                      onClick={() => navigate('/solicitar-turno', { state: { vistaInicial: 'misTurnos' } })}
                    >
                      Ver todos mis turnos
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900 mb-1">-</p>
                  <p className="text-sm text-gray-500">No tienes turnos programados</p>
                  <div className="mt-4">
                    <Button 
                      size="sm"
                      onClick={() => navigate('/solicitar-turno')}
                    >
                      Solicitar turno
                    </Button>
                  </div>
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

export default HomePaciente;
