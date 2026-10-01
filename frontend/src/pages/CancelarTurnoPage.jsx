import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarX2, CheckCircle2, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getReservaParaCancelar, cancelarReserva } from '../api/publicoService';
import { trackEvent } from '../utils/analytics';

const ZONA = 'America/Argentina/Buenos_Aires';
const TARJETA = 'rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:shadow-none p-6 md:p-8 space-y-5';

/** El paciente cancela su reserva online con el link que recibió. */
const CancelarTurnoPage = () => {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | invalido | cancelado
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getReservaParaCancelar(token)
      .then((data) => { setInfo(data); setEstado('listo'); })
      .catch(() => setEstado('invalido'));
  }, [token]);

  const cancelar = async () => {
    setEnviando(true);
    setError('');
    try {
      await cancelarReserva(token);
      trackEvent('reserva_online_cancelada');
      setEstado('cancelado');
    } catch (e) {
      setError(e.message || 'No pudimos cancelar el turno. Probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const fecha = info && new Date(info.turno.fecha_hora);
  const cuando = fecha && `${fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: ZONA })} a las ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA })} hs`;
  const linkOtroTurno = info?.odontologo?.slug ? `/turnos/${info.odontologo.slug}` : '/';

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col text-white">
      <Navbar />
      <main className="flex-grow w-full max-w-xl mx-auto px-4 py-12">
        {estado === 'cargando' && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}

        {estado === 'invalido' && (
          <div className={`${TARJETA} text-center`}>
            <CalendarX2 className="w-10 h-10 mx-auto text-slate-400" />
            <h1 className="text-xl font-black">Este link ya no es válido</h1>
            <p className="text-slate-600 dark:text-slate-300">Puede que el turno ya se haya cancelado. Si tenés dudas, comunicate con el consultorio.</p>
          </div>
        )}

        {estado === 'listo' && (
          <div className={TARJETA}>
            <CalendarX2 className="w-10 h-10 text-rose-500" />
            <h1 className="text-2xl font-black">Cancelar turno</h1>
            <p className="text-slate-700 dark:text-slate-200">
              Turno de <strong>{info.paciente}</strong> con <strong>{info.odontologo.nombre_completo}</strong>, el {cuando}.
            </p>
            {info.cancelable ? (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-300">Al cancelarlo, el horario queda libre para otro paciente.</p>
                {error && <p className="rounded-xl bg-red-50 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-400/30 px-4 py-3 text-sm">{error}</p>}
                <button
                  onClick={cancelar}
                  disabled={enviando}
                  className="w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold rounded-2xl py-4 disabled:opacity-60 cursor-pointer"
                >
                  {enviando && <Loader2 className="w-5 h-5 animate-spin" />}
                  Sí, cancelar mi turno
                </button>
              </>
            ) : (
              <p className="rounded-xl bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-400/30 px-4 py-3 text-sm">
                Este turno ya no se puede cancelar desde acá. Comunicate con el consultorio.
              </p>
            )}
          </div>
        )}

        {estado === 'cancelado' && (
          <div className={`${TARJETA} text-center`}>
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <h1 className="text-2xl font-black">Turno cancelado</h1>
            <p className="text-slate-600 dark:text-slate-300">Le avisamos al consultorio. ¡Gracias por avisar!</p>
            <Link to={linkOtroTurno} className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-slate-50 font-bold rounded-xl px-5 py-3">
              Elegir otro horario
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CancelarTurnoPage;
