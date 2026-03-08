import { useState, useEffect, useMemo } from 'react';
import { X, Search, UserPlus, User, UserCheck, AlertCircle } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { Card, CardContent } from './Card';
import Alert from './Alert';
import { getMisPacientes, crearPacienteRapido, asignarPacienteExistente } from '../api/seguimientoService';
import { obraSocialService } from '../api/obraSocialService';

// Normalizar texto: minúsculas + sin tildes
const normalizar = (str) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const ModalAsignarPaciente = ({ isOpen, onClose, onSeleccionar, soloCrear = false }) => {
  const [modo, setModo] = useState(soloCrear ? 'crear' : 'buscar');
  const [todosPacientes, setTodosPacientes] = useState([]); // Lista completa cargada una vez
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '', detail: '' });

  // Obras sociales
  const [obrasSociales, setObrasSociales] = useState([]);

  // Paciente existente detectado
  const [pacienteExistente, setPacienteExistente] = useState(null);
  const [yaAsignado, setYaAsignado] = useState(false);
  const [asignando, setAsignando] = useState(false);

  // Form para crear paciente
  const [nuevoPaciente, setNuevoPaciente] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    telefono: '',
    obra_social: '',
    numero_afiliado: '',
    plan: ''
  });

  // Filtrado client-side: case + accent insensitive, en tiempo real
  const pacientesFiltrados = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) return [];
    const termNorm = normalizar(term);
    return todosPacientes.filter(p => {
      const nombre = normalizar(p.nombre_completo || '');
      const dni = (p.dni || '').toLowerCase();
      return nombre.includes(termNorm) || dni.includes(termNorm);
    });
  }, [searchTerm, todosPacientes]);

  useEffect(() => {
    if (isOpen) {
      setModo(soloCrear ? 'crear' : 'buscar');
      cargarObrasSociales();
      if (!soloCrear) cargarTodosPacientes();
    }
  }, [isOpen]);

  const cargarObrasSociales = async () => {
    try {
      const data = await obraSocialService.getAll();
      setObrasSociales(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      // No bloquear si falla
      console.error('Error cargando obras sociales:', err);
    }
  };

  const cargarTodosPacientes = async () => {
    setLoading(true);
    try {
      const data = await getMisPacientes();
      setTodosPacientes(Array.isArray(data) ? data : data.results || []);
      setAlert({ type: '', message: '', detail: '' });
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Error al cargar pacientes',
        detail: err.response?.data?.error || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoPaciente(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar paciente existente si cambia el DNI
    if (name === 'dni') {
      setPacienteExistente(null);
      setYaAsignado(false);
    }
  };

  const handleAsignarExistente = async () => {
    if (!pacienteExistente) return;
    setAsignando(true);
    try {
      const response = await asignarPacienteExistente(pacienteExistente.id);
      setAlert({
        type: 'success',
        message: 'Paciente asignado a tu lista exitosamente'
      });
      setTimeout(() => {
        onSeleccionar(response.paciente);
        handleClose();
      }, 800);
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Error al asignar paciente',
        detail: err.response?.data?.error || err.message
      });
    } finally {
      setAsignando(false);
    }
  };

  const handleCrearPaciente = async (e) => {
    e.preventDefault();

    if (!nuevoPaciente.first_name || !nuevoPaciente.last_name || !nuevoPaciente.dni) {
      setAlert({
        type: 'error',
        message: 'Nombre, apellido y DNI son obligatorios'
      });
      return;
    }

    setLoading(true);
    setPacienteExistente(null);
    try {
      const dataToSend = { ...nuevoPaciente };
      if (!dataToSend.obra_social) delete dataToSend.obra_social;
      const response = await crearPacienteRapido(dataToSend);
      setAlert({
        type: 'success',
        message: 'Paciente creado exitosamente'
      });

      setTimeout(() => {
        onSeleccionar(response.paciente);
        handleClose();
      }, 800);

    } catch (err) {
      // Detectar conflicto 409: paciente ya existe
      if (err.status === 409 && err.response?.data?.paciente_existente) {
        const pe = err.response.data.paciente_existente;
        setPacienteExistente(pe);
        setYaAsignado(err.response.data.ya_asignado || false);
        setAlert({ type: '', message: '', detail: '' });
      } else {
        setAlert({
          type: 'error',
          message: 'Error al crear paciente',
          detail: err.response?.data?.error || err.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setModo('buscar');
    setSearchTerm('');
    setTodosPacientes([]);
    setNuevoPaciente({
      first_name: '',
      last_name: '',
      dni: '',
      telefono: '',
      obra_social: '',
      numero_afiliado: '',
      plan: ''
    });
    setAlert({ type: '', message: '', detail: '' });
    setPacienteExistente(null);
    setYaAsignado(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setModo(soloCrear ? 'crear' : 'buscar');
      setPacienteExistente(null);
      setTodosPacientes([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {soloCrear ? 'Crear Nuevo Paciente' : 'Asignar Paciente al Turno'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        {!soloCrear && (
          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setModo('buscar')}
              className={`flex-1 py-3 px-6 font-medium transition-colors ${modo === 'buscar'
                ? 'border-b-2 border-emerald-600 text-emerald-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Search className="w-5 h-5 inline mr-2" />
              Buscar Paciente
            </button>
            <button
              onClick={() => setModo('crear')}
              className={`flex-1 py-3 px-6 font-medium transition-colors ${modo === 'crear'
                ? 'border-b-2 border-emerald-600 text-emerald-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <UserPlus className="w-5 h-5 inline mr-2" />
              Crear Nuevo Paciente
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <Alert
            type={alert.type}
            message={alert.message}
            detail={alert.detail}
            onClose={() => setAlert({ type: '', message: '', detail: '' })}
          />

          {modo === 'buscar' ? (
            <>
              {/* Búsqueda en tiempo real */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-3">
                  Buscá entre tus pacientes vinculados por nombre o DNI.
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Empezá a escribir nombre o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando pacientes...</p>
                </div>
              ) : !searchTerm.trim() ? (
                <div className="text-center py-8">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Empezá a escribir para buscar</p>
                </div>
              ) : pacientesFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No se encontró el paciente en tu lista</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Si es un paciente nuevo, podés crearlo desde la pestaña &quot;Crear Nuevo Paciente&quot;.
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => { setModo('crear'); setSearchTerm(''); }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear Nuevo Paciente
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {pacientesFiltrados.map((paciente) => (
                    <Card
                      key={paciente.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        onSeleccionar(paciente);
                        handleClose();
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {paciente.nombre_completo}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              {paciente.dni && <span>DNI: {paciente.dni}</span>}
                              {paciente.telefono && <span>📱 {paciente.telefono}</span>}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Seleccionar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Paciente existente detectado */}
              {pacienteExistente && (
                <div className="mb-6 border-2 border-amber-300 bg-amber-50 rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-amber-800 text-lg">
                        Este paciente ya existe en OdonLoop
                      </h3>
                      <p className="text-sm text-amber-700 mt-1">
                        {yaAsignado
                          ? 'Este paciente ya está asignado a tu lista.'
                          : 'Puede haberse atendido previamente con otro odontólogo. Podés asignarlo a tu lista de pacientes.'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-amber-200 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 p-2 rounded-full">
                        <User className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {pacienteExistente.nombre_completo}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>DNI: {pacienteExistente.dni}</span>
                          {pacienteExistente.telefono && <span>Tel: {pacienteExistente.telefono}</span>}
                          {pacienteExistente.obra_social_detalle && (
                            <span>OS: {pacienteExistente.obra_social_detalle.nombre}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {!yaAsignado ? (
                    <Button
                      variant="primary"
                      onClick={handleAsignarExistente}
                      disabled={asignando}
                      className="w-full"
                    >
                      <UserCheck className="w-5 h-5 mr-2" />
                      {asignando ? 'Asignando...' : 'Asignar a mi lista de pacientes'}
                    </Button>
                  ) : (
                    <p className="text-center text-sm text-amber-700 font-medium">
                      Ya tenés a este paciente en tu lista
                    </p>
                  )}
                </div>
              )}

              {/* Formulario crear paciente */}
              {!pacienteExistente && (
                <form onSubmit={handleCrearPaciente} className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Este paciente podrá activar su cuenta después ingresando su DNI y email en el registro.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Nombre *"
                      name="first_name"
                      value={nuevoPaciente.first_name}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      label="Apellido *"
                      name="last_name"
                      value={nuevoPaciente.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="DNI *"
                      name="dni"
                      value={nuevoPaciente.dni}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      label="Teléfono"
                      name="telefono"
                      value={nuevoPaciente.telefono}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Obra Social
                    </label>
                    <select
                      name="obra_social"
                      value={nuevoPaciente.obra_social}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">Sin obra social</option>
                      {obrasSociales.map(os => (
                        <option key={os.id} value={os.id}>
                          {os.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="N° de Afiliado"
                      name="numero_afiliado"
                      value={nuevoPaciente.numero_afiliado}
                      onChange={handleInputChange}
                      placeholder="Número de afiliado"
                    />
                    <Input
                      label="Plan"
                      name="plan"
                      value={nuevoPaciente.plan}
                      onChange={handleInputChange}
                      placeholder="Plan de la obra social"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? 'Creando...' : 'Crear y Asignar'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Botón volver al formulario si se muestra paciente existente */}
              {pacienteExistente && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setPacienteExistente(null);
                      setYaAsignado(false);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Volver al formulario
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalAsignarPaciente;
