export type TierId = "iron" | "bronze" | "silver" | "gold" | "platinum" | "titan";

export interface Tier {
  id: TierId;
  jp: string;
  en: string;
  /** この分数を切ると当該ティア獲得（分） */
  subMinutes: number;
  flavor: string;
  gradient: string;
  dark: string;
}

/** result 未入力、または iron の基準(65分)にも届かなかった場合の判定ラベル */
export type TierJudgement = TierId | "finisher" | "none";

/** Firebase Realtime Database に保存する形（mm.ss 形式の文字列で入出力） */
export interface MemberRecord {
  name: string;
  target: string;
  result: string | null;
  updatedAt: number;
}

export interface Member extends MemberRecord {
  id: string;
}
