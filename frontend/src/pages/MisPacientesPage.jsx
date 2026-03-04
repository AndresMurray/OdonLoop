import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft, Search, User, FileText, Smile, UserPlus, Pencil } from 'lucide-react';
import { getMisPacientes } from '../api/seguimientoService';
import ModalAsignarPaciente from '../components/ModalAsignarPaciente';
import ModalEditarPaciente from '../components/ModalEditarPaciente';

const MisPacientesPage = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '', detail: '' });
  const [modalNuevoPaciente, setModalNuevoPaciente] = useState(false);
  const [pacienteEditar, setPacienteEditar] = useState(null);

  useEffect(() => {
    cargarPacientes();
  }, []);

  useEffect(() => {
    // Filtrar pacientes localmente mientras el usuario escribe
    if (searchTerm.trim() === '') {
      setPacientesFiltrados(pacientes);
    } else {
      const filtered = pacientes.filter(p =>
        p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.dni && p.dni.includes(searchTerm))
      );
      setPacientesFiltrados(filtered);
    }
  }, [searchTerm, pacientes]);

  const cargarPacientes = async () => {
    setLoading(true);
    try {
      const data = await getMisPacientes();
      setPacientes(data);
      setPacientesFiltrados(data);
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

  const handleVerSeguimiento = (pacienteId) => {
    navigate(`/seguimiento-paciente/${pacienteId}`);
  };

  const handleVerOdontograma = (pacienteId) => {
    navigate(`/odontograma/${pacienteId}`);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin seguimientos';

    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />

      {/* Header */}
      <header className="bg-white/95 shadow-md backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/home-odontologo')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Mis Pacientes
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona el seguimiento de tus pacientes
                </p>
              </div>
            </div>
            {/* Botón Nuevo Paciente */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModalNuevoPaciente(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Nuevo Paciente
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <Alert
            type={alert.type}
            message={alert.message}
            detail={alert.detail}
            onClose={() => setAlert({ type: '', message: '', detail: '' })}
          />

          {/* Barra de búsqueda */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-grow">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Buscar por nombre o DNI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {searchTerm && (
                <p className="text-sm text-gray-600 mt-2">
                  {pacientesFiltrados.length} resultado(s) encontrado(s)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Lista de pacientes */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando pacientes...</p>
              </CardContent>
            </Card>
          ) : pacientesFiltrados.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">
                  {searchTerm ? 'No se encontraron pacientes' : 'No tienes pacientes registrados'}
                </p>
                <p className="text-gray-500 mt-2">
                  {searchTerm
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Creá tu primer paciente con el botón "Nuevo Paciente" o los pacientes aparecerán aquí cuando soliciten turnos contigo'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pacientesFiltrados.map((paciente) => (
                <Card
                  key={paciente.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleVerSeguimiento(paciente.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-4 flex-grow">
                        <div className="bg-emerald-100 p-3 rounded-full">
                          <User className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {paciente.nombre_completo}
                          </h3>

                          {/* Datos de contacto */}
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                            {paciente.dni && (
                              <span>DNI: {paciente.dni}</span>
                            )}
                            {paciente.email && (
                              <span>📧 {paciente.email}</span>
                            )}
                            {paciente.telefono && (
                              <span>📱 {paciente.telefono}</span>
                            )}
                            {paciente.fecha_nacimiento && (
                              <span>Nac: {formatearFecha(paciente.fecha_nacimiento)}</span>
                            )}
                          </div>

                          {/* Dirección */}
                          {paciente.direccion && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Dirección:</span> {paciente.direccion}
                            </div>
                          )}

                          {/* Obra Social */}
                          {(paciente.obra_social_detalle || paciente.obra_social_otra) && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Obra Social:</span>{' '}
                              {paciente.obra_social_otra
                                ? paciente.obra_social_otra
                                : paciente.obra_social_detalle?.sigla
                                  ? `${paciente.obra_social_detalle.sigla} - ${paciente.obra_social_detalle.nombre}`
                                  : paciente.obra_social_detalle?.nombre
                              }
                            </div>
                          )}

                          {/* Información médica */}
                          {(paciente.antecedentes_medicos || paciente.alergias) && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                              {paciente.antecedentes_medicos && (
                                <div className="mb-2">
                                  <span className="font-medium text-gray-700">Antecedentes:</span>{' '}
                                  <span className="text-gray-600">{paciente.antecedentes_medicos}</span>
                                </div>
                              )}
                              {paciente.alergias && (
                                <div>
                                  <span className="font-medium text-red-700">Alergias:</span>{' '}
                                  <span className="text-red-600">{paciente.alergias}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">Último seguimiento: </span>
                            <span className="font-medium text-gray-700">
                              {formatearFecha(paciente.ultimo_seguimiento)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Botones de acción */}
                      <div className="flex flex-row sm:flex-col gap-2 sm:ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPacienteEditar(paciente);
                          }}
                          className="flex-1 sm:flex-none text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerSeguimiento(paciente.id);
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Seguimiento
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerOdontograma(paciente.id);
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          <Smile className="w-4 h-4 mr-2" />
                          Odontograma
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />

      {/* Modal Nuevo Paciente */}
      <ModalAsignarPaciente
        isOpen={modalNuevoPaciente}
        onClose={() => setModalNuevoPaciente(false)}
        soloCrear={true}
        onSeleccionar={() => {
          // Al crear o asignar un paciente, refrescar la lista y cerrar el modal
          cargarPacientes();
          setModalNuevoPaciente(false);
          setAlert({ type: 'success', message: 'Paciente agregado a tu lista exitosamente' });
        }}
      />

      {/* Modal Editar Paciente */}
      <ModalEditarPaciente
        isOpen={!!pacienteEditar}
        onClose={() => setPacienteEditar(null)}
        paciente={pacienteEditar}
        onGuardado={(pacienteActualizado) => {
          // Actualizar el paciente en la lista local
          setPacientes(prev =>
            prev.map(p => p.id === pacienteActualizado.id ? pacienteActualizado : p)
          );
          setAlert({ type: 'success', message: 'Paciente actualizado exitosamente' });
        }}
      />
    </div>
  );
};

export default MisPacientesPage;
