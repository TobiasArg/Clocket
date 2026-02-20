import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { initializeThemeFromStorage } from "@/utils";
import "./globals.css";

initializeThemeFromStorage();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found.");
}

createRoot(rootElement).render(<App />);
