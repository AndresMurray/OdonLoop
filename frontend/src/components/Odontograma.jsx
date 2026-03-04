import React, { useState, useRef, useEffect } from 'react';
import PiezaDental from './PiezaDental';
import { Link2, Square, ClipboardPlus, XCircle } from 'lucide-react';
import ModalSeleccionarPiezasAusentes from './ModalSeleccionarPiezasAusentes';

/**
 * Componente Odontograma Profesional
 * Muestra 52 piezas dentales (32 permanentes + 20 temporales)
 * Organizadas según notación FDI
 */
const Odontograma = React.forwardRef(({ odontograma = [], onChange, onNuevoSeguimiento, modoCaptura = false }, ref) => {
  const [hoveredPieza, setHoveredPieza] = useState(null);
  const [modoMarca, setModoMarca] = useState(null); // 'puente' o 'protesis'
  const [marcaEnProgreso, setMarcaEnProgreso] = useState({ inicio: null, fin: null });
  const [modalAusentesAbierto, setModalAusentesAbierto] = useState(null); // 'permanente' o 'temporal' cuando está abierto
  const containerRef = ref || useRef(null);

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

  // Manejar click en pieza cuando está en modo marca (puente o prótesis)
  const handlePiezaClickMarca = (numero) => {
    if (!modoMarca) return;

    if (!marcaEnProgreso.inicio) {
      // Primera pieza seleccionada
      setMarcaEnProgreso({ inicio: numero, fin: null });
    } else if (!marcaEnProgreso.fin) {
      // Segunda pieza seleccionada
      const inicio = marcaEnProgreso.inicio;
      const fin = numero;

      // Guardar la marca en ambas piezas
      const marcaData = { inicio, fin, color: 'red', tipo: modoMarca };

      // Actualizar pieza de inicio
      const itemInicio = odontogramaMap[inicio];
      const registroInicio = {
        ...(itemInicio?.registro || {}),
        puente: marcaData
      };
      onChange(inicio, registroInicio);

      // Actualizar pieza de fin
      const itemFin = odontogramaMap[fin];
      const registroFin = {
        ...(itemFin?.registro || {}),
        puente: marcaData
      };
      onChange(fin, registroFin);

      // Resetear estado y salir del modo
      setMarcaEnProgreso({ inicio: null, fin: null });
      setModoMarca(null);
    }
  };

  // Función para obtener todos los puentes existentes
  const obtenerPuentes = () => {
    const puentes = [];
    const puentesVistos = new Set();

    odontograma.forEach(item => {
      if (item.registro?.puente) {
        const { inicio, fin, tipo } = item.registro.puente;
        const key = `${Math.min(inicio, fin)}-${Math.max(inicio, fin)}`;

        if (!puentesVistos.has(key)) {
          puentes.push({
            inicio,
            fin,
            color: item.registro.puente.color || 'red',
            tipo: tipo || 'puente'
          });
          puentesVistos.add(key);
        }
      }
    });

    return puentes;
  };

  // Estado para posiciones de líneas de puente
  const [lineasPuente, setLineasPuente] = useState([]);

  // Calcular posiciones de líneas de puente
  useEffect(() => {
    if (!containerRef.current) return;

    const calcularLineas = () => {
      const puentes = obtenerPuentes();
      const nuevasLineas = [];

      puentes.forEach(({ inicio, fin, color, tipo }) => {
        const elementoInicio = containerRef.current.querySelector(`[data-numero="${inicio}"]`);
        const elementoFin = containerRef.current.querySelector(`[data-numero="${fin}"]`);

        if (elementoInicio && elementoFin) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const rectInicio = elementoInicio.getBoundingClientRect();
          const rectFin = elementoFin.getBoundingClientRect();

          const x1 = rectInicio.left + rectInicio.width / 2 - containerRect.left;
          const y1 = rectInicio.bottom + 12 - containerRect.top;
          const x2 = rectFin.left + rectFin.width / 2 - containerRect.left;
          const y2 = rectFin.bottom + 12 - containerRect.top;

          nuevasLineas.push({ x1, y1, x2, y2, color, inicio, fin, tipo: tipo || 'puente' });
        }
      });

      setLineasPuente(nuevasLineas);
    };

    // Usar requestAnimationFrame para esperar a que el DOM esté completamente renderizado
    const recalcularConDelay = () => {
      requestAnimationFrame(() => {
        // Agregar un pequeño delay adicional para asegurar que todo esté posicionado
        setTimeout(() => {
          calcularLineas();
        }, 100);
      });
    };

    // Calcular inmediatamente y después con delay
    recalcularConDelay();

    // También recalcular después de un tiempo para asegurar
    const timeoutId = setTimeout(() => {
      calcularLineas();
    }, 500);

    // Recalcular cuando cambie el tamaño de ventana
    const handleResize = () => {
      recalcularConDelay();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [odontograma, modoMarca]);



  // Función para confirmar el marcado de piezas como ausentes
  const confirmarMarcarAusentes = (piezasSeleccionadas) => {
    // Marcar cada pieza seleccionada como ausente usando el formato correcto
    piezasSeleccionadas.forEach(numero => {
      const item = odontogramaMap[numero];
      const registroActual = item?.registro || {};
      
      // Agregar 'ausente' al array de estados de pieza
      let estadosPieza = Array.isArray(registroActual.estado_pieza) 
        ? [...registroActual.estado_pieza] 
        : [];
      
      // Solo agregar si no está ya presente
      if (!estadosPieza.includes('ausente')) {
        estadosPieza.push('ausente');
      }
      
      const nuevoRegistro = {
        ...registroActual,
        estado_pieza: estadosPieza
      };
      
      onChange(numero, nuevoRegistro);
    });
  };

  // Abrir modal para marcar piezas temporales
  const abrirModalTemporales = () => {
    setModalAusentesAbierto('temporal');
  };

  // Abrir modal para marcar piezas permanentes
  const abrirModalPermanentes = () => {
    setModalAusentesAbierto('permanente');
  };

  const renderPieza = (numero, tipo = 'permanente') => {
    const item = odontogramaMap[numero];
    const registro = item?.registro;
    const isSeleccionado = modoMarca && marcaEnProgreso.inicio === numero;

    return (
      <div
        key={numero}
        data-numero={numero}
        onClick={() => handlePiezaClickMarca(numero)}
        className={`
          ${modoMarca ? 'cursor-pointer hover:bg-blue-100 rounded-xl transition-all' : ''} 
          ${isSeleccionado ? 'ring-4 ring-blue-500 rounded-xl bg-blue-50' : ''}
        `}
        style={{ position: 'relative', zIndex: 10 }}
      >
        <PiezaDental
          numero={numero}
          registro={registro}
          onChange={onChange}
          tipo={tipo}
          deshabilitarMenu={!!modoMarca}
        />
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative bg-white rounded-xl p-4 md:p-8 shadow-2xl" style={{ isolation: 'isolate' }}>
      {/* Botones para activar modos — ocultos en modoCaptura */}
      {!modoCaptura && (
        <div data-no-pdf className="mb-4 flex flex-wrap justify-between items-center gap-2">
          {/* Botón de Nuevo Seguimiento */}
          <button
            onClick={onNuevoSeguimiento}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md text-sm"
          >
            <ClipboardPlus size={16} />
            Agregar Nuevo Seguimiento
          </button>

          {/* Botones de marcado */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setModoMarca(modoMarca === 'puente' ? null : 'puente');
                setMarcaEnProgreso({ inicio: null, fin: null });
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${modoMarca === 'puente'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <Link2 size={16} />
              {modoMarca === 'puente' ? 'Cancelar Puente' : 'Marcar Puente'}
            </button>

            <button
              onClick={() => {
                setModoMarca(modoMarca === 'protesis' ? null : 'protesis');
                setMarcaEnProgreso({ inicio: null, fin: null });
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${modoMarca === 'protesis'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              <Square size={16} />
              {modoMarca === 'protesis' ? 'Cancelar Prótesis' : 'Marcar Prótesis'}
            </button>
          </div>
        </div>
      )}

      {modoMarca && !modoCaptura && (
        <div data-no-pdf className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg text-sm text-red-800">
          <strong>{modoMarca === 'puente' ? 'Modo Puente Activo' : 'Modo Prótesis Removible Activo'}:</strong>
          {!marcaEnProgreso.inicio && ' Haz clic en la primera pieza'}
          {marcaEnProgreso.inicio && !marcaEnProgreso.fin && ` Pieza ${marcaEnProgreso.inicio} seleccionada. Haz clic en la segunda pieza`}
        </div>
      )}

      {/* Leyenda — oculta en modoCaptura */}
      {!modoCaptura && <div data-no-pdf className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
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
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-500 rounded" style={{ boxShadow: 'inset 0 0 0 3px #2563EB' }}></div>
                <span><strong>Rojo + Borde Azul:</strong> Realizado Filtrado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-yellow-500 rounded"></div>
                <span><strong>Amarillo:</strong> Absceso/Fístula</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Estados de Pieza (Clic derecho / Mantener presionado en mobile):</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div><span className="text-red-600 font-bold">✕</span> Ausente</div>
              <div><span className="text-blue-600 font-bold">✕</span> Extracción</div>
              <div><span className="text-red-600 font-bold">TC</span> Conducto hecho</div>
              <div><span className="text-blue-600 font-bold">TC</span> Conducto pendiente</div>
              <div><span className="text-red-600 font-bold">◯</span> Corona hecha</div>
              <div><span className="text-blue-600 font-bold">◯</span> Corona pendiente</div>
              <div><span className="text-green-600 font-bold">I</span> Implante</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Prótesis:</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <svg width="40" height="12" className="border border-gray-300 rounded">
                  <path d="M 5,6 Q 20,12 35,6" fill="none" stroke="#EF4444" strokeWidth="2" />
                  <circle cx="5" cy="6" r="2" fill="#EF4444" />
                  <circle cx="35" cy="6" r="2" fill="#EF4444" />
                </svg>
                <span><strong className="text-red-600">Puente dental</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="40" height="12" className="border border-gray-300 rounded">
                  <rect x="5" y="3" width="30" height="6" fill="none" stroke="#EF4444" strokeWidth="2" rx="1" />
                </svg>
                <span><strong className="text-red-600">Prótesis removible</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded">
          <strong>Instrucciones:</strong> Click izquierdo en cara → Tratamiento | Clic derecho (o mantener presionado en mobile) en centro → Estado | Botones superiores → Marcar puente/prótesis entre piezas
        </div>
      </div>}

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

        {/* Botón para marcar permanentes ausentes */}
        {!modoCaptura && (
          <div data-no-pdf className="flex justify-center mb-4">
            <button
              onClick={abrirModalPermanentes}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all bg-gray-600 text-white hover:bg-gray-700 shadow-md text-sm"
              title="Marcar piezas permanentes como ausentes"
            >
              <XCircle size={16} />
              Marcar permanentes como ausentes
            </button>
          </div>
        )}

        {/* Arcada Superior Permanente */}
        <div className="mb-8">
          <div className="text-center text-sm font-semibold text-gray-700 mb-3">
            ARCADA SUPERIOR
          </div>
          <div className="overflow-x-auto">
            <div className="flex justify-center items-center min-w-max px-4">
              {/* Cuadrante 1 - Superior Derecho */}
              <div className="flex border-r-4 border-gray-500 pr-2 md:pr-4">
                {permanentes.superiorDerecho.map(num => renderPieza(num, 'permanente'))}
              </div>
              {/* Cuadrante 2 - Superior Izquierdo */}
              <div className="flex pl-2 md:pl-4">
                {permanentes.superiorIzquierdo.map(num => renderPieza(num, 'permanente'))}
              </div>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t-4 border-gray-500 my-6"></div>

        {/* Arcada Inferior Permanente */}
        <div>
          <div className="overflow-x-auto">
            <div className="flex justify-center items-center min-w-max px-4">
              {/* Cuadrante 4 - Inferior Derecho */}
              <div className="flex border-r-4 border-gray-500 pr-2 md:pr-4">
                {permanentes.inferiorDerecho.map(num => renderPieza(num, 'permanente'))}
              </div>
              {/* Cuadrante 3 - Inferior Izquierdo */}
              <div className="flex pl-2 md:pl-4">
                {permanentes.inferiorIzquierdo.map(num => renderPieza(num, 'permanente'))}
              </div>
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

        {/* Botón para marcar todas las temporales como ausentes - oculto en modoCaptura */}
        {!modoCaptura && (
          <div data-no-pdf className="flex justify-center mb-4">
            <button
              onClick={abrirModalTemporales}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all bg-purple-600 text-white hover:bg-purple-700 shadow-md text-sm"
              title="Marcar piezas temporales como ausentes"
            >
              <XCircle size={16} />
              Marcar temporales como ausentes
            </button>
          </div>
        )}

        {/* Arcada Superior Temporal */}
        <div className="mb-8">
          <div className="text-center text-sm font-semibold text-purple-600 mb-3">
            ARCADA SUPERIOR TEMPORAL
          </div>
          <div className="overflow-x-auto">
            <div className="flex justify-center items-center min-w-max px-4">
              {/* Cuadrante 5 - Superior Derecho Temporal */}
              <div className="flex border-r-4 border-purple-400 pr-2 md:pr-3">
                {temporales.superiorDerecho.map(num => renderPieza(num, 'temporal'))}
              </div>
              {/* Cuadrante 6 - Superior Izquierdo Temporal */}
              <div className="flex pl-2 md:pl-3">
                {temporales.superiorIzquierdo.map(num => renderPieza(num, 'temporal'))}
              </div>
            </div>
          </div>
        </div>

        {/* Línea divisoria temporal */}
        <div className="border-t-4 border-purple-400 my-6"></div>

        {/* Arcada Inferior Temporal */}
        <div>
          <div className="overflow-x-auto">
            <div className="flex justify-center items-center min-w-max px-4">
              {/* Cuadrante 8 - Inferior Derecho Temporal */}
              <div className="flex border-r-4 border-purple-400 pr-2 md:pr-3">
                {temporales.inferiorDerecho.map(num => renderPieza(num, 'temporal'))}
              </div>
              {/* Cuadrante 7 - Inferior Izquierdo Temporal */}
              <div className="flex pl-2 md:pl-3">
                {temporales.inferiorIzquierdo.map(num => renderPieza(num, 'temporal'))}
              </div>
            </div>
          </div>
          <div className="text-center text-sm font-semibold text-purple-600 mt-3">
            ARCADA INFERIOR TEMPORAL
          </div>
        </div>
      </div>

      {/* SVG Overlay para líneas de puente y prótesis */}
      {lineasPuente.length > 0 && (
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {lineasPuente.map((linea, index) => {
            if (linea.tipo === 'protesis') {
              // Prótesis removible: Rectángulo entre los dientes
              const x = Math.min(linea.x1, linea.x2);
              const y = Math.min(linea.y1, linea.y2) - 6;
              const width = Math.abs(linea.x2 - linea.x1);
              const height = 12;

              return (
                <g key={`protesis-${linea.inicio}-${linea.fin}-${index}`}>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="3"
                    rx="2"
                  />
                </g>
              );
            } else {
              // Puente dental: Rectángulo sin cerrar (forma de U)
              const altura = 15;
              const yBase = Math.max(linea.y1, linea.y2) + altura;

              // Path formando una U: baja, cruza horizontalmente, sube
              const path = `M ${linea.x1},${linea.y1} L ${linea.x1},${yBase} L ${linea.x2},${yBase} L ${linea.x2},${linea.y2}`;

              return (
                <g key={`puente-${linea.inicio}-${linea.fin}-${index}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="3"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                  {/* Círculos en los extremos superiores */}
                  <circle
                    cx={linea.x1}
                    cy={linea.y1}
                    r="3"
                    fill="#EF4444"
                  />
                  <circle
                    cx={linea.x2}
                    cy={linea.y2}
                    r="3"
                    fill="#EF4444"
                  />
                </g>
              );
            }
          })}
        </svg>
      )}

      {/* Nota final — oculta en modoCaptura */}
      {!modoCaptura && (
        <div data-no-pdf className="mt-8 text-center text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p className="font-semibold">Odontograma profesional con notación FDI - Total: 52 piezas dentales</p>
          <p className="mt-1">Sistema de 5 caras por pieza: Oclusal (centro), Vestibular (arriba), Lingual (abajo), Mesial (izq), Distal (der)</p>
          <p className="mt-1 text-blue-600">Click en cara para tratamiento | Clic derecho / mantener presionado en centro para estado de pieza</p>
        </div>
      )}

      {/* Modal para seleccionar piezas ausentes */}
      {modalAusentesAbierto && (
        <ModalSeleccionarPiezasAusentes
          key={`modal-${modalAusentesAbierto}-${Date.now()}`}
          isOpen={!!modalAusentesAbierto}
          onClose={() => setModalAusentesAbierto(null)}
          onConfirm={confirmarMarcarAusentes}
          cuadrantes={modalAusentesAbierto === 'temporal' ? temporales : permanentes}
          tipo={modalAusentesAbierto}
        />
      )}
    </div>
  );
});

export default Odontograma;
