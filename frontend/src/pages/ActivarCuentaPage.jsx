import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ChevronDown } from 'lucide-react';
import { authService } from '../api/authService';
import Button from '../components/Button';
import { Card, CardContent } from '../components/Card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ActivarCuentaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const tipo = searchParams.get('tipo');
  const isOdontologo = tipo === 'odontologo';

  // status: 'terms' | 'loading' | 'success' | 'error'
  const [status, setStatus] = useState(isOdontologo ? 'terms' : 'loading');
  const [message, setMessage] = useState('');

  // Prevent double invocation in React StrictMode (dev) for paciente auto-verify
  const verifiedRef = useRef(false);

  // T&C scroll state
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Paciente: auto-verify on mount ──────────────────────────────────────
  useEffect(() => {
    if (isOdontologo) return;
    if (verifiedRef.current) return;
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }
    verifiedRef.current = true;
    verifyEmailPaciente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyEmailPaciente = async () => {
    try {
      const response = await authService.verifyEmail(token);
      if (response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user_data', JSON.stringify(response.user));
      }
      setStatus('success');
      setMessage(response.message);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Error al verificar el email');
    }
  };

  // ── Odontólogo: T&C scroll + accept ─────────────────────────────────────
  const handleScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) {
      setHasScrolled(true);
    }
  };

  const handleAcceptAndContinue = async () => {
    if (!hasScrolled || isSubmitting) return;
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.verifyEmail(token, { terms_accepted: true });
      navigate('/pendiente-aprobacion', {
        state: {
          emailVerified: true,
          message: '¡Email verificado! Tu cuenta está siendo revisada por nuestro equipo.',
          type: 'success',
        },
      });
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Error al verificar el email');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Odontólogo: T&C screen ───────────────────────────────────────────────
  if (isOdontologo && status === 'terms') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar isLoggedIn={false} />
        <main className="flex-grow flex items-center justify-center p-4 py-8">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Términos y Condiciones</h1>
              <p className="text-gray-500 mt-2 text-sm">
                Leé los términos completos y scrolleá hasta el final para poder aceptar
              </p>
            </div>

            <Card className="shadow-xl">
              <CardContent className="p-0">
                {/* Scrollable T&C body */}
                <div
                  onScroll={handleScroll}
                  className="h-80 overflow-y-auto p-6 text-sm text-gray-700 space-y-4 border-b"
                >
                  <h2 className="font-bold text-base text-gray-900">1. Aceptación de los Términos</h2>
                  <p>Al registrarte y utilizar OdonLoop, aceptás cumplir con estos Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, no podrás utilizar la plataforma.</p>

                  <h2 className="font-bold text-base text-gray-900">2. Aclaración Legal - Historia Clínica</h2>
                  <p className="font-semibold text-gray-900 mb-2">
                    Dejamos expresa constancia que el seguimiento del paciente, odontograma y demás funcionalidades provistas por OdonLoop <span className="underline">de ninguna manera representan una Historia Clínica con validez legal</span>.
                  </p>
                  <p className="mb-3">
                    Es exclusivamente un registro propio a modo de <strong>agenda digital</strong> para la organización del profesional. La Historia Clínica legal debe llevarse como lo estipula la normativa vigente, por cuenta y responsabilidad absoluta del profesional de la salud.
                  </p>

                  <h2 className="font-bold text-base text-gray-900">3. Limitación de Responsabilidad</h2>
                  <p className="mb-2">
                    OdonLoop es una herramienta de gestión administrativa y no asume responsabilidad alguna sobre:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Los actos médicos, decisiones clínicas o tratamientos aplicados a tus pacientes.</li>
                    <li>La pérdida, corrupción o eliminación de datos almacenados en la plataforma, cualquiera sea su causa.</li>
                    <li>Fallas técnicas, interrupciones del servicio o problemas de conectividad.</li>
                    <li>El uso indebido de la plataforma por parte del profesional o terceros.</li>
                  </ul>

                  <h2 className="font-bold text-base text-gray-900 mt-4">4. Responsabilidades del Profesional</h2>
                  <p className="mb-2">Como usuario profesional, te comprometés a:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Llevar la Historia Clínica legal de tus pacientes conforme a la legislación vigente y las normativas del Colegio Profesional correspondiente.</li>
                    <li>Realizar respaldos periódicos de la información almacenada en OdonLoop mediante las funciones de exportación disponibles.</li>
                    <li>Mantener la confidencialidad de tus credenciales de acceso y no compartir tu cuenta con terceros.</li>
                    <li>Utilizar la plataforma únicamente para fines relacionados con tu práctica profesional odontológica.</li>
                  </ul>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> OdonLoop es una herramienta complementaria. Vos sos el único responsable de cumplir con todas las obligaciones legales establecidas para el ejercicio de la profesión odontológica.
                    </p>
                  </div>
                </div>

                {/* Scroll indicator */}
                {!hasScrolled ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-sm text-blue-600 bg-blue-50">
                    <ChevronDown className="h-4 w-4 animate-bounce" />
                    <span>Scrolleá hasta el final para poder aceptar</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-3 text-sm text-green-600 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <span>¡Leíste los términos completos!</span>
                  </div>
                )}

                {/* Actions */}
                <div className="p-6 space-y-3">
                  <Button
                    onClick={handleAcceptAndContinue}
                    disabled={!hasScrolled || isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2 justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verificando...
                      </span>
                    ) : (
                      'Acepto y continúo'
                    )}
                  </Button>
                  <Link
                    to="/registro"
                    className="block text-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    No acepto — Volver al registro
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Shared: error screen ─────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar isLoggedIn={false} />
        <div className="flex-grow flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="p-8 text-center">
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Error en la verificación</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Button onClick={() => navigate('/login')} className="w-full">
                  Ir al inicio de sesión
                </Button>
                <Link to="/registro">
                  <Button variant="outline" className="w-full">
                    Registrarse nuevamente
                  </Button>
                </Link>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">¿No recibiste el email?</p>
                <Link
                  to="/reenviar-verificacion"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Solicitar nuevo enlace de verificación
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Paciente: loading screen ─────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar isLoggedIn={false} />
        <div className="flex-grow flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verificando tu email...</h2>
              <p className="text-gray-600">Por favor esperá un momento</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Paciente: success screen ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar isLoggedIn={false} />
      <div className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Email verificado!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ActivarCuentaPage;
