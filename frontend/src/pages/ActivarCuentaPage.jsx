import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Gift, ShieldCheck, FileText, DoorOpen, ExternalLink } from 'lucide-react';
import { authService } from '../api/authService';
import { trackEvent } from '../utils/analytics';
import { DIAS_PRUEBA } from '../config/marketing';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TerminosContenido from '../components/TerminosContenido';
import { RESUMEN_TERMINOS, TERMINOS_ACTUALIZACION } from '../config/terminos';

const FONDO = 'min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col text-white';
const TARJETA = 'rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:shadow-none';
const ICONOS_RESUMEN = [Gift, ShieldCheck, FileText, DoorOpen];

const Pantalla = ({ children }) => (
  <div className={FONDO}>
    <Navbar />
    <main className="flex-grow w-full max-w-2xl mx-auto px-4 py-10">{children}</main>
    <Footer />
  </div>
);

const ActivarCuentaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const isOdontologo = searchParams.get('tipo') === 'odontologo';

  // status: 'terms' | 'loading' | 'success' | 'error'
  const [status, setStatus] = useState(isOdontologo ? 'terms' : 'loading');
  const [message, setMessage] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evita la doble verificación de React StrictMode (dev) en la verificación automática
  const verifiedRef = useRef(false);

  // ── Link sin tipo (pacientes de antes): se verifica solo ───────────────
  useEffect(() => {
    if (isOdontologo) return;
    if (verifiedRef.current) return;
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }
    verifiedRef.current = true;
    verificarSinTerminos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verificarSinTerminos = async () => {
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
      // Un odontólogo que llegó con un link viejo: primero tiene que aceptar los términos
      if (error.requiereTerminos) {
        setStatus('terms');
        return;
      }
      setStatus('error');
      setMessage(error.message || 'Error al verificar el email');
    }
  };

  // ── Odontólogo: aceptar términos y entrar ─────────────────────────────
  const aceptarYContinuar = async () => {
    if (!acepta || isSubmitting) return;
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await authService.verifyEmail(token, { terms_accepted: true });
      if (response.access && response.refresh) {
        // La prueba gratis arranca al verificar: entra directo a su consultorio
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        trackEvent('sign_up', { method: 'email' });
        navigate('/home-odontologo', { state: { bienvenida: true } });
      } else {
        navigate('/login');
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Error al verificar el email');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'terms') {
    return (
      <Pantalla>
        <div className="text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-cyan-300">Último paso</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Aceptá los términos y empezá</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Tu prueba gratis de {DIAS_PRUEBA} días arranca apenas aceptes.</p>
        </div>

        <div className={`${TARJETA} p-6 md:p-8 space-y-6`}>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">Lo importante, en simple</h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {RESUMEN_TERMINOS.map(({ titulo, texto }, i) => {
                const Icono = ICONOS_RESUMEN[i];
                return (
                  <li key={titulo} className="flex gap-3">
                    <span className="shrink-0 w-9 h-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300 flex items-center justify-center">
                      <Icono className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block font-bold text-slate-900 dark:text-white text-sm">{titulo}</span>
                      <span className="block text-sm text-slate-600 dark:text-slate-300">{texto}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="font-bold text-slate-900 dark:text-white">Texto completo</h2>
              <Link to="/terminos" target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline shrink-0">
                Abrir en otra pestaña <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-950/50 p-5">
              <TerminosContenido />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Última actualización: {TERMINOS_ACTUALIZACION}</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-slate-200 dark:border-white/10 p-4 hover:bg-slate-50 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-blue-600 cursor-pointer"
            />
            <span className="text-sm text-slate-700 dark:text-slate-200">
              Leí y acepto los <strong>Términos y Condiciones</strong>, incluida la aclaración sobre la Historia Clínica y el tratamiento de los datos de mis pacientes.
            </span>
          </label>

          <div className="space-y-3">
            <button
              onClick={aceptarYContinuar}
              disabled={!acepta || isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-slate-50 font-bold rounded-2xl py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSubmitting ? 'Activando tu cuenta...' : 'Aceptar y empezar mi prueba gratis'}
            </button>
            <Link to="/home" className="block text-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              Ahora no
            </Link>
          </div>
        </div>
      </Pantalla>
    );
  }

  if (status === 'error') {
    return (
      <Pantalla>
        <div className={`${TARJETA} p-8 text-center space-y-4 max-w-md mx-auto`}>
          <XCircle className="h-14 w-14 text-rose-500 mx-auto" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">No pudimos activar tu cuenta</h1>
          <p className="text-slate-600 dark:text-slate-300">{message}</p>
          <div className="space-y-3 pt-2">
            <button onClick={() => navigate('/login')} className="w-full bg-blue-600 hover:bg-blue-700 text-slate-50 font-bold rounded-xl py-3 cursor-pointer">
              Ir a iniciar sesión
            </button>
            <Link to="/reenviar-verificacion" className="block text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline">
              Pedir un nuevo link de activación
            </Link>
          </div>
        </div>
      </Pantalla>
    );
  }

  if (status === 'loading') {
    return (
      <Pantalla>
        <div className={`${TARJETA} p-8 text-center max-w-md mx-auto`}>
          <Loader2 className="h-14 w-14 text-blue-500 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Verificando tu email...</h1>
          <p className="text-slate-600 dark:text-slate-300">Esperá un momento.</p>
        </div>
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <div className={`${TARJETA} p-8 text-center space-y-4 max-w-md mx-auto`}>
        <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">¡Email verificado!</h1>
        <p className="text-slate-600 dark:text-slate-300">{message}</p>
        <button onClick={() => navigate('/login')} className="w-full bg-blue-600 hover:bg-blue-700 text-slate-50 font-bold rounded-xl py-3 cursor-pointer">
          Iniciar sesión
        </button>
      </div>
    </Pantalla>
  );
};

export default ActivarCuentaPage;
