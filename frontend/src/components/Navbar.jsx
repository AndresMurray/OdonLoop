import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { authService } from '../api/authService';
import ConfirmLogoutModal from './ConfirmLogoutModal';

const Navbar = () => {
  const navigate = useNavigate();
  const userData = authService.getUserData();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarLogoutModal, setMostrarLogoutModal] = useState(false);

  const handleLogout = () => {
    setMenuAbierto(false);
    setMostrarLogoutModal(true);
  };

  const confirmarLogout = () => {
    authService.logout();
    navigate('/');
  };

  const getPerfilUrl = () => {
    if (!userData) return '/';
    if (userData.tipo_usuario === 'paciente') return '/mi-perfil';
    if (userData.tipo_usuario === 'odontologo') return '/mi-perfil-odontologo';
    return '/home-admin';
  };

  const getHomeUrl = () => {
    if (!userData) return '/';
    if (userData.tipo_usuario === 'paciente') return '/home-paciente';
    if (userData.tipo_usuario === 'odontologo') return '/home-odontologo';
    if (userData.tipo_usuario === 'admin') return '/home-admin';
    return '/';
  };

  return (
    <>
      <nav className="bg-white/10 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={getHomeUrl()} className="flex items-center space-x-2">
              <span className="text-xl font-semibold text-white">OdontoSystem</span>
            </Link>

            {/* Menú de usuario - solo si está logueado */}
            {userData && (
              <div className="relative">
                <button
                  onClick={() => setMenuAbierto(!menuAbierto)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {userData.first_name || userData.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${menuAbierto ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {menuAbierto && (
                  <>
                    {/* Overlay para cerrar el menú */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuAbierto(false)}
                    />
                    
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                      {/* Info del usuario */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {userData.first_name} {userData.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {userData.email}
                        </p>
                      </div>

                      {/* Mi Perfil - no para admin */}
                      {userData.tipo_usuario !== 'admin' && (
                        <button
                          onClick={() => {
                            setMenuAbierto(false);
                            navigate(getPerfilUrl());
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          Mi Perfil
                        </button>
                      )}

                      {/* Cerrar Sesión */}
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Modal de confirmación de logout */}
      <ConfirmLogoutModal
        isOpen={mostrarLogoutModal}
        onCancel={() => setMostrarLogoutModal(false)}
        onConfirm={confirmarLogout}
      />
    </>
  );
};

export default Navbar;
