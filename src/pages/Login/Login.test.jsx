import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Login from "./Login";
import { login } from "../../services/authService";

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ setUser: jest.fn() }),
}));

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock("../../services/authService", () => ({ login: jest.fn() }));

const DEMO_USERS = JSON.stringify([
  {
    name: "Ana Torres Salazar",
    role: "Docente",
    username: "docente.ana",
    email: "ana.torres@unisca.edu.pe",
    password: "Demo12345!",
  },
]);

beforeEach(() => {
  process.env.REACT_APP_DEMO_USERS = DEMO_USERS;
  window.sessionStorage.clear();
  window.localStorage.clear();
});

afterEach(() => {
  delete process.env.REACT_APP_DEMO_USERS;
  window.sessionStorage.clear();
  window.localStorage.clear();
});

function renderLogin() {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Login />
    </MemoryRouter>,
  );
}

test("requires the access code before displaying demo accounts", async () => {
  renderLogin();

  await userEvent.click(
    screen.getByRole("button", {
      name: "Información de cuentas de demostración",
    }),
  );
  await userEvent.type(
    screen.getByLabelText("Código de acceso MVP"),
    "incorrecto",
  );
  await userEvent.click(screen.getByRole("button", { name: "Ver cuentas" }));

  expect(screen.getByRole("alert")).toHaveTextContent(
    "El código de acceso no es válido.",
  );
  expect(
    screen.queryByRole("button", { name: /Ana Torres Salazar/ }),
  ).not.toBeInTheDocument();
});

test("autofills a demo account without authenticating", async () => {
  renderLogin();

  await userEvent.click(
    screen.getByRole("button", {
      name: "Información de cuentas de demostración",
    }),
  );
  await userEvent.type(
    screen.getByLabelText("Código de acceso MVP"),
    "unisca159",
  );
  await userEvent.click(screen.getByRole("button", { name: "Ver cuentas" }));
  await userEvent.click(
    screen.getByRole("button", { name: "Usar solo esta vez" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: /Ana Torres Salazar/ }),
  );

  expect(screen.getByLabelText("Usuario")).toHaveValue("docente.ana");
  expect(screen.getByLabelText("Contrasena")).toHaveValue("Demo12345!");
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Ingresar" })).toHaveFocus();
  });
  expect(login).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("dialog", { name: /Cuentas de demostración/ }),
  ).not.toBeInTheDocument();
});

test("shows an empty state when demo users are not configured", async () => {
  delete process.env.REACT_APP_DEMO_USERS;
  renderLogin();

  await userEvent.click(
    screen.getByRole("button", {
      name: "Información de cuentas de demostración",
    }),
  );
  await userEvent.type(
    screen.getByLabelText("Código de acceso MVP"),
    "unisca159",
  );
  await userEvent.click(screen.getByRole("button", { name: "Ver cuentas" }));
  await userEvent.click(
    screen.getByRole("button", { name: "Usar solo esta vez" }),
  );

  expect(screen.getByRole("status")).toHaveTextContent(
    "No hay cuentas de demostración disponibles actualmente.",
  );
});

test("requests the MVP code again when access is used only once", async () => {
  renderLogin();

  await userEvent.click(
    screen.getByRole("button", {
      name: "Información de cuentas de demostración",
    }),
  );
  await userEvent.type(
    screen.getByLabelText("Código de acceso MVP"),
    "unisca159",
  );
  await userEvent.click(screen.getByRole("button", { name: "Ver cuentas" }));
  await userEvent.click(
    screen.getByRole("button", { name: "Usar solo esta vez" }),
  );
  await userEvent.click(
    screen.getByLabelText("Cerrar información de cuentas de demostración"),
  );
  await userEvent.click(
    screen.getByRole("button", {
      name: "Información de cuentas de demostración",
    }),
  );

  expect(screen.getByLabelText("Código de acceso MVP")).toBeInTheDocument();
});

test("keeps MVP access available for 30 days when saved", async () => {
  renderLogin();

  await userEvent.click(
    screen.getByRole("button", {
      name: "Información de cuentas de demostración",
    }),
  );
  await userEvent.type(
    screen.getByLabelText("Código de acceso MVP"),
    "unisca159",
  );
  await userEvent.click(screen.getByRole("button", { name: "Ver cuentas" }));
  await userEvent.click(
    screen.getByRole("button", { name: "Guardar por 30 días" }),
  );
  const savedAccess = JSON.parse(
    window.localStorage.getItem("unisca.demoAccessGranted"),
  );
  expect(savedAccess.expiresAt).toBeGreaterThan(
    Date.now() + 29 * 24 * 60 * 60 * 1000,
  );
  await userEvent.click(
    screen.getByLabelText("Cerrar información de cuentas de demostración"),
  );
  await userEvent.click(
    screen.getByRole("button", {
      name: "Información de cuentas de demostración",
    }),
  );

  expect(
    screen.queryByLabelText("Código de acceso MVP"),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Ana Torres Salazar/ }),
  ).toBeInTheDocument();
});

test("requires the MVP code again after saved access expires", async () => {
  window.localStorage.setItem(
    "unisca.demoAccessGranted",
    JSON.stringify({ expiresAt: Date.now() - 1 }),
  );
  renderLogin();

  await userEvent.click(
    screen.getByRole("button", {
      name: "Información de cuentas de demostración",
    }),
  );

  expect(screen.getByLabelText("Código de acceso MVP")).toBeInTheDocument();
  expect(window.localStorage.getItem("unisca.demoAccessGranted")).toBeNull();
});
