import { createBrowserRouter, Navigate } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import App from '../App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/home" replace />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  // Agrega más rutas aquí
  // {
  //   path: '/login',
  //   element: <LoginPage />,
  // },
]);
