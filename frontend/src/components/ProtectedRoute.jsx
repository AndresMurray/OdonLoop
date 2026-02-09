import { Navigate } from 'react-router-dom';
import { authService } from '../api/authService';

const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = authService.isAuthenticated();
  const userData = authService.getUserData();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userData?.tipo_usuario !== requiredRole) {
    // Redirigir al home correspondiente según el tipo de usuario
    if (userData?.tipo_usuario === 'paciente') {
      return <Navigate to="/home-paciente" replace />;
    } else if (userData?.tipo_usuario === 'odontologo') {
      return <Navigate to="/home-odontologo" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
