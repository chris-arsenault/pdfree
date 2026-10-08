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
      <legend>Signing and protection</legend>
      <label>
        Certificate signing
        <select
          value={value.mode}
          onChange={(event) => onChange({ ...value, mode: event.target.value as SigningMode })}
        >
          <option value="none">None</option>
          <option value="approval">Digitally sign</option>
          <option value="1">Certify: no changes allowed (sign and lock)</option>
          <option value="2">Certify: allow form filling and signatures</option>
          <option value="3">Certify: allow form filling, signatures and comments</option>
        </select>
      </label>
      {value.mode !== "none" && <CertificateSettings {...props} />}
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={value.protect}
          onChange={(event) => onChange({ ...value, protect: event.target.checked })}
        />
        Protect PDF with passwords and permissions
      </label>
      {value.protect && <ProtectionSettings {...props} />}
      {hasSecurity(value) && (
        <p className="field-note">
          Protection applies to this PDF download and direct PDF save. Editing projects, images,
          printed copies and Split downloads are unprotected. Passwords and certificate files are
          used for this export and are not saved in drafts or projects.
        </p>
      )}
    </fieldset>
  );
}

function CertificateSettings({ value, onChange }: Props) {
  return (
    <div className="security-fields">
      <label>
        Certificate file (.p12/.pfx)
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
        label="Certificate password"
      />
      <div className="security-pair">
        <label>
          Signing reason
          <input
            maxLength={1024}
            value={value.reason}
            onChange={(event) => onChange({ ...value, reason: event.target.value })}
          />
        </label>
        <label>
          Signing location
          <input
            maxLength={1024}
            value={value.location}
            onChange={(event) => onChange({ ...value, location: event.target.value })}
          />
        </label>
      </div>
      <p className="field-note">
        Choose a certificate containing your RSA or ECDSA private key (up to 2 MiB). Readers verify
        your identity using the certificate&apos;s trust chain; self-signed certificates show an
        untrusted identity. Signing uses this device&apos;s clock without an online timestamp. Add a
        drawn or typed signature in the editor if you also want a visible mark.
      </p>
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
          label="Opening password (optional)"
        />
        <SecurityPassword
          value={value}
          onChange={onChange}
          field="userConfirmation"
          label="Confirm opening password"
        />
        <SecurityPassword
          value={value}
          onChange={onChange}
          field="ownerPassword"
          label="Owner password"
        />
        <SecurityPassword
          value={value}
          onChange={onChange}
          field="ownerConfirmation"
          label="Confirm owner password"
        />
      </div>
      <p className="field-note">
        AES-256 encryption. An opening password is required to view the file when set. The owner
        password grants full access; use a different password. With an empty opening password,
        anyone can view the PDF. Permission restrictions depend on the reader and can be ignored.
      </p>
      <Permissions {...props} />
    </div>
  );
}

const permissionLabels: [keyof PdfPermissions, string][] = [
  ["print", "Allow printing"],
  ["printHighQuality", "Allow high-quality printing"],
  ["copy", "Allow copying and extraction"],
  ["modify", "Allow content editing"],
  ["annotate", "Allow comments and annotations"],
  ["fillForms", "Allow form filling"],
  ["assemble", "Allow page assembly"],
];
function Permissions({ value, onChange }: Props) {
  return (
    <fieldset className="security-permissions">
      <legend>Reader permissions</legend>
      {permissionLabels.map(([key, label]) => (
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
