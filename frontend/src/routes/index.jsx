import { createBrowserRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
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
  // Agrega más rutas aquí
  // {
  //   path: '/login',
  //   element: <LoginPage />,
  // },
]);
