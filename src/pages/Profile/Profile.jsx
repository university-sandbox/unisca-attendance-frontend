import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import {
  updateProfile,
  updateProfilePhoto,
} from "../../services/usuarioService";
import "./Profile.scss";

function formatDate(value) {
  if (!value) return "Disponible ahora";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorMessage(error) {
  const data = error.response?.data;

  if (!data) return "No se pudo actualizar el perfil.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;

  const firstError = Object.values(data).flat().find(Boolean);
  return firstError || "No se pudo actualizar el perfil.";
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    departamento: user?.departamento ?? "",
    carrera: user?.carrera ?? "",
    ciclo: user?.ciclo ?? "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);

  const photoPreview = useMemo(() => {
    if (!photoFile) return user?.foto_perfil;

    return URL.createObjectURL(photoFile);
  }, [photoFile, user?.foto_perfil]);

  useEffect(() => {
    if (!photoFile || !photoPreview) return undefined;

    return () => URL.revokeObjectURL(photoPreview);
  }, [photoFile, photoPreview]);

  function updateField(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
      };

      if (user.rol === "docente") {
        payload.departamento = profile.departamento;
      }

      if (user.rol === "estudiante") {
        payload.carrera = profile.carrera;
        payload.ciclo = Number(profile.ciclo);
      }

      const { data } = await updateProfile(payload);
      setUser(data);
      setMessage("Perfil actualizado correctamente.");
    } catch (profileError) {
      setError(getErrorMessage(profileError));
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!photoFile) {
      setError("Selecciona una foto antes de continuar.");
      return;
    }

    setPhotoModalOpen(true);
  }

  async function confirmPhotoUpload() {
    setPhotoSaving(true);
    setMessage("");
    setError("");

    try {
      const { data } = await updateProfilePhoto(photoFile);
      setUser(data);
      setPhotoFile(null);
      setPhotoModalOpen(false);
      setMessage("Foto de perfil actualizada correctamente.");
    } catch (photoError) {
      setError(getErrorMessage(photoError));
    } finally {
      setPhotoSaving(false);
    }
  }

  return (
    <main className="profile-page">
      <header className="profile-page__header">
        <p className="profile-page__eyebrow">Mi cuenta</p>
        <h1>Perfil de usuario</h1>
        <p>
          Revisa tus datos y actualiza la informacion permitida de tu cuenta.
        </p>
      </header>

      {(message || error) && (
        <p
          className={`profile-page__alert ${
            error ? "profile-page__alert--error" : ""
          }`}
        >
          {error || message}
        </p>
      )}

      <section className="profile-card">
        <div className="profile-card__identity">
          <div className="profile-card__avatar">
            {user?.foto_perfil ? (
              <img src={user.foto_perfil} alt="Foto de perfil" />
            ) : (
              <span>
                {user?.first_name?.charAt(0) || user?.username?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="profile-card__name">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="profile-card__meta">{user?.username}</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleProfileSubmit}>
          <label>
            Usuario
            <input value={user?.username ?? ""} disabled />
          </label>

          <label>
            Rol
            <input value={user?.rol ?? ""} disabled />
          </label>

          <label>
            Nombres
            <input
              name="first_name"
              value={profile.first_name}
              onChange={updateField}
            />
          </label>

          <label>
            Apellidos
            <input
              name="last_name"
              value={profile.last_name}
              onChange={updateField}
            />
          </label>

          <label>
            Correo
            <input
              name="email"
              type="email"
              value={profile.email}
              onChange={updateField}
            />
          </label>

          {user?.rol === "docente" && (
            <>
              <label>
                Codigo docente
                <input value={user?.codigo_docente ?? ""} disabled />
              </label>
              <label>
                Departamento
                <input
                  name="departamento"
                  value={profile.departamento}
                  onChange={updateField}
                />
              </label>
            </>
          )}

          {user?.rol === "estudiante" && (
            <>
              <label>
                Codigo estudiante
                <input value={user?.codigo_estudiante ?? ""} disabled />
              </label>
              <label>
                Carrera
                <input
                  name="carrera"
                  value={profile.carrera}
                  onChange={updateField}
                />
              </label>
              <label>
                Ciclo
                <input
                  name="ciclo"
                  type="number"
                  min="1"
                  value={profile.ciclo}
                  onChange={updateField}
                />
              </label>
            </>
          )}

          <button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </section>

      {user?.rol === "estudiante" && (
        <section className="profile-card profile-card--photo">
          <div>
            <p className="profile-card__section-title">Foto de perfil</p>
            <p className="profile-card__hint">
              Proximo cambio disponible:{" "}
              {formatDate(user?.foto_perfil_next_update_at)}
            </p>
          </div>

          <form className="photo-form" onSubmit={handlePhotoSubmit}>
            <div className="photo-form__preview">
              {photoPreview ? (
                <img src={photoPreview} alt="Vista previa de perfil" />
              ) : (
                <span>Sin foto</span>
              )}
            </div>
            <label>
              Nueva foto
              <input
                type="file"
                accept="image/*"
                disabled={!user?.foto_perfil_can_update}
                onChange={(event) => setPhotoFile(event.target.files?.[0])}
              />
            </label>
            <button
              type="submit"
              disabled={!user?.foto_perfil_can_update || photoSaving}
            >
              Actualizar foto
            </button>
          </form>
        </section>
      )}

      {photoModalOpen && (
        <div className="profile-modal" role="dialog" aria-modal="true">
          <div className="profile-modal__content">
            <p className="profile-modal__title">Confirmar cambio de foto</p>
            <p>
              Al actualizar tu foto de perfil, no podras cambiarla nuevamente
              durante 5 meses. Este control ayuda a mantener una verificacion
              facial consistente para tus asistencias.
            </p>
            <div className="profile-modal__actions">
              <button
                type="button"
                className="profile-modal__secondary"
                onClick={() => setPhotoModalOpen(false)}
                disabled={photoSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmPhotoUpload}
                disabled={photoSaving}
              >
                {photoSaving ? "Subiendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
