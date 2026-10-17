import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/caveat/latin-400.css";
import App from "./App";
import { captureInstallPrompt } from "./services/offline";
import { startLocalePreferences } from "./i18n/runtime";

captureInstallPrompt();

startLocalePreferences().ready.then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
