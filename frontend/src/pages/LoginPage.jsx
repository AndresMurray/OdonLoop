import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { LogIn, ArrowLeft } from 'lucide-react';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validators';
import { authService } from '../api/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import Form from '../components/Form';
import Alert from '../components/Alert';
import { Card, CardContent } from '../components/Card';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tipoUsuario = searchParams.get('tipo');
  const [alert, setAlert] = useState({ type: '', message: '' });

  const validationRules = {
    username: [validators.required],
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
      username: '',
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
          navigate('/home-paciente');
        } else if (response.user.tipo_usuario === 'odontologo') {
          navigate('/home-odonto');
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Error al iniciar sesión',
      });
    }
  };

  const getTitle = () => {
    if (tipoUsuario === 'paciente') return 'Inicio de Sesión - Paciente';
    if (tipoUsuario === 'odontologo') return 'Inicio de Sesión - Odontólogo';
    return 'Iniciar Sesión';
  };

  const getRegisterLink = () => {
    if (tipoUsuario === 'paciente') return '/register/paciente';
    if (tipoUsuario === 'odontologo') return '/register/odontologo';
    return '/register';
  };

  const getBgColor = () => {
    if (tipoUsuario === 'odontologo') return 'from-indigo-50 to-indigo-100';
    return 'from-blue-50 to-blue-100';
  };

  const getIconColor = () => {
    if (tipoUsuario === 'odontologo') return 'bg-indigo-100';
    return 'bg-blue-100';
  };

  const getIconTextColor = () => {
    if (tipoUsuario === 'odontologo') return 'text-indigo-600';
    return 'text-blue-600';
  };

  const getLinkColor = () => {
    if (tipoUsuario === 'odontologo') return 'text-indigo-600 hover:text-indigo-700';
    return 'text-blue-600 hover:text-blue-700';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBgColor()} py-12 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-md mx-auto">
        <Link
          to="/"
          className={`inline-flex items-center ${getLinkColor()} mb-6 transition-colors`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className={`p-4 ${getIconColor()} rounded-full`}>
                  <LogIn className={`w-12 h-12 ${getIconTextColor()}`} />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {getTitle()}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Ingresa tus credenciales para acceder
              </p>
            </div>

            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert({ type: '', message: '' })}
            />

            <Form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <Input
                  label="Nombre de usuario"
                  name="username"
                  value={values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.username && errors.username}
                  placeholder="usuario123"
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
                  className={`w-full py-3 ${
                    tipoUsuario === 'odontologo' 
                      ? 'bg-indigo-600 hover:bg-indigo-700' 
                      : ''
                  }`}
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
                  to={getRegisterLink()}
                  className={`${getLinkColor()} font-medium`}
                >
                  Regístrate
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
