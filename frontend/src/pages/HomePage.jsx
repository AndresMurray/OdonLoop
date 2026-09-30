import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getPlanes, crearDemo } from '../api/odontologoService';
import {
  CalendarCheck, ClipboardList, SmilePlus, FileDown, MessageCircle, Sparkles, Check, PlayCircle,
  ShieldCheck, DatabaseBackup, Smartphone, HelpCircle, ChevronDown, Quote, Gift, BellRing, Users, Loader2,
} from 'lucide-react';
import {
  DIAS_PRUEBA, OFERTA_FUNDADOR, TESTIMONIOS, FUNDADOR, YOUTUBE_DEMO_URL, INSTAGRAM_URL, CONTACT_EMAIL, linkWhatsAppVentas,
  ofertaFundadorVigente, textoDiasOferta as calcularTextoDiasOferta, fechaFinOfertaTexto,
} from '../config/marketing';
import { trackEvent } from '../utils/analytics';

const FALLBACK_PLANES = [
  { plan_key: 'basico', nombre: 'Básico', precio: '$25.000/mes', limite_almacenamiento_gb: 1, tiene_turnos: false, tiene_recordatorios_email: false, tiene_odontograma: false, tiene_exportacion_pdf: false, descripcion: 'Seguimiento de pacientes con 1GB para imágenes y archivos.' },
  { plan_key: 'medio', nombre: 'Medio', precio: '$35.000/mes', limite_almacenamiento_gb: 1, tiene_turnos: true, tiene_recordatorios_email: true, tiene_odontograma: false, tiene_exportacion_pdf: false, descripcion: 'Todo lo del Básico más agenda de turnos y recordatorios.' },
  { plan_key: 'premium', nombre: 'Premium', precio: '$40.000/mes', limite_almacenamiento_gb: 10, tiene_turnos: true, tiene_recordatorios_email: true, tiene_odontograma: true, tiene_exportacion_pdf: true, descripcion: 'Todo incluido: odontograma, PDF y 10GB de almacenamiento.' },
];

const DOLORES = [
  { dolor: 'Pacientes que se olvidan del turno', solucion: 'Recordatorio automático por email el día anterior y por WhatsApp con un click.', icon: BellRing },
  { dolor: 'Fotos, radiografías y notas desperdigadas', solucion: 'El seguimiento de cada paciente, con sus archivos, en un solo lugar.', icon: ClipboardList },
  { dolor: 'La agenda en un cuaderno o en la cabeza', solucion: 'Turnos del día, reservados y libres, desde la compu o el celular.', icon: CalendarCheck },
];

const FUNCIONES = [
  {
    icon: CalendarCheck, color: 'text-blue-400', titulo: 'Gestión de Turnos',
    bajada: 'Tu agenda ordenada y con menos faltazos.',
    items: ['Turnos del día: reservados y disponibles', 'Recordatorio automático por email el día anterior', 'Recordatorio por WhatsApp con un click, con el mensaje ya escrito', 'Tus pacientes pueden pedir turno online'],
    imagenes: [{ src: '/landing/turnos.webp', alt: 'Gestión de Turnos en OdonLoop' }, { src: '/landing/recordatorio-email.webp', alt: 'Recordatorio de turno por email', chica: true }],
  },
  {
    icon: ClipboardList, color: 'text-emerald-400', titulo: 'Seguimiento de pacientes',
    bajada: 'Toda la historia de atención de cada paciente, a mano.',
    items: ['Registro por fecha de cada atención', 'Fotos, radiografías y documentos adjuntos', 'Búsqueda y filtro por fecha', 'Tus pacientes y sus datos en Mis Pacientes'],
    imagenes: [{ src: '/landing/seguimiento.webp', alt: 'Seguimiento de un paciente en OdonLoop' }],
  },
  {
    icon: SmilePlus, color: 'text-amber-400', titulo: 'Odontograma interactivo',
    bajada: 'Marcá tratamientos en segundos, como en papel pero ordenado.',
    items: ['52 piezas con notación FDI (permanentes y temporales)', '5 caras por pieza: 1 click para el estado del tratamiento', 'Doble click para estados de la pieza: TC, corona, implante, ausente…', 'Puentes y prótesis, con autoguardado'],
    imagenes: [{ src: '/landing/odontograma.webp', alt: 'Odontograma interactivo de OdonLoop' }],
  },
  {
    icon: FileDown, color: 'text-rose-400', titulo: 'Exportar a PDF',
    bajada: 'El seguimiento y el odontograma listos para imprimir o compartir.',
    items: ['Datos del paciente, odontograma y seguimientos', 'Un click desde la ficha del paciente', 'Tus datos siempre exportables'],
    imagenes: [{ src: '/landing/pdf.webp', alt: 'PDF de seguimiento generado por OdonLoop' }],
  },
];

