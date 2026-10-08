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
        Operation
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
          <option value="number">Page numbering / Bates</option>
          <option value="watermark">Watermark</option>
          <option value="stamp">Stamp</option>
        </select>
      </label>
      <label>
        {rule.kind === "number" ? "Number prefix" : "Text"}
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
        Start at
        <input
          type="number"
          min="0"
          max="1000000000"
          value={rule.start}
          onChange={(event) => onChange({ ...rule, start: Number(event.target.value) })}
        />
      </label>
      <label>
        Minimum digits
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
        Position
        <select
          value={rule.position}
          onChange={(event) =>
            onChange({ ...rule, position: event.target.value as PageRule["position"] })
          }
        >
          <option value="top">Top</option>
          <option value="center">Center</option>
          <option value="bottom">Bottom</option>
        </select>
      </label>
      <label>
        Text size
        <input
          type="number"
          min="6"
          max="150"
          value={rule.fontSize}
          onChange={(event) => onChange({ ...rule, fontSize: Number(event.target.value) })}
        />
      </label>
      <label>
        Color
        <input
          type="color"
          value={rule.color}
          onChange={(event) => onChange({ ...rule, color: event.target.value })}
        />
      </label>
      <label>
        Opacity
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
