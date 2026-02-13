import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validators';
import { userService } from '../api/userService';
import { obraSocialService } from '../api/obraSocialService';
import Input from '../components/Input';
import Button from '../components/Button';
import Form from '../components/Form';
import Alert from '../components/Alert';
import { Card, CardContent } from '../components/Card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const RegisterPacientePage = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [obrasSociales, setObrasSociales] = useState([]);
  const [loadingOS, setLoadingOS] = useState(true);
  const [mostrarOtraOS, setMostrarOtraOS] = useState(false);

  // Cargar obras sociales al montar el componente
  useEffect(() => {
    const cargarObrasSociales = async () => {
      try {
        const data = await obraSocialService.getAll();
        setObrasSociales(data);
      } catch (error) {
        console.error('Error al cargar obras sociales:', error);
        setAlert({
          type: 'error',
          message: 'No se pudieron cargar las obras sociales',
        });
      } finally {
        setLoadingOS(false);
      }
    };

    cargarObrasSociales();
  }, []);

  const validationRules = {
    email: [validators.required, validators.email],
    password: [validators.required, validators.minLength(8)],
    password2: [validators.required],
    first_name: [validators.required],
    last_name: [validators.required],
    dni: [validators.required],
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
      dni: '',
      telefono: '',
      fecha_nacimiento: '',
      obra_social: '',
      obra_social_otra: '',
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
      // Convertir obra_social a número o null
      const dataToSend = {
        ...formValues,
        obra_social: mostrarOtraOS ? null : (formValues.obra_social ? parseInt(formValues.obra_social) : null),
        obra_social_otra: mostrarOtraOS ? formValues.obra_social_otra : null,
      };
      
      // Eliminar campos vacíos/null para evitar errores del backend
      if (!dataToSend.obra_social) delete dataToSend.obra_social;
      if (!dataToSend.obra_social_otra) delete dataToSend.obra_social_otra;
      
      console.log('📤 Datos a enviar:', dataToSend);
      
      await userService.register(dataToSend);
      setAlert({
        type: 'success',
        message: '¡Registro exitoso! Redirigiendo al login...',
      });

      setTimeout(() => {
        navigate('/login?tipo=paciente', { replace: true });
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
                <div className="p-4 bg-blue-100 rounded-full">
                  <Users className="w-12 h-12 text-blue-700" />
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
                  label="DNI"
                  name="dni"
                  value={values.dni}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.dni && errors.dni}
                  placeholder="12345678"
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

                <div>
                  <label htmlFor="obra_social" className="block text-sm font-medium text-gray-700 mb-1">
                    Obra Social (opcional)
                  </label>
                  
                  {!mostrarOtraOS ? (
                    <>
                      <select
                        id="obra_social"
                        name="obra_social"
                        value={values.obra_social}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loadingOS}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccione una obra social</option>
                        {obrasSociales.map((os) => (
                          <option key={os.id} value={os.id}>
                            {os.nombre}
                          </option>
                        ))}
                      </select>
                      {loadingOS && (
                        <p className="text-sm text-gray-500 mt-1">Cargando obras sociales...</p>
                      )}
                      <button
                        type="button"
                        onClick={() => setMostrarOtraOS(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
                      >
                        Mi obra social no está en la lista
                      </button>
                    </>
                  ) : (
                    <>
                      <Input
                        label=""
                        name="obra_social_otra"
                        value={values.obra_social_otra}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Escriba el nombre de su obra social"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarOtraOS(false)}
                        className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
                      >
                        Volver a seleccionar de la lista
                      </button>
                    </>
                  )}
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
                  className="w-full py-3 bg-blue-700 hover:bg-blue-800"
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
                  className="text-blue-700 hover:text-blue-800 font-medium"
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

export default RegisterPacientePage;
