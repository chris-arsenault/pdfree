import { message } from "../i18n/messages";
import { useMessageState } from "../i18n/react";
import { text as tr } from "../i18n/runtime";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { newId, type PageRule } from "../core/model";
import { ruleSchema } from "../core/utilityModel";
import { ruleText } from "../core/ruleModel";
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
    [error, setError] = useMessageState(),
    scope = usePageScope("all");
  const all = scope.scope.kind === "all";
  // An empty rule scope means every page, including pages added later.
  const scoped = { ...rule, pageIds: all ? [] : scope.pageIds };
  const pages = editor.document.pages.filter((page) => scope.pageIds.includes(page.id));
  return (
    <Modal title={tr("pages.repeat")} onClose={() => editor.setDialog("")}>
      <RuleFields rule={rule} onChange={setRule} />
      <PageScopeField
        scope={scope.scope}
        onChange={scope.setScope}
        pageIds={scope.pageIds}
        error={scope.error}
      />
      <p className="field-note">{tr("repeat.description")}</p>
      <div className="utility-preview" aria-label={tr("repeat.preview")}>
        {pages.slice(0, 3).map((page) => (
          <p key={page.id}>
            {tr("common.pageNumber", { number: editor.document.pages.indexOf(page) + 1 })} ·{" "}
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
              setError(message("repeat.invalid"));
              return;
            }
            editor.commit({
              ...editor.document,
              rules: [...(editor.document.rules ?? []), scoped],
            });
            editor.setDialog("");
          }}
        >
          {tr("repeat.apply")}
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
            {tr(
              (
                {
                  number: "repeat.numbering",
                  watermark: "repeat.watermark",
                  stamp: "common.stamp",
                } as const
              )[item.kind]
            )}{" "}
            · {item.text || tr("repeat.pageNumbers")}
          </span>
          <IconButton
            label={tr("rules.removeKind", {
              kind: tr(
                (
                  {
                    number: "repeat.numbering",
                    watermark: "repeat.watermark",
                    stamp: "common.stamp",
                  } as const
                )[item.kind]
              ),
            })}
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
