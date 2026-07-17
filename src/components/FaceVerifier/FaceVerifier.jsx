import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

import { reportFaceVerificationDiagnostic } from "../../services/asistenciaService";
import { getFaceVerificationErrorMessage } from "../../utils/errors";
import "./FaceVerifier.scss";

const MODEL_URL = "/models";
const TIMEOUT_MS = 30000;
const POLL_INTERVAL_MS = 800;
const MATCH_THRESHOLD = 0.5;

function getErrorDetails(error) {
  return {
    error_name: String(error?.name || "Error").slice(0, 128),
    error_message: String(error?.message || error || "").slice(0, 500),
  };
}

function getOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

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
    let stage = "initializing";

    const reportDiagnostic = (event, details = {}) => {
      void reportFaceVerificationDiagnostic(event, { stage, ...details });
    };

    const stopCamera = () => {
      stream?.getTracks().forEach((track) => track.stop());
    };

    const finish = (verified, message, details = {}) => {
      if (completed) return;
      completed = true;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      stopCamera();
      setStatus(message);
      reportDiagnostic(
        verified ? "verification_succeeded" : "verification_failed",
        verified ? {} : { error_message: message, ...details },
      );

      if (verified) {
        onVerified();
        return;
      }

      onFailure?.(message);
    };

    async function runVerification() {
      reportDiagnostic("verification_started", {
        client_origin: window.location.origin,
        reference_image_origin: getOrigin(referenceImageUrl),
      });

      if (!referenceImageUrl) {
        finish(
          false,
          "No hay foto de perfil para realizar la verificacion facial.",
        );
        return;
      }

      stage = "loading_models";
      await ensureModelAssetsAvailable();

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      reportDiagnostic("models_loaded");

      setStatus("Cargando foto de referencia...");
      stage = "loading_reference_image";
      const referenceImage = await faceapi.fetchImage(referenceImageUrl);
      reportDiagnostic("reference_image_loaded");
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

      stage = "requesting_camera";
      stream = await getCameraStream();

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      reportDiagnostic("camera_started");
      stage = "matching_face";
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
      finish(
        false,
        getFaceVerificationErrorMessage(error),
        getErrorDetails(error),
      );
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
