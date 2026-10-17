import { text as tr } from "../i18n/runtime";
import { type PageRule } from "../core/model";
export function RuleFields({
  rule,
  onChange,
}: {
  rule: PageRule;
  onChange: (rule: PageRule) => void;
}) {
  return (
    <div className="utility-grid">
      <label>
        {tr("common.operation")}
        <select
          value={rule.kind}
          onChange={(event) =>
            onChange({
              ...rule,
              kind: event.target.value as PageRule["kind"],
              position: event.target.value === "number" ? "bottom" : "center",
              opacity: event.target.value === "watermark" ? 0.2 : 1,
            })
          }
        >
          <option value="number">{tr("repeat.numbering")}</option>
          <option value="watermark">{tr("repeat.watermark")}</option>
          <option value="stamp">{tr("common.stamp")}</option>
        </select>
      </label>
      <label>
        {rule.kind === "number" ? tr("repeat.prefix") : tr("common.text")}
        <input
          value={rule.text}
          onChange={(event) => onChange({ ...rule, text: event.target.value })}
        />
      </label>
      <NumberFields rule={rule} onChange={onChange} />
      <AppearanceFields rule={rule} onChange={onChange} />
    </div>
  );
}
function NumberFields({ rule, onChange }: { rule: PageRule; onChange: (rule: PageRule) => void }) {
  return rule.kind === "number" ? (
    <>
      <label>
        {tr("repeat.start")}
        <input
          type="number"
          min="0"
          max="1000000000"
          value={rule.start}
          onChange={(event) => onChange({ ...rule, start: Number(event.target.value) })}
        />
      </label>
      <label>
        {tr("repeat.digits")}
        <input
          type="number"
          min="0"
          max="12"
          value={rule.padding}
          onChange={(event) => onChange({ ...rule, padding: Number(event.target.value) })}
        />
      </label>
    </>
  ) : null;
}
function AppearanceFields({
  rule,
  onChange,
}: {
  rule: PageRule;
  onChange: (rule: PageRule) => void;
}) {
  return (
    <>
      <label>
        {tr("common.position")}
        <select
          value={rule.position}
          onChange={(event) =>
            onChange({ ...rule, position: event.target.value as PageRule["position"] })
          }
        >
          <option value="top">{tr("common.top")}</option>
          <option value="center">{tr("common.center")}</option>
          <option value="bottom">{tr("common.bottom")}</option>
        </select>
      </label>
      <label>
        {tr("repeat.size")}
        <input
          type="number"
          min="6"
          max="150"
          value={rule.fontSize}
          onChange={(event) => onChange({ ...rule, fontSize: Number(event.target.value) })}
        />
      </label>
      <label>
        {tr("common.color")}
        <input
          type="color"
          value={rule.color}
          onChange={(event) => onChange({ ...rule, color: event.target.value })}
        />
      </label>
      <label>
        {tr("common.opacity")}
        <input
          type="range"
          min="0.05"
          max="1"
          step="0.05"
          value={rule.opacity}
          onChange={(event) => onChange({ ...rule, opacity: Number(event.target.value) })}
        />
      </label>
    </>
  );
}
