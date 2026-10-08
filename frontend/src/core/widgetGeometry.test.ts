import { describe, expect, it } from "vitest";
import { widgetDisplayGeometry } from "./widgetGeometry";
import { type Page, type Widget } from "./model";

const widget: Widget = {
  x: 100,
  y: 200,
  width: 30,
  height: 150,
  pageIndex: 0,
  option: "",
  rotation: 0,
};
const page: Page = {
  id: "page",
  sourceId: "source",
  sourceIndex: 0,
  comments: [],
  rotation: 0,
  box: { x: 12, y: 30, width: 500, height: 700 },
  objects: [],
};
const bounds = [
  { x: 88, y: 380, width: 30, height: 150 },
  { x: 170, y: 88, width: 150, height: 30 },
  { x: 382, y: 170, width: 30, height: 150 },
  { x: 380, y: 382, width: 150, height: 30 },
];

describe("native widget placement", () => {
  for (const pageRotation of [0, 90, 180, 270])
    for (const widgetRotation of [0, 90, 180, 270])
      it(`matches annotation bounds with page ${pageRotation} and appearance ${widgetRotation}`, () => {
        const geometry = widgetDisplayGeometry(
          { ...widget, rotation: widgetRotation },
          { ...page, rotation: pageRotation }
        );
        const angle = (geometry.rotation * Math.PI) / 180;
        const corners = [
          [0, 0],
          [geometry.width, 0],
          [0, geometry.height],
          [geometry.width, geometry.height],
        ].map(([x, y]) => ({
          x: geometry.x + x * Math.cos(angle) - y * Math.sin(angle),
          y: geometry.y + x * Math.sin(angle) + y * Math.cos(angle),
        }));
        const expected = bounds[pageRotation / 90];
        expect(Math.min(...corners.map((point) => point.x))).toBeCloseTo(expected.x);
        expect(Math.min(...corners.map((point) => point.y))).toBeCloseTo(expected.y);
        expect(Math.max(...corners.map((point) => point.x))).toBeCloseTo(
          expected.x + expected.width
        );
        expect(Math.max(...corners.map((point) => point.y))).toBeCloseTo(
          expected.y + expected.height
        );
        expect(geometry.rotation).toBe((pageRotation - widgetRotation + 360) % 360);
        expect(geometry.width).toBe(widgetRotation % 180 ? 150 : 30);
        expect(geometry.height).toBe(widgetRotation % 180 ? 30 : 150);
      });
  it("rejects appearance angles that cannot describe a native PDF control", () => {
    expect(() => widgetDisplayGeometry({ ...widget, rotation: 45 }, page)).toThrow(
      "unsupported rotation"
    );
  });
});
