import { beforeEach, expect, it, vi } from "vitest";
import { createSplitArchive } from "./split";
import { runPdfWorker } from "./workerClient";
import { fontData } from "./resources";
import { emptyDocument } from "../core/model";
vi.mock("./workerClient", () => ({ runPdfWorker: vi.fn() }));
vi.mock("./resources", () => ({ fontData: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

it("sends one complete split request instead of cloning sources per output", async () => {
  const document = emptyDocument(),
    groups = [[1], [2], [3]],
    fonts = { sans: new Uint8Array([1]), signature: new Uint8Array([2]) },
    output = new Uint8Array([3]);
  vi.mocked(fontData).mockResolvedValue(fonts);
  vi.mocked(runPdfWorker).mockResolvedValue(output);
  expect(await createSplitArchive(document, groups, "split.pdf", true)).toBe(output);
  expect(runPdfWorker).toHaveBeenCalledTimes(1);
  expect(runPdfWorker).toHaveBeenCalledWith({
    kind: "split",
    document,
    groups,
    name: "split.pdf",
    flatten: true,
    fonts,
  });
});

it("does not start PDF processing when bundled fonts cannot load", async () => {
  vi.mocked(fontData).mockRejectedValue(new Error("font unavailable"));
  await expect(createSplitArchive(emptyDocument(), [[1]], "split", false)).rejects.toThrow(
    "font unavailable"
  );
  expect(runPdfWorker).not.toHaveBeenCalled();
});

it("propagates worker export errors without producing an empty archive", async () => {
  vi.mocked(fontData).mockResolvedValue({ sans: new Uint8Array(), signature: new Uint8Array() });
  vi.mocked(runPdfWorker).mockRejectedValue(new Error("unsupported structure"));
  await expect(createSplitArchive(emptyDocument(), [[1]], "split", false)).rejects.toThrow(
    "unsupported structure"
  );
});
