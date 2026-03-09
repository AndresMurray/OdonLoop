import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Alert from '../components/Alert';
import { Clock, CheckCircle, Mail, DollarSign, AlertCircle, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

const PendienteAprobacionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [emailVerified, setEmailVerified] = useState(true);
  const [exporting, setExporting] = useState(false);

  const exportPDF = () => {
    try {
      setExporting(true);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // --- Helper: salto de pagina si no hay espacio ---
      const checkPage = (needed) => {
        if (y + needed > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      // --- Helper: texto con word-wrap ---
      const addWrappedText = (text, x, maxWidth, lineHeight = 5.5) => {
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line) => {
          checkPage(lineHeight);
          pdf.text(line, x, y);
          y += lineHeight;
        });
      };

      // ============================================
      // PORTADA
      // ============================================
      pdf.setFillColor(30, 58, 138);
      pdf.rect(0, 0, pageWidth, 45, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OdonLoop', pageWidth / 2, 18, { align: 'center' });

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Terminos y Condiciones del Servicio', pageWidth / 2, 28, { align: 'center' });

      pdf.setFontSize(10);
      pdf.text(
        'Fecha: ' + new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }),
        pageWidth / 2, 38, { align: 'center' }
      );

      y = 55;

      // ============================================
      // SECCION 1: Periodo de Prueba y Suscripcion
      // ============================================
      pdf.setFillColor(219, 234, 254); // azul claro
      pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
      pdf.setTextColor(29, 78, 216);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('$ Periodo de Prueba y Suscripcion', margin + 4, y + 5.5);
      y += 13;

      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      const items1 = [
        'Los primeros 30 dias son de prueba totalmente gratis.',
        'Finalizado el periodo de prueba, el sistema tiene un valor de $40.000 mensuales.',
      ];
      items1.forEach((item) => {
        checkPage(8);
        pdf.setTextColor(34, 197, 94);
        pdf.text('\u2713', margin + 2, y);
        pdf.setTextColor(55, 65, 81);
        addWrappedText(item, margin + 8, contentWidth - 10);
        y += 2;
      });

      y += 5;

      // ============================================
      // SECCION 2: Activacion de tu Cuenta
      // ============================================
      checkPage(40);
      pdf.setFillColor(220, 252, 231); // verde claro
      pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
      pdf.setTextColor(21, 128, 61);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Activacion de tu Cuenta', margin + 4, y + 5.5);
      y += 13;

      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      addWrappedText(
        'Si ya te comunicaste previamente con nuestro equipo, en breve se te activara la cuenta y recibiras un mensaje por correo electronico de confirmacion.',
        margin + 2, contentWidth - 4
      );
      y += 3;

      // Caja gris
      checkPage(15);
      pdf.setFillColor(249, 250, 251);
      pdf.setDrawColor(229, 231, 235);
      pdf.roundedRect(margin + 2, y, contentWidth - 4, 14, 1, 1, 'FD');
      y += 5;
      pdf.setFontSize(10);
      addWrappedText(
        'En caso contrario, debes escribir a sistemagestionodontologico@gmail.com solicitando que te activen la cuenta para poder ingresar.',
        margin + 5, contentWidth - 10
      );
      y += 5;

      y += 5;

      // ============================================
      // SECCION 3: Avisos de Pago y Suspension
      // ============================================
      checkPage(50);
      pdf.setFillColor(254, 249, 195); // amarillo claro
      pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
      pdf.setTextColor(133, 100, 4);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Avisos de Pago y Suspension', margin + 4, y + 5.5);
      y += 13;

      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      addWrappedText(
        'Recibiras un aviso 1 semana antes de que se venza tu periodo de prueba, recordandote realizar el pago y la forma de efectuarlo.',
        margin + 2, contentWidth - 4
      );
      y += 3;

      // Aviso en rojo
      checkPage(10);
      pdf.setTextColor(185, 28, 28);
      pdf.setFont('helvetica', 'bold');
      addWrappedText(
        'En caso de no registrarse el pago, la cuenta sera deshabilitada automaticamente.',
        margin + 2, contentWidth - 4
      );
      y += 3;

      // Caja importante
      checkPage(20);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(253, 224, 71);
      pdf.roundedRect(margin + 2, y, contentWidth - 4, 20, 1, 1, 'FD');
      y += 5;
      pdf.setTextColor(113, 63, 18);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Importante:', margin + 5, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      y += 4;
      addWrappedText(
        'Si decidis no utilizar mas el sistema, tene en cuenta que podes exportar a PDF toda la informacion de tus pacientes como resguardo. Deberas hacerlo antes de que se deshabilite la cuenta.',
        margin + 5, contentWidth - 10, 4.5
      );
      y += 8;

      y += 5;

      // ============================================
      // SECCION 4: Aclaracion Legal
      // ============================================
      checkPage(45);
      pdf.setFillColor(243, 244, 246); // gris claro
      pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Aclaracion Legal (Historia Clinica)', margin + 4, y + 5.5);
      y += 13;

      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      addWrappedText(
        'Dejamos expresa constancia que el seguimiento del paciente provisto por OdonLoop de ninguna manera representa una Historia Clinica con validez legal. Es exclusivamente un registro propio a modo de agenda digital para la organizacion del profesional. La Historia Clinica legal debe llevarse como lo estipula la normativa vigente, por cuenta y responsabilidad absoluta del profesional de la salud.',
        margin + 2, contentWidth - 4, 5
      );

      // ============================================
      // PIE DE PAGINA
      // ============================================
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text('OdonLoop - Terminos y Condiciones', margin, pageHeight - 8);
        pdf.text(`Pagina ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
      }

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
              <div id="info-aprobacion-pdf" className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">
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
                            En caso contrario, debes escribir a <strong>sistemagestionodontologico@gmail.com</strong> solicitando que te activen la cuenta para poder ingresar.
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
