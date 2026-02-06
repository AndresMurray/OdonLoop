import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validators';
import { userService } from '../api/userService';
import Input from '../components/Input';
import Button from '../components/Button';
import Form from '../components/Form';
import Alert from '../components/Alert';
import { Card, CardContent } from '../components/Card';

const RegisterPacientePage = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ type: '', message: '' });

  const validationRules = {
    username: [validators.required, validators.username],
    email: [validators.required, validators.email],
    password: [validators.required, validators.minLength(8)],
    password2: [validators.required],
    first_name: [validators.required],
    last_name: [validators.required],
    telefono: [validators.required],
    fecha_nacimiento: [validators.required],
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
      email: '',
      password: '',
      password2: '',
      first_name: '',
      last_name: '',
      telefono: '',
      fecha_nacimiento: '',
      tipo_usuario: 'paciente',
    },
    validationRules
  );

  const password2Error =
    values.password2 && values.password !== values.password2
      ? 'Las contraseñas no coinciden'
      : errors.password2;

  const onSubmit = async (formValues) => {
    try {
      await userService.register(formValues);
      setAlert({
        type: 'success',
        message: '¡Registro exitoso! Redirigiendo al login...',
      });

      setTimeout(() => {
        navigate('/login?tipo=paciente');
      }, 2000);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Error al registrar usuario',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Users className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Registro de Paciente
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Completa el formulario para crear tu cuenta
              </p>
            </div>

            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert({ type: '', message: '' })}
            />

            <Form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre"
                    name="first_name"
                    value={values.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.first_name && errors.first_name}
                    placeholder="Juan"
                    required
                  />

                  <Input
                    label="Apellido"
                    name="last_name"
                    value={values.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.last_name && errors.last_name}
                    placeholder="Pérez"
                    required
                  />
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Teléfono"
                    name="telefono"
                    value={values.telefono}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.telefono && errors.telefono}
                    placeholder="+54 11 1234-5678"
                    required
                  />

                  <Input
                    label="Fecha de nacimiento"
                    name="fecha_nacimiento"
                    type="date"
                    value={values.fecha_nacimiento}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.fecha_nacimiento && errors.fecha_nacimiento}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Contraseña"
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && errors.password}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />

                  <Input
                    label="Confirmar contraseña"
                    name="password2"
                    type="password"
                    value={values.password2}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password2 && password2Error}
                    placeholder="Repite tu contraseña"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registrando...' : 'Crear cuenta'}
                </Button>
              </div>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/login?tipo=paciente"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPacientePage;
