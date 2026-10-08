export const projectLimits = {
  archiveBytes: 256 * 1024 * 1024,
  expandedBytes: 512 * 1024 * 1024,
  manifestBytes: 8 * 1024 * 1024,
  entries: 2001,
} as const;

export type ProjectBudget = {
  archiveBytes: number;
  expandedBytes: number;
  manifestBytes: number;
  entries: number;
};

export function validateProjectBudget(budget: ProjectBudget) {
  if (Object.values(budget).some((value) => !Number.isSafeInteger(value) || value < 0))
    throw new Error("This project has invalid archive sizes.");
  if (budget.archiveBytes > projectLimits.archiveBytes)
    throw new Error("This project exceeds the 256 MB archive limit. Save fewer source PDFs.");
  if (budget.expandedBytes > projectLimits.expandedBytes || budget.entries > projectLimits.entries)
    throw new Error("This project expands beyond the supported size.");
  if (budget.manifestBytes > projectLimits.manifestBytes)
    throw new Error("This project's manifest is too large.");
}

// The writer uses stored entries with no comments or extra fields. Count both
// ZIP headers and their UTF-8 paths before allocating the archive.
export function storedProjectBudget(entries: { path: string; size: number }[]): ProjectBudget {
  const expandedBytes = entries.reduce((total, entry) => total + entry.size, 0);
  return {
    archiveBytes:
      22 +
      entries.reduce(
        (total, entry) => total + entry.size + 76 + 2 * new TextEncoder().encode(entry.path).length,
        0
      ),
    expandedBytes,
    manifestBytes: entries.find((entry) => entry.path === "manifest.json")?.size ?? 0,
    entries: entries.length,
  };
}
