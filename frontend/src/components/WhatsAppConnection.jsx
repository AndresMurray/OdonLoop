import React, { useState, useEffect } from 'react';
import { QrCode, Smartphone, LogOut, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import Button from './Button';
import Alert from './Alert';
import api from '../api/config';

const WhatsAppConnection = () => {
  const [estado, setEstado] = useState('desconectado');
  const [qrCode, setQrCode] = useState(null);
  const [numeroVinculado, setNumeroVinculado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Polling interval reference
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    let intervalId;
    if (polling && (estado === 'desconectado' || estado === 'conectando')) {
      intervalId = setInterval(() => {
        checkStatus(true);
      }, 5000); // Poll every 5 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [polling, estado]);

  const checkStatus = async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const response = await api.get('/odontologos/whatsapp/estado/');
      setEstado(response.data.estado);
      setNumeroVinculado(response.data.numero_vinculado);
      
      // If we were polling and now we're connected, stop polling
      if (response.data.estado === 'conectado') {
        setPolling(false);
        setQrCode(null);
      }
    } catch (error) {
      console.error('Error checking WhatsApp status', error);
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setAlert({ type: '', message: '' });
    try {
      const response = await api.post('/odontologos/whatsapp/generar-qr/');
      if (response.data.qr_code) {
        setQrCode(response.data.qr_code);
        setEstado(response.data.estado);
        setPolling(true); // Start polling for connection success
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.error || 'Error al generar el código QR'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setAlert({ type: '', message: '' });
    try {
      await api.post('/odontologos/whatsapp/desvincular/');
      setEstado('desconectado');
      setQrCode(null);
      setNumeroVinculado(null);
      setPolling(false);
      setAlert({
        type: 'success',
        message: 'WhatsApp desvinculado correctamente'
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Error al desvincular WhatsApp'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-green-500" />
          Conexión de WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alert.message && (
          <div className="mb-4">
            <Alert type={alert.type} message={alert.message} />
          </div>
        )}

        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Vinculá tu WhatsApp para enviar recordatorios automáticos a tus pacientes. 
            Este servicio es exclusivo del plan Premium.
          </p>

          {loading && !polling ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : estado === 'conectado' ? (
            <div className="bg-green-50/10 border border-green-500/30 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <h4 className="font-semibold text-green-400">Conectado Exitosamente</h4>
                  <p className="text-sm text-gray-400">
                    {numeroVinculado ? `Número: ${numeroVinculado}` : 'Tus pacientes recibirán recordatorios desde tu número.'}
                  </p>
                </div>
              </div>
              <Button variant="danger" onClick={handleDisconnect} disabled={loading}>
                <LogOut className="w-4 h-4 mr-2" />
                Desvincular
              </Button>
            </div>
          ) : qrCode ? (
            <div className="flex flex-col items-center border border-gray-700/50 rounded-lg p-6 bg-slate-900/50">
              <h4 className="font-semibold mb-4 text-center">Escaneá el código QR</h4>
              <div className="bg-white p-2 rounded-xl mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
              </div>
              <ol className="text-sm text-gray-400 list-decimal list-inside space-y-1 mb-6 max-w-sm text-left">
                <li>Abre WhatsApp en tu teléfono</li>
                <li>Toca Menú o Configuración y selecciona <strong>Dispositivos vinculados</strong></li>
                <li>Toca <strong>Vincular un dispositivo</strong></li>
                <li>Apunta tu teléfono hacia esta pantalla para escanear el código</li>
              </ol>
              
              <div className="flex items-center gap-2 text-cyan-400 text-sm animate-pulse mb-4">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Esperando conexión...
              </div>

              <Button variant="secondary" onClick={() => { setQrCode(null); setPolling(false); }}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-gray-700 rounded-lg bg-slate-900/20">
              <QrCode className="w-12 h-12 text-gray-500 mb-3" />
              <h4 className="font-medium text-gray-300 mb-2">WhatsApp Desconectado</h4>
              <Button onClick={handleConnect} disabled={loading} className="mt-2 bg-green-600 hover:bg-green-700 text-white border-none">
                <QrCode className="w-4 h-4 mr-2" />
                Vincular WhatsApp
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConnection;
