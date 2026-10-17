import { useEditor } from "../hooks/editorContext";
import { pageRules, ruleText, ruleY } from "../core/ruleModel";
import { displaySize } from "../core/coordinates";
import { type Page } from "../core/model";
export function RulesLayer({ page: requestedPage, scale }: { page?: Page; scale?: number }) {
  const editor = useEditor(),
    page = requestedPage ?? editor.page;
  const zoom = scale ?? editor.zoom;
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
            "--rule-size": `${rule.fontSize * zoom}px`,
            "--rule-top": `${(ruleY(rule, dimensions.height) - rule.fontSize) * zoom}px`,
          }}
        >
          {ruleText(editor.document, page, rule)}
        </span>
      ))}
    </div>
  );
}
