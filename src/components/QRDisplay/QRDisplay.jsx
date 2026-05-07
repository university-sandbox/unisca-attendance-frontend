import { QRCodeSVG } from 'qrcode.react';

import './QRDisplay.scss';

export default function QRDisplay({ token }) {
  if (!token) {
    return (
      <section className="qr-display qr-display--empty" aria-live="polite">
        <p className="qr-display__label">Sin sesion activa</p>
        <p className="qr-display__hint">Inicie una sesion para generar el codigo QR.</p>
      </section>
    );
  }

  return (
    <section className="qr-display" aria-label="Codigo QR de sesion activa">
      <p className="qr-display__eyebrow">Sesion activa</p>
      <div className="qr-display__code" aria-hidden="true">
        <QRCodeSVG value={token} size={256} level="H" bgColor="#ffffff" fgColor="#0a0a0a" />
      </div>
      <p className="qr-display__label">Codigo de asistencia</p>
      <p className="qr-display__token">{token}</p>
    </section>
  );
}
