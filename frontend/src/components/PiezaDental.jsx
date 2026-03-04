import { useState, useRef, memo } from 'react';
import TratamientoMenu from './TratamientoMenu';

/**
 * Componente que representa una pieza dental con sus 5 caras
 * Sistema profesional de marcado:
 * - Click en cara: menú de tratamiento
 * - Click central largo: menú de estado de pieza
 * - Azul = pendiente, Rojo = realizado
 * - Estados especiales: X (ausente/extracción), ◯ (corona), I (implante), etc.
 */
const PiezaDental = memo(({ numero, registro, onChange, tipo = 'permanente', onMenuOpen, deshabilitarMenu = false }) => {
  const [hoveredCara, setHoveredCara] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const longPressTimerRef = useRef(null);
  const touchMovedRef = useRef(false);

  // Manejar long-press táctil en la cara oclusal para abrir menú de estado de pieza (mobile)
  const handleTouchStart = (e) => {
    if (deshabilitarMenu) return;
    touchMovedRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      if (!touchMovedRef.current) {
        e.stopPropagation();
        setMenuAbierto({ tipo: 'pieza' });
        if (onMenuOpen) onMenuOpen();
      }
    }, 600);
  };

  const handleTouchMove = () => {
    touchMovedRef.current = true;
    clearTimeout(longPressTimerRef.current);
  };

  const handleTouchEnd = (e) => {
    // Si no hubo long-press, se trata como click normal (tratamiento de cara oclusal)
    if (!touchMovedRef.current && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  // Obtener el estado actual de una cara (ahora es un objeto JSON o null)
  const getEstadoCara = (cara) => {
    if (!registro) return null;
    const valor = registro[`cara_${cara}`];
    // Si es un objeto, retornarlo; si no, retornar null
    return valor && typeof valor === 'object' ? valor : null;
  };

  // Obtener el color según el estado de la cara
  const getColorCara = (cara) => {
    const estado = getEstadoCara(cara);
    if (!estado || !estado.tipo) return '#E5E7EB'; // Gris claro (sin marca)

    // Absceso tiene color amarillo
    if (estado.tipo === 'absceso') return '#EAB308'; // Amarillo

    // Color basado en el estado (pendiente = azul, realizado = rojo, realizado_filtrado = rojo)
    if (estado.estado === 'pendiente') return '#3B82F6'; // Azul
    if (estado.estado === 'realizado') return '#EF4444'; // Rojo
    if (estado.estado === 'realizado_filtrado') return '#EF4444'; // Rojo (el borde azul se maneja aparte)
    return '#E5E7EB';
  };

  // Verificar si una cara tiene estado "realizado filtrado" para el borde azul
  const esRealizadoFiltrado = (cara) => {
    const estado = getEstadoCara(cara);
    return estado?.estado === 'realizado_filtrado';
  };

  // Obtener estados de la pieza completa (ahora es un array)
  const estadosPieza = Array.isArray(registro?.estado_pieza) ? registro.estado_pieza : [];

  // Helpers para verificar si tiene un estado específico
  const tieneEstado = (estado) => estadosPieza.includes(estado);

  // Manejar el click en una cara
  const handleCaraClick = (e, cara) => {
    if (deshabilitarMenu) {
      // En modo marca (puente/prótesis), permitir propagación del evento
      return;
    }

    e.stopPropagation();
    setMenuAbierto({ tipo: 'cara', cara });
    if (onMenuOpen) onMenuOpen();
  };

  // Manejar click central largo para menú de pieza completa
  const handleCenterLongClick = (e) => {
    if (deshabilitarMenu) {
      // En modo marca (puente/prótesis), permitir propagación del evento
      return;
    }

    e.stopPropagation();
    setMenuAbierto({ tipo: 'pieza' });
    if (onMenuOpen) onMenuOpen();
  };

  // Manejar selección desde el menú
  const handleMenuSelect = (valor) => {
    if (!menuAbierto) return;

    if (menuAbierto.tipo === 'cara') {
      // Actualizar cara específica
      const nuevoRegistro = {
        ...(registro || {}),  // Asegurar que registro no sea null
        [`cara_${menuAbierto.cara}`]: valor
      };
      onChange(numero, nuevoRegistro);
    } else {
      // Actualizar estado de pieza
      const nuevoRegistro = {
        ...(registro || {}),  // Asegurar que registro no sea null
        estado_pieza: valor?.estadoPieza || valor || null
      };
      onChange(numero, nuevoRegistro);
    }

    setMenuAbierto(null);
  };

  // Cerrar menú
  const handleMenuClose = () => {
    setMenuAbierto(null);
  };

  // Estilo base de la pieza
  const esTemporal = tipo === 'temporal';
  const tamano = 'w-[55px] h-[55px]';

  return (
    <div className="flex flex-col items-center m-0.5 relative">
      {/* Marcadores especiales arriba del número */}
      <div className="h-5 flex items-center justify-center gap-1 mb-1">
        {tieneEstado('tc_realizado') && (
          <span className="text-red-600 text-[10px] font-bold px-1 py-0.5 bg-red-100 rounded border border-red-300">TC</span>
        )}
        {tieneEstado('tc_pendiente') && (
          <span className="text-blue-600 text-[10px] font-bold px-1 py-0.5 bg-blue-100 rounded border border-blue-300">TC</span>
        )}
        {tieneEstado('implante') && (
          <span className="text-green-600 text-[10px] font-bold px-1 py-0.5 bg-green-100 rounded border border-green-300">I</span>
        )}
        {registro?.puente && (
          <span className="text-red-600 text-[10px] font-bold px-1 py-0.5 bg-red-100 rounded border border-red-300">
            {registro.puente.tipo === 'protesis' ? 'PR' : 'P'}
          </span>
        )}
      </div>

      {/* Número de la pieza */}
      <div className={`text-xs font-bold mb-1.5 ${esTemporal ? 'text-purple-600' : 'text-gray-700'}`}>
        {numero}
      </div>

      {/* Pieza dental con 5 caras */}
      <div className={`relative ${tamano} bg-white border-2 border-gray-400 rounded-xl shadow-md hover:shadow-lg transition-shadow`}>
        {/* Cara Oclusal (Centro) */}
        <div
          className="absolute inset-0 m-[18px] rounded-full cursor-pointer transition-all duration-150 hover:scale-110 hover:shadow-lg hover:ring-2 hover:ring-gray-400"
          style={{
            backgroundColor: getColorCara('oclusal'),
            ...(esRealizadoFiltrado('oclusal') ? { border: '3px solid #2563EB', boxSizing: 'border-box' } : {})
          }}
          onClick={(e) => handleCaraClick(e, 'oclusal')}
          onContextMenu={(e) => {
            if (!deshabilitarMenu) {
              e.preventDefault();
              handleCenterLongClick(e);
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setHoveredCara('oclusal')}
          onMouseLeave={() => setHoveredCara(null)}
          title="Clic: Tratamiento | Clic derecho / mantener presionado: Estado de pieza"
        >
          {hoveredCara === 'oclusal' && estadosPieza.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow">
              O
            </div>
          )}
        </div>

        {/* Cara Vestibular (Arriba) */}
        <div
          className="absolute top-0 left-1/4 right-1/4 h-3.5 cursor-pointer transition-all duration-150 hover:brightness-110 hover:shadow-md rounded-t-lg"
          style={{
            backgroundColor: getColorCara('vestibular'),
            ...(esRealizadoFiltrado('vestibular') ? { border: '3px solid #2563EB', boxSizing: 'border-box' } : {})
          }}
          onClick={(e) => handleCaraClick(e, 'vestibular')}
          onMouseEnter={() => setHoveredCara('vestibular')}
          onMouseLeave={() => setHoveredCara(null)}
          title="Cara Vestibular - Clic para tratamiento"
        />

        {/* Cara Lingual (Abajo) */}
        <div
          className="absolute bottom-0 left-1/4 right-1/4 h-3.5 cursor-pointer transition-all duration-150 hover:brightness-110 hover:shadow-md rounded-b-lg"
          style={{
            backgroundColor: getColorCara('lingual'),
            ...(esRealizadoFiltrado('lingual') ? { border: '3px solid #2563EB', boxSizing: 'border-box' } : {})
          }}
          onClick={(e) => handleCaraClick(e, 'lingual')}
          onMouseEnter={() => setHoveredCara('lingual')}
          onMouseLeave={() => setHoveredCara(null)}
          title="Cara Lingual/Palatina - Clic para tratamiento"
        />

        {/* Cara Mesial (Izquierda) */}
        <div
          className="absolute left-0 top-1/4 bottom-1/4 w-3.5 cursor-pointer transition-all duration-150 hover:brightness-110 hover:shadow-md rounded-l-lg"
          style={{
            backgroundColor: getColorCara('mesial'),
            ...(esRealizadoFiltrado('mesial') ? { border: '3px solid #2563EB', boxSizing: 'border-box' } : {})
          }}
          onClick={(e) => handleCaraClick(e, 'mesial')}
          onMouseEnter={() => setHoveredCara('mesial')}
          onMouseLeave={() => setHoveredCara(null)}
          title="Cara Mesial - Clic para tratamiento"
        />

        {/* Cara Distal (Derecha) */}
        <div
          className="absolute right-0 top-1/4 bottom-1/4 w-3.5 cursor-pointer transition-all duration-150 hover:brightness-110 hover:shadow-md rounded-r-lg"
          style={{
            backgroundColor: getColorCara('distal'),
            ...(esRealizadoFiltrado('distal') ? { border: '3px solid #2563EB', boxSizing: 'border-box' } : {})
          }}
          onClick={(e) => handleCaraClick(e, 'distal')}
          onMouseEnter={() => setHoveredCara('distal')}
          onMouseLeave={() => setHoveredCara(null)}
          title="Cara Distal - Clic para tratamiento"
        />

        {/* Indicadores de absceso en caras */}
        {getEstadoCara('vestibular')?.tipo === 'absceso' && (
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-black pointer-events-none"></div>
        )}
        {getEstadoCara('lingual')?.tipo === 'absceso' && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-black pointer-events-none"></div>
        )}
        {getEstadoCara('mesial')?.tipo === 'absceso' && (
          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-black pointer-events-none"></div>
        )}
        {getEstadoCara('distal')?.tipo === 'absceso' && (
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-black pointer-events-none"></div>
        )}
        {getEstadoCara('oclusal')?.tipo === 'absceso' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-black"></div>
          </div>
        )}

        {/* Marcadores especiales para estados de pieza */}
        {tieneEstado('ausente') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="4" y1="4" x2="20" y2="20" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="20" y1="4" x2="4" y2="20" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {tieneEstado('extraccion') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="4" y1="4" x2="20" y2="20" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="20" y1="4" x2="4" y2="20" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* TC ya se muestra arriba del diente */}

        {tieneEstado('corona_realizada') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-9 h-9 rounded-full border-[3px] border-red-600"></div>
          </div>
        )}

        {tieneEstado('corona_pendiente') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-9 h-9 rounded-full border-[3px] border-blue-600"></div>
          </div>
        )}

        {/* Implante (I) ya se muestra arriba del diente */}

        {tieneEstado('restauracion_total') && (
          <div className="absolute inset-0 bg-red-600 rounded-lg opacity-40 pointer-events-none"></div>
        )}
      </div>

      {/* Indicador de tipo (solo para temporales) */}
      {esTemporal && (
        <div className="text-[10px] text-purple-500 mt-1">
          T
        </div>
      )}

      {/* Menú contextual */}
      {menuAbierto && (
        <TratamientoMenu
          onClose={handleMenuClose}
          onSelect={handleMenuSelect}
          currentValue={menuAbierto.tipo === 'cara' ? getEstadoCara(menuAbierto.cara) : null}
          estadosActuales={menuAbierto.tipo === 'pieza' ? estadosPieza : []}
          isWholeToothMenu={menuAbierto.tipo === 'pieza'}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si cambia el registro de ESTA pieza, el modo marca o el tipo
  return (
    prevProps.numero === nextProps.numero &&
    prevProps.tipo === nextProps.tipo &&
    prevProps.deshabilitarMenu === nextProps.deshabilitarMenu &&
    prevProps.registro === nextProps.registro
  );
});

export default PiezaDental;
