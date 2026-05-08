import { useEffect, useMemo, useState } from 'react';

import AttendanceList from '../../components/AttendanceList';
import QRDisplay from '../../components/QRDisplay';
import { closeSesion, createSesion, getAsistencias, getCursos } from '../../services/sesionService';
import './DocenteDashboard.scss';

export default function DocenteDashboard() {
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState('');
  const [sesionActiva, setSesionActiva] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [error, setError] = useState('');
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    getCursos()
      .then(({ data }) => {
        if (!mounted) return;
        setCursos(data);
        setCursoId(data[0]?.id ? String(data[0].id) : '');
      })
      .catch(() => {
        if (mounted) setError('Error al cargar cursos.');
      })
      .finally(() => {
        if (mounted) setLoadingCursos(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedCurso = useMemo(
    () => cursos.find((curso) => String(curso.id) === String(cursoId)),
    [cursoId, cursos]
  );

  async function handleStart() {
    setError('');
    setAsistencias([]);
    setSubmitting(true);

    try {
      const { data } = await createSesion(cursoId);
      setSesionActiva(data);
    } catch {
      setError('Error al iniciar sesion.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose() {
    if (!sesionActiva) return;

    setError('');
    setSubmitting(true);

    try {
      await closeSesion(sesionActiva.id);
      const { data } = await getAsistencias(sesionActiva.id);
      setAsistencias(data);
      setSesionActiva(null);
    } catch {
      setError('Error al cerrar sesion.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="docente-dashboard">
      <header className="docente-dashboard__header">
        <div>
          <p className="docente-dashboard__eyebrow">Panel del docente</p>
          <h1>Sesion de clase</h1>
        </div>
        <div className="docente-dashboard__stat">
          <span>{asistencias.length}</span>
          asistencias
        </div>
      </header>

      {error && <p className="docente-dashboard__error">{error}</p>}

      {!sesionActiva ? (
        <section className="docente-dashboard__controls">
          <label>
            Curso
            <select
              value={cursoId}
              onChange={(event) => setCursoId(event.target.value)}
              disabled={loadingCursos || submitting}
            >
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.codigo} - {curso.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="docente-dashboard__course">
            <p>{selectedCurso?.codigo ?? 'Sin curso'}</p>
            <span>{selectedCurso?.nombre ?? 'No hay cursos disponibles.'}</span>
          </div>

          <button onClick={handleStart} disabled={!cursoId || loadingCursos || submitting}>
            {submitting ? 'Iniciando...' : 'Iniciar sesion de clase'}
          </button>
        </section>
      ) : (
        <section className="docente-dashboard__session">
          <div className="docente-dashboard__session-copy">
            <p className="docente-dashboard__eyebrow">Proyectar en aula</p>
            <h2>{selectedCurso?.nombre ?? 'Sesion activa'}</h2>
            <p>El codigo queda activo hasta cerrar la sesion y consultar el listado final.</p>
            <button
              className="docente-dashboard__close-btn"
              onClick={handleClose}
              disabled={submitting}
            >
              {submitting ? 'Volviendo...' : 'Volver al panel'}
            </button>
          </div>
          <QRDisplay token={String(sesionActiva.qr_token)} />
        </section>
      )}

      {asistencias.length > 0 && <AttendanceList asistencias={asistencias} />}
    </main>
  );
}
