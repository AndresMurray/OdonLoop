import { createBrowserRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import TurnosPage from '../pages/TurnosPage';
import HomeOdonto from '../pages/HomeOdonto';
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
  {
    path: '/home-odonto',
    element: <HomeOdonto />,
  },

]);
