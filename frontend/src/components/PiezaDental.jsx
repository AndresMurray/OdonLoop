import { useState } from 'react';
import TratamientoMenu from './TratamientoMenu';

/**
 * Componente que representa una pieza dental con sus 5 caras
 * Sistema profesional de marcado:
 * - Click en cara: menú de tratamiento
 * - Click central largo: menú de estado de pieza
 * - Azul = pendiente, Rojo = realizado
 * - Estados especiales: X (ausente/extracción), ◯ (corona), I (implante), etc.
 */
const PiezaDental = ({ numero, registro, onChange, tipo = 'permanente', onMenuOpen }) => {
  const [hoveredCara, setHoveredCara] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
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
    
    // Color basado en el estado (pendiente = azul, realizado = rojo)
    if (estado.estado === 'pendiente') return '#3B82F6'; // Azul
    if (estado.estado === 'realizado') return '#EF4444'; // Rojo
    return '#E5E7EB';
  };
  
  // Obtener estado de la pieza completa
  const estadoPieza = registro?.estado_pieza || null;
  
  // Manejar el click en una cara
  const handleCaraClick = (e, cara) => {
    e.stopPropagation();
    
    // Calcular posición del menú
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 5
    });
    
    setMenuAbierto({ tipo: 'cara', cara });
    if (onMenuOpen) onMenuOpen();
  };
  
  // Manejar click central largo para menú de pieza completa
  const handleCenterLongClick = (e) => {
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 5
    });
    
    setMenuAbierto({ tipo: 'pieza' });
    if (onMenuOpen) onMenuOpen();
  };
  
  // Manejar selección desde el menú
  const handleMenuSelect = (valor) => {
    if (!menuAbierto) return;
    
    if (menuAbierto.tipo === 'cara') {
      // Actualizar cara específica
      const nuevoRegistro = {
        ...registro,
        [`cara_${menuAbierto.cara}`]: valor
      };
      onChange(numero, nuevoRegistro);
    } else {
      // Actualizar estado de pieza
      const nuevoRegistro = {
        ...registro,
        estado_pieza: valor?.estadoPieza || null
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
  const tamano = esTemporal ? 'w-16 h-16' : 'w-20 h-20';
  
  // Determinar si la pieza tiene un estado especial
  const tieneEstadoEspecial = estadoPieza && ['ausente', 'extraccion', 'corona_realizada', 'corona_pendiente', 'implante', 'restauracion_total', 'absceso'].includes(estadoPieza);
  
  return (
    <div className="flex flex-col items-center m-1">
      {/* Número de la pieza */}
      <div className={`text-xs font-bold mb-1 ${esTemporal ? 'text-purple-600' : 'text-gray-700'}`}>
        {numero}
      </div>
      
      {/* Pieza dental con 5 caras */}
      <div className={`relative ${tamano} bg-white border-2 border-gray-300 rounded-lg shadow-sm`}>
        {/* Cara Oclusal (Centro) */}
        <div
          className="absolute inset-0 m-6 rounded-full cursor-pointer transition-all duration-150 hover:scale-110 hover:shadow-md"
          style={{ backgroundColor: getColorCara('oclusal') }}
          onClick={(e) => handleCaraClick(e, 'oclusal')}
          onContextMenu={(e) => {
            e.preventDefault();
            handleCenterLongClick(e);
          }}
          onMouseEnter={() => setHoveredCara('oclusal')}
          onMouseLeave={() => setHoveredCara(null)}
          title="Cara Oclusal (O) - Clic derecho para estado de pieza"
        >
          {hoveredCara === 'oclusal' && !tieneEstadoEspecial && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
              O
            </div>
          )}
        </div>
        
        {/* Cara Vestibular (Arriba) */}
        <div
          className="absolute top-0 left-1/4 right-1/4 h-4 cursor-pointer transition-all duration-150 hover:brightness-110"
          style={{ backgroundColor: getColorCara('vestibular') }}
          onClick={(e) => handleCaraClick(e, 'vestibular')}
          onMouseEnter={() => setHoveredCara('vestibular')}
          onMouseLeave={() => setHoveredCara(null)}
          title="Cara Vestibular (V)"
        />
        
        {/* Cara Lingual (Abajo) */}
        <div
          className="absolute bottom-0 left-1/4 right-1/4 h-4 cursor-pointer transition-all duration-150 hover:brightness-110"
          style={{ backgroundColor: getColorCara('lingual') }}
          onClick={(e) => handleCaraClick(e, 'lingual')}
          onMouseEnter={() => setHoveredCara('lingual')}
          onMouseLeave={() => setHoveredCara(null)}
          title="Cara Lingual/Palatina (L)"
        />
        
        {/* Cara Mesial (Izquierda) */}
        <div
          className="absolute left-0 top-1/4 bottom-1/4 w-4 cursor-pointer transition-all duration-150 hover:brightness-110"
          style={{ backgroundColor: getColorCara('mesial') }}
          onClick={(e) => handleCaraClick(e, 'mesial')}
          onMouseEnter={() => setHoveredCara('mesial')}
          onMouseLeave={() => setHoveredCara(null)}
          title="Cara Mesial (M)"
        />
        
        {/* Cara Distal (Derecha) */}
        <div
          className="absolute right-0 top-1/4 bottom-1/4 w-4 cursor-pointer transition-all duration-150 hover:brightness-110"
          style={{ backgroundColor: getColorCara('distal') }}
          onClick={(e) => handleCaraClick(e, 'distal')}
          onMouseEnter={() => setHoveredCara('distal')}
          onMouseLeave={() => setHoveredCara(null)}
          title="Cara Distal (D)"
        />
        
        {/* Marcadores especiales para estados de pieza */}
        {estadoPieza === 'ausente' && (
          <div className="absolute inset-0 flex items-center justify-center text-red-600 text-3xl font-bold pointer-events-none">
            ✕
          </div>
        )}
        
        {estadoPieza === 'extraccion' && (
          <div className="absolute inset-0 flex items-center justify-center text-blue-600 text-3xl font-bold pointer-events-none">
            ✕
          </div>
        )}
        
        {estadoPieza === 'corona_realizada' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full border-4 border-red-600"></div>
          </div>
        )}
        
        {estadoPieza === 'corona_pendiente' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full border-4 border-blue-600"></div>
          </div>
        )}
        
        {estadoPieza === 'implante' && (
          <div className="absolute inset-0 flex items-center justify-center text-green-600 text-3xl font-bold pointer-events-none">
            I
          </div>
        )}
        
        {estadoPieza === 'restauracion_total' && (
          <div className="absolute inset-0 bg-red-600 rounded-lg opacity-40 pointer-events-none"></div>
        )}
        
        {estadoPieza === 'absceso' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full border-4 border-blue-400"></div>
          </div>
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
          position={menuPosition}
          onClose={handleMenuClose}
          onSelect={handleMenuSelect}
          currentValue={menuAbierto.tipo === 'cara' ? getEstadoCara(menuAbierto.cara) : estadoPieza}
          isWholeToothMenu={menuAbierto.tipo === 'pieza'}
        />
      )}
    </div>
  );
};

export default PiezaDental;
