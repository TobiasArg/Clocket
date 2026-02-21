import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { CurrencyProvider } from "@/context";
import { initializeThemeFromStorage } from "@/utils";
import "./globals.css";

initializeThemeFromStorage();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found.");
}

createRoot(rootElement).render(
  <CurrencyProvider>
    <App />
  </CurrencyProvider>,
);
