import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export async function login(username, password) {
  const { data } = await axios.post(`${API_URL}/auth/token/`, {
    username,
    password,
  });

  sessionStorage.setItem("access_token", data.access);
  sessionStorage.setItem("refresh_token", data.refresh);

  return data;
}

export function logout() {
  sessionStorage.clear();
}
