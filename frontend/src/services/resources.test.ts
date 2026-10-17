import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { emptyDocument, defaultObject, type Page } from "../core/model";
beforeEach(() => {
  vi.resetModules();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

it("preserves the default font set and shares successful fonts with the optional smaller set", async () => {
  const fetch = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])));
  vi.stubGlobal("fetch", fetch);
  const { fontData } = await import("./resources");
  const plain = await fontData({ signature: false });
  expect(plain.signature).toBeNull();
  expect(fetch).toHaveBeenCalledTimes(1);
  const full = await fontData();
  expect(full.signature).toEqual(new Uint8Array([1, 2, 3]));
  expect(full.sans).toBe(plain.sans);
  expect(await fontData()).toBe(full);
  expect(await fontData({ signature: false })).toBe(plain);
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("retries a failed signature resource without downloading the successful sans font again", async () => {
  let fail = true;
  const fetch = vi.fn(async (url: string) => {
    if (url.includes("caveat") && fail) {
      fail = false;
      return new Response(null, { status: 503 });
    }
    return new Response(new Uint8Array([1]));
  });
  vi.stubGlobal("fetch", fetch);
  const { fontData } = await import("./resources");
  await expect(fontData()).rejects.toMatchObject({ ui: { key: "errors.bundledFont" } });
  expect((await fontData()).signature).toEqual(new Uint8Array([1]));
  expect(fetch.mock.calls.filter(([url]) => url.includes("NotoSans"))).toHaveLength(1);
  expect(fetch.mock.calls.filter(([url]) => url.includes("caveat"))).toHaveLength(2);
});
it("determines signature demand from exported objects and page scope", async () => {
  const { documentFontOptions } = await import("./resources");
  const page = (id: string, signature: boolean): Page => ({
    id,
    sourceId: "",
    sourceIndex: 0,
    box: { x: 0, y: 0, width: 612, height: 792 },
    rotation: 0,
    comments: [],
    objects: [
      { ...defaultObject("text", { x: 20, y: 20 }), font: signature ? "signature" : "sans" },
    ],
  });
  const document = { ...emptyDocument(), pages: [page("plain", false), page("signed", true)] };
  expect(documentFontOptions(document)).toEqual({ signature: true });
  expect(documentFontOptions(document, ["plain"])).toEqual({ signature: false });
  expect(documentFontOptions(document, ["signed"])).toEqual({ signature: true });
  document.pages[1].objects[0].kind = "image";
  expect(documentFontOptions(document)).toEqual({ signature: false });
});
