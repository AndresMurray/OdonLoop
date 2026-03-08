import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, Save, ArrowLeft, Edit2, X, Key } from 'lucide-react';
import { getMiPerfil, actualizarMiPerfil, getObrasSociales } from '../api/pacienteService';
import { changePassword } from '../api/passwordService';

const PerfilPacientePage = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [mostrarOtraOS, setMostrarOtraOS] = useState(false);

  // Estados para cambiar contraseña
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordAlert, setPasswordAlert] = useState({ type: '', message: '' });

  // Estado del formulario de edición
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    telefono: '',
    fecha_nacimiento: '',
    dni: '',
    direccion: '',
    obra_social: '',
    obra_social_otra: '',
    numero_afiliado: '',
    plan: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [perfilData, obrasData] = await Promise.all([
        getMiPerfil(),
        getObrasSociales()
      ]);

      setPerfil(perfilData);
      setObrasSociales(obrasData);

      // Inicializar formulario con datos actuales
      setFormData({
        first_name: perfilData.first_name || '',
        last_name: perfilData.last_name || '',
        telefono: perfilData.telefono || '',
        fecha_nacimiento: perfilData.fecha_nacimiento || '',
        dni: perfilData.dni || '',
        direccion: perfilData.direccion || '',
        obra_social: perfilData.obra_social || '',
        obra_social_otra: perfilData.obra_social_otra || '',
        numero_afiliado: perfilData.numero_afiliado || '',
        plan: perfilData.plan || ''
      });

      // Si tiene obra_social_otra, mostrar el input manual
      if (perfilData.obra_social_otra) {
        setMostrarOtraOS(true);
      }

    } catch (error) {
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
      // Preparar datos según si usa obra social de lista o manual
      const datosAEnviar = {
        ...formData,
        obra_social: mostrarOtraOS ? null : formData.obra_social,
        obra_social_otra: mostrarOtraOS ? formData.obra_social_otra : null
      };

      const datosActualizados = await actualizarMiPerfil(datosAEnviar);
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
        fecha_nacimiento: perfil.fecha_nacimiento || '',
        dni: perfil.dni || '',
        direccion: perfil.direccion || '',
        obra_social: perfil.obra_social || '',
        obra_social_otra: perfil.obra_social_otra || '',
        numero_afiliado: perfil.numero_afiliado || '',
        plan: perfil.plan || ''
      });
      setMostrarOtraOS(!!perfil.obra_social_otra);
    }
    setEditando(false);
  };

  const handlePasswordChange = async () => {
    setPasswordAlert({ type: '', message: '' });

    // Validaciones
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      setPasswordAlert({
        type: 'error',
        message: 'Todos los campos son requeridos'
      });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordAlert({
        type: 'error',
        message: 'Las contraseñas nuevas no coinciden'
      });
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordAlert({
        type: 'error',
        message: 'La nueva contraseña debe tener al menos 8 caracteres'
      });
      return;
    }

    setCambiandoPassword(true);
    try {
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      setPasswordAlert({
        type: 'success',
        message: 'Contraseña actualizada correctamente'
      });

      // Limpiar formulario y ocultar después de 2 segundos
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      setTimeout(() => {
        setMostrarCambioPassword(false);
        setPasswordAlert({ type: '', message: '' });
      }, 2000);
    } catch (error) {
      setPasswordAlert({
        type: 'error',
        message: error.response?.data?.error || 'Error al cambiar la contraseña'
      });
    } finally {
      setCambiandoPassword(false);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/home-paciente')}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Volver</span>
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Mi Perfil</h1>
              </div>

              {!editando ? (
                <Button onClick={() => setEditando(true)} className="w-full sm:w-auto">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleGuardar} disabled={saving} className="flex-1 sm:flex-initial">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                  <Button variant="secondary" onClick={handleCancelar} className="flex-1 sm:flex-initial">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Alertas */}
          {alert.message && (
            <div className="mb-6">
              <Alert type={alert.type} message={alert.message} />
            </div>
          )}

          {/* Contenido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                      <Input
                        name="dni"
                        value={formData.dni}
                        onChange={handleInputChange}
                        placeholder="DNI"
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
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Fecha de Nacimiento</span>
                      <span className="font-medium">{formatearFecha(perfil?.fecha_nacimiento)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">DNI</span>
                      <span className="font-medium">{perfil?.dni || '-'}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Datos de Obra Social */}
            <Card>
              <CardHeader>
                <CardTitle>Obra Social</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editando ? (
                  <>
                    {!mostrarOtraOS ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Obra Social</label>
                        <select
                          name="obra_social"
                          value={formData.obra_social}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Sin obra social</option>
                          {obrasSociales.map(os => (
                            <option key={os.id} value={os.id}>
                              {os.sigla ? `${os.sigla} - ${os.nombre}` : os.nombre}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="mt-2 text-sm text-cyan-600 hover:text-cyan-800 underline"
                          onClick={() => {
                            setMostrarOtraOS(true);
                            setFormData(prev => ({ ...prev, obra_social: '' }));
                          }}
                        >
                          Mi obra social no está en la lista
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu Obra Social</label>
                        <Input
                          name="obra_social_otra"
                          value={formData.obra_social_otra}
                          onChange={handleInputChange}
                          placeholder="Escribí el nombre de tu obra social"
                        />
                        <button
                          type="button"
                          className="mt-2 text-sm text-cyan-600 hover:text-cyan-800 underline"
                          onClick={() => {
                            setMostrarOtraOS(false);
                            setFormData(prev => ({ ...prev, obra_social_otra: '' }));
                          }}
                        >
                          Volver a seleccionar de la lista
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Obra Social</span>
                    <span className="font-medium">
                      {perfil?.obra_social_otra
                        ? perfil.obra_social_otra
                        : perfil?.obra_social_detalle
                          ? (perfil.obra_social_detalle.sigla
                            ? `${perfil.obra_social_detalle.sigla} - ${perfil.obra_social_detalle.nombre}`
                            : perfil.obra_social_detalle.nombre)
                          : 'Sin obra social'}
                    </span>
                  </div>
                )}

                {/* Número de Afiliado y Plan */}
                {editando ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">N° de Afiliado</label>
                      <Input
                        name="numero_afiliado"
                        value={formData.numero_afiliado}
                        onChange={handleInputChange}
                        placeholder="Número de afiliado"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                      <Input
                        name="plan"
                        value={formData.plan}
                        onChange={handleInputChange}
                        placeholder="Plan de la obra social"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">N° de Afiliado</span>
                      <span className="font-medium">{perfil?.numero_afiliado || 'No especificado'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Plan</span>
                      <span className="font-medium">{perfil?.plan || 'No especificado'}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Cambiar Contraseña */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Cambiar Contraseña
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!mostrarCambioPassword ? (
                  <div>
                    <p className="text-gray-600 mb-4">Modificá tu contraseña de acceso al sistema</p>
                    <Button onClick={() => setMostrarCambioPassword(true)}>
                      <Key className="w-4 h-4 mr-2" />
                      Cambiar Contraseña
                    </Button>
                  </div>
                ) : (
                  <>
                    {passwordAlert.message && (
                      <div className="mb-4">
                        <Alert type={passwordAlert.type} message={passwordAlert.message} />
                      </div>
                    )}

                    <div className="max-w-md space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contraseña Actual
                        </label>
                        <Input
                          type="password"
                          name="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordInputChange}
                          placeholder="Ingresá tu contraseña actual"
                          disabled={cambiandoPassword}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nueva Contraseña
                        </label>
                        <Input
                          type="password"
                          name="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordInputChange}
                          placeholder="Ingresá tu nueva contraseña"
                          disabled={cambiandoPassword}
                        />
                        <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirmar Nueva Contraseña
                        </label>
                        <Input
                          type="password"
                          name="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordInputChange}
                          placeholder="Confirmá tu nueva contraseña"
                          disabled={cambiandoPassword}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handlePasswordChange}
                          disabled={cambiandoPassword}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {cambiandoPassword ? 'Cambiando...' : 'Guardar Nueva Contraseña'}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setMostrarCambioPassword(false);
                            setPasswordData({
                              current_password: '',
                              new_password: '',
                              confirm_password: ''
                            });
                            setPasswordAlert({ type: '', message: '' });
                          }}
                          disabled={cambiandoPassword}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Información de la cuenta */}
            <Card className="md:col-span-2">
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

export default PerfilPacientePage;
