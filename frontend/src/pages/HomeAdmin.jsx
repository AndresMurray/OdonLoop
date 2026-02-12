import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import { 
  Users,
  LogOut,
  Settings
} from 'lucide-react';
import { authService } from '../api/authService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HomeAdmin = () => {
  const navigate = useNavigate();
  const [userData] = useState(() => authService.getUserData());

  useEffect(() => {
    if (!userData) {
      navigate('/login');
      return;
    }
    if (userData.tipo_usuario !== 'admin') {
      navigate('/');
      return;
    }
  }, [navigate, userData]);

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      authService.logout();
      navigate('/');
    }
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
                Panel de Administración
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenido, {userData.first_name} {userData.last_name}
              </p>
            </div>
            <div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-5 h-5 mr-2 inline" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Menú principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Gestionar Odontólogos */}
            <Card 
              className="hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => navigate('/admin/odontologos')}
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                    <Users className="w-12 h-12 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Gestionar Odontólogos
                  </h2>
                  <p className="text-gray-600">
                    Aprobar, suspender o reactivar odontólogos registrados
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Configuración del Sistema */}
            <Card 
              className="hover:shadow-xl transition-all duration-300 cursor-pointer group opacity-50"
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                    <Settings className="w-12 h-12 text-gray-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Configuración
                  </h2>
                  <p className="text-gray-600">
                    Próximamente...
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomeAdmin;
