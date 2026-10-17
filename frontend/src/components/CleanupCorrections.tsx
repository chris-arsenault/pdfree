import { renderMessage } from "../i18n/runtime";
import { formatList, formatNumber } from "../i18n/format";
import { type UiMessage } from "../i18n/messages";
import { text as tr } from "../i18n/runtime";
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
    <div
      className="corrections"
      aria-label={tr("cleanup.correctionsPage", { number: page })}
      role="group"
    >
      {analysis.blank && <p className="field-note">{tr("cleanup.blankPage", { number: page })}</p>}
      {imageCorrections(analysis, page, values, edit).map((card) => (
        <Correction
          key={card.key}
          title={card.title}
          on={enabled[card.key]}
          toggle={toggle(card.key)}
          blocked={(card.key === "straighten" ? support?.straighten : support?.image) ?? null}
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
      title: tr("cleanup.straighten"),
      finding: straightFinding(analysis, page),
      stepper: {
        label: tr("cleanup.rotation"),
        display: `${formatNumber(values.angle, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}°`,
        less: { label: tr("cleanup.rotateClockwise"), icon: RotateCw },
        more: { label: tr("cleanup.rotateCounterclockwise"), icon: RotateCcw },
        change: (direction: -1 | 1) =>
          edit({ angle: clamp(round(values.angle + direction * 0.1, 0.05), -10, 10) }),
      },
    },
    {
      key: "background" as const,
      title: tr("cleanup.whiten"),
      finding: paperFinding(analysis),
      stepper: {
        label: tr("cleanup.whitening"),
        display: formatNumber(values.background),
        change: (direction: -1 | 1) =>
          edit({ background: clamp(values.background + direction * 5, 0, 100) }),
      },
    },
    {
      key: "contrast" as const,
      title: tr("cleanup.darken"),
      finding: inkFinding(analysis),
      stepper: {
        label: tr("cleanup.contrast"),
        display: `×${formatNumber(values.contrast, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
      title={tr("cleanup.trim")}
      on={on}
      toggle={toggle}
      blocked={null}
      finding={trimFinding(analysis)}
    >
      <p className="field-note">
        {hasCrop(crop) ? tr("cleanup.trims", { sides: cropText(crop) }) : tr("cleanup.noTrim")}{" "}
        {tr("cleanup.trimHint")}
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
  blocked: UiMessage | null;
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
      <p className="correction-finding">
        {blocked ? tr("cleanup.unavailableReason", { reason: renderMessage(blocked) }) : finding}
      </p>
      {on && !blocked && children}
    </div>
  );
}

function Stepper({
  label,
  display,
  change,
  less = { label: tr("cleanup.less", { label }), icon: Minus },
  more = { label: tr("cleanup.more", { label }), icon: Plus },
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
    return analysis.photo ? tr("cleanup.photoTilt") : tr("cleanup.noTiltLines");
  if (!analysis.angle) return tr("cleanup.alreadyStraight", { number: page });
  // A counter-clockwise correction means the scan leans clockwise.
  return tr(analysis.angle > 0 ? "cleanup.tiltClockwise" : "cleanup.tiltCounterclockwise", {
    angle: formatNumber(Math.abs(analysis.angle), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  });
}
function paperFinding(analysis: ScanAnalysis) {
  if (analysis.photo) return tr("cleanup.photoWhitening");
  if (!analysis.backgroundAlone) return tr("cleanup.whitePaper");
  return tr(analysis.background ? "cleanup.paperGrain" : "cleanup.paperDarkening", {
    percent: percent(analysis.paper),
  });
}
function inkFinding(analysis: ScanAnalysis) {
  if (analysis.blank) return tr("cleanup.noText");
  if (analysis.contrast === 1) return tr("cleanup.darkText");
  return tr("cleanup.faded", { percent: 100 - percent(analysis.ink) });
}
function trimFinding(analysis: ScanAnalysis) {
  if (!hasCrop(analysis.crop)) return tr("cleanup.noEdges");
  const sides = (Object.keys(analysis.crop) as (keyof typeof analysis.crop)[]).filter(
    (side) => analysis.crop[side] > 0
  );
  return tr("cleanup.darkEdges", { sides: formatList(sides.map((side) => tr(`sides.${side}`))) });
}
const cropText = (crop: CleanupOptions["crop"]) =>
  formatList(
    (Object.entries(crop) as [keyof typeof crop, number][])
      .filter(([, value]) => value > 0)
      .map(([side, value]) =>
        tr("cleanup.sidePoints", { side: tr(`sides.${side}`), points: value })
      )
  );
