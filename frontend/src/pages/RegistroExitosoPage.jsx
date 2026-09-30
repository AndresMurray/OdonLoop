import { Link, useLocation } from 'react-router-dom';
import { Mail, CheckCircle2, Users, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { DIAS_PRUEBA, linkWhatsAppVentas } from '../config/marketing';
import { trackEvent } from '../utils/analytics';

const PASOS = [
  { icon: Mail, titulo: 'Confirmá tu email', texto: `Tocá "Confirmar cuenta" en el mail que te mandamos. Ahí arrancan tus ${DIAS_PRUEBA} días gratis.` },
  { icon: Users, titulo: 'Cargá tus pacientes', texto: 'Empezá por los de esta semana. Tus pacientes también pueden registrarse solos para pedirte turno.' },
  { icon: MessageCircle, titulo: 'Recordá turnos por WhatsApp', texto: 'Con un click desde la agenda, para que no falten.' },
];

/** Después del registro: el odontólogo solo tiene que confirmar el email para empezar la prueba. */
const RegistroExitosoPage = () => {
  const { state } = useLocation();
  const email = state?.email;

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col relative overflow-hidden text-white">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-[120px] pointer-events-none"></div>
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/15 border border-blue-400/30">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-300" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black">
              {state?.nombre ? `¡Listo, ${state.nombre}!` : '¡Listo!'} Revisá tu email
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Te enviamos un mail{email ? <> a <strong className="text-slate-900 dark:text-white">{email}</strong></> : ''}.
              Tocá <strong className="text-slate-900 dark:text-white">Confirmar cuenta</strong> y entrás directo a tu consultorio digital,
              con todas las funciones durante {DIAS_PRUEBA} días gratis.
            </p>
          </div>

          <ol className="grid gap-3 text-left">
            {PASOS.map(({ icon, titulo, texto }, i) => {
              const Icon = icon;
              return (
                <li key={titulo} className="flex gap-4 items-start bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/5 rounded-2xl p-4">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-black">{i + 1}</span>
                  <div>
                    <p className="font-bold flex items-center gap-2"><Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-300" />{titulo}</p>
                    <p className="text-slate-400 text-sm">{texto}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="space-y-3 text-sm text-slate-400">
            <p className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              El enlace vale 48 horas. Si no lo ves, revisá la carpeta de spam o{' '}
              <Link to="/reenviar-verificacion" className="text-blue-700 dark:text-blue-300 font-semibold hover:underline">pedí uno nuevo</Link>.
            </p>
            <a
              href={linkWhatsAppVentas(`Hola! Me registré en OdonLoop${email ? ` (${email})` : ''} y necesito ayuda para empezar.`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('contact', { origen: 'registro_exitoso' })}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-slate-50 font-bold rounded-xl px-5 py-3 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              ¿Necesitás ayuda? Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegistroExitosoPage;
