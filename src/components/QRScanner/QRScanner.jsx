import { useEffect, useId, useMemo, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

import "./QRScanner.scss";

const SCANNER_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
};

export default function QRScanner({ onScanSuccess }) {
  const reactId = useId();
  const readerId = useMemo(
    () => `qr-reader-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
    [reactId],
  );
  const handledScanRef = useRef(false);

  useEffect(() => {
    handledScanRef.current = false;
    const scanner = new Html5QrcodeScanner(readerId, SCANNER_CONFIG, false);

    scanner.render(
      (decodedText) => {
        if (handledScanRef.current) return;
        handledScanRef.current = true;

        scanner
          .clear()
          .catch(() => {})
          .finally(() => onScanSuccess(decodedText));
      },
      () => {},
    );

    return () => {
      handledScanRef.current = true;
      scanner.clear().catch(() => {});
    };
  }, [onScanSuccess, readerId]);

  return (
    <section className="qr-scanner" aria-label="Escaner de codigo QR">
      <div id={readerId} className="qr-scanner__reader" />
    </section>
  );
}
