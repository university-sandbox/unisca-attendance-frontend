import api from "./api";

export const updateProfile = (profile) => api.patch("/usuarios/me/", profile);

export const updateProfilePhoto = (file) => {
  const formData = new FormData();
  formData.append("foto_perfil_upload", file);

  return api.patch("/usuarios/me/", formData);
};
