import { text as tr } from "../i18n/runtime";
import {
  CalendarDays,
  CaseUpper,
  Check,
  Highlighter,
  Image,
  Minus,
  MousePointer2,
  MessageSquarePlus,
  MoveUpRight,
  Pencil,
  PenLine,
  ScanLine,
  ScanText,
  Square,
  Stamp,
  TextCursorInput,
  Type,
  X,
} from "lucide-react";

export const tools = [
  {
    id: "comment",
    get label() {
      return tr("common.comment");
    },
    icon: MessageSquarePlus,
    group: "annotate",
    get hint() {
      return tr("tools.commentHint");
    },
  },
  {
    id: "select",
    get label() {
      return tr("common.select");
    },
    icon: MousePointer2,
    group: "select",
    get hint() {
      return tr("tools.selectHint");
    },
  },
  {
    id: "text",
    get label() {
      return tr("common.text");
    },
    icon: Type,
    group: "fill",
    get hint() {
      return tr("tools.textHint");
    },
  },
  {
    id: "check",
    get label() {
      return tr("common.check");
    },
    icon: Check,
    group: "fill",
    get hint() {
      return tr("tools.checkHint");
    },
  },
  {
    id: "cross",
    get label() {
      return tr("common.cross");
    },
    icon: X,
    group: "fill",
    get hint() {
      return tr("tools.crossHint");
    },
  },
  {
    id: "date",
    get label() {
      return tr("common.date");
    },
    icon: CalendarDays,
    group: "fill",
    get hint() {
      return tr("tools.dateHint");
    },
  },
  {
    id: "signature",
    get label() {
      return tr("common.sign");
    },
    icon: PenLine,
    group: "sign",
    get hint() {
      return tr("tools.signHint");
    },
  },
  {
    id: "initials",
    get label() {
      return tr("common.initials");
    },
    icon: CaseUpper,
    group: "sign",
    get hint() {
      return tr("tools.initialsHint");
    },
  },
  {
    id: "image",
    get label() {
      return tr("common.image");
    },
    icon: Image,
    group: "annotate",
    get hint() {
      return tr("image.placeHint");
    },
  },
  {
    id: "highlight",
    get label() {
      return tr("common.highlight");
    },
    icon: Highlighter,
    group: "annotate",
    get hint() {
      return tr("tools.highlightHint");
    },
  },
  {
    id: "ink",
    get label() {
      return tr("common.draw");
    },
    icon: Pencil,
    group: "annotate",
    get hint() {
      return tr("tools.drawHint");
    },
  },
  {
    id: "rectangle",
    get label() {
      return tr("common.box");
    },
    icon: Square,
    group: "annotate",
    get hint() {
      return tr("tools.boxHint");
    },
  },
  {
    id: "line",
    get label() {
      return tr("common.line");
    },
    icon: Minus,
    group: "annotate",
    get hint() {
      return tr("tools.lineHint");
    },
  },
  {
    id: "arrow",
    get label() {
      return tr("common.arrow");
    },
    icon: MoveUpRight,
    group: "annotate",
    get hint() {
      return tr("tools.arrowHint");
    },
  },
  {
    id: "stamp",
    get label() {
      return tr("common.stamp");
    },
    icon: Stamp,
    group: "annotate",
    get hint() {
      return tr("tools.stampHint");
    },
  },
  {
    id: "field",
    get label() {
      return tr("common.formField");
    },
    icon: TextCursorInput,
    group: "field",
    get hint() {
      return tr("tools.fieldHint");
    },
  },
] as const;

/** Whole-page scan processing, shown beside the placement tools so scans are easy to fix. */
export const scanTools = [
  {
    dialog: "ocr",
    get label() {
      return tr("scan.recognize");
    },
    icon: ScanText,
    get hint() {
      return tr("tools.recognizeHint");
    },
  },
  {
    dialog: "cleanup",
    get label() {
      return tr("cleanup.title");
    },
    icon: ScanLine,
    get hint() {
      return tr("tools.cleanupHint");
    },
  },
] as const;
