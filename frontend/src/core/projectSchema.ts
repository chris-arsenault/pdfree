import { z } from "zod";
import { editorLimits } from "./editorValidation";
const number = z.number().finite().min(-100_000).max(100_000);
const point = z.object({ x: number, y: number });
const fieldKind = z.enum(["text", "checkbox", "radio", "dropdown", "list"]);
const id = z.string().min(1).max(200);
const text = z.string().max(100_000);
export const placedObjectSchema = z.object({
  id,
  kind: z.enum([
    "text",
    "check",
    "cross",
    "image",
    "stamp",
    "ink",
    "highlight",
    "rectangle",
    "line",
    "arrow",
    "field",
  ]),
  x: number,
  y: number,
  width: number.positive(),
  height: number.positive(),
  rotation: number,
  text,
  fontSize: z.number().min(1).max(1000),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  opacity: z.number().min(0).max(1),
  align: z.enum(["left", "center", "right"]),
  font: z.enum(["sans", "signature"]),
  assetId: z.string().max(200),
  points: z.array(point).max(100_000),
  strokeWidth: z.number().min(0.1).max(1000),
  fieldKind,
  fieldName: text,
  options: z.array(text).max(1000),
  required: z.boolean(),
});
export const projectSchema = z
  .object({
    version: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    allowDecryptedDrafts: z.boolean().default(false),
    name: z
      .string()
      .min(1)
      .max(editorLimits.name)
      .refine((name) => Boolean(name.trim()), "Give the document a name."),
    sources: z
      .array(
        z
          .object({
            id,
            name: text,
            path: z.string().regex(/^sources\/\d+\.pdf$/),
            workingPath: z
              .string()
              .regex(/^working\/\d+\.pdf$/)
              .optional(),
            encryption: z
              .object({
                algorithm: z.enum(["RC4-40", "RC4-128", "AES-128", "AES-256"]),
                revision: z.number().int().min(2).max(6),
                authenticatedAs: z.enum(["user", "owner", "recipient"]),
              })
              .optional(),
          })
          .refine(
            (source) => !!source.workingPath === !!source.encryption,
            "Encrypted sources need working bytes and encryption metadata."
          )
      )
      .max(1000),
    assets: z
      .array(
        z.object({
          id,
          name: text,
          path: z.string().regex(/^assets\/\d+\.(png|jpg)$/),
          mime: z.enum(["image/png", "image/jpeg"]),
        })
      )
      .max(1000),
    pages: z
      .array(
        z.object({
          id,
          sourceId: z.string().max(200),
          sourceIndex: z.number().int().nonnegative(),
          rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
          box: z.object({
            x: number,
            y: number,
            width: number.positive(),
            height: number.positive(),
          }),
          objects: z.array(placedObjectSchema).max(10_000),
          comments: z
            .array(
              z.object({
                id,
                annotationIndex: z.number().int().nonnegative().nullable(),
                parentId: id.nullable(),
                x: number,
                y: number,
                width: number.nonnegative(),
                height: number.nonnegative(),
                text,
                author: z.string().max(200),
                createdAt: z.string().max(100),
                modifiedAt: z.string().max(100),
                readOnly: z.boolean(),
              })
            )
            .max(10_000)
            .optional(),
        })
      )
      .min(1)
      .max(10_000),
    values: z.record(z.string(), z.union([text, z.array(text).max(1000), z.boolean()])),
  })
  .refine(
    (manifest) => manifest.version >= 2 || manifest.sources.every((source) => !source.workingPath),
    "Encrypted sources require project version 2 or newer."
  )
  .refine(
    (manifest) => manifest.version < 3 || manifest.pages.every((page) => !!page.comments),
    "Version 3 projects require comment records."
  );
