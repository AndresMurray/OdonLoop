import { useState } from 'react';
import { getColorEstado, ESTADOS_DENTALES } from '../api/odontogramaService';

/**
 * Componente visual del Odontograma
 * Muestra las 32 piezas dentales organizadas por cuadrantes
 */
const Odontograma = ({ odontograma, onPiezaClick }) => {
  const [hoveredPieza, setHoveredPieza] = useState(null);

  // Cuadrantes dentales (numeración FDI)
  const cuadranteSuperiorDerecho = [18, 17, 16, 15, 14, 13, 12, 11]; // Derecha del paciente
  const cuadranteSuperiorIzquierdo = [21, 22, 23, 24, 25, 26, 27, 28]; // Izquierda del paciente
  const cuadranteInferiorIzquierdo = [31, 32, 33, 34, 35, 36, 37, 38];
  const cuadranteInferiorDerecho = [48, 47, 46, 45, 44, 43, 42, 41];

  const renderPieza = (numero) => {
    const registro = odontograma[numero];
    const estado = registro?.estado || null;
    const backgroundColor = estado ? getColorEstado(estado) : '#E5E7EB';
    const isHovered = hoveredPieza === numero;
    
    return (
      <div
        key={numero}
        className={`
          relative flex flex-col items-center justify-center
          w-10 h-14 md:w-12 md:h-16 m-0.5
          rounded-lg cursor-pointer
          transition-all duration-200
          ${isHovered ? 'transform scale-110 shadow-lg z-10' : 'shadow'}
          ${estado ? 'ring-2 ring-white' : ''}
        `}
        style={{ backgroundColor }}
        onClick={() => onPiezaClick(numero)}
        onMouseEnter={() => setHoveredPieza(numero)}
        onMouseLeave={() => setHoveredPieza(null)}
        title={registro ? `${registro.estado_display}: ${registro.descripcion?.substring(0, 50)}...` : 'Sin registro'}
      >
        <span className={`text-xs font-bold ${estado ? 'text-white' : 'text-gray-600'}`}>
          {numero}
        </span>
        {registro && (
          <span className="text-[10px] text-white font-medium mt-0.5 truncate w-full text-center px-0.5">
            {registro.estado_display?.substring(0, 4)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg">
      {/* Leyenda de estados */}
      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {ESTADOS_DENTALES.map(estado => (
          <div key={estado.value} className="flex items-center gap-1 text-xs">
            <div 
              className="w-3 h-3 rounded" 
              style={{ backgroundColor: estado.color }}
            />
            <span className="text-gray-600">{estado.label}</span>
          </div>
        ))}
      </div>

      {/* Indicador de orientación */}
      <div className="flex justify-between text-sm text-gray-500 mb-2 px-4">
        <span>Derecha del paciente</span>
        <span>Izquierda del paciente</span>
      </div>

      {/* Arcada Superior */}
      <div className="mb-4">
        <div className="text-center text-sm font-semibold text-gray-700 mb-2">
          ARCADA SUPERIOR
        </div>
        <div className="flex justify-center">
          {/* Cuadrante 1 - Superior Derecho */}
          <div className="flex border-r-2 border-gray-400 pr-2">
            {cuadranteSuperiorDerecho.map(renderPieza)}
          </div>
          {/* Cuadrante 2 - Superior Izquierdo */}
          <div className="flex pl-2">
            {cuadranteSuperiorIzquierdo.map(renderPieza)}
          </div>
        </div>
      </div>

      {/* Línea divisoria */}
      <div className="border-b-2 border-gray-400 mb-4" />

      {/* Arcada Inferior */}
      <div>
        <div className="flex justify-center">
          {/* Cuadrante 4 - Inferior Derecho */}
          <div className="flex border-r-2 border-gray-400 pr-2">
            {cuadranteInferiorDerecho.map(renderPieza)}
          </div>
          {/* Cuadrante 3 - Inferior Izquierdo */}
          <div className="flex pl-2">
            {cuadranteInferiorIzquierdo.map(renderPieza)}
          </div>
        </div>
        <div className="text-center text-sm font-semibold text-gray-700 mt-2">
          ARCADA INFERIOR
        </div>
      </div>

      {/* Instrucciones */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Hacé clic en una pieza dental para ver su historial o agregar un registro
      </div>
    </div>
  );
};

export default Odontograma;
