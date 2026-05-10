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
