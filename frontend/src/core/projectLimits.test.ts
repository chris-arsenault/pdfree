import { describe, expect, it } from "vitest";
import { zipSync } from "fflate";
import { projectLimits, storedProjectBudget, validateProjectBudget } from "./projectLimits";

describe("portable project allocation budgets", () => {
  it("includes both ZIP headers before allocation", () => {
    const files = { "manifest.json": new Uint8Array(17), "sources/0.pdf": new Uint8Array(73) };
    const budget = storedProjectBudget(
      Object.entries(files).map(([path, data]) => ({ path, size: data.length }))
    );
    expect(budget.archiveBytes).toBe(zipSync(files, { level: 0 }).length);
    expect(budget.expandedBytes).toBe(90);
    expect(budget.manifestBytes).toBe(17);
  });
  it("counts UTF-8 filename bytes", () => {
    const files = { "α.txt": new Uint8Array(3) };
    expect(storedProjectBudget([{ path: "α.txt", size: 3 }]).archiveBytes).toBe(
      zipSync(files, { level: 0 }).length
    );
  });
  it("accepts each exact supported limit", () => {
    expect(() => validateProjectBudget({ ...projectLimits })).not.toThrow();
  });
  it.each([
    ["archiveBytes", "256 MB"],
    ["expandedBytes", "supported size"],
    ["manifestBytes", "manifest is too large"],
    ["entries", "supported size"],
  ] as const)("rejects exceeding %s by one", (key, message) => {
    expect(() =>
      validateProjectBudget({ ...projectLimits, [key]: projectLimits[key] + 1 })
    ).toThrow(message);
  });
  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid archive accounting %s",
    (archiveBytes) => {
      expect(() =>
        validateProjectBudget({ archiveBytes, expandedBytes: 0, manifestBytes: 0, entries: 0 })
      ).toThrow("invalid archive sizes");
    }
  );
  it("rejects a payload below the archive limit when ZIP overhead exceeds it", () => {
    const budget = storedProjectBudget([
      { path: "sources/0.pdf", size: projectLimits.archiveBytes - 1 },
    ]);
    expect(() => validateProjectBudget(budget)).toThrow("256 MB");
  });
});
