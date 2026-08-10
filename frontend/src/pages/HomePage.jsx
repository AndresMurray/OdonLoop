import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PlanModal } from '../components';
import { getPlanes } from '../api/odontologoService';
import { Users, Stethoscope, LogIn, CalendarCheck, ClipboardList, SmilePlus, Gift, Mail, Play, Instagram, Check, Sparkles } from 'lucide-react';

const HomePage = () => {
  const [planesModalOpen, setPlanesModalOpen] = useState(false);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fallbackPlanes = [
    {
      plan_key: 'basico',
      nombre: 'Plan Básico',
      precio: 'Gratis',
      limite_almacenamiento_gb: 1,
      tiene_turnos: false,
      tiene_recordatorios_email: false,
      tiene_odontograma: false,
      tiene_exportacion_pdf: false,
      descripcion: 'Seguimiento básico de pacientes con 1GB de almacenamiento para imágenes y archivos.'
    },
    {
      plan_key: 'medio',
      nombre: 'Plan Medio',
      precio: '$5.000/mes',
      limite_almacenamiento_gb: 1,
      tiene_turnos: true,
      tiene_recordatorios_email: true,
      tiene_odontograma: false,
      tiene_exportacion_pdf: false,
      descripcion: 'Todo lo del plan básico más agenda de turnos y recordatorios automáticos por email.'
    },
    {
      plan_key: 'premium',
      nombre: 'Plan Premium',
      precio: '$12.000/mes',
      limite_almacenamiento_gb: 10,
      tiene_turnos: true,
      tiene_recordatorios_email: true,
      tiene_odontograma: true,
      tiene_exportacion_pdf: true,
      descripcion: 'Todo lo del plan medio más 10GB de almacenamiento, odontograma interactivo profesional y exportación a PDF.'
    }
  ];

  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        const data = await getPlanes();
        if (Array.isArray(data) && data.length > 0) {
          setPlanes(data);
        } else {
          setPlanes(fallbackPlanes);
        }
      } catch (error) {
        console.error('Error al cargar planes, usando fallbacks:', error);
        setPlanes(fallbackPlanes);
      } finally {
        setLoading(false);
      }
    };
    cargarPlanes();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col relative overflow-hidden text-white">
      {/* Background decorations / Glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/15 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none"></div>

      <Navbar />
      <div className="flex-grow px-4 sm:px-6 lg:px-8 py-8 md:py-16 z-10 flex flex-col justify-start items-center">
        <div className="max-w-7xl w-full space-y-12">

          {/* ── Grid Principal de Dos Columnas (Hero + Acceso Rápido) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Columna Izquierda: Presentación y características principales (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8 bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/5 p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center gap-1.5 bg-blue-550/10 border border-blue-400/20 rounded-full px-3.5 py-1 text-blue-300 text-xs font-semibold w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-blue-450" />
                  Gestión odontológica profesional
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
                  OdonLoop
                </h1>
                <p className="text-slate-300 text-base md:text-lg font-medium max-w-xl leading-relaxed">
                  Todo lo que tu consultorio necesita en una sola plataforma interactiva, segura y fácil de usar. Optimizá tu tiempo y mejorá la atención de tus pacientes.
                </p>
              </div>

              {/* Feature pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-2 relative z-10">
                <div className="flex flex-col items-start bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 shadow-lg">
                  <CalendarCheck className="w-8 h-8 text-blue-400 mb-2 shrink-0" />
                  <h3 className="text-white font-bold text-sm mb-1">Turnos con avisos</h3>
                  <p className="text-slate-400 text-xs leading-normal">Recordatorios automáticos por email a pacientes.</p>
                </div>
                <div className="flex flex-col items-start bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 shadow-lg">
                  <ClipboardList className="w-8 h-8 text-emerald-400 mb-2 shrink-0" />
                  <h3 className="text-white font-bold text-sm mb-1">Historial Clínico</h3>
                  <p className="text-slate-400 text-xs leading-normal">Seguimiento digital con notas y archivos adjuntos.</p>
                </div>
                <div className="flex flex-col items-start bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 shadow-lg">
                  <SmilePlus className="w-8 h-8 text-amber-400 mb-2 shrink-0" />
                  <h3 className="text-white font-bold text-sm mb-1">Odontograma</h3>
                  <p className="text-slate-400 text-xs leading-normal">Registro visual e interactivo de todas las piezas.</p>
                </div>
              </div>

              {/* Contacto + Redes Sociales en fila compacta */}
              <div className="flex flex-wrap gap-3 pt-2 relative z-10">
                <a
                  href="https://youtu.be/5HqWZP25XYY?si=U3sXYRRcPtbziMmN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-red-600/90 hover:bg-red-650 text-white font-semibold rounded-xl px-5 py-3 transition-colors duration-200 text-xs shadow-md"
                >
                  <Play className="w-4 h-4 text-red-200" />
                  Ver demo del sistema
                </a>
                <a
                  href="https://www.instagram.com/odonloop/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-semibold rounded-xl px-5 py-3 transition-colors duration-200 text-xs shadow-md"
                >
                  <Instagram className="w-4 h-4 text-pink-200" />
                  Seguinos en Instagram
                </a>
                <button
                  onClick={() => document.getElementById('planes-suscripcion')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 bg-blue-550/10 hover:bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold rounded-xl px-5 py-3 transition-all duration-200 text-xs shadow-md cursor-pointer animate-pulse"
                >
                  Ver Planes ↓
                </button>
                <a
                  href="mailto:sistemagestionodontologico@gmail.com"
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl px-5 py-3 transition-colors duration-200 text-xs border border-white/5 shadow-md"
                >
                  <Mail className="w-4 h-4 text-slate-300" />
                  Contacto
                </a>
              </div>
            </div>

            {/* Columna Derecha: Acceso rápido e Iniciar sesión / Registrarse (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-center bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 text-center shadow-2xl relative overflow-hidden group">
              {/* Resplandor decorativo interno */}
              <div className="absolute top-0 right-0 w-[180px] h-[180px] rounded-full bg-blue-500/10 blur-[50px] pointer-events-none group-hover:bg-blue-500/15 transition-all duration-300"></div>
              
              <div className="relative z-10 space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white">Ingreso al Sistema</h2>
                  <p className="text-slate-400 text-xs mt-1">Accedé a tu agenda y expedientes de pacientes.</p>
                </div>

                <Link to="/login" className="block">
                  <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-650 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl py-4 text-base shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                    <LogIn className="w-5 h-5" />
                    Iniciar Sesión
                  </button>
                </Link>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-3 text-slate-500 text-[10px] uppercase font-bold tracking-wider">¿No tenés una cuenta?</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                <div className="space-y-3">
                  <Link to="/register/odontologo" className="block">
                    <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white font-bold rounded-xl py-3.5 transition-all duration-200 text-xs">
                      <Stethoscope className="w-4.5 h-4.5 text-blue-450" />
                      Registrarme como Odontólogo
                    </button>
                  </Link>
                  <Link to="/register/paciente" className="block">
                    <button className="w-full flex items-center justify-center gap-2 bg-slate-950/40 hover:bg-slate-950/80 border border-white/5 text-slate-350 hover:text-white font-bold rounded-xl py-3.5 transition-all duration-200 text-xs">
                      <Users className="w-4.5 h-4.5 text-emerald-400" />
                      Registrarme como Paciente
                    </button>
                  </Link>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-550/20 rounded-full px-4 py-1.5 text-emerald-400 font-semibold text-xs">
                    <Gift className="w-4 h-4" />
                    <span>¡30 días gratis de prueba!</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── Sección de Planes de Suscripción ── */}
          <div id="planes-suscripcion" className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/5 p-8 md:p-10 shadow-2xl scroll-mt-6 text-center space-y-8">
            <div>
              <button
                onClick={() => setPlanesModalOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/30 rounded-full px-6 py-2 text-blue-300 font-bold text-xs transition-all duration-300"
              >
                Conocé a detalle los Planes de Suscripción
              </button>
              <h2 className="text-3xl font-black text-white mt-4 mb-2">
                Nuestros Planes de Suscripción
              </h2>
              <p className="text-slate-300 text-sm max-w-xl mx-auto">
                Elegí el plan que mejor se adapte a las necesidades de tu consultorio. Empezá hoy mismo.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left animate-fadeIn">
                {planes.map((plan) => {
                  const isPremium = plan.plan_key === 'premium';
                  return (
                    <div
                      key={plan.plan_key}
                      className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-305 hover:-translate-y-1 ${isPremium
                        ? 'bg-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/15 text-white'
                        : 'bg-slate-900/80 border border-white/5 hover:border-white/10 shadow-lg text-white'
                        }`}
                    >
                      {isPremium && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                          <Sparkles className="w-3 h-3 fill-white" />
                          RECOMENDADO
                        </span>
                      )}

                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{plan.nombre}</h3>
                        <p className="text-slate-300 text-xs min-h-[36px] leading-relaxed mb-3">
                          {plan.descripcion}
                        </p>
                        <p className="text-2xl font-black text-white mb-4">{plan.precio}</p>

                        <hr className="my-3 border-white/5" />

                        <ul className="space-y-2.5 mb-6 text-xs font-medium text-slate-250">
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>Seguimiento de pacientes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{plan.limite_almacenamiento_gb} GB almacenamiento</span>
                          </li>
                          <li className="flex items-start gap-2">
                            {plan.tiene_turnos ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <span className="w-3.5 h-3.5 block border border-slate-700 rounded-full shrink-0 mt-0.5"></span>
                            )}
                            <span className={plan.tiene_turnos ? '' : 'text-slate-500 line-through opacity-70'}>
                              Agenda de turnos
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            {plan.tiene_recordatorios_email ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <span className="w-3.5 h-3.5 block border border-slate-700 rounded-full shrink-0 mt-0.5"></span>
                            )}
                            <span className={plan.tiene_recordatorios_email ? '' : 'text-slate-500 line-through opacity-70'}>
                              Recordatorios por mail
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            {plan.tiene_odontograma ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <span className="w-3.5 h-3.5 block border border-slate-700 rounded-full shrink-0 mt-0.5"></span>
                            )}
                            <span className={plan.tiene_odontograma ? '' : 'text-slate-500 line-through opacity-70'}>
                              Odontograma interactivo
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            {plan.tiene_exportacion_pdf ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <span className="w-3.5 h-3.5 block border border-slate-700 rounded-full shrink-0 mt-0.5"></span>
                            )}
                            <span className={plan.tiene_exportacion_pdf ? '' : 'text-slate-500 line-through opacity-70'}>
                              Exportar historial a PDF
                            </span>
                          </li>
                        </ul>
                      </div>

                      <a
                        href={`https://wa.me/5492262512370?text=${encodeURIComponent(`Hola! Estoy interesado en el plan ${plan.nombre} de Odonloop.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center transition-all duration-200 block ${isPremium
                          ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/25 active:scale-95'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/5 hover:border-white/10 active:scale-95 shadow-sm'
                          }`}
                      >
                        Me interesa
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
      <PlanModal isOpen={planesModalOpen} onClose={() => setPlanesModalOpen(false)} />
      <Footer />
    </div>
  );
};

export default HomePage;
