import { useEditor } from "../hooks/editorContext";
import { pageRules, ruleText, ruleY } from "../core/pageRules";
import { displaySize } from "../core/coordinates";
export function RulesLayer() {
  const editor = useEditor(),
    page = editor.page;
  if (!page) return null;
  const dimensions = displaySize(page);
  return (
    <div className="utility-rules">
      {pageRules(editor.document, page).map((rule) => (
        <span
          key={rule.id}
          style={{
            "--rule-color": rule.color,
            "--rule-opacity": rule.opacity,
            "--rule-size": `${rule.fontSize * editor.zoom}px`,
            "--rule-top": `${(ruleY(rule, dimensions.height) - rule.fontSize) * editor.zoom}px`,
          }}
        >
          {ruleText(editor.document, page, rule)}
        </span>
      ))}
    </div>
  );
}
