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
              <span className="text-xl font-semibold text-white">OdonLoop</span>
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
                    
                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50 text-white animate-fadeIn">
                      {/* Info del usuario */}
                      <div className="px-4 py-2 border-b border-slate-800">
                        <p className="text-sm font-semibold text-white">
                          {userData.first_name} {userData.last_name}
                        </p>
                        <p className="text-xs text-slate-400 truncate mb-1.5">
                          {userData.email}
                        </p>
                        {userData.tipo_usuario === 'odontologo' && userData.plan && (
                          <span className="inline-block bg-blue-500/10 text-blue-400 border border-blue-500/25 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Plan {userData.plan.nombre}
                          </span>
                        )}
                      </div>

                      {/* Mi Perfil - no para admin */}
                      {userData.tipo_usuario !== 'admin' && (
                        <button
                          onClick={() => {
                            setMenuAbierto(false);
                            navigate(getPerfilUrl());
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors duration-150"
                        >
                          <User className="w-4 h-4 text-blue-400" />
                          Mi Perfil
                        </button>
                      )}

                      {/* Cerrar Sesión */}
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 flex items-center gap-2 transition-colors duration-150"
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
