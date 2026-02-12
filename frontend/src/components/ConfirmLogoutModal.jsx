import { useEffect, useRef } from 'react';
import { X, LogOut } from 'lucide-react';
import Button from './Button';

/**
 * Modal de confirmación para cerrar sesión
 * Props:
 * - isOpen: boolean - controla si el modal está visible
 * - onConfirm: function - callback cuando confirma
 * - onCancel: function - callback cuando cancela
 */
const ConfirmLogoutModal = ({ isOpen, onConfirm, onCancel }) => {
  const modalRef = useRef(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  // Bloquear scroll cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onCancel();
    }
  };

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Cerrar Sesión</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-center">
            ¿Estás seguro de que deseas cerrar sesión?
          </p>
          <p className="text-gray-500 text-sm text-center mt-2">
            Tendrás que volver a iniciar sesión para acceder a tu cuenta.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ConfirmLogoutModal;
