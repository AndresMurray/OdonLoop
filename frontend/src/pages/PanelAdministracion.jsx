import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllOdontologos, aprobarOdontologo, suspenderOdontologo, activarOdontologo } from '../api/adminService';
import { authService } from '../api/authService';
import Button from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UserCheck, UserX, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PanelAdministracion = () => {
  const navigate = useNavigate();
  const [odontologos, setOdontologos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtro, setFiltro] = useState('todos'); // 'todos', 'pendiente', 'activo', 'suspendido'
  const [motivoSuspension, setMotivoSuspension] = useState('');
  const [odontologoParaSuspender, setOdontologoParaSuspender] = useState(null);

  const userData = authService.getUserData();

  useEffect(() => {
    if (!userData || userData.tipo_usuario !== 'admin') {
      navigate('/');
      return;
    }
    cargarOdontologos();
  }, [navigate, userData]);

  const cargarOdontologos = async () => {
    try {
      setLoading(true);
      const data = await getAllOdontologos();
      setOdontologos(data);
    } catch (err) {
      setError('Error al cargar los odontólogos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (id) => {
    if (!window.confirm('¿Está seguro de aprobar este odontólogo?')) return;

    try {
      setLoading(true);
      const response = await aprobarOdontologo(id);
      setSuccess(response.message || 'Odontólogo aprobado exitosamente');
      cargarOdontologos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al aprobar odontólogo');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspender = async () => {
    if (!odontologoParaSuspender) return;

    try {
      setLoading(true);
      const response = await suspenderOdontologo(odontologoParaSuspender, motivoSuspension || 'Falta de pago');
      setSuccess(response.message || 'Odontólogo suspendido exitosamente');
      setOdontologoParaSuspender(null);
      setMotivoSuspension('');
      cargarOdontologos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al suspender odontólogo');
    } finally {
      setLoading(false);
    }
  };

  const handleActivar = async (id) => {
    if (!window.confirm('¿Está seguro de reactivar este odontólogo?')) return;

    try {
      setLoading(true);
      const response = await activarOdontologo(id);
      setSuccess(response.message || 'Odontólogo reactivado exitosamente');
      cargarOdontologos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reactivar odontólogo');
    } finally {
      setLoading(false);
    }
  };

  const odontologosFiltrados = odontologos.filter(odontologo => {
    if (filtro === 'todos') return true;
    return odontologo.estado === filtro;
  });

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendiente' },
      activo: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Activo' },
      suspendido: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Suspendido' }
    };
    const badge = badges[estado] || badges.activo;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const contadores = {
    pendiente: odontologos.filter(o => o.estado === 'pendiente').length,
    activo: odontologos.filter(o => o.estado === 'activo').length,
    suspendido: odontologos.filter(o => o.estado === 'suspendido').length,
  };

  if (loading && odontologos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex items-center justify-center">
        <p className="text-white text-xl">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      
      {/* Header */}
      <header className="bg-white/95 shadow-md backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="text-gray-600 mt-1">Gestión de odontólogos</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/home-admin')}>
              Volver
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Mensajes */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Contadores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-600">{contadores.pendiente}</p>
                  </div>
                  <Clock className="w-12 h-12 text-yellow-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Activos</p>
                    <p className="text-3xl font-bold text-green-600">{contadores.activo}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Suspendidos</p>
                    <p className="text-3xl font-bold text-red-600">{contadores.suspendido}</p>
                  </div>
                  <XCircle className="w-12 h-12 text-red-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Button 
                  variant={filtro === 'todos' ? 'primary' : 'secondary'}
                  onClick={() => setFiltro('todos')}
                  size="sm"
                >
                  Todos ({odontologos.length})
                </Button>
                <Button 
                  variant={filtro === 'pendiente' ? 'primary' : 'secondary'}
                  onClick={() => setFiltro('pendiente')}
                  size="sm"
                >
                  Pendientes ({contadores.pendiente})
                </Button>
                <Button 
                  variant={filtro === 'activo' ? 'primary' : 'secondary'}
                  onClick={() => setFiltro('activo')}
                  size="sm"
                >
                  Activos ({contadores.activo})
                </Button>
                <Button 
                  variant={filtro === 'suspendido' ? 'primary' : 'secondary'}
                  onClick={() => setFiltro('suspendido')}
                  size="sm"
                >
                  Suspendidos ({contadores.suspendido})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de odontólogos */}
          <Card>
            <CardHeader>
              <CardTitle>Odontólogos ({odontologosFiltrados.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {odontologosFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay odontólogos en esta categoría</p>
              ) : (
                <div className="space-y-4">
                  {odontologosFiltrados.map((odontologo) => (
                    <div
                      key={odontologo.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Dr. {odontologo.nombre_completo}
                            </h3>
                            {getEstadoBadge(odontologo.estado)}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Email:</strong> {odontologo.user.email}</p>
                            {odontologo.especialidad && (
                              <p><strong>Especialidad:</strong> {odontologo.especialidad}</p>
                            )}
                            {odontologo.matricula && (
                              <p><strong>Matrícula:</strong> {odontologo.matricula}</p>
                            )}
                            <p><strong>Fecha de registro:</strong> {new Date(odontologo.fecha_alta).toLocaleDateString('es-AR')}</p>
                            {odontologo.fecha_aprobacion && (
                              <p><strong>Fecha de aprobación:</strong> {new Date(odontologo.fecha_aprobacion).toLocaleDateString('es-AR')}</p>
                            )}
                            {odontologo.motivo_suspension && (
                              <p className="text-red-600"><strong>Motivo de suspensión:</strong> {odontologo.motivo_suspension}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-[180px]">
                          {odontologo.estado === 'pendiente' && (
                            <Button
                              size="sm"
                              onClick={() => handleAprobar(odontologo.id)}
                              disabled={loading}
                              className="w-full"
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Aprobar
                            </Button>
                          )}
                          {odontologo.estado === 'activo' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={(e) => {
                                e.preventDefault();
                                setOdontologoParaSuspender(odontologo.id);
                                setMotivoSuspension('');
                              }}
                              className="w-full cursor-pointer"
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Suspender
                            </Button>
                          )}
                          {odontologo.estado === 'suspendido' && (
                            <Button
                              size="sm"
                              onClick={() => handleActivar(odontologo.id)}
                              disabled={loading}
                              className="w-full"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Reactivar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de suspensión */}
      {odontologoParaSuspender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Suspender Odontólogo
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la suspensión
              </label>
              <textarea
                value={motivoSuspension}
                onChange={(e) => setMotivoSuspension(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows="3"
                placeholder="Ej: Falta de pago, Incumplimiento de términos, etc."
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleSuspender}
                disabled={loading}
                className="flex-1"
              >
                Confirmar Suspensión
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setOdontologoParaSuspender(null);
                  setMotivoSuspension('');
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PanelAdministracion;
