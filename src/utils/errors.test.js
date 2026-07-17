import { getApiErrorMessage, getFaceVerificationErrorMessage } from "./errors";

test("reads serializer field errors from API responses", () => {
  const error = {
    response: {
      data: {
        qr_token: ["Must be a valid UUID."],
      },
    },
  };

  expect(getApiErrorMessage(error)).toBe("Must be a valid UUID.");
});

test("maps opaque browser face image errors to actionable copy", () => {
  const error = new Error("The string did not match the expected pattern");

  expect(getFaceVerificationErrorMessage(error)).toBe(
    "No se pudo leer la foto de perfil. Actualiza la foto con una imagen valida e intenta nuevamente.",
  );
});

test("explains when the model URL returns the application HTML", () => {
  const error = new Error(
    "Invalid face-api model manifest at /models: expected JSON, received text/html",
  );

  expect(getFaceVerificationErrorMessage(error)).toBe(
    "Los modelos de reconocimiento facial no se sirvieron correctamente. Vuelve a desplegar el frontend e intenta nuevamente.",
  );
});
