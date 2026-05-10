import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

import { getFaceVerificationErrorMessage } from "../../utils/errors";
import "./FaceVerifier.scss";

const MODEL_URL = "/models";
const TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 800;
const MATCH_THRESHOLD = 0.5;

async function ensureModelAssetsAvailable() {
  const response = await fetch(
    `${MODEL_URL}/ssd_mobilenetv1_model-weights_manifest.json`,
  );

  if (!response.ok) {
    throw new Error(`Missing face-api model assets at ${MODEL_URL}`);
  }
}

async function getCameraStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
  } catch (error) {
    if (!error?.name?.includes("Overconstrained")) throw error;

    return navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  }
}

export default function FaceVerifier({
  referenceImageUrl,
  onVerified,
  onFailure,
}) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Cargando modelos de reconocimiento...");

  useEffect(() => {
    let stream;
    let intervalId;
    let timeoutId;
    let completed = false;

    const stopCamera = () => {
      stream?.getTracks().forEach((track) => track.stop());
    };

    const finish = (verified, message) => {
      if (completed) return;
      completed = true;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      stopCamera();
      setStatus(message);

      if (verified) {
        onVerified();
        return;
      }

      onFailure?.(message);
    };

    async function runVerification() {
      if (!referenceImageUrl) {
        finish(
          false,
          "No hay foto de perfil para realizar la verificacion facial.",
        );
        return;
      }

      await ensureModelAssetsAvailable();

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      setStatus("Cargando foto de referencia...");
      const referenceImage = await faceapi.fetchImage(referenceImageUrl);
      const referenceDetection = await faceapi
        .detectSingleFace(referenceImage)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!referenceDetection) {
        finish(false, "No se encontro rostro en la foto de perfil.");
        return;
      }

      const labeledDescriptor = new faceapi.LabeledFaceDescriptors("perfil", [
        referenceDetection.descriptor,
      ]);
      const matcher = new faceapi.FaceMatcher(
        labeledDescriptor,
        MATCH_THRESHOLD,
      );

      stream = await getCameraStream();

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStatus("Mire a la camara para verificar su identidad...");

      timeoutId = setTimeout(() => {
        finish(false, "Tiempo agotado. No se registro la asistencia.");
      }, TIMEOUT_MS);

      intervalId = setInterval(async () => {
        if (completed || !videoRef.current) return;

        const detection = await faceapi
          .detectSingleFace(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) return;

        const match = matcher.findBestMatch(detection.descriptor);
        if (match.label !== "unknown") {
          finish(true, "Identidad verificada correctamente.");
        }
      }, POLL_INTERVAL_MS);
    }

    runVerification().catch((error) => {
      finish(false, getFaceVerificationErrorMessage(error));
    });

    return () => {
      completed = true;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      stopCamera();
    };
  }, [referenceImageUrl, onFailure, onVerified]);

  return (
    <section className="face-verifier" aria-live="polite">
      <p className="face-verifier__status">{status}</p>
      <div className="face-verifier__video-shell">
        <video
          ref={videoRef}
          className="face-verifier__video"
          muted
          playsInline
        />
      </div>
    </section>
  );
}
