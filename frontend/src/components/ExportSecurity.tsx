import { text as tr } from "../i18n/runtime";
import { type SecuritySettings, type SigningMode, hasSecurity } from "../core/securitySettings";
import { type PdfPermissions } from "../core/pdfSecurity";
import "../security.css";

type Props = {
  value: SecuritySettings;
  onChange: (value: SecuritySettings) => void;
  disabled: boolean;
};
export function ExportSecurity(props: Props) {
  const { value, onChange } = props;
  return (
    <fieldset className="export-security" disabled={props.disabled}>
      <legend>{tr("security.title")}</legend>
      <label>
        {tr("security.signing")}
        <select
          value={value.mode}
          onChange={(event) => onChange({ ...value, mode: event.target.value as SigningMode })}
        >
          <option value="none">{tr("common.none")}</option>
          <option value="approval">{tr("security.sign")}</option>
          <option value="1">{tr("security.certifyLock")}</option>
          <option value="2">{tr("security.certifyForms")}</option>
          <option value="3">{tr("security.certifyComments")}</option>
        </select>
      </label>
      {value.mode !== "none" && <CertificateSettings {...props} />}
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={value.protect}
          onChange={(event) => onChange({ ...value, protect: event.target.checked })}
        />
        {tr("security.protect")}
      </label>
      {value.protect && (
        <>
          <label>
            {tr("security.credentials")}
            <select
              value={value.protectionMode}
              onChange={(event) =>
                onChange({
                  ...value,
                  protectionMode: event.target.value as SecuritySettings["protectionMode"],
                })
              }
            >
              <option value="password">{tr("security.passwords")}</option>
              <option value="recipients">{tr("security.recipients")}</option>
            </select>
          </label>
          {value.protectionMode === "password" ? (
            <ProtectionSettings {...props} />
          ) : (
            <RecipientSettings {...props} />
          )}
        </>
      )}
      {hasSecurity(value) && <p className="field-note">{tr("security.scope")}</p>}
    </fieldset>
  );
}
function RecipientSettings(props: Props) {
  const { value, onChange } = props;
  return (
    <div className="security-fields">
      <label>
        {tr("security.recipientFiles")}
        <input
          type="file"
          multiple
          accept=".cer,.crt,.pem,application/pkix-cert"
          onChange={(event) =>
            onChange({ ...value, recipients: Array.from(event.target.files ?? []) })
          }
        />
      </label>
      <p className="field-note">{tr("security.recipientHint")}</p>
      <Permissions {...props} />
    </div>
  );
}

function CertificateSettings({ value, onChange }: Props) {
  return (
    <div className="security-fields">
      <label>
        {tr("security.certificateFileLabel")}
        <input
          type="file"
          accept=".p12,.pfx,application/x-pkcs12"
          onChange={(event) => onChange({ ...value, certificate: event.target.files?.[0] ?? null })}
        />
      </label>
      <SecurityPassword
        value={value}
        onChange={onChange}
        field="certificatePassword"
        label={tr("security.certificatePassword")}
      />
      <div className="security-pair">
        <label>
          {tr("security.reason")}
          <input
            maxLength={1024}
            value={value.reason}
            onChange={(event) => onChange({ ...value, reason: event.target.value })}
          />
        </label>
        <label>
          {tr("security.location")}
          <input
            maxLength={1024}
            value={value.location}
            onChange={(event) => onChange({ ...value, location: event.target.value })}
          />
        </label>
      </div>
      <p className="field-note">{tr("security.signingHint")}</p>
    </div>
  );
}

type PasswordField =
  | "userPassword"
  | "userConfirmation"
  | "ownerPassword"
  | "ownerConfirmation"
  | "certificatePassword";
function SecurityPassword({
  value,
  onChange,
  field,
  label,
}: Pick<Props, "value" | "onChange"> & { field: PasswordField; label: string }) {
  return (
    <label>
      {label}
      <input
        type="password"
        autoComplete="off"
        maxLength={1024}
        value={value[field]}
        onChange={(event) => onChange({ ...value, [field]: event.target.value })}
      />
    </label>
  );
}

function ProtectionSettings(props: Props) {
  const { value, onChange } = props;
  return (
    <div className="security-fields">
      <div className="security-pair">
        <SecurityPassword
          value={value}
          onChange={onChange}
          field="userPassword"
          label={tr("security.openPassword")}
        />
        <SecurityPassword
          value={value}
          onChange={onChange}
          field="userConfirmation"
          label={tr("security.confirmOpen")}
        />
        <SecurityPassword
          value={value}
          onChange={onChange}
          field="ownerPassword"
          label={tr("security.ownerPassword")}
        />
        <SecurityPassword
          value={value}
          onChange={onChange}
          field="ownerConfirmation"
          label={tr("security.confirmOwner")}
        />
      </div>
      <p className="field-note">{tr("security.passwordHint")}</p>
      <Permissions {...props} />
    </div>
  );
}

const permissionLabels = (): [keyof PdfPermissions, string][] => [
  ["print", tr("security.allowPrint")],
  ["printHighQuality", tr("security.allowPrintQuality")],
  ["copy", tr("security.allowCopy")],
  ["modify", tr("security.allowEdit")],
  ["annotate", tr("security.allowComments")],
  ["fillForms", tr("security.allowForms")],
  ["assemble", tr("security.allowAssembly")],
];
function Permissions({ value, onChange }: Props) {
  return (
    <fieldset className="security-permissions">
      <legend>{tr("security.permissions")}</legend>
      {permissionLabels().map(([key, label]) => (
        <label className="checkbox-label" key={key}>
          <input
            type="checkbox"
            checked={value.permissions[key]}
            disabled={key === "printHighQuality" && !value.permissions.print}
            onChange={(event) =>
              onChange({
                ...value,
                permissions: { ...value.permissions, [key]: event.target.checked },
              })
            }
          />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
