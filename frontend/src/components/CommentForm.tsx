import { useEffect, useRef, useState } from "react";
import { useEditor } from "../hooks/editorContext";

export function CommentForm({
  text = "",
  label,
  author = false,
  onSave,
  onCancel,
}: {
  text?: string;
  label: string;
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
  const buttons: Record<string, string> = {
    "Edit comment": "Save comment",
    Reply: "Post reply",
    "New comment": "Post comment",
  };
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
          Name (optional)
          <input
            value={editor.commentAuthor}
            maxLength={200}
            onChange={(event) => editor.setCommentAuthor(event.target.value)}
          />
        </label>
      )}
      <div className="comment-form-actions">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button primary" disabled={!value.trim()}>
          {buttons[label]}
        </button>
      </div>
    </form>
  );
}
