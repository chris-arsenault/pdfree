import { DraftStatus } from "./DraftStatus";
import { OfflineStatus } from "./OfflineStatus";

/** Status only: save state, offline installation and available updates. */
export function Footer() {
  return (
    <footer className="app-footer">
      <DraftStatus />
      <OfflineStatus />
    </footer>
  );
}
