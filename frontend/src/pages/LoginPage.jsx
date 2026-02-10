/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ArrowLeft } from 'lucide-react';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validators';
import { authService } from '../api/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import Form from '../components/Form';
import Alert from '../components/Alert';
import { Card, CardContent } from '../components/Card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const LoginPage = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ type: '', message: '', detail: '' });

  const validationRules = {
    email: [validators.required, validators.email],
    password: [validators.required],
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm(
    {
      email: '',
      password: '',
    },
    validationRules
  );

  const onSubmit = async (formValues) => {
    try {
      const response = await authService.login(formValues);
      
      setAlert({
        type: 'success',
        message: '¡Inicio de sesión exitoso!',
      });

      // Redirigir según el tipo de usuario
      setTimeout(() => {
        if (response.user.tipo_usuario === 'paciente') {
          navigate('/home-paciente', { replace: true });
        } else if (response.user.tipo_usuario === 'odontologo') {
          navigate('/home-odontologo', { replace: true });
        } else if (response.user.tipo_usuario === 'admin') {
          navigate('/home-admin', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }, 1000);
    } catch (error) {
      // Manejar errores específicos de estado del odontólogo
      if (error.response?.status === 403 && error.response?.data?.estado) {
        const estado = error.response.data.estado;
        
        if (estado === 'pendiente') {
          setAlert({
            type: 'warning',
            message: error.response.data.error || 'Tu cuenta está en proceso de aprobación',
            detail: error.response.data.detail || 'Tu registro está siendo revisado por nuestro equipo. Te notificaremos por email cuando tu cuenta sea aprobada.',
          });
        } else if (estado === 'suspendido') {
          setAlert({
            type: 'error',
            message: error.response.data.error || 'Tu cuenta está temporalmente suspendida',
            detail: error.response.data.detail || 'Tu suscripción ha sido inhabilitada. Por favor contacta con el administrador.',
          });
        }
      } else {
        setAlert({
          type: 'error',
          message: error.message || 'Error al iniciar sesión',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto w-full">
        <Link
          to="/"
          className="inline-flex items-center text-white hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <LogIn className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Iniciar Sesión
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Ingresa tus credenciales para acceder al sistema
              </p>
            </div>

            <Alert
              type={alert.type}
              message={alert.message}
              detail={alert.detail}
              onClose={() => setAlert({ type: '', message: '', detail: '' })}
            />

            <Form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && errors.email}
                  placeholder="correo@ejemplo.com"
                  required
                />

                <Input
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && errors.password}
                  placeholder="••••••••"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 bg-blue-700 hover:bg-blue-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </Button>
              </div>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/"
                  className="text-blue-700 hover:text-blue-800 font-medium"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
