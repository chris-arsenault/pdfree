import { useState } from "react";
import { Trash2 } from "lucide-react";
import { newId, type PageRule } from "../core/model";
import { ruleSchema } from "../core/utilityModel";
import { ruleText } from "../core/pageRules";
import { useEditor } from "../hooks/editorContext";
import { Modal } from "./Modal";
import { RuleFields } from "./RuleFields";
import { IconButton } from "./ui/IconButton";
import { PageScopeField } from "./PageScopeField";
import { usePageScope } from "../hooks/usePageScope";
export const newRule = (): PageRule => ({
  id: newId(),
  kind: "number",
  pageIds: [],
  text: "",
  start: 1,
  padding: 0,
  position: "bottom",
  fontSize: 12,
  color: "#173732",
  opacity: 1,
});
export function RepeatedDialog() {
  const editor = useEditor(),
    [rule, setRule] = useState(newRule),
    [error, setError] = useState(""),
    scope = usePageScope("all");
  const all = scope.scope.kind === "all";
  // An empty rule scope means every page, including pages added later.
  const scoped = { ...rule, pageIds: all ? [] : scope.pageIds };
  const pages = editor.document.pages.filter((page) => scope.pageIds.includes(page.id));
  return (
    <Modal title="Repeat across pages" onClose={() => editor.setDialog("")}>
      <RuleFields rule={rule} onChange={setRule} />
      <PageScopeField
        scope={scope.scope}
        onChange={scope.setScope}
        pageIds={scope.pageIds}
        error={scope.error}
      />
      <p className="field-note">
        Numbers follow current page order. All-page rules include pages added later. Other scopes
        follow those page identities.
      </p>
      <div className="utility-preview" aria-label="Page rule preview">
        {pages.slice(0, 3).map((page) => (
          <p key={page.id}>
            Page {editor.document.pages.indexOf(page) + 1} ·{" "}
            {ruleText(editor.document, page, scoped)}
          </p>
        ))}
      </div>
      <RuleList />
      {error && (
        <p className="inline-warning" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button
          className="button primary"
          disabled={!scope.pageIds.length}
          onClick={() => {
            const parsed = ruleSchema.safeParse(scoped);
            if (!parsed.success || (!scoped.text.trim() && scoped.kind !== "number")) {
              setError("Choose valid settings and text for this operation.");
              return;
            }
            editor.commit({
              ...editor.document,
              rules: [...(editor.document.rules ?? []), scoped],
            });
            editor.setDialog("");
          }}
        >
          Apply rule
        </button>
      </div>
    </Modal>
  );
}
function RuleList() {
  const editor = useEditor();
  if (!editor.document.rules?.length) return null;
  return (
    <div className="rule-list">
      {editor.document.rules.map((item) => (
        <div className="bookmark-row" key={item.id}>
          <span>
            {item.kind} · {item.text || "Page numbers"}
          </span>
          <IconButton
            label={`Remove ${item.kind} rule`}
            icon={Trash2}
            onClick={() =>
              editor.commit({
                ...editor.document,
                rules: editor.document.rules!.filter((rule) => rule.id !== item.id),
              })
            }
          />
        </div>
      ))}
    </div>
  );
}
