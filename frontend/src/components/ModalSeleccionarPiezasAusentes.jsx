import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckSquare, Square } from 'lucide-react';
import Button from './Button';

/**
 * Renderiza un botón de pieza dental dentro del modal
 */
const BotonPieza = ({ numero, isSeleccionada, onClick, esTemporal }) => (
  <button
    onClick={() => onClick(numero)}
    className={`
      relative w-12 h-12 rounded-lg font-bold text-sm transition-all transform hover:scale-110
      ${isSeleccionada
        ? esTemporal
          ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-300'
          : 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-300'
      }
    `}
  >
    {numero}
    {isSeleccionada && (
      <div className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
        <X size={10} className="text-white" strokeWidth={3} />
      </div>
    )}
  </button>
);

/**
 * Modal para seleccionar qué piezas marcar como ausentes.
 * Muestra las piezas respetando la estructura del odontograma real (notación FDI).
 *
 * Props:
 *  - cuadrantes: objeto con { superiorDerecho, superiorIzquierdo, inferiorIzquierdo, inferiorDerecho }
 *  - tipo: 'permanente' | 'temporal'
 */
const ModalSeleccionarPiezasAusentes = ({ isOpen, onClose, onConfirm, cuadrantes, tipo = 'permanente' }) => {
  // Lista plana de todas las piezas
  const todasLasPiezas = cuadrantes
    ? [
        ...cuadrantes.superiorDerecho,
        ...cuadrantes.superiorIzquierdo,
        ...cuadrantes.inferiorDerecho,
        ...cuadrantes.inferiorIzquierdo
      ]
    : [];

  const [piezasSeleccionadas, setPiezasSeleccionadas] = useState(todasLasPiezas);

  if (!isOpen || !cuadrantes) return null;

  const esTemporal = tipo === 'temporal';
  const totalPiezas = todasLasPiezas.length;

  const togglePieza = (numero) => {
    if (piezasSeleccionadas.includes(numero)) {
      setPiezasSeleccionadas(piezasSeleccionadas.filter(n => n !== numero));
    } else {
      setPiezasSeleccionadas([...piezasSeleccionadas, numero]);
    }
  };

  const handleConfirmar = () => {
    onConfirm(piezasSeleccionadas);
    onClose();
  };

  const seleccionarTodas = () => setPiezasSeleccionadas([...todasLasPiezas]);
  const deseleccionarTodas = () => setPiezasSeleccionadas([]);

  const borderColor = esTemporal ? 'border-purple-400' : 'border-gray-500';

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div
          className="text-white p-5 rounded-t-xl flex justify-between items-center"
          style={{ backgroundColor: esTemporal ? '#9333ea' : '#2563eb' }}
        >
          <div>
            <h2 className="text-xl font-bold">
              Marcar {esTemporal ? 'Temporales' : 'Permanentes'} Ausentes
            </h2>
            <p className="text-sm mt-1 opacity-90">
              Deseleccioná las piezas que el paciente SÍ tiene
            </p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Botones rápidos + contador */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex gap-2">
              <button
                onClick={seleccionarTodas}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  esTemporal
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <CheckSquare size={14} />
                Todas
              </button>
              <button
                onClick={deseleccionarTodas}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                <Square size={14} />
                Ninguna
              </button>
            </div>
            <div className="text-sm font-semibold text-gray-600">
              <span style={{ color: esTemporal ? '#9333ea' : '#2563eb' }}>
                {piezasSeleccionadas.length}
              </span>
              /{totalPiezas} seleccionadas
            </div>
          </div>

          {/* Odontograma mini - Estructura real */}
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 overflow-x-auto">
            {/* Indicador orientación */}
            <div className="flex justify-between text-[11px] font-semibold text-gray-400 mb-3 px-2 min-w-max">
              <span>→ Der. paciente</span>
              <span className="font-bold text-gray-600">{esTemporal ? 'TEMPORALES' : 'PERMANENTES'}</span>
              <span>Izq. paciente ←</span>
            </div>

            {/* Arcada Superior */}
            <div className="text-center text-xs font-semibold text-gray-500 mb-2">ARCADA SUPERIOR</div>
            <div className="flex justify-center items-center mb-2 min-w-max">
              {/* Cuadrante Superior Derecho */}
              <div className={`flex gap-1 border-r-4 ${borderColor} pr-2 mr-2`}>
                {cuadrantes.superiorDerecho.map(num => (
                  <BotonPieza
                    key={num}
                    numero={num}
                    isSeleccionada={piezasSeleccionadas.includes(num)}
                    onClick={togglePieza}
                    esTemporal={esTemporal}
                  />
                ))}
              </div>
              {/* Cuadrante Superior Izquierdo */}
              <div className="flex gap-1">
                {cuadrantes.superiorIzquierdo.map(num => (
                  <BotonPieza
                    key={num}
                    numero={num}
                    isSeleccionada={piezasSeleccionadas.includes(num)}
                    onClick={togglePieza}
                    esTemporal={esTemporal}
                  />
                ))}
              </div>
            </div>

            {/* Línea divisoria horizontal */}
            <div className={`border-t-4 ${borderColor} my-3`}></div>

            {/* Arcada Inferior */}
            <div className="flex justify-center items-center mb-2 min-w-max">
              {/* Cuadrante Inferior Derecho */}
              <div className={`flex gap-1 border-r-4 ${borderColor} pr-2 mr-2`}>
                {cuadrantes.inferiorDerecho.map(num => (
                  <BotonPieza
                    key={num}
                    numero={num}
                    isSeleccionada={piezasSeleccionadas.includes(num)}
                    onClick={togglePieza}
                    esTemporal={esTemporal}
                  />
                ))}
              </div>
              {/* Cuadrante Inferior Izquierdo */}
              <div className="flex gap-1">
                {cuadrantes.inferiorIzquierdo.map(num => (
                  <BotonPieza
                    key={num}
                    numero={num}
                    isSeleccionada={piezasSeleccionadas.includes(num)}
                    onClick={togglePieza}
                    esTemporal={esTemporal}
                  />
                ))}
              </div>
            </div>
            <div className="text-center text-xs font-semibold text-gray-500 mt-2">ARCADA INFERIOR</div>
          </div>

          {/* Info */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mt-4 text-xs text-yellow-800">
            <strong>Tip:</strong> Las piezas seleccionadas (en color) se marcarán como ausentes (✕ roja). 
            Hacé clic en una pieza para quitarla de la selección si el paciente la tiene.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-4 rounded-b-xl flex justify-end gap-3 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <button
            onClick={handleConfirmar}
            disabled={piezasSeleccionadas.length === 0}
            className={`px-5 py-2 rounded-lg font-semibold text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
              esTemporal
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Marcar {piezasSeleccionadas.length} como ausentes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalSeleccionarPiezasAusentes;
