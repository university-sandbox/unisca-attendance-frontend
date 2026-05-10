import { extractQrToken } from "./qrToken";

test("returns a scanned UUID token", () => {
  expect(extractQrToken("11111111-1111-4111-8111-111111111111")).toBe(
    "11111111-1111-4111-8111-111111111111",
  );
});

test("extracts a UUID token embedded in a URL", () => {
  expect(
    extractQrToken(
      "https://unisca.test/asistencia?qr_token=22222222-2222-4222-8222-222222222221",
    ),
  ).toBe("22222222-2222-4222-8222-222222222221");
});

test("rejects scanned text without a UUID token", () => {
  expect(extractQrToken("codigo-no-valido")).toBeNull();
});
