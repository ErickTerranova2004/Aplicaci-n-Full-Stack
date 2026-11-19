import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alerta, Campo } from '../components/Ui';

export default function Login() {
  const { iniciarSesion, avisoSesion, limpiarAviso } = useAuth();
  const navegar = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ correo: state?.correo || '', password: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrores((prev) => ({ ...prev, [e.target.name]: undefined })); // se limpia el error al corregir
  };

  const enviar = async (e) => {
    e.preventDefault();
    const locales = {};
    if (!form.correo.trim()) locales.correo = 'El correo es obligatorio';
    if (!form.password) locales.password = 'La contraseña es obligatoria';
    setErrores(locales);
    setError('');
    if (Object.keys(locales).length) return;

    setEnviando(true);
    try {
      const usuario = await iniciarSesion(form.correo, form.password);
      limpiarAviso();
      const destino = state?.desde || (usuario.rol === 'admin' ? '/admin/productos' : '/');
      navegar(destino, { replace: true });
    } catch (err) {
      setErrores(err.erroresPorCampo || {});
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="auth">
      <div className="auth-panel">
        <h1>Iniciar sesión</h1>
        <p className="subtitulo">Accede para gestionar tus favoritos.</p>

        <Alerta tipo="info">{state?.motivo}</Alerta>
        <Alerta tipo="aviso" onCerrar={limpiarAviso}>{avisoSesion}</Alerta>
        {state?.registrado && <Alerta tipo="exito">Cuenta creada. Ya puedes iniciar sesión.</Alerta>}
        <Alerta onCerrar={() => setError('')}>{error}</Alerta>

        <form onSubmit={enviar} noValidate>
          <Campo etiqueta="Correo electrónico" id="correo" error={errores.correo}>
            <input id="correo" name="correo" type="email" autoComplete="email" value={form.correo} onChange={cambiar} />
          </Campo>
          <Campo etiqueta="Contraseña" id="password" error={errores.password}>
            <input id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={cambiar} />
          </Campo>
          <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <p className="auth-pie">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
      </div>
    </section>
  );
}
