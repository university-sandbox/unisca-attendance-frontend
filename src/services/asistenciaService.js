import api from "./api";

export const registrarAsistencia = (qrToken, faceVerified) =>
  api.post("/asistencias/", {
    qr_token: qrToken,
    face_verified: faceVerified,
  });

export function reportFaceVerificationDiagnostic(event, details = {}) {
  return api
    .post("/asistencias/face-verification-diagnostics/", { event, ...details })
    .catch(() => {});
}
