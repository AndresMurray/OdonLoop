import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Menú contextual para seleccionar tipo de tratamiento y estado
 * Se muestra cuando el usuario hace clic en una cara del diente
 */
const TratamientoMenu = ({ 
  position, 
  onClose, 
  onSelect, 
  isWholeToothMenu = false 
}) => {
  const menuRef = useRef(null);
  const [selectedTipo, setSelectedTipo] = useState(null);

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

  // Tipos de tratamiento para caras individuales
  const tiposTratamiento = [
    { value: 'caries', label: 'Caries', color: 'text-red-600' },
    { value: 'obturacion', label: 'Obturación', color: 'text-blue-600' },
    { value: 'endodoncia', label: 'Endodoncia', color: 'text-purple-600' },
    { value: 'incrustacion', label: 'Incrustación', color: 'text-yellow-600' },
    { value: 'composite', label: 'Composite', color: 'text-green-600' },
    { value: 'amalgama', label: 'Amalgama', color: 'text-gray-600' },
  ];

  // Estados de pieza completa
  const estadosPieza = [
    { value: 'ausente', label: 'Ausente (X)', color: 'text-red-600', description: 'Diente faltante' },
    { value: 'extraccion', label: 'Extracción (X)', color: 'text-blue-600', description: 'Para extraer' },
    { value: 'corona_realizada', label: 'Corona Realizada (◯)', color: 'text-red-600', description: 'Corona colocada' },
    { value: 'corona_pendiente', label: 'Corona Pendiente (◯)', color: 'text-blue-600', description: 'Corona a colocar' },
    { value: 'implante', label: 'Implante (I)', color: 'text-green-600', description: 'Implante dental' },
    { value: 'restauracion_total', label: 'Restauración Total', color: 'text-red-600', description: 'Diente completamente restaurado' },
    { value: 'absceso', label: 'Absceso/Fístula (◯)', color: 'text-blue-400', description: 'Infección presente' },
  ];

  const handleTipoSelect = (tipo) => {
    setSelectedTipo(tipo);
  };

  const handleEstadoSelect = (estado) => {
    // Enviar selección inmediatamente
    if (selectedTipo) {
      onSelect({
        tipo: selectedTipo,
        estado: estado
      });
    }
  };

  const handleEstadoPiezaSelect = (estadoPieza) => {
    onSelect({ estadoPieza });
  };

  const handleLimpiar = () => {
    onSelect(null);
  };

  // Menú para pieza completa
  if (isWholeToothMenu) {
    return (
      <div 
        ref={menuRef}
        className="fixed bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-3 z-50 min-w-[280px]"
        style={{ 
          top: `${position.y}px`, 
          left: `${position.x}px`,
          maxHeight: '400px',
          overflowY: 'auto'
        }}
      >
        <div className="flex justify-between items-center mb-3 pb-2 border-b">
          <h3 className="font-bold text-sm text-gray-700">Estado de la Pieza</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1">
          {estadosPieza.map(estado => (
            <button
              key={estado.value}
              onClick={() => handleEstadoPiezaSelect(estado.value)}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors ${estado.color}`}
            >
              <div className="font-medium text-sm">{estado.label}</div>
              <div className="text-xs text-gray-500">{estado.description}</div>
            </button>
          ))}
        </div>

        <button
          onClick={handleLimpiar}
          className="w-full mt-3 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          Limpiar
        </button>
      </div>
    );
  }

  // Menú para cara individual
  return (
    <div 
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-3 z-50 min-w-[280px]"
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px` 
      }}
    >
      <div className="flex justify-between items-center mb-3 pb-2 border-b">
        <h3 className="font-bold text-sm text-gray-700">
          {!selectedTipo ? 'Seleccionar Tratamiento' : 'Seleccionar Estado'}
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <X size={16} />
        </button>
      </div>

      {!selectedTipo ? (
        // Paso 1: Seleccionar tipo de tratamiento
        <div className="space-y-1">
          {tiposTratamiento.map(tipo => (
            <button
              key={tipo.value}
              onClick={() => handleTipoSelect(tipo.value)}
              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors ${tipo.color} font-medium`}
            >
              {tipo.label}
            </button>
          ))}
          
          <button
            onClick={handleLimpiar}
            className="w-full mt-3 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Limpiar
          </button>
        </div>
      ) : (
        // Paso 2: Seleccionar estado (pendiente o realizado)
        <div className="space-y-2">
          <div className="text-sm text-gray-600 mb-3">
            Tratamiento: <span className="font-bold">{tiposTratamiento.find(t => t.value === selectedTipo)?.label}</span>
          </div>
          
          <button
            onClick={() => handleEstadoSelect('pendiente')}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
          >
            Pendiente (Azul)
          </button>
          
          <button
            onClick={() => handleEstadoSelect('realizado')}
            className="w-full px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium"
          >
            Realizado (Rojo)
          </button>

          <button
            onClick={() => setSelectedTipo(null)}
            className="w-full mt-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
          >
            ← Volver
          </button>
        </div>
      )}
    </div>
  );
};

export default TratamientoMenu;
