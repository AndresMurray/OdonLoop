import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserRegistrationForm from '../components/UserRegistrationForm';
import Alert from '../components/Alert';
import { userService } from '../api/userService';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleSuccess = async (formData) => {
    console.log('handleSuccess llamado con:', formData);
    try {
      console.log('Llamando a userService.register...');
      const response = await userService.register(formData);
      console.log('Respuesta del servidor:', response);
      setAlert({
        type: 'success',
        message: '¡Registro exitoso! Redirigiendo...',
      });
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Error en handleSuccess:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Error al registrar usuario',
      });
    }
  };

  const handleError = (error) => {
    setAlert({
      type: 'error',
      message: error.message || 'Error al registrar usuario',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Crear cuenta</h2>
          <p className="mt-2 text-sm text-gray-600">
            Completa el formulario para registrarte
          </p>
        </div>

        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />

        <UserRegistrationForm
          onSuccess={handleSuccess}
          onError={handleError}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
