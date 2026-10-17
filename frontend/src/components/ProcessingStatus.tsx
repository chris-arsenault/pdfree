import { text as tr } from "../i18n/runtime";
import { type useProcessing } from "../hooks/useProcessing";
export function ProcessingStatus({ task }: { task: ReturnType<typeof useProcessing> }) {
  return (
    <>
      {task.busy && (
        <div className="processing-status" role="status">
          <span className="spinner" />
          {task.message}
          <button className="button secondary" onClick={task.cancel}>
            {tr("common.cancel")}
          </button>
        </div>
      )}
      {task.error && (
        <p className="inline-warning" role="alert">
          {task.error}
        </p>
      )}
    </>
  );
}
