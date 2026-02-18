import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';
import { Clock, CheckCircle, Mail, DollarSign, AlertCircle } from 'lucide-react';

const PendienteAprobacionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [emailVerified, setEmailVerified] = useState(true); // Por defecto true para usuarios que entren directamente

  // Mostrar mensaje si viene del registro o verificación
  useEffect(() => {
    if (location.state?.message) {
      setAlert({
        type: location.state.type || 'info',
        message: location.state.message
      });
      
      // Actualizar estado de verificación
      if (location.state?.emailVerified !== undefined) {
        setEmailVerified(location.state.emailVerified);
      }
      
      // Limpiar el state para que no se muestre al recargar
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Mostrar solo mensaje de verificación si no ha verificado el email */}
          {!emailVerified ? (
            <div>
              {/* Alerta de éxito */}
              {alert.message && (
                <div className="mb-6">
                  <Alert type={alert.type}>
                    {alert.message}
                  </Alert>
                </div>
              )}

              {/* Mensaje de verificación de email */}
              <Card className="bg-blue-50 border-2 border-blue-400">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-blue-100 rounded-full">
                        <Mail className="w-12 h-12 text-blue-700" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      📧 Verificá tu email
                    </h2>
                    <p className="text-gray-700 mb-4">
                      Te enviamos un email de verificación a tu casilla. 
                    </p>
                    <p className="text-gray-700 mb-6">
                      <strong>Revisá tu bandeja de entrada</strong> y hacé clic en el enlace para activar tu cuenta.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-yellow-800">
                        ⏰ El enlace de verificación es válido por 48 horas.
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      ¿No recibiste el email? Revisá la carpeta de spam o{' '}
                      <a href="/reenviar-verificacion" className="text-blue-600 hover:text-blue-700 font-medium">
                        solicitá uno nuevo
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Botón para volver */}
              <div className="mt-8 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/')}
                  className="px-8"
                >
                  Volver al inicio
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Mostrar pasos de pago después de verificar */}
              {/* Alerta de éxito */}
              {alert.message && (
                <div className="mb-6">
                  <Alert type={alert.type}>
                    {alert.message}
                  </Alert>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              🚀 ¡Ya casi sos parte de OdonLoop!
            </h1>
            <p className="text-slate-200 text-lg">
              Para habilitar tu panel profesional seguí estos pasos:
            </p>
          </div>

          {/* Pasos */}
          <div className="space-y-6 mb-8">
            {/* Paso 1: Transferencia */}
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Realizá la transferencia
                    </h3>
                    <div className="space-y-2 text-gray-700">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Monto</p>
                        <p className="text-2xl font-bold text-blue-600">$50.000</p>
                        <p className="text-xs text-gray-500">(Suscripción mensual)</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Alias</p>
                        <p className="text-lg font-mono font-bold text-gray-900 select-all">
                          odonloop.pagos
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Titular</p>
                        <p className="text-lg font-semibold text-gray-900">
                          Andrés Murray Roppel
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paso 2: Enviar comprobante */}
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Envianos el comprobante
                    </h3>
                    <p className="text-gray-700 mb-3">
                      Adjuntá la captura del pago a:
                    </p>
                    <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
                      <a 
                        href="mailto:sistemagestionodontologico@gmail.com"
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 select-all break-all"
                      >
                        sistemagestionodontologico@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paso 3: Listo */}
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-600 mb-3">
                      ¡Listo!
                    </h3>
                    <p className="text-gray-700">
                      Una vez verificado, activaremos tu cuenta en un plazo máximo de <strong>12 horas</strong> y te notificaremos por mail.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información importante */}
          <Card className="bg-yellow-50 border-2 border-yellow-400">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    📅 Importante: Renovación mensual
                  </h4>
                  <p className="text-gray-700 text-sm mb-2">
                    Todos los meses del <strong>1 al 5</strong> debes realizar la transferencia al mismo alias para mantener tu cuenta activa.
                  </p>
                  <p className="text-gray-700 text-sm">
                    ⚠️ En caso de no recibir el pago, tu cuenta será <strong>inhabilitada temporalmente</strong> hasta que se registre la transferencia.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="mt-8 flex justify-center gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/')}
              className="px-8"
            >
              Volver al inicio
            </Button>
          </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PendienteAprobacionPage;
