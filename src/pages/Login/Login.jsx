import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { login } from "../../services/authService";
import "./Login.scss";

const ROUTES_BY_ROLE = {
  docente: "/docente",
  estudiante: "/estudiante",
  admin: "/admin",
};

const DEMO_ACCESS_CODE = process.env.REACT_APP_DEMO_ACCESS_CODE || "unisca159";
const DEMO_ACCESS_STORAGE_KEY = "unisca.demoAccessGranted";
const DEMO_ACCESS_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function getDemoUsers() {
  try {
    const demoUsers = JSON.parse(process.env.REACT_APP_DEMO_USERS || "[]");

    if (!Array.isArray(demoUsers)) return [];

    return demoUsers.filter(({ name, role, username, email, password }) =>
      [name, role, username, email, password].every(
        (value) => typeof value === "string" && value.trim(),
      ),
    );
  } catch {
    return [];
  }
}

function hasSavedDemoAccess() {
  try {
    const savedAccess = JSON.parse(
      window.localStorage.getItem(DEMO_ACCESS_STORAGE_KEY) || "null",
    );

    if (
      !savedAccess ||
      typeof savedAccess.expiresAt !== "number" ||
      savedAccess.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(DEMO_ACCESS_STORAGE_KEY);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function saveDemoAccessForMonth() {
  try {
    window.localStorage.setItem(
      DEMO_ACCESS_STORAGE_KEY,
      JSON.stringify({ expiresAt: Date.now() + DEMO_ACCESS_DURATION_MS }),
    );
  } catch {
    // The demo flow remains usable when browser storage is unavailable.
  }
}

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoModalState, setDemoModalState] = useState("closed");
  const [demoCode, setDemoCode] = useState("");
  const [demoCodeError, setDemoCodeError] = useState("");
  const demoTriggerRef = useRef(null);
  const demoCodeInputRef = useRef(null);
  const signInButtonRef = useRef(null);
  const demoModalRef = useRef(null);
  const demoUsers = getDemoUsers();

  const closeDemoModal = useCallback(() => {
    setDemoModalState("closed");
    setDemoCode("");
    setDemoCodeError("");
    window.requestAnimationFrame(() => demoTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (demoModalState === "closed") return undefined;

    const focusModalContent = window.requestAnimationFrame(() => {
      if (demoModalState === "code") {
        demoCodeInputRef.current?.focus();
        return;
      }

      const focusTarget =
        demoModalState === "confirm"
          ? ".login__demo-confirm-action"
          : ".login__demo-user";
      demoModalRef.current?.querySelector(focusTarget)?.focus();
    });

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDemoModal();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = demoModalRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const focusable = Array.from(focusableElements ?? []);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusModalContent);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [demoModalState, closeDemoModal]);

  function resetDemoModal() {
    setDemoModalState("closed");
    setDemoCode("");
    setDemoCodeError("");
  }

  function openDemoModal() {
    setDemoModalState(hasSavedDemoAccess() ? "unlocked" : "code");
    setDemoCode("");
    setDemoCodeError("");
  }

  function handleDemoCodeSubmit(event) {
    event.preventDefault();
    setDemoCodeError("");

    if (DEMO_ACCESS_CODE && demoCode === DEMO_ACCESS_CODE) {
      setDemoModalState("confirm");
      return;
    }

    setDemoCodeError("El código de acceso no es válido.");
  }

  function handleDemoAccessChoice(saveForMonth) {
    if (saveForMonth) saveDemoAccessForMonth();
    setDemoModalState("unlocked");
  }

  function applyDemoCredentials(demoUser) {
    setUsername(demoUser.username);
    setPassword(demoUser.password);
    setError("");
    resetDemoModal();
    window.requestAnimationFrame(() => signInButtonRef.current?.focus());
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      const { data } = await api.get("/usuarios/me/");
      setUser(data);
      navigate(ROUTES_BY_ROLE[data.rol] ?? "/", { replace: true });
    } catch {
      setPassword("");
      setError("Credenciales incorrectas. Verifica tu usuario y contrasena.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <button
        ref={demoTriggerRef}
        className="login__demo-trigger"
        type="button"
        aria-label="Información de cuentas de demostración"
        onClick={openDemoModal}
      >
        <span aria-hidden="true">i</span>
        Cuentas demo
      </button>

      <section className="login__intro" aria-label="UniSCA">
        <p className="login__eyebrow">Control de asistencia</p>
        <h1 className="login__title">UniSCA</h1>
        <p className="login__subtitle">
          Registro rapido para sesiones presenciales con QR y verificacion
          facial.
        </p>
      </section>

      <form className="login__form" onSubmit={handleSubmit}>
        <div>
          <p className="login__form-eyebrow">Acceso institucional</p>
          <h2>Ingresar</h2>
        </div>

        {error && <p className="login__error">{error}</p>}

        <label>
          Usuario
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoComplete="username"
            autoFocus
          />
        </label>

        <label>
          Contrasena
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        <button ref={signInButtonRef} type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      {demoModalState !== "closed" && (
        <div className="login__modal-backdrop">
          <section
            ref={demoModalRef}
            className="login__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
          >
            <button
              className="login__modal-close"
              type="button"
              aria-label="Cerrar información de cuentas de demostración"
              onClick={closeDemoModal}
            >
              ×
            </button>

            {demoModalState === "code" ? (
              <form onSubmit={handleDemoCodeSubmit}>
                <p className="login__form-eyebrow">Acceso para evaluación</p>
                <h2 id="demo-modal-title">Cuentas de demostración</h2>
                <p className="login__modal-description">
                  Ingresa el código proporcionado para consultar las cuentas de
                  demostración disponibles.
                </p>

                <label>
                  Código de acceso MVP
                  <input
                    ref={demoCodeInputRef}
                    type="password"
                    value={demoCode}
                    onChange={(event) => setDemoCode(event.target.value)}
                    aria-describedby={
                      demoCodeError ? "demo-code-error" : undefined
                    }
                    required
                  />
                </label>

                {demoCodeError && (
                  <p id="demo-code-error" className="login__error" role="alert">
                    {demoCodeError}
                  </p>
                )}

                <button type="submit">Ver cuentas</button>
              </form>
            ) : demoModalState === "confirm" ? (
              <div>
                <p className="login__form-eyebrow">Acceso confirmado</p>
                <h2 id="demo-modal-title">¿Cómo deseas continuar?</h2>
                <p className="login__modal-description">
                  Puedes usar el acceso solo esta vez o guardarlo por 30 días
                  para no ingresar el código MVP nuevamente.
                </p>

                <div className="login__demo-confirm-actions">
                  <button
                    className="login__demo-confirm-action"
                    type="button"
                    onClick={() => handleDemoAccessChoice(false)}
                  >
                    Usar solo esta vez
                  </button>
                  <button
                    className="login__demo-confirm-action"
                    type="button"
                    onClick={() => handleDemoAccessChoice(true)}
                  >
                    Guardar por 30 días
                  </button>
                </div>
                <p className="login__modal-hint">
                  El acceso guardado vence automáticamente después de 30 días.
                </p>
              </div>
            ) : (
              <div>
                <p className="login__form-eyebrow">Acceso para evaluación</p>
                <h2 id="demo-modal-title">Elige una cuenta de demostración</h2>
                <p className="login__modal-description">
                  Al elegir una cuenta, solo se completará el formulario. Luego
                  deberás seleccionar “Ingresar”. Los datos de demostración
                  pueden restablecerse.
                </p>

                {demoUsers.length ? (
                  <div className="login__demo-users">
                    {demoUsers.map((demoUser) => (
                      <button
                        key={demoUser.username}
                        className="login__demo-user"
                        type="button"
                        onClick={() => applyDemoCredentials(demoUser)}
                      >
                        <span className="login__demo-user-name">
                          {demoUser.name}
                        </span>
                        <span className="login__demo-user-role">
                          Rol: {demoUser.role}
                        </span>
                        <span>Usuario: {demoUser.username}</span>
                        <span>Correo: {demoUser.email}</span>
                        <span>Contraseña: {demoUser.password}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="login__modal-empty" role="status">
                    No hay cuentas de demostración disponibles actualmente.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
