import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alerta, Campo } from '../components/Ui';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Validación en el cliente (la API vuelve a validar todo: nunca se confía solo en el Front-End).
function validar({ nombre, correo, password, confirmar }) {
  const e = {};
  if (!nombre.trim()) e.nombre = 'El nombre es obligatorio';
  if (!correo.trim()) e.correo = 'El correo es obligatorio';
  else if (!REGEX_CORREO.test(correo.trim())) e.correo = 'El correo no tiene un formato válido';
  if (password.length < 8) e.password = 'La contraseña debe tener al menos 8 caracteres';
  else if (password.length > 72) e.password = 'La contraseña no puede superar 72 caracteres';
  if (confirmar !== password) e.confirmar = 'Las contraseñas no coinciden';
  return e;
}

export default function Registro() {
  const { registrarse } = useAuth();
  const navegar = useNavigate();
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrores((prev) => ({ ...prev, [e.target.name]: undefined })); // se limpia el error al corregir
  };

  const enviar = async (e) => {
    e.preventDefault();
    const locales = validar(form);
    setErrores(locales);
    setError('');
    if (Object.keys(locales).length) return;

    setEnviando(true);
    try {
      await registrarse({ nombre: form.nombre, correo: form.correo, password: form.password });
      navegar('/login', { state: { registrado: true, correo: form.correo.trim() } });
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
        <h1>Crear cuenta</h1>
        <p className="subtitulo">Las cuentas nuevas tienen rol <strong>usuario</strong>.</p>
        <Alerta onCerrar={() => setError('')}>{error}</Alerta>

        <form onSubmit={enviar} noValidate>
          <Campo etiqueta="Nombre" id="nombre" error={errores.nombre}>
            <input id="nombre" name="nombre" autoComplete="name" value={form.nombre} onChange={cambiar} />
          </Campo>
          <Campo etiqueta="Correo electrónico" id="correo" error={errores.correo}>
            <input id="correo" name="correo" type="email" autoComplete="email" value={form.correo} onChange={cambiar} />
          </Campo>
          <Campo etiqueta="Contraseña (mínimo 8 caracteres)" id="password" error={errores.password}>
            <input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={cambiar} />
          </Campo>
          <Campo etiqueta="Confirmar contraseña" id="confirmar" error={errores.confirmar}>
            <input id="confirmar" name="confirmar" type="password" autoComplete="new-password" value={form.confirmar} onChange={cambiar} />
          </Campo>
          <button type="submit" className="btn btn-primario btn-bloque" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Registrarme'}
          </button>
        </form>
        <p className="auth-pie">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </div>
    </section>
  );
}
