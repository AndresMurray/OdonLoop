import { createBrowserRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import TurnosPage from '../pages/TurnosPage';
import App from '../App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/turnos',
    element: <TurnosPage />,
  },
  // Agrega más rutas aquí
  // {
  //   path: '/login',
  //   element: <LoginPage />,
  // },
]);
