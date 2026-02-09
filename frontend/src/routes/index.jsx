import { createBrowserRouter, Navigate } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import RegisterPacientePage from '../pages/RegisterPacientePage';
import RegisterOdontologoPage from '../pages/RegisterOdontologoPage';
import LoginPage from '../pages/LoginPage';
import TurnosPage from '../pages/TurnosPage';
import HomeOdonto from '../pages/HomeOdonto';
import HomePaciente from '../pages/HomePaciente';
import GestionTurnosOdonto from '../pages/GestionTurnosOdonto';
import SolicitarTurnoPage from '../pages/SolicitarTurnoPage';
import App from '../App';
import HomePage from '../pages/HomePage';
import ProtectedRoute from '../components/ProtectedRoute';
import GuestRoute from '../components/GuestRoute';
import RootRedirect from '../components/RootRedirect';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/home',
    element: (
      <GuestRoute>
        <HomePage />
      </GuestRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
  },
  {
    path: '/register/paciente',
    element: (
      <GuestRoute>
        <RegisterPacientePage />
      </GuestRoute>
    ),
  },
  {
    path: '/register/odontologo',
    element: (
      <GuestRoute>
        <RegisterOdontologoPage />
      </GuestRoute>
    ),
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
    path: '/home-odontologo',
    element: (
      <ProtectedRoute requiredRole="odontologo">
        <HomeOdonto />
      </ProtectedRoute>
    ),
  },
  {
    path: '/gestion-turnos',
    element: (
      <ProtectedRoute requiredRole="odontologo">
        <GestionTurnosOdonto />
      </ProtectedRoute>
    ),
  },
  {
    path: '/solicitar-turno',
    element: (
      <ProtectedRoute requiredRole="paciente">
        <SolicitarTurnoPage />
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
