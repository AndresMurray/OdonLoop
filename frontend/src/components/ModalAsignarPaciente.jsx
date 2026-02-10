import { useState, useEffect } from 'react';
import { X, Search, UserPlus, User } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import Alert from './Alert';
import { getMisPacientes, crearPacienteRapido } from '../api/seguimientoService';

const ModalAsignarPaciente = ({ isOpen, onClose, onSeleccionar }) => {
  const [modo, setModo] = useState('buscar'); // 'buscar' o 'crear'
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '', detail: '' });
  
  // Form para crear paciente
  const [nuevoPaciente, setNuevoPaciente] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    telefono: '',
    obra_social: ''
  });

  useEffect(() => {
    if (isOpen && modo === 'buscar') {
      cargarPacientes();
    }
  }, [isOpen, modo]);

  const cargarPacientes = async () => {
    setLoading(true);
    try {
      const data = await getMisPacientes(searchTerm);
      setPacientes(data);
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

  const handleBuscar = () => {
    cargarPacientes();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoPaciente(prev => ({
      ...prev,
      [name]: value
    }));
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
    try {
      const response = await crearPacienteRapido(nuevoPaciente);
      setAlert({
        type: 'success',
        message: 'Paciente creado exitosamente'
      });
      
      // Seleccionar automáticamente el paciente recién creado
      setTimeout(() => {
        onSeleccionar(response.paciente);
        handleClose();
      }, 1000);
      
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Error al crear paciente',
        detail: err.response?.data?.error || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setModo('buscar');
    setSearchTerm('');
    setNuevoPaciente({
      first_name: '',
      last_name: '',
      dni: '',
      telefono: '',
      obra_social: ''
    });
    setAlert({ type: '', message: '', detail: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Asignar Paciente al Turno
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setModo('buscar')}
            className={`flex-1 py-3 px-6 font-medium transition-colors ${
              modo === 'buscar'
                ? 'border-b-2 border-emerald-600 text-emerald-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="w-5 h-5 inline mr-2" />
            Buscar Paciente
          </button>
          <button
            onClick={() => setModo('crear')}
            className={`flex-1 py-3 px-6 font-medium transition-colors ${
              modo === 'crear'
                ? 'border-b-2 border-emerald-600 text-emerald-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-5 h-5 inline mr-2" />
            Crear Nuevo Paciente
          </button>
        </div>

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
              {/* Búsqueda */}
              <div className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-grow">
                    <Input
                      type="text"
                      placeholder="Buscar por nombre o DNI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                    />
                  </div>
                  <Button variant="primary" onClick={handleBuscar} disabled={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>

              {/* Lista de pacientes */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando pacientes...</p>
                </div>
              ) : pacientes.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No se encontraron pacientes</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Intenta con otros términos o crea un nuevo paciente
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {pacientes.map((paciente) => (
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
              {/* Formulario crear paciente */}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalAsignarPaciente;
