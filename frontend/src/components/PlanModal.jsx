import { useState, useEffect } from 'react';
import { getPlanes } from '../api/odontologoService';
import { X, Check, Sparkles } from 'lucide-react';

const PlanModal = ({ isOpen, onClose }) => {
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
    if (isOpen) {
      const cargarPlanes = async () => {
        try {
          setLoading(true);
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto my-auto relative flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Decorative lights */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 text-center shrink-0 border-b border-slate-800/60 relative z-10">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors z-20"
          >
            <X className="w-4 h-4" />
          </button>
          
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Suscripción
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
            Encontrá el plan ideal para tu consultorio
          </h2>
          <p className="text-slate-400 mt-1 text-xs max-w-xl mx-auto">
            Hacé crecer tu práctica profesional con herramientas diseñadas a tu medida. Todos los planes incluyen actualizaciones constantes.
          </p>
        </div>

        {/* Planes list / grid (Scrollable Body) */}
        <div className="px-6 py-6 overflow-y-auto flex-grow z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400 mb-3"></div>
              <p className="text-slate-400 text-xs">Cargando planes de suscripción...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch mt-1">
              {planes.map((plan) => {
                const isPremium = plan.plan_key === 'premium';
                
                return (
                  <div
                    key={plan.plan_key}
                    className={`relative rounded-xl p-4 flex flex-col justify-between transition-all duration-300 ${
                      isPremium
                        ? 'bg-gradient-to-b from-blue-950/80 to-slate-900/90 border-2 border-blue-500 shadow-lg shadow-blue-500/20 scale-100 md:scale-100 z-10'
                        : 'bg-slate-950/80 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isPremium && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 fill-white" />
                        RECOMENDADO
                      </span>
                    )}

                    <div>
                      {/* Name & price */}
                      <div className="mb-2">
                        <h3 className="text-base font-bold text-white mb-0.5">{plan.nombre}</h3>
                        <p className="text-slate-400 text-[10px] min-h-[32px] leading-relaxed mb-2">
                          {plan.descripcion}
                        </p>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-xl font-extrabold text-white">{plan.precio}</span>
                        </div>
                      </div>

                      <hr className="border-slate-800 my-2.5" />

                      {/* Features */}
                      <ul className="space-y-1.5 mb-4">
                        <li className="flex items-start gap-2 text-xs text-slate-200">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>Seguimiento de pacientes</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-slate-200">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{plan.limite_almacenamiento_gb} GB almacenamiento</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-slate-200">
                          {plan.tiene_turnos ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <span className="w-3.5 h-3.5 block select-none border border-slate-700 rounded-full shrink-0 mt-0.5"></span>
                          )}
                          <span className={plan.tiene_turnos ? '' : 'text-slate-500 line-through opacity-70'}>
                            Agenda de turnos
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-slate-200">
                          {plan.tiene_recordatorios_email ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <span className="w-3.5 h-3.5 block select-none border border-slate-700 rounded-full shrink-0 mt-0.5"></span>
                          )}
                          <span className={plan.tiene_recordatorios_email ? '' : 'text-slate-500 line-through opacity-70'}>
                            Recordatorios por mail
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-slate-200">
                          {plan.tiene_odontograma ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <span className="w-3.5 h-3.5 block select-none border border-slate-700 rounded-full shrink-0 mt-0.5"></span>
                          )}
                          <span className={plan.tiene_odontograma ? '' : 'text-slate-500 line-through opacity-70'}>
                            Odontograma interactivo
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-slate-200">
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
                      href={`https://wa.me/5492262512370?text=${encodeURIComponent(`Hola! Estoy interesado en el ${plan.nombre} de Odonloop.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 block text-center ${
                        isPremium
                          ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 active:scale-95'
                          : 'bg-slate-800 hover:bg-slate-700 text-white active:scale-95'
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
  );
};

export default PlanModal;
