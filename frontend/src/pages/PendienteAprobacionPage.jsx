import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';
import { Clock, CheckCircle, Mail, DollarSign, AlertCircle, Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { parchearOklchEnDocumento } from '../utils/exportarPDF';

const PendienteAprobacionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [emailVerified, setEmailVerified] = useState(true); // Por defecto true para usuarios que entren directamente
  const [exporting, setExporting] = useState(false);

  const exportPDF = async () => {
    try {
      setExporting(true);
      const element = document.getElementById('info-aprobacion-pdf');
      if (!element) return;

      const elementWidth = element.scrollWidth || element.offsetWidth || 1200;
      const elementHeight = element.scrollHeight || element.offsetHeight;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: elementWidth,
        height: elementHeight,
        windowWidth: elementWidth,
        scrollX: 0,
        scrollY: 0,
        onclone: (_clonedWindow, clonedElement) => {
          parchearOklchEnDocumento(clonedElement.ownerDocument);
        }
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Terminos_OdonLoop.pdf');
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      setExporting(false);
    }
  };

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

              {/* Contenedor principal para el PDF */}
              <div id="info-aprobacion-pdf" className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                    <Clock className="w-10 h-10 text-blue-600" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    ¡Bienvenido a OdonLoop!
                  </h1>
                  <p className="text-gray-600 text-lg max-w-xl mx-auto">
                    Tu cuenta está en proceso de revisión. A continuación te detallamos cómo funciona nuestra plataforma y los pasos a seguir.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Aspectos Comerciales */}
                  <Card className="border-2 border-blue-100 shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                        <DollarSign className="w-6 h-6" />
                        Período de Prueba y Suscripción
                      </h3>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Los primeros <strong>30 días son de prueba totalmente gratis</strong>.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Finalizado el período de prueba, el sistema tiene un valor de <strong>$50.000 mensuales</strong>.</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Activación */}
                  <Card className="border-2 border-green-100 shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-6 h-6" />
                        Activación de tu Cuenta
                      </h3>
                      <div className="space-y-3 text-gray-700">
                        <p>
                          Si ya te comunicaste previamente con nuestro equipo, en breve se te activará la cuenta y <strong>recibirás un mensaje por correo electrónico</strong> de confirmación.
                        </p>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2">
                          <p>
                            En caso contrario, debes escribir a <strong>info@odonloop.com</strong> solicitando que te activen la cuenta para poder ingresar.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Suspensión y Pagos */}
                  <Card className="border-2 border-yellow-200 shadow-sm bg-yellow-50">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6" />
                        Avisos de Pago y Suspensión
                      </h3>
                      <ul className="space-y-3 text-gray-800">
                        <li>
                          Recibirás un <strong>aviso 1 semana antes</strong> de que se venza tu período de prueba, recordándote realizar el pago y la forma de efectuarlo.
                        </li>
                        <li className="font-medium text-red-700">
                          ⚠️ En caso de no registrarse el pago, la cuenta será deshabilitada automáticamente.
                        </li>
                        <li className="text-sm bg-white/60 p-3 rounded border border-yellow-300">
                          <strong className="text-yellow-900">Importante:</strong> Si decidís no utilizar más el sistema, tené en cuenta que podés <strong>exportar a PDF toda la información de tus pacientes</strong> como resguardo. Deberás hacerlo <strong>antes</strong> de que se deshabilite la cuenta.
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Disclaimer Legal */}
                  <Card className="border-2 border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText className="w-6 h-6" />
                        Aclaración Legal (Historia Clínica)
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm">
                        Dejamos expresa constancia que el seguimiento del paciente provisto por OdonLoop <strong>de ninguna manera representa una Historia Clínica con validez legal</strong>. Es exclusivamente un registro propio a modo de agenda digital para la organización del profesional. La Historia Clínica legal debe llevarse como lo estipula la normativa vigente, por cuenta y responsabilidad absoluta del profesional de la salud.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button
                  variant="primary"
                  onClick={exportPDF}
                  disabled={exporting}
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 text-white border-transparent"
                >
                  {exporting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Download className="w-5 h-5 inline" />
                  )}
                  {exporting ? 'Generando PDF...' : 'Guardar Info (Exportar a PDF)'}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto px-8 py-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
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
