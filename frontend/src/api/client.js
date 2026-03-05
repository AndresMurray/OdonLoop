class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    // Control de refresh concurrente: si varios requests dan 401 al mismo tiempo,
    // solo se hace UN refresh y los demás esperan el resultado
    this._refreshPromise = null;
  }

  getAuthHeader() {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Intenta refrescar el access token usando el refresh token.
   * Si ya hay un refresh en curso, reutiliza esa misma promesa.
   */
  async _tryRefreshToken() {
    // Si ya hay un refresh en curso, esperar ese mismo
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    this._refreshPromise = (async () => {
      try {
        const url = this.baseURL
          ? `${this.baseURL}/api/usuarios/token/refresh/`
          : '/api/usuarios/token/refresh/';

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!res.ok) {
          throw new Error('Refresh failed');
        }

        const data = await res.json();

        if (data.access) {
          localStorage.setItem('access_token', data.access);
        }
        // Guardar nuevo refresh token si hay rotación
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }

        return true;
      } catch {
        // Refresh falló → sesión expirada, limpiar y redirigir
        this._forceLogout();
        return false;
      } finally {
        this._refreshPromise = null;
      }
    })();

    return this._refreshPromise;
  }

  /**
   * Limpia tokens y redirige al login
   */
  _forceLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('persist.auth');

    // Redirigir al login si no estamos ya ahí
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  async request(endpoint, options = {}, _isRetry = false) {
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
      
      const response = await fetch(url, config);

      // 204 No Content (DELETE) — no hay body que parsear
      if (response.status === 204) {
        return null;
      }

      // 401 Unauthorized → intentar refresh y reintentar UNA vez
      // Solo intentar refresh si el usuario ya tiene sesión (hay refresh token)
      if (response.status === 401 && !_isRetry) {
        const hasRefreshToken = !!localStorage.getItem('refresh_token');
        if (hasRefreshToken) {
          const refreshed = await this._tryRefreshToken();
          if (refreshed) {
            // Reintentar el request original con el token nuevo
            return this.request(endpoint, options, true);
          }
          // Si no se pudo refrescar, _forceLogout ya se ejecutó
          throw {
            status: 401,
            message: 'Sesión expirada. Por favor, iniciá sesión nuevamente.',
            errors: {},
          };
        }
      }

      const data = await response.json();

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
