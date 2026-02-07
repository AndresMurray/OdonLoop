import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, ArrowLeft } from 'lucide-react';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validators';
import { userService } from '../api/userService';
import Input from '../components/Input';
import Button from '../components/Button';
import Form from '../components/Form';
import Alert from '../components/Alert';
import { Card, CardContent } from '../components/Card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const RegisterOdontologoPage = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ type: '', message: '' });

  const validationRules = {
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
      email: '',
      password: '',
      password2: '',
      first_name: '',
      last_name: '',
      telefono: '',
      fecha_nacimiento: '',
      bio: '',
      tipo_usuario: 'odontologo',
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
        navigate('/login?tipo=odontologo');
      }, 2000);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Error al registrar usuario',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
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
                <div className="p-4 bg-slate-100 rounded-full">
                  <Stethoscope className="w-12 h-12 text-slate-700" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Registro de Odontólogo
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Completa el formulario para crear tu cuenta profesional
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
                  label="Email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && errors.email}
                  placeholder="doctor@ejemplo.com"
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

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Biografía profesional (opcional)
                  </label>
                  <textarea
                    name="bio"
                    value={values.bio}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Cuéntanos sobre tu experiencia y especialidades..."
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
                  className="w-full py-3 bg-slate-700 hover:bg-slate-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registrando...' : 'Crear cuenta profesional'}
                </Button>
              </div>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/login?tipo=odontologo"
                  className="text-slate-700 hover:text-slate-800 font-medium"
                >
                  Inicia sesión
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

export default RegisterOdontologoPage;
