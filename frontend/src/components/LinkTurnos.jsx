import { useState } from 'react';
import { Link2, Copy, Check, ExternalLink, MessageCircle } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

/** Tarjeta con el link público para que los pacientes saquen turno sin registrarse. */
const LinkTurnos = ({ userData }) => {
  const [copiado, setCopiado] = useState(false);
  const suscripcion = userData?.suscripcion;
  if (!suscripcion?.slug_turnos || !suscripcion.acepta_turnos_online) return null;

  const url = `${window.location.origin}/turnos/${suscripcion.slug_turnos}`;
  const mensaje = `¡Hola! Ya podés sacar turno conmigo online, sin registrarte: ${url}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      trackEvent('link_turnos_copiado');
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Copiá tu link:', url);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 text-slate-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-white p-5 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            Tu link de turnos online
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Tus pacientes eligen un horario libre y reservan solos, sin registrarse. Ponelo en la bio de Instagram o mandalo por WhatsApp.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={copiar}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-slate-50 font-bold rounded-xl px-4 py-2 text-sm transition-colors cursor-pointer"
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiado ? '¡Copiado!' : 'Copiar link'}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('link_turnos_whatsapp')}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-slate-50 font-bold rounded-xl px-4 py-2 text-sm transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Compartir
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-400/40 dark:text-blue-200 dark:hover:bg-blue-500/20 font-bold rounded-xl px-4 py-2 text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver mi página
          </a>
        </div>
      </div>
      <p className="mt-3 text-sm font-mono break-all bg-white/70 dark:bg-slate-950/40 border border-blue-100 dark:border-white/10 rounded-lg px-3 py-2 text-blue-800 dark:text-blue-200">
        {url}
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Solo aparecen los turnos disponibles que marcaste como visibles en Gestión de Turnos.
      </p>
    </div>
  );
};

export default LinkTurnos;
