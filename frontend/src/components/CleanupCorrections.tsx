import { type ReactNode } from "react";
import { Minus, Plus, RotateCcw, RotateCw } from "lucide-react";
import {
  hasCrop,
  type CleanupOptions,
  type Corrections,
  type ScanAnalysis,
} from "../core/scanAnalysis";
import { type ScanSupport } from "../core/scanCleanup";

/**
 * One card per correction: what analysis found on the sample page, a switch,
 * and a fine-tuning control. Values describe the sample page's result.
 */
export function CleanupCorrections({
  analysis,
  page,
  enabled,
  setEnabled,
  values,
  edit,
  support,
}: {
  analysis: ScanAnalysis;
  page: number;
  enabled: Corrections;
  setEnabled: (enabled: Corrections) => void;
  values: CleanupOptions;
  edit: (patch: Partial<CleanupOptions>) => void;
  support: ScanSupport | undefined;
}) {
  const toggle = (key: keyof Corrections) => (on: boolean) => setEnabled({ ...enabled, [key]: on });
  return (
    <div className="corrections" aria-label={`Corrections found on page ${page}`} role="group">
      {analysis.blank && <p className="field-note">Page {page} looks blank.</p>}
      {imageCorrections(analysis, page, values, edit).map((card) => (
        <Correction
          key={card.key}
          title={card.title}
          on={enabled[card.key]}
          toggle={toggle(card.key)}
          blocked={(card.key === "straighten" ? support?.straighten : support?.image) ?? ""}
          finding={card.finding}
        >
          <Stepper {...card.stepper} />
        </Correction>
      ))}
      <TrimCorrection
        analysis={analysis}
        on={enabled.trim}
        toggle={toggle("trim")}
        crop={values.crop}
      />
    </div>
  );
}

function imageCorrections(
  analysis: ScanAnalysis,
  page: number,
  values: CleanupOptions,
  edit: (patch: Partial<CleanupOptions>) => void
) {
  return [
    {
      key: "straighten" as const,
      title: "Straighten",
      finding: straightFinding(analysis, page),
      stepper: {
        label: "rotation",
        display: `${values.angle.toFixed(2)}°`,
        less: { label: "Rotate clockwise 0.1°", icon: RotateCw },
        more: { label: "Rotate counter-clockwise 0.1°", icon: RotateCcw },
        change: (direction: -1 | 1) =>
          edit({ angle: clamp(round(values.angle + direction * 0.1, 0.05), -10, 10) }),
      },
    },
    {
      key: "background" as const,
      title: "Whiten paper",
      finding: paperFinding(analysis),
      stepper: {
        label: "whitening",
        display: `${values.background}`,
        change: (direction: -1 | 1) =>
          edit({ background: clamp(values.background + direction * 5, 0, 100) }),
      },
    },
    {
      key: "contrast" as const,
      title: "Darken text",
      finding: inkFinding(analysis),
      stepper: {
        label: "contrast",
        display: `×${values.contrast.toFixed(2)}`,
        change: (direction: -1 | 1) =>
          edit({ contrast: clamp(round(values.contrast + direction * 0.1, 0.05), 0.5, 3) }),
      },
    },
  ];
}

function TrimCorrection({
  analysis,
  on,
  toggle,
  crop,
}: {
  analysis: ScanAnalysis;
  on: boolean;
  toggle: (on: boolean) => void;
  crop: CleanupOptions["crop"];
}) {
  return (
    <Correction
      title="Trim edges"
      on={on}
      toggle={toggle}
      blocked=""
      finding={trimFinding(analysis)}
    >
      <p className="field-note">
        {hasCrop(crop) ? `Trims ${cropText(crop)}` : "Nothing trimmed."} Drag the page edges in the
        preview to adjust. Trimming hides content; it does not redact it.
      </p>
    </Correction>
  );
}

function Correction({
  title,
  on,
  toggle,
  blocked,
  finding,
  children,
}: {
  title: string;
  on: boolean;
  toggle: (on: boolean) => void;
  blocked: string;
  finding: string;
  children: ReactNode;
}) {
  return (
    <div className={`correction ${on && !blocked ? "on" : ""}`}>
      <label className="correction-toggle">
        <input
          type="checkbox"
          role="switch"
          checked={on && !blocked}
          disabled={!!blocked}
          onChange={(event) => toggle(event.target.checked)}
        />
        <span>{title}</span>
      </label>
      <p className="correction-finding">{blocked ? `Unavailable: ${blocked}` : finding}</p>
      {on && !blocked && children}
    </div>
  );
}

function Stepper({
  label,
  display,
  change,
  less = { label: `Less ${label}`, icon: Minus },
  more = { label: `More ${label}`, icon: Plus },
}: {
  label: string;
  display: string;
  change: (direction: -1 | 1) => void;
  less?: { label: string; icon: typeof Minus };
  more?: { label: string; icon: typeof Minus };
}) {
  return (
    <div className="stepper">
      <button
        type="button"
        className="icon-button"
        aria-label={less.label}
        onClick={() => change(-1)}
      >
        <less.icon size={15} aria-hidden="true" />
      </button>
      <output aria-label={label}>{display}</output>
      <button
        type="button"
        className="icon-button"
        aria-label={more.label}
        onClick={() => change(1)}
      >
        <more.icon size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const round = (value: number, step: number) => Math.round(value / step) * step;
const percent = (level: number) => Math.round((level / 255) * 100);

function straightFinding(analysis: ScanAnalysis, page: number) {
  if (analysis.angle === null)
    return analysis.photo
      ? "Mostly picture content; no text lines to measure tilt."
      : "No text lines to measure tilt.";
  if (!analysis.angle) return `Page ${page} is already straight.`;
  // A counter-clockwise correction means the scan leans clockwise.
  const direction = analysis.angle > 0 ? "clockwise" : "counter-clockwise";
  return `Tilted ${Math.abs(analysis.angle).toFixed(2)}° ${direction}.`;
}
function paperFinding(analysis: ScanAnalysis) {
  if (analysis.photo) return "Photo or shading found; whitening is left off to keep its tones.";
  if (!analysis.backgroundAlone) return "Paper is already white.";
  const paper = `Paper is ${percent(analysis.paper)}% bright`;
  return analysis.background
    ? `${paper} with visible grain or tint.`
    : `${paper}; darkening the text whitens it too.`;
}
function inkFinding(analysis: ScanAnalysis) {
  if (analysis.blank) return "No text found.";
  if (analysis.contrast === 1) return "Text is already dark.";
  return `Text is faded (${100 - percent(analysis.ink)}% dark).`;
}
function trimFinding(analysis: ScanAnalysis) {
  if (!hasCrop(analysis.crop)) return "No dark scanner edges found.";
  const sides = (Object.keys(analysis.crop) as (keyof typeof analysis.crop)[]).filter(
    (side) => analysis.crop[side] > 0
  );
  return `Dark scanner edge along the ${sides.join(", ")} side.`;
}
const cropText = (crop: CleanupOptions["crop"]) =>
  (Object.entries(crop) as [string, number][])
    .filter(([, value]) => value > 0)
    .map(([side, value]) => `${side} ${value} pt`)
    .join(", ") + ".";
