export function getApiErrorMessage(error, fallback = "Error inesperado.") {
  const data = error?.response?.data;

  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.error) return data.error;
  if (data.detail) return data.detail;

  const firstFieldError = Object.values(data).flat().find(Boolean);
  return firstFieldError || fallback;
}

export function getFaceVerificationErrorMessage(error) {
  const message = error?.message || String(error || "");

  if (message.includes("model") || message.includes("/models")) {
    return "No se encontraron los modelos de reconocimiento facial. Verifica que existan en frontend/public/models.";
  }

  if (
    message.includes("expected pattern") ||
    message.includes("fetchImage") ||
    message.includes("readAsDataURL")
  ) {
    return "No se pudo leer la foto de perfil. Actualiza la foto con una imagen valida e intenta nuevamente.";
  }

  if (message.includes("Permission") || message.includes("NotAllowedError")) {
    return "Permiso de camara denegado. Habilita la camara para registrar la asistencia.";
  }

  if (
    message.includes("NotFoundError") ||
    message.includes("Requested device")
  ) {
    return "No se encontro una camara disponible en este dispositivo.";
  }

  return `Error: ${message}`;
}
