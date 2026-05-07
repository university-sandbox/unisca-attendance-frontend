import api from './api';

export const getCursos = () => api.get('/cursos/');

export const getSesiones = () => api.get('/sesiones/');

export const createSesion = (cursoId) =>
  api.post('/sesiones/', {
    curso: cursoId,
    activa: true,
  });

export const closeSesion = (id) =>
  api.patch(`/sesiones/${id}/`, {
    activa: false,
  });

export const getAsistencias = (sesionId) =>
  api.get(`/sesiones/${sesionId}/asistencias/`);
