import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import RegisterPacientePage from '../pages/RegisterPacientePage';
import RegisterOdontologoPage from '../pages/RegisterOdontologoPage';
import RegistroExitosoPage from '../pages/RegistroExitosoPage';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ActivarCuentaPage from '../pages/ActivarCuentaPage';
import ReenviarVerificacionPage from '../pages/ReenviarVerificacionPage';
import App from '../App';
import HomePage from '../pages/HomePage';
import ProtectedRoute from '../components/ProtectedRoute';
import GuestRoute from '../components/GuestRoute';
import RootRedirect from '../components/RootRedirect';

// Tras un deploy, una pestaña abierta con la versión anterior pide archivos que ya no existen:
// en ese caso se recarga una vez para traer la versión nueva.
const CLAVE_RECARGA = 'odonloop-recarga-por-deploy';
const lazyConRecarga = (importar) => lazy(() =>
  importar()
    .then((modulo) => {
      try { sessionStorage.removeItem(CLAVE_RECARGA); } catch { /* sin sessionStorage */ }
      return modulo;
    })
    .catch((error) => {
      let yaRecargo = true;
      try {
        yaRecargo = Boolean(sessionStorage.getItem(CLAVE_RECARGA));
        if (!yaRecargo) sessionStorage.setItem(CLAVE_RECARGA, '1');
      } catch { /* sin sessionStorage: no reintentar */ }
      if (yaRecargo) throw error;
      window.location.reload();
      return new Promise(() => {});
    })
);

// Pantallas de la app (con sesión): se descargan recién cuando se usan, así la landing carga liviana
const TurnosPage = lazyConRecarga(() => import('../pages/TurnosPage'));
const HomeOdonto = lazyConRecarga(() => import('../pages/HomeOdonto'));
const HomePaciente = lazyConRecarga(() => import('../pages/HomePaciente'));
const HomeAdmin = lazyConRecarga(() => import('../pages/HomeAdmin'));
const PanelAdministracion = lazyConRecarga(() => import('../pages/PanelAdministracion'));
const GestionTurnosOdonto = lazyConRecarga(() => import('../pages/GestionTurnosOdonto'));
const SolicitarTurnoPage = lazyConRecarga(() => import('../pages/SolicitarTurnoPage'));
const MisPacientesPage = lazyConRecarga(() => import('../pages/MisPacientesPage'));
const SeguimientoPacientePage = lazyConRecarga(() => import('../pages/SeguimientoPacientePage'));
const PerfilPacientePage = lazyConRecarga(() => import('../pages/PerfilPacientePage'));
const PerfilOdontologoPage = lazyConRecarga(() => import('../pages/PerfilOdontologoPage'));
const OdontogramaPage = lazyConRecarga(() => import('../pages/OdontogramaPage'));
const ReservarTurnoPage = lazyConRecarga(() => import('../pages/ReservarTurnoPage'));
const CancelarTurnoPage = lazyConRecarga(() => import('../pages/CancelarTurnoPage'));

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
    path: '/activar-cuenta',
    element: (
      <GuestRoute>
        <ActivarCuentaPage />
      </GuestRoute>
    ),
  },
  {
    path: '/reenviar-verificacion',
    element: (
      <GuestRoute>
        <ReenviarVerificacionPage />
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
    // Link público de cada odontólogo: los pacientes reservan sin cuenta
    path: '/turnos/:slug',
    element: <ReservarTurnoPage />,
  },
  {
    path: '/turnos/cancelar/:token',
    element: <CancelarTurnoPage />,
  },
  {
    path: '/registro-exitoso',
    element: (
      <GuestRoute>
        <RegistroExitosoPage />
      </GuestRoute>
    ),
  },
  {
    // Ruta anterior (cuando había aprobación manual)
    path: '/pendiente-aprobacion',
    element: <Navigate to="/registro-exitoso" replace />,
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
      <ProtectedRoute requiredRole="odontologo" requiredPermission="tiene_turnos">
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
      <ProtectedRoute requiredRole="odontologo" requiredPermission="tiene_odontograma">
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
      <ProtectedRoute requiredRole="paciente">
        <TurnosPage />
      </ProtectedRoute>
    ),
  },
]);
