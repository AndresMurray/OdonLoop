import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserRegistrationForm from '../components/UserRegistrationForm';
import Alert from '../components/Alert';
import { userService } from '../api/userService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleSuccess = async (formData) => {
    try {
      const response = await userService.register(formData);
      setAlert({
        type: 'success',
        message: '¡Registro exitoso! Redirigiendo...',
      });
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Error al registrar usuario',
      });
    }
  };

  const handleError = (error) => {
    setAlert({
      type: 'error',
      message: error.message || 'Error al registrar usuario',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col relative overflow-hidden text-white">
      {/* Background decorations / Glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[15%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none z-0"></div>
      
      <Navbar />
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight">Crear cuenta</h2>
          <p className="mt-2 text-sm text-slate-400">
            Completa el formulario para registrarte
          </p>
        </div>

        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />

        <UserRegistrationForm
          onSuccess={handleSuccess}
          onError={handleError}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterPage;
