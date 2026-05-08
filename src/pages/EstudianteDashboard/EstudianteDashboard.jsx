import { useCallback, useState } from "react";

import FaceVerifier from "../../components/FaceVerifier";
import QRScanner from "../../components/QRScanner";
import { useAuth } from "../../context/AuthContext";
import { registrarAsistencia } from "../../services/asistenciaService";
import "./EstudianteDashboard.scss";

const STEPS = {
  SCAN: "scan",
  FACE: "face",
  DONE: "done",
  ERROR: "error",
};

export default function EstudianteDashboard() {
  const { user } = useAuth();
  const [step, setStep] = useState(STEPS.SCAN);
  const [qrToken, setQrToken] = useState(null);
  const [message, setMessage] = useState("");

  const handleQRScan = useCallback((token) => {
    setQrToken(token);
    setMessage("");
    setStep(STEPS.FACE);
  }, []);

  const handleFaceResult = useCallback(
    async (faceVerified) => {
      try {
        const { data } = await registrarAsistencia(qrToken, faceVerified);
        setMessage(`Asistencia registrada - metodo: ${data.metodo}`);
        setStep(STEPS.DONE);
      } catch (error) {
        setMessage(
          error.response?.data?.error || "Error al registrar asistencia.",
        );
        setStep(STEPS.ERROR);
      }
    },
    [qrToken],
  );

  function resetFlow() {
    setQrToken(null);
    setMessage("");
    setStep(STEPS.SCAN);
  }

  return (
    <main className="estudiante-dashboard">
      <header className="estudiante-dashboard__header">
        <p className="estudiante-dashboard__eyebrow">Registro del estudiante</p>
        <h1>Registrar asistencia</h1>
        <p>
          Escanea el QR de la sesion y confirma tu identidad desde este
          dispositivo.
        </p>
      </header>

      <div className="estudiante-dashboard__steps" aria-label="Progreso">
        <span className={step === STEPS.SCAN ? "is-active" : ""}>SCAN</span>
        <span className={step === STEPS.FACE ? "is-active" : ""}>FACE</span>
        <span
          className={
            step === STEPS.DONE || step === STEPS.ERROR ? "is-active" : ""
          }
        >
          DONE
        </span>
      </div>

      {step === STEPS.SCAN && (
        <section className="estudiante-dashboard__panel">
          <p className="estudiante-dashboard__instruction">
            Escanea el codigo QR de la sesion.
          </p>
          <QRScanner onScanSuccess={handleQRScan} />
        </section>
      )}

      {step === STEPS.FACE && (
        <section className="estudiante-dashboard__panel">
          <p className="estudiante-dashboard__instruction">
            Verificacion de identidad.
          </p>
          <FaceVerifier
            referenceImageUrl={user?.foto_perfil}
            onVerified={handleFaceResult}
          />
        </section>
      )}

      {(step === STEPS.DONE || step === STEPS.ERROR) && (
        <section className={`result result--${step}`}>
          <p className="result__label">
            {step === STEPS.DONE
              ? "Registro confirmado"
              : "Registro no completado"}
          </p>
          <p className="result__message">{message}</p>
          <button onClick={resetFlow}>Registrar otra asistencia</button>
        </section>
      )}
    </main>
  );
}
