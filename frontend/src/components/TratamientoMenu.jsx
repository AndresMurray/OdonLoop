import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

/**
 * Menú contextual para seleccionar tipo de tratamiento y estado
 * Se muestra cuando el usuario hace clic en una cara del diente
 */
const TratamientoMenu = ({ 
  onClose, 
  onSelect, 
  isWholeToothMenu = false,
  estadosActuales = []  // Array de estados actualmente seleccionados
}) => {
  const menuRef = useRef(null);
  const [estadosSeleccionados, setEstadosSeleccionados] = useState(
    Array.isArray(estadosActuales) ? estadosActuales : []
  );

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Estados de pieza completa
  const estadosPieza = [
    { value: 'ausente', label: 'Ausente (X)', color: 'text-red-600', description: 'Diente faltante' },
    { value: 'extraccion', label: 'Extracción (X)', color: 'text-blue-600', description: 'Para extraer' },
    { value: 'tc_realizado', label: 'Tratamiento Conducto Realizado (TC)', color: 'text-red-600', description: 'Endodoncia completada' },
    { value: 'tc_pendiente', label: 'Tratamiento Conducto Pendiente (TC)', color: 'text-blue-600', description: 'Endodoncia por hacer' },
    { value: 'corona_realizada', label: 'Corona Realizada (◯)', color: 'text-red-600', description: 'Corona colocada' },
    { value: 'corona_pendiente', label: 'Corona Pendiente (◯)', color: 'text-blue-600', description: 'Corona a colocar' },
    { value: 'implante', label: 'Implante (I)', color: 'text-green-600', description: 'Implante dental' },
    { value: 'restauracion_total', label: 'Restauración Total', color: 'text-red-600', description: 'Diente completamente restaurado' },
  ];

  const handleEstadoSelect = (estado) => {
    // Usar tipo de tratamiento por defecto 'marca'
    onSelect({
      tipo: 'marca',
      estado: estado
    });
  };

  const handleToggleEstado = (estadoValue) => {
    setEstadosSeleccionados(prev => {
      if (prev.includes(estadoValue)) {
        // Si ya está seleccionado, quitarlo
        return prev.filter(e => e !== estadoValue);
      } else {
        // Si no está, agregarlo
        return [...prev, estadoValue];
      }
    });
  };

  const handleAplicar = () => {
    onSelect({ estadoPieza: estadosSeleccionados });
  };

  const handleLimpiar = () => {
    setEstadosSeleccionados([]);
    onSelect({ estadoPieza: [] });
  };

  // Menú para pieza completa
  if (isWholeToothMenu) {
    return createPortal(
      <>
        {/* Backdrop semi-transparente */}
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 bg-black/30 flex items-center justify-center p-4"
          style={{ zIndex: 9998 }}
          onClick={onClose}
        >
        <div 
          ref={menuRef}
          className="bg-white rounded-xl shadow-2xl border-2 border-gray-300 p-4 w-[340px] max-w-[90vw] max-h-[70vh] overflow-y-auto"
          style={{ zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-gray-200">
            <h3 className="font-bold text-base text-gray-800">Estados de la Pieza</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="text-xs text-gray-600 mb-3 italic">
            ✓ Puedes seleccionar múltiples estados
          </div>

          <div className="space-y-2">
            {estadosPieza.map(estado => {
              const isSelected = estadosSeleccionados.includes(estado.value);
              return (
                <button
                  key={estado.value}
                  onClick={() => handleToggleEstado(estado.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-400' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold text-sm ${estado.color}`}>{estado.label}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{estado.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t-2 border-gray-200 flex gap-2">
            <button
              onClick={handleLimpiar}
              className="flex-1 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold border-2 border-red-200"
            >
              🗑️ Limpiar
            </button>
            <button
              onClick={handleAplicar}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              ✓ Aplicar
            </button>
          </div>
          </div>
          </div>
        </>,
      document.body
    );
  }

  // Menú para cara individual
  return createPortal(
    <>
      {/* Backdrop semi-transparente */}
      <div 
        className="fixed top-0 left-0 right-0 bottom-0 bg-black/30 flex items-center justify-center p-4"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      >
      <div 
        ref={menuRef}
        className="bg-white rounded-xl shadow-2xl border-2 border-gray-300 p-4 w-[340px] max-w-[90vw] max-h-[70vh] overflow-y-auto"
        style={{ zIndex: 9999 }}
        onClick={(e) => e.stopPropagation()}
      >
      <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-gray-200">
        <h3 className="font-bold text-base text-gray-800">
          🎨 Seleccionar Estado
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          title="Cerrar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handleEstadoSelect('pendiente')}
          className="w-full px-5 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold text-base shadow-md hover:shadow-lg transform hover:scale-[1.02]"
        >
          🔵 Pendiente (Azul)
        </button>
        
        <button
          onClick={() => handleEstadoSelect('realizado')}
          className="w-full px-5 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold text-base shadow-md hover:shadow-lg transform hover:scale-[1.02]"
        >
          🔴 Realizado (Rojo)
        </button>

        <div className="mt-3 pt-3 border-t-2 border-gray-200">
          <button
            onClick={() => {
              onSelect({
                tipo: 'absceso',
                estado: 'activo'
              });
            }}
            className="w-full px-5 py-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all font-semibold text-base shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            ⚠️ Absceso/Fístula
          </button>
        </div>

        <div className="mt-4 pt-3 border-t-2 border-gray-200 flex gap-2">
          <button
            onClick={handleLimpiar}
            className="flex-1 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold border-2 border-red-200"
          >
            🗑️ Limpiar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold border-2 border-gray-200"
          >
            ✕ Cancelar
          </button>
        </div>
      </div>
    </div>
    </div>
    </>,
    document.body
  );
};

export default TratamientoMenu;
