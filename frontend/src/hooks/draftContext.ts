import { createContext } from "react";
import { type useDraftState } from "./useDraft";
export const DraftContext = createContext<ReturnType<typeof useDraftState> | null>(null);
