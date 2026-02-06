import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Button from '../components/Button';
import { Calendar } from '../components/Calendar';
import { Clock, Users, Calendar as CalendarIcon, Settings, LogOut } from 'lucide-react';
import { authService } from '../api/authService';

const HomeOdonto = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userData] = useState(() => authService.getUserData());

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

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
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
                  Gestión de Turnos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas - Se cargarán desde la API */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Turnos Hoy</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">-</p>
              <p className="text-sm text-gray-500">Cargando...</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Pacientes Activos</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">-</p>
              <p className="text-sm text-gray-500">Este mes</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <CalendarIcon className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Próximos Turnos</h3>
              <p className="text-3xl font-bold text-gray-900 mb-1">-</p>
              <p className="text-sm text-gray-500">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Grid de contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendario */}
          <Card>
            <CardHeader>
              <CardTitle>Calendario</CardTitle>
              <CardDescription>Selecciona una fecha para ver los turnos</CardDescription>
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

          {/* Turnos de hoy */}
          <Card>
            <CardHeader>
              <CardTitle>Turnos de Hoy</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay turnos programados para hoy</p>
                <p className="text-sm mt-2">Los turnos se cargarán desde tu gestión</p>
              </div>
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
                  <Users className="w-6 h-6 mb-2" />
                  Ver Pacientes
                </Button>
                <Button variant="secondary" className="py-6 flex flex-col items-center">
                  <CalendarIcon className="w-6 h-6 mb-2" />
                  Nuevo Turno
                </Button>
                <Button variant="secondary" className="py-6 flex flex-col items-center">
                  <Clock className="w-6 h-6 mb-2" />
                  Historial
                </Button>
                <Button variant="secondary" className="py-6 flex flex-col items-center">
                  <Settings className="w-6 h-6 mb-2" />
                  Ajustes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default HomeOdonto;
