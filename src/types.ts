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

/** 参加者の自己申告タイム記録（members/{id}/records に保存） */
export interface RecordItem {
  id: string;
  /** YYYY-MM-DD（走った日） */
  date: string;
  /** mm.ss 形式のタイム */
  time: string;
  note: string | null;
  at: number;
}

export interface Member extends MemberRecord {
  id: string;
  /** タイム記録の履歴（新しい日付順） */
  records: RecordItem[];
}

/** カレンダーの予定（Firebase Realtime Database に保存） */
export interface EventRecord {
  /** YYYY-MM-DD（ローカル日付） */
  date: string;
  title: string;
  note: string | null;
  updatedAt: number;
}

/** 予定への参加表明者 */
export interface Attendee {
  id: string;
  name: string;
  at: number;
}

export interface CalEvent extends EventRecord {
  id: string;
  attendees: Attendee[];
}
