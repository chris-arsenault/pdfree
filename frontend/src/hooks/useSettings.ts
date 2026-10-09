import { useSyncExternalStore } from "react";
import { protectedAutosaveDisabled, subscribeSettings } from "../services/settings";

export const useProtectedAutosaveDisabled = () =>
  useSyncExternalStore(subscribeSettings, protectedAutosaveDisabled);
