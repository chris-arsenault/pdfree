import { message } from "../i18n/messages";
import { text as tr } from "../i18n/runtime";
import { useEditor } from "../hooks/editorContext";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { Modal } from "./Modal";
import { useId, useState } from "react";
import { documentNameError, editorLimits } from "../core/editorValidation";
import { useMessages } from "../i18n/react";
import { warningKeys, structureKeys } from "../i18n/diagnostics";
import { formatList, formatNumber } from "../i18n/format";
export function DocumentDialog() {
  const { renderMessage } = useMessages();
  const editor = useEditor();
  const close = useCloseDialog();
  const id = useId();
  const [name, setName] = useState(editor.document.name);
  const error = documentNameError(name);
  return (
    <Modal title={tr("document.details")} onClose={close}>
      <label>
        {tr("document.name")}
        <input
          value={name}
          maxLength={editorLimits.name}
          aria-invalid={!!error}
          aria-describedby={error ? id : undefined}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);
            if (!documentNameError(next)) editor.commit({ ...editor.document, name: next });
          }}
        />
        {error && (
          <span id={id}>
            {renderMessage(error)} {tr("document.nameRetained")}
          </span>
        )}
      </label>
      <p className="modal-description">
        {tr("document.summary", {
          pages: [message("common.pages", { count: editor.document.pages.length })],
          sources: [message("document.sourceCount", { count: editor.document.sources.length })],
          images: [message("document.imageCount", { count: editor.document.assets.length })],
        })}
      </p>
      {editor.document.sources.map((source) => (
        <DocumentSource key={source.id} source={source} />
      ))}
      <p className="field-note">{tr("document.safety")}</p>
    </Modal>
  );
}

function DocumentSource({ source }: { source: import("../core/model").Source }) {
  const { text } = useMessages();
  return (
    <div className="document-source">
      <strong>{source.name}</strong>
      {source.encryption && (
        <p className="inline-warning">
          {tr("document.encryptionNotice", {
            algorithm: source.encryption.algorithm,
            access: tr(
              (
                {
                  owner: "document.accessOwner",
                  user: "document.accessUser",
                  recipient: "document.accessRecipient",
                } as const
              )[source.encryption.authenticatedAs]
            ),
          })}
        </p>
      )}
      <p>
        {source.title || tr("document.noTitle")} · {source.author || tr("document.noAuthor")} ·{" "}
        {formatNumber(source.bytes.length / 1024 / 1024, {
          style: "unit",
          unit: "megabyte",
          maximumFractionDigits: 2,
        })}
      </p>
      {source.warnings.map((warning) => (
        <p className="inline-warning" key={warning}>
          {text(warningKeys[warning])}
        </p>
      ))}
      {!!source.structuralWarnings.length && (
        <p className="inline-warning">
          {tr("document.restrictedStructures", {
            structures: formatList(
              source.structuralWarnings.map((warning) => text(structureKeys[warning]))
            ),
          })}
        </p>
      )}
    </div>
  );
}
