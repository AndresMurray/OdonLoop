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
      const ahora = new Date();
      // Filtrar solo turnos reservados o confirmados que aún no han pasado
      const turnosPendientes = turnos
        .filter(t => {
          if (t.estado !== 'reservado' && t.estado !== 'confirmado') return false;
          const fechaTurno = new Date(t.fecha_hora);
          return fechaTurno > ahora;
        })
        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
      
      if (turnosPendientes.length > 0) {
        setProximoTurno(turnosPendientes[0]);
      }
    } catch (error) {
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
                Panel de Paciente
              </h1>
              <p className="text-slate-400 mt-1 text-sm font-semibold">
                Bienvenido, {userData.first_name} {userData.last_name}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow relative z-10">
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
                <button 
                  className="bg-white text-blue-600 hover:bg-slate-100 active:scale-95 transition-all duration-150 rounded-lg font-bold px-8 py-3 text-lg flex items-center justify-center shadow-md cursor-pointer"
                  onClick={() => navigate('/solicitar-turno')}
                >
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Solicitar Turno
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximo Turno */}
        <div className="mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <CalendarIcon className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-300 mb-1">Próximo Turno</h3>
              {loading ? (
                <>
                  <p className="text-3xl font-black text-white mb-1">-</p>
                  <p className="text-sm text-slate-400">Cargando...</p>
                </>
              ) : proximoTurno ? (
                <>
                  <p className="text-xl font-bold text-white mb-1">
                    {formatearFecha(proximoTurno.fecha_hora)}
                  </p>
                  {proximoTurno.odontologo && (
                    <p className="text-sm text-slate-300 mb-1">
                      Dr. {proximoTurno.odontologo.nombre_completo}
                    </p>
                  )}
                  <p className="text-sm text-slate-400">
                    Duración: {proximoTurno.duracion_minutos} minutos
                  </p>
                  {proximoTurno.motivo && (
                    <p className="text-sm text-slate-400 mt-2">
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
                  <p className="text-3xl font-black text-white mb-1">-</p>
                  <p className="text-sm text-slate-400">No tienes turnos programados</p>
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
