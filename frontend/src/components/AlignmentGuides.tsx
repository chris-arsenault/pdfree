import { useEditor } from "../hooks/editorContext";
import { displaySize, toDisplay } from "../core/coordinates";
import { type PlacedObject, type Point } from "../core/model";
export function AlignmentGuides({ object }: { object: PlacedObject }) {
  const editor = useEditor(),
    page = editor.page;
  if (!page) return null;
  const others = page.objects.filter((item) => !editor.objectIds.includes(item.id));
  const size = displaySize(page),
    box = page.box;
  const lines: { start: Point; end: Point }[] = [];
  if (others.some((item) => item.x === object.x))
    lines.push({
      start: { x: object.x, y: box.y },
      end: { x: object.x, y: box.y + box.height },
    });
  if (others.some((item) => item.y === object.y))
    lines.push({
      start: { x: box.x, y: object.y },
      end: { x: box.x + box.width, y: object.y },
    });
  return (
    <svg
      className="alignment-guides"
      viewBox={`0 0 ${size.width} ${size.height}`}
      aria-hidden="true"
    >
      {lines.map((line, index) => {
        const start = toDisplay(line.start, page),
          end = toDisplay(line.end, page);
        return <line key={index} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />;
      })}
    </svg>
  );
}
