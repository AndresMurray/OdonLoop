import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import { 
  Users,
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
                Panel de Administración
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
