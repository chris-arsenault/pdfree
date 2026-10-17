import { DraftStatus } from "./DraftStatus";
import { OfflineStatus } from "./OfflineStatus";
import { LanguagePicker } from "./LanguagePicker";

/** Save state and browser-local offline/language preferences. */
export function Footer() {
  return (
    <footer className="app-footer">
      <DraftStatus />
      <div className="footer-controls">
        <OfflineStatus />
        <LanguagePicker />
      </div>
    </footer>
  );
}
