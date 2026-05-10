import { useEffect, useMemo, useState } from "react";

import { getCursoAsistencias } from "../../services/sesionService";
import "./AttendanceList.scss";

const PAGE_SIZE = 10;

function formatTime(timestamp) {
  if (!timestamp) return "--:--";

  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getTodayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 10);
}

export default function AttendanceList({
  cursoId,
  refreshKey = 0,
  onTotalChange,
}) {
  const [fecha, setFecha] = useState(getTodayInputValue);
  const [page, setPage] = useState(1);
  const [asistencias, setAsistencias] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  useEffect(() => {
    if (!cursoId || !fecha) {
      setAsistencias([]);
      setTotal(0);
      onTotalChange?.(0);
      return undefined;
    }

    let mounted = true;

    setLoading(true);
    setError("");

    getCursoAsistencias(cursoId, { fecha, page, pageSize: PAGE_SIZE })
      .then(({ data }) => {
        if (!mounted) return;
        setAsistencias(data.results ?? []);
        setTotal(data.count ?? 0);
        onTotalChange?.(data.count ?? 0);
      })
      .catch(() => {
        if (!mounted) return;
        setAsistencias([]);
        setTotal(0);
        setError("No se pudo cargar la asistencia de la fecha seleccionada.");
        onTotalChange?.(0);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [cursoId, fecha, page, refreshKey, onTotalChange]);

  return (
    <section className="attendance-list">
      <div className="attendance-list__header">
        <div>
          <p className="attendance-list__eyebrow">Registro por dia</p>
          <h3 className="attendance-list__title">
            Asistencias registradas <span>{total}</span>
          </h3>
        </div>

        <label className="attendance-list__date">
          Fecha
          <input
            type="date"
            value={fecha}
            onChange={(event) => {
              setPage(1);
              setFecha(event.target.value);
            }}
          />
        </label>
      </div>

      {error && <p className="attendance-list__error">{error}</p>}

      {loading ? (
        <p className="attendance-list__empty">Cargando asistencias...</p>
      ) : asistencias.length === 0 ? (
        <p className="attendance-list__empty">
          No hay registros de asistencia para este dia.
        </p>
      ) : (
        <>
          <div className="attendance-list__table-wrap">
            <table className="attendance-list__table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Hora</th>
                  <th>Metodo</th>
                  <th>Facial</th>
                </tr>
              </thead>
              <tbody>
                {asistencias.map((asistencia) => (
                  <tr key={asistencia.id}>
                    <td>{asistencia.estudiante_codigo}</td>
                    <td>{asistencia.estudiante_nombre}</td>
                    <td>{formatTime(asistencia.timestamp_registro)}</td>
                    <td>{asistencia.metodo}</td>
                    <td>
                      <span
                        className={
                          asistencia.face_verified
                            ? "attendance-list__badge attendance-list__badge--verified"
                            : "attendance-list__badge"
                        }
                      >
                        {asistencia.face_verified ? "Verificado" : "QR"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="attendance-list__pagination">
            <button
              type="button"
              onClick={() => setPage((currentPage) => currentPage - 1)}
              disabled={page === 1}
            >
              Anterior
            </button>
            <span>
              Pagina {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={page >= totalPages}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </section>
  );
}
