import { HardDrive } from 'lucide-react';
import Button from './Button';

/**
 * Formatea bytes a la unidad más apropiada (B, KB, MB, GB)
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Modal para mostrar error de almacenamiento insuficiente
 * @param {boolean} isOpen - Controla si el modal está visible
 * @param {object} storageData - Datos de almacenamiento { usado, disponible, limite, intentando }
 * @param {function} onClose - Callback para cerrar el modal
 */
const ModalStorageError = ({ isOpen, storageData, onClose }) => {
  if (!isOpen || !storageData) return null;

  const { usado, disponible, limite, intentando } = storageData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <HardDrive className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Sin Espacio Suficiente</h3>
            <p className="text-sm text-gray-500">No podés subir estos archivos</p>
          </div>
        </div>
        
        {/* Información del error */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-base text-red-900 font-medium mb-3">
            Intentás subir <span className="font-bold">{formatBytes(intentando)}</span> pero solo tenés{' '}
            <span className="font-bold">{formatBytes(disponible)}</span> disponible.
          </p>
          
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Espacio usado:</span>
              <span className="font-semibold text-gray-900">{formatBytes(usado)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Espacio disponible:</span>
              <span className="font-semibold text-emerald-600">{formatBytes(disponible)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-red-200">
              <span className="text-gray-600">Límite total:</span>
              <span className="font-bold text-gray-900">{formatBytes(limite)}</span>
            </div>
          </div>
        </div>

        {/* Sugerencia */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">💡 Sugerencia:</span> Eliminá archivos innecesarios para liberar espacio o solicitá una ampliación al administrador.
          </p>
        </div>

        {/* Botón cerrar */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={onClose}
            className="px-6 bg-red-600 hover:bg-red-700"
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalStorageError;
