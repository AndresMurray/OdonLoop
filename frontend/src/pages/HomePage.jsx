import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Users, Stethoscope, LogIn } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-blue-900 flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Sistema de Gestión Odontológica
        </h1>


        {/* Botón de Login General */}
        <div className="mb-12">
          <Link to="/login" className="inline-block">
            <Button 
              variant="primary" 
              className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <LogIn className="w-6 h-6 mr-3 inline" />
              Iniciar Sesión
            </Button>
          </Link>
        </div>

        <p className="text-slate-300 mb-6 text-lg font-medium">
          ¿No tenés cuenta? Registrate ahora:
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* Card Paciente */}
          <Card className="w-72 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-10 h-10 text-blue-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Soy Paciente
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Gestiona tus turnos y consultas
              </p>
              <Link to="/register/paciente" className="block">
                <Button variant="primary" className="w-full bg-blue-700 hover:bg-blue-800">
                  Registrarme como Paciente
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Odontólogo */}
          <Card className="w-72 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-slate-100 rounded-full">
                  <Stethoscope className="w-10 h-10 text-slate-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Soy Odontólogo
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Administra tu consultorio
              </p>
              <Link to="/register/odontologo" className="block">
                <Button variant="primary" className="w-full bg-slate-700 hover:bg-slate-800">
                  Registrarme como Odontólogo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
