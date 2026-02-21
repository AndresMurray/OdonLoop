import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft, Mail, Key } from 'lucide-react';
import { requestPasswordReset, verifyResetCode, resetPassword } from '../api/passwordService';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: código, 3: nueva contraseña
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleRequestCode = async (e) => {
    e.preventDefault();

    if (!email) {
      setAlert({ type: 'error', message: 'El email es requerido' });
      return;
    }

    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      await requestPasswordReset(email);
      setAlert({
        type: 'success',
        message: 'Si el email existe, recibirás un código de verificación, revisa tu bandeja de entrada (y spam). El código expira en 15 minutos.'
      });
      setStep(2);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.error || 'Error al solicitar recuperación'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setAlert({ type: 'error', message: 'Ingresa un código de 6 dígitos' });
      return;
    }

    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      await verifyResetCode(email, code);
      setAlert({
        type: 'success',
        message: 'Código verificado correctamente'
      });
      setStep(3);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.error || 'Código inválido o expirado'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 8) {
      setAlert({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlert({ type: 'error', message: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      await resetPassword(email, code, newPassword);
      setAlert({
        type: 'success',
        message: 'Contraseña cambiada correctamente. Redirigiendo...'
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.error || 'Error al cambiar contraseña'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Link to="/login" className="text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
              </div>
              <p className="text-gray-600 text-sm">
                {step === 1 && 'Ingresa tu email para recibir un código de verificación'}
                {step === 2 && 'Ingresa el código que enviamos a tu email'}
                {step === 3 && 'Ingresa tu nueva contraseña'}
              </p>
            </CardHeader>

            <CardContent>
              <Alert
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert({ type: '', message: '' })}
              />

              {/* Paso 1: Ingresar email */}
              {step === 1 && (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Código'}
                  </Button>

                  <div className="text-center text-sm">
                    <Link to="/login" className="text-cyan-600 hover:text-cyan-800">
                      Volver al inicio de sesión
                    </Link>
                  </div>
                </form>
              )}

              {/* Paso 2: Ingresar código */}
              {step === 2 && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Verificación
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="pl-10 text-center text-2xl tracking-widest"
                        maxLength={6}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Revisa tu bandeja de entrada (y spam). El código expira en 15 minutos.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Verificando...' : 'Verificar Código'}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm text-cyan-600 hover:text-cyan-800"
                    >
                      Volver a enviar código
                    </button>
                  </div>
                </form>
              )}

              {/* Paso 3: Nueva contraseña */}
              {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Contraseña
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Contraseña
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
