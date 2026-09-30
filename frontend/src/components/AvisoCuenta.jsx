import { useNavigate } from 'react-router-dom';
import { Clock, Sparkles, MessageCircle, UserPlus } from 'lucide-react';
import { authService } from '../api/authService';
import { linkWhatsAppVentas } from '../config/marketing';
import { trackEvent } from '../utils/analytics';

/** Franja bajo el navbar: cuenta demo o días restantes de la prueba gratis. */
const AvisoCuenta = () => {
  const navigate = useNavigate();
  const userData = authService.getUserData();
  const suscripcion = userData?.tipo_usuario === 'odontologo' ? userData.suscripcion : null;
  if (!suscripcion || (!suscripcion.es_demo && !suscripcion.en_prueba)) return null;

  if (suscripcion.es_demo) {
    const crearCuenta = () => {
      trackEvent('demo_crear_cuenta');
      authService.logout();
      navigate('/register/odontologo');
    };
    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <span className="flex items-center gap-2 font-semibold">
            <Sparkles className="w-4 h-4" />
            Estás usando una demo con datos de ejemplo. Probá todo lo que quieras.
          </span>
          <button
            onClick={crearCuenta}
            className="inline-flex items-center gap-1.5 bg-white text-blue-700 font-bold rounded-lg px-3 py-1 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Crear mi cuenta gratis
          </button>
        </div>
      </div>
    );
  }

  const dias = suscripcion.dias_prueba_restantes ?? 0;
  const urgente = dias <= 7;
  return (
    <div className={urgente ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm">
        <span className="flex items-center gap-2 font-semibold">
          <Clock className="w-4 h-4" />
          {dias === 1 ? 'Tu prueba gratis termina mañana.' : `Te quedan ${dias} días de prueba gratis.`}
        </span>
        <a
          href={linkWhatsAppVentas(`Hola! Estoy probando OdonLoop (${userData.email}) y quiero activar mi suscripción.`)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('contact', { origen: 'aviso_prueba' })}
          className="inline-flex items-center gap-1.5 font-bold underline underline-offset-2 hover:no-underline"
        >
          <MessageCircle className="w-4 h-4" />
          Activar suscripción
        </a>
      </div>
    </div>
  );
};

export default AvisoCuenta;
