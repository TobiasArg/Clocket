// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BottomNavigation } from "./BottomNavigation";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const render = (node: ReactNode): { root: Root } => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { root };
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("BottomNavigation accessibility", () => {
  it("exposes navigation semantics and current page state", () => {
    window.history.replaceState(null, "", "/transactions");

    render(
      <BottomNavigation
        items={[
          { label: "Inicio", icon: "house", to: "/home" },
          { label: "Transacciones", icon: "receipt", to: "/transactions" },
        ]}
      />,
    );

    expect(document.querySelector("nav[aria-label='Navegación principal']")).not.toBeNull();
    const activeLink = document.querySelector<HTMLAnchorElement>("a[aria-current='page']");
    expect(activeLink?.textContent).toContain("Transacciones");
  });
});
