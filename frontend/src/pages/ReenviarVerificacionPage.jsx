import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
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

const ReenviarVerificacionPage = () => {
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [emailEnviado, setEmailEnviado] = useState(false);

  const validationRules = {
    email: [validators.required, validators.email],
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
    },
    validationRules
  );

  const onSubmit = async (formValues) => {
    try {
      await authService.resendVerificationEmail(formValues.email);
      setEmailEnviado(true);
      setAlert({
        type: 'success',
        message: 'Si el email existe en nuestro sistema, recibirás un nuevo enlace de verificación.',
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Error al reenviar el email de verificación',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar isLoggedIn={false} />
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Link
            to="/login"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al login
          </Link>

          <Card className="shadow-xl">
            <CardContent className="p-8">
              {!emailEnviado ? (
                <>
                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-blue-100 rounded-full">
                        <Mail className="w-12 h-12 text-blue-700" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Reenviar verificación
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Ingresa tu email y te enviaremos un nuevo enlace de verificación
                    </p>
                  </div>

                  {alert.message && (
                    <Alert type={alert.type} className="mb-6">
                      {alert.message}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-6">
                      <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.email && errors.email}
                        placeholder="tu@email.com"
                        autoComplete="email"
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                      >
                        <Mail className="w-5 h-5 mr-2" />
                        Reenviar email de verificación
                      </Button>
                    </div>
                  </Form>
                </>
              ) : (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Email enviado
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {alert.message}
                  </p>
                  <p className="text-sm text-gray-600 mb-6">
                    Revisa tu bandeja de entrada y sigue las instrucciones. El enlace es válido por 48 horas.
                  </p>
                  <Link to="/login">
                    <Button className="w-full">
                      Ir al login
                    </Button>
                  </Link>
                </div>
              )}

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">¿Ya tienes una cuenta verificada? </span>
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Iniciar sesión
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ReenviarVerificacionPage;
