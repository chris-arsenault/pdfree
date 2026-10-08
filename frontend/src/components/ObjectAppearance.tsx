import { useEffect, useRef } from "react";
import { type PlacedObject, type Asset } from "../core/model";

export function ObjectImage({ asset }: { asset: Asset | null }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!asset) return;
    const next = URL.createObjectURL(new Blob([Uint8Array.from(asset.data)], { type: asset.mime }));
    if (ref.current) ref.current.src = next;
    return () => URL.revokeObjectURL(next);
  }, [asset]);
  return <img ref={ref} alt={asset?.name ?? "Image"} draggable={false} />;
}
export function ObjectAppearance({ object, assets }: { object: PlacedObject; assets: Asset[] }) {
  if (object.kind === "image")
    return <ObjectImage asset={assets.find((asset) => asset.id === object.assetId) ?? null} />;
  if (object.kind === "text" || object.kind === "stamp")
    return (
      <span className={`object-text ${object.font === "signature" ? "signature-font" : ""}`}>
        {object.text || "Type your text"}
      </span>
    );
  if (object.kind === "field")
    return <span className="field-preview">{object.fieldName || "New field"}</span>;
  return <ShapeAppearance object={object} />;
}
function shapePath(object: PlacedObject) {
  let path = "";
  if (object.kind === "ink")
    path = object.points
      .map((point, i) => `${i ? "L" : "M"}${point.x * 100} ${(1 - point.y) * 100}`)
      .join(" ");
  if (object.kind === "check") path = "M10 50 L40 80 L90 10";
  if (object.kind === "cross") path = "M10 10 L90 90 M90 10 L10 90";
  if (object.kind === "line" || object.kind === "arrow")
    path = object.points.length
      ? object.points
          .map((point, i) => `${i ? "L" : "M"}${point.x * 100} ${(1 - point.y) * 100}`)
          .join(" ")
      : "M0 100 L100 0";
  return path;
}
function ShapeAppearance({ object }: { object: PlacedObject }) {
  const path = shapePath(object);
  return (
    <svg className="object-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {path && <path d={path} />}
      {object.kind === "arrow" && <path d={arrowHead(object)} />}
      {(object.kind === "rectangle" || object.kind === "highlight") && (
        <rect x="0" y="0" width="100" height="100" />
      )}
    </svg>
  );
}
function arrowHead(object: PlacedObject) {
  const points = object.points.length
    ? object.points
    : [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ];
  const end = points[1],
    angle = Math.atan2((end.y - points[0].y) * object.height, (end.x - points[0].x) * object.width);
  return [-0.5, 0.5]
    .map(
      (delta) =>
        `M${end.x * 100} ${(1 - end.y) * 100} L${end.x * 100 - (1200 * Math.cos(angle + delta)) / object.width} ${(1 - end.y) * 100 + (1200 * Math.sin(angle + delta)) / object.height}`
    )
    .join(" ");
}
