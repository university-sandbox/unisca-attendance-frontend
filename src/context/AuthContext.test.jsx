import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { AuthProvider } from "./AuthContext";

test("renders children when there is no stored session", async () => {
  sessionStorage.clear();

  render(
    <AuthProvider>
      <span>Ready</span>
    </AuthProvider>,
  );

  expect(await screen.findByText("Ready")).toBeInTheDocument();
});
