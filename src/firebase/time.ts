/**
 * 入力仕様: 分.秒（例: 52分30秒 → "52.30"）。
 * ソートや比較のため内部では総秒数に変換して評価する。
 */
export function mmssToSeconds(value: string | null | undefined): number | null {
  if (value == null || value.trim() === "") return null;
  const [mmStr, ssStr = "0"] = value.trim().split(".");
  const minutes = Number(mmStr);
  const seconds = Number(ssStr);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  return minutes * 60 + seconds;
}

export function secondsToClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function mmssToClock(value: string | null | undefined): string {
  const seconds = mmssToSeconds(value);
  return seconds == null ? "─" : secondsToClock(seconds);
}
