import { type Page } from "playwright";

export type SplitMeasurement = { workerSplitMs: number; browserTicks: number; maxGapMs: number };

// Measure only the actual worker request/response interval, including postMessage cloning.
// The optional stall is a negative control: the probe must detect main-thread blockage.
export async function installSplitProbe(page: Page, stallMs = 0) {
  await page.evaluate((stall) => {
    const original = Worker.prototype.postMessage;
    let timer = 0,
      started = 0,
      last = 0,
      ticks = 0,
      gap = 0;
    let unwatch = () => {};
    const finish = () => {
      const ended = performance.now();
      window.clearInterval(timer);
      Reflect.set(window, "pdfreeSplitMeasurement", {
        workerSplitMs: ended - started,
        browserTicks: ticks,
        maxGapMs: Math.max(gap, ended - last),
      });
    };
    Worker.prototype.postMessage = function (message: unknown, ...options: unknown[]) {
      if (message && typeof message === "object" && Reflect.get(message, "kind") === "split") {
        const id = Reflect.get(message, "id");
        started = performance.now();
        last = started;
        const listener = (event: MessageEvent) => {
          if (event.data.id === id) finish();
        };
        this.addEventListener("message", listener);
        unwatch = () => this.removeEventListener("message", listener);
        timer = window.setInterval(() => {
          const now = performance.now();
          gap = Math.max(gap, now - last);
          last = now;
          ticks++;
        }, 50);
        while (performance.now() - started < stall) {
          /* synthetic negative control */
        }
      }
      Reflect.apply(original, this, [message, ...options]);
    };
    Reflect.set(window, "pdfreeSplitMeasurement", null);
    Reflect.set(window, "pdfreeRestoreSplitProbe", () => {
      Worker.prototype.postMessage = original;
      window.clearInterval(timer);
      unwatch();
    });
  }, stallMs);
}

export async function readSplitProbe(page: Page): Promise<SplitMeasurement> {
  const result = await page.evaluate(() => Reflect.get(window, "pdfreeSplitMeasurement"));
  if (!result) throw new Error("The split worker has not completed a measured request.");
  return result as SplitMeasurement;
}

export async function restoreSplitProbe(page: Page) {
  await page.evaluate(() => {
    Reflect.get(window, "pdfreeRestoreSplitProbe")();
    Reflect.deleteProperty(window, "pdfreeRestoreSplitProbe");
    Reflect.deleteProperty(window, "pdfreeSplitMeasurement");
  });
}
