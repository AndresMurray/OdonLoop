import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarCheck, MapPin, Clock, CheckCircle2, CalendarPlus, Copy, Loader2, ArrowLeft, Stethoscope } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getOdontologoPublico, getTurnosLibres, reservarTurno } from '../api/publicoService';
import { trackEvent } from '../utils/analytics';

const ZONA = 'America/Argentina/Buenos_Aires';
const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);
const fmtDia = (fecha) => mayuscula(new Date(fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: ZONA }));
const fmtDiaCorto = (fecha) => mayuscula(new Date(fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: ZONA }));
const fmtHora = (fecha) => new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA });
const claveDia = (fecha) => new Date(fecha).toLocaleDateString('en-CA', { timeZone: ZONA });

/** Link para agregar el turno a Google Calendar (fechas en UTC: AAAAMMDDTHHMMSSZ). */
const linkCalendario = (turno, odontologo) => {
  const utc = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const inicio = new Date(turno.fecha_hora);
  const fin = new Date(inicio.getTime() + turno.duracion_minutos * 60000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Turno odontológico con ${odontologo.nombre_completo}`,
    dates: `${utc(inicio)}/${utc(fin)}`,
    location: odontologo.consultorio || '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
};

const CAMPO = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-slate-950/60 dark:text-white';
const TARJETA = 'rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:shadow-none';

const Aviso = ({ titulo, texto }) => (
  <div className={`${TARJETA} p-8 text-center space-y-2`}>
    <CalendarCheck className="w-10 h-10 mx-auto text-slate-400" />
    <p className="text-lg font-bold">{titulo}</p>
    {texto && <p className="text-slate-500 dark:text-slate-400">{texto}</p>}
  </div>
);

const ReservarTurnoPage = () => {
  const { slug } = useParams();
  const [odontologo, setOdontologo] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | no-existe | error
  const [dia, setDia] = useState(null);
  const [turnoElegido, setTurnoElegido] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', motivo: '', sitio_web: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [reserva, setReserva] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const cargar = async () => {
    try {
      const [od, libres] = await Promise.all([getOdontologoPublico(slug), getTurnosLibres(slug)]);
      setOdontologo(od);
      setTurnos(libres);
      setEstado('listo');
    } catch (error) {
      setEstado(error.status === 404 ? 'no-existe' : 'error');
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const dias = useMemo(() => {
    const porDia = new Map();
    turnos.forEach((t) => {
      const k = claveDia(t.fecha_hora);
      if (!porDia.has(k)) porDia.set(k, []);
      porDia.get(k).push(t);
    });
    return [...porDia.entries()];
  }, [turnos]);

  const diaActivo = dia && dias.some(([k]) => k === dia) ? dia : dias[0]?.[0];
  const turnosDelDia = dias.find(([k]) => k === diaActivo)?.[1] || [];

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const reservar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    try {
      const resp = await reservarTurno(slug, turnoElegido.id, form);
      setReserva({ ...resp, email: form.email });
      trackEvent('reserva_online', { odontologo: slug });
      window.scrollTo(0, 0);
    } catch (error) {
      if (error.status === 409) {
        setErrores({ general: error.message });
        setTurnoElegido(null);
        cargar();
      } else if (error.status === 429) {
        setErrores({ general: 'Hiciste muchos intentos seguidos. Esperá un rato y probá de nuevo.' });
      } else {
        const campos = error.errors || {};
        const primero = (v) => (Array.isArray(v) ? v[0] : v);
        setErrores({
          nombre: primero(campos.nombre), apellido: primero(campos.apellido), telefono: primero(campos.telefono),
          email: primero(campos.email), general: campos.error || (Object.keys(campos).length ? null : error.message),
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  const linkCancelar = reserva ? `${window.location.origin}/turnos/cancelar/${reserva.token_cancelacion}` : '';
  const copiarLinkCancelar = async () => {
    try {
      await navigator.clipboard.writeText(linkCancelar);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Guardá este link:', linkCancelar);
    }
  };

  const nombreOd = odontologo?.nombre_completo || '';
  const iniciales = nombreOd.split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col text-white">
      <Navbar />
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-6">
        {estado === 'cargando' && (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        )}
        {estado === 'no-existe' && <Aviso titulo="No encontramos a este profesional" texto="Revisá que el link esté completo." />}
        {estado === 'error' && <Aviso titulo="No pudimos cargar los turnos" texto="Probá de nuevo en unos minutos." />}

        {estado === 'listo' && odontologo && (
          <>
            {/* Profesional */}
            <div className={`${TARJETA} p-6 flex items-center gap-4`}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-black text-slate-50 shrink-0">
                {iniciales}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300">Turnos online</p>
                <h1 className="text-2xl font-black">{nombreOd}</h1>
                {odontologo.especialidad && (
                  <p className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><Stethoscope className="w-4 h-4" />{odontologo.especialidad}</p>
                )}
                {odontologo.consultorio && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(odontologo.consultorio)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300"
                  >
                    <MapPin className="w-4 h-4" />{odontologo.consultorio}
                  </a>
                )}
              </div>
            </div>

            {/* Confirmación */}
            {reserva && (
              <div className={`${TARJETA} p-6 md:p-8 space-y-5`}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                  <div>
                    <h2 className="text-2xl font-black">¡Listo, {form.nombre}! Tu turno quedó reservado</h2>
                    <p className="text-slate-600 dark:text-slate-300">
                      {fmtDia(reserva.turno.fecha_hora)} · {fmtHora(reserva.turno.fecha_hora)} hs
                    </p>
                  </div>
                </div>
                {reserva.email && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">Te mandamos la confirmación a <strong>{reserva.email}</strong> y un recordatorio el día anterior.</p>
                )}
                <a
                  href={linkCalendario(reserva.turno, odontologo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-slate-50 font-bold rounded-xl px-5 py-3 transition-colors"
                >
                  <CalendarPlus className="w-5 h-5" />
                  Agregar a mi calendario
                </a>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2 dark:border-amber-400/30 dark:bg-amber-500/10">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Si no podés ir, cancelalo desde este link (guardalo):</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input readOnly value={linkCancelar} className={`${CAMPO} text-xs font-mono py-2`} onFocus={(e) => e.target.select()} />
                    <button onClick={copiarLinkCancelar} className="inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-slate-50 font-bold rounded-xl px-4 py-2 text-sm cursor-pointer">
                      <Copy className="w-4 h-4" />{copiado ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!reserva && !odontologo.acepta_turnos_online && (
              <Aviso titulo="Este profesional no tiene turnos online por ahora" texto="Comunicate directamente con el consultorio." />
            )}
            {!reserva && odontologo.acepta_turnos_online && turnos.length === 0 && (
              <Aviso titulo="No hay turnos disponibles en este momento" texto="Probá más tarde o comunicate con el consultorio." />
            )}

            {/* Elegir horario */}
            {!reserva && !turnoElegido && turnos.length > 0 && (
              <div className={`${TARJETA} p-6 space-y-5`}>
                <h2 className="text-xl font-black flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />Elegí día y horario</h2>
                {errores.general && <p className="rounded-xl bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-400/30 px-4 py-3 text-sm">{errores.general}</p>}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {dias.map(([k, lista]) => (
                    <button
                      key={k}
                      onClick={() => setDia(k)}
                      className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${k === diaActivo
                        ? 'border-blue-600 bg-blue-600 text-slate-50'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200'}`}
                    >
                      {fmtDiaCorto(lista[0].fecha_hora)}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {turnosDelDia.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTurnoElegido(t); setErrores({}); }}
                      className="rounded-xl border border-slate-300 bg-white py-3 font-bold text-slate-800 hover:border-blue-500 hover:bg-blue-50 dark:border-white/10 dark:bg-slate-950/40 dark:text-white dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
                    >
                      {fmtHora(t.fecha_hora)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Datos del paciente */}
            {!reserva && turnoElegido && (
              <form onSubmit={reservar} className={`${TARJETA} p-6 space-y-4`}>
                <button type="button" onClick={() => setTurnoElegido(null)} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 dark:text-blue-300 cursor-pointer">
                  <ArrowLeft className="w-4 h-4" />Cambiar horario
                </button>
                <p className="flex items-center gap-2 text-lg font-black">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {fmtDia(turnoElegido.fecha_hora)} · {fmtHora(turnoElegido.fecha_hora)} hs
                </p>
                {errores.general && <p className="rounded-xl bg-red-50 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-400/30 px-4 py-3 text-sm">{errores.general}</p>}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <input required placeholder="Nombre" value={form.nombre} onChange={cambiar('nombre')} className={CAMPO} autoComplete="given-name" />
                    {errores.nombre && <p className="text-sm text-red-600 mt-1">{errores.nombre}</p>}
                  </div>
                  <div>
                    <input required placeholder="Apellido" value={form.apellido} onChange={cambiar('apellido')} className={CAMPO} autoComplete="family-name" />
                    {errores.apellido && <p className="text-sm text-red-600 mt-1">{errores.apellido}</p>}
                  </div>
                </div>
                <div>
                  <input required type="tel" placeholder="WhatsApp (ej. 2262 15 512345)" value={form.telefono} onChange={cambiar('telefono')} className={CAMPO} autoComplete="tel" />
                  {errores.telefono && <p className="text-sm text-red-600 mt-1">{errores.telefono}</p>}
                </div>
                <div>
                  <input type="email" placeholder="Email (opcional, para la confirmación y el recordatorio)" value={form.email} onChange={cambiar('email')} className={CAMPO} autoComplete="email" />
                  {errores.email && <p className="text-sm text-red-600 mt-1">{errores.email}</p>}
                </div>
                <input placeholder="Motivo de la consulta (opcional)" value={form.motivo} onChange={cambiar('motivo')} maxLength={200} className={CAMPO} />
                {/* Campo trampa para bots: invisible para las personas */}
                <input
                  type="text" name="sitio_web" value={form.sitio_web} onChange={cambiar('sitio_web')}
                  tabIndex={-1} autoComplete="off" aria-hidden="true"
                  style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }}
                />
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-slate-50 font-bold rounded-2xl py-4 disabled:opacity-60 cursor-pointer"
                >
                  {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Confirmar turno
                </button>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">No necesitás crear una cuenta. Tus datos solo los ve el consultorio.</p>
              </form>
            )}

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Turnos online con <Link to="/" className="font-semibold text-blue-700 dark:text-blue-300 hover:underline">OdonLoop</Link>
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ReservarTurnoPage;
