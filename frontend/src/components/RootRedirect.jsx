import { Navigate } from 'react-router-dom';
import { authService } from '../api/authService';

/**
 * Componente para redirigir la ruta raíz "/" según el estado de autenticación
 */
const RootRedirect = () => {
  const isAuthenticated = authService.isAuthenticated();
  const userData = authService.getUserData();

  // Si está autenticado, redirigir al home correspondiente
  if (isAuthenticated && userData) {
    if (userData.tipo_usuario === 'paciente') {
      return <Navigate to="/home-paciente" replace />;
    } else if (userData.tipo_usuario === 'odontologo') {
      return <Navigate to="/home-odontologo" replace />;
    } else if (userData.tipo_usuario === 'admin') {
      return <Navigate to="/home-admin" replace />;
    }
  }

  // Si no está autenticado, redirigir a la página de bienvenida
  return <Navigate to="/home" replace />;
};

export default RootRedirect;