const CONFIANZA = [
  { icon: DatabaseBackup, titulo: 'Backups automáticos todos los días', texto: 'Tu información se respalda sola, sin que hagas nada.' },
  { icon: ShieldCheck, titulo: 'Solo vos ves a tus pacientes', texto: 'Acceso con usuario y contraseña; cada profesional ve únicamente los suyos.' },
  { icon: Smartphone, titulo: 'Sin instalar nada', texto: 'Funciona en el navegador de tu compu, tablet o celular.' },
  { icon: MessageCircle, titulo: 'Soporte directo por WhatsApp', texto: 'Hablás con quien desarrolla OdonLoop, no con un bot.' },
];

const PREGUNTAS = [
  { p: '¿Cómo funciona la prueba gratis?', r: `Te registrás, confirmás tu email y entrás directo con todas las funciones del plan Premium durante ${DIAS_PRUEBA} días. No pedimos tarjeta. Antes de que termine te avisamos por email.` },
  { p: '¿Tengo que instalar algo?', r: 'No. Entrás desde odonloop.com con tu compu, tablet o celular.' },
  { p: '¿Cómo mando los recordatorios?', r: 'El recordatorio por email sale solo el día anterior al turno. Además, desde tu agenda tocás "Recordar" y se abre WhatsApp con el mensaje listo para enviar al paciente.' },
  { p: '¿Me ayudan a empezar?', r: 'Sí. Te capacitamos y te explicamos todo por WhatsApp o videollamada.' },
  { p: '¿Tengo que cargar a todos mis pacientes?', r: 'No hace falta hacerlo de una vez: empezá por los de esta semana y sumá el resto a medida que vienen. Además, tus pacientes pueden registrarse solos en OdonLoop para pedirte turno.' },
  { p: '¿Mis datos están seguros?', r: 'Se hacen backups automáticos todos los días, el acceso es con usuario y contraseña y cada odontólogo ve solo a sus pacientes. Además podés exportar la información a PDF cuando quieras.' },
  { p: '¿Qué pasa si dejo de pagar?', r: 'Tu cuenta se pausa pero tus datos quedan guardados. Si volvés, retomás donde lo dejaste.' },
  { p: '¿Reemplaza a la historia clínica?', r: 'Hoy OdonLoop es un registro de seguimiento para organizar tu consultorio. La historia clínica legal la seguís llevando según la normativa vigente.' },
  { p: '¿Cómo se paga?', r: 'Antes de que termine tu prueba te contactamos y coordinamos el pago por WhatsApp.' },
];

const Seccion = ({ id, children, className = '' }) => (
  <section id={id} className={`max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20 ${className}`}>{children}</section>
);

const TituloSeccion = ({ kicker, titulo, bajada }) => (
  <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
    {kicker && <p className="text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-widest">{kicker}</p>}
    <h2 className="text-3xl md:text-4xl font-black text-white">{titulo}</h2>
    {bajada && <p className="text-slate-300">{bajada}</p>}
  </div>
);

const Captura = ({ src, alt, className = '' }) => (
  <img src={src} alt={alt} loading="lazy" className={`rounded-2xl border border-white/10 shadow-2xl shadow-black/50 ${className}`} />
);

