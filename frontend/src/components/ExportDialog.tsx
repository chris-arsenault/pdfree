import { useState } from "react";
import { Download, Printer, Save } from "lucide-react";
import { useEditor } from "../hooks/editorContext";
import { useExport } from "../hooks/useExport";
import { useCloseDialog } from "../hooks/useCloseDialog";
import { usePageScope, selectionDefault } from "../hooks/usePageScope";
import { Modal } from "./Modal";
import { filePicker } from "../services/fileSave";
import { defaultSecuritySettings, hasSecurity } from "../core/securitySettings";
import { ExportSecurity } from "./ExportSecurity";
import { hasEncryptedSources } from "../core/model";
import { type CompressionOptions } from "../core/compressPdf";
import { CompressionControls } from "./CompressionControls";
import { defaultNup, type NupOptions } from "../core/nupPdf";
import { NupSheets } from "./NupSheets";
import { SplitExport } from "./SplitExport";
import { PageScopeField } from "./PageScopeField";

type ExportFormat = "pdf" | "sheets" | "split" | "images" | "project";
const formats: { id: ExportFormat; label: string; detail: string }[] = [
  { id: "pdf", label: "PDF", detail: "Fields, comments and edits; optional signing" },
  { id: "sheets", label: "Printable sheets", detail: "2, 4 or 6 pages on each sheet" },
  { id: "split", label: "Split into files", detail: "Several PDFs in a ZIP" },
  { id: "images", label: "Page images", detail: "PNG files in a ZIP" },
  { id: "project", label: "Editing project", detail: "Reopen later with movable objects" },
];

// Only formats whose file depends on these settings show them.
const scopedFormats: ExportFormat[] = ["pdf", "sheets", "images"];
const flattenFormats: ExportFormat[] = ["pdf", "split"];

