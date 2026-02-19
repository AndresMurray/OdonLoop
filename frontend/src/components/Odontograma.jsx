import { useState } from 'react';
import PiezaDental from './PiezaDental';

/**
 * Componente Odontograma Profesional
 * Muestra 52 piezas dentales (32 permanentes + 20 temporales)
 * Organizadas según notación FDI
 */
const Odontograma = ({ odontograma = [], onChange }) => {
  const [hoveredPieza, setHoveredPieza] = useState(null);

  // Convertir array a objeto para acceso rápido
  const odontogramaMap = {};
  odontograma.forEach(item => {
    odontogramaMap[item.pieza_dental] = item;
  });

  // Dientes permanentes - Numeración FDI
  const permanentes = {
    superiorDerecho: [18, 17, 16, 15, 14, 13, 12, 11],
    superiorIzquierdo: [21, 22, 23, 24, 25, 26, 27, 28],
    inferiorIzquierdo: [31, 32, 33, 34, 35, 36, 37, 38],
    inferiorDerecho: [48, 47, 46, 45, 44, 43, 42, 41]
  };

  // Dientes temporales - Numeración FDI
  const temporales = {
    superiorDerecho: [55, 54, 53, 52, 51],
    superiorIzquierdo: [61, 62, 63, 64, 65],
    inferiorIzquierdo: [71, 72, 73, 74, 75],
    inferiorDerecho: [85, 84, 83, 82, 81]
  };

  const renderPieza = (numero, tipo = 'permanente') => {
    const item = odontogramaMap[numero];
    const registro = item?.registro;

    return (
      <PiezaDental
        key={numero}
        numero={numero}
        registro={registro}
        onChange={onChange}
        tipo={tipo}
      />
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 md:p-8 shadow-2xl">
      {/* Leyenda */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Sistema de Marcado Profesional</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Tratamientos por Cara:</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-500 rounded"></div>
                <span><strong>Azul:</strong> Pendiente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-500 rounded"></div>
                <span><strong>Rojo:</strong> Realizado</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Estados de Pieza (Clic derecho):</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div><span className="text-red-600 font-bold">✕</span> Ausente</div>
              <div><span className="text-blue-600 font-bold">✕</span> Extracción</div>
              <div><span className="text-red-600 font-bold">◯</span> Corona hecha</div>
              <div><span className="text-blue-600 font-bold">◯</span> Corona pendiente</div>
              <div><span className="text-green-600 font-bold">I</span> Implante</div>
              <div><span className="text-blue-400 font-bold">◯</span> Absceso/Fístula</div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded">
          <strong>Instrucciones:</strong> Click izquierdo en una cara → Menú de tratamiento | Clic derecho en el centro → Estado de pieza
        </div>
      </div>

      {/* Indicador de orientación */}
      <div className="flex justify-between text-sm font-semibold text-gray-600 mb-4 px-4">
        <span>→ Derecha del paciente</span>
        <span>Izquierda del paciente ←</span>
      </div>

      {/* DIENTES PERMANENTES */}
      <div className="mb-12">
        <h3 className="text-center text-lg font-bold text-gray-800 mb-4 bg-blue-100 py-2 rounded">
          DENTICIÓN PERMANENTE (32 piezas)
        </h3>

        {/* Arcada Superior Permanente */}
        <div className="mb-8">
          <div className="text-center text-sm font-semibold text-gray-700 mb-3">
            ARCADA SUPERIOR
          </div>
          <div className="flex justify-center items-center">
            {/* Cuadrante 1 - Superior Derecho */}
            <div className="flex border-r-4 border-gray-500 pr-4">
              {permanentes.superiorDerecho.map(num => renderPieza(num, 'permanente'))}
            </div>
            {/* Cuadrante 2 - Superior Izquierdo */}
            <div className="flex pl-4">
              {permanentes.superiorIzquierdo.map(num => renderPieza(num, 'permanente'))}
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t-4 border-gray-500 my-6"></div>

        {/* Arcada Inferior Permanente */}
        <div>
          <div className="flex justify-center items-center">
            {/* Cuadrante 4 - Inferior Derecho */}
            <div className="flex border-r-4 border-gray-500 pr-4">
              {permanentes.inferiorDerecho.map(num => renderPieza(num, 'permanente'))}
            </div>
            {/* Cuadrante 3 - Inferior Izquierdo */}
            <div className="flex pl-4">
              {permanentes.inferiorIzquierdo.map(num => renderPieza(num, 'permanente'))}
            </div>
          </div>
          <div className="text-center text-sm font-semibold text-gray-700 mt-3">
            ARCADA INFERIOR
          </div>
        </div>
      </div>

      {/* Separador entre permanentes y temporales */}
      <div className="my-8 border-t-2 border-dashed border-purple-300"></div>

      {/* DIENTES TEMPORALES */}
      <div>
        <h3 className="text-center text-lg font-bold text-purple-700 mb-4 bg-purple-100 py-2 rounded">
          DENTICIÓN TEMPORAL / DECIDUA (20 piezas)
        </h3>

        {/* Arcada Superior Temporal */}
        <div className="mb-8">
          <div className="text-center text-sm font-semibold text-purple-600 mb-3">
            ARCADA SUPERIOR TEMPORAL
          </div>
          <div className="flex justify-center items-center">
            {/* Cuadrante 5 - Superior Derecho Temporal */}
            <div className="flex border-r-4 border-purple-400 pr-3">
              {temporales.superiorDerecho.map(num => renderPieza(num, 'temporal'))}
            </div>
            {/* Cuadrante 6 - Superior Izquierdo Temporal */}
            <div className="flex pl-3">
              {temporales.superiorIzquierdo.map(num => renderPieza(num, 'temporal'))}
            </div>
          </div>
        </div>

        {/* Línea divisoria temporal */}
        <div className="border-t-4 border-purple-400 my-6"></div>

        {/* Arcada Inferior Temporal */}
        <div>
          <div className="flex justify-center items-center">
            {/* Cuadrante 8 - Inferior Derecho Temporal */}
            <div className="flex border-r-4 border-purple-400 pr-3">
              {temporales.inferiorDerecho.map(num => renderPieza(num, 'temporal'))}
            </div>
            {/* Cuadrante 7 - Inferior Izquierdo Temporal */}
            <div className="flex pl-3">
              {temporales.inferiorIzquierdo.map(num => renderPieza(num, 'temporal'))}
            </div>
          </div>
          <div className="text-center text-sm font-semibold text-purple-600 mt-3">
            ARCADA INFERIOR TEMPORAL
          </div>
        </div>
      </div>

      {/* Nota final */}
      <div className="mt-8 text-center text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <p className="font-semibold">Odontograma profesional con notación FDI - Total: 52 piezas dentales</p>
        <p className="mt-1">Sistema de 5 caras por pieza: Oclusal (centro), Vestibular (arriba), Lingual (abajo), Mesial (izq), Distal (der)</p>
        <p className="mt-1 text-blue-600">Click en cara para tratamiento | Clic derecho en centro para estado de pieza</p>
      </div>
    </div>
  );
};

export default Odontograma;
