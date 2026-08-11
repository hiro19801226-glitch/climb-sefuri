/** 日付・文字列の共通ユーティリティ（カレンダー／ホームの近日予定で共有） */

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function isoOf(year: number, month0: number, day: number): string {
  return `${year}-${pad(month0 + 1)}-${pad(day)}`;
}

/** 今日の YYYY-MM-DD（ローカル） */
export function todayISO(): string {
  const d = new Date();
  return isoOf(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "YYYY-MM-DD" → "M/D(曜)" */
export function formatEventDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${m}/${d}(${wd})`;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

const SITE_URL = "https://climb-sefuri.vercel.app";

/**
 * LINEの共有インテントURL。送信先のトークルームはユーザー自身が共有シートから選ぶため、
 * グループの招待リンクをコードに埋め込む必要がない（公開サイトのソースに招待リンクを
 * 含めると誰でもグループへ参加できてしまうため、意図的にこの方式にしている）。
 */
export function lineShareUrl(date: string, title: string, note: string | null): string {
  const lines = [`📅 ${formatEventDate(date)} ${title}`];
  if (note) lines.push(note);
  lines.push(`${SITE_URL}/#calendar`);
  return `https://line.me/R/msg/text/?${encodeURIComponent(lines.join("\n"))}`;
}