export function ExportDialog() {
  const editor = useEditor(),
    close = useCloseDialog();
  const [format, setFormat] = useState<ExportFormat>(
    editor.exportStart === "split" ? "split" : "pdf"
  );
  const [name, setName] = useState(editor.document.name);
  const [flatten, setFlatten] = useState(false);
  const scope = usePageScope(editor.exportStart === "extract" ? selectionDefault(editor) : "all");
  return (
    <Modal title="Export your document" onClose={close}>
      <p className="modal-description">Files are created on this device and downloaded directly.</p>
      <FormatPicker format={format} onChange={setFormat} />
      <ProtectionNotice />
      <label>
        {format === "split" ? "File name prefix" : "File name"}
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      {scopedFormats.includes(format) && (
        <PageScopeField
          scope={scope.scope}
          onChange={scope.setScope}
          pageIds={scope.pageIds}
          error={scope.error}
        />
      )}
      {flattenFormats.includes(format) && <FlattenField flatten={flatten} onChange={setFlatten} />}
      {format === "split" ? (
        <SplitExport prefix={name} flatten={flatten} />
      ) : (
        <ScopedExport
          format={format}
          name={name}
          flatten={flatten}
          pageIds={scope.scope.kind === "all" ? [] : scope.pageIds}
          invalid={!!scope.error || !scope.pageIds.length}
        />
      )}
    </Modal>
  );
}
function FormatPicker({
  format,
  onChange,
}: {
  format: ExportFormat;
  onChange: (format: ExportFormat) => void;
}) {
  return (
    <fieldset className="export-formats">
      <legend>Output</legend>
      {formats.map((item) => (
        <label key={item.id} className="export-format">
          <input
            type="radio"
            name="export-format"
            checked={format === item.id}
            onChange={() => onChange(item.id)}
          />
          <span>
            {item.label}
            <small aria-hidden="true">{item.detail}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

// Security, compression and sheet settings persist while switching between scoped formats.
function ScopedExport({
  format,
  name,
  flatten,
  pageIds,
  invalid,
}: {
  format: Exclude<ExportFormat, "split">;
  name: string;
  flatten: boolean;
  pageIds: string[];
  invalid: boolean;
}) {
  const editor = useEditor();
  const settings = usePdfSettings(format === "sheets");
  const actions = useExport(name, pageIds, flatten && !settings.sheets, settings.security, {
    compression: settings.compression,
    nup: settings.sheets ? settings.nup : undefined,
  });
  const blocked = !!editor.task.busy || !name.trim();
  if (format === "project")
    return (
      <>
        <p className="field-note">
          Saves the whole document with its original sources so added objects, comments and fields
          stay editable when you reopen it in PDFree.
        </p>
        <PrimaryAction
          label="Download editing project"
          onClick={actions.saveProject}
          disabled={blocked}
        />
      </>
    );
  if (format === "images")
    return (
      <PrimaryAction
        label="Download page images (ZIP)"
        onClick={actions.images}
        disabled={blocked || invalid}
      />
    );
  return (
    <PdfOptions
      settings={settings}
      actions={actions}
      pageIds={pageIds}
      flatten={flatten}
      disabled={blocked || invalid}
    />
  );
}
function usePdfSettings(sheets: boolean) {
  const [security, setSecurity] = useState(defaultSecuritySettings);
  const [compression, setCompression] = useState<CompressionOptions>({
    preset: "original",
    targetBytes: 0,
  });
  const [nup, setNup] = useState<NupOptions>({ ...defaultNup, count: 2 });
  return { sheets, security, setSecurity, compression, setCompression, nup, setNup };
}
function PdfOptions({
  settings,
  actions,
  pageIds,
  flatten,
  disabled,
}: {
  settings: ReturnType<typeof usePdfSettings>;
  actions: ReturnType<typeof useExport>;
  pageIds: string[];
  flatten: boolean;
  disabled: boolean;
}) {
  const editor = useEditor();
  const { sheets, security, nup } = settings;
  return (
    <>
      {sheets ? (
        <NupSheets options={nup} onChange={settings.setNup} pageIds={pageIds} />
      ) : (
        <RequiredFields />
      )}
      <CompressionControls
        options={settings.compression}
        onChange={settings.setCompression}
        pageIds={pageIds}
        flatten={flatten || sheets}
      />
      <ExportSecurity
        value={security}
        onChange={settings.setSecurity}
        disabled={!!editor.task.busy}
      />
      <PdfActions
        actions={actions}
        printLabel={hasSecurity(security) ? "Print unprotected copy" : "Print"}
        downloadLabel={sheets ? `Download ${nup.count}-up PDF` : "Download PDF"}
        disabled={disabled}
      />
    </>
  );
}
function PrimaryAction({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <div className="modal-actions">
      <button className="button primary" onClick={onClick} disabled={disabled}>
        <Download size={16} /> {label}
      </button>
    </div>
  );
}
function PdfActions({
  actions,
  printLabel,
  downloadLabel,
  disabled,
}: {
  actions: ReturnType<typeof useExport>;
  printLabel: string;
  downloadLabel: string;
  disabled: boolean;
}) {
  return (
    <div className="modal-actions">
      <button
        className="button secondary"
        onClick={() => actions.exportFile(true)}
        disabled={disabled}
      >
        <Printer size={16} /> {printLabel}
      </button>
      {filePicker && (
        <button className="button secondary" onClick={actions.direct} disabled={disabled}>
          <Save size={16} /> Save to file…
        </button>
      )}
      <button className="button primary" onClick={() => actions.exportFile()} disabled={disabled}>
        <Download size={16} /> {downloadLabel}
      </button>
    </div>
  );
}
function FlattenField({
  flatten,
  onChange,
}: {
  flatten: boolean;
  onChange: (flatten: boolean) => void;
}) {
  return (
    <>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={flatten}
          onChange={(event) => onChange(event.target.checked)}
        />
        Flatten form fields
      </label>
      <p className="field-note">
        Flattening keeps the filled appearance and removes interactive fields. Save an editing
        project to continue moving added objects.
      </p>
    </>
  );
}
function ProtectionNotice() {
  const editor = useEditor();
  return hasEncryptedSources(editor.document) ? (
    <p className="inline-warning">
      This document was encrypted. Choose PDF and enable protection below to encrypt the new file.
      Editing projects, images, print and split files contain decrypted content.
    </p>
  ) : null;
}
function RequiredFields() {
  const editor = useEditor();
  const required = editor.document.sources
    .flatMap((source) => source.fields)
    .filter((field) => {
      const value = editor.document.values[field.id];
      return field.required && (!value || (Array.isArray(value) && !value.length));
    });
  if (!required.length) return null;
  return (
    <div className="inline-warning">
      Unfilled required fields: {required.map((field) => field.name).join(", ")}
    </div>
  );
}
