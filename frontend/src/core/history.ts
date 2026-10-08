import { type EditorDocument } from "./model";
export type History = {
  past: EditorDocument[];
  present: EditorDocument;
  future: EditorDocument[];
  revision: number;
};
export type Action =
  { type: "commit" | "reset"; document: EditorDocument } | { type: "undo" | "redo" };
export function historyReducer(state: History, action: Action): History {
  if (action.type === "reset")
    return { past: [], present: action.document, future: [], revision: state.revision + 1 };
  if (action.type === "commit") {
    if (action.document === state.present) return state;
    return {
      past: [...state.past.slice(-49), state.present],
      present: action.document,
      future: [],
      revision: state.revision + 1,
    };
  }
  if (action.type === "undo" && state.past.length)
    return {
      past: state.past.slice(0, -1),
      present: state.past.at(-1)!,
      future: [state.present, ...state.future],
      revision: state.revision + 1,
    };
  if (action.type === "redo" && state.future.length)
    return {
      past: [...state.past, state.present],
      present: state.future[0],
      future: state.future.slice(1),
      revision: state.revision + 1,
    };
  return state;
}
