const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function findUuid(value) {
  return value.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  )?.[0];
}

export function extractQrToken(decodedText) {
  const value = String(decodedText ?? "").trim();

  if (!value) return null;
  if (UUID_PATTERN.test(value)) return value.toLowerCase();

  const embeddedUuid = findUuid(value);
  if (embeddedUuid) return embeddedUuid.toLowerCase();

  return null;
}
