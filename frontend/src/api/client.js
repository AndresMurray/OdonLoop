class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  getAuthHeader() {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const url = this.baseURL ? `${this.baseURL}${endpoint}` : endpoint;
      console.log('🌐 Llamando a:', url, 'con método:', options.method || 'GET');
      console.log('📦 Datos:', options.body);
      
      const response = await fetch(url, config);
      const data = await response.json();

      console.log('📥 Respuesta status:', response.status);
      console.log('📥 Respuesta data:', data);

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || data.error || 'Error en la petición',
          errors: data,
          response: { data }
        };
      }

      return data;
    } catch (error) {
      console.error('❌ Error en request:', error);
      if (error.status) throw error;
      throw {
        status: 500,
        message: 'Error de conexión con el servidor',
        errors: {},
      };
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export default ApiClient;
