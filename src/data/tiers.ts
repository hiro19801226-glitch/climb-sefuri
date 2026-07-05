import tiersData from "./tiers.json";
import type { Tier, TierJudgement } from "../types";

export const tiers: Tier[] = tiersData as Tier[];

/** 称号システムの起点タイム（分）。メーターの基準値として使う */
export const BASELINE_MINUTES = 65;

/** タイアーは subMinutes 昇順（=タイムが厳しい順）で並べておく */
const orderedTiers = [...tiers].sort((a, b) => a.subMinutes - b.subMinutes);

/**
 * result（総秒数）から称号を判定する。
 * gemini-code-1783220486502.md の閾値定義に準拠:
 *   未入力 → none / 65分以上 → finisher / それ以外は該当ティア
 */
export function judgeTier(resultSeconds: number | null): TierJudgement {
  if (resultSeconds == null) return "none";
  for (const tier of orderedTiers) {
    if (resultSeconds < tier.subMinutes * 60) return tier.id;
  }
  return "finisher";
}

export function tierLabel(judgement: TierJudgement): string {
  if (judgement === "none") return "未達成";
  if (judgement === "finisher") return "完走";
  const tier = tiers.find((t) => t.id === judgement);
  return tier ? tier.jp : judgement;
}
