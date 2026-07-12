// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SlideUpSheet } from "./SlideUpSheet";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const render = (node: ReactNode): { container: HTMLDivElement; root: Root } => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return { container, root };
};

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("SlideUpSheet accessibility", () => {
  it("exposes dialog semantics and restores focus on close", () => {
    vi.useFakeTimers();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

    const onRequestClose = vi.fn();
    const trigger = document.createElement("button");
    trigger.textContent = "Abrir panel";
    document.body.appendChild(trigger);
    trigger.focus();

    const { root } = render(
      <SlideUpSheet isOpen title="Nuevo movimiento" onRequestClose={onRequestClose}>
        <button type="button">Campo inicial</button>
      </SlideUpSheet>,
    );

    const dialog = document.querySelector<HTMLElement>("[role='dialog']");
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.getAttribute("aria-labelledby")).toBeTruthy();
    expect(document.activeElement?.textContent).toBe("Campo inicial");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      vi.runOnlyPendingTimers();
    });
    expect(onRequestClose).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
    expect(document.activeElement).toBe(trigger);
  });
});
