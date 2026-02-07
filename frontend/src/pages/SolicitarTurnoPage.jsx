import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTurnosDisponibles, reservarTurno, getMisTurnos, cancelarTurno } from '../api/turnoService';
import { getOdontologos } from '../api/odontologoService';
import { authService } from '../api/authService';
import Button from '../components/Button';
import { Card } from '../components/Card';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const SolicitarTurnoPage = () => {
  const navigate = useNavigate();
  const [odontologos, setOdontologos] = useState([]);
  const [odontologoSeleccionado, setOdontologoSeleccionado] = useState('');
  const [turnosDisponibles, setTurnosDisponibles] = useState([]);
  const [misTurnos, setMisTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vistaActual, setVistaActual] = useState('buscar'); // 'buscar' o 'misTurnos'
  const [motivo, setMotivo] = useState('');
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);

  const userData = authService.getUserData();

  useEffect(() => {
    cargarOdontologos();
    cargarMisTurnos();
  }, []);

  const cargarOdontologos = async () => {
    try {
      const data = await getOdontologos();
      setOdontologos(data);
    } catch (err) {
      console.error('Error al cargar odontólogos:', err);
    }
  };

  const cargarMisTurnos = async () => {
    try {
      const data = await getMisTurnos();
      setMisTurnos(data);
    } catch (err) {
      console.error('Error al cargar mis turnos:', err);
    }
  };

  const buscarTurnos = async () => {
    if (!odontologoSeleccionado) {
      setError('Por favor seleccione un odontólogo');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await getTurnosDisponibles(odontologoSeleccionado);
      setTurnosDisponibles(data);
      if (data.length === 0) {
        setError('No hay turnos disponibles para este odontólogo');
      }
    } catch (err) {
      setError('Error al buscar turnos disponibles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReservarTurno = async (turnoId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await reservarTurno(turnoId, motivo);
      setSuccess('¡Turno reservado exitosamente!');
      setTurnoSeleccionado(null);
      setMotivo('');
      buscarTurnos();
      cargarMisTurnos();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al reservar el turno');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarTurno = async (turnoId) => {
    if (!window.confirm('¿Está seguro de cancelar este turno?')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await cancelarTurno(turnoId);
      setSuccess('Turno cancelado exitosamente');
      cargarMisTurnos();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cancelar el turno');
      console.error('Error al cancelar turno:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaHora) => {
    const fecha = new Date(fechaHora);
    return fecha.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado) => {
    const colores = {
      disponible: 'bg-green-100 text-green-800',
      reservado: 'bg-blue-100 text-blue-800',
      confirmado: 'bg-purple-100 text-purple-800',
      completado: 'bg-gray-100 text-gray-800',
      cancelado: 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const odontologoInfo = odontologos.find(o => o.id === parseInt(odontologoSeleccionado));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      <div className="flex-grow bg-white/5 backdrop-blur-sm p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Solicitar Turno</h1>
            <p className="text-slate-200 mt-2">{userData.nombre} {userData.apellido}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/home-paciente')} variant="secondary">
              Volver al Inicio
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setVistaActual('buscar')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              vistaActual === 'buscar'
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Buscar Turnos
          </button>
          <button
            onClick={() => setVistaActual('misTurnos')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              vistaActual === 'misTurnos'
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Mis Turnos ({misTurnos.length})
          </button>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Vista Buscar Turnos */}
        {vistaActual === 'buscar' && (
          <div className="space-y-6">
            {/* Seleccionar Odontólogo */}
            <Card>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Seleccionar Odontólogo</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Odontólogo
                  </label>
                  <select
                    value={odontologoSeleccionado}
                    onChange={(e) => {
                      setOdontologoSeleccionado(e.target.value);
                      setTurnosDisponibles([]);
                      setError('');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Seleccione un odontólogo</option>
                    {odontologos.map((odontologo) => (
                      <option key={odontologo.id} value={odontologo.id}>
                        Dr. {odontologo.user.first_name} {odontologo.user.last_name} - {odontologo.especialidad}
                      </option>
                    ))}
                  </select>
                </div>

                {odontologoSeleccionado && odontologoInfo && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Información del Odontólogo</h3>
                    <p className="text-sm text-gray-600">Especialidad: {odontologoInfo.especialidad}</p>
                    <p className="text-sm text-gray-600">Matrícula: {odontologoInfo.matricula}</p>
                    <p className="text-sm text-gray-600">Experiencia: {odontologoInfo.anos_experiencia} años</p>
                    {odontologoInfo.horario_atencion && (
                      <p className="text-sm text-gray-600">Horario: {odontologoInfo.horario_atencion}</p>
                    )}
                  </div>
                )}

                <Button onClick={buscarTurnos} disabled={loading || !odontologoSeleccionado}>
                  {loading ? 'Buscando...' : 'Buscar Turnos Disponibles'}
                </Button>
              </div>
            </Card>

            {/* Turnos Disponibles */}
            {turnosDisponibles.length > 0 && (
              <Card>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  Turnos Disponibles ({turnosDisponibles.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {turnosDisponibles.map((turno) => (
                    <div
                      key={turno.id}
                      className="p-4 bg-gray-50 rounded-lg border-2 border-transparent hover:border-teal-500 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {formatearFecha(turno.fecha_hora)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Duración: {turno.duracion_minutos} minutos
                          </p>
                          {turno.motivo && (
                            <p className="text-sm text-gray-500 mt-1">{turno.motivo}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(turno.estado)}`}>
                          {turno.estado}
                        </span>
                      </div>

                      {turnoSeleccionado === turno.id ? (
                        <div className="space-y-3 mt-4">
                          <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Motivo de la consulta (opcional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            rows="2"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReservarTurno(turno.id)}
                              disabled={loading}
                            >
                              Confirmar Reserva
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setTurnoSeleccionado(null);
                                setMotivo('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => setTurnoSeleccionado(turno.id)}
                        >
                          Reservar este Turno
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Vista Mis Turnos */}
        {vistaActual === 'misTurnos' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Mis Turnos</h2>
              {misTurnos.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No tienes turnos programados</p>
                  <Button onClick={() => setVistaActual('buscar')}>
                    Buscar Turnos Disponibles
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {misTurnos.map((turno) => (
                    <div
                      key={turno.id}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-gray-800">
                              {formatearFecha(turno.fecha_hora)}
                            </p>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(turno.estado)}`}>
                              {turno.estado}
                            </span>
                          </div>
                          {turno.odontologo && (
                            <p className="text-sm text-gray-600">
                              Odontólogo: {turno.odontologo.nombre_completo}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            Duración: {turno.duracion_minutos} minutos
                          </p>
                          {turno.motivo && (
                            <p className="text-sm text-gray-500 mt-1">Motivo: {turno.motivo}</p>
                          )}
                        </div>
                        {(turno.estado === 'reservado' || turno.estado === 'confirmado') && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleCancelarTurno(turno.id)}
                            disabled={loading}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default SolicitarTurnoPage;
