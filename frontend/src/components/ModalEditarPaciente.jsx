import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader2 } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { editarPaciente, getObrasSociales } from '../api/pacienteService';

const ModalEditarPaciente = ({ isOpen, onClose, paciente, onGuardado }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    telefono: '',
    fecha_nacimiento: '',
    direccion: '',
    obra_social: '',
    obra_social_otra: '',
    numero_afiliado: '',
    plan: '',
    alergias: '',
    antecedentes_medicos: '',
  });
  const [obrasSociales, setObrasSociales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && paciente) {
      // Extraer nombre y apellido del nombre_completo
      const partes = (paciente.nombre_completo || '').split(' ');
      const firstName = partes[0] || '';
      const lastName = partes.slice(1).join(' ') || '';

      setForm({
        first_name: paciente.first_name || firstName,
        last_name: paciente.last_name || lastName,
        dni: paciente.dni || '',
        telefono: paciente.telefono || '',
        fecha_nacimiento: paciente.fecha_nacimiento || '',
        direccion: paciente.direccion || '',
        obra_social: paciente.obra_social_detalle?.id || '',
        obra_social_otra: paciente.obra_social_otra || '',
        numero_afiliado: paciente.numero_afiliado || '',
        plan: paciente.plan || '',
        alergias: paciente.alergias || '',
        antecedentes_medicos: paciente.antecedentes_medicos || '',
      });
      setError('');
    }
  }, [isOpen, paciente]);

  useEffect(() => {
    if (isOpen) {
      getObrasSociales()
        .then(data => setObrasSociales(data))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Nombre y apellido son obligatorios');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        dni: form.dni.trim(),
        telefono: form.telefono.trim(),
        fecha_nacimiento: form.fecha_nacimiento || null,
        direccion: form.direccion.trim(),
        obra_social: form.obra_social || null,
        obra_social_otra: form.obra_social_otra.trim(),
        numero_afiliado: form.numero_afiliado.trim(),
        plan: form.plan.trim(),
        alergias: form.alergias.trim(),
        antecedentes_medicos: form.antecedentes_medicos.trim(),
      };

      const pacienteActualizado = await editarPaciente(paciente.id, payload);
      onGuardado(pacienteActualizado);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Editar Paciente</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="Nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Apellido"
              />
            </div>
          </div>

          {/* DNI y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
              <Input
                value={form.dni}
                onChange={(e) => handleChange('dni', e.target.value)}
                placeholder="DNI"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <Input
                value={form.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="Teléfono"
              />
            </div>
          </div>

          {/* Fecha de nacimiento y Dirección */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
              <Input
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <Input
                value={form.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                placeholder="Dirección"
              />
            </div>
          </div>

          {/* Obra Social */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Obra Social</label>
            <select
              value={form.obra_social}
              onChange={(e) => handleChange('obra_social', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-sm"
            >
              <option value="">Sin obra social</option>
              {obrasSociales.map((os) => (
                <option key={os.id} value={os.id}>
                  {os.sigla ? `${os.sigla} - ${os.nombre}` : os.nombre}
                </option>
              ))}
              <option value="otra">Otra (especificar)</option>
            </select>
          </div>

          {/* Obra Social Otra */}
          {form.obra_social === 'otra' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Especificar Obra Social</label>
              <Input
                value={form.obra_social_otra}
                onChange={(e) => handleChange('obra_social_otra', e.target.value)}
                placeholder="Nombre de otra obra social"
              />
            </div>
          )}

          {/* Número de Afiliado y Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° de Afiliado</label>
              <Input
                value={form.numero_afiliado}
                onChange={(e) => handleChange('numero_afiliado', e.target.value)}
                placeholder="Número de afiliado"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <Input
                value={form.plan}
                onChange={(e) => handleChange('plan', e.target.value)}
                placeholder="Plan de la obra social"
              />
            </div>
          </div>

          {/* Alergias */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alergias</label>
            <textarea
              value={form.alergias}
              onChange={(e) => handleChange('alergias', e.target.value)}
              placeholder="Alergias conocidas..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
            />
          </div>

          {/* Antecedentes Médicos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Antecedentes Médicos</label>
            <textarea
              value={form.antecedentes_medicos}
              onChange={(e) => handleChange('antecedentes_medicos', e.target.value)}
              placeholder="Antecedentes médicos relevantes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ModalEditarPaciente;