// Los links con fondo usan text-slate-50 y no text-white: en modo claro, index.css oscurece los a.inline-flex.text-white
const BotonesCTA = ({ origen, centrado = false, onDemo, cargandoDemo, errorDemo }) => (
  <div className={`space-y-3 ${centrado ? 'flex flex-col items-center' : ''}`}>
    <div className={`flex flex-wrap gap-3 ${centrado ? 'justify-center' : ''}`}>
      <Link
        to="/register/odontologo"
        onClick={() => trackEvent('cta_prueba', { origen })}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-slate-50 font-bold rounded-2xl px-6 py-4 shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
      >
        <Gift className="w-5 h-5" />
        Probalo {DIAS_PRUEBA} días gratis
      </Link>
      <button
        onClick={onDemo}
        disabled={cargandoDemo}
        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold rounded-2xl px-6 py-4 transition-colors cursor-pointer disabled:opacity-60"
      >
        {cargandoDemo ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
        Ver la demo
      </button>
    </div>
    <p className="text-xs text-slate-400">Sin tarjeta · Sin instalar nada · Soporte directo por WhatsApp</p>
    {errorDemo && <p className="text-sm text-amber-700 dark:text-amber-300">{errorDemo}</p>}
  </div>
);


const HomePage = () => {
  const navigate = useNavigate();
  const [planes, setPlanes] = useState(FALLBACK_PLANES);
  const [cargandoDemo, setCargandoDemo] = useState(false);
  const [errorDemo, setErrorDemo] = useState('');

  useEffect(() => {
    getPlanes()
      .then((data) => { if (Array.isArray(data) && data.length) setPlanes(data); })
      .catch(() => {});
  }, []);

  const ofertaVigente = ofertaFundadorVigente();
  const textoDiasOferta = calcularTextoDiasOferta();
  const precioPremium = planes.find((plan) => plan.plan_key === 'premium')?.precio;

  const probarDemo = async () => {
    setCargandoDemo(true);
    setErrorDemo('');
    try {
      const data = await crearDemo();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      trackEvent('start_demo');
      navigate('/home-odontologo');
    } catch (error) {
      setErrorDemo(error.status === 429
        ? 'Se crearon muchas demos desde tu conexión. Probá de nuevo en un rato o creá tu cuenta gratis.'
        : 'No pudimos abrir la demo. Probá de nuevo en unos segundos.');
    } finally {
      setCargandoDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col relative overflow-hidden text-white">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none"></div>
      <Navbar />

      <main className="flex-grow z-10 space-y-24 py-12 md:py-20">
        {/* ── Hero ── */}
        <Seccion className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-400/20 dark:text-blue-300 rounded-full px-3.5 py-1 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Software para odontólogos · Hecho en Argentina
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight">
              Menos faltazos.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
                Tu consultorio, ordenado.
              </span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-xl">
              Turnos con recordatorio por WhatsApp y email, el seguimiento de cada paciente con fotos y radiografías,
              odontograma interactivo y PDF. Todo en un solo lugar, desde tu compu o tu celular.
            </p>
            <BotonesCTA origen="hero" onDemo={probarDemo} cargandoDemo={cargandoDemo} errorDemo={errorDemo} />
            {ofertaVigente && (
              <a
                href="#planes"
                className="inline-flex flex-wrap items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-400/30 dark:text-emerald-200 dark:hover:bg-emerald-500/20 rounded-xl px-4 py-2.5 text-sm transition-colors"
              >
                <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                <span><strong className="text-slate-900 dark:text-white">Precio Fundador:</strong> Premium a {OFERTA_FUNDADOR.precio} congelado · {textoDiasOferta}</span>
              </a>
            )}
          </div>
          <div className="relative">
            <Captura src="/landing/odontograma.webp" alt="Odontograma interactivo de OdonLoop" className="w-full bg-white" />
            <Captura src="/landing/menu-estado.webp" alt="Menú de estado del tratamiento" className="hidden sm:block absolute -bottom-16 right-4 w-36 md:w-40" />
          </div>
        </Seccion>

        {/* ── Dolores → solución ── */}
        <Seccion>
          <div className="grid md:grid-cols-3 gap-4">
            {DOLORES.map(({ dolor, solucion, icon }) => {
              const Icon = icon;
              return (
                <div key={dolor} className="bg-white border border-slate-200 shadow-sm dark:bg-slate-900/50 dark:border-white/5 dark:shadow-none rounded-2xl p-6 space-y-3">
                  <Icon className="w-8 h-8 text-cyan-600 dark:text-cyan-300" />
                  <p className="text-slate-400 line-through decoration-rose-400/70">{dolor}</p>
                  <p className="font-bold text-white">{solucion}</p>
                </div>
              );
            })}
          </div>
        </Seccion>

        {/* ── Funciones con capturas reales ── */}
        <Seccion id="funciones">
          <TituloSeccion kicker="Cómo funciona" titulo="Todo lo que usás todos los días" bajada="Estas son pantallas reales de OdonLoop (con pacientes de ejemplo)." />
          <div className="space-y-20">
            {FUNCIONES.map(({ icon, color, titulo, bajada, items, imagenes }, i) => {
              const Icon = icon;
              return (
                <div key={titulo} className="grid lg:grid-cols-2 gap-10 items-center">
                  <div className={`space-y-4 ${i % 2 ? 'lg:order-2' : ''}`}>
                    <Icon className={`w-10 h-10 ${color}`} />
                    <h3 className="text-2xl md:text-3xl font-black">{titulo}</h3>
                    <p className="text-slate-300 text-lg">{bajada}</p>
                    <ul className="space-y-2">
                      {items.map((item) => (
                        <li key={item} className="flex gap-2 text-slate-200">
                          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative">
                    {imagenes.filter((img) => !img.chica).map((img) => (
                      <Captura key={img.src} {...img} className="w-full max-h-[520px] object-cover object-top" />
                    ))}
                    {imagenes.filter((img) => img.chica).map((img) => (
                      <Captura key={img.src} {...img} className="hidden sm:block absolute -bottom-10 -right-4 w-40 md:w-48" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Seccion>

        {/* ── Confianza ── */}
        <Seccion>
          <TituloSeccion kicker="Tranquilidad" titulo="Tus datos, cuidados" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONFIANZA.map(({ icon, titulo, texto }) => {
              const Icon = icon;
              return (
                <div key={titulo} className="bg-white border border-slate-200 shadow-sm dark:bg-slate-900/50 dark:border-white/5 dark:shadow-none rounded-2xl p-6 space-y-2">
                  <Icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  <p className="font-bold">{titulo}</p>
                  <p className="text-sm text-slate-400">{texto}</p>
                </div>
              );
            })}
          </div>
        </Seccion>

        {/* ── Testimonios (solo si hay reales cargados) ── */}
        {TESTIMONIOS.length > 0 && (
          <Seccion>
            <TituloSeccion kicker="Lo que dicen" titulo="Colegas que ya lo usan" />
            <div className="grid md:grid-cols-2 gap-6">
              {TESTIMONIOS.map((t) => (
                <figure key={t.nombre} className="bg-white border border-slate-200 shadow-sm dark:bg-slate-900/50 dark:border-white/5 dark:shadow-none rounded-2xl p-6 space-y-4">
                  <Quote className="w-8 h-8 text-blue-400" />
                  <blockquote className="text-lg text-slate-200">“{t.texto}”</blockquote>
                  <figcaption className="flex items-center gap-3">
                    {t.foto && <img src={t.foto} alt={t.nombre} className="w-12 h-12 rounded-full object-cover" />}
                    <div>
                      <p className="font-bold">{t.nombre}</p>
                      {t.ciudad && <p className="text-sm text-slate-400">{t.ciudad}</p>}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Seccion>
        )}

        {/* ── Precios ── */}
        <Seccion id="planes">
          <TituloSeccion kicker="Precios" titulo="Empezá gratis, pagá cuando te sirva" bajada={`Probás todo el plan Premium ${DIAS_PRUEBA} días sin cargar tarjeta.`} />
          {ofertaVigente && (
            <div className="mb-8 rounded-3xl border-2 border-emerald-400/40 bg-emerald-500/10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <p className="flex flex-wrap items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-widest">
                  Precio Fundador · hasta el {fechaFinOfertaTexto}
                  <span className="normal-case tracking-normal bg-emerald-400 text-emerald-950 rounded-full px-2.5 py-0.5">{textoDiasOferta}</span>
                </p>
                <p className="text-2xl md:text-3xl font-black">
                  Premium a {OFERTA_FUNDADOR.precio}, congelado por {OFERTA_FUNDADOR.meses} meses
                </p>
                <p className="text-slate-300">
                  Registrate antes del {fechaFinOfertaTexto} y lo mantenés al terminar tu prueba gratis.
                  {precioPremium && <> Precio normal: <span className="line-through">{precioPremium}</span>.</>}
                </p>
                <p className="text-slate-300">Incluye capacitación y soporte directo por WhatsApp.</p>
              </div>
              <div className="shrink-0 flex flex-col items-center gap-2">
                <Link
                  to="/register/odontologo"
                  onClick={() => trackEvent('cta_prueba', { origen: 'precio_fundador' })}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-slate-50 font-bold rounded-2xl px-6 py-4 transition-colors"
                >
                  <Gift className="w-5 h-5" />
                  Registrarme con Precio Fundador
                </Link>
                <a
                  href={linkWhatsAppVentas('Hola! Tengo una consulta sobre el Precio Fundador de OdonLoop.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('contact', { origen: 'precio_fundador' })}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  ¿Consultas? Escribinos
                </a>
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {planes.map((plan) => {
              const premium = plan.plan_key === 'premium';
              const incluye = [
                ['Seguimiento de pacientes', true],
                [`${plan.limite_almacenamiento_gb} GB para archivos`, true],
                ['Gestión de Turnos y recordatorios', plan.tiene_turnos],
                ['Odontograma interactivo', plan.tiene_odontograma],
                ['Exportar a PDF', plan.tiene_exportacion_pdf],
              ];
              return (
                <div key={plan.plan_key} className={`relative rounded-2xl p-6 flex flex-col justify-between gap-6 ${premium ? 'bg-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/15' : 'bg-white border border-slate-200 shadow-sm dark:bg-slate-900/70 dark:border-white/5 dark:shadow-none'}`}>
                  {premium && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">RECOMENDADO</span>
                  )}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold">{plan.nombre}</h3>
                    <p className="text-3xl font-black">{plan.precio}</p>
                    <p className="text-slate-400 text-sm">{plan.descripcion}</p>
                    <ul className="space-y-2 text-sm">
                      {incluye.map(([texto, ok]) => (
                        <li key={texto} className={`flex gap-2 ${ok ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${ok ? 'text-emerald-400' : 'text-slate-700'}`} />
                          {texto}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    to="/register/odontologo"
                    onClick={() => trackEvent('cta_prueba', { origen: `plan_${plan.plan_key}` })}
                    className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-colors ${premium ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    Probar {DIAS_PRUEBA} días gratis
                  </Link>
                </div>
              );
            })}
          </div>
        </Seccion>

        {/* ── Preguntas frecuentes ── */}
        <Seccion id="preguntas">
          <TituloSeccion kicker="Preguntas frecuentes" titulo="Lo que nos suelen preguntar" />
          <div className="max-w-3xl mx-auto space-y-3">
            {PREGUNTAS.map(({ p, r }) => (
              <details key={p} className="group bg-white border border-slate-200 shadow-sm dark:bg-slate-900/50 dark:border-white/5 dark:shadow-none rounded-2xl p-5 open:border-blue-300 dark:open:border-blue-500/30">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-bold">
                  <span className="flex items-center gap-2"><HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />{p}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-slate-300 leading-relaxed">{r}</p>
              </details>
            ))}
          </div>
        </Seccion>

        {/* ── Quién está detrás ── */}
        <Seccion>
          <div className="max-w-3xl mx-auto bg-slate-900/60 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {FUNDADOR.foto ? (
              <img src={FUNDADOR.foto} alt={FUNDADOR.nombre} className="w-24 h-24 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black shrink-0">
                {FUNDADOR.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-widest">Quién está detrás</p>
              <p className="text-xl font-black">{FUNDADOR.nombre}</p>
              <p className="text-slate-300">{FUNDADOR.texto}</p>
            </div>
          </div>
        </Seccion>

        {/* ── CTA final ── */}
        <Seccion>
          <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 dark:from-blue-900/60 dark:to-indigo-950/60 dark:border-blue-500/30 p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-black">Probalo en tu consultorio esta semana</h2>
            <p className="text-slate-300 max-w-xl mx-auto">Registrate en 2 minutos y usá todo gratis durante {DIAS_PRUEBA} días. Si tenés dudas, te acompañamos por WhatsApp.</p>
            <BotonesCTA origen="final" centrado onDemo={probarDemo} cargandoDemo={cargandoDemo} errorDemo={errorDemo} />
          </div>
        </Seccion>

        {/* ── Pacientes y contacto ── */}
        <Seccion className="text-center text-sm text-slate-400 space-y-2">
          <p className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            ¿Sos paciente de un odontólogo que usa OdonLoop?{' '}
            <Link to="/register/paciente" className="text-blue-700 dark:text-blue-300 font-semibold hover:underline">Registrate para pedir turno</Link>
          </p>
          <p>
            <a href={YOUTUBE_DEMO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">Video de presentación</a>
            {' · '}
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">Instagram</a>
            {' · '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-slate-900 dark:hover:text-white">{CONTACT_EMAIL}</a>
          </p>
        </Seccion>
      </main>

      {/* WhatsApp flotante */}
      <a
        href={linkWhatsAppVentas('Hola! Quiero saber más sobre OdonLoop.')}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent('contact', { origen: 'whatsapp_flotante' })}
        aria-label="Escribinos por WhatsApp"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-50 font-bold rounded-full shadow-xl shadow-emerald-900/40 px-4 py-3 transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden sm:inline">¿Consultas? Escribinos</span>
      </a>

      <Footer />
    </div>
  );
};

export default HomePage;
