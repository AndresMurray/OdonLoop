import { createBrowserRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import RegisterPacientePage from '../pages/RegisterPacientePage';
import RegisterOdontologoPage from '../pages/RegisterOdontologoPage';
import LoginPage from '../pages/LoginPage';
import TurnosPage from '../pages/TurnosPage';
import HomeOdonto from '../pages/HomeOdonto';
import HomePaciente from '../pages/HomePaciente';
import App from '../App';
import HomePage from '../pages/HomePage';
import ProtectedRoute from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/home',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/register/paciente',
    element: <RegisterPacientePage />,
  },
  {
    path: '/register/odontologo',
    element: <RegisterOdontologoPage />,
  },
  {
    path: '/home-paciente',
    element: (
      <ProtectedRoute requiredRole="paciente">
        <HomePaciente />
      </ProtectedRoute>
    ),
  },
  {
    path: '/home-odonto',
    element: (
      <ProtectedRoute requiredRole="odontologo">
        <HomeOdonto />
      </ProtectedRoute>
    ),
  },
  {
    path: '/turnos',
    element: (
      <ProtectedRoute>
        <TurnosPage />
      </ProtectedRoute>
    ),
  },
]);
