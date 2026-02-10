import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft, Search, User, FileText } from 'lucide-react';
import { getMisPacientes } from '../api/seguimientoService';

const MisPacientesPage = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '', detail: '' });

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
      console.error('Error al cargar pacientes:', err);
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
                    : 'Los pacientes aparecerán aquí cuando soliciten turnos contigo'
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-grow">
                        <div className="bg-emerald-100 p-3 rounded-full">
                          <User className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {paciente.nombre_completo}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            {paciente.dni && (
                              <span>DNI: {paciente.dni}</span>
                            )}
                            {paciente.email && (
                              <span>📧 {paciente.email}</span>
                            )}
                            {paciente.telefono && (
                              <span>📱 {paciente.telefono}</span>
                            )}
                          </div>
                          {paciente.obra_social_detalle && (
                            <div className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">Obra Social:</span> {paciente.obra_social_detalle.nombre}
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
                      <Button 
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerSeguimiento(paciente.id);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Ver Seguimiento
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MisPacientesPage;
