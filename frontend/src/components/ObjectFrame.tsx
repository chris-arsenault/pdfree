import { type HTMLAttributes } from "react";
import { toDisplay } from "../core/coordinates";
import { type Page, type PlacedObject } from "../core/model";

export function ObjectFrame({
  object,
  page,
  scale,
  children,
  ...props
}: {
  object: PlacedObject;
  page: Page;
  scale: number;
} & Omit<HTMLAttributes<HTMLDivElement>, "style">) {
  const radians = (object.rotation * Math.PI) / 180;
  const origin = toDisplay(
    {
      x: object.x - object.height * Math.sin(radians),
      y: object.y + object.height * Math.cos(radians),
    },
    page
  );
  return (
    <div
      {...props}
      style={{
        "--x": `${origin.x * scale}px`,
        "--y": `${origin.y * scale}px`,
        "--w": `${object.width * scale}px`,
        "--h": `${object.height * scale}px`,
        "--angle": `${page.rotation - object.rotation}deg`,
        "--object-color": object.color,
        "--font-size": `${object.fontSize * scale}px`,
        "--opacity": object.opacity,
        "--text-align": object.align,
        "--stroke-width": object.strokeWidth,
      }}
    >
      {children}
    </div>
  );
}
