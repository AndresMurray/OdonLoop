import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Calendar } from '../components/Calendar';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Settings, 
  LogOut,
  FileText,
  User,
  Heart
} from 'lucide-react';
import { authService } from '../api/authService';

const HomePaciente = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userData] = useState(() => authService.getUserData());

  useEffect(() => {
    if (!userData) {
      navigate('/login?tipo=paciente');
      return;
    }
    if (userData.tipo_usuario !== 'paciente') {
      navigate('/');
      return;
    }
  }, [navigate, userData]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  // Datos de ejemplo para las estadísticas
  const stats = [
    {
      icon: <CalendarIcon className="w-8 h-8 text-blue-600" />,
      title: 'Próximo Turno',
      value: 'Hoy',
      description: '15:00 hs - Consulta',
    },
    {
      icon: <FileText className="w-8 h-8 text-green-600" />,
      title: 'Historial',
      value: '12',
      description: 'Consultas realizadas',
    },
    {
      icon: <Heart className="w-8 h-8 text-red-600" />,
      title: 'Estado',
      value: 'Activo',
      description: 'Sin tratamientos pendientes',
    },
  ];

  const proximosTurnos = [
    { fecha: '2026-02-06', hora: '15:00', doctor: 'Dr. Juan Pérez', tipo: 'Consulta general' },
    { fecha: '2026-02-13', hora: '10:30', doctor: 'Dr. Juan Pérez', tipo: 'Control' },
    { fecha: '2026-02-20', hora: '16:00', doctor: 'Dra. María González', tipo: 'Limpieza dental' },
  ];

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* Header */}
      <header className="bg-white shadow-md">
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
            <div className="flex gap-3">
              <Button variant="secondary">
                <Settings className="w-5 h-5 mr-2 inline" />
                Configuración
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-5 h-5 mr-2 inline" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  onClick={() => {
                    console.log('Navegar a solicitar turno');
                  }}
                >
                  <CalendarIcon className="w-5 h-5 mr-2 inline" />
                  Solicitar Turno
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">{stat.icon}</div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </h3>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendario */}
          <Card>
            <CardHeader>
              <CardTitle>Calendario</CardTitle>
              <CardDescription>Selecciona una fecha para ver tus turnos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Próximos turnos */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Turnos</CardTitle>
              <CardDescription>Tus citas programadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proximosTurnos.map((turno, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-center justify-center bg-blue-600 text-white rounded-lg w-16 h-16">
                        <span className="text-xs font-medium">
                          {new Date(turno.fecha).toLocaleDateString('es-ES', { month: 'short' })}
                        </span>
                        <span className="text-xl font-bold">
                          {new Date(turno.fecha).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {turno.hora} - {turno.tipo}
                        </p>
                        <p className="text-sm text-gray-600">{turno.doctor}</p>
                      </div>
                    </div>
                    <Button variant="secondary" className="text-sm">
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
              {proximosTurnos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tienes turnos programados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button className="py-6 flex flex-col items-center">
                  <User className="w-6 h-6 mb-2" />
                  Mi Perfil
                </Button>
                <Button variant="secondary" className="py-6 flex flex-col items-center">
                  <FileText className="w-6 h-6 mb-2" />
                  Historial Médico
                </Button>
                <Button variant="secondary" className="py-6 flex flex-col items-center">
                  <CalendarIcon className="w-6 h-6 mb-2" />
                  Mis Turnos
                </Button>
                <Button variant="secondary" className="py-6 flex flex-col items-center">
                  <Settings className="w-6 h-6 mb-2" />
                  Configuración
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HomePaciente;
