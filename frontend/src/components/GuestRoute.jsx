import { Navigate } from 'react-router-dom';
import { authService } from '../api/authService';

/**
 * Componente para proteger rutas que solo deben ser accesibles por usuarios NO autenticados
 * (como login y registro). Si el usuario ya está autenticado, lo redirige a su home.
 */
const GuestRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  const userData = authService.getUserData();

  // Si está autenticado, redirigir al home correspondiente según su rol
  if (isAuthenticated && userData) {
    if (userData.tipo_usuario === 'paciente') {
      return <Navigate to="/home-paciente" replace />;
    } else if (userData.tipo_usuario === 'odontologo') {
      return <Navigate to="/home-odontologo" replace />;
    }
    // Fallback por si acaso
    return <Navigate to="/home" replace />;
  }

  // Si no está autenticado, permitir acceso
  return children;
};

export default GuestRoute;
