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
      <div className="flex-grow flex items-center justify-center px-4 py-12 z-10">
        <div className="max-w-4xl w-full space-y-10">

          {/* ── Hero / Welcome Card ── */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12 text-center shadow-2xl">
            <h1 className="text-5xl md:text-6xl font-black mb-3 leading-tight animate-fadeIn tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-450">
              OdonLoop
            </h1>
            <p className="text-blue-400 text-lg md:text-xl font-semibold mb-6">
              Todo lo que tu consultorio necesita, en una sola plataforma.
            </p>

            {/* Feature pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-lg">
                <CalendarCheck className="w-9 h-9 text-blue-450 mb-2" />
                <h3 className="text-white font-bold text-sm mb-1">Turnos con avisos por mail</h3>
                <p className="text-slate-300 text-xs">Tus pacientes reciben recordatorios automáticos.</p>
              </div>
              <div className="flex flex-col items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-lg">
                <ClipboardList className="w-9 h-9 text-emerald-450 mb-2" />
                <h3 className="text-white font-bold text-sm mb-1">Seguimiento de pacientes</h3>
                <p className="text-slate-300 text-xs">Historial clínico con notas, imágenes y archivos de cada visita.</p>
              </div>
              <div className="flex flex-col items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-lg">
                <SmilePlus className="w-9 h-9 text-amber-450 mb-2" />
                <h3 className="text-white font-bold text-sm mb-1">Odontograma interactivo</h3>
                <p className="text-slate-300 text-xs">Registrá tratamientos de forma visual.</p>
              </div>
            </div>

            {/* Conocé nuestros planes button */}
            <div className="mb-6">
              <button
                onClick={() => document.getElementById('planes-suscripcion')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/30 rounded-full px-6 py-2.5 text-blue-300 font-bold text-sm transition-all duration-300 shadow-md"
              >
                Conocé nuestros Planes de Suscripción
              </button>
            </div>

            {/* 30-day trial banner */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-550/20 rounded-full px-6 py-2 mb-8">
              <Gift className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-350 font-semibold text-sm">
                ¡Los primeros 30 días de prueba son gratis!
              </span>
            </div>

            {/* Contact + Demo + Instagram row */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap w-full">
              <a
                href="mailto:sistemagestionodontologico@gmail.com"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 border border-blue-400/30 text-white font-semibold rounded-lg px-5 py-3 transition-colors duration-300 text-sm shadow-md"
              >
                <Mail className="w-5 h-5 text-blue-200" />
                Contactate
              </a>
              <a
                href="https://youtu.be/5HqWZP25XYY?si=U3sXYRRcPtbziMmN"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-650 hover:bg-red-700 text-white font-semibold rounded-lg px-5 py-3 transition-colors duration-300 text-sm shadow-md"
              >
                <Play className="w-5 h-5 text-red-200" />
                Ver demo del sistema
              </a>
              <a
                href="https://www.instagram.com/odonloop/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-semibold rounded-lg px-5 py-3 transition-colors duration-300 text-sm shadow-md"
              >
                <Instagram className="w-5 h-5 text-pink-200" />
                Seguinos en Instagram
              </a>
            </div>

            {/* ── Sección de Planes de Suscripción ── */}
            <div id="planes-suscripcion" className="border-t border-white/10 pt-10 mt-10 scroll-mt-6">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                Nuestros Planes de Suscripción
              </h2>
              <p className="text-slate-300 text-sm max-w-xl mx-auto mb-8">
                Elegí el plan que mejor se adapte a las necesidades de tu consultorio. Empezá hoy mismo.
              </p>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left animate-fadeIn">
                  {planes.map((plan) => {
                    const isPremium = plan.plan_key === 'premium';
                    return (
                      <div
                        key={plan.plan_key}
                        className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${isPremium
                          ? 'bg-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/25 text-white'
                          : 'bg-slate-900/80 backdrop-blur-md border border-white/10 hover:border-white/20 shadow-lg text-white'
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

                          <hr className="my-3 border-white/10" />

                          <ul className="space-y-2.5 mb-6 text-xs font-medium text-slate-200">
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
                                <span className="w-3.5 h-3.5 block select-none border border-slate-700 rounded-full shrink-0 mt-0.5"></span>
                              )}
                              <span className={plan.tiene_turnos ? '' : 'text-slate-500 line-through opacity-70'}>
                                Agenda de turnos
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              {plan.tiene_recordatorios_email ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <span className="w-3.5 h-3.5 block select-none border border-slate-700 rounded-full shrink-0 mt-0.5"></span>
                              )}
                              <span className={plan.tiene_recordatorios_email ? '' : 'text-slate-500 line-through opacity-70'}>
                                Recordatorios por mail
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              {plan.tiene_odontograma ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <span className="w-3.5 h-3.5 block select-none border border-slate-700 rounded-full shrink-0 mt-0.5"></span>
                              )}
                              <span className={plan.tiene_odontograma ? '' : 'text-slate-500 line-through opacity-70'}>
                                Odontograma interactivo
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              {plan.tiene_exportacion_pdf ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <span className="w-3.5 h-3.5 block select-none border border-slate-700 rounded-full shrink-0 mt-0.5"></span>
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
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20 active:scale-95 shadow-sm'
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

            {/* ── Separador ── */}
            <div className="border-t border-white/10 my-10"></div>

            {/* ── Login + Registro compacto ── */}
            <div className="space-y-4">
              {/* Iniciar Sesión — prominente */}
              <Link to="/login" className="block">
                <button className="w-full sm:w-auto mx-auto flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl px-12 py-4 text-lg shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-300">
                  <LogIn className="w-6 h-6" />
                  Iniciar Sesión
                </button>
              </Link>

              <p className="text-slate-400 text-sm font-semibold">
                ¿No tenés cuenta? Registrate:
              </p>

              {/* Registro en fila compacta */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link to="/register/paciente" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl px-6 py-3 shadow-md hover:shadow-lg transition-all duration-300 text-sm">
                    <Users className="w-5 h-5 text-blue-400" />
                    Registrarme como Paciente
                  </button>
                </Link>
                <Link to="/register/odontologo" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold rounded-xl px-6 py-3 shadow-md hover:shadow-lg transition-all duration-300 text-sm">
                    <Stethoscope className="w-5 h-5 text-slate-400" />
                    Registrarme como Odontólogo
                  </button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
      <PlanModal isOpen={planesModalOpen} onClose={() => setPlanesModalOpen(false)} />
      <Footer />
    </div>
  );
};

export default HomePage;
