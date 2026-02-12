import { createBrowserRouter, Navigate } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import RegisterPacientePage from '../pages/RegisterPacientePage';
import RegisterOdontologoPage from '../pages/RegisterOdontologoPage';
import PendienteAprobacionPage from '../pages/PendienteAprobacionPage';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import TurnosPage from '../pages/TurnosPage';
import HomeOdonto from '../pages/HomeOdonto';
import HomePaciente from '../pages/HomePaciente';
import HomeAdmin from '../pages/HomeAdmin';
import PanelAdministracion from '../pages/PanelAdministracion';
import GestionTurnosOdonto from '../pages/GestionTurnosOdonto';
import SolicitarTurnoPage from '../pages/SolicitarTurnoPage';
import MisPacientesPage from '../pages/MisPacientesPage';
import SeguimientoPacientePage from '../pages/SeguimientoPacientePage';
import PerfilPacientePage from '../pages/PerfilPacientePage';
import PerfilOdontologoPage from '../pages/PerfilOdontologoPage';
import OdontogramaPage from '../pages/OdontogramaPage';
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
    path: '/forgot-password',
    element: (
      <GuestRoute>
        <ForgotPasswordPage />
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
    path: '/pendiente-aprobacion',
    element: (
      <GuestRoute>
        <PendienteAprobacionPage />
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
    path: '/mi-perfil',
    element: (
      <ProtectedRoute requiredRole="paciente">
        <PerfilPacientePage />
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
    path: '/mi-perfil-odontologo',
    element: (
      <ProtectedRoute requiredRole="odontologo">
        <PerfilOdontologoPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/home-admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <HomeAdmin />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/odontologos',
    element: (
      <ProtectedRoute requiredRole="admin">
        <PanelAdministracion />
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
    path: '/mis-pacientes',
    element: (
      <ProtectedRoute requiredRole="odontologo">
        <MisPacientesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/seguimiento-paciente/:pacienteId',
    element: (
      <ProtectedRoute requiredRole="odontologo">
        <SeguimientoPacientePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/odontograma/:pacienteId',
    element: (
      <ProtectedRoute requiredRole="odontologo">
        <OdontogramaPage />
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
