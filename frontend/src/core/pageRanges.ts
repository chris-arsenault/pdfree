export function parsePageRange(input: string, count: number): number[] {
  const tokens = input.toLowerCase().replace(/\s+/g, "").split(",");
  const result: number[] = [];
  for (const token of tokens) {
    if (token === "odd" || token === "even") {
      for (let page = token === "odd" ? 1 : 2; page <= count; page += 2) result.push(page);
    } else result.push(...numericRange(token, count));
  }
  if (new Set(result).size !== result.length)
    throw new Error("A page appears more than once in this output range.");
  if (!result.length) throw new Error("Choose at least one page.");
  return result;
}
function numericRange(token: string, count: number) {
  const match = /^(\d+)(?:-(\d+|end))?$/.exec(token);
  if (!match) throw new Error(`Invalid page range: ${token || "empty"}. Use 1-3, 5, or 7-end.`);
  const start = Number(match[1]),
    end = match[2] === "end" ? count : Number(match[2] ?? match[1]);
  if (start < 1 || end > count || end < start)
    throw new Error(`Page range ${token} must be between 1 and ${count}.`);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
function boundariesFor(mode: SplitMode, input: string, count: number) {
  if (mode === "after") return parsePageRange(input, count).sort((a, b) => a - b);
  const size = Number(input);
  if (!Number.isInteger(size) || size < 1 || size > count)
    throw new Error(`Enter a whole number from 1 to ${count}.`);
  const boundaries: number[] = [];
  for (let index = size; index < count; index += size) boundaries.push(index);
  return boundaries;
}
export type SplitMode = "after" | "every" | "ranges" | "individual";
export function splitGroups(mode: SplitMode, input: string, count: number): number[][] {
  if (!count) throw new Error("Open a PDF first.");
  if (mode === "ranges") return input.split(";").map((group) => parsePageRange(group, count));
  if (mode === "individual") return Array.from({ length: count }, (_, i) => [i + 1]);
  const boundaries = boundariesFor(mode, input, count);
  if (boundaries.at(-1) !== count) boundaries.push(count);
  let previous = 0;
  return boundaries
    .map((end) => {
      const group = Array.from({ length: end - previous }, (_, i) => previous + i + 1);
      previous = end;
      return group;
    })
    .filter((group) => group.length);
}
export function outputName(name: string, index: number) {
  return `${name.replace(/\.(pdf|pdfree)$/i, "").replace(/[^\p{L}\p{N}_ -]/gu, "_") || "document"}-${String(index + 1).padStart(2, "0")}.pdf`;
}
