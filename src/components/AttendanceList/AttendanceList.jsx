import './AttendanceList.scss';

function formatTime(timestamp) {
  if (!timestamp) return '--:--';

  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export default function AttendanceList({ asistencias = [] }) {
  return (
    <section className="attendance-list">
      <div className="attendance-list__header">
        <p className="attendance-list__eyebrow">Sesion cerrada</p>
        <h3 className="attendance-list__title">
          Asistencias registradas <span>{asistencias.length}</span>
        </h3>
      </div>

      {asistencias.length === 0 ? (
        <p className="attendance-list__empty">Aun no hay asistencias registradas.</p>
      ) : (
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
                          ? 'attendance-list__badge attendance-list__badge--verified'
                          : 'attendance-list__badge'
                      }
                    >
                      {asistencia.face_verified ? 'Verificado' : 'QR'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
