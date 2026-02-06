import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearTurno, getMisTurnos, cancelarTurno, confirmarTurno, completarTurno } from '../api/turnoService';
import { authService } from '../api/authService';
import Button from '../components/Button';
import { Card } from '../components/Card';

const GestionTurnosOdonto = () => {
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Estado del formulario para crear turno
  const [nuevoTurno, setNuevoTurno] = useState({
    fecha: '',
    hora: '',
    duracion_minutos: 30,
    motivo: ''
  });

  const userData = authService.getUserData();

  useEffect(() => {
    cargarTurnos();
  }, []);

  const cargarTurnos = async () => {
    setLoading(true);
    try {
      const data = await getMisTurnos();
      setTurnos(data);
      setError('');
    } catch (err) {
      setError('Error al cargar los turnos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearTurno = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Combinar fecha y hora en formato ISO
      const fechaHora = `${nuevoTurno.fecha}T${nuevoTurno.hora}:00`;
      
      const turnoData = {
        odontologo: userData.perfil_id,
        fecha_hora: fechaHora,
        duracion_minutos: parseInt(nuevoTurno.duracion_minutos),
        motivo: nuevoTurno.motivo || ''
      };

      await crearTurno(turnoData);
      setSuccess('Turno creado exitosamente');
      setShowForm(false);
      setNuevoTurno({ fecha: '', hora: '', duracion_minutos: 30, motivo: '' });
      cargarTurnos();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear el turno');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarTurno = async (turnoId) => {
    if (!window.confirm('¿Está seguro de cancelar este turno?')) return;
    
    setLoading(true);
    try {
      await cancelarTurno(turnoId);
      setSuccess('Turno cancelado exitosamente');
      cargarTurnos();
    } catch (err) {
      setError('Error al cancelar el turno');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarTurno = async (turnoId) => {
    setLoading(true);
    try {
      await confirmarTurno(turnoId);
      setSuccess('Turno confirmado exitosamente');
      cargarTurnos();
    } catch (err) {
      setError('Error al confirmar el turno');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletarTurno = async (turnoId) => {
    setLoading(true);
    try {
      await completarTurno(turnoId);
      setSuccess('Turno completado exitosamente');
      cargarTurnos();
    } catch (err) {
      setError('Error al completar el turno');
      console.error(err);
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

  const getTurnosPorEstado = (estado) => {
    return turnos.filter(t => t.estado === estado);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Turnos</h1>
            <p className="text-gray-600 mt-2">Dr. {userData.nombre} {userData.apellido}</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/home-odontologo')} variant="secondary">
              Volver al Inicio
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancelar' : '+ Crear Turno Disponible'}
            </Button>
          </div>
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

        {/* Formulario Crear Turno */}
        {showForm && (
          <Card className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Crear Turno Disponible</h2>
            <form onSubmit={handleCrearTurno} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={nuevoTurno.fecha}
                    onChange={(e) => setNuevoTurno({ ...nuevoTurno, fecha: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora
                  </label>
                  <input
                    type="time"
                    required
                    value={nuevoTurno.hora}
                    onChange={(e) => setNuevoTurno({ ...nuevoTurno, hora: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (minutos)
                </label>
                <select
                  value={nuevoTurno.duracion_minutos}
                  onChange={(e) => setNuevoTurno({ ...nuevoTurno, duracion_minutos: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1.5 horas</option>
                  <option value="120">2 horas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={nuevoTurno.motivo}
                  onChange={(e) => setNuevoTurno({ ...nuevoTurno, motivo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Ej: Consulta general, limpieza, etc."
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Turno'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Lista de Turnos */}
        {loading && !turnos.length ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando turnos...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Turnos Disponibles */}
            <Card>
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Turnos Disponibles ({getTurnosPorEstado('disponible').length})
              </h3>
              {getTurnosPorEstado('disponible').length === 0 ? (
                <p className="text-gray-500">No hay turnos disponibles</p>
              ) : (
                <div className="space-y-3">
                  {getTurnosPorEstado('disponible').map((turno) => (
                    <div
                      key={turno.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{formatearFecha(turno.fecha_hora)}</p>
                        <p className="text-sm text-gray-600">{turno.duracion_minutos} minutos</p>
                        {turno.motivo && (
                          <p className="text-sm text-gray-500 mt-1">{turno.motivo}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(turno.estado)}`}>
                          {turno.estado}
                        </span>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleCancelarTurno(turno.id)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Turnos Reservados */}
            <Card>
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Turnos Reservados ({getTurnosPorEstado('reservado').length})
              </h3>
              {getTurnosPorEstado('reservado').length === 0 ? (
                <p className="text-gray-500">No hay turnos reservados</p>
              ) : (
                <div className="space-y-3">
                  {getTurnosPorEstado('reservado').map((turno) => (
                    <div
                      key={turno.id}
                      className="flex justify-between items-center p-4 bg-blue-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{formatearFecha(turno.fecha_hora)}</p>
                        {turno.paciente && (
                          <p className="text-sm text-gray-600">
                            Paciente: {turno.paciente.nombre_completo}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">{turno.duracion_minutos} minutos</p>
                        {turno.motivo && (
                          <p className="text-sm text-gray-500 mt-1">{turno.motivo}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(turno.estado)}`}>
                          {turno.estado}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmarTurno(turno.id)}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleCancelarTurno(turno.id)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Turnos Confirmados */}
            <Card>
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Turnos Confirmados ({getTurnosPorEstado('confirmado').length})
              </h3>
              {getTurnosPorEstado('confirmado').length === 0 ? (
                <p className="text-gray-500">No hay turnos confirmados</p>
              ) : (
                <div className="space-y-3">
                  {getTurnosPorEstado('confirmado').map((turno) => (
                    <div
                      key={turno.id}
                      className="flex justify-between items-center p-4 bg-purple-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{formatearFecha(turno.fecha_hora)}</p>
                        {turno.paciente && (
                          <p className="text-sm text-gray-600">
                            Paciente: {turno.paciente.nombre_completo}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">{turno.duracion_minutos} minutos</p>
                        {turno.motivo && (
                          <p className="text-sm text-gray-500 mt-1">{turno.motivo}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(turno.estado)}`}>
                          {turno.estado}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleCompletarTurno(turno.id)}
                        >
                          Completar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleCancelarTurno(turno.id)}
                        >
                          Cancelar
                        </Button>
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
  );
};

export default GestionTurnosOdonto;
