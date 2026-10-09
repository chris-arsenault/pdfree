import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/caveat/latin-400.css";
import App from "./App";
import { captureInstallPrompt } from "./services/offline";

captureInstallPrompt();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
