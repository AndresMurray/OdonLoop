import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { authService } from '../api/authService';
import Button from '../components/Button';
import { Card, CardContent } from '../components/Card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ActivarCuentaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await authService.verifyEmail(token);
      setStatus('success');
      setMessage(response.message);
      setUserData(response.user);
      
      // Si se recibieron tokens, guardarlos (auto-login)
      if (response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user_data', JSON.stringify(response.user));
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Error al verificar el email');
    }
  };

  const handleContinue = () => {
    if (userData?.tipo_usuario === 'odontologo') {
      // Redirigir a pendiente aprobación con mensaje
      navigate('/pendiente-aprobacion', {
        state: {
          message: '¡Email verificado exitosamente! Ahora completá los pasos para activar tu suscripción.',
          type: 'success',
          emailVerified: true
        }
      });
    } else {
      // Redirigir al login con mensaje de éxito
      navigate('/login', {
        state: {
          message: '¡Email verificado! Ya puedes iniciar sesión con tu cuenta.',
          type: 'success'
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar isLoggedIn={false} />
      
      <div className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8">
            {/* Loading State */}
            {status === 'loading' && (
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Verificando tu email...
                </h2>
                <p className="text-gray-600">
                  Por favor espera mientras verificamos tu cuenta
                </p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  ¡Email verificado exitosamente!
                </h2>
                <p className="text-gray-600 mb-6">
                  {message}
                </p>
                
                {userData?.tipo_usuario === 'odontologo' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                      Tu cuenta está en proceso de aprobación. Te notificaremos por email cuando sea aprobada.
                    </p>
                  </div>
                )}
                
                <Button
                  onClick={handleContinue}
                  className="w-full"
                >
                  {userData?.tipo_usuario === 'odontologo' 
                    ? 'Ver estado de aprobación' 
                    : 'Iniciar sesión'}
                </Button>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <XCircle className="h-16 w-16 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Error en la verificación
                </h2>
                <p className="text-gray-600 mb-6">
                  {message}
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full"
                  >
                    Ir al inicio de sesión
                  </Button>
                  
                  <Link to="/register">
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      Registrarse nuevamente
                    </Button>
                  </Link>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    ¿No recibiste el email de verificación?
                  </p>
                  <Link to="/reenviar-verificacion" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Solicitar nuevo enlace de verificación
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default ActivarCuentaPage;
