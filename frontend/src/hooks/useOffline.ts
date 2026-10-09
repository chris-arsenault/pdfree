import { useCallback, useEffect, useRef, useState } from "react";
import {
  canInstallApp,
  enableOffline,
  installApp,
  keepOfflineCopy,
  offlineChosen,
  offlineCopyKept,
  offlineSize,
  offlineSupported,
  onInstallChange,
  precachedFiles,
  removeOffline,
  type OfflineSize,
} from "../services/offline";

/** "off" is the default: the app loads from the network and nothing is precached. */
export type OfflineMode = "unsupported" | "off" | "saving" | "on";
const unavailable = "Offline installation is unavailable in this browser.";

export function useOffline() {
  const [mode, setMode] = useState<OfflineMode>(() => (offlineSupported() ? "off" : "unsupported"));
  const [size, setSize] = useState<OfflineSize | null>(null);
  const [stored, setStored] = useState(0);
  const [kept, setKept] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [installable, setInstallable] = useState(canInstallApp);
  const update = useRef<(reloadPage?: boolean) => Promise<void>>(async () => {});
  const enable = useCallback(async (askToKeep: boolean) => {
    setMode("saving");
    setError("");
    const poll = window.setInterval(() => {
      precachedFiles()
        .then(setStored)
        .catch(() => {});
    }, 500);
    try {
      update.current = await enableOffline({
        onNeedRefresh: () => setWaiting(true),
        onRegisterError: () => setError(unavailable),
      });
      setStored(await precachedFiles());
      setMode("on");
      // Firefox asks the user before keeping storage; the copy already works meanwhile.
      (askToKeep ? keepOfflineCopy() : offlineCopyKept()).then(setKept).catch(() => {});
    } catch {
      setError(unavailable);
      setMode("off");
    } finally {
      window.clearInterval(poll);
    }
  }, []);
  useEffect(() => {
    if (!offlineSupported()) return;
    let active = true;
    offlineSize().then((value) => active && setSize(value));
    offlineChosen().then((chosen) => {
      if (active && chosen) return enable(false);
    });
    const stop = onInstallChange(() => setInstallable(canInstallApp()));
    return () => {
      active = false;
      stop();
    };
  }, [enable]);
  return {
    mode,
    size,
    /** Share of the offline copy stored so far, 0–1, or null when the size is unknown. */
    progress: size ? Math.min(1, stored / size.files) : null,
    kept,
    waiting,
    error,
    setError,
    installable,
    enable: () => {
      enable(true).catch(() => setError(unavailable));
    },
    remove: () =>
      removeOffline()
        .then(() => {
          setWaiting(false);
          setStored(0);
          setMode("off");
        })
        .catch(() => setError("The offline copy could not be removed. Try again.")),
    install: () => {
      // Installing implies offline use: an installed app must open without a connection.
      installApp()
        .then((installed) => (installed && mode === "off" ? enable(true) : undefined))
        .catch(() => setError(unavailable));
    },
    update: (reload: boolean) => update.current(reload),
  };
}
