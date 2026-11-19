// Estado global de autenticación: usuario actual, token, login, registro y logout.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, almacenToken, EVENTO_SESION_EXPIRADA } from '../api/cliente';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true); // validando el token guardado al abrir la app
  const [avisoSesion, setAvisoSesion] = useState('');

  const cerrarSesion = useCallback((mensaje = '') => {
    almacenToken.borrar();
    setUsuario(null);
    setAvisoSesion(mensaje);
  }, []);

  // Al cargar la página: si hay un token guardado, se valida contra la ruta protegida /auth/perfil.
  useEffect(() => {
    if (!almacenToken.leer()) { setCargando(false); return; }
    authApi.perfil()
      .then(({ usuario: u }) => setUsuario(u))
      // Si falla (401 token vencido/alterado), el evento de sesión expirada ya dejó el aviso;
      // aquí solo se limpia el token sin borrar ese mensaje.
      .catch(() => { almacenToken.borrar(); setUsuario(null); })
      .finally(() => setCargando(false));
  }, [cerrarSesion]);

  // Si cualquier petición recibe 401 (token vencido o inválido), se cierra la sesión.
  useEffect(() => {
    const alExpirar = (e) => cerrarSesion(`Tu sesión ya no es válida (${e.detail || 'token vencido'}). Inicia sesión nuevamente.`);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, [cerrarSesion]);

  const iniciarSesion = useCallback(async (correo, password) => {
    const { token, usuario: u } = await authApi.login({ correo, password });
    almacenToken.guardar(token);
    setUsuario(u);
    setAvisoSesion('');
    return u;
  }, []);

  const registrarse = useCallback((datos) => authApi.registro(datos), []);

  const valor = useMemo(() => ({
    usuario,
    cargando,
    autenticado: Boolean(usuario),
    esAdmin: usuario?.rol === 'admin',
    avisoSesion,
    limpiarAviso: () => setAvisoSesion(''),
    iniciarSesion,
    registrarse,
    cerrarSesion,
  }), [usuario, cargando, avisoSesion, iniciarSesion, registrarse, cerrarSesion]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
