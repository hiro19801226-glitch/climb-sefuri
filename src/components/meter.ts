import { BASELINE_MINUTES } from "../data/tiers";
import { secondsToClock } from "../firebase/time";

const BASELINE_SECONDS = BASELINE_MINUTES * 60;

/**
 * 65:00（起点）→ target への到達度をパーセントで返す（v2 静的カードの実測値から逆算した式）。
 * now が未入力（=baseline）なら 0%。
 */
export function computeMeterWidth(nowSeconds: number, targetSeconds: number): number {
  if (targetSeconds >= BASELINE_SECONDS) return 0;
  const pct = ((BASELINE_SECONDS - nowSeconds) / (BASELINE_SECONDS - targetSeconds)) * 100;
  return Math.min(100, Math.max(0, pct));
}

export function meterMarkup(opts: {
  nowSeconds: number | null;
  targetSeconds: number;
  ariaLabel: string;
}): string {
  const { nowSeconds, targetSeconds, ariaLabel } = opts;
  const width = nowSeconds == null ? 0 : computeMeterWidth(nowSeconds, targetSeconds);
  const nowLabel = nowSeconds == null ? "─" : secondsToClock(nowSeconds);
  const targetLabel = secondsToClock(targetSeconds);
  return `
    <div class="times">
      <div><div class="l">Now</div><div class="v num">${nowLabel}</div></div>
      <div class="arrow">→</div>
      <div class="goal"><div class="l">Target</div><div class="v num">${targetLabel}</div></div>
    </div>
    <div class="meter" role="img" aria-label="${ariaLabel}"><i style="--w:${width}%;"></i></div>
    <div class="meter-note"><span>${BASELINE_MINUTES}:00</span><span>${targetLabel}</span></div>
  `;
}
