import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { login } from '../../services/authService';
import './Login.scss';

const ROUTES_BY_ROLE = {
  docente: '/docente',
  estudiante: '/estudiante',
  admin: '/admin',
};

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      const { data } = await api.get('/usuarios/me/');
      setUser(data);
      navigate(ROUTES_BY_ROLE[data.rol] ?? '/', { replace: true });
    } catch {
      setError('Credenciales incorrectas. Verifica tu usuario y contrasena.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <section className="login__intro" aria-label="UniSCA">
        <p className="login__eyebrow">Control de asistencia</p>
        <h1 className="login__title">UniSCA</h1>
        <p className="login__subtitle">
          Registro rapido para sesiones presenciales con QR y verificacion facial.
        </p>
      </section>

      <form className="login__form" onSubmit={handleSubmit}>
        <div>
          <p className="login__form-eyebrow">Acceso institucional</p>
          <h2>Ingresar</h2>
        </div>

        {error && <p className="login__error">{error}</p>}

        <label>
          Usuario
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoComplete="username"
          />
        </label>

        <label>
          Contrasena
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}
