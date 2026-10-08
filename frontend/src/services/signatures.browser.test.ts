import { beforeEach, afterEach, expect, it } from "vitest";
import {
  clearSignatures,
  rememberSignature,
  removeSignature,
  savedSignatures,
  type SavedSignature,
} from "./signatures";

const signature = (id: string): SavedSignature => ({
  id,
  label: id,
  object: { kind: "text", text: id, font: "signature" },
  asset: null,
});
beforeEach(() => clearSignatures());
afterEach(() => clearSignatures());

it("retains every signature from concurrent IndexedDB saves", async () => {
  const ids = Array.from({ length: 12 }, (_, index) => `Signature ${index}`);
  await Promise.all(ids.map((id) => rememberSignature(signature(id))));
  expect((await savedSignatures()).map((item) => item.id).sort()).toEqual([...ids].sort());
});

it("does not let a concurrent removal overwrite another signature addition", async () => {
  await rememberSignature(signature("Alice"));
  await Promise.all([rememberSignature(signature("Bob")), removeSignature("Alice")]);
  expect((await savedSignatures()).map((item) => item.id)).toEqual(["Bob"]);
});
