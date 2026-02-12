import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, Save, ArrowLeft, Edit2, X } from 'lucide-react';
import { getMiPerfil, actualizarMiPerfil } from '../api/odontologoService';

const PerfilOdontologoPage = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  
  // Estado del formulario de edición
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    telefono: '',
    fecha_nacimiento: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const perfilData = await getMiPerfil();
      
      setPerfil(perfilData);
      
      // Inicializar formulario con datos actuales
      setFormData({
        first_name: perfilData.first_name || '',
        last_name: perfilData.last_name || '',
        telefono: perfilData.telefono || '',
        fecha_nacimiento: perfilData.fecha_nacimiento || ''
      });
      
    } catch {
      setAlert({
        type: 'error',
        message: 'Error al cargar el perfil'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    setAlert({ type: '', message: '' });
    
    try {
      const datosActualizados = await actualizarMiPerfil(formData);
      setPerfil(datosActualizados);
      setEditando(false);
      setAlert({
        type: 'success',
        message: 'Perfil actualizado correctamente'
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.error || 'Error al actualizar el perfil'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = () => {
    // Restaurar datos originales
    if (perfil) {
      setFormData({
        first_name: perfil.first_name || '',
        last_name: perfil.last_name || '',
        telefono: perfil.telefono || '',
        fecha_nacimiento: perfil.fecha_nacimiento || ''
      });
    }
    setEditando(false);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      activo: 'bg-green-100 text-green-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      suspendido: 'bg-red-100 text-red-800'
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      
      <div className="flex-grow p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                onClick={() => navigate('/home-odontologo')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
            </div>
            
            {!editando ? (
              <Button onClick={() => setEditando(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleGuardar} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button variant="secondary" onClick={handleCancelar}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          {/* Alertas */}
          {alert.message && (
            <div className="mb-6">
              <Alert type={alert.type} message={alert.message} />
            </div>
          )}

          {/* Estado del odontólogo */}
          <div className="mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoBadge(perfil?.estado)}`}>
              {perfil?.estado_display}
            </span>
          </div>

          {/* Contenido */}
          <div className="space-y-6">
            {/* Datos Personales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Datos Personales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editando ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <Input
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          placeholder="Nombre"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                        <Input
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder="Apellido"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input
                        value={perfil?.email || ''}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <Input
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        placeholder="Teléfono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                      <Input
                        type="date"
                        name="fecha_nacimiento"
                        value={formData.fecha_nacimiento}
                        onChange={handleInputChange}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Nombre completo</span>
                      <span className="font-medium">{perfil?.nombre_completo || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Email</span>
                      <span className="font-medium">{perfil?.email || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Teléfono</span>
                      <span className="font-medium">{perfil?.telefono || '-'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Fecha de Nacimiento</span>
                      <span className="font-medium">{formatearFecha(perfil?.fecha_nacimiento)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Información de la cuenta */}
            <Card>
              <CardHeader>
                <CardTitle>Información de la Cuenta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Fecha de alta</span>
                  <span className="font-medium">{formatearFecha(perfil?.fecha_alta?.split('T')[0])}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PerfilOdontologoPage;
