import { useState } from "react";
import {
  type BatchOptions,
  type BatchOutput,
  batchUtilities,
  batchArchive,
} from "../services/batchUtilities";
import { useEditor } from "../hooks/editorContext";
import { useProcessing } from "../hooks/useProcessing";
import { download } from "../services/resources";
import { Modal } from "./Modal";
import { RuleFields } from "./RuleFields";
import { newRule } from "./RepeatedDialog";
import { ProcessingStatus } from "./ProcessingStatus";
export function BatchDialog() {
  const editor = useEditor(),
    task = useProcessing(),
    [files, setFiles] = useState<File[]>([]),
    [outputs, setOutputs] = useState<BatchOutput[]>([]);
  const [options, setOptions] = useState<BatchOptions>(() => ({
    operation: "rule",
    rule: newRule(),
    continuing: false,
    compression: { preset: "balanced", targetBytes: 0 },
  }));
  const run = () => {
    setOutputs([]);
    const receive = (result: BatchOutput) => setOutputs((previous) => [...previous, result]);
    task.run(
      (signal, progress) => batchUtilities(files, options, signal, progress, receive),
      () => {}
    );
  };
  return (
    <Modal
      title="Process multiple PDFs"
      onClose={() => {
        task.cancel();
        editor.setDialog("");
      }}
    >
      <p className="field-note">
        Files are processed one at a time on this device. Successful outputs remain available if
        another file fails or you cancel. Open protected documents individually to unlock them
        first.
      </p>
      <fieldset className="utility-fields" disabled={task.busy}>
        <label>
          PDF files
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={(event) => {
              setFiles(Array.from(event.target.files ?? []));
              setOutputs([]);
            }}
          />
        </label>
        <BatchFields options={options} setOptions={setOptions} />
      </fieldset>
      <ProcessingStatus task={task} />
      <BatchOutputs outputs={outputs} />
      <div className="modal-actions">
        <button
          className="button secondary"
          disabled={task.busy || !outputs.some((output) => output.bytes)}
          onClick={() => download(batchArchive(outputs), "processed-pdfs.zip", "application/zip")}
        >
          Download ZIP
        </button>
        <button className="button primary" disabled={task.busy || !files.length} onClick={run}>
          Process {files.length} file(s)
        </button>
      </div>
    </Modal>
  );
}
function BatchFields({
  options,
  setOptions,
}: {
  options: BatchOptions;
  setOptions: (options: BatchOptions) => void;
}) {
  return (
    <>
      <label>
        Operation
        <select
          value={options.operation}
          onChange={(event) =>
            setOptions({ ...options, operation: event.target.value as BatchOptions["operation"] })
          }
        >
          <option value="rule">Numbering, watermark or stamp</option>
          <option value="ocr">Recognize scanned text</option>
          <option value="compress">Compress images</option>
        </select>
      </label>
      {options.operation === "rule" && (
        <>
          <RuleFields rule={options.rule} onChange={(rule) => setOptions({ ...options, rule })} />
          {options.rule.kind === "number" && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.continuing}
                onChange={(event) => setOptions({ ...options, continuing: event.target.checked })}
              />
              Continue numbering across successful files
            </label>
          )}
        </>
      )}
      {options.operation === "compress" && (
        <label>
          Image quality
          <select
            value={options.compression.preset}
            onChange={(event) =>
              setOptions({
                ...options,
                compression: {
                  ...options.compression,
                  preset: event.target.value as BatchOptions["compression"]["preset"],
                },
              })
            }
          >
            <option value="screen">Screen</option>
            <option value="balanced">Balanced</option>
            <option value="print">Print</option>
          </select>
        </label>
      )}
    </>
  );
}
function BatchOutputs({ outputs }: { outputs: BatchOutput[] }) {
  return (
    <>
      {outputs.map((output) => (
        <div className="batch-output" key={output.name}>
          <span>{output.name}</span>
          {output.bytes ? (
            <button
              className="button secondary"
              onClick={() => download(output.bytes!, output.name, "application/pdf")}
            >
              Download
            </button>
          ) : (
            <p role="status">{output.error}</p>
          )}
        </div>
      ))}
    </>
  );
}
