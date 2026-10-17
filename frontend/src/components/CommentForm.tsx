import { text as tr } from "../i18n/runtime";
import { useEffect, useRef, useState } from "react";
import { useEditor } from "../hooks/editorContext";

export function CommentForm({
  text = "",
  mode,
  author = false,
  onSave,
  onCancel,
}: {
  text?: string;
  mode: "edit" | "reply" | "new";
  author?: boolean;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const editor = useEditor();
  const [value, setValue] = useState(text);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const label = tr(
    ({ edit: "comments.edit", reply: "common.reply", new: "comments.new" } as const)[mode]
  );
  const button = tr(
    ({ edit: "comments.save", reply: "comments.postReply", new: "comments.post" } as const)[mode]
  );
  return (
    <form
      className="comment-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(value);
      }}
    >
      <label>
        {label}
        <textarea
          aria-label={label}
          ref={ref}
          value={value}
          maxLength={100_000}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      {author && (
        <label>
          {tr("comments.authorOptional")}
          <input
            value={editor.commentAuthor}
            maxLength={200}
            onChange={(event) => editor.setCommentAuthor(event.target.value)}
          />
        </label>
      )}
      <div className="comment-form-actions">
        <button type="button" className="button secondary" onClick={onCancel}>
          {tr("common.cancel")}
        </button>
        <button type="submit" className="button primary" disabled={!value.trim()}>
          {button}
        </button>
      </div>
    </form>
  );
}
