import { useState } from "react";
import { Trash2 } from "lucide-react";
import { newId, type PageRule } from "../core/model";
import { ruleSchema } from "../core/utilityModel";
import { ruleText } from "../core/pageRules";
import { useEditor } from "../hooks/editorContext";
import { Modal } from "./Modal";
import { RuleFields } from "./RuleFields";
import { IconButton } from "./ui/IconButton";
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
    [all, setAll] = useState(true),
    [error, setError] = useState("");
  const scoped = { ...rule, pageIds: all ? [] : editor.selectedPageIds };
  const pages = editor.document.pages.filter((page) => all || scoped.pageIds.includes(page.id));
  return (
    <Modal title="Repeat across pages" onClose={() => editor.setDialog("")}>
      <RuleFields rule={rule} onChange={setRule} />
      <label className="checkbox-label">
        <input type="checkbox" checked={all} onChange={(event) => setAll(event.target.checked)} />
        All pages
      </label>
      <p className="field-note">
        Numbers follow current page order. All-page rules include pages added later. Selected-page
        rules follow those page identities.
      </p>
      <div className="utility-preview" aria-label="Page rule preview">
        {pages.slice(0, 3).map((page) => (
          <p key={page.id}>
            Page {editor.document.pages.indexOf(page) + 1} ·{" "}
            {ruleText(editor.document, page, scoped)}
          </p>
        ))}
      </div>
      {!!editor.document.rules?.length && (
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
      )}
      {error && (
        <p className="inline-warning" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button
          className="button primary"
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
